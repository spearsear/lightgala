angular.module('lightgalaApp')
   .controller('signupCtrl',['$scope','Auth',function($scope,Auth){
       $scope.signup = function(){
	   Auth.signup({
	       email: $scope.email,
	       password: $scope.password
	   });
       };
}]);
