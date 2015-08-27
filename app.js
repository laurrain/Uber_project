'use strict';

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    exphbs  = require('express-handlebars'),
    mysql = require('mysql'), 
   // myConnection = require('express-myconnection'),  
    session = require('express-session'),
    route = require('./routes/route')
    
var user = {};

/*var dbOptions = {
      host: 'localhost',
      user: 'root',
      password: '42926238',
      port: 3306,
      database: 'uber_Driver'
};*/

app.engine("handlebars", exphbs({defaultLayout:"main"}))
app.set("view engine", "handlebars")

app.use("/static", express.static("views"))
app.use(express.static('public'));
app.use("/static", express.static("."))

//setup middleware
//app.use(myConnection(mysql, dbOptions, 'single'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
app.use(session({secret: "yada yada", saveUninitialized : false, resave: true, cookie : {maxAge : 5*60000}}));

app.get("/", function(req, res){  

  res.render("home",{layout: false});
})

app.get("/login", function(req, res){
  res.render("login", {layout : false});
})

app.post('/login', route.authDriver)

app.get("/logout", function(req, res){
  delete req.session.user;
  res.redirect('/login');
});

app.get("/signup", function(req,res){
  res.render('signup', {data:route, layout: false})
})
app.post('/signup', route.signup)

/*app.get('/driver_handler/:username', function(req, res){
  res.render('driver', username)
})*/

app.get('/index', function(req, res){
  res.render('index', {data: route, layout: false, username : req.session.user})
  console.log("voila...")

  io.on('connection', function(socket){
    console.log('a user connected'+ " " +req.session.user);
    socket.emit('connected');
      socket.on('disconnect', function(msg){
        console.log('user disconnected');
        socket.emit('disconnected');
    });
    socket.on('chat message', function(msg){
    console.log('message: ');
    io.emit('chat message',req.session.user+ " " +msg);
    });
  });
});
app.get('/appointment', function(req, res){
  res.render('appointment', {layout: false})
});

app.get('/agent', function(req, res){
  res.render('agent')
});

app.get('/home', function(req, res){
  //
  res.render('home');
});

app.get('/category_Issues', function(req, res){
  res.render('category_Issues');
});

app.get('/category_Issue', function(req, res){
  res.render('category_Issue');
});



app.get('/signup', function(req, res){
  res.render('signup');
});


/*
app.get("/*", function(req, res){  

  res.render("home");
})
*/
//var portNr = process.env.City_Coders_PORT || 3000;
//var port = process.env.PORT || 5000;

//app.listen(portNr, function(){
 // console.log("app started. port:3000")
//});



var port = process.env.CITY_CODERS_PORT || 5000;


//var server = http.listen(port, function(){

  //console.log("server is running on " + server.address().address + ":" +server.address().port)


//})


