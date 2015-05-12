var express = require("express");
var router = express.Router();

//holilight app main routing
router.get('/',function(req,res){
    //res.render('index',{title: 'Express'});
    //static content is from public folder
    res.redirect("index.html");
})

module.exports = router;
