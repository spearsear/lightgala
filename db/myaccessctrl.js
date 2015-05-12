//======================middleware===================
//authentication
var request = require('request');
//var Recaptcha = require('recaptcha').Recaptcha;
//google recaptcha site key and secret
var PUBLIC_KEY  = '6Le3FAETAAAAALObaPdsf277KQlhJ2BN1N90sPda',
    PRIVATE_KEY = '6Le3FAETAAAAAIWINWxvTGsRCw5aBwhAQbGL4asH';

var myaccessctrl = {
    ensureAuthenticated: function(req,res,next){
	if(req.isAuthenticated()){
	    next();
	}else{
	    console.log("ensureAuthenticated returns 401");
	    res.send(401);
	}
    },
    ensureDesignerOfDecor: function(req,res,next){
	//decor might be in req.body or decor id in req.params.id
	//console.log("req.body" + req.body);
	//console.log("req.params" + req.params);
	var decor_id = req.body._id || req.params.id;
	if(!decor_id){
	    //new decor
	    next();
	}
	if(req.query.mode == 'play' || req.query.mode == 'edit_template'){
	    //allow play or edit_template regardless of authetication
	    //console.log("allow play regardless of authetication");
	    next();
	}else{
	//expect this in the closure with compiled mongoose Decor model
	var Decor = this.Decor;
	Decor.findById(decor_id,function(err,decor){
	    if (err) return next(err);
	    if(req.isAuthenticated()){
		if (decor){
		    //if (decor.decor.user_id == req.user.id) {
		    //req.user is an object like: {"_id":"54ee8cdf545d750e02e9315c","email":"spearsear@gmail.com","password":"$2a$10$ioZRvUvafh65PEMs3f7/3ORQiu7GoVuXMtJenh9Az6PSNPkEx5Z2O","__v":0}
		    if (decor.decor.user_id == req.user._id) {
			//decor user is current logged-in user, pass
			//console.log("passed ensure designer of decor");
			next();
		    }else{
			//forbidden designer to update decor designed by another user
			console.log("ensure designer of decor returns 403");
			res.sendStatus(403);
		    }
		}else{
		    next();
		}
	    }else{
		console.log("ensure designer of deor returns 401");
		res.sendStatus(401);
	    }
	})
	}
    },
    ensureCaptcha: function(req,res,next){
	var data = {
            remoteip:  req.connection.remoteAddress,
            response:  req.body.recaptcha_response
	};
	var url = "https://www.google.com/recaptcha/api/siteverify?secret="+PRIVATE_KEY+"&response="+data.response+"&remoteip="+data.remoteip;
	request(url, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
		var resp = JSON.parse(body)
		if(resp.success){
		    console.log("captcha pass, continue");
		    next();
		}else{
		    //for now bypass captcha, set bypass_captcha to false if check it
		    var bypass_captcha = true;
		    if(!bypass_captcha){
			console.log("captcha failed, send back 409");
			if(resp.hasOwnProperty('error-codes')){
			    console.log(resp['error-codes']);
			}
			res.sendStatus(409);
		    }else{
			console.log("bypass captcha, continue");
			next();
		    }
		}
	    }
	})
    },
    //deprecated
    ensureCaptchaOld: function(req,res,next){
	console.log("Ensuring captcha..." + req);
	var data = {
            remoteip:  req.connection.remoteAddress,
            challenge: '',//req.body.recaptcha.challenge,   //no longer needed
            response:  req.body.recaptcha_response
	};
	console.log("Verifying captcha data:\n ip:" +data.remoteip + "\nresponse: " + data.response);
	var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, data);

	recaptcha.verify(function(success, error_code) {
	    console.log(success);
            if (success) {
		//res.send('Recaptcha response valid.');
		console.log("captcha pass, continue");
		next();
            }
            else {
		console.log("captcha failed, send back 409");
		console.log(error_code);
		// Redisplay the form.
		/*res.render('form.jade', {
                    layout: false,
                    locals: {
			recaptcha_form: recaptcha.toHTML()
                    }
		});*/
		res.sendStatus(409);
		//test: for now just pass before recaptcha is available on client
		//next();
            }
	});
    }
}

module.exports = myaccessctrl;
/*module.exports = function(config){
    return function(config){
	return myaccessctrl;
    };
};*/
