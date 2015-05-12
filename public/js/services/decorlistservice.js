angular.module("lightgalaApp")
  .factory('decorsListService',['$resource',function($resource){
      //the returned object has the following methods
      /*{ 'get':    {method:'GET'},
	'save':   {method:'POST'},
	'query':  {method:'GET', isArray:true},
	'remove': {method:'DELETE'},
	'delete': {method:'DELETE'} };*/
      //see /db/api2.js for route /db2/api/decors/:_id
      return $resource('/db2/api/decors/:_id',{_id:'@_id'},{
	  'update': {method:'PUT'},
	  //custom method: decorsListService.reviews()
	  //"reviews": {'method': 'GET', 'params': {'review': "true"}, isArray: true}
	  //"get4edit": {'method': 'GET', 'params': {'mode': "edit"}},
      });
  }])
