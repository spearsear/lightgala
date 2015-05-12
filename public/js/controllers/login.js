angular.module("lightgalaApp")
   .controller('loginCtrl',['$scope','$document','Auth','utilService',function($scope,$document,Auth,utilService){
       $document.bind('keydown',function(e){
	   $scope.$apply(function(){
	       if(e.keyCode==65 && e.ctrlKey){
		   //ctrl-a toggle auth0
		   $scope.use_auth0 = !$scope.use_auth0;
	       }
	   });
       });
       $scope.login = function(){
	   Auth.login({
	       email: $scope.email,
	       password: $scope.password
	   }).then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       $alert({
		   title: 'Logged in failed!',
		   content: 'Wrong login credential supplied.',
		   placement: 'top-right',
		   type: 'danger',
		   duration: 3
	       });	       
	   });
       };
       $scope.login_google = function(){
	   Auth.login_google('/db2/auth/google').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //google login failure
	   })
       };
       $scope.login_facebook = function(){
	   Auth.login_facebook('/db2/auth/facebook').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //facebook login failure
	   })
       };
       $scope.login_twitter = function(){
	   Auth.login_twitter('/db2/auth/twitter').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //twitter login failure
	   })
       };
       $scope.login_amazon = function(){
	   Auth.login_amazon('/db2/auth/amazon');
	   /*Auth.login_amazon('/db2/auth/amazon').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //amazon login failure
	   })*/
       };
       $scope.login_instagram = function(){
	   Auth.login_instagram('/db2/auth/instagram').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //instagram login failure
	   })
       };
       $scope.login_yahoo = function(){
	   Auth.login_yahoo('/db2/auth/yahoo').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //yahoo login failure
	   })
       };
       $scope.login_windowslive = function(){
	   Auth.login_windowslive('/db2/auth/windowslive').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //windowslive login failure
	   })
       };
       $scope.login_linkedin = function(){
	   Auth.login_linkedin('/db2/auth/linkedin').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //windowslive login failure
	   })
       };
       //auth0 has done it for us all, except it costs money
       $scope.login_auth0 = function(){
	   Auth.login_auth0('/db2/auth/auth0').then(function(){
	       Auth.redirectToAttemptedUrl();
	   },function(){
	       //auth0 login failure
	   })
       };
}]);
