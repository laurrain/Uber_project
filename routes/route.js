var bcrypt = require('bcrypt');
count = 0,
lock = false;
exports.authDriver = function(req, res, next){
	var userData = JSON.parse(JSON.stringify(req.body));
	var user = userData.username,
	    password = userData.password;

	req.getConnection(function(err, connection){
		      if(err) return next(err);
              //pass
		connection.query("SELECT * FROM Driver WHERE username = ?", [user], function(err, results){
        	  if (err){
                return next(err);
              } 
                
			if (results.length > 0){
			    
                var storedUser = results[0];
                console.log(storedUser);

				// Load password hash from DB
				bcrypt.compare(password, storedUser.password, function(err, passwordMatched){
    		// passwordMatched === true
                    console.log(passwordMatched)
    				if(passwordMatched == true && results[0].locked == false){
    					count = 0;
                        req.session.user = results[0].username
                        return res.redirect('home');
    				}else{
                        count++;
                        message = "user or password incorrect";
                        if(count == 3 || results[0].locked){
                              connection.query('UPDATE Driver SET locked = ? WHERE username = ?', [true,user], function(err, results) {
                                if (err) return next(err);
                            
                                msg = "Your account has been blocked! Wrong password supplied 3 times!";
                                return res.render("login", {
                                    message : msg,
                                    layout : false
                                });
                            });
                        }else{

                            return res.render("login", {
                                message : message+"Username or password incorrect!",
                                layout : false
                            });
                        }
                    }
                });
            }
            else{
                counter = 0
                return res.render("login", {
                    message : "Username doesn't exist!",
                    layout : false
                });
            }
        });
    });
}

exports.checkUser = function(req, res, next){

  if (req.session.user){
   // past_pages.push(req._parsedOriginalUrl.path)
     res.render("home")
    
  }else{
    // the user is not logged in redirect him to the login page-
    res.redirect('/login');
  }
};


exports.signup = function (req, res, next) {
    req.getConnection(function(err, connection){
        if (err){ 
            return next(err);
        }
        
        var input = JSON.parse(JSON.stringify(req.body));
        var data = {
                    username : input.username,
                    password : input.password
            };

			bcrypt.genSalt(10, function(err, salt) {
    		bcrypt.hash(input.password, salt, function(err, hash) {
        	// Store hash in your password DB.
        	if(err)return -1
        		data.password = hash;
            if(input.confirm_password == input.password){
        		connection.query('SELECT * FROM Driver WHERE username = ?', input.username, function(err, results1) {
                if (results1.length == 0){
                    connection.query('insert into Driver set ?', data, function(err, results) {
                            if (err)
                                    console.log("Error inserting : %s ",err );
                     
                            req.session.user = input.username;
                      
                            res.render('home');
                    });
                }
                else{
                    res.render("signup", {
                                            message : "Username alredy exists!",
                                            layout : false
                                            })
                }
            });
        }
        else{
            res.render("signup", {
                message : "Passwords don't match!",
                layout : false
            	})
           	};
        })	
        })
    });
}

exports.get_driver = function(req, res, next){
    var id = req.params.id;
    req.getConnection(function(err, connection){
        if(err)
            return next(err);

        connection.query("SELECT username FROM Driver WHERE username = ?", [id], function(err, data){
            if(err)
                console.log("[!] Error requesting driver data from database:\n\t%s", err);


            res.render("index",{username : data})
        })
    })
}

exports.email_And_Comment = function (req, res, next) {
    var data = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id;
    req.getConnection(function(err, connection){
        if (err){ 
            return next(err);//eFROM sales_history INNER JOIN purchase_history ON stock_item=item INNER JOIN product_sold ON product_name=item GROUP BY sales_history.stock_item ORDER BY profits DESC) AS prod_profits
        }
        console.log("----------------------------------------------------")
        connection.query('insert into Appointment set ?', data, function(err, results) {
            if (err) return next(err);
            var appointid = results.insertId;

        connection.query('select * from Appointment where appointment_id = ?', [appointid] , function(err, appointments) {
            if (err) return next(err);

            console.log(appointments);

                res.render( 'appointment', {
                    data : appointments[0]
                });

            });
            });
            
        });
    
};

exports.get_appointment = function(req, res, next){
    var data = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id;
    req.getConnection(function(err, connection){
        connection.query('SELECT date, email, comment, agent From Appointment INNER JOIN Agents ON id = agent', [1], function(err,rows){
            if(err){
                    console.log("Error Selecting : %s ",err );
            }
            res.render('edit_appointment',{page_title:"Edit appointment", data : rows, layout : false});      
        }); 
    });
};