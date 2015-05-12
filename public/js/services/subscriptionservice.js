angular.module("lightgalaApp")
  .factory('subscriptionService',['$http',function($http){
      return {
	  subscribe: function(decor,user){
	      return $http.post('/db2/api/subscribe',{decor_id: decor._id});
	  },
	  unsubscribe: function(decor,user){
	      return $http.post('/db2/api/unsubscribe',{decor_id: decor._id});
	  },
	  thumbup: function(decor){
	      return $http.post('/db2/api/thumbup',{decor_id: decor._id});
	  },
	  thumbdown: function(decor){
	      return $http.post('/db2/api/thumbdown',{decor_id: decor._id});
	  },
      }
  }])
