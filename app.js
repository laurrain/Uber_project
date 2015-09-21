'use strict';

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    exphbs  = require('express-handlebars'),
    mysql = require('mysql'), 
    myConnection = require('express-myconnection'),  
    session = require('express-session'),
    route = require('./routes/route')
    
var user = {};

var dbOptions = {
      host: 'localhost',
      user: 'root',
      password: '42926238',
      port: 3306,
      database: 'uber_Driver'
};

app.engine("handlebars", exphbs({defaultLayout:"main"}))
app.set("view engine", "handlebars")

app.use("/static", express.static("views"))
app.use(express.static('public'));
app.use("/static", express.static("."))

//setup middleware
app.use(myConnection(mysql, dbOptions, 'single'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
app.use(session({secret: "yada yada", saveUninitialized : false, resave: true, cookie : {maxAge : 5*60000}}));

app.get("/", route.checkUser, function(req, res){  

  res.render("home",{administrator : administrator});
})

app.get("/login", function(req, res){
  res.render("login", {layout : false});
})

app.post('/login',route.authDriver)

app.get("/logout", function(req, res){
  delete req.session.user;
  res.redirect('/login');
});

app.get("/signup", function(req,res){
  res.render('signup', {data:route, layout: false})
})
app.post('/signup', route.signup)


app.get('/driver_handler', function(req, res){
  res.render('driver_handler', {data:route, layout: false})
});

app.get('/index', function(req, res){
  res.render('index', {data: route, layout: false, username : req.session.user})
  console.log("voila...")
//var username = req.session.user;
var usernames = {};
var drivers_waiting = [];
var conversations = {};

io.on('connection', function(socket){
  console.log('a user connected');
  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function(data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.emit('updatechat', socket.username, data);
  });
  socket.emit('connected',socket.username);
    socket.on('disconnect', function(msg){
      console.log('user disconnected');
      socket.emit('disconnected');
  });

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', function(username){
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    // echo to client they've connected
    socket.emit('updatechat', 'SERVER', 'you have connected');
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
    // update the list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
  });

  socket.on('chat message', function(msg){
    console.log('message:'+username);
    io.emit('chat message'+username, msg)
  });
  socket.on('driver-waiting', function (message) {
    console.log('new driver waiting');
    drivers_waiting.push({name: message.driverName, sock: socket});
    console.log("driver-waiting"+drivers_waiting.length);
  });

  socket.on('agent-ready', function (message) {
    console.log('agent-ready');
    var driver = drivers_waiting.shift();
    conversations['agent-ready' + message.agentName] = driver.sock;
    conversations['driver-waiting' + driver.name] = socket;
    console.log("driver-waiting"+drivers_waiting.length);
    console.log("conversations"+conversations);
  });

  socket.on('query message', function(msg){
    console.log('message: ');
    io.emit('query message', msg.message);
  });

  socket.on('how many drivers', function(msg){
    console.log('message: ');
    socket.emit('how many drivers', drivers_waiting.length);
  });

});
});


app.get('/add_appointment', function(req, res){
  res.render('add_appointment', {layout: false})
})

app.post('/Appointment/email_And_Comment', route.email_And_Rating);

app.get('/add_rating', function(req, res){
  res.render('add_rating', {layout: false})
})

app.post('/Appointment/email_And_Comment', route.email_And_Comment);
  


app.get("/*", function(req, res){  

  res.render("home");
})

var port = process.env.PORT || 5000;

var server = http.listen(port, function(){

  console.log("server is running on " + server.address().address + ":" +server.address().port)

})