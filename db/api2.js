var config = require("../config.js");
var db_str = 'mongodb://'+config.DB_USER+':'+config.DB_PASS+'@'+config.DB_LINK+'/'+config.DB_NAME;
var host_str = config.HOST_STR;
var express = require('express');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var oauth = require("./oauth.js");  //oauth and openids
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var TwitterStrategy = require("passport-twitter").Strategy;
var AmazonStrategy = require("passport-amazon").Strategy;
var InstagramStrategy = require("passport-instagram").Strategy;
//var YahooStrategy = require('passport-yahoo-oauth').Strategy;
var YahooStrategy = require('passport-yahoo').Strategy;
var WindowsLiveStrategy = require('passport-windowslive').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var GithubStrategy = require("passport-github").Strategy;
var Auth0Strategy = require("passport-auth0");    //including many login like facebook/google/windowslive/amazon/instagram...
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
//var GoogleStrategy = require("passport-google").Strategy;
var myaccessctrl = require("./myaccessctrl.js");
var agenda = require("agenda")({db: {address: db_str}});
var sugar = require("sugar");
var nodemailer = require("nodemailer")
var router = express.Router();
var fs = require('fs');
require('./mongoose-paginate.js');

function base64_decode(dataURL, file) {
    // create buffer object from dataURL (result of readAsDataURL)
    // it is important to tell the constructor that the string is base64 encoded
    var base64str = dataURL.match(/,(.*)$/)[1];
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}

//====================db schema preparation for mongoose==================
//decorSchema is not strict so data not defined can be saved into db
var decorSchema = new mongoose.Schema({
    //_id: mongoose.Schema.ObjectId,   _id will be generated by mongodb, not a must have
    decor: {
	user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	designer: String,
	create_time: Date,
	last_mod_time: Date,
	address: {label: String, coords: {type: [Number], index:'2d'}, geo: {lat: Number, lng: Number}},
	tag: String,
	title: String,
	desc: String,
	publish: {type: Boolean, default: false},
	askpro: {type: Boolean, default: false},
	allowcomment: {type: Boolean, default: true},
	emailto: String,
	num_inches_per_x_unit: {type: Number},
	views: {type: Number, default: 0},
	/*tag: String,
	backgroundurl: String,
	user: [{
	    type: mongoose.Schema.Types.ObjectId, ref: 'User'
	}],
	decor_lines: [{
	    decor_line_id: Number,
	    decor_line_type: String,
	    elements: [{
		id: Number,
		color: String
	    }]
	}]*/
    },
    subscribers: [{
	type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    thumbs: {
	up: Number,
	down: Number
    }
},{strict: false});

//define customize methods
//decorSchema.methods.coords = function(){
//    return [this.address.geo.lng,this.address.geo.lat];
//}

var userSchema = new mongoose.Schema({
    //email: {type: String, unique: true},
    email: {type: String},
    password: String,
    oauthID: String,   //store oauth user info
    identifier: String,
    name: String,       //store displayname
    username: String,   //some oauth service like twitter has username
    fakemail: {type: Boolean, default: false},    //good email is retrieved from oauth, we form fake email if its not avail from oauth
    provider: String
});

userSchema.pre('save', function(next){
    var user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(10,function(err,salt){
	if (err) return next(err);
	bcrypt.hash(user.password,salt,function(err,hash){
	    if (err) return next(err);
	    user.password = hash;
	    next();
	})
    })
})

userSchema.methods.comparePassword = function(candidatePassword,cb){
    bcrypt.compare(candidatePassword,this.password,function(err, isMatch){
	if (err) return cb(err);
	cb(null,isMatch);
    })
}

var db = mongoose.connect(db_str,function(err){
    if(err){
	console.log('connection error',err);
    }else{
	console.log('connection successful');
    }
});
var User = db.model('User',userSchema);
var Decor = db.model('Decor',decorSchema,'decors');

//======================api to access decors collection==================
router.get('/api/decors',function(req,res,next){
    //console.log(req.query);
    var query = Decor.find();
    //one can throw a no_user_limit boolean true/false into req query object to bypass filter on user even if user logged in
    if(req.user && !eval(req.query.no_user_limit)){
	//show decors by sepcific user
	query.where({'decor.user_id': req.user._id});
    }else{
	query.where({'decor.publish': true});
    }
    //further refine query based on user entered filter
    if(req.query.criteria){
	if(req.query.criteria_type == 'has_keyword'){
	    query.or([{'decor.designer': new RegExp('.*'+req.query.criteria+'.*','i')},
		      {'decor.address.label': new RegExp('.*'+req.query.criteria+'.*','i')},
		      {'decor.tag': new RegExp('.*'+req.query.criteria+'.*','i')},
		      {'decor.title': new RegExp('.*'+req.query.criteria+'.*','i')}]
		    );
	}
	if(req.query.criteria_type == 'mongoose_query'){
	    //console.log("executing a mongoose query specified at client");
	    //sample mongoose_query criteria: 
	    //last modified within a week: .gt('decor.last_mod_time',(new Date()).setDate(from_time.getDate()-7))
	    //console.log('query'+unescape(req.query.criteria));
	    eval('query'+unescape(req.query.criteria));
	}
    }
    query.exec(function(err,decors){
	//base64decode backgroundurl to /img/backgrounds if it does not exist
	for(var i=0;i<decors.length;i++){
	    var filename = 'public/img/backgrounds/' + decors[i]._doc._id.toString()+'.jpg';
	    fs.exists(filename,(function(){
		var decor = decors[i];
		var filename = 'public/img/backgrounds/' + decor._doc._id.toString()+'.jpg';
		return function(exists){
		    if(!exists){
			if(decor._doc.decor.backgroundurl){
			    base64_decode(decor._doc.decor.backgroundurl,filename);
			}
		    }
		}
	    })());
	}
    });
    if(req.query.select){
	query.select(req.query.select);
    }
    var page = req.query.page, perPage = 12;//20;
    query.paginate({limit:perPage,offset:perPage * page},function(err,total,decors){
	if(err){
	    res.status(500).send('Data fetching broken');
	}else{
	    //console.log('total: ', total);
	    //res.send(decors);
	    res.send([{
		page: page,     //current page returned
		decors:decors,
		lastpage: (total-page*perPage)>perPage? false : true
	    }]);
	}
    })
});

router.get('/api/decors/:id/',myaccessctrl.ensureDesignerOfDecor.bind({Decor:Decor}),function(req,res,next){
    /*Decor.findById(req.params.id,function(err,decor){
	if (err) return next(err);
	res.send(decor);
    })*/
    //console.log(req.query.mode);
    if(req.query.mode == 'edit'){
	//console.log("get decor for edit")
	Decor.findById(req.params.id,function(err,decor){
	    if (err) return next(err);
	    res.send(decor);
	})
    }else{
	//play or edit_template
	Decor.findByIdAndUpdate(req.params.id,{$inc: {"decor.views":1}},{ upsert: false })
	    .populate('decor.user_id')
	    .exec(function(err,decor){
	    if (err) {
		console.log("error occured in findByIdAndUpdate " + err);
		return next(err);
	    } else {
		var emailDate = Date.create("10 seconds from now");
		if(!req.user || req.user._id != decor.decor.user_id._id.toString()){
		    agenda.schedule(emailDate, 'send email while playing', req.params.id);
		}
	    }
	    res.json(decor);
	});
    }
})

router.post('/api/decors/',
	    myaccessctrl.ensureCaptcha,
	    myaccessctrl.ensureAuthenticated,
	    function(req,res,next){
    //both save and create works
    /*var decor = new Decor({
	decor:req.body.decor,
	widgets:req.body.widgets,
	tools:req.body.tools,
	animations:req.body.animations,
    });
    decor.save(function(err,data){
	console.log('saved data:' + data);
    })*/
    //Decor.create(req.body,function(err,decor){
    Decor.create(req.body.data,function(err,decor){
	if (err) {
	    console.log("error occured" + err);
	    return next(err);
	}
	if(true){
	    //schedule email
	    var emailDate = Date.create("2 minutes from now");
	    agenda.schedule(emailDate, 'send email after save', decor._id);//.repeatEvery('1 week');
	    if(decor.decor.askpro){
		agenda.schedule(Date.create("3 minutes from now"), 'invite pro to design', decor._id);//.repeatEvery('1 week');
	    }
	    //decode backgroundurl base64 string
	    var filename = 'public/img/backgrounds/' + decor._doc._id.toString()+'.jpg';
	    base64_decode(decor._doc.decor.backgroundurl,filename);
	}
	res.json(decor);
    })
})

router.put('/api/decors/:id',
	   myaccessctrl.ensureCaptcha,
	   myaccessctrl.ensureDesignerOfDecor.bind({Decor:Decor}),
	   function(req,res,next){
    //how to set decor and other fields like animations
    Decor.findByIdAndUpdate(req.params.id,
			    {$set: {decor:req.body.data.decor, 
				    //subscribers:req.body.data.subscribers,    //subscribers updated by reader
				    //thumbs:req.body.data.thumbs,
				    animations:req.body.data.animations}},
			    { upsert: true },
			    function(err,decor){
				if (err) {
				    console.log("error occured in findByIdAndUpdate " + err);
				    return next(err);
				}

				//Suger: var alertDate = Date.create('Next ' + show.airsDayOfWeek + ' at ' + show.airsTime).rewind({ hour: 2});
				//Next Saturday at 8:00 PM
				var emailDate = Date.create("2 minutes from now");
				agenda.schedule(emailDate, 'send email after save', decor._id);//.repeatEvery('1 week');
				if(decor.decor.askpro){
				    agenda.schedule(Date.create("3 minutes from now"), 'invite pro to design', decor._id);//.repeatEvery('1 week');
				}

				//decode backgroundurl base64 string
				if (true) {
				    var filename = 'public/img/backgrounds/' + decor._doc._id.toString()+'.jpg';
				    base64_decode(decor._doc.decor.backgroundurl,filename);
				}

				res.json(decor);
			    });
})

router.delete('/api/decors/:id',myaccessctrl.ensureDesignerOfDecor.bind({Decor:Decor}),function(req,res,next){
    Decor.findByIdAndRemove(req.params.id,req.body,function(err,decor){
	if (err) return next(err);
	res.send(decor);
    })
});

//================api to access user collection for login/logout/signup================
//login data is passed to Passport LocalStrategy
/* only store user id in req.session.passport.user
passport.serializeUser(function(user,done){
    done(null,user.id);
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
	done(err,user);
    });
})*/
/* store user object in req.session.passport.user */
passport.serializeUser(function(user,done){
    done(null,user);
});

passport.deserializeUser(function(obj,done){
    done(null,obj);
});


passport.use(new LocalStrategy({usernameField: 'email'},function(email,password,done){
    User.findOne({email: email},function(err,user){
	if (err) return done(err);
	if (!user) return done(null,false);
	user.comparePassword(password,function(err,isMatch){
	    if (err) return done(err);  //db err
	    if (isMatch) return done(null,user);   //password matching
	    return done(null,false);    //password not match
	})
    })
}));

router.post('/api/login',passport.authenticate('local'),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    res.send(req.user);
});

router.post('/api/signup',function(req,res,next){
    var user = new User({
	email: req.body.email,
	password: req.body.password
    });
    user.save(function(err){
	if (err) return next(err);
	res.send(200);
    })
});

router.get('/api/logout',function(req,res,next){
    req.logout();
    res.send(200);
});

//Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: oauth.facebook.clientID,
    clientSecret: oauth.facebook.clientSecret,
    callbackURL: oauth.facebook.callbackURL,
    //profileFields : ['emails', 'picture','name'],
    //profileURL : 'https://graph.facebook.com/me?fields=location,first_name,last_name,picture,address,email,id,website'
    authorizationURL: 'https://www.facebook.com/v2.2/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/v2.2/oauth/access_token',
    profileURL: 'https://graph.facebook.com/v2.2/me'
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('email');
	    var user = new User({
		email: email_good ? profile._json.email : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		fakemail: !email_good,
		provider: 'facebook'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/facebook',passport.authenticate('facebook',{
    scope : [ "email" ]
}),function(req,res){
});

router.get('/auth/facebook/callback',passport.authenticate('facebook',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //facebook user example: {"__v":0,"email":"john@optimow.net","password":"$2a$10$6koF0CD9O/y2Ayyv1NX4iOvMLsM4zrm/KCZh1iYComnuxcwRKUgmW","oauthID":1380269195624765,"name":"Joshua Livingstone","_id":"54f50a33c036d5c2675b5d08"}
    res.redirect('/');
});

//Twitter Strategy
passport.use(new TwitterStrategy({
    consumerKey: oauth.twitter.consumerKey,
    consumerSecret: oauth.twitter.consumerSecret,
    callbackURL: oauth.twitter.callbackURL,
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('email');
	    var user = new User({
		email: email_good ? profile._json.email : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		username: profile.username,
		fakemail: !email_good,
		provider: 'twitter'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/twitter',passport.authenticate('twitter'),function(req,res){
});

router.get('/auth/twitter/callback',passport.authenticate('twitter',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //twitter user example: 
    res.redirect('/');
});

//Amazon Strategy
passport.use(new AmazonStrategy({
    clientID: oauth.amazon.clientID,
    clientSecret: oauth.amazon.clientSecret,
    callbackURL: oauth.amazon.callbackURL,
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('email');
	    var user = new User({
		email: email_good ? profile._json.email : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		username: profile.username,
		fakemail: !email_good,
		provider: 'amazon'
	    });
	    user.save(function(err){
		if(err){
		    //err such as duplicate email
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/amazon',passport.authenticate('amazon',{ scope: ['profile', 'postal_code'] }),function(req,res){
});

router.get('/auth/amazon/callback',passport.authenticate('amazon',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //amazon user example: 
    res.redirect('/');
});

//Instagram Strategy
passport.use(new InstagramStrategy({
    clientID: oauth.instagram.clientID,
    clientSecret: oauth.instagram.clientSecret,
    callbackURL: oauth.instagram.callbackURL,
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('email');
	    var user = new User({
		email: email_good ? profile._json.email : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		username: profile._json.data.username,
		fakemail: !email_good,
		provider: 'instagram'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/instagram',passport.authenticate('instagram'),function(req,res){
});

router.get('/auth/instagram/callback',passport.authenticate('instagram',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //instagram user example: 
    res.redirect('/');
});

//Yahoo Strategy OAUTH
/*passport.use(new YahooStrategy({
    consumerKey: oauth.yahoo.consumerKey,
    consumerSecret: oauth.yahoo.consumerSecret,
    callbackURL: oauth.yahoo.callbackURL,
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {console.log(err)};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('email');
	    var user = new User({
		email: email_good ? profile._json.email : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		username: profile.username,
		fakemail: !email_good,
		provider: 'yahoo'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		}else{
		    console.log("saving user...");
		    done(null,user);
		}
	    })
	}
    });    
}));*/

//OpenID
passport.use(new YahooStrategy({
    returnURL: oauth.yahoo.callbackURL,
    realm: oauth.yahoo.realm
}, function(identifier,profile,done){
    User.findOne({identifier: identifier},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile.hasOwnProperty('emails');
	    var user = new User({
		email: profile.emails[0].value,
		email: email_good ? profile.emails[0].value : identifier+'@yahoo.com',
		password: config.OAUTH_USER_PASS,
		identifier: identifier,   //google use OpenID, this identifier is not oauthID
		name: profile.displayName,
		fakemail: !email_good,
		provider: 'yahoo'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/yahoo',passport.authenticate('yahoo'),function(req,res){
});

router.get('/auth/yahoo/callback',passport.authenticate('yahoo',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //yahoo user example: 
    res.redirect('/');
});

//WindowsLive Strategy
passport.use(new WindowsLiveStrategy({
    clientID: oauth.windowslive.clientID,
    clientSecret: oauth.windowslive.clientSecret,
    callbackURL: oauth.windowslive.callbackURL,
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('emails');
	    var user = new User({
		email: email_good ? profile._json.emails.account : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		username: profile.username,
		fakemail: !email_good,
		provider: 'windowslive'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/windowslive',passport.authenticate('windowslive',{ scope: ['wl.signin', 'wl.basic'] }),function(req,res){
});

router.get('/auth/windowslive/callback',passport.authenticate('windowslive',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //windowslive user example: 
    res.redirect('/');
});

//LinkedIn Strategy
passport.use(new LinkedInStrategy({
    clientID: oauth.linkedin.clientID,
    clientSecret: oauth.linkedin.clientSecret,
    callbackURL: oauth.linkedin.callbackURL,
    scope: ['r_emailaddress'],
    state: true
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('emailAddress');
	    var user = new User({
		email: email_good ? profile._json.emailAddress : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		username: profile.username,
		fakemail: !email_good,
		provider: 'linkedin'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/linkedin',passport.authenticate('linkedin'),function(req,res){
});

router.get('/auth/linkedin/callback',passport.authenticate('linkedin',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //linkedin user example: 
    res.redirect('/');
});

//Auth0 Strategy
passport.use(new Auth0Strategy({
    domain: oauth.auth0.domain,
    clientID: oauth.auth0.clientID,
    clientSecret: oauth.auth0.clientSecret,
    callbackURL: oauth.auth0.callbackURL,
},function(accessToken,refreshToken,profile,done){
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile._json.hasOwnProperty('email');
	    var user = new User({
		email: email_good ? profile._json.email : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		fakemail: !email_good,
		provider: profile.provider
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
}));

router.get('/auth/auth0',passport.authenticate('auth0'),function(req,res){
});

router.get('/auth/auth0/callback',passport.authenticate('auth0',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //auth0 user example: 
    res.redirect('/');
});

//Google Strategy
/*passport.use(new GoogleStrategy({
    returnURL: oauth.google.returnURL,
    realm: oauth.google.realm
},function(identifier,profile,done){
    if(profile.emails.length>0){
	User.findOne({email: profile.emails[0].value},function(err,user){
	    if (err) {console.log(err)};
	    if (!err && user != null) {
		return done(null,user);
	    }else{
		var user = new User({
		    email: profile.emails[0].value,
		    password: config.OAUTH_USER_PASS,
		    identifier: identifier,   //google use OpenID, this identifier is not oauthID
		    name: profile.displayName,
		    provider: 'google'
		});
		user.save(function(err){
		    if(err){
			console.log(err);
		    }else{
			console.log("saving user...");
			done(null,user);
		    }
		})
	    }
	});    
    }else{
	console.log('google return no email, sorry we can not create LightGala User for this google user, hence he can not login');
    }//end if emails.length
}));
*/
passport.use(new GoogleStrategy({
    clientID: oauth.google.clientID,
    clientSecret: oauth.google.clientSecret,
    callbackURL: oauth.google.callbackURL,
    //callbackURL: "http://lightgala.com:3000/db2/auth/google/callback",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOne({oauthID: profile.id},function(err,user){
	if (err) {
	    console.log(err);
	    return done(err);
	};
	if (!err && user != null) {
	    return done(null,user);
	}else{
	    var email_good = profile.hasOwnProperty('email');
	    var user = new User({
		email: email_good ? profile.email : profile.id + '@' + profile.provider + '.com',
		password: config.OAUTH_USER_PASS,
		oauthID: profile.id,
		name: profile.displayName,
		fakemail: !email_good,
		provider: 'google'
	    });
	    user.save(function(err){
		if(err){
		    console.log(err);
		    return done(err);
		}else{
		    console.log("saving user...");
		    return done(null,user);
		}
	    })
	}
    });    
  }
));

router.get('/auth/google',passport.authenticate('google',{ scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read'] }),function(req,res){
});

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect: '/'}),function(req,res){
    res.cookie('user',JSON.stringify(req.user));
    //res.send(req.user);
    //google user example: {"displayName":"Light Gala","emails":[{"value":"lightgala.com@gmail.com"}],"name":{"familyName":"Tube","givenName":"Light"},"identifier":"https://www.google.com/accounts/o8/id?id=AItOawkCwa_wK0sjNTCCoigqmvM0D0j1moZtZdw"}
    res.redirect('/');
});

//====================api to subscribe/unsubscribe/thumbup/thumbdown================
router.post('/api/subscribe',myaccessctrl.ensureAuthenticated,function(req,res,next){
    console.log("decor_id: "+req.body.decor_id);
    Decor.findById(req.body.decor_id,function(err,decor){
	if (err) {
	    return next(err);
	}
	if (!decor.subscribers) {
	    Decor.update({_id:decor._id},{subscribers:[req.user.id]},{multi:true},function(err,numberAffected){
		//numberAffected should be 1
	    });
	}else{
	    decor.subscribers.push(req.user.id);
	}
	decor.save(function(err){
	    if (err) {
		return next(err);
	    }
	    res.send(200);
	})
    })
});

router.post('/api/unsubscribe',myaccessctrl.ensureAuthenticated,function(req,res,next){
    Decor.findById(req.body.decor_id,function(err,decor){
	if (err) return next(err);
	if(decor.subscribers){
	    var index = decor.subscribers.indexOf(req.user.id);
	    decor.subscribers.splice(index,1);
	}
	decor.save(function(err){
	    if (err) return next(err);
	    res.send(200);
	})
    })
});

router.post('/api/thumbup',function(req,res,next){
    Decor.findById(req.body.decor_id,function(err,decor){
	if (err) {
	    return next(err);
	}
	if (!decor.thumbs) {
	    console.log("add thumbs field");
	    Decor.update({_id:decor._id},{thumbs:{up:0,down:0}},{multi:true},function(err,numberAffected){
		//numberAffected should be 1
	    });
	}else{
	    console.log("incrementing thumbs up");
	    decor.thumbs.up = !isNaN(decor.thumbs.up)? decor.thumbs.up+1 : 1;
	}
	decor.save(function(err){
	    if (err) {
		console.log("err occurred while saving" + err);
		return next(err);
	    }
	    console.log("saving successful");
	    res.send(200);
	})
    })
});

router.post('/api/thumbdown',function(req,res,next){
    Decor.findById(req.body.decor_id,function(err,decor){
	if (err) return next(err);
	if(!decor.thumbs){
	    Decor.update({_id:decor._id},{thumbs:{up:0,down:0}},{multi:true},function(err,numberAffected){
		//numberAffected should be 1
	    });
	}else{
	    decor.thumbs.down = !isNaN(decor.thumbs.down)? decor.thumbs.down+1 : 1;
	}
	decor.save(function(err){
	    if (err) return next(err);
	    res.send(200);
	})
    })
});

//====================agenda schedule to send email to emailto and subscribers==================
agenda.define('send email after save',function(job,done){
    Decor.findOne({_id:job.attrs.data}).populate('subscribers').exec(function(err,decor){
	//console.log("decor found to process email:")
	//console.log(decor);
	var emails_subscribers = decor.subscribers.map(function(user){
	    return !user.fakemail? user.email : 'spearsear@gmail.com';
	})

	var emails_emailto = decor.decor.emailto?decor.decor.emailto:'';
	var emails = emails_subscribers.join(',') + emails_emailto.length>0? emails_emailto : '';

	var smtpTransport = nodemailer.createTransport({
	    service: 'Gmail',
	    auth: {user:config.EMAIL_ADMIN,pass:config.EMAIL_ADMIN_PASS}
	});

	var mailOptions = {
	    from: 'LightGala <'+config.EMAIL_ADMIN+'>',
	    to: emails,
	    subject: decor.decor.address.label + ' is lighting up',
	    text: 'Hi, there,\n' + decor.decor.designer + ' has recently designed lighting at ' + decor.decor.address.label + '.\n' +
		'Please go to ' + host_str + ' and search for the address. \n'+
		'If you want to talk to a decoration professional in the area regarding your lighting project, please reply this email, tell us what you want, your phone and best time to reach, we will get back to you.<br><br>Enjoy!<br><br>LightGala Team',
	    html: 'Hi, there,<br><br>' + decor.decor.designer + ' has recently designed lighting at <strong>' + decor.decor.address.label + '</strong>.\n<br><br>' +
		'Please <a href="' + host_str + '/decor/'+ decor._id +'">click here</a> to enjoy the lighting.\n<br><br>'+
		'designer quote: ' + 
		'"' + decor.decor.desc + '"<br><br>' + 
		'You can <a href="'+ host_str + '/decor/">design your own</a> also.<br><br>'+
		'If you want to talk to a decoration professional in the area regarding your lighting project, please reply this email, tell us what you want, your phone and best time to reach, we will get back to you.<br><br>Enjoy!<br><br>LightGala Team'
	};

	if(emails.length>1){
	    smtpTransport.sendMail(mailOptions,function(err,info){
		if(err){
		    console.log(err);
		}else{
		    smtpTransport.close();
		    done();
		}
	    })
	}else{
	    console.log('no emails specified, skip sending emails');
	}
    });
});

agenda.define('send email while playing',function(job,done){
    Decor.findOne({_id:job.attrs.data}).populate('decor.user_id').exec(function(err,decor){
	var email_user = [decor.decor.user_id].map(function(user){
	    return !user.fakemail? user.email : 'spearsear@gmail.com';
	})

	var emails_emailto = decor.decor.emailto?decor.decor.emailto:'';
	var emails = email_user.join(',');

	var smtpTransport = nodemailer.createTransport({
	    service: 'Gmail',
	    auth: {user:config.EMAIL_ADMIN,pass:config.EMAIL_ADMIN_PASS}
	});

	var mailOptions = {
	    from: 'LightGala <'+config.EMAIL_ADMIN+'>',
	    to: emails,
	    subject: decor.decor.address.label + ' is watching your lighting design',
	    text: 'Hi ' + decor.decor.designer + ',\n ' + decor.decor.address.label + ' is currently watching your lighting design.\n' +
		'Now is the best time to follow up wit the prospect.<br><br>Good luck!<br><br>LightGala Team',
	    html: 'Hi ' + decor.decor.designer + ',<br><br><strong>' + decor.decor.address.label + '</strong> is currently watching your <a href="' + host_str + '/decor/' + decor._id + '">lighting design</a>.<br><br>' +
		'Now is the best time to follow up wit the prospect.<br><br>Good luck!<br><br>LightGala Team'
	};

	if(emails.length>1){
	    smtpTransport.sendMail(mailOptions,function(err,info){
		if(err){
		    console.log(err);
		}else{
		    smtpTransport.close();
		    done();
		}
	    })
	}else{
	    console.log('no emails specified, skip sending emails');
	}
    });
});

agenda.define('invite pro to design',function(job,done){
    Decor.findOne({_id:job.attrs.data}).exec(function(err,decor){
	var emails_pro = [config.EMAIL_ADMIN];
	var emails = emails_pro.join(',');

	var smtpTransport = nodemailer.createTransport({
	    service: 'Gmail',
	    auth: {user:config.EMAIL_ADMIN,pass:config.EMAIL_ADMIN_PASS}
	});

	var mailOptions = {
	    from: 'LightGala <'+config.EMAIL_ADMIN+'>',
	    to: emails,
	    subject: decor.decor.address.label + ' is looking for lighting design',
	    text: '' + decor.decor.designer + ' at ' + decor.decor.address.label + ' is interested in having a professional to design lighting for the holiday.\n' +
		'Please go to ' + host_str+ ' and search for the address. \nEnjoy!',
	    html: '' + decor.decor.designer + ' at <strong>' + decor.decor.address.label + '</strong> is interested in having a professional to design lighting for the holiday.\n<br>' +
		'His/her own design can be seen <a href="'+ host_str + '/decor/' + decor._id + '">here</a>, ' +
		'Please <a href="' + host_str + '/decor/template/'+ decor._id +'">click here</a> to design the lighting for ' + decor.decor.designer + '.\n<br>Enjoy!'
	};

	if(emails.length>1){
	    smtpTransport.sendMail(mailOptions,function(err,info){
		if(err){
		    console.log(err);
		}else{
		    smtpTransport.close();
		    done();
		}
	    })
	}else{
	    console.log('no emails specified, skip sending emails');
	}
    });
});

agenda.start();

agenda.on('start',function(job){
    console.log('Job %s starting',job.attrs.name);
});

agenda.on('complete',function(job){
    console.log('Job %s finished',job.attrs.name);
});

module.exports = router;
