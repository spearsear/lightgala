/*********************************
 *                               *
 *   LightGala Node Server App   *
 *                               *
 *                               *
 *      Stephen Spearsberg       *
 *                               *
 *********************************/

var express = require("express");
var path = require("path");
var http = require("http");
var favicon = require("static-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var jade = require("jade");
var ejs = require("ejs");
var session = require("express-session");
var passport = require("passport");
var qt   = require('quickthumb');

//routing module
var routes = require("./routes/index");
//var users = require("./routes/users");
var decor = require("./routes/decor");
var db = require("./db/api");    //mongoskin RESTful service
var db2 = require("./db/api2");  //mongoose
var config = require("./config.js");  //config settings

var app = express();

app.set("port",config.PORT);
app.set('port_https',config.PORT_HTTPS);
app.set('env',config.NODE_ENV);
//view engine setup
app.set("views",path.join(__dirname,'views'));
app.set("view engine",'jade');
app.engine(".jade",jade.__express);
app.engine(".html",ejs.renderFile);

//middleware
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(cookieParser());
app.use(session({secret: 'guzhia1gaya4deyaqiang'}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(express.static(path.join(__dirname,'public')));
app.use(qt.static(path.join(__dirname,'public')));
app.use(function(req,res,next){
    if(req.user){
	res.cookie('user',JSON.stringify(req.user));
    }
    next();
})
app.use(logger());

//routing
app.use('/',routes);
app.use('/decor',decor);
//app.use('/users',users);
app.use('/db',db);
app.use('/db2',db2);

//since wildcard * will match anything, need to put this route at very end
app.get('*',function(req,res){
    res.redirect('/#'+req.originalUrl);
})

//catch 404 and forwarding to error handler
app.use(function(req,res,next){
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//error handlers
//dev error handler will print stacktrace
if(app.get('env')==='development'){
    app.use(function(err,req,res,next){
	res.status(err.status || 500);
	//use jade template error.jade
	res.render('error',{
	//res.send(500,{
	    title: 'Oops, an error occurred',
	    message: err.message,
	    error: err
	});
    });
}

//production error handler, no stack trace leaked to user
app.use(function(err,req,res,next){
    res.status(err.status || 500);
    //use jade template error.jade
    res.render('error',{
    //res.send(500,{
	title: 'Oops, an error occurred',
	message: err.message,
	error: {}
    });    
})

module.exports = app;
