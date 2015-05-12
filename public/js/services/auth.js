angular.module("lightgalaApp")
   .value('redirectToUrlAfterLogin',{url: '/'})
   .factory('Auth',['$http','$location','$rootScope','$cookieStore','$alert','$window','redirectToUrlAfterLogin',function($http,$location,$rootScope,$cookieStore,$alert,$window,redirectToUrlAfterLogin){
       //even when after auth/google.callback direct back, this service will initializa and set currentUser from cookie 
       $rootScope.currentUser = $cookieStore.get('user');
       $cookieStore.remove('user');
       return {
	   isLoggedIn: function(){
	       return $rootScope.currentUser;
	   },
	   login_google: function(){
	       $window.location.href = '/db2/auth/google';
	   },
	   login_facebook: function(){
	       $window.location.href = '/db2/auth/facebook';
	   },
	   login_twitter: function(){
	       $window.location.href = '/db2/auth/twitter';
	   },
	   login_amazon: function(){
	       //amazon force https in oauth
	       $window.location.href = 'https://lightgala.com:8000/db2/auth/amazon';
	   },
	   login_instagram: function(){
	       $window.location.href = 'https://lightgala.com:8000/db2/auth/instagram';
	   },
	   login_yahoo: function(){
	       $window.location.href = '/db2/auth/yahoo';
	   },
	   login_windowslive: function(){
	       $window.location.href = '/db2/auth/windowslive';
	   },
	   login_linkedin: function(){
	       $window.location.href = '/db2/auth/linkedin';
	   },
	   login_auth0: function(){
	       $window.location.href = '/db2/auth/auth0';
	   },
	   login: function(user){
	       return $http.post('/db2/api/login',user)
	         .success(function(data){
		     $rootScope.currentUser = data;
		     $location.path('/');
		     $alert({
			 title: 'Logged In!',
			 content: 'You can now edit and save the lighting you created.',
			 placement: 'top-right',
			 type: 'success',
			 duration: 3
		     });
		 })
	         .error(function(){
		     $alert({
			 title: 'Error!',
			 content: 'Invalid username or password.',
			 placement: 'top-right',
			 type: 'danger',
			 duration: 3
		     })
		 });
	   },
	   signup: function(user){
	       return $http.post('/db2/api/signup',user)
	         .success(function(){
		     $location.path('/login');
		     $alert({
			 title: 'Congratulations!',
			 content: 'Your account has been created',
			 placement: 'top-right',
			 type: 'success',
			 duration: 3
		     });
		 })
	         .error(function(response){
		     $alert({
			 title: 'Error!',
			 content: response.data,
			 placement: 'top-right',
			 type: 'danger',
			 duration: 3
		     })
		 });
	   },
	   logout: function(){
	       return $http.get('/db2/api/logout').success(function(){
		   $rootScope.currentUser = null;
		   $cookieStore.remove('user');
		   $location.path('/');
		   $alert({
		       content: 'You have been logged out.',
		       placement: 'top-right',
		       type: 'info',
		       duration: 3
		   })
	       })
	   },
	   saveAttemptedUrl: function(){
	       if($location.path().toLowerCase() != '/login'){
		   redirectToUrlAfterLogin.url = $location.path();
	       }else{
		   //don't do this when url is /login, since this will reset attemptedurl to /
		   //redirectToUrlAfterLogin.url = '/';
	       }
	   },
	   redirectToAttemptedUrl: function(){
	       $location.path(redirectToUrlAfterLogin.url);
	   }
       }
   }])
