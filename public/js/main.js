//main angular entry point to create the app
angular.module("lightgalaApp",["d3",
			       "ngRoute","ngResource","ngAnimate","ngCookies","ngMessages","mgcrea.ngStrap",
			       //only certain modules from ui bootstrap, tpls is needed otherwise throw template single root err
			       "ui.bootstrap.tpls", "ui.bootstrap.carousel", "ui.bootstrap.pagination",
			       //"ngMap"
			       "uiGmapgoogle-maps",
			       "vcRecaptcha",
			       "colorpicker.module",
			       "radialgradient.module"
			      ])
    .constant('baseUrl','http://lightgala.com:3000/')
    .config(['uiGmapGoogleMapApiProvider',function(uiGmapGoogleMapApiProvider) {
	uiGmapGoogleMapApiProvider.configure({
	    //key:'ABQIAAAAohHzkd1YRQBb9RMm3fUK2BSRwUSrndu2uRr20ZQGKie2aCUX9RSLCwrqzklKSJUffbARXImLW_96bw',
            v: '3.17',
            libraries: 'weather,geometry,visualization'
	});
    }])
    .config(['$locationProvider','$routeProvider','$httpProvider',function($locationProvider,$routeProvider,$httpProvider){
	$locationProvider.html5Mode(true);

	var resolves = {
	    checkEditPermission: ['$rootScope','$location','Auth',function($rootScope,$location,Auth){
		//you need to login as designer to edit a decor
		if($rootScope.currentUser){
		    //need to check is currentUser the designer?
		    return true;
		}else{
		    Auth.saveAttemptedUrl();
		    $location.path('/login')
		}
	    }]
	};

	$httpProvider.interceptors.push('securityInterceptor');

	$routeProvider
	    .when('/',{
		//templateUrl: 'main.html',
		//in index.html, base href point to /
		templateUrl: 'partials/main.html',
		controller: 'mainCtrl'
	    })
	    .when('/decor',{
		//a new decor
		templateUrl: '/partials/decor.html',
		controller: 'decorCtrl'
	    })
	    .when('/decor/template/:template_id',{
		//a new decor using an existing decor as template (use its background url and user email as emailto)
		templateUrl: '/partials/decor.html',
		controller: 'decorCtrl'
	    })
	    .when('/decor/:id/edit',{
		//edit an existing decor
		templateUrl: 'partials/decor.html',
		controller: 'decorCtrl',
		//conditional route based on $rootScope.currentUser
		//forward to login page if not logged in
		resolve: {
		    factory: resolves.checkEditPermission
		},
		//or listen to routeChangeStart and check auth
		/*auth: function(user){
		    return user;
		}*/
	    })
	    .when('/decor/:id',{
		//play an existing decor
		templateUrl: 'partials/decor_play.html',
		//2 controllers in this partial
		//controller: 'decorCtrl'
	    })
	    .when('/login',{
		templateUrl: 'partials/login.html',
		controller: 'loginCtrl'
	    })
	    .when('/signup',{
		templateUrl: 'partials/signup.html',
		controller: 'signupCtrl'
	    })
	    .when('/about',{
		templateUrl: '/partials/about.html',
	    })
	    .when('/popular',{
		templateUrl: '/partials/popular.html',
	    })
	    .when('/privacy',{
		templateUrl: '/partials/privacy.html',
	    })
	    .when('/disclaimer',{
		templateUrl: '/partials/disclaimer.html',
	    })
	    .when('/company',{
		templateUrl: '/partials/company.html',
	    })
	    .when('/contact',{
		templateUrl: '/partials/contact.html',
	    })
	    .otherwise({
		redirectTo: '/'
	    })
    }])
    .factory('securityInterceptor',['$q','$location','$cookieStore','$injector',function($q,$location,$cookieStore,$injector){
	var requestInterceptor = {
	    request: function(config){
		var Auth = $injector.get('Auth');
		if(!Auth.isLoggedIn()){
		    $cookieStore.remove('user');
		    Auth.saveAttemptedUrl();
		}
		return config;
	    },
	    responseError: function(response){
		if (response.status === 403) {
		    $location.path('/');
		    var alert = $injector.get('$alert');
		    alert({
			title: 'Edit forbidden!',
			content: 'You can only edit lighting designed by yourself.',
			placement: 'top-right',
			type: 'danger',
			duration: 3
		    });		    		    
		}
		return $q.reject(response);
	    }
	};
	return requestInterceptor;
    }])
    .run(function(){
    })
    /*.run(function($rootScope,$location){
	$rootScope.$on('$routeChangeStart',function(ev,next,curr){
	    if(next.$$route){
		var user = $rootScope.currentUser;
		//the auth function defined in route earlier
		var auth = next.$$route.auth;
		if (auth && !auth(user)) {
		    $location.path('/login');
		}
	    }
	})
    })*/
