angular.module("lightgalaApp")
  .controller('navbarCtrl',['$http','$rootScope','$scope','decorsListService','Auth',function($http,$rootScope,$scope,decorsListService,Auth){
      $scope.search_criteria = "";
      $scope.logout = function(){
	  Auth.logout();
      }
      $scope.search = function(){
	  var criteria = {
	      criteria: $scope.search_criteria,
	      criteria_type: 'has_keyword',
	      page: 0
	  };
	  decorsListService.query(criteria).$promise.then(function(decors){
	      $rootScope.$broadcast("searchcriteriachanged",{
		  criteria: criteria.criteria
	      });
	      $rootScope.$broadcast("decorslistchanged",{
		  decors: decors
	      });
	  });
      }
  }])
