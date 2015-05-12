var express = require('express'),
    mongoskin = require('mongoskin'),
    bodyParser = require('body-parser'),
    logger = require('morgan');
var router = express.Router();

var db_str = 'mongodb://lightuser:test@ds053320.mongolab.com:53320/holilight';
var db = mongoskin.db(db_str,{safe:true});

var id = mongoskin.helper.toObjectID

router.param('collectionName',function(req,res,next,collectionName){
    req.collection = db.collection(collectionName);
    return next();
});

router.get('/',function(req,res,next){
    res.send('Select a collection, e.g: /collections/messages');
})

router.get('/collections/:collectionName',function(req,res,next){
    req.collection.find({},{limit:10,sort: [['_id',-1]]})
       .toArray(function(e,results){
	   if(e) return next(e);
	   res.send(results);
       })
});

router.post('/collections/:collectionName',function(req,res,next){
    req.collection.insert(req.body,{},function(e,results){
	if(e) return next(e);
	res.send(results);
    })
});

router.get('/collections/:collectionName/:id',function(req,res,next){
    req.collection.findOne({_id:id(req.params.id)},function(e,result){
	if(e) return next(e);
	res.send(result);
    })
});

router.put('/collections/:collectionName/:id',function(req,res,next){
    req.collection.update({_id:id(req.params.id)},
			 {$set: req.body},
			 {safe: true, multi: false}, function(e,result){
			     if(e) return next(e);
			     res.send((result === 1)? {msg:'success'} : {msg:'error'})
			 })
});

router.delete('/collections/:collectionName/:id',function(req,res,next){
    req.collection.remove({_id:id(req.params.id)},function(e,result){
	if(e) return next(e);
	res.send((result === 1)? {msg:'success'} : {msg:'error'})
    })
});

module.exports = router;
