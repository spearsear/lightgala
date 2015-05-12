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

angular.module("lightgalaApp")
    .filter("show_eye_icon",function(){
      return function(decor_line_visible){
	  if(decor_line_visible == undefined){
	      return "glyphicon-eye-close";
	  }else{
	      return decor_line_visible? "glyphicon-eye-close" : "glyphicon-eye-open";
	  }
      }
    })
    .filter("selectDecorLineFilter",function(){
	return function(decor_lines,decor_line_type){
	  //decor_line_type is fed from w.name
	  return _.filter(decor_lines,function(dl){
	      return dl.decor_line_type.toLowerCase() == decor_line_type.toLowerCase();
	  });
	}
    })
    .filter("formatDate",function(){
	return function(date){
	    if (date) {
		var date = new Date(date);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
	    }else{
		return 'unknown time';
	    }
	}
    })
    .filter("formatDateAsElapsed",['utilService',function(utilService){
	return function(date){
	    if (date) {
		var date = new Date(date);
		var date_now = new Date();
		return utilService.datediff(date,date_now);
	    }else{
		return 'unknown time';
	    }
	}
    }])
    .filter("formatAddress",function(){
	return function(addr){
	    var ADDR_LEN = 28;
	    if (addr) {
		return addr.length > ADDR_LEN ? addr.substring(0,Math.min(ADDR_LEN,addr.length))+'...' : addr;
	    }else{
		return 'unknown location';
	    }
	}
    })
    .controller('decorCtrl',['$scope','$http','$alert','$location','$rootScope','$routeParams','baseUrl','decorsListService','subscriptionService','decorService','decorDataService','toolService','lightService','utilService','vcRecaptchaService',function($scope,$http,$alert,$location,$rootScope,$routeParams,baseUrl,decorsListService,subscriptionService,decorService,decorDataService,toolService,lightService,utilService,vcRecaptchaService){
      $scope.name = 'decorCtrl scope';
      //initialize data with data in decordataservice(cached data)
      $scope.data = decorDataService.getData();
      $scope.app_data = decorDataService.getAppData();
      $scope.setDirty = function(dirty){
	  $scope.dirty = dirty
      }
      $scope.setDirty(false);
      $scope.getPrompt = function(){
	  return angular.isUndefined($routeParams.id) ? {prompt:'Click to load a picture to decorate on',cycle:false} : {prompt:'Loading, please wait...',cycle:true};
      }
      $scope.recaptcha = {
	  key: "6Le3FAETAAAAALObaPdsf277KQlhJ2BN1N90sPda",
	  setResponse: function (response) {
              console.info('Response available');
              this.response = response;
          },
          setWidgetId: function (widgetId) {
              console.info('Created widget ID: %s', widgetId);
              this.widgetId = widgetId;
          }
      }
      $scope.saveDecor = function(){
	  if(!$rootScope.currentUser){
	      $scope.saveDialog.hide();
	      $scope.keepDataInCache = true;
	      $location.path('/login/');
	      $alert({
		  title: 'Login required!',
		  content: 'Login required before saving decor.',
		  placement: 'top-left',
		  type: 'danger',
		  duration: 3
	      });
	      return;
	  }else{
	      $scope.keepDataInCache = false;
	  };
	  if($scope.decor_id){
	      $scope.data.decor.user_id = $rootScope.currentUser._id;
	      $scope.data.decor.last_mod_time = new Date();
	      //update
	      //decorsListService.update({_id: $scope.decor_id}, $scope.data);

	      /*$scope.data.recaptcha = {
		  challenge: '',
		  response: $scope.recaptcha.response
	      }*/

	      var data_n_captcha = {
		  data: $scope.data,
		  recaptcha_response: vcRecaptchaService.getResponse()
	      }

	      //decorsListService.update({_id: $scope.decor_id}, $scope.data).$promise.then(function(updatedDecor){
	      decorsListService.update({_id: $scope.decor_id}, data_n_captcha).$promise.then(function(updatedDecor){
		  //updated successfully
		  $scope.setDirty(false);
		  $scope.saveDialog.$promise.then(function(){
		      decorDataService.resetData();
		      $scope.saveDialog.hide();		      
		  })
	      },function(err){
		  //error occured
		  if(err.status==401){
		      //Unauthorized
		      $scope.saveDialog.hide();
		      $location.path('/login/');
		  }else if(err.status==403){
		      //forbidden, decor designed by another user
		      $scope.saveDialog.hide();
		      $location.path('/');
		      $alert({
			  title: 'Error occurred while saving!',
			  content: 'You can not save a decor designed by somebody else.',
			  placement: 'top-left',
			  type: 'danger',
			  duration: 3
		      });
		  }else if(err.status==409){
		      //recaptcha failed
		      vcRecaptchaService.reload($scope.recaptcha.widgetId);
		  }else{
		      $alert({
			  title: 'Error occurred while saving!',
			  content: err.data? err.data.message : err,
			  placement: 'top-left',
			  type: 'danger',
			  duration: 3
		      });
		  }
	      });
	      /*$http.put('/db/collections/decors/'+$scope.decor_id,$scope.data)
		  .success(function(data,status,headers,config){
		  })
		  .error(function(data,status,headers,config){
		      $scope.status = status;
		  });*/
	  }else{
	      //save a new decor
	      $scope.data.decor.user_id = $rootScope.currentUser._id;
	      $scope.data.decor.create_time = new Date();
	      $scope.data.decor.last_mod_time = new Date();
	      var data_n_captcha = {
		  data: $scope.data,
		  recaptcha_response: vcRecaptchaService.getResponse()
	      }
	      //new decorsListService($scope.data).$save().then(function(newData){
	      new decorsListService(data_n_captcha).$save().then(function(newData){
		  $scope.data = newData;
		  $scope.setDirty(false);
		  $scope.saveDialog.hide();
		  decorDataService.resetData();
	      },function(err){
		  //error occured
		  if(err.status==401){
		      //Unauthorized
		      $scope.saveDialog.hide();
		      $location.path('/login/');
		  }else if(err.status==409){
		      //recaptcha failed
		      vcRecaptchaService.reload($scope.recaptcha.widgetId);
		  }else{
		      $alert({
			  title: 'Error occurred while saving!',
			  content: err.data.message,
			  placement: 'top-left',
			  type: 'danger',
			  duration: 3
		      });
		  }
	      })
	      /*$http.post('/db/collections/decors',$scope.data)
		  .success(function(data,status,headers,config){
		      $scope.decor_id = data[0]._id;
		  })
		  .error(function(data,status,headers,config){
		      $scope.status = status;
		  });*/
	  }
      };

      $scope.deleteDecor = function(){
	  if($scope.decor_id){
	      $scope.data.$delete(function(){
		  //success callback
		  $alert({
		      title: 'Decor removed!',
		      content: 'Successfully removed decor from cloud.',
		      placement: 'top-right',
		      type: 'success',
		      duration: 3
		  });
		  decorDataService.resetData();
		  //need to change $scope.data to empty_data since locationchange event will assign it to cache
		  $scope.data = decorDataService.getData();
		  $location.path('/');
	      });
	  }
      };

      $scope.element_config = toolService.getTool("").current_config.install_supported_defs($scope.data.defs);

      $scope.initShadowStopColors = function(){
	  //initialize shadow stop colors to be the stopcolor1 and stopcolor2 of current selected color
	  if($scope.current.decor.line_element_id){
	      var ele = d3.select("g[decor_line_id='"+$scope.current.decor.line_id+"'][decor_line_element_id='"+$scope.current.decor.line_element_id+"']");
	      var stops = $scope.element_config.rgConfigured.stops;
	      var light = lightService.getLight(ele.data()[0].light_type);
	      var color_def = light.getColorDef(light.color);
	      if(color_def){
		  stops[0].color = utilService.hslStringToRgbString(color_def.stopcolor1);
		  stops[stops.length-1].color = utilService.hslStringToRgbString(color_def.stopcolor2);
	      }
	  }
      }

      $scope.shadowViewFunc = function(){
	  //attach confifigured shadow data to current decor_line_element
	  //console.log('shadow changed');
	  if($scope.current.decor.line_element_id){
	      //set shadow for this line element only if element_id is not null
	      var ele = d3.select("g[decor_line_id='"+$scope.current.decor.line_id+"'][decor_line_element_id='"+$scope.current.decor.line_element_id+"']");
	      var i = utilService.getArrayIndexWithPropertyEqualTo($scope.data.decor.decor_lines,"decor_line_id",$scope.current.decor.line_id);
	      var j = utilService.getArrayIndexWithPropertyEqualTo($scope.data.decor.decor_lines[i].elements,"id",$scope.current.decor.line_element_id);
	      $scope.data.decor.decor_lines[i].elements[j].shadow = angular.copy($scope.element_config.rgConfigured);
	      $scope.decor_line_element_enter_func($scope.current.decor.line_id);
	      if(angular.isDefined(ele)){
		  if(ele.data.length>0){
		      var d = ele.data()[0];
		      var light = lightService.getLight(d.light_type);
		      var stops = d.shadow.stops;
		      var bulb_color = ele.attr("bulbcolor");
		      var color_def = light.getColorDef(bulb_color);
		      if(color_def){
			  stops[0].color = utilService.hslStringToRgbString(color_def.stopcolor1);
			      stops[stops.length-1].color = utilService.hslStringToRgbString(color_def.stopcolor2);
		      }
		  }
		  ele.call(light.turnon).call(light.flash).call(light.glow).call(light.castshadow).call(light.emitray);
	      }
	  }else{
	      if($scope.current.decor.line_id){
	          //set shadow for all line elements if element_id is null
		  var eles = d3.selectAll("g[decor_line_id='"+$scope.current.decor.line_id+"'].decor_line_element");
		  var i = utilService.getArrayIndexWithPropertyEqualTo($scope.data.decor.decor_lines,"decor_line_id",$scope.current.decor.line_id);
		  _.forEach($scope.data.decor.decor_lines[i].elements,function(ele){
		      ele.shadow = angular.copy($scope.element_config.rgConfigured);
		  });
		  $scope.decor_line_element_enter_func($scope.current.decor.line_id);
		  //eles is d3 selection, use each function to invoke lighting functions
		  eles.each(function(){
		      var ele = d3.select(this);
		      if(ele.data.length>0){
			  var d = ele.data()[0];
			  var light = lightService.getLight(d.light_type);
			  var stops = d.shadow.stops;
			  var bulb_color = ele.attr("bulbcolor");
			  var color_def = light.getColorDef(bulb_color);
			  if(color_def){
			      stops[0].color = utilService.hslStringToRgbString(color_def.stopcolor1);
			      stops[stops.length-1].color = utilService.hslStringToRgbString(color_def.stopcolor2);
			  }
		      }
		      ele.call(light.turnon).call(light.flash).call(light.glow).call(light.castshadow).call(light.emitray);
		  });
	      }
	  }
      };

      //current object contains current status of decor,widget and tool
      $scope.init_current = function(){
	  var current_op;
	  if($scope.current){
	      current_op = _.clone($scope.current.operation);
	  }
	  $scope.current = {
	      decor: {},
	      widget: {
		  //default at first subcat of Roof Lighting
		  line_type: 'Roof Lighting',
		  //line_subtype: 'Fascia'
	      },
	      operation: {
		  type: 'segment',//segment or set
	      },
	      animation: {
	      },
	      music: {
	      },
	      instructions: 'select one decoration widget above and start decorating!'
	  }
	  //set current operation back to operation before init_current
	  //because we call init_current after measureTool, the zoom info (translate and scale are saved in current operation)
	  if(current_op){
	      $scope.current.operation = current_op;
	  }
	  //TODO: need to show widget based on current selection
	  $scope.selectWidget('roof lighting');
	  $scope.selectTool("lineMultiTool");
	  //$scope.selectTool("shiningxmaslighttypetool");
      };
      //methods
      $scope.selectWidget = function(widget_name,donot_default_to_first_subcat){
	  $scope.current.widget.line_type = widget_name;
	  //by default show first subcat
	  var i = utilService.getArrayIndexWithPropertyEqualToIgnoreCase($scope.data.widgets,'name',widget_name),
	      widget = $scope.data.widgets[i];
	  if(widget){
	      if(widget.hasOwnProperty("subcats") && widget.subcats.length>0 && !donot_default_to_first_subcat && angular.isUndefined($scope.current.widget.line_subtype)){
		  //subtype is allowed to be first subtype and currently line_subtype not defined
		  $scope.current.widget.line_subtype = widget.subcats[0].name;
		  if($scope.current.widget.line_subtype){
		      $scope.selectSubCat($scope.current.widget.line_subtype);
		  }
	      }else{
		  //check whether the defined line_subtype belongs to the widget
		  if(!angular.isUndefined($scope.current.widget.line_subtype)){
		      var j = utilService.getArrayIndexWithPropertyEqualToIgnoreCase(widget.subcats,'name',$scope.current.widget.line_subtype);
		      if(angular.isUndefined(j) && !donot_default_to_first_subcat){
			  //did not find defined line_subtype in the widget, set to first subcat in widget
			  $scope.current.widget.line_subtype = widget.subcats.length>0? widget.subcats[0].name : undefined;
			  $scope.selectSubCat($scope.current.widget.line_subtype);
		      }else{
			  //found defined line_subtype in the widget, keep it
		      }
		  }
	      }
	  }
	  var ds = decorService.getDecor(widget_name);
	  $scope.current.instructions = ds? ds.instructions : "need to define " + widget_name + " decor service";
	  angular.forEach($scope.data.widgets,function(w){
	      w.show_detail = false;
	      if(w.name.toLowerCase()==widget_name.toLowerCase()){
		  w.show_detail = true;
	      }
	  });
	  //angularstrap collapse use activeWidget
	  $scope.data.widgets.activeWidget = i;
	  if(!$scope.$$phase){
	      $scope.$apply();
	  }
      };
      $scope.selectSubCat = function(subcat_name){
	  var subcat_toolname, widget_name;
	  if(subcat_name){
	      for(var i=0; i<$scope.data.widgets.length; i++){
		  var j = utilService.getArrayIndexWithPropertyEqualTo($scope.data.widgets[i].subcats,"name",subcat_name);
		  if(j!=undefined){
		      widget_name = $scope.data.widgets[i].name;
		      subcat_toolname = $scope.data.widgets[i].subcats[j].toolname;
		      break;
		  }
	      }
	      if(widget_name && subcat_name){
		  $scope.current.widget.line_type = widget_name;
		  $scope.current.widget.line_subtype = subcat_name;
		  //$scope.selectWidget(widget_name);  cannot select widget since it will select first subcat as default
		  if(subcat_toolname){
		      $scope.selectTool(subcat_toolname);
		  }else{
		      //default to shiningxmaslighttypetool
		      $scope.selectTool('shiningxmaslighttypetool');
		  }
	      }
	  }
      };
      $scope.selectTool = function(toolname){
	  //change current_config in toolService
	  var tool = toolService.getTool(toolname);
	  if(tool){
	      tool.beforeinvoke($scope).invoke().afterinvoke($scope);
	  }
      };
      $scope.getToolInstructions = function(toolname){
	  //change current_config in toolService
	  var tool = toolService.getTool(toolname);
	  return tool.instructions;
      };
      $scope.getToolIcon = function(toolname){
	  var tool = _.find($scope.data.tools,function(tool){return tool.name==toolname});
	  return tool.icon_toggle? tool.icons[1] : tool.icons[0];
      };
      $scope.mouseOverDecorLine = function(decor_line_id){
	  $scope.svg.select("g[decor_line_id='"+decor_line_id+"']").selectAll(".click-capture").style("visibility","visible").classed("highlighted",true);
      };
      $scope.mouseLeaveDecorLine = function(decor_line_id){
	  $scope.svg.select("g[decor_line_id='"+decor_line_id+"']").selectAll(".click-capture").style("visibility","hidden").classed("highlighted",false);
      };
      $scope.toggleDecorLine = function(decor_line_id){
	  var i = utilService.getArrayIndexWithPropertyEqualTo($scope.data.decor.decor_lines,"decor_line_id",decor_line_id);
	  var dl = $scope.svg.select("g[decor_line_id='"+decor_line_id+"']");
	  if(dl.attr("opacity") != null & dl.attr("opacity")!=1){
	      dl.transition().duration(500).attr("opacity",1);
	      $scope.data.decor.decor_lines[i].decor_line_visible = true;
	  }else{
	      dl.transition().duration(500).attr("opacity",0);
	      $scope.data.decor.decor_lines[i].decor_line_visible = false;
	  }
      };
      $scope.delDecorLine = function(decor_line_id){
	  var i = utilService.getArrayIndexWithPropertyEqualTo($scope.data.decor.decor_lines,"decor_line_id",decor_line_id);
	  while($scope.data.decor.decor_lines[i].elements.length > 0) {
	      $scope.data.decor.decor_lines[i].elements.pop();
	  }
	  $scope.decor_line_element_exit_func(decor_line_id);
      };
      /*$scope.selectDecorLine = function(decor_line){
	  //decor_line_type is fed from w.name
	  return decor_line.decor_line_type.toLowerCase() == $scope.current.widget.line_type.toLowerCase();
      };*/
      $scope.toolOfMode = function(tool){
	  return tool.modes.indexOf($scope.mode)!=-1;
      }
      $scope.toolWithOptions = function(tool){
	  return tool.options.length>0;
      };
      $scope.toolWithoutOptions = function(tool){
	  return tool.options.length==0;
      };
      $scope.isSubscribed = function(){
	  if($scope.data.subscribers){
	      return $scope.data.subscribers.indexOf($rootScope.currentUser._id) !== -1;
	  }else{
	      return false;
	  }
      };
      $scope.subscribe = function(){
	  //instead of sending whole decor data, only send _id
	  //subscriptionService.subscribe($scope.data).success(function(){
	  subscriptionService.subscribe({_id:$scope.data._id}).success(function(){
	      if(!$scope.data.subscribers){
		  $scope.data.subscribers=[];
	      }
	      $scope.data.subscribers.push($rootScope.currentUser._id);
	  })
      };
      $scope.unsubscribe = function(){
	  //subscriptionService.unsubscribe($scope.data).success(function(){
	  subscriptionService.unsubscribe({_id:$scope.data._id}).success(function(){
	      var index = $scope.data.subscribers.indexOf($rootScope.currentUser._id);
	      $scope.data.subscribers.splice(index,1);
	  })
      }
      $scope.thumbup = function(){
	  //instead of sending whole decor data, only send _id
	  //subscriptionService.thumbup($scope.data).success(function(){
	  if(!$scope.thumbed){
	      subscriptionService.thumbup({_id:$scope.data._id}).success(function(){
		  $scope.thumbed = true;
		  if(!$scope.data.thumbs){
		      $scope.data.thumbs={up:0,down:0};
		  }
		  $scope.data.thumbs.up++;
	      })
	  }
      };
      $scope.thumbdown = function(){
	  if(!$scope.thumbed){
	      subscriptionService.thumbdown({_id:$scope.data._id}).success(function(){
		  $scope.thumbed = true;
		  if(!$scope.data.thumbs){
		      $scope.data.thumbs={up:0,down:0};
		  }
		  $scope.data.thumbs.down++;	      
	      })
	  }
      }
      //query googleapi for address
      $scope.getAddress = function(viewValue){
	  var params = {address: viewValue, sensor: false};
	  return $http.get('http://maps.googleapis.com/maps/api/geocode/json',{params:params})
	    .then(function(res){
		return res.data.results.map(function(item){
		    return {
			label: item.formatted_address,
			coords: [item.geometry.location.lng,item.geometry.location.lat],
			//save lng,lat in coords for mongoose near search convenience
			//geo: item.geometry.location
		    };
		});
	    })
      }
      $scope.minmaxAd = function(){
	  $scope.minAdUnderDecor = !$scope.minAdUnderDecor;
      };

      $scope.minmaxAdIcon = function(){
	  return !$scope.minAdUnderDecor?"glyphicon glyphicon-remove":"glyphicon glyphicon-chevron-up";
      };

      $scope.minmaxAdClass = function(){
	  return !$scope.minAdUnderDecor?"ad_decor_max":"ad_decor_min";
      };

      $scope.selectMusic = function(musicname){
	  if(musicname){
	      var i = utilService.getArrayIndexWithPropertyEqualTo($scope.app_data.musics,"name",musicname);
	      if(i>=0){
		  $scope.data.decor.mediaurl = $scope.app_data.musics[i].url;
		  $scope.setDirty(true);
		  if($scope.current.music.track){
		      $scope.current.music.track.destruct();
		      $scope.current.music.track = undefined;
		      $scope.current.music.playing = false;;
		  }
	      }
	  }else{
	      $scope.selectTool('loadmediatool2');	      
	  }
      };

      $scope.musicInfo = function(){
	  var i = _.findIndex($scope.app_data.musics,function(music){return music.url === $scope.data.decor.mediaurl});
	  return i==-1? "loaded by " + $scope.data.decor.designer : $scope.app_data.musics[i].name + ' by ' + $scope.app_data.musics[i].author;
      };

      $scope.init_current();

    }]);

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

angular.module("lightgalaApp")
    .filter("formatNumberWithComma",function(){
	return function(x){
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
    })
    .controller('mainCtrl',['$rootScope','$scope','$location','$routeParams','$alert','decorsListService','utilService','uiGmapGoogleMapApi',function($rootScope,$scope,$location,$routeParams,$alert,decorsListService,utilService,uiGmapGoogleMapApi){
	if($routeParams.id){
	    $scope.decor_id_viewed = $routeParams.id
	}	

	//kludge to change searched subscribers for now
	$scope.menus = {
	    groups_login:[
		{group_name: "",
		 group_items: [
		     //decor_featured always no_user_limit regardless of login user
		     {item_name:"Decor Stars",icon:"glyphicon glyphicon-star",
		      features:[
			  {feature_name:"Daves Landscape",criteria:"Dave Rykbost",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Mike's Landscape Lighting",criteria:"Mike Brown",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Premium Lighting",criteria:"Emma Wang",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
		      ],
		      //status:"selected"
		     },
		     {item_name:"Most Popular",icon:"glyphicon glyphicon-heart",
		      features:[
			  {feature_name:"My Favorites",
			   criteria:function(){return ".gt('thumbs.up',100)"},
			   criteria_type:'mongoose_query',
			   decors:[]},
		      ],
		     },
		     {item_name:"Decors Nearby",icon:"glyphicon glyphicon-gift",
		      features:[
			  {feature_name:"Within 50 miles",
			   criteria:function(){
			       //return ".where('decor.address.coords').near({center: {type:'Point', coordinates: [" + $scope.decors[0].decor.address.geo.lng + "," + $scope.decors[0].decor.address.geo.lat + "]}, maxDistance: 50})"; 
			       //earth radius 3959 miles, maxdistance in radians. convert mile distance to radians: x_miles/3959
			       return $scope.decors.length>0?".where('decor.address.coords').near({center: [" + $scope.decors[0].decor.address.coords[0] + "," + $scope.decors[0].decor.address.coords[1] + "], maxDistance: 50/3959, spherical: true})":""; 
			   },
			   criteria_type:'mongoose_query',
			   decors:[]},
		      ],
		     },
		     {item_name:"My Subscription",icon:"glyphicon glyphicon-check",
		      features:[
			  {feature_name:"My Subscription",
			   criteria:function(){
			       return ".where({'subscribers': '"+ ($rootScope.currentUser ? $rootScope.currentUser._id : '') +"'})"
			   },
			   criteria_type:'mongoose_query',
			   no_user_limit:true,
			   decors:[]},
		      ],
		     }
		 ]},
		{group_name: "Decoration Pros",
		 group_items: [
		     {item_name:"Browse",icon:"glyphicon glyphicon-leaf",},
		     {item_name:"My Pros",icon:"glyphicon glyphicon-tree-deciduous",},
		     {item_name:"Rate",icon:"glyphicon glyphicon-thumbs-up",}
		 ]},
		{group_name: "",
		 group_items: [
		     {item_name:"Where is lit",icon:"glyphicon glyphicon-globe",templateUrl:"mainrightmap"},
		     {item_name:"Feedback",icon:"glyphicon glyphicon-comment",},
		     {item_name:"Share",icon:"glyphicon glyphicon-share-alt",}
		 ]},
	    ],
	    groups_nologin:[
		{group_name: "",
		 group_items: [
		     {item_name:"Decor Stars",icon:"glyphicon glyphicon-star",
		      features: [
			  {feature_name:"Daves Landscape",criteria:"Dave Rykbost",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Mike's Landscape Lighting",criteria:"Mike Brown",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Premium Lighting",criteria:"Emma Wang",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
		      ],
		      //status:"selected"
		     },
		     {item_name:"Most Popular",icon:"glyphicon glyphicon-heart",
		      features:[
			  {feature_name:"My Favorites",
			   criteria:function(){return ".gt('thumbs.up',100)"},
			   criteria_type:'mongoose_query',
			   no_user_limit:true,
			   decors:[]},
		      ],
		     },
		     {item_name:"Newly Added",icon:"glyphicon glyphicon-circle-arrow-up",
		      features: [
			  {feature_name:"Today",criteria:".gt('decor.last_mod_time',(new Date()).setDate((new Date()).getDate()-1))",criteria_type:'mongoose_query',no_user_limit:true,decors:[]},
			  {feature_name:"Past Week",criteria:".gt('decor.last_mod_time',(new Date()).setDate((new Date()).getDate()-7)).lt('decor.last_mod_time',(new Date()).setDate((new Date()).getDate()-1))",criteria_type:'mongoose_query',no_user_limit:true,decors:[]},
		      ]
		     }
		 ]},
		{group_name: "Decoration Pros",
		 group_items: [
		     {item_name:"Browse",icon:"glyphicon glyphicon-leaf",},
		     {item_name:"My Pros",icon:"glyphicon glyphicon-tree-deciduous",},
		     {item_name:"Rate",icon:"glyphicon glyphicon-thumbs-up",}
		 ]},
		{group_name: "",
		 group_items : [
		     {item_name:"Where is lit",icon:"glyphicon glyphicon-globe",templateUrl:"mainrightmap"},
		     {item_name:"Feedback",icon:"glyphicon glyphicon-comment",},
		     {item_name:"Share",icon:"glyphicon glyphicon-share-alt",}
		 ]},
	    ],
	};

	if($rootScope.currentUser){
	    $scope.menu_groups = $scope.menus.groups_login;
	}else{
	    $scope.menu_groups = $scope.menus.groups_nologin;
	}

	$scope.selectItem = function(item_name){
	    for(var i=0;i<$scope.menu_groups.length;i++){
		//clear selected status in the group first
		_.forEach($scope.menu_groups[i].group_items,function(item){
		    item.status = "";
		})
		var j = utilService.getArrayIndexWithPropertyEqualTo($scope.menu_groups[i].group_items,"item_name",item_name);
		if(j>=0){
		    $scope.menu_groups[i].group_items[j].status = 'selected';
		    //update decors_featured
		    if($scope.menu_groups[i].group_items[j].hasOwnProperty('features')){
			$scope.main_right_partial = 'mainrightshow';
			$scope.decors_featured = $scope.menu_groups[i].group_items[j].features;
		    }
		    if($scope.menu_groups[i].group_items[j].hasOwnProperty('templateUrl')){
			$scope.main_right_partial = $scope.menu_groups[i].group_items[j].templateUrl;
		    }
		}
	    }
	}

	//initilize decors_featured for decors to be shown in carousel by showing Most popular
	$scope.decors_featured = [];
	$scope.selectItem("Decor Stars");
	//$scope.decors_featured = $scope.menus.groups_nologin[0].group_items[0].features;
	//unfeatured decors
	$scope.decors = [];

	$scope.currentPage = -1;  //currentPage initially at -1
	$scope.loadTimes = 0;
	$scope.maxLoadTimes = 10;  //maximum show more 10 times to discourage endless loadMore

	$scope.excludeCurrentViewedDecor = function(decor){
	    return decor._id != $scope.decor_id_viewed;
	};

	$scope.allowLoadMore = function(){
	    return $scope.loadTimes < $scope.maxLoadTimes;
	}

	$scope.loadMoreDecors = function(){
	    $('#loadmoredecor').prop('disabled', true);
	    decorsListService.query({criteria: $scope.criteria, 
				     criteria_type: 'has_keyword', 
				     page:$scope.currentPage+1}).$promise.then(function(decors){
		$scope.decors = $scope.decors.concat(decors[0].decors);
		$scope.currentPage = parseInt(decors[0].page);
		if(decors[0].lastpage){
		    $scope.loadTimes = $scope.maxLoadTimes;
		}else{
		    $scope.loadTimes += 1;
		}
		$('#loadmoredecor').prop('disabled', false);

	        uiGmapGoogleMapApi.then(function(maps) {
		    var decors = $scope.decors;
		    if(decors.length>0){
			if(decors[0].decor.address.coords) {
			    $scope.map = { center: { latitude: decors[0].decor.address.coords[1], longitude: decors[0].decor.address.coords[0] }, 
					   zoom: 8,
					   bounds: { northeast: {latitude: _.max(decors,function(decor){return decor.decor.address.coords[1]}).decor.address.coords[1], 
								 longitude: _.max(decors,function(decor){return decor.decor.address.coords[0]}).decor.address.coords[0], 
								},
						     southwest: {latitude: _.min(decors,function(decor){return decor.decor.address.coords[1]}).decor.address.coords[1], 
								 longitude: _.min(decors,function(decor){return decor.decor.address.coords[0]}).decor.address.coords[0], 
								}
						   },
					   markers: _.pluck(decors,function(decor){
					       return {
						   id: decors.indexOf(decor),
						   decor_id: decor._id,
						   title: decor.decor.title,
						   coords: {
						       latitude:decor.decor.address.coords[1],
						       longitude:decor.decor.address.coords[0],
						   },
						   options: {
						       icon: {
							   url: '/img/maplight.png',
							   scaledSize: new google.maps.Size(28,28)
						       }
						   }
					       };
					   }),
					   windowOptions: {
					       visible: false
					   },
					   onClick: function(){
					       this.windowOptions.visible = !this.windowOptions.visible;
					   },
					   closeClick: function(){
					       this.windowOptions.visible = false;
					   }
					 }//end scope.map
			} //end if ...coords
		    };//if decors.length>0
		});
	    },function(err){
		$('#loadmoredecor').prop('disabled', false);
		$alert({
		    title: 'Error occurred while retrieving decor!',
		    content: err.data.message,
		    placement: 'top-right',
		    type: 'danger',
		    duration: 3
		});
	    });
	};

	$scope.loadMoreDecors();

	//navbarCtrl search update criteria and decors
	$scope.$on("searchcriteriachanged",function(event,args){
	    $scope.criteria = args.criteria;
	});

	$scope.$on("decorslistchanged",function(event,args){
	    //$scope.decors = args.decors;
	    $scope.decors = args.decors[0].decors;
	    $scope.loadTimes = 0;
	    $scope.currentPage = 0;
	});

	//enhance ui-bootstrap carousel to handle multiple image by collecting decors in each feature in decors_featured into groups
	$scope.myInterval = 15000;
	$scope.numDecorsEachFrame = 4;

	$scope.decors_watch_list = [];
	$scope.prepare_decors_featured = function(){
	    _.forEach($scope.decors_watch_list,function(unwatch){
		unwatch();
	    });
	    $scope.decors_watch_list = [];
	    var group_decors_in_feature = function(feature){
		$scope.decors_watch_list.push($scope.$watch(function(){return feature.decors}, function(values) {
		    //a contains frames of decors: [[decor1,decor2,decor3],[decor4,decor5]], ie a = [b,b,b]
		    //b contains each frame of multiple decors [decor1,decor2,decor3]
		    var i, a = [];
	    
		    for (i = 0; i < feature.decors.length; i += $scope.numDecorsEachFrame) {
			var b = [];  
		
			for (var j=0;j<$scope.numDecorsEachFrame;j++){
			    if(feature.decors[i+j]){
				b.push(feature.decors[i+j]);
			    }
			}

			a.push(b);
		    }

		    feature.groupedDecors = a;
		}, true));
	    };

	    for(var i=0;i<$scope.decors_featured.length;i++){
		//decorsListService.query({criteria: $scope.decors_featured[i].criteria, page:0}).$promise.then((function(i){
		decorsListService.query({criteria: $scope.decors_featured[i].criteria instanceof Function? $scope.decors_featured[i].criteria() : $scope.decors_featured[i].criteria, 
					 criteria_type: $scope.decors_featured[i].criteria_type, 
					 no_user_limit: $scope.decors_featured[i].no_user_limit, 
					 page:0}).$promise.then((function(i){
		    return function(decors){
			$scope.decors_featured[i].decors = decors[0].decors;
			$scope.decors_featured[i].page = parseInt(decors[0].page);
			//carousel show decors in feature by groups
			group_decors_in_feature($scope.decors_featured[i]);
		    }})(i),function(err){
		    });
	    }
	};

	$scope.$watch(function(){
	    return _.map($scope.decors_featured,function(feature){return feature.feature_name});
	},$scope.prepare_decors_featured,true);

    }]);

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

angular.module('lightgalaApp')
   .controller('signupCtrl',['$scope','Auth',function($scope,Auth){
       $scope.signup = function(){
	   Auth.signup({
	       email: $scope.email,
	       password: $scope.password
	   });
       };
}]);

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

//d3 service provided by angular
angular.module('d3',[])
.factory('d3Service',['$document','$q','$rootScope',function($document,$q,$rootScope){
  var ds = [$q.defer()];
  //var d3srcs = ['http://d3js.org/d3.v3.min.js']
  var d3srcs = ['/js/lib/d3.js']
  var onscriptloadfuncs = [];
  //create the script tags for d3 libraries
  var s = $document[0].getElementsByTagName('head')[0];
  for (var i=0;i<d3srcs.length;i++){
    onscriptloadfuncs[i] = (function(){
      var index = i;
      return function(){
        //signals that the deferred activity has completed with the value d3
        $rootScope.$apply(function(){ds[index].resolve(window.d3);});
      }
    })();
    var scriptTag = $document[0].createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.async = true;
    scriptTag.src = d3srcs[i];
    scriptTag.onreadystatechange = function(){
      if (this.readyState == 'complete') onscriptloadfuncs[i]();
    }
    scriptTag.onload = onscriptloadfuncs[i];
    s.appendChild(scriptTag);
  }

  return {
    desc: function() {return "d3service"},
    d3: function() {return $q.all([ds[0].promise]).then(function(d3s){
	//return d3s[0];
	var d3 = d3s[0];
	//d3.ns.prefix = "http://www.w3.org/2000/svg";
	//d3.ns.prefix.xlink = "http://www.w3.org/1999/xlink";
	//extend d3
	d3.selection.prototype.moveToBack = function() {
	    return this.each(function(){
		this.parentNode.insertBefore(this, this.parentNode.firstChild);
	    });
	};

	d3.selection.prototype.moveToFront = function() {
	    //not used
	    return this.each(function(){
		this.parentNode.append(this);
	    });
	};

	d3.selection.prototype.size = function() {
	    var n = 0;
	    this.each(function() { ++n; });
	    return n;
	};

	d3.selection.prototype.maxSegment = function() {
	    var n = 0;
	    this.each(function() {
		var m = parseInt(d3.select(this).attr("segment"));
		if(m>n){
		    n = m;
		}
	    });
	    return n;
	};

	d3.selection.prototype.maxGroup = function() {
	    var n = 0;
	    this.each(function() {
		var m = parseInt(d3.select(this).attr("group"));
		if(m>n){
		    n = m;
		}
	    });
	    return n;
	};

	d3.selection.prototype.cloneTo = function(another_selection, i) {
	    //clone this selection (including children) and append to another selection
            // Assume the selection contains only one object, or just work
            // on the first object. 'i' is an index to add to the id of the
            // newly cloned DOM element.
	    var attr = this.node().attributes;
	    var length = attr.length;
	    var node_name = this.property("nodeName");
	    var cloned = another_selection.append(node_name);
	    if(i){
                cloned.attr("id", this.attr("id") + "-" + i);
	    }
	    for (var j = 0; j < length; j++) { // Iterate on attributes and skip on "id"
		if (attr[j].nodeName == "id") continue;
		cloned.attr(attr[j].name,attr[j].value);
	    }
	    //clone children recursively
	    for(var k = 0; k<this.node().children.length; k++){
		d3.select(this.node().children[k]).cloneTo(cloned,null);
	    }
	    //return this;
	    return cloned;
	};

	return d3;
    })}
  }
}])

//this service holds the decor data, can be used as a staging area for data for multiple controllers to access
angular.module("lightgalaApp")
  .factory('decorDataService',function(){
      //initial data for new decor
      var data_empty = {decor:{//designer: 'spearsear',
	                       //backgroundurl : "/img/house.jpg",
	                       views: 0,
			    /*order_lines: [{order_line_id: 1, category: 'Roof Lighting', sub_category: 'Fascia', qty: '20', price: '1.99'},
					  {order_line_id: 2, category: 'Roof Lighting', sub_category: 'Ridges', qty: '20', price: '1.99'},
					  {order_line_id: 3, category: 'Tree Lighting', sub_category: 'Canopy w/ C-9', qty: '40', price: '2.99'},
					  {order_line_id: 4, category: 'Shrubs', sub_category: '', qty: '30', price: '1.99'},
					  {order_line_id: 5, category: 'Ground Lighting', sub_category: 'Stakes', qty: '10', price: '3.99'}
					 ],*/
			    decor_width: 941,  //svg width captured when user save the decor, decor_line coordinates are based on this width
			    decor_aspect_ratio: 0.65,  //picture background default aspect ratio
			    decor_lines: [/*{decor_line_id: 1, 
					   decor_line_type: 'roof lighting',
					   elements: [//{id: 1, type: 'C1', color: 'red', x: 12, y: 88, w: 8, h: 10, scale_factor: 0.3},
						      //{id: 2, type: 'C1', color: 'red', x: 22, y: 88, w: 8, h: 10, scale_factor: 0.3},
						      //{id: 3, type: 'C1', color: 'red', x: 32, y: 88, w: 8, h: 10, scale_factor: 0.3},
						     ],
					   },*/
					 ]
			   }, //end decor
		     //widgets contain line categories and other common tools
		     widgets:[
			 {id: 1, name: "Windows/Features", subcats:[
			  ],
			  instructions: ''
			 },
			 {id: 2, name: "Daytime Decor", subcats:[
			     //name should be tool_name in toolService
			     {name: 'Garland', toolname: 'fancygarlandimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Fancy Wreath', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 24"', toolname: '24inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 30"', toolname: '30inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 36"', toolname: '36inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 48"', toolname: '48inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 60"', toolname: '60inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 24" Battery w/ Picks', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows 12"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows 18"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bow 24"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows structural 24"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows structural 36"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Sprays 24"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Baskets', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Pre lit Tree', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Decor Mesh', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Mixed grn/bry/pine cone Picks', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bulbs', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 3, name: "Roof Lighting", subcats:[
			     {name: "Fascia",price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: "Ridges",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 4, name: "Tree Lighting", subcats:[
			     {name: "Canopy w/ C-9",price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: "Trunk Wrap",price: 1.2, icon: 'glyphicon-tree-conifer'},			     
			     {name: "Branch Wrap",price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: "Canopy w/ C-9 Evergreen",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 5, name: "Ground Lighting", subcats:[
			     {name: "",price: null, icon: 'glyphicon-tree-conifer'},
			     {name: "Stakes",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 6, name: "Shrubs", subcats:[
			  ],
			  instructions: '',
			 },
			 {id: 7, name: "Timers", subcats:[
			     {name: "Water proof boxes",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
		     ],
		     //tools contain tools for decoration
		     tools:[
			 {id: 0, name: "shiningxmaslighttypetool", icons: ['icon-shiningxmaslight'], options:[], modes: ['edit']},
			 {id: 1, name: "basicxmaslighttypetool", icons: ['icon-basicxmaslight'], options:[], modes: ['edit']},
			 {id: 2, name: "basicgroundlighttypetool", icons: ['icon-basicgroundlight'], options:[], modes: ['edit']},
			 {id: 3, name: "sizeuptool", icons: ['icon-expand'], options:[], modes: ['edit']},
			 {id: 4, name: "sizedowntool", icons: ['icon-contract'], options:[], modes: ['edit']},
			 {id: 4.5, name: "shadowsizeuptool", icons: ['icon-shadowup'], options:[], modes: ['edit']},
			 {id: 4.6, name: "shadowsizedowntool", icons: ['icon-shadowdown'], options:[], modes: ['edit']},
			 {id: 5, name: "gapuptool", icons: ['icon-expand2'], options:[], modes: ['edit']},
			 {id: 6, name: "gapdowntool", icons: ['icon-contract2'], options:[], modes: ['edit']},
			 {id: 6.1, name: "setsizeuptool", icons: ['icon-setsizeup'], options:[], modes: ['edit']},
			 {id: 6.2, name: "setsizedowntool", icons: ['icon-setsizedown'], options:[], modes: ['edit']},
			 {id: 7, name: "rotatetool", icons: ['icon-sharable'], options: [
			     {name: "rotatelefttool", icon: 'icon-undo'},
			     {name: "rotaterighttool", icon: 'icon-redo'},
			     {name: "rotaterandomtool", icon: 'icon-shuffle'},
			 ], modes: ['edit']},
			 {id: 11, name: "lineonetool", icons: ['icon-dot'], options:[], modes: ['edit']},
			 {id: 12, name: "linemultitool", icons: ['icon-ellipsis'], options:[], modes: ['edit']},
			 {id: 13, name: "polymultitool", icons: ['icon-polymulti'], options:[], modes: ['edit']},
			 {id: 14, name: "measuretool", icons: ['icon-measurement-tape'], options:[], modes: ['edit']},
			 //icons are used when user click on the tool
			 {id: 15, name: "animatestarttool", icons: ['glyphicon glyphicon-play', 'glyphicon glyphicon-pause'], options:[], modes: ['edit','play']},
			 {id: 16, name: "nighttool", icons: ['icon-moon', 'icon-sun'], options:[], modes: ['edit','play']},
			 {id: 17, name: "musictool", icons: ['icon-music', 'icon-pause'], options:[], modes: ['donotshow']},
			 {id: 17.5, name: "volumeonofftool", icons: ['glyphicon glyphicon-volume-off', 'glyphicon glyphicon-volume-up'], options:[], modes: ['edit','play']},
			 {id: 18, name: "colorchoosertool", icons: ['icon-palette'], options: [
			    {name: 'yellowcolortool', icon: 'icon-danielbruce icon-yellow'},
			    {name: 'orangecolortool', icon: 'icon-danielbruce icon-orange'},
			    {name: 'bluecolortool', icon: 'icon-danielbruce icon-blue'},
			    {name: 'redcolortool', icon: 'icon-danielbruce icon-red'},
			    {name: 'greencolortool', icon: 'icon-danielbruce icon-green'},
			    {name: 'purplecolortool', icon: 'icon-danielbruce icon-purple'},
			    {name: 'whitecolortool', icon: 'icon-danielbruce icon-white'},
			    {name: 'randomcolortool', icon: 'icon-danielbruce icon-randomcolor'},
			    {name: 'rgbcolortool', icon: 'icon-danielbruce icon-rgbcolor'}], modes: ['edit']
			 },
			 {id: 19, name: "weathertool", icons: ['icon-soundcloud'], options: 
			   [{name: 'snowtool', icon: 'icon-pawn'},
			    {name: 'raintool', icon: 'icon-droplets'},
			    {name: 'sunnytool', icon: 'icon-sun'}], modes: ['edit','play']
			 },
			 {id: 21, name: "savetool", icons: ['icon-disk'], options:[], modes: ['edit']},
			 {id: 22, name: "deletetool", icons: ['glyphicon glyphicon-trash'], options:[], modes: ['edit']},
			 {id: 23, name: "cameratool", icons: ['icon-camera'], options:[], modes: ['edit']},
			 {id: 24, name: "loadmediatool", icons: ['icon-music'], options:[], modes: ['edit']},
			 {id: 25, name: "exittool", icons: ['icon-exit'], options:[], modes: ['edit']},
		     ],
		     defs: [
			 {type: "radialGradient",
			  desc: "definitions of supported colors used in lighting effects rendered as radial gradient",
			  attributes : [
			      {id:'lightflash-blue',colorname:'blue',stopcolor1:'hsl(200, 99%, 23%)',stopcolor2:'hsl(200, 99%, 63%)',dur:'1.8s',begin:'0s',animate:true},
			      {id:'lightflash-red',colorname:'red',stopcolor1:'hsl(6, 63%, 16%)',stopcolor2:'hsl(6, 63%, 56%)',dur:'1.25s',begin:'0s',animate:true},
			      {id:'lightflash-yellow',colorname:'yellow',stopcolor1:'hsl(48, 89%, 20%)',stopcolor2:'hsl(48, 89%, 70%)',dur:'1.25s',begin:'0s',animate:true},
			      {id:'lightflash-orange',colorname:'orange',stopcolor1:'hsl(28, 90%, 22%)',stopcolor2:'hsl(28, 90%, 62%)',dur:'1.75s',begin:'0s',animate:true},
			      {id:'lightflash-green',colorname:'green',stopcolor1:'hsl(145, 83%, 24%)',stopcolor2:'hsl(145, 83%, 66%)',dur:'1.5s',begin:'0s',animate:true},
			      {id:'lightflash-purple',colorname:'purple',stopcolor1:'hsl(282, 100%, 21%)',stopcolor2:'hsl(282, 100%, 71%)',dur:'1.8s',begin:'0s',animate:true},
			      {id:'lightflash-white',colorname:'white',stopcolor1:'hsl(0, 0%, 43%)',stopcolor2:'hsl(0, 100%, 100%)',dur:'1.9s',begin:'0s',animate:true},
			      {id:'lightflash-rgb',colorname:'rgb',stopcolor1:'hsl(6, 63%, 56%)',stopcolor2:'hsl(200, 99%, 63%)',dur:'1s',begin:'0s',animate:true},
			  ]},
		     ],
		     animations: [
			 //initial animations at start_second=0 will be initialized from defs[0].attributes
			 //{anim_id: 'allblue', decor_line_id: 1, color: 'blue', start_second: 10, config: {desc:'lightflash-blue',colorname:'blue',stopcolor1:'hsl(204, 70%, 23%)',stopcolor2:'hsl(204, 70%, 83%)',dur:'1.8s',begin:'0s',animate:true,pattern_code:'10110'}},
			 //{anim_id: 'allwhite', decor_line_id: 1, color: 'white', start_second: 10, config: {desc:'lightflash-white',colorname:'white',stopcolor1:'hsl(0, 0%, 43%)',stopcolor2:'hsl(0, 100%, 100%)',dur:'1.9s',begin:'0s',animate:true,pattern_code:'10110'}},
		     ],
		     links: [
			 {id: 1, name: "map"},
			 {id: 2, name: "pic2"},
		     ]
		    }; //end data
      //application data should store data such as tools, widgets, musics etc
      var app_data = {
	  musics: [{name:"Christmas Morning",author:"Paul Gentry",url:"/img/PaulGentry_ChristmasMorning.mp3"},
		   {name:"The Shepherds Song",author:"Paul Gentry",url:"/img/PaulGentry_TheShepherdsSong.mp3"},
		   {name:"The Christmas Song",author:"",url:"/img/TheChristmasSong.wav"},
		   {name:"I Wonder As I Wander",author:"Richard Souther",url:"/img/RichardSouther_IWonderAsIWander.mp3"},
		   {name:"Joy To The World",author:"Louis Landon",url:"/img/LouisLandon_JoyToTheWorld.mp3"},
		   {name:"Silent Night",author:"Michele McLaughlin",url:"/img/MicheleMcLaughlin_SilentNight.mp3"},
		   {name:"What Child Is This",author:"Denny Jiosa",url:"/img/DennyJiosa_WhatChildIsThis.mp3"},
		   {name:"The First Noel",author:"Michael Dulin",url:"/img/MichaelDulin_TheFirstNoel.mp3"},
		   {name:"Angels We Have Heard On High",author:"Solomon Keal",url:"/img/AngelsWeHaveHeardOnHigh_SolomonKeal.mp3"},
		   {name:"Away In A Manger",author:"Joe Bongiorno",url:"/img/JoeBongiorno_AwayInAManger.mp3"},
		   {name:"Carol Of The Bells",author:"Doug Hammer",url:"/img/DougHammer_CarolOfTheBells.mp3"},
		   {name:"O Little Town Of Bethlehem",author:"Jennifer Haines",url:"/img/JenniferHaines_OLittleTownOfBethlehem.mp3"},
		  ],
      };
      app_data.widgets = angular.copy(data_empty).widgets;
      app_data.tools = angular.copy(data_empty).tools;
      app_data.defs = angular.copy(data_empty).defs;
      return {
	  data: angular.copy(data_empty),  //keep data_empty as immutable
	  app_data: app_data,
	  //decor data methods
	  getData: function(){
	      return this.data;
	  },
	  setData: function(newData){
	      //cache newData in data
	      this.data = newData;
	  },
	  resetData: function(){
	      this.data = angular.copy(data_empty);
	  },
	  resetAppData: function(){
	      //use specific appdata
	      app_data.widgets = angular.copy(data_empty).widgets;
	      app_data.tools = angular.copy(data_empty).tools;
	  },
	  //app data methods
	  getAppData: function(){
	      return this.app_data;
	  },
      }
  });

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

/*
 *   this file define decorService which provide various kinds of decor such as tree lighting, roof lighting etc
 */
angular.module("lightgalaApp")
  .factory("decorService",['$window','lightService','lightAnimService','utilService',function($window,lightService,lightAnimService,utilService){
    //base decor object created thru object literal
    var basicDecor = {
	//elementMakeFunc is factory func which generate a func to append light svg to argument passed to it
	elementMakeFunc: function(){
	    var self=this;
	    return function(){
		var args = Array.prototype.slice.call(arguments,0);
		var light = self.elementConfig.uselight;
		light.makeLightFunc.apply(light,args);  //append light svg element to argument of this func
	    }
	},
	//elementUpdateFunc is factory func which generate a func to update light svg under dom tree of argument passed to it
	elementUpdateFunc: function(){
	    var self=this;
	    return function(){
		var args = Array.prototype.slice.call(arguments,0);
		var light = self.elementConfig.uselight;
		light.updateLightFunc.apply(light,args);
	    }
	},
	config: function(cfg){
	    //config elemetConfig object
	    var self=this;
	    for(key in cfg){
		if(cfg.hasOwnProperty(key)){
		    self.elementConfig[key] = cfg[key];
		}
	    }
	    if("light_type" in self.elementConfig){
		self.elementConfig.uselight = lightService.getLight(self.elementConfig.light_type).initColors(cfg.defs);
	    }
	    if("color" in self.elementConfig && "uselight" in self.elementConfig){
		self.elementConfig.uselight.color = self.elementConfig.color;
	    }
	    if("scale_factor" in self.elementConfig && "uselight" in self.elementConfig){
		self.elementConfig.uselight.scaleFactor = self.elementConfig.scale_factor;
	    }
	    return this;
	},
	makeOneElementAt: function(elements,at_position,ele_cfg,tag,segment,set,group){
	    var j = elements.length + 1;
	    //where w and h are not used for now
	    return {//id: j, 
		    id: utilService.uniqueId(j),   //make unique id so d3 enter cycle will not miss an element
		    light_type: ele_cfg.uselight.light_type, 
		    light_subtype: ele_cfg.uselight.light_subtype, 
		    light_unbreakable: ele_cfg.uselight.light_unbreakable? ele_cfg.uselight.light_unbreakable : false,
		    light_unlightable: ele_cfg.uselight.light_unlightable? ele_cfg.uselight.light_unlightable : false,
		    light_unflashable: ele_cfg.uselight.light_unflashable? ele_cfg.uselight.light_unflashable : false,
		    color: ele_cfg.uselight.color, 
		    scale_factor: ele_cfg.uselight.scaleFactor, 
		    rotate_degree: ele_cfg.rotate_degree,
		    x: at_position.x, 
		    y: at_position.y, 
		    w: 8, 
		    h: 10,
		    segment: segment, //after click, elements created along traceline belongs to a segment
		    set: set,         //after dblclick, elements created along tracelines belongs to a set, preserving segment of the from_element
		    group: group,     //after dblclick, multiple groups along tracelines could be generated (separated by gap), forming a set
	            tag: tag, 		    //tag: 'interpolated','original'
		    scale_factor_shadow: ele_cfg.scale_factor_shadow,
		    shadow: angular.copy(ele_cfg.rgConfigured)
	    };
	},
	convertElementToConfig: function(ele){
	    //element is created using an ele_cfg at makeOneElementAt function
	    //this func regenerate the ele_cfg from element
	    //this func is useful since the element could be used to create an ele_cfg in set operation (see inside lineMulti)
	    //so we do not have to store uselight in the element
	    return {uselight: {light_type: ele.light_type, 
			       light_subtype: ele.light_subtype, 
			       light_unbreakable: ele.light_unbreakable,
			       light_unlightable: ele.light_unlightable,
			       light_unflashable: ele.light_unflashable,
			       color: ele.color,
			       scaleFactor: ele.scale_factor,
			      },
		    rotate_degree: ele.rotate_degree,
		    scale_factor: ele.scale_factor,
		    scale_factor_shadow: ele.scale_factor_shadow,
		    rgConfigured: angular.copy(ele.shadow)
		   };
	},
	updateElementWithConfig: function(ele,ele_cfg){
	    for(key in ele_cfg){
		if(ele_cfg.hasOwnProperty(key) & ele.hasOwnProperty(key)){
		    ele[key] = ele_cfg[key];
		}
	    }
	},
	distElements: function(ele_1,ele_2){
	    return Math.round(Math.sqrt(Math.pow((ele_2.y-ele_1.y),2) + Math.pow((ele_2.x-ele_1.x),2)));
	},
	operationType: function(from_elements){
	    return from_elements && from_elements.length>1? 'set' : 'segment';
	},
	//lineOne: append one light into elements for each element in from_elements
	//lineMulti: append several lights on a line into elements for each element in from_elements
	//polyMulti: append several lights inside a polygon into elements for each element in from_elements
	//where: hinge_element is used to calculate offset for each element in from_elements
	//       from_elements is used as the start point, then decor elements until to_position+offset
	lineOne: function(elements,to_position,exclude_to_position,ele_cfg,hinge_element,from_elements){
	    var segment = 0, set = 0, group=0, op_type = this.operationType(from_elements);
	    if(from_elements && hinge_element){
		if(op_type=='set'){
		    //set operation must have non-empty from_elements which all belongs to the same set
		    //set = from_elements[0].set+1;
		    //but need to consider copying from a middle set, so could not simply use from_elements[0].set+1
		    var sets = _.pluck(elements,function(ele){return ele.set});
		    set = _.max(sets)+1;
		    var groups = _.pluck(elements,function(ele){return ele.group});
		    group = _.max(groups)+1;
		}else{
		    //segment operation belong to same set and increment segment
		    set = hinge_element? hinge_element.set : 0;
		    group = hinge_element? hinge_element.group : 0;
		    segment = hinge_element.segment + 1;
		}
		for(var i=0;i<from_elements.length;i++){
		    if(!exclude_to_position){
			var ele = from_elements[i];
			var ele_cfg_cp = op_type=='set'? this.convertElementToConfig(ele) : ele_cfg;
			var offset = op_type=='set'? [(ele.x-hinge_element.x)*ele_cfg.set_scale_factor,(ele.y-hinge_element.y)*ele_cfg.set_scale_factor] : [ele.x-hinge_element.x,ele.y-hinge_element.y];
			var to_position_with_offset = {x:to_position.x + offset[0],y: to_position.y + offset[1]};
			//set opertion preserve segment from from_element
			segment = op_type=='set'? ele.segment: segment;
			elements.push(this.makeOneElementAt(elements,to_position_with_offset,ele_cfg_cp,'original',segment,set,group));
		    }		    
		};
	    }else{
		if(!exclude_to_position){
		    elements.push(this.makeOneElementAt(elements,to_position,ele_cfg,'original',segment,set,group));
		}
	    }
	},
	lineMulti: function(elements,to_position,exclude_to_position,ele_cfg,hinge_element,from_elements){
	    var segment = 0, set_from = 0, set = 0, group_from = 0, group = 0, op_type = this.operationType(from_elements);
	    //insert several new element to elements up to to_position
	    if(from_elements && hinge_element){
		if(op_type=='set'){
		    //set operation must have non-empty from_elements which all belongs to the same set
		    //set_from = from_elements[0].set+1;
		    //but need to consider copying from a middle set, so could not simply use from_elements[0].set+1
		    var sets = _.pluck(elements,function(ele){return ele.set});
		    set_from = _.max(sets);
		    var groups = _.pluck(elements,function(ele){return ele.group});
		    group_from = _.max(groups);
		}else{
		    //segment operation use same set and group of hinge_element, increment segment
		    set_from = hinge_element? hinge_element.set : 0;
		    group_from = hinge_element? hinge_element.group : 0;
		    segment = hinge_element.segment + 1;
		}
		//num_decors is the same for all ele in from_elements (for set operation)
		var num_decors=0, step_x=0, step_y=0;
		for(var i=0;i<from_elements.length;i++){
		    var ele = from_elements[i],
			//for set operation, preserve segment and tag from from_element
			segment = op_type=='set'? ele.segment: segment,
			//tag = op_type=='set'? ele.tag: 'interpolated',
		        tag = ele.tag,
			//offset = [ele.x-hinge_element.x,+ele.y-hinge_element.y],
		        offset = op_type=='set'? [(ele.x-hinge_element.x)*ele_cfg.set_scale_factor,(ele.y-hinge_element.y)*ele_cfg.set_scale_factor] : [ele.x-hinge_element.x,ele.y-hinge_element.y],
			to_position_with_offset = {x:to_position.x + offset[0],y: to_position.y + offset[1]};
	            num_decors = num_decors==0? Math.round(this.distElements(ele,to_position_with_offset) / ele_cfg.gap) : num_decors,
	            step_x = (to_position_with_offset.x - ele.x) / num_decors,
	            step_y = (to_position_with_offset.y - ele.y) / num_decors;
		    //change ele segment to segment+1 so it mingles with decored elements
		    var hinge_ele_index = _.findIndex(elements,function(ele){return _.isEqual(ele,hinge_element)});
		    elements[hinge_ele_index].segment = segment;
		    //use corresponding ele in from_element as ele_cfg, ie, take its color,rotate_degree,scalefactor  ??? HOWTO
		    var ele_cfg_cp = op_type=='set'? this.convertElementToConfig(ele) : ele_cfg;
		    if(exclude_to_position){
			num_decors = num_decors - 1;
		    }
		    for(var j=0;j<num_decors;j++){
			//reset tag to tag of ele since each iteration potentially can change tag
		        tag = ele.tag;
			set = op_type=='set'? set_from + 1 : set_from;
			group = op_type=='set'? group_from + j + 1 : group_from;
			//update last_ele and calculate new element pos
			var at_pos = {x:ele.x+(j+1)*step_x, y:ele.y+(j+1)*step_y};
			//no need to set original since tag will be preserved from from_elements
			/*if(!exclude_to_position && j == num_decors-1){
			    tag = 'original';
			}*/
			if(j != num_decors-1){
			    tag = 'interpolated';
			}else{
			    //last decor point original only for segment operation
			    tag = op_type=='set'?tag:'original';
			}
			elements.push(this.makeOneElementAt(elements,at_pos,ele_cfg_cp,tag,segment,set,group));
		    }
		};
	    }else{
		var last_ele = elements.length>0 ? elements[elements.length-1] : undefined,
	            num_decors = last_ele? Math.round(this.distElements(last_ele,to_position) / ele_cfg.gap) : 1,
	            step_x = last_ele? (to_position.x - last_ele.x) / num_decors : to_position.x,
	            step_y = last_ele? (to_position.y - last_ele.y) / num_decors : to_position.y,
	            tag = 'interpolated';
		//mingle last_ele with the new decorated segment
		segment = last_ele? last_ele.segment+1 : segment;
		if(last_ele){
		    last_ele.segment = segment;
		}
		if(exclude_to_position){
		    num_decors = num_decors - 1;
		}
		for(var i=0;i<num_decors;i++){
		    //update last_ele and calculate new element pos
		    last_ele = elements.length>0 ? elements[elements.length-1] : undefined;
		    var at_pos = last_ele? {x:last_ele.x+step_x, y:last_ele.y+step_y} : {x:step_x, y:step_y};
		    if(!exclude_to_position && i == num_decors-1){
			tag = 'original';
		    }
		    elements.push(this.makeOneElementAt(elements,at_pos,ele_cfg,tag,segment,set_from,group));
		}
	    }
	},
	polyMulti: function(elements,to_position,exclude_to_position,ele_cfg,hinge_element,from_elements){
	    var polymulti = function(elements,to_position,exclude_to_position,ele_cfg,hinge_element,from_elements){
		//insert several new element to elements inside polygon formed by points in elements
		this.lineMulti(elements,to_position,exclude_to_position,ele_cfg,hinge_element,from_elements);
		//reset all segment of original points generated from lineMulti to 0
		_.forEach(elements,function(ele){
		    ele.segment = 0;
		})
		from_elements = _.filter(from_elements,function(ele){return _.isObject(ele)});
		var set_last = _.max(_.pluck(elements,function(ele){return ele.set}));
		//var set = from_elements.length>0? from_elements[0].set : set_last;
		var set = hinge_element? hinge_element.set : set_last;
		var group_last = _.max(_.pluck(elements,function(ele){return ele.group}));
		var group = hinge_element? hinge_element.group : group_last;
		var group_elements = _.filter(elements,function(ele){return ele.tag=='original' && ele.set==set && ele.group==group});
		//remove interpolated elements on the line before interpolate inside the polygon
		utilService.removeArrayElementSatisfy(elements,function(d){return d.tag=='interpolated' && d.set==set && d.group==group});
		//from_elements is a set only when it has multiple elements
		var maxmin_x = utilService.maxmin(group_elements,function(e){return e.x}),
	            maxmin_y = utilService.maxmin(group_elements,function(e){return e.y});

		var topleft = {x:maxmin_x.min,y:maxmin_y.min},
	            topright = {x:maxmin_x.max,y:maxmin_y.min},
	            bottomleft = {x:maxmin_x.min,y:maxmin_y.max},
	            bottomright = {x:maxmin_x.max,y:maxmin_y.max},
	            num_decors_x = Math.round(this.distElements(topleft,topright) / ele_cfg.gap),
	            num_decors_y = Math.round(this.distElements(topleft,bottomleft) / ele_cfg.gap),
	            step_x = (topright.x - topleft.x) / num_decors_x,
	            step_y = (bottomleft.y - topleft.y) / num_decors_y,
	            offset_x = 0,
	            offset_y = 0,
	            tag = 'interpolated',
		    //polyMulti segment always 0
		    segment = 0;
		for(var i=0;i<num_decors_y;i++){
		    offset_x = utilService.isOdd(i)? -ele_cfg.gap/2 : 0;
		    for(var j=0;j<num_decors_x;j++){
			offset_y = (Math.random()-1) * ele_cfg.gap;
			var at_pos = {x:topleft.x+(j+1)*step_x+offset_x, y:topleft.y+(i+1)*step_y+offset_y};
			if(this.pointInPolygon(at_pos,group_elements)){
			    elements.push(this.makeOneElementAt(elements,at_pos,ele_cfg,tag,segment,set,group));
			}
		    }
		}
	    }//end internal func polymulti
	    //if(from_elements.length>1){
	    if(this.operationType(from_elements)=='set'){
		this.lineMulti(elements,to_position,exclude_to_position,ele_cfg,hinge_element,from_elements);
	    }else{
		polymulti.call(this,elements,to_position,exclude_to_position,ele_cfg,hinge_element,from_elements);
	    }
	},
	pointInPolygon: function(point,elements){
	    //determine point inside polygon using algorithm suggested by:
	    //http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
	    var p = {x:point.x,y:-point.y};  //make a copy of point and convert y coordinate
	    //convert y coordinates from svg to traditional
	    //polyNodes are a copy of original elements so we do not modify coordinates of elements
	    var polyNodes = [];
	    for(var n=0; n<elements.length; n++){
		if(elements[n].tag=='original'){
		    polyNodes.push({x:elements[n].x, y:-elements[n].y});
		}
	    }
	    var nvert = polyNodes.length;
	    var i, j, c = false;
	    for (var i = 0, j = nvert-1; i < nvert; j = i++) {
		if (((polyNodes[i].y>p.y) != (polyNodes[j].y>p.y)) &&
		     (p.x < (polyNodes[j].x-polyNodes[i].x) * (p.y-polyNodes[i].y) / (polyNodes[j].y-polyNodes[i].y) + polyNodes[i].x) )
		    c = !c;
	    }
	    return c;
	},
	pointInPolygon2: function(point,elements){
	    //this does not seem to work
	    //determine point inside polygon using algorithm suggested by:
	    //http://alienryderflex.com/polygon/
	    //Notes:
	    //   polygon is formed by element in elements with tag original
	    //   notation: polyY[i] is just polyNodes[i].y
	    //   article above is based on traditional coordinate system, svg coordinate has y coordinate increasing downward
	    var originals = $.grep(elements,function(d){return d.tag=='original'}),
	        oddNodes=false,
	        max_y = utilService.maxmin(originals,function(e){return e.y}).max + 10;
	    var slope_polyedge_i_j, slope_line_i_p;
	    var p = {x:point.x,y:max_y-point.y};  //make a copy of point and convert y coordinate
	    //convert y coordinates from svg to traditional
	    //polyNodes are a copy of original elements so we do not modify coordinates of elements
	    var original_cp;
	    var polyNodes = [];
	    for(var n=0; n<originals.length; n++){
		polyNodes.push({x:originals[n].x, y:max_y-originals[n].y});
	    }
	    var polySides = polyNodes.length,
	        j=polySides-1;
	    
	    for (i=0; i<polySides; i++) {
		if (((polyNodes[i].y<p.y && polyNodes[j].y>=p.y) || (polyNodes[j].y<p.y && polyNodes[i].y>=p.y)) && (polyNodes[i].x<=p.x || polyNodes[j].x<=p.x)) {
		    //node i and node j form a line, denoted as polyedge_i_j
		    //polyedge_i_j cross the horizontal threshold thru p.y 
		    //(node i and j are on 2 different sides of the horizontal line)
		    slope_polyedge_i_j = Math.abs((polyNodes[j].y-polyNodes[i].y)/(polyNodes[j].x-polyNodes[i].x));
		    slope_line_i_p = Math.abs((p.y-polyNodes[i].y)/(p.x-polyNodes[i].x));
		    if (slope_polyedge_i_j>slope_line_i_p) {
			//consider the slope of poly_edge_i_j vs the slope of line_i_p (the 2 lines both go thru node i)
			//when slope of poly_edge_i_j > the slope of line_i_p, p is at right side of ployedge_i_j
			oddNodes=!oddNodes; 
		    }
		}
		j=i; 
	    }
	    return oddNodes; 
	},
	decor: function(){
	    var args = Array.prototype.slice.call(arguments,0);
	    var decormethod;
	    for(i in args){
		if(angular.isObject(args[i]) && "decor_method" in args[i]){
		    decormethod = args[i].decor_method;
		    break;
		}
	    }
	    if(args.length>1 && decormethod){
		decor_args = args.slice(0);
		this[decormethod].apply(this,decor_args);
	    }
	},
	//decor line and element called by maindecor
	decor_line_start_at: function(scope,point){
	    scope.setDirty(true);
	    var op = scope.current.operation.type;
	    if (!"decor_lines" in scope.data.decor) {
		scope.data.decor.decor_lines = [];
	    }
	    var i = scope.current.decor? scope.current.decor.line_id : undefined;
	    var num_lines_of_type = $.grep(scope.data.decor.decor_lines,function(dl){
		return dl.decor_line_type == scope.current.widget.line_type
	    }).length;

	    if (i == undefined) {
		if(!('max_lines' in this.elementConfig) || num_lines_of_type<this.elementConfig.max_lines){
		    //start a new decor_line
		    i = scope.data.decor.decor_lines.length + 1;
	            var unique_line_id = utilService.uniqueId(i);
		    scope.data.decor.decor_lines.push({
			decor_line_id: unique_line_id,
			decor_line_type: scope.current.widget.line_type, 
			decor_line_subtype: scope.current.widget.line_subtype, 
			decor_line_visible: true,
			decor_line_animtype: this.elementConfig.anim_type,
			elements: []
		    });
		    var unique_line_element_id = utilService.uniqueId(1);
		    scope.current.decor = {
			line_id: unique_line_id,
			line_element_id: unique_line_element_id
		    }
		}else{
		    console.log("max line reached, do nothing");
		    return this;
		}//end max_lines check
	    }else{
		var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
		var num_elements_in_line = scope.data.decor.decor_lines[i].elements.length;
		if('max_elements' in this.elementConfig && num_elements_in_line >= this.elementConfig.max_elements){
		    console.log("max elements reached, do nothing");
		    return this;
		}
	    }
	    i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
	    //use decorService to push decor element into elements
	    if(point){
		var hinge_element = this.decor_line_hinge_element(scope);
		var from_elements = this.decor_line_from_elements(scope);
		this.decor(scope.data.decor.decor_lines[i].elements,{x: scope.xScale_reverse(point[0]), y: scope.yScale_reverse(point[1])},false,hinge_element,from_elements);
		//move current decor element to last element in decor_line
		var last_ele = scope.data.decor.decor_lines[i].elements[scope.data.decor.decor_lines[i].elements.length-1];
		scope.current.decor.line_element_id = last_ele.id;
		//initialize(and enter into DOM) animation after each segment for all segment/set/color combinations
		var sscs = _.unique(_.map(scope.data.decor.decor_lines[i].elements,function(ele){
		    return {segment: ele.segment,set: ele.set,color: ele.color};
		}));
		var self = this;
		_.forEach(sscs,function(ssc){
		    //update animation data
		    lightAnimService.getAnim().initialize(scope.data.animations,scope.current.decor.line_id,ssc.segment,ssc.set,ssc.color,self.elementConfig.anim_start_second,scope.data.defs[0].attributes);
		})
	    }
	    //start angular digestion cycle after the decorline data has changed
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    //each click in line_multi will change segment of hinge element, so need an update
	    scope.decor_line_element_update_func(scope.current.decor.line_id);
	    //decor_line enter
	    scope.decor_line_element_enter_func(scope.current.decor.line_id);
	    //need exit since some decormethod like polyMulti will remove earlier elements while decorating
	    scope.decor_line_element_exit_func(scope.current.decor.line_id);
	    if(op=='set'){
		//make sure set operation has no line_element_id since we set line_element_id a few lines back in this func
		scope.current.decor.line_element_id = null;
	    }
	    //initialize shadowdesign default color
	    scope.initShadowStopColors();
	    return this;
	},
	decor_line_trace_at: function(scope,point){
	    if('max_elements' in this.elementConfig && scope.data.decor.decor_lines[i].elements.length>=this.elementConfig.max_elements){
	    }else{
		//del prior traceline first in set operation (we preserve prior trace line in segment operation to give
	        //user a hint what comprise of the initial decor line before set operation)
		if(!this.elementConfig.keep_trace){
		    scope.delTraceLine(scope.current.decor.line_id);
		}
		if(scope.current.decor.line_id && !scope.current.decor.line_element_id){
		    var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
		    //set operation usually generate mutiple groups belong to the same set
		    //however we want to continue the set operation by tracing from the last group
		    //animation are based on decor_line_id/set/segment/color
		    var lastgroup = _.max(_.pluck(scope.data.decor.decor_lines[i].elements,function(ele){
			return ele.group;
		    }));
		    var points = _.map(_.filter(scope.data.decor.decor_lines[i].elements,function(ele){
			return ele.group == lastgroup;
		    }),function(ele){
			return [ele.x,ele.y];
		    });
		    scope.showTraceLinesFromPointForPoints(point,points);
		}
		if(scope.current.decor.line_id && scope.current.decor.line_element_id){
		    scope.showTraceLineFromPoint(point);
		}
	    }
	    return this;
	},
	decor_line_end_at: function(scope,point){
	    //point is a vector with turn like [x,y,segment]
	    //click ele causing decor line end
	    var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
	    var newgroup = scope.svg.select("g[decor_line_id='"+scope.current.decor.line_id+"']").selectAll(".decor_line_element").maxGroup();
	    var newsegment = scope.svg.select("g[decor_line_id='"+scope.current.decor.line_id+"']").selectAll(".decor_line_element").maxSegment()+1;
	    var segment = point? parseInt(point[2]) : undefined;
	    var group = point? parseInt(point[3]) : undefined;
	    //before end, decor a last time for the last segment if clicked on an element with different segment in same group
	    //if(segment && segment != newsegment-1){
	    if(angular.isNumber(segment) && segment != newsegment-1 && group == newgroup){
		var to_pos = {x: scope.xScale_reverse(point[0]), y: scope.yScale_reverse(point[1])};
		//can not use this.decor_line_hinge_element since it will choose the closing element clicked on
		var hinge_element = null;
		var from_elements = [];
		if(scope.current.operation.type=='set'){
		    hinge_element = this.decor_line_hinge_element(scope);
		    from_elements = this.decor_line_from_elements(scope);
		}
		this.decor(scope.data.decor.decor_lines[i].elements,to_pos,true,hinge_element,from_elements);
		//initialize(and enter into DOM) animation after last segment
		var last_ele = scope.data.decor.decor_lines[i].elements[scope.data.decor.decor_lines[i].elements.length-1];
		var segment = last_ele.segment;
		var set = last_ele.set;
		//initial config scope.data.animations data for the decor_line_id/color/start_second=0
		lightAnimService.getAnim().initialize(scope.data.animations,scope.current.decor.line_id,segment,set,this.elementConfig.color,this.elementConfig.anim_start_second,scope.data.defs[0].attributes);
		scope.decor_line_element_enter_func(scope.current.decor.line_id);
		scope.decor_line_element_exit_func(scope.current.decor.line_id);
	    }
	    if(!this.elementConfig.keep_trace){
		scope.delTraceLine(scope.current.decor.line_id);
	    }
	    scope.current.decor = {};
	    scope.current.operation.type = undefined;//segment
	    return this;
	},
	decor_line_hinge_element: function(scope){
	    var hinge_element;
	    if(!scope.current.decor.line_id){
		return undefined;
	    }else{
		var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
		//hinge to current selected element could cause decor from last element to selected element
		/*if(!scope.current.decor.line_element_id){
		    hinge_element = scope.data.decor.decor_lines[i].elements[scope.data.decor.decor_lines[i].elements.length-1];
		}else{
		    var j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",scope.current.decor.line_element_id);
		    hinge_element = scope.data.decor.decor_lines[i].elements[j];
		}*/
		//therefore, always hinge to the last element in decorline
		hinge_element = scope.data.decor.decor_lines[i].elements[scope.data.decor.decor_lines[i].elements.length-1];
	    }
	    return hinge_element;	    
	},
	decor_line_from_elements: function(scope){
	    var from_elements;
	    if(!scope.current.decor.line_id){
		return undefined;
	    }else{
		var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
		var lastgroup = _.max(_.pluck(scope.data.decor.decor_lines[i].elements,function(ele){return ele.group}));
		if(!scope.current.decor.line_element_id){
		    from_elements = _.filter(scope.data.decor.decor_lines[i].elements,function(ele){
			return ele.group == lastgroup;
			//return true;
		    });
		}else{
		    var j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",scope.current.decor.line_element_id);
		    //from_elements = [scope.data.decor.decor_lines[i].elements[j]];
		    from_elements = [scope.data.decor.decor_lines[i].elements[scope.data.decor.decor_lines[i].elements.length-1]];
		}
	    }
	    return from_elements;
	},
	decor_line_element_drag: function(scope){
	    var drag = d3.behavior.drag()
	        .on("dragstart",function(){
		    //no animation while dragging, since the large shadow of elements will cause elements to be removed
		    scope.animateStart(false);
		    d3.event.sourceEvent.stopPropagation();
		    return false;
		})
                .on("drag", function(d){
		    if(scope.mode === 'play'){
			return;
		    }
		    scope.setDirty(true);
		    var x = d3.event.x,
		        y = d3.event.y,
		        r = d.scale_factor;
		    scope.dragged = d3.event.dx || d3.event.dy;
		    if(!scope.dragged){
			return;
		    }

		    var ele = d3.select(this);
		    if((x >= (0 + r) && x <= (scope.width - r)) && (y >= (0 + r) && y <= (scope.height - r))){
			ele.attr("x",x).attr("y",y);
		    }
		    if((x >= (scope.margins.left + r) && x <= (scope.width - scope.margins.right - r)) && (y >= (scope.margins.top + r) && y <= (scope.height - scope.margins.bottom - r))){
			//drag inside picture
			ele.attr("transform",function(d){
			    var outline_ele = ele.select(".outline").node(),
		            bbox = outline_ele.getBBox(),
			    scaleFactor = scope.rScale(d.scale_factor);
			    return "translate("+(x-(bbox.x+bbox.width/2)-(bbox.x+bbox.width/2)*(scaleFactor-1))+","+(y-(bbox.y+bbox.height/2)-(bbox.y+bbox.height/2)*(scaleFactor-1))+") scale("+scaleFactor+") rotate("+scope.element_config.rotate()+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")"})
			    .style("fill","black")
			    .select(".bulb").classed("lit",function(){
				return scope.current.decor? scope.current.decor.line_id == ele.attr("decor_line_id") : false;
			    });
			ele.select(".click-capture")
			    .style('visibility', 'hidden');
			ele.selectAll(":not(.click-capture)").style('visibility','visible');
			//put the dragged element at beginning of decor-line-elements and re order the DOM elements
			//so that mouse over another element will trigger the mouseover event on the other element
			ele.classed("dragging",true).moveToBack();
		       }else{
			//drag outside picture will show trashbin
			ele.attr("transform",function(d){
			    var outline_ele = ele.select(".outline").node(),
		                bbox = outline_ele.getBBox(),
			        scaleFactor = scope.rScale(1);
			    return "translate("+(x-(bbox.x+bbox.width/2)-(bbox.x+bbox.width/2)*(scaleFactor-1))+","+(y-(bbox.y+bbox.height/2)-(bbox.y+bbox.height/2)*(scaleFactor-1))+") scale("+scaleFactor+") rotate("+scope.element_config.rotate()+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")"})
			   .select(".click-capture")
			   .style('visibility', 'visible')
			   .style("fill","url("+$window.location+"#trash)")
			   .attr("stroke-opacity",0)
			   .select(".bulb")
			   .classed("lit",false);
			ele.selectAll(":not(.click-capture)").style('visibility','hidden');
		       }
		       return false;
		    })
		    .on("dragend",function(d){
		        var ele = d3.select(this);
			var x = ele.attr("x"), y = ele.attr("y"), 
			    r = d.scale_factor,
			    e = undefined,
			    i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",ele.attr("decor_line_id")),
			    j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",ele.attr("decor_line_element_id"));
			//complete drag event
			scope.dragged = false;
    			//d3.select(this).classed("dragging",false);
			ele.classed("dragging",false);

		        if((x >= (scope.margins.left + r) && x <= (scope.width - scope.margins.right - r)) && (y >= (scope.margins.top + r) && y <= (scope.height - scope.margins.bottom - r))){
			    //update scope data for element
			    if(i!=undefined && j!=undefined){
			        e = scope.data.decor.decor_lines[i].elements[j];
			        e.x = parseInt(scope.xScale_reverse(x));
			        e.y = parseInt(scope.yScale_reverse(y));
			    }
			}else{
			    //drag to delete, remove data first
			    scope.data.decor.decor_lines[i].elements.splice(j,1);
			    //scope.$apply();
			    //trigger DOM element exit
			    scope.decor_line_element_exit_func(ele.attr("decor_line_id"));
			}
			return false;
		    });//end define drag
	    return drag;
	}//end decor_line_element_drag
    };//end basicDecor object literal

    //roofLighting object created through prototypal inheritance
    var roofLighting = Object.create(basicDecor,{
	instructions: {value: "decorate roof lights and see animations"},
	decorName: {value: "roof lighting"},       //needs to be in lower case
	//default config
	elementConfig: {writable: true, value: {
	    light_type: 'shiningXmasLight',
	    color: 'random',
	    gap: 10,
	    decor_method: 'lineMulti'
	}},
	decor: {value: function(elements,to_position,exclude_to_position,hinge_element,from_elements){
	    this.__proto__.decor(elements,to_position,exclude_to_position,this.elementConfig,hinge_element,from_elements);
	}},
    });
    var treeLighting = Object.create(basicDecor,{
	instructions: {value: "decorate tree lights and see animations"},
	decorName : {value: "tree lighting"},
	elementConfig: {writable: true, value: {
	    light_type: 'basicXmasLight',
	    color: 'white',
	    gap: 5,
	    decor_method: 'lineMulti'
	}},
	decor : {value: function(elements,to_position,exclude_to_position,hinge_element,from_elements){
	    this.__proto__.decor(elements,to_position,exclude_to_position,this.elementConfig,hinge_element,from_elements);
	}}
    });
    var groundLighting = Object.create(basicDecor,{
	instructions: {value: "decorate ground lights along lawn and paved road"},
	decorName : {value: "ground lighting"},
	elementConfig: {writable: true, value: {
	    light_type: 'basicGroundLight',
	    color: 'white',
	    gap: 25,
	    decor_method: 'lineMulti'
	}},
	decor : {value: function(elements,to_position,exclude_to_position,hinge_element,from_elements){
	    this.__proto__.decor(elements,to_position,exclude_to_position,this.elementConfig,hinge_element,from_elements);
	}}
    });
    var daytimeDecor = Object.create(basicDecor,{
	instructions: {value: "day time decoration of non lightable things"},
	decorName : {value: "daytime decor"},
	elementConfig: {writable: true, value: {
	    light_type: 'basicXmasLight',
	    color: 'white',
	    gap: 25,
	    decor_method: 'lineOne'
	}},
	decor : {value: function(elements,to_position,exclude_to_position,hinge_element,from_elements){
	    this.__proto__.decor(elements,to_position,exclude_to_position,this.elementConfig,hinge_element,from_elements);
	}}
    });
    var shrubsDecor = Object.create(basicDecor,{
	instructions: {value: "decorate shrubs with lights and other ornaments"},
	decorName : {value: "shrubs"},
	elementConfig: {writable: true, value: {
	    light_type: 'shiningXmasLight',
	    color: 'random',
	    gap: 10,
	    decor_method: 'polyMulti'
	}},
	decor : {value: function(elements,to_position,exclude_to_position,hinge_element,from_elements){
	    this.__proto__.decor(elements,to_position,exclude_to_position,this.elementConfig,hinge_element,from_elements);
	}}
    });
    var measurementScaling = Object.create(basicDecor,{
	instructions: {value: "scale the picture by measuring the distance on picture"},
	decorName : {value: "measurementScaling"},
	//elemetConfig is not writable, but also need to make sure fields in elementConfig is not writable
	//therefore use Obect.create to create elementConfig with writable default at false
	elementConfig: {writable: false, value: Object.create({},{
	    light_type: {writable: false, value: 'measurementTapeEnd'},
	    decor_method: {writable: false, value: 'lineOne'},
	    max_elements: {writable: false, value: 2},
	    max_lines: {writable: false, value: 1},
	    scale_factor: {writable: false, value: 0.5},
	    rotate_degree: {writable: false, value: 0},
	    keep_trace: {writable: false, value: true}
	})},
	decor : {value: function(elements,to_position,exclude_to_position,hinge_element,from_elements){
	    this.__proto__.decor(elements,to_position,exclude_to_position,this.elementConfig,hinge_element,from_elements);
	}},
	//override trace line in baseDecor to trace ruler
	decor_line_trace_at: {value: function(scope,point){
	    var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
	    //check auto ending before show trace
	    if(i>=0){
		if('max_elements' in this.elementConfig && scope.data.decor.decor_lines[i].elements.length>=this.elementConfig.max_elements){
		    //cancel ruler before end line because we will empty scope.current.decor at end_line
		    scope.cancelRuler(scope.current.decor.line_id);
		    this.decor_line_end_at(scope,point);
		}else{
		    scope.showRulerFromPoint(scope.current.decor.line_id,point);
		}
	    }
	    return this;
	}},
	//override decor line end to set TapeEnd at same y
	decor_line_end_at: {value: function(scope,point){
	    var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id);
	    if(scope.data.decor.decor_lines[i].elements.length>1){
		scope.data.decor.decor_lines[i].elements[1].y = scope.data.decor.decor_lines[i].elements[0].y;
		scope.decor_line_element_update_func(scope.current.decor.line_id);
	    }
	    
	    this.__proto__.decor_line_end_at.call(this,scope,point);
	    //revert to default setting
	    scope.init_current();
	}},
	//override element drag in baseDecor to drag/extend ruler 
	decor_line_element_drag: {value: function(scope){
	    var self = this;
	    var drag = d3.behavior.drag()
               .on("drag", function(d){
		   scope.dirty = true;
		   var x = d3.event.x,
		       y = d3.event.y,
		       r = d.scale_factor;
		   scope.dragged = d3.event.dx || d3.event.dy;
		   if(!scope.dragged){
		       return;
		   }
		   var ele = d3.select(this);
		   var decor_line_id = ele.attr("decor_line_id"),
	               decor_line_element_id = ele.attr("decor_line_element_id"),
		       i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",decor_line_id),
		       j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",decor_line_element_id);

		   if((x >= (scope.margins.left + r) && x <= (scope.width - scope.margins.right - r)) && (y >= (scope.margins.top + r) && y <= (scope.height - scope.margins.bottom - r))){
		       //drag ruler inside picture
		       if(j==0){
			   var ruler_offset = self.elementConfig.uselight.offset;
			   //drag the first element will drag the ruler to move
			   //ele.attr("x",x).attr("y",y);
			   var decor_line_g = scope.svg.select("g.decor g.decor_lines").select("g[decor_line_id='"+decor_line_id+"']"),
			       ruler = decor_line_g.select("g.measurementTape");
			   ruler.attr("x-start",scope.xScale_reverse(x));
			   var ruler_width = parseInt(ruler.attr("ruler_width"));
			   ruler.attr("transform","translate("+(x+ruler_offset.x)+","+(y+ruler_offset.y)+")");
			   scope.data.decor.decor_lines[i].elements[j].x = scope.xScale_reverse(x);
			   scope.data.decor.decor_lines[i].elements[j].y = scope.yScale_reverse(y);
			   if(scope.data.decor.decor_lines[i].elements.length>1){
			       scope.data.decor.decor_lines[i].elements[j+1].x = scope.xScale_reverse(x)+ruler_width;
			       scope.data.decor.decor_lines[i].elements[j+1].y = scope.yScale_reverse(y);
			   }
		       }
		       if(j==1){
			   //drag the second element will drag the ruler length to move at x axis
			   //extend ruler axis and rect background, update ruler_width
			   scope.extendRulerToPoint(decor_line_id,[x,y]);
			   y = scope.yScale(scope.data.decor.decor_lines[i].elements[j].y);
			   //ele.attr("x",x)
			   //   .attr("y",y);
			   scope.data.decor.decor_lines[i].elements[j].x = scope.xScale_reverse(x);
			   scope.data.decor.decor_lines[i].elements[j].y = scope.yScale_reverse(y);
		       }
		       scope.decor_line_element_update_func(decor_line_id);
		       //put the dragged element at beginning of decor-line-elements and re order the DOM elements
		       //so that mouse over another element will trigger the mouseover event on the other element
		       ele.select(".click-capture")
			   .style('visibility', 'hidden');
		       ele.selectAll(":not(.click-capture)").style('visibility','visible');
		       ele.classed("dragging",true);//.moveToBack();
		   }else{
		       //drag outside picture will show trashbin
		       ele.attr("x",x).attr("y",y);
		       ele.attr("transform",function(d){
			       var outline_ele = ele.select(".outline").node(),
		               bbox = outline_ele.getBBox(),
			       scaleFactor = scope.rScale(1);
			       return "translate("+(x-(bbox.x+bbox.width/2)-(bbox.x+bbox.width/2)*(scaleFactor-1))+","+(y-(bbox.y+bbox.height/2)-(bbox.y+bbox.height/2)*(scaleFactor-1))+") scale("+scaleFactor+") rotate("+scope.element_config.rotate()+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")"})
			   .select(".click-capture")
			   .style('visibility', 'visible')
			   .style("fill","url("+$window.location+"#trash)")
			   .attr("stroke-opacity",0)
			   .select(".bulb")
			   .classed("lit",false);
		       ele.selectAll(":not(.click-capture)").style('visibility','hidden');
		   }
		   return false;
	       })//end on drag
	       .on("dragend",function(d){
		   var ele = d3.select(this);
		   var x = ele.attr("x"), y = ele.attr("y"), 
		       r = d.scale_factor,
		       e = undefined,
		       i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",ele.attr("decor_line_id")),
		       j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",ele.attr("decor_line_element_id"));

		   //complete drag event
		   scope.dragged = false;
		   ele.classed("dragging",false);

		   if((x >= (scope.margins.left + r) && x <= (scope.width - scope.margins.right - r)) && (y >= (scope.margins.top + r) && y <= (scope.height - scope.margins.bottom - r))){
		       //update scope data for element
		       if(i!=undefined && j!=undefined){
			   e = scope.data.decor.decor_lines[i].elements[j];
			   e.x = parseInt(scope.xScale_reverse(x));
			   e.y = parseInt(scope.yScale_reverse(y));
		       }
		   }else{
		       //drag to delete the ruler, remove both measurementTapeEnd elements
	               var decor_line_g = scope.svg.select("g.decor g.decor_lines").select("g[decor_line_id='"+ele.attr("decor_line_id")+"']"),
	                   ruler = decor_line_g.select("g.measurementTape");

		       scope.data.decor.decor_lines[i].elements.splice(0,2);
		       scope.data.decor.num_inches_per_x_unit = undefined;
		       //scope.$apply();
		       //trigger DOM element exit
		       //scope.decor_line_element_exit_func(d3.select(this).attr("decor_line_id"));
		       scope.decor_line_element_exit_func(ele.attr("decor_line_id"));
		   }
		   scope.init_current();
		   return false;
	       })//end on dragend
	    return drag;
	}}
    });

    //return the service object which provide a lookup method getDecor to get the decor object given decor_line_type
    return {
      decors: [roofLighting, treeLighting, groundLighting, daytimeDecor, shrubsDecor, measurementScaling],
      getDecor: function(decor_line_type){
	  //find the decor object in decors with decor_line_type as decorName
	  for(var m=0;m<this.decors.length;m++){
	      if(this.decors[m].decorName.toLowerCase() == decor_line_type.toLowerCase()){
		  return this.decors[m];
	      }
	  }
	  return undefined;
      }
    };
  }]);

/*
 *   this file define lightService which provide various kinds of light
 */
angular.module("lightgalaApp")
  .factory("lightService",['lightSvgsService','lightAnimService','utilService','$window',function(lightSvgsService,lightAnimService,utilService,$window){
    var colorManager = {
	getColors: function(defs){
	    //given defs (provided by controller scope), retrieve all colors supported
	    var i = _.findIndex(defs,function(def){return def.type=='radialGradient'});
	    return i>=0?_.pluck(defs[i].attributes,function(attr){return attr.colorname}):undefined;
	},
	getColorDefs: function(defs){
	    var i = _.findIndex(defs,function(def){return def.type=='radialGradient'});
	    return i>=0?defs[i].attributes:undefined;
	}
    };
    var basicImage = {
	light_type: 'basicImage',
	initColors: function(defs){
	    this.colors = colorManager.getColors(defs);
	    this.color_defs = colorManager.getColorDefs(defs);
	    return this;
	},
	makeLightFunc: function(append_to){
	    var self = this;
	    //append light img element to append_to which is a d3 created component
	    append_to.classed(self.light_type + " " + self.__proto__.light_type,true);
	    append_to.append("svg:image")
		.attr("class","outline")
                .attr("xlink:href", this.url)
                .attr("width", this.size.width)
                .attr("height", this.size.height)
		.attr("preserveAspectRatio", "none");
	},
	updateLightFunc: function(append_to){
	    append_to.select("image")
		.attr("class","outline")
                .attr("xlink:href", this.url)
                .attr("width", this.size.width)
                .attr("height", this.size.height)
		.attr("preserveAspectRatio", "none");
	}
    };
    //think basicLight as abstract class, do not directly call makeLightFunc on basicLight, but on light extended from it
    var basicLight = {
	light_type: 'basicLight',
	anim_type: 'onandoff',
	offset: {value: {x:0,y:0}},
	color: 'random',  //default random color
	initColors: function(defs){
	    this.colors = colorManager.getColors(defs);
	    this.color_defs = colorManager.getColorDefs(defs);
	    return this;
	},
	getColor: function(color){
	  var colors = this.colors? this.colors : ['red','blue','yellow','orange','green','white'];
	  var retColor;
	  if(color=='random'){
	    retColor = colors[Math.floor(Math.random()*(colors.length))];
	  }else{
	    retColor = color;
	  }
	  return retColor;
	},
	getColorDef: function(color){
	  if(this.color_defs){
	      return _.find(this.color_defs,function(color_def){
		  return color_def.colorname == color;
	      })
	  }else{
	      return undefined;
	  }
	},
	updateShadowStopsForColor: function(append_to,color){
	  //for random color, a detail color is selected in getColor, need to update shadow data in append_to
	  //update shadow stops for the color
	  var d = append_to.data();
	  if(d.length>0){
	    if(d[0].shadow){
	      var stops = d[0].shadow.stops;
	      var color_def = this.getColorDef(color);
	      if(color_def){
	        stops[0].color = utilService.hslStringToRgbString(color_def.stopcolor1);
	        stops[stops.length-1].color = utilService.hslStringToRgbString(color_def.stopcolor2);
	      }
	    }
	  }
	},
	makeLightFunc: function(append_to){
	  var self = this;
	  //append light svg element to append_to which is a d3 created component
	  function Light(){
	    //inside object constructor function, this point to the constructed object, 
	    //so use self to point to light context
	    var svg = lightSvgsService.getSvgByType(self.light_type);
	    var light_color = self.getColor(self.color);
	    return {
	      color: light_color,
	      outline_path: svg.outline_path,
	      outline_style: svg.outline_style,
	      outline_fill: svg.outline_fill,
	      outline_fillopacity: svg.outline_fillopacity,
	      base: svg.base,
	      base_style: svg.base_style,
	      base_fill: svg.base_fill,
	      base_fillopacity: svg.base_fillopacity,
	      bulb_path: svg.bulb_path,
	      bulb_style: svg.bulb_style,
	      bulb_fill: svg.bulb_fill,
	      bulb_fillopacity: svg.bulb_fillopacity,
	      ray_path: svg.ray_path,
	      ray_style: svg.ray_style,
	      ray_fill: svg.ray_fill,
	      ray_fillopacity: svg.ray_fillopacity,
	    } 
	  }
	  var light = new Light();
          //"basicXmasLight basicLight basicLight--"+light.color()
	  //append_to.classed(self.light_type + " " + self.__proto__.light_type + " " + self.__proto__.light_type + "--" + light.color,true);
	    append_to.classed(self.light_type + " " + self.__proto__.light_type,true);
	  //var id = append_to.attr("id");
	  var id = append_to.attr("decor_line_id");
	  var segment = append_to.attr("segment");
	  var set = append_to.attr("set");
	  //make light outline/base/bulb/ray
	  append_to.append("path")
	    .attr("class","outline")
	    .attr("d",light.outline_path)
	    .attr("style",light.outline_style)
	    .attr("fill",light.outline_fill)
	    .attr("fill-opacity",light.outline_fillopacity);
	  append_to.append("rect")
	    .attr("class","base")
	    .attr("x",light.base.x)
	    .attr("y",light.base.y)
	    .attr("width",light.base.width)
	    .attr("height",light.base.height)
	    .attr("style",light.base_style)
	    .attr("fill",light.base_fill)
	    .attr("fill-opacity",light.base_fillopacity);
	  append_to.append("path")
	    .attr("class","bulb")
	    .attr("d",light.bulb_path)
	    .attr("style",light.bulb_style)
	    .attr("bulbcolor",light.color)
	    //.attr("fill","url(#light-"+light.color+"-"+id+")")
	    //.attr("fill","url(#light-"+light.color+"-"+id+"-"+segment+"-"+set+")")
	    //SVG attribute is a FuncIRI reference, where in url(#foo), the relative IRI is normally resolved relative to current page
	    //when a page has base href, it changes where IRI looks, so need to point back to current page
	    .attr("fill","url("+$window.location+"#light-"+light.color+"-"+id+"-"+segment+"-"+set+")")
	    .attr("fill-opacity",light.bulb_fillopacity);
	  append_to.append("path")
	    .attr("class","ray")
	    .attr("d",light.ray_path)
	    .attr("style",light.ray_style)
	    //.attr("fill","url(#light-"+light.color+"-"+id+")")
	    //.attr("fill","url(#light-"+light.color+"-"+id+"-"+segment+"-"+set+")")
	    .attr("fill-opacity",light.ray_fillopacity)
	    .attr("fill","url("+$window.location+"#light-"+light.color+"-"+id+"-"+segment+"-"+set+")");
	  //add a rect to capture click/drag event
	  var outline_ele = append_to.select(".outline").node(),
	    bbox = outline_ele.getBBox();
	  append_to.append("rect")
	    .attr('class', 'click-capture')
	    .style('visibility', 'hidden')
	    .attr('opacity',0.8)
	    .attr('x', bbox.x)    //the left-most x coordinate of the bounding rect 23
	    .attr('y', bbox.y)    //the top-most coordinate of the bounding rect 23
	    .attr('width', bbox.width)  //18
	    .attr('height', bbox.height);
	  self.updateShadowStopsForColor(append_to,light.color);
	  return append_to;
	},  //end makeLightFunc
	updateLightFunc: function(append_to){
	  var self = this;
	  //var id = append_to.attr("id");
	  var id = append_to.attr("decor_line_id");
	  //segment of the hinge_element is changed at decor to mingle hinge_elemet with the decored elements in same segment
	  //take segment from data rather than attribute since element_update_func call updateElementFunc before reset segment
	  var segment = append_to.attr("segment");
	  var set = append_to.attr("set");
	  //update light svg element from dom tree of append_to which is a d3 created component
	  function Light(){
	    //inside object constructor function, this point to the constructed object, 
	    //so use self to point to light context
	    var svg = lightSvgsService.getSvgByType(self.light_type);
	    var light_color = self.getColor(self.color);
	    return {
	      color: light_color,
	      outline_path: svg.outline_path,
	      outline_style: svg.outline_style,
	      base: svg.base,
	      base_style: svg.base_style,
	      bulb_path: svg.bulb_path,
	      bulb_style: svg.bulb_style,
	      ray_path: svg.ray_path,
	      ray_style: svg.ray_style,
	      ray_fill: svg.ray_fill,
	      ray_fillopacity: svg.ray_fillopacity,
	    } 
	  }
	  var light = new Light();
	  append_to.attr("class",function(){
            //"basicXmasLight basicLight basicLight--"+light.color()
            //return self.light_type + " " + self.__proto__.light_type + " " + self.__proto__.light_type + "--" + light.color;
	      return self.light_type + " " + self.__proto__.light_type;
	  })
	  append_to.select("path.outline")
	    .attr("d",light.outline_path);
	  append_to.select("rect.base")
	    .attr("x",light.base.x)
	    .attr("y",light.base.y)
	    .attr("width",light.base.width)
	    .attr("height",light.base.height);
	  append_to.select("path.bulb")
	    //.attr("fill","url(#light-"+light.color+")")
	    .attr("bulbcolor",light.color)
	    .attr("d",light.bulb_path);
	  append_to.select("path.ray")
	    .attr("d",light.ray_path)
	    .attr("style",light.ray_style)
	    .attr("fill-opacity",light.ray_fillopacity)
	    //.attr("fill","url(#light-"+light.color+"-"+id+")")
	    //.attr("fill","url(#light-"+light.color+"-"+id+"-"+segment+"-"+set+")")
	    .attr("fill","url("+$window.location+"#light-"+light.color+"-"+id+"-"+segment+"-"+set+")");
	  append_to.call(this.turnoff).call(this.unglow).call(this.uncastshadow).call(this.unemitray);
	  //add a rect to capture click/drag event
	  var outline_ele = append_to.select(".outline").node(),
	    bbox = outline_ele.getBBox();
	  append_to.select("rect.click-capture")
	    .style('visibility', 'hidden')
	    .attr('opacity',0.3)
	    .attr('x', bbox.x)    //the left-most x coordinate of the bounding rect 23
	    .attr('y', bbox.y)    //the top-most coordinate of the bounding rect 23
	    .attr('width', bbox.width)  //18
	    .attr('height', bbox.height);
	  self.updateShadowStopsForColor(append_to,light.color);
	  return append_to;
	},  //end updateLightFunc
	turnon: function(append_to){
	    var id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment2");
	    var set = append_to.attr("set");
	    //find bulb and fill with the corresponding radialgradient
	    append_to.selectAll(".bulb").each(function(){
		d3.select(this).attr("fill",function(){
		    var color = d3.select(this).attr("bulbcolor");
		    //return "url(#lighton-"+color+"-"+id+")";
		    //return "url(#lighton-"+color+"-"+id+"-"+segment+"-"+set+")";
		    return "url("+$window.location+"#lighton-"+color+"-"+id+"-"+segment+"-"+set+")";
		});
	    })
	    return append_to;
	},  //end lightup function
	turnoff: function(append_to){
	    var id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    //find bulb and fill with the corresponding radialgradient
	    append_to.selectAll(".bulb").each(function(){
		d3.select(this).attr("fill",function(){
		    var color = d3.select(this).attr("bulbcolor");
		    //return "url(#light-"+color+"-"+id+")";
		    //return "url(#light-"+color+"-"+id+"-"+segment+"-"+set+")";
		    return "url("+$window.location+"#light-"+color+"-"+id+"-"+segment+"-"+set+")";
		});
	    })
	    return append_to;
	},  //end turnoff function
	flash: function(append_to){
	    var id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    //find bulb and fill with the corresponding radialgradient
	    append_to.selectAll(".bulb").each(function(){
		if(!d3.select(this).classed("unflashable")){
		    d3.select(this).attr("fill",function(){
			var color = d3.select(this).attr("bulbcolor");
			//return "url(#lightflash-"+color+"-"+id+")";
			//return "url(#lightflash-"+color+"-"+id+"-"+segment+"-"+set+")";
			return "url("+$window.location+"#lightflash-"+color+"-"+id+"-"+segment+"-"+set+")";
		    });
		}
	    })
	    return append_to;
	},  //end flash function
	unflash: function(append_to){
	    //find bulb and fill with the corresponding radialgradient
	    append_to.selectAll(".bulb").each(function(){
		if(!d3.select(this).classed("unflashable")){
		    d3.select(this).attr("fill","");
		}
	    })
	    return append_to;
	},  //end unflash function
	glow: function(append_to){
	    //append_to.attr("filter","url(#lightglow)");
	    append_to.attr("filter","url("+$window.location+"#lightglow)");
	    return append_to;
	},  //end glow function
	unglow: function(append_to){
	    append_to.attr("filter","");
	},
	emitray: function(append_to){
	    append_to.selectAll(".ray").each(function(){
		var bulb_fill = d3.select(d3.select(this).node().parentNode).select(".bulb").attr("fill");
		d3.select(this).attr("fill",bulb_fill).attr("ray-fill-opacity",0.4);
		//animate ray: bulb_fill eg: url(#light-white) or url(http://holilight.com/new#light-white)
		//var pattern = /\(([^)]+)\)/g;
		var pattern = /\(.*\#([^)]+)\)/g;
		var fill_id = pattern.exec(bulb_fill);
		var fill_data = d3.select('#'+fill_id[1]).data()[0];
		if(fill_data){
		    var ani_dur = fill_data.config.dur;
		    var ani_begin = fill_data.config.begin;
		    var ani_pattern_code = fill_data.config.pattern_code;
		    var ray_opacity = d3.select(this).attr("ray-fill-opacity");
		    var ani = d3.select(this).select("animate");
		    if(ani.node()==null){
			d3.select(this).append("animate")
			    .attr("attributeName","fill-opacity")
			    //.attr("keyTimes","0;0.25;0.5;0.75;1")
			    .attr("values",function(){
				//translate ani_pattern_code 01101 to "0:ray_opacity:ray_opacity:0;ray_opacity;0"
				var ktv='';
				var v;
				for(var i=0;i<ani_pattern_code.length;i++){
				    v = String(ani_pattern_code[i]==1?ray_opacity:0);
				    ktv=ktv+v+";";
				}
				return ktv+v;
			    })
			    .attr("keyTimes",function(){
				//translate ani_pattern_code 
				//examples: 01101 to 0;0.2;0.4;0.6;0.8;1;
				//             00 to 0;0.5;1
				var kt='',kt_step=ani_pattern_code.length==0? 1 : 1/ani_pattern_code.length;
				for(var i=0;i<ani_pattern_code.length;i++){
				    kt=kt+i*kt_step+";";
				}
				//"1" is an invalid keyTime animate attribute
				return kt.length>0? kt+"1" : "0;1";
			    })
			    .attr("dur",ani_dur)
			    .attr("begin",ani_begin)
			    .attr("repeatCount","indefinite");
		    }
		}
	    })
	    return append_to;
	},  //end emitray function
	unemitray: function(append_to){
	    append_to.selectAll(".ray").each(function(){
		d3.select(this).attr("fill-opacity",0);
		d3.select(this).select("animate").remove();
	    })
	    return append_to;
	},
	castshadow: function(append_to){
	    var shadow = append_to.data()[0].shadow;
	    var rgdata = angular.isUndefined(shadow)?[]:[shadow];
	    var scale_factor_shadow = append_to.data()[0].scale_factor_shadow? append_to.data()[0].scale_factor_shadow: 1;
	    if(rgdata.length==0) return;
	    append_to.selectAll(".base").each(function(){
		//add a eclipse around base filled with same radialgradient except 50% opacity
		var bbox_base = d3.select(this).node().getBBox();
		var bbox_bulb = d3.select(d3.select(this).node().parentNode).select(".bulb").node().getBBox();
		/*append_to.append("ellipse")
		    .attr("class","shadow")
		    .attr("cx",bbox_base.x+0.75*bbox_base.width)
		    .attr("cy",bbox_base.y+0.8*bbox_base.height)
		    .attr("ry",Math.max(bbox_bulb.width,bbox_bulb.height)*0.3)
		    .attr("rx",Math.min(bbox_bulb.width,bbox_bulb.height)*0.4)
		    .attr("fill",d3.select(d3.select(this).node().parentNode).select(".bulb").attr("fill"))
		    .attr("fill-opacity",0.45)
		    .attr("transform","rotate(5)");*/
		var rg = append_to.selectAll(".rg").data(rgdata);
		rg.enter().append('radialGradient')
		    .attr("id",append_to.attr('id')+"_shadow")
		    .attr("class","rg");
		rg.attr("cx",function(d){
		    return d.center.x;
		}).attr("cy",function(d){
		    return d.center.y;
		}).attr("r",function(d){
		    return d.radius;
		}).attr("fx",function(d){
		    return d.focal.x;
		}).attr("fy",function(d){
		    return d.focal.y;
		}).attr("spreadMethod","pad")
		.attr("gradientTransform",function(d){
		    return "rotate("+d.transform.rotate+","+d.center.x+","+d.center.y+") translate("+d.transform.translate.x+","+d.transform.translate.y+") scale("+d.transform.scale.x+","+d.transform.scale.y+")"
		});
		//add stops to the radialgradient
		rg.selectAll("stop").data([]).exit().remove();
		var rg_stops = rg.selectAll("stop")
		    .data(rgdata[0].stops)
		    .enter().append("stop")
		    .attr("offset",function(d){
			return d.offset;
		    })
		    .attr("stop-color",function(d){
			return d.color;
		    })
		    .attr("stop-opacity",function(d){
			return d.opacity;
		    });
		//add animate attributeName='stop-opacity' according to flash pattern
		var bulb_fill = append_to.select(".bulb").attr("fill");
		//animate shadow: bulb_fill eg: url(#light-white) or url(http://holilight.com/new#light-white)
		//var pattern = /\(([^)]+)\)/g;
		var pattern = /\(.*\#([^)]+)\)/g;
		var fill_id = pattern.exec(bulb_fill);
		var fill_data = d3.select('#'+fill_id[1]).data()[0];
		if(fill_data){
		    var ani_dur = fill_data.config.dur;
		    var ani_begin = fill_data.config.begin;
		    var ani_pattern_code = fill_data.config.pattern_code;
		    if(true){
			rg_stops.append("animate")
			    .attr("attributeName","stop-opacity")
			    .attr("values",function(d){
				//translate ani_pattern_code 01101 to "0:stop_opacity:stop_opacity:0;stop_opacity;0"
				var ktv='';
				var v;
				for(var i=0;i<ani_pattern_code.length;i++){
				    v = String(ani_pattern_code[i]==1?d.opacity:0);
				    ktv=ktv+v+";";
				}
				return ktv+v;
			    })
			    .attr("keyTimes",function(){
				//translate ani_pattern_code 
				//examples: 01101 to 0;0.2;0.4;0.6;0.8;1;
				//             00 to 0;0.5;1
				var kt='',kt_step=ani_pattern_code.length==0? 1 : 1/ani_pattern_code.length;
				for(var i=0;i<ani_pattern_code.length;i++){
				    kt=kt+i*kt_step+";";
				}
				//"1" is an invalid keyTime animate attribute
				return kt.length>0? kt+"1" : "0;1";
			    })
			    .attr("dur",ani_dur)
			    .attr("begin",utilService.incStep(ani_begin,0.1))  //add 0.1s delay for shadow after shining
			    .attr("repeatCount","indefinite");
		    }
		};
		//create a rectabge and fill the rectangle with shadow radialgradient
		render_shadow = append_to.select("rect.shadow")
		if(render_shadow.empty()){
		    render_shadow = append_to.append("rect").attr("class","shadow");
		}
		render_shadow
		    //.attr("cx",bbox_bulb.x)
		    //.attr("cy",bbox_bulb.y)
		    //.attr("r",Math.max(bbox_bulb.width,bbox_bulb.height)*10)
		    .attr("x",bbox_bulb.x-Math.max(bbox_bulb.width,bbox_bulb.height)*5*scale_factor_shadow)
		    .attr("y",bbox_bulb.y-Math.max(bbox_bulb.width,bbox_bulb.height)*5*scale_factor_shadow)
		    .attr("width",Math.max(bbox_bulb.width,bbox_bulb.height)*10*scale_factor_shadow)
		    .attr("height",Math.max(bbox_bulb.width,bbox_bulb.height)*10*scale_factor_shadow)
		    .attr("fill","url("+$window.location+'#'+append_to.attr("id")+"_shadow)");
	    })
	    return append_to;
	},  //end castshadow function
	uncastshadow: function(append_to){
	    append_to.selectAll(".shadow").remove();
	    return append_to;
	}   //end castshadow function
    };
    var basicXmasLight = Object.create(basicLight,{
	//data properties
	light_type: {writable: false, value: 'basicXmasLight'},   //not writable
	light_subtype: {value: 'C1'},                  //not writable
	scaleFactor: {writable: true, configurable: true, value: 0.2},
	//a demo to show the use of descriptor property, which:
	//   basicXmasLight.desc = 'hello' run the set function
	//   basicXmasLight.desc will run the get function and return hello, but desc has to be set before it can be get
	desc: { 
	    configurable:true, 
	    get: function ()      { console.log("return " + desc); return desc; },
	    set: function (value) { console.log("haha, desc set to" + value); desc=value; }  
	}
    });
    var shiningXmasLight = Object.create(basicLight,{
	//data properties
	light_type: {writable: false, value: 'shiningXmasLight'},   //not writable
	light_subtype: {value: 'C1'},                  //not writable
	scaleFactor: {writable: true, configurable: true, value: 0.2},
	//a demo to show the use of descriptor property, which:
	//   basicXmasLight.desc = 'hello' run the set function
	//   basicXmasLight.desc will run the get function and return hello, but desc has to be set before it can be get
	desc: { 
	    configurable:true, 
	    get: function ()      { console.log("return " + desc); return desc; },
	    set: function (value) { console.log("haha, desc set to" + value); desc=value; }  
	}
    });
    var basicGroundLight = Object.create(basicLight,{
	light_type: {value: 'basicGroundLight'},
	light_subtype: {value: 'C9'},
	//writable default is false
	scaleFactor: {writable: true, configurable: true, value: 1},
    });
    //measurement tape is just an invisible light bulb, where traceline is the measurement tape
    var measurementTapeEnd = Object.create(basicLight,{
	light_type: {value: 'measurementTapeEnd'},
	light_subtype: {value: ''},
	//most light can be removed through mouseover event but not TapeEnd
	light_unbreakable: {writable: false, value: true},
	light_unlightable: {writable: false, value: true},
	light_unflashable: {writable: false, value: true},
	color: {value: 'white'},
	offset: {value: {x:5,y:-10}},
	//writable default is false, so no need to specify writable: false
	scaleFactor: {writable: false, configurable: true, value: 0.5},
    });
    //wreath image rather than svg
    var fancyWreathImage = Object.create(basicImage,{
	light_type: {value: 'fancyWreathImage'},
	light_subtype: {value: ''},
	//most light can be removed through mouseover event but not TapeEnd
	light_unbreakable: {writable: false, value: true},
	light_unlightable: {writable: false, value: true},
	light_unflashable: {writable: false, value: true},
	scaleFactor: {writable: true, configurable: true, value: 0.5},
	url: {value: '/img/wreath.png'},
	size: {value: {width: 120, height: 120}},
	size_scale_func: {value: function(actual_inch,num_inches_per_x_unit){
	    //get scale_factor given actual_inch
	    return actual_inch / (num_inches_per_x_unit * this.size.width) ;
	}},
	size_scale_reverse_func: {value: function(scale_factor,num_inches_per_x_unit){
	    //get actual inches given scale_factor
	    return scale_factor * num_inches_per_x_unit * this.size.width ;
	}}
    });
    var fancyGarlandImage = Object.create(basicImage,{
	light_type: {value: 'fancyGarlandImage'},
	light_subtype: {value: ''},
	//most light can be removed through mouseover event but not TapeEnd
	light_unbreakable: {writable: false, value: true},
	light_unlightable: {writable: false, value: true},
	light_unflashable: {writable: false, value: true},
	scaleFactor: {writable: true, configurable: true, value: 1},
	url: {value: '/img/garland.png'},
	size: {value: {width: 40, height: 40}}
    });
    return {
	lights: [basicXmasLight, shiningXmasLight, basicGroundLight, 
		 measurementTapeEnd, fancyWreathImage, fancyGarlandImage],
	getLight: function(light_type){
	  for(var i=0;i<this.lights.length;i++){
	      if(this.lights[i].light_type.toLowerCase() == light_type.toLowerCase()){
		  return this.lights[i];
	      }
	  }	    
	},
    };
  }]);

/*
 *   this file define lightAnimService which provide various kinds of light animation pattern for each decor_line
 */
angular.module("lightgalaApp")
  .factory("lightAnimService",['$timeout','utilService',function($timeout,utilService){
    var basicAnim = {
	timers: [],
	init_config: function(){
	    if(!this.animConfig){
		this.animConfig = {
		    colorname: 'white',
		    stopcolor1: 'hsl(0%,0%,0%)',
		    stopcolor2: 'hsl(0%,0%,0%)',
		    pattern_code: '010',
		    dur: '1.9s',
		    begin: '0s',
		    //calcmode: 'discrete',
		    calcmode: '',
		}
	    }
	    return this;
	},
	config: function(cfg){
	    var self=this;
	    for(key in cfg){
		if(self.animConfig.hasOwnProperty(key)){
		    self.animConfig[key] = cfg[key];
		}
	    }
	    return this;
	},
	updateAnimElementFunc: function(){
	    var self=this;
	    return function(append_to){
		var d = append_to.data()[0];
		//config attributes of animate tag under append_to
		append_to.select("animate")
		    //.attr("values",self.getColorPattern())
		    .attr("values",basicAnim.init_config().config(d.config).getColorPattern())
	            .attr("dur",self.getDur())
	            .attr("begin",self.getBegin())
	    }
	},
	getColorPattern: function(){
	    //convert pattern_code 1001001 to color pattern hsl1;hsl2;hsl2;hsl1;hsl2;hsl2;hsl1
	    var color_pattern = '';
	    var pattern_code = this.animConfig.pattern_code;
	    if(this.animConfig.colorname=='rgb'){
		//led color, linear interpolation of 10 colors between stopColor1 and stopColor2

		//return "hsl(200, 99%, 63%);hsl(6, 63%, 56%);hsl(48, 89%, 70%);hsl(28, 90%, 62%);hsl(145, 83%, 66%);hsl(282, 100%, 71%);hsl(0, 100%, 100%)";
		return utilService.interpolateHSL(this.animConfig.stopcolor1,this.animConfig.stopcolor2,10);
	    }else{
		//incandescent color
		for(var i=0;i<pattern_code.length;i++){
		    color_pattern += pattern_code[i]=='0'? this.animConfig.stopcolor1 : this.animConfig.stopcolor2;
		    color_pattern += ";";
		}
	    }
	    return color_pattern;
	},
	getDur: function(){
	    return this.animConfig.dur;
	},
	getBegin: function(){
	    return this.animConfig.begin;
	},
	formAnimId: function(decor_line_id, segment, set, color, start_second){
	    return decor_line_id + '-' + segment + '-' + set + '-' + color + '-' + start_second;
	},
	setupOneAnimation: function(decor_line_id, segment, set, color, start_second, active){
	    //decor_line_id/segment/set/color/start_second uniquely identify an animation setup
	    return {
		anim_id: this.formAnimId(decor_line_id,segment,set,color,start_second),
		decor_line_id: decor_line_id,
		segment: segment,
		set: set,
		color: color,
		start_second: start_second,
		active: active,
		config: _.clone(this.animConfig)
	    }
	},
	setupAnimations: function(animations,decor_line_id,segment,set,color,start_second,active){
	    //setup sets of animations each with timing time and config
	    var anim_id = this.formAnimId(decor_line_id,segment,set,color,start_second);
	    var anim = _.find(animations,function(a){return a.anim_id == anim_id});
	    if(anim){
		anim.config = _.clone(this.animConfig);
	    }else{
		animations.push(this.setupOneAnimation(decor_line_id, segment, set, color, start_second, active));
	    }
	    return this;
	},
	initialize: function(animations, decor_line_id, segment, set, color, start_second, def_attributes){
	    //initialize animation from scope.data.defs
	    if(start_second==undefined){
		start_second = 0;
	    }
	    var anim_id = this.formAnimId(decor_line_id,segment,set,color,start_second);
	    var anim = _.find(animations,function(a){return a.anim_id == anim_id});
	    if(!anim){
		//initialize from def_attributes only when it does ot exist in animations yet
		for(var i=0;i<def_attributes.length; i++){
		    var a = def_attributes[i];
		    if((a.colorname == color || color=='random') && a.id.indexOf('flash')>0){
			this.config(a);
			this.setupAnimations(animations, decor_line_id, segment, set, a.colorname, start_second, true);
		    }
		}
		//animations.sort(utilService.dynamicSortMultiple("start_second","set","segment"));
		animations.sort(utilService.dynamicSortMultiple("decor_line_id","start_second","set","segment","color"));
	    }
	    return this;
	},
	install_lightoff: function(append_to){
	    //instal radialGradient of lightoff to append_to
	    var decor_line_id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    var d = append_to.data()[0];
	    append_to.append("radialGradient")
		.attr("class","dynamic")
		.attr("id",function(d){
		    //return 'light-'+d.color+'-'+decor_line_id;
		    return 'light-'+d.color+'-'+decor_line_id+'-'+segment+'-'+set;
		})
		.attr("colorname",function(d){
		    return d.color;
		})
		.attr("r",3.81)
		.attr("spreadMethod","pad")
		.each(function(d,index){
		    var stop1 = d3.select(this).append("stop").attr("offset",0)
			.attr("stop-color",d.config.stopcolor1);
		    d3.select(this).append("stop").attr("offset",1)
			.attr("stop-color",d.config.stopcolor1);
		});
	},
	install_lighton: function(append_to){
	    var decor_line_id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    var d = append_to.data()[0];
	    append_to.append("radialGradient")
		.attr("class","dynamic")
		.attr("id",function(d){
		    return 'lighton-'+d.color+'-'+decor_line_id+'-'+segment+'-'+set;;
		})
		.attr("colorname",function(d){
		    return d.color;
		})
		.attr("r",3.81)
		.attr("spreadMethod","pad")
		.each(function(d,index){
		    var stop1 = d3.select(this).append("stop").attr("offset",0)
			.attr("stop-color",d.config.stopcolor2);
		    d3.select(this).append("stop").attr("offset",1)
			.attr("stop-color",d.config.stopcolor2);
		});
	},
	install_lightflash: function(append_to){
	    var decor_line_id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    var d = append_to.data()[0];
	    append_to.append("radialGradient")
		.attr("class","dynamic")
		.attr("id",function(d){
		    return 'lightflash-'+d.color+'-'+decor_line_id+'-'+segment+'-'+set;;
		})
		.attr("colorname",function(d){
		    return d.color;
		})
		.attr("r",3.81)
		.attr("spreadMethod","pad")
		.each(function(d,index){
		    var stop1 = d3.select(this).append("stop").attr("offset",0)
			.attr("stop-color",d.config.stopcolor1);
		    if(true){
			stop1.append("animate")
			    .attr("attributeName","stop-color")
			    //.attr("values",basicAnim.config(d.config).getColorPattern())
			    .attr("values",basicAnim.init_config().config(d.config).getColorPattern())
			    .attr("dur",d.config.dur)
			    .attr("begin",d.config.begin)
			    .attr("calcMode",d.config.calcmode)
			    .attr("repeatCount","indefinite");
		    }
		    d3.select(this).append("stop").attr("offset",1)
			.attr("stop-color",d.config.stopcolor2);
		});
	},
	update_lightoff: function(append_to){
	    //update radialGradient of lightoff for append_to
	    var decor_line_id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    var d = append_to.data()[0];
	    var id = 'light-'+d.color+'-'+decor_line_id+'-'+segment+'-'+set;
	    append_to.select('#'+id)
		.attr("colorname",function(d){
		    return d.color;
		})
		.attr("r",3.81)
		.attr("spreadMethod","pad")
		.each(function(d,index){
		    var stop1 = d3.select(this).select("stop").attr("offset",0)
			.attr("stop-color",d.config.stopcolor1);
		    d3.select(this).select("stop").attr("offset",1)
			.attr("stop-color",d.config.stopcolor1);
		});
	},
	update_lighton: function(append_to){
	    var decor_line_id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    var d = append_to.data()[0];
	    var id = 'lighton-'+d.color+'-'+decor_line_id+'-'+segment+'-'+set;
	    append_to.select('#'+id)
		.attr("colorname",function(d){
		    return d.color;
		})
		.attr("r",3.81)
		.attr("spreadMethod","pad")
		.each(function(d,index){
		    var stop1 = d3.select(this).select("stop").attr("offset",0)
			.attr("stop-color",d.config.stopcolor2);
		    d3.select(this).select("stop").attr("offset",1)
			.attr("stop-color",d.config.stopcolor2);
		});
	},
	update_lightflash: function(append_to){
	    var decor_line_id = append_to.attr("decor_line_id");
	    var segment = append_to.attr("segment");
	    var set = append_to.attr("set");
	    var d = append_to.data()[0];
	    var id = 'lightflash-'+d.color+'-'+decor_line_id+'-'+segment+'-'+set;
	    append_to.select('#'+id)
		.attr("colorname",function(d){
		    return d.color;
		})
		.attr("r",3.81)
		.attr("spreadMethod","pad")
		.each(function(d,index){
		    var stop1 = d3.select(this).select("stop").attr("offset",0)
			.attr("stop-color",d.config.stopcolor1);
		    if(true){
			stop1.select("animate")
			    .attr("attributeName","stop-color")
			    //.attr("values",basicAnim.config(d.config).getColorPattern())
			    .attr("values",basicAnim.init_config().config(d.config).getColorPattern())
			    .attr("dur",d.config.dur)
			    .attr("begin",d.config.begin)
			    .attr("calcMode",d.config.calcmode)
			    .attr("repeatCount","indefinite");
		    }
		    d3.select(this).select("stop").attr("offset",1)
			.attr("stop-color",d.config.stopcolor2);
		});
	},
	start: function(animations,callback,callback_cycle_stop,numcycles){
	    //start animation defined in animations
	    var self=this;
	    var cycle_seconds=_.max(animations,function(anim){return anim.start_second}).start_second + 30;
	    self.stop(function(){});
	    for(var i=0;i<animations.length;i++){
		self.timers.push($timeout((function(){
		    var j = i;
		    return function(){
			//console.log('Animation ' + animations[j].anim_id + ' fired');
			callback(animations[j].start_second);
		    }
		})(),animations[i].start_second*1000));
	    }
	    //cycle restart as last timer
	    self.timers.push($timeout(function(){
		console.log("restart cycle "+(numcycles-1));
		self.stop(callback_cycle_stop);
		if(numcycles-1>0){
		    self.start(animations,callback,callback_cycle_stop,numcycles-1);
		}
	    },cycle_seconds*1000));
	    return this;
	},
        stop: function(callback){
	    if(this.timers.length>0){
		for(var i=0;i<this.timers.length;i++){
		    $timeout.cancel(this.timers[i]);
		}
		this.timers = [];
		callback();
	    }
	},
    };
    var basicLightAnim = Object.create(basicAnim,{
	anim_type: {value: 'onandoff'},
    });
    return {
	anims: [basicLightAnim],
	getAnim: function(anim_type){
	    if(anim_type){
		for(var i=0;i<this.anims.length;i++){
		    if(this.anims[i].anim_type.toLowerCase() == anim_type.toLowerCase()){
			return this.anims[i].init_config();
		    }
		}
	    }
	    return basicLightAnim.init_config();
	}
    };
  }]);

angular.module("lightgalaApp")
  .factory("lightSvgsService",function(){
    return {
      svg_libs: [],

      loadAll: function(d3){
	var self = this;
        //preload svg files
	var svg_files = [
	    {light_type: 'basicXmasLight', url: "/js/services/svgs/basicxmaslight.svg"},
	    {light_type: 'shiningXmasLight', url: "/js/services/svgs/shiningxmaslight.svg"},
	    {light_type: 'basicGroundLight', url: "/js/services/svgs/basicgroundlight.svg"},
	    {light_type: 'measurementTapeEnd', url: "/js/services/svgs/measurementtapeend.svg"},
	];
	//====== basicXmasLight, basicGroundLight, measurementTapeEnd  =======
	for(i in svg_files){
	    var svg_file = svg_files[i].url;
	    //need j inside ief
	    (function(){
		var j = i;
		d3.xml(svg_file, "image/svg+xml", function(xml) {
		    var light_obj = xml.documentElement;
		    var outline_path = d3.select(light_obj).select(".outline").attr("d"),
		        outline_style = d3.select(light_obj).select(".outline").attr("style"),
		        outline_fill = d3.select(light_obj).select(".outline").attr("fill"),
		        outline_fillopacity = d3.select(light_obj).select(".outline").attr("fill-opacity"),
		        base = {x: d3.select(light_obj).select(".base").attr("x"),
				y: d3.select(light_obj).select(".base").attr("y"),
				width: d3.select(light_obj).select(".base").attr("width"),
				height: d3.select(light_obj).select(".base").attr("height")},
		        base_style = d3.select(light_obj).select(".base").attr("style"),
		        base_fill = d3.select(light_obj).select(".base").attr("fill"),
		        base_fillopacity = d3.select(light_obj).select(".base").attr("fill-opacity"),
		        bulb_path = d3.select(light_obj).select(".bulb").attr("d"),
		        bulb_style = d3.select(light_obj).select(".bulb").attr("style");
		        bulb_fill = d3.select(light_obj).select(".bulb").attr("fill"),
		        bulb_fillopacity = d3.select(light_obj).select(".bulb").attr("fill-opacity"),
		        ray_path = d3.select(light_obj).select(".ray").attr("d"),
		        ray_style = d3.select(light_obj).select(".ray").attr("style"),
		        ray_fill = d3.select(light_obj).select(".ray").attr("fill"),
		        ray_fillopacity = d3.select(light_obj).select(".ray").attr("fill-opacity"),
		        //in callback, this point to window, so I use self which stores this
		        self.svg_libs.push({light_type:svg_files[j].light_type,
					    outline_path:outline_path,
					    outline_style:outline_style,
					    outline_fill:outline_fill,
					    outline_fillopacity:outline_fillopacity,
					    base:base,
					    base_style:base_style,
					    base_fill:base_fill,
					    base_fillopacity:base_fillopacity,
					    bulb_path:bulb_path,
					    bulb_style:bulb_style,
					    bulb_fill:bulb_fill,
					    bulb_fillopacity:bulb_fillopacity,
					    ray_path:ray_path,
					    ray_style:ray_style,
					    ray_fill:ray_fill,
					    ray_fillopacity:ray_fillopacity
					   });
		})//end d3.xml
	    })(); //end imediately executed function
	}
      },
      getSvgByType: function(light_type){
	var svg;
	for(var i=0;i<this.svg_libs.length;i++){
	  if(this.svg_libs[i].light_type==light_type){
	    return this.svg_libs[i];
	  }
	}
      }
    }
  })

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

/*
 *   this file define toolService which provide widget subcategory icon and toolbox icon functionalities
 *   widget subcategory icon and toolbox icon functionalities are considered to be tools
 *   to config current_config which is referenced by scope.element_config
 */
angular.module("lightgalaApp")
  .factory("toolService",['$location','decorService','decorDataService','lightService','lightAnimService','utilService','$modal','$aside','$alert','$popover','$injector',function($location,decorService,decorDataService,lightService,lightAnimService,utilService,$modal,$aside,$alert,$popover,$injector){      
    //base tool object created thru object literal
    var basicTool = {
	//basicTool config is the default config
	current_config: {
	    //light_type:'basicXmasLight',   //if not set, lightService will provide default light_type for itself
	    color:'white', 
	    rotate_degree: 0, 
	    //rotate:function(){return this.rotate_degree=='random'? Math.floor(Math.random()*180-360) : this.rotate_degree},
	    rotate:function(){
		var args = Array.prototype.slice.call(arguments,0);
		if(args.length==1){
		    //rotate_degree provided to function
		    var degree = args[0];
		    return degree=='random'? Math.floor(Math.random()*180-360) : degree
		}else{
		    return this.rotate_degree=='random'? Math.floor(Math.random()*180-360) : this.rotate_degree
		}
	    },
	    gap:25,
	    scale_factor: 0.3,     //used to size an individual elements
	    set_scale_factor: 1,   //used to size a whole set of elements to be denser or sparser
	    decor_method: 'lineMulti',
	    night: false,
	    anim_type: 'onandoff',
	    anim_start_second: 0,
	    scale_factor_shadow: 1,     //used to size shadow of a light
	    rgConfigured : {
		width:276,
		height:276,
		center: {x: 0.5, y:0.5},
		focal: {x: 0.5, y: 0.5},
		radius: 0.1,
		transform: {
		    rotate: 0,
		    translate: {
			x: 0,
			y: 0,
		    },
		    scale: {
			x: 1,
			y: 1,
		    }
		},
		opacity: 0.6,
		stops: [
		    {offset: '0', color: "rgb(255,255,255)", opacity: 1},
		    {offset: '1', color: "rgb(0,0,0)", opacity: 0}
		]
		/*center:{x:0.5036231884057971,y:0.8623188405797102,name:"center",ctrl_color:"orange"},
		focal:{x:0.4963768115942029,y:0.009130434782608698,name:"focal",ctrl_color:"pink"},
		radius:0.15217391304347827,
		transform:{
		    rotate:0,
		    translate:{x:0,y:0,name:"translate",ctrl_color:"blue"},
		    scale:{x:1,y:1,name:"scale",ctrl_color:"red"}
		},
		opacity:0.8572463768115942,
		stops:[
		    {offset:"0",color:"rgb(72,18,227)",opacity:0.8572463768115942},
		    {offset:"0.4",color:"rgb(18,48,153)",opacity:0.5143478260869565},
		    {offset:"0.9",color:"rgb(64,76,122)",opacity:0.0857246376811594},
		    {offset:"1",color:"rgb(37,56,122)",opacity:0}
		],
		colors:[
		    {original:true,color:"#4812e3"},
		    {original:false,color:"#3b1ad1"},
		    {original:false,color:"#2d21be"},
		    {original:false,color:"#2029ac"},
		    {original:true,color:"#123099"},
		    {original:false,color:"#1b3693"},
		    {original:false,color:"#243b8d"},
		    {original:false,color:"#2e4186"},
		    {original:false,color:"#374680"},
		    {original:true,color:"#404c7a"},
		    {original:true,color:"#25387a"}
		]*/
	    },
	    install_supported_defs: function(defs){
		this.defs = defs;
		return this;
	    },
	    reset: function(){
		//hard code, not pretty
		this.color = 'white';
		this.rotate_degree= 0;
		this.gap = 25;
		this.scale_factor = 0.3;
		this.decor_method = 'lineMulti';
		this.night = false;
		this.anim_start_second = 0;
		return this;
	    }
	},
	beforeinvoke: function(scope){
	    return this;
	},
	invoke: function(){
	    return this;
	},
	afterinvoke: function(scope){
	    //apply tool change to current decor
	    //console.log(scope.current.decor);
	    if(scope && scope.current.decor.hasOwnProperty("line_id")){
		//stick light color defs to element_config so light can be initialized with the defined colors
		scope.element_config.defs = scope.data.defs;
		var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id),
	            j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",scope.current.decor.line_element_id);
		var ds = decorService.getDecor(scope.data.decor.decor_lines[i].decor_line_type).config(scope.element_config);
		var segment,set;
		//first, update data, use ds.elementConfig other than this.current_config since some config is not writable
		if(j){
		    //only update one element in segment operation
		    ds.updateElementWithConfig(scope.data.decor.decor_lines[i].elements[j],ds.elementConfig);
		    segment = scope.data.decor.decor_lines[i].elements[j].segment;
		    set = scope.data.decor.decor_lines[i].elements[j].set;
		    //update animation data
		    lightAnimService.getAnim().initialize(scope.data.animations,scope.current.decor.line_id,segment,set,ds.elementConfig.color,ds.elementConfig.anim_start_second,scope.data.defs[0].attributes);
		}else{
		    //no specific j is selected in set operation, means all elements in last set needs to be updated
		    var set_last = _.max(_.pluck(scope.data.decor.decor_lines[i].elements,function(ele){
			return ele.set;
		    }));
		    var set_elements = _.filter(scope.data.decor.decor_lines[i].elements,function(ele){
			return ele.set == set_last;
		    })
		    _.forEach(set_elements,function(ele){
			ds.updateElementWithConfig(ele,ds.elementConfig);
		    })
		    var sscs = _.unique(_.map(set_elements,function(ele){
			return {segment: ele.segment,set: ele.set,color: ele.color};
		    }));
		    _.forEach(sscs,function(ssc){
			//update animation data
			lightAnimService.getAnim().initialize(scope.data.animations,scope.current.decor.line_id,ssc.segment,ssc.set,ds.elementConfig.color,ds.elementConfig.anim_start_second,scope.data.defs[0].attributes);
		    })
		}
		//then, update dom. element_update include anim_enter rerun (just like update)
		scope.decor_line_element_update_func(scope.current.decor.line_id);
		//color change cause shadow stop color change
		scope.initShadowStopColors();
	    }
	    return this;
	}
    };//end basicTool object literal

    var basicXmasLightTypeTool = Object.create(basicTool,{
	instructions: {value: "use basic xmas light"},
	toolName: {value: "basicxmaslighttypetool"},
	invokeWillSet: {value: {key: "light_type", value:"basicXmasLight"}},
	invoke: {value: function(){
	    this.current_config.light_type = 'basicXmasLight';
	    return this;
	}},
    });

    var basicGroundLightTypeTool = Object.create(basicTool,{
	instructions: {value: "use basic ground light"},
	toolName: {value: "basicgroundlighttypetool"},
	invokeWillSet: {value: {key: "light_type", value:"basicGroundLight"}},
	invoke: {value: function(){
	    this.current_config.light_type = 'basicGroundLight';
	    return this;
	}},
    });

    var shiningXmasLightTypeTool = Object.create(basicTool,{
	instructions: {value: "use shining xmas light"},
	toolName: {value: "shiningxmaslighttypetool"},
	invokeWillSet: {value: {key: "light_type", value:"shiningXmasLight"}},
	invoke: {value: function(){
	    this.current_config.light_type = 'shiningXmasLight';
	    return this;
	}},
    });

    //lineOneTool object created through prototypal inheritance
    var lineOneTool = Object.create(basicTool,{
	instructions: {value: "decorate one item at end of the line"},
	toolName: {value: "lineonetool"},
	invokeWillSet: {value: {key: "decor_method", value:"lineOne"}},
	invoke: {value: function(){
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
    });

    var lineMultiTool = Object.create(basicTool,{
	instructions: {value: "decorate multiple items on the line"},
	toolName: {value: "linemultitool"},
	invokeWillSet: {value: {key: "decor_method", value:"lineMulti"}},
	invoke: {value: function(){
	    this.current_config.decor_method = 'lineMulti';
	    return this;
	}},
    });

    var polyMultiTool = Object.create(basicTool,{
	instructions: {value: "decorate multiple items inside the polygon"},
	toolName: {value: "polymultitool"},
	invokeWillSet: {value: {key: "decor_method", value:"polyMulti"}},
	invoke: {value: function(){
	    this.current_config.decor_method = 'polyMulti';
	    return this;
	}},
    });

    var yellowColorTool = Object.create(basicTool,{
	instructions: {value: "use yellow color for the decorated item"},
	toolName: {value: "yellowcolortool"},
	invokeWillSet: {value: {key: "color", value:"yellow"}},
	invoke: {value: function(){
	    this.current_config.color = "yellow";
	    return this;
	}},
    });

    var orangeColorTool = Object.create(basicTool,{
	instructions: {value: "use orange color for the decorated item"},
	toolName: {value: "orangecolortool"},
	invokeWillSet: {value: {key: "color", value:"orange"}},
	invoke: {value: function(){
	    this.current_config.color = "orange";
	    return this;
	}},
    });

    var greenColorTool = Object.create(basicTool,{
	instructions: {value: "use green color for the decorated item"},
	toolName: {value: "greencolortool"},
	invokeWillSet: {value: {key: "color", value:"green"}},
	invoke: {value: function(){
	    this.current_config.color = "green";
	    return this;
	}},
    });

    var purpleColorTool = Object.create(basicTool,{
	instructions: {value: "use purple color for the decorated item"},
	toolName: {value: "purplecolortool"},
	invokeWillSet: {value: {key: "color", value:"purple"}},
	invoke: {value: function(){
	    this.current_config.color = "purple";
	    return this;
	}},
    });

    var blueColorTool = Object.create(basicTool,{
	instructions: {value: "use blue color for the decorated item"},
	toolName: {value: "bluecolortool"},
	invokeWillSet: {value: {key: "color", value:"blue"}},
	invoke: {value: function(){
	    this.current_config.color = "blue";
	    return this;
	}},
    });

    var redColorTool = Object.create(basicTool,{
	instructions: {value: "use red color for the decorated item"},
	toolName: {value: "redcolortool"},
	invokeWillSet: {value: {key: "color", value:"red"}},
	invoke: {value: function(){
	    this.current_config.color = "red";
	    return this;
	}},
    });

    var whiteColorTool = Object.create(basicTool,{
	instructions: {value: "use white color for the decorated item"},
	toolName: {value: "whitecolortool"},
	invokeWillSet: {value: {key: "color", value:"white"}},
	invoke: {value: function(){
	    this.current_config.color = "white";
	    return this;
	}},
    });

    var randomColorTool = Object.create(basicTool,{
	instructions: {value: "use random color for the decorated item"},
	toolName: {value: "randomcolortool"},
	invokeWillSet: {value: {key: "color", value:"random"}},
	invoke: {value: function(){
	    this.current_config.color = "random";
	    return this;
	}},
    });

    var rgbColorTool = Object.create(basicTool,{
	instructions: {value: "use LED configurable color for the decorated item"},
	toolName: {value: "rgbcolortool"},
	invokeWillSet: {value: {key: "color", value:"rgb"}},
	invoke: {value: function(){
	    this.current_config.color = "rgb";
	    return this;
	}},
    });

    var colorChooserTool = Object.create(basicTool,{
	instructions: {value: "choose a color for the decorated item"},
	toolName: {value: "colorchoosertool"},
	invokeWillSet: {value: {key: "", value:""}},
	invoke: {value: function(){
	    return this;
	}},
    });

    var sizeUpTool = Object.create(basicTool,{
	instructions: {value: "enlarge the decorated item"},
	toolName: {value: "sizeuptool"},
	invokeWillSet: {value: {key: "scale_factor", value:basicTool.current_config.scale_factor * 1.2}},
	invoke: {value: function(){
	    this.current_config.scale_factor = this.current_config.scale_factor * 1.2;
	    return this;
	}},
    });

    var sizeDownTool = Object.create(basicTool,{
	instructions: {value: "shrink the decorated item"},
	toolName: {value: "sizedowntool"},
	invokeWillSet: {value: {key: "scale_factor", value:basicTool.current_config.scale_factor * 0.8}},
	invoke: {value: function(){
	    this.current_config.scale_factor = this.current_config.scale_factor * 0.8;
	    return this;
	}},
    });

    var setSizeUpTool = Object.create(basicTool,{
	instructions: {value: "enlarge the set of decorated items"},
	toolName: {value: "setsizeuptool"},
	invokeWillSet: {value: {key: "set_scale_factor", value:basicTool.current_config.set_scale_factor * 1.2}},
	invoke: {value: function(){
	    this.current_config.set_scale_factor = this.current_config.set_scale_factor * 1.2;
	    return this;
	}},
    });

    var setSizeDownTool = Object.create(basicTool,{
	instructions: {value: "shrink the set of decorated item"},
	toolName: {value: "setsizedowntool"},
	invokeWillSet: {value: {key: "set_scale_factor", value:basicTool.current_config.set_scale_factor * 0.8}},
	invoke: {value: function(){
	    this.current_config.set_scale_factor = this.current_config.set_scale_factor * 0.8;
	    return this;
	}},
    });

    var gapUpTool = Object.create(basicTool,{
	instructions: {value: "make decorated items farther from each other"},
	toolName: {value: "gapuptool"},
	invokeWillSet: {value: {key: "gap", value:basicTool.current_config.gap * 1.2}},
	invoke: {value: function(){
	    this.current_config.gap = this.current_config.gap * 1.2;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(scope && scope.current.decor.hasOwnProperty("line_id")){
		var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id),
	            j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",scope.current.decor.line_element_id),
		    r = scope.xScale(this.current_config.gap);
		//flash a circle then remove to hint gap size
		if(j){
		    scope.showTraceCircleFromPointWithRadius({
			x:scope.xScale(scope.data.decor.decor_lines[i].elements[j].x),
			y:scope.yScale(scope.data.decor.decor_lines[i].elements[j].y),
		    },r);
		}else{
		    _.forEach(scope.data.decor.decor_lines[i].elements,function(ele){
			scope.showTraceCircleFromPointWithRadius({
			    x:scope.xScale(ele.x),
			    y:scope.yScale(ele.y),
			},r);
		    });
		}
	    }
	    this.__proto__.afterinvoke(scope);
	    return this;
	}}
    });

    var gapDownTool = Object.create(basicTool,{
	instructions: {value: "make decorated items closer to each other"},
	toolName: {value: "gapdowntool"},
	invokeWillSet: {value: {key: "gap", value:basicTool.current_config.gap * 0.8}},
	invoke: {value: function(){
	    this.current_config.gap = this.current_config.gap * 0.8;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    return gapUpTool.afterinvoke(scope);
	}}
    });

    var rotateTool = Object.create(basicTool,{
	instructions: {value: "rotate the decorated item"},
	toolName: {value: "rotatetool"},
	invokeWillSet: {value: {key: "", value: ""}},
	invoke: {value: function(){
	    return this;
	}},
    });

    var rotateLeftTool = Object.create(basicTool,{
	instructions: {value: "rotate the decorated item counter clock wise by 30 degree"},
	toolName: {value: "rotatelefttool"},
	invokeWillSet: {value: {key: "rotate_degree", value:parseInt(basicTool.current_config.rotate_degree) - 30}},
	invoke: {value: function(){
	    if(this.current_config.rotate_degree == 'random'){
		this.current_config.rotate_degree = 0;
	    }else{
		this.current_config.rotate_degree = parseInt(this.current_config.rotate_degree) - 30;
	    }
	    return this;
	}},
    });

    var rotateRightTool = Object.create(basicTool,{
	instructions: {value: "rotate the decorated item clock wise by 30 degree"},
	toolName: {value: "rotaterighttool"},
	invokeWillSet: {value: {key: "rotate_degree", value:parseInt(basicTool.current_config.rotate_degree) + 30}},
	invoke: {value: function(){
	    if(this.current_config.rotate_degree == 'random'){
		this.current_config.rotate_degree = 0;
	    }else{
		this.current_config.rotate_degree = parseInt(this.current_config.rotate_degree) + 30;
	    }
	    return this;
	}},
    });

    var rotateRandomTool = Object.create(basicTool,{
	instructions: {value: "rotate the decorated item randomly"},
	toolName: {value: "rotaterandomtool"},
	invokeWillSet: {value: {key: "rotate_degree", value:'random'}},
	invoke: {value: function(){
	    this.current_config.rotate_degree = 'random';
	    return this;
	}},
    });

    var shadowSizeUpTool = Object.create(basicTool,{
	instructions: {value: "increase shadow size of decorated item"},
	toolName: {value: "shadowsizeuptool"},
	invokeWillSet: {value: {key: "scale_factor_shadow", value:basicTool.current_config.scale_factor_shadow * 1.2}},
	invoke: {value: function(){
	    this.current_config.scale_factor_shadow = this.current_config.scale_factor_shadow * 1.2;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    this.__proto__.afterinvoke(scope);
	    if(scope.current.decor.line_element_id){
		var ele = d3.select("g[decor_line_id='"+scope.current.decor.line_id+"'][decor_line_element_id='"+scope.current.decor.line_element_id+"']");
		var light = lightService.getLight(ele.data()[0].light_type);
		ele.call(light.turnon).call(light.flash).call(light.glow).call(light.castshadow).call(light.emitray);
	    }else{
		if(scope.current.decor.line_id){
		    var eles = d3.selectAll("g[decor_line_id='"+scope.current.decor.line_id+"'].decor_line_element");
		    eles.each(function(){
		       var ele = d3.select(this);
		       var light = lightService.getLight(ele.data()[0].light_type);
		       ele.call(light.turnon).call(light.flash).call(light.glow).call(light.castshadow).call(light.emitray);
		    });
		}
	    }
	    return this;
	}}
    });

    var shadowSizeDownTool = Object.create(basicTool,{
	instructions: {value: "decrease shadow size of decorated item"},
	toolName: {value: "shadowsizedowntool"},
	invokeWillSet: {value: {key: "scale_factor_shadow", value:basicTool.current_config.scale_factor_shadow * 0.8}},
	invoke: {value: function(){
	    this.current_config.scale_factor_shadow = this.current_config.scale_factor_shadow * 0.8;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    this.__proto__.afterinvoke(scope);
	    if(scope.current.decor.line_element_id){
		var ele = d3.select("g[decor_line_id='"+scope.current.decor.line_id+"'][decor_line_element_id='"+scope.current.decor.line_element_id+"']");
		var light = lightService.getLight(ele.data()[0].light_type);
		ele.call(light.turnon).call(light.flash).call(light.glow).call(light.castshadow).call(light.emitray);
	    }else{
		if(scope.current.decor.line_id){
		    var eles = d3.selectAll("g[decor_line_id='"+scope.current.decor.line_id+"'].decor_line_element");
		    eles.each(function(){
		       var ele = d3.select(this);
		       var light = lightService.getLight(ele.data()[0].light_type);
		       ele.call(light.turnon).call(light.flash).call(light.glow).call(light.castshadow).call(light.emitray);
		    });
		}
	    }
	    return this;
	}}
    });

    var nightTool = Object.create(basicTool,{
	instructions: {value: "let the night begin"},
	toolName: {value: "nighttool"},
	invokeWillSet: {value: {key: "night", value:basicTool.current_config.night? false : true}},
	invoke: {value: function(){
	    //this.current_config.night = this.current_config.night? false : true;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    scope.current.animation.night = scope.current.animation.night? false : true;
	}}
    });

    var animateStartTool = Object.create(basicTool,{
	instructions: {value: "let the light show start"},
	toolName: {value: "animatestarttool"},
	invokeWillSet: {value: {key: "animate", value:basicTool.current_config.animate? false : true}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    scope.current.animation.start = scope.current.animation.start? false : true;
	    if(!scope.$$phase){
		scope.$apply();
	    }
	}}
    });

    var animateStartPlusFiveSecondTool = Object.create(basicTool,{
	instructions: {value: "configure start second of the animation"},
	toolName: {value: "animatestartplusfivesecondtool"},
	invokeWillSet: {value: {key: "animate", value:basicTool.current_config.animate? false : true}},
	invoke: {value: function(){
	    this.current_config.anim_start_second += 5;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    this.__proto__.afterinvoke(scope);
	    //this.current_config.anim_start_second = 0;
	}}
    });

    var animateStartMinusFiveSecondTool = Object.create(basicTool,{
	instructions: {value: "configure start second of the animation"},
	toolName: {value: "animatestartminusfivesecondtool"},
	invokeWillSet: {value: {key: "animate", value:basicTool.current_config.animate? false : true}},
	invoke: {value: function(){
	    this.current_config.anim_start_second -= 5;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    this.__proto__.afterinvoke(scope);
	    //this.current_config.anim_start_second = 0;
	}}
    });

    var animatePattern1Tool = Object.create(basicTool,{
	instructions: {value: "configure animate pattern to on,off,off,on,off,on,off"},
	toolName: {value: "animatepattern1tool"},
	invokeWillSet: {value: {key: "animate_pattern", value: '1001010'}},
	invoke: {value: function(){
	    this.current_config.anim_pattern = '1001010';
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //update scope animations data
	    for(var i=0;i<scope.data.animations.length;i++){
		var a = scope.data.animations[i];
		if (a.decor_line_id == scope.current.decor.line_id &&
		    a.start_second == scope.element_config.anim_start_second &&
		    a.color == scope.element_config.color) {
		    a.config.pattern_code = this.current_config.anim_pattern;
		}
	    }
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    this.__proto__.afterinvoke(scope);
	}}
    });

    var animateDurUpTool = Object.create(basicTool,{
	instructions: {value: "increase animation duration"},
	toolName: {value: "animateduruptool"},
	invokeWillSet: {value: {key: "animate_dur", value:basicTool.current_config.animate_dur * 1.25}},
	invoke: {value: function(){
	    //this.current_config.animate_dur = this.current_config.animate_dur * 1.25;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //update scope animations data
	    for(var i=0;i<scope.data.animations.length;i++){
		var a = scope.data.animations[i];
		if (a.decor_line_id == scope.current.decor.line_id &&
		    a.start_second == scope.element_config.anim_start_second &&
		    a.color == scope.element_config.color) {
		    a.config.dur = utilService.incStep(a.config.dur);
		}
	    }
	    //tell angular def data has changed
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    this.__proto__.afterinvoke(scope);
	}}
    });

    var animateDurDownTool = Object.create(basicTool,{
	instructions: {value: "decrease animation duration"},
	toolName: {value: "animatedurdowntool"},
	invokeWillSet: {value: {key: "animate_dur", value:basicTool.current_config.animate_dur / 1.25}},
	invoke: {value: function(){
	    //this.current_config.animate_dur = this.current_config.animate_dur / 1.25;
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //update scope animations data
	    for(var i=0;i<scope.data.animations.length;i++){
		var a = scope.data.animations[i];
		if (a.decor_line_id == scope.current.decor.line_id &&
		    a.start_second == scope.element_config.anim_start_second &&
		    a.color == scope.element_config.color) {
		    a.config.dur = utilService.decStep(a.config.dur);
		}
	    }
	    //tell angular animations data has changed
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    this.__proto__.afterinvoke(scope);
	}}
    });

    var animateBeginLaterTool = Object.create(basicTool,{
	instructions: {value: "delay more time before animation"},
	toolName: {value: "animatebeginlatertool"},
	invokeWillSet: {value: {key: "animate_begin", value:basicTool.current_config.animate_begin * 1.25}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //update scope animations data
	    for(var i=0;i<scope.data.animations.length;i++){
		var a = scope.data.animations[i];
		if (a.decor_line_id == scope.current.decor.line_id &&
		    a.start_second == scope.element_config.anim_start_second &&
		    a.color == scope.element_config.color) {
		    a.config.begin = utilService.incStep(a.config.begin,0.5);
		}
	    }
	    //tell angular animations data has changed
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    this.__proto__.afterinvoke(scope);
	}}
    });

    var animateBeginSoonerTool = Object.create(basicTool,{
	instructions: {value: "delay less time before animation"},
	toolName: {value: "animatebeginsoonertool"},
	invokeWillSet: {value: {key: "animate_begin", value:basicTool.current_config.animate_begin / 1.25}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //update scope animations data
	    for(var i=0;i<scope.data.animations.length;i++){
		var a = scope.data.animations[i];
		if (a.decor_line_id == scope.current.decor.line_id &&
		    a.start_second == scope.element_config.anim_start_second &&
		    a.color == scope.element_config.color) {
		    a.config.begin = utilService.decStep(a.config.begin,0.5);
		}
	    }
	    //tell angular animation data has changed
	    if(!scope.$$phase){
		scope.$apply();
	    }
	    this.__proto__.afterinvoke(scope);
	}}
    });

    var measureTool = Object.create(basicTool,{
	instructions: {value: "specify scale of the photo by providing length to a measured distance"},
	toolName: {value: "measuretool"},
	invokeWillSet: {value: {key: "light_type", value:'measurementTapeEnd'}},
	invoke: {value: function(){
	    //really the light is just the end of the measurement tape
	    this.current_config.light_type = 'measurementTapeEnd';
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    scope.current.widget.line_type = 'measurementScaling';
	    var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_type",scope.current.widget.line_type);
	    if(!angular.isUndefined(i)){
		scope.toggleDecorLine(scope.data.decor.decor_lines[i].decor_line_id);
		//if(!scope.data.decor.decor_lines[i].decor_line_visible){
		    scope.init_current();
		//}
	    }
	    return this;
	}}
    });

    var fancyWreathImageTool = Object.create(basicTool,{
	instructions: {value: "a fancy wreath with red bow, pine cone and mixed berry"},
	toolName: {value: "fancywreathimagetool"},
	invokeWillSet: {value: {key: "light_type", value:'fancyWreathImage'}},
	invoke: {value: function(){
	    this.current_config.light_type = 'fancyWreathImage';
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
    });

    var fancyGarlandImageTool = Object.create(basicTool,{
	instructions: {value: "a fancy garland"},
	toolName: {value: "fancygarlandimagetool"},
	invokeWillSet: {value: {key: "light_type", value:'fancyGarlandImage'}},
	invoke: {value: function(){
	    this.current_config.light_type = 'fancyGarlandImage';
	    this.current_config.decor_method = 'lineMulti';
	    return this;
	}},
    });

    var inch24WreathImageTool = Object.create(basicTool,{
	instructions: {value: "24 inches wreath with red bow"},
	toolName: {value: "24inchwreathimagetool"},
	invokeWillSet: {value: {key: "light_type", value:'fancyWreathImage'}},
	invoke: {value: function(){
	    this.current_config.light_type = 'fancyWreathImage';
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //fancyWreathImage has a size property in light.js to specify truesize of image
	    //when a picture is NOT scled, we use scaleFactor property in fancyWreathImage to show a size in scope.width (x units) that looks good
	    //when knowing scope.data.decor.num_inches_per_x_unit, we can calculate scale_factor more precisely:
	    if(scope.data.decor.num_inches_per_x_unit){
		var img = lightService.getLight('fancyWreathImage');
		this.current_config.scale_factor = img.size_scale_func(24,scope.data.decor.num_inches_per_x_unit);
	    }
	    return this;
	}}
    });

    var inch30WreathImageTool = Object.create(basicTool,{
	instructions: {value: "30 inches wreath with red bow"},
	toolName: {value: "30inchwreathimagetool"},
	invokeWillSet: {value: {key: "light_type", value:'fancyWreathImage'}},
	invoke: {value: function(){
	    this.current_config.light_type = 'fancyWreathImage';
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(scope.data.decor.num_inches_per_x_unit){
		var img = lightService.getLight('fancyWreathImage');
		this.current_config.scale_factor = img.size_scale_func(30,scope.data.decor.num_inches_per_x_unit);
	    }
	    return this;
	}}
    });

    var inch36WreathImageTool = Object.create(basicTool,{
	instructions: {value: "36 inches wreath with red bow"},
	toolName: {value: "36inchwreathimagetool"},
	invokeWillSet: {value: {key: "light_type", value:'fancyWreathImage'}},
	invoke: {value: function(){
	    this.current_config.light_type = 'fancyWreathImage';
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(scope.data.decor.num_inches_per_x_unit){
		var img = lightService.getLight('fancyWreathImage');
		this.current_config.scale_factor = img.size_scale_func(36,scope.data.decor.num_inches_per_x_unit);
	    }
	    return this;
	}}
    });

    var inch48WreathImageTool = Object.create(basicTool,{
	instructions: {value: "48 inches wreath with red bow"},
	toolName: {value: "48inchwreathimagetool"},
	invokeWillSet: {value: {key: "light_type", value:'fancyWreathImage'}},
	invoke: {value: function(){
	    this.current_config.light_type = 'fancyWreathImage';
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(scope.data.decor.num_inches_per_x_unit){
		var img = lightService.getLight('fancyWreathImage');
		this.current_config.scale_factor = img.size_scale_func(48,scope.data.decor.num_inches_per_x_unit);
	    }
	    return this;
	}}
    });

    var inch60WreathImageTool = Object.create(basicTool,{
	instructions: {value: "60 inches wreath with red bow"},
	toolName: {value: "60inchwreathimagetool"},
	invokeWillSet: {value: {key: "light_type", value:'fancyWreathImage'}},
	invoke: {value: function(){
	    this.current_config.light_type = 'fancyWreathImage';
	    this.current_config.decor_method = 'lineOne';
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(scope.data.decor.num_inches_per_x_unit){
		var img = lightService.getLight('fancyWreathImage');
		this.current_config.scale_factor = img.size_scale_func(60,scope.data.decor.num_inches_per_x_unit);
	    }
	    return this;
	}}
    });

    var saveTool = Object.create(basicTool,{
	instructions: {value: "save the decoration to the cloud"},
	toolName: {value: "savetool"},
	invokeWillSet: {value: {key: "", value: ""}},
	beforeinvoke: {value: function(scope){
	    //savetool trigger angularstrap modal control
	    if(scope.data.decor.decor_lines.length==0 && !scope.data.decor.backgroundurl){
		$alert({
		    title: 'can not save empty decor!',
		    content: 'There is nothing to save',
		    placement: 'top-right',
		    type: 'danger',
		    duration: 3
		});		  
		return false;
	    }else{
		var saveDialog = $aside({scope:scope,template:'partials/savedecor.html',placement:'left',keyboard:true,show:false,animation:'am-slide-left',title:'Save Decoration'});
		scope.saveDialog = saveDialog;
		saveDialog.$promise.then(function(){
		    saveDialog.show();
		});
	    }
	    return this;
	}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //scope.saveDecor();
	}}
    });

    var deleteTool = Object.create(basicTool,{
	instructions: {value: "delete the decoration from the cloud"},
	toolName: {value: "deletetool"},
	invokeWillSet: {value: {key: "", value: ""}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    $modal({template: 'partials/deletedecor.html', show: true, backdrop: 'static', scope:scope});
	}}
    });

    var exitTool = Object.create(basicTool,{
	instructions: {value: "exit the decor screen and clean decor data"},
	toolName: {value: "exittool"},
	invokeWillSet: {value: {key: "", value: ""}},
	beforeinvoke: {value: function(scope){
	    return this;
	}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //clean cached decor data
	    decorDataService.resetData();
	    scope.keepDataInCache = false;
	    $location.path('/');
	}}
	/*afterinvoke: {value: function(scope){
	    var answer = confirm("Are you sure you want to leave this decor?")
            if (answer) {
		//clean cached decor data
		decorDataService.resetData();
		scope.data = decorDataService.getData();
		$location.path('/');
            }
	}}*/
    });

    var musicToolOld = Object.create(basicTool,{
	instructions: {value: "play music"},
	toolName: {value: "musictoolold"},
	invokeWillSet: {value: {key: "music", value:''}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    function toggleAudio(){
		if(!scope.current.music){
		    scope.current.music = {};
		}
		if(!scope.current.music.playing){
		    playAudio();
		}else{
		    pauseAudio();
		}
	    }
	    function playAudio(){
		if(typeof (scope.current.music.track)!='undefined'){
		    var dur = scope.current.music.track.getDuration(); //seconds
		    scope.current.music.playing = true;
		    setupProgressTimer(dur);
		    //scope.current.music.track.setPosition(0);
		    scope.current.music.track.play(scope.song);
		}else{
		    scope.current.music.playing = false;
		    createjs.Sound.removeAllEventListeners("fileload");
		    createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashAudioPlugin]);
		    createjs.Sound.alternateExtensions = ["mp3"];
		    createjs.Sound.registerSound(scope.song,scope.song,1,true,"/img/");
		    createjs.Sound.addEventListener("fileload",handleLoaded);
		}
	    }
	    function pauseAudio(){
		if(scope.current.music.track){
		    scope.current.music.playing = false;
		    scope.current.music.track.pause();
		}
		clearInterval(scope.current.music.progress_timer);
	    }
	    function handleComplete(){
		scope.current.music.playing = false;
		//clearInterval(scope.current.music.progress_timer);
		if(!scope.$$phase){	      
		    scope.$apply();
		}
	    }
	    function setupProgressTimer(dur){
		scope.current.music.progress_timer = setInterval(function(){
		    var pos = scope.current.music.track.getPosition();
		    var progress = Math.round(100*pos/dur)/100;
		    $('.decor-ctrls .progress-bar').css("width",function(i){
			if(progress*100 < 100){
			    return (progress*100)+"%";
			}
		    });
		},100);
	    }
	    function handleLoaded(){
		scope.current.music.track = createjs.Sound.createInstance(scope.song);
		scope.current.music.progress_timer = 0;
		var dur = scope.current.music.track.getDuration(); //seconds
		//var pos = 0;
		//var progress = 0;//Math.round(100*pos/dur)/100;
		setupProgressTimer(dur);
		//fast forward for testing
		//scope.current.music.track.setPosition(222000);
		/*var dur = scope.current.music.track.getDuration(); //seconds
		console.log("dur " + dur);
		d3.select(".decor-ctrls .progress-bar")
		    .transition()
		    .duration(dur)
		    .ease("linear")
		    .style('width', '100%');
		scope.current.music.track.setPosition(262000);*/
		scope.current.music.track.play();
		scope.current.music.playing = true;
		if(!scope.$$phase){	      
		    scope.$apply();
		}
		scope.current.music.track.on("complete",handleComplete);
		//click on progressbar to fastforward or fastbackward
		$('.progress').bind('click', function (ev) {
		    var $div = $(ev.target);
		    var $display = $div.find('.progress-bar');
		    
		    var offset = $div.offset();
		    var x = ev.clientX - offset.left;
		    var progress = 100*x/$div.width();
		    if(scope.current.music.playing){
			scope.current.music.track.setPosition(dur*progress/100);
			d3.select(".decor-ctrls .progress-bar").style('width', progress+'%');
		    }
		});
	    }
	    toggleAudio();
	}}
    });

    var volumeOnOffToolOld = Object.create(basicTool,{
	instructions: {value: "adjust music volume"},
	toolName: {value: "volumeonofftoolold"},
	invokeWillSet: {value: {key: "", value:''}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(scope.current.music.track){
		scope.current.music.track.volume = scope.current.music.track.volume == 0? 0.5 : 0;
		var tool = _.find(scope.data.tools,function(tool){return tool.name=='volumeonofftool'});
		if(scope.current.music.track.volume==0){
		    tool.icon_toggle = true;
		}else{
		    tool.icon_toggle = false;
		}
	    }
	}}
    });	

    var musicTool = Object.create(basicTool,{
	instructions: {value: "play music"},
	toolName: {value: "musictool"},
	invokeWillSet: {value: {key: "music", value:''}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    var dur = 0;

	    function toggleAudio(){
		if(!scope.current.music){
		    scope.current.music = {};
		}
		if(!scope.current.music.playing){
		    playAudio();
		}else{
		    pauseAudio();
		}
	    }
	    function playAudio(){
		if(typeof (scope.current.music.track)!='undefined'){
		    scope.current.music.playing = true;
		    scope.current.music.track.play({
			onfinish: handleComplete,
			whileplaying: function(){updateProgress(this.position,this.duration)},
		    });
		}else{
		    scope.current.music.playing = false;

		    soundManager.setup({
			// where to find the SWF files, if needed
			flashVersion: 9,		
			onready: function() {
			    if(!scope.data.decor.mediaurl){
				//final backup song
				scope.data.decor.mediaurl = "img/PaulGentry_ChristmasMorning.mp3";
			    }
			    // SM2 has loaded, API ready to use e.g., createSound() etc.
			    var mySound = soundManager.createSound({
				id: "backgroundmusic",
				url: scope.data.decor.mediaurl
			    });
			    scope.current.music.track = mySound;
			    mySound.load({
				onload: function() {
				    dur = this.duration; //seconds
				},
			    });
			    scope.current.music.progress_timer = 0;
			    scope.current.music.track.play({
				onfinish: handleComplete,
				whileplaying: function(){updateProgress(this.position,this.duration)},
			    });
			    scope.current.music.playing = true;
			    if(!scope.$$phase){	      
				scope.$apply();
			    }
			    //click on progressbar to fastforward or fastbackward
			    $('.progress').bind('click', function (ev) {
				var $div = $(ev.target);
				var $display = $div.find('.progress-bar');
				
				var offset = $div.offset();
				var x = ev.clientX - offset.left;
				var progress = 100*x/$div.width();
				if(scope.current.music.playing){
				    //scope.current.music.track.setPosition(dur*progress/100);
				    soundManager.setPosition("backgroundmusic",dur*progress/100);
				    d3.select(".decor-ctrls .progress-bar").style('width', progress+'%');
				}
			    });
			},
			ontimeout: function() {
			    // Uh-oh. No HTML5 support, SWF missing, Flash blocked or other issue
			    alert("Can not play sound!");
			}
		    });
		}
	    }//end func playAudio

	    function pauseAudio(){
		if(scope.current.music.track){
		    scope.current.music.playing = false;
		    scope.current.music.track.pause();
		}
	    }

	    function handleComplete(){
		scope.current.music.playing = false;
		scope.current.animation.night = false;
		scope.current.animation.start = false;
		$('.decor-ctrls .progress-bar').css("width",function(i){
		    return (0*100)+"%";
		});
		
		if(!scope.$$phase){	      
		    scope.$apply();
		}
	    }

	    function updateProgress(pos,dur){
		var progress = Math.round(100*pos/dur)/100;
		$('.decor-ctrls .progress-bar').css("width",function(i){
		    if(progress*100 < 100){
			return (progress*100)+"%";
		    }
		});				    
	    }

	    toggleAudio();
	}}
    });

    var volumeOnOffTool = Object.create(basicTool,{
	instructions: {value: "adjust music volume"},
	toolName: {value: "volumeonofftool"},
	invokeWillSet: {value: {key: "", value:''}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    if(scope.current.music.track){
		scope.current.music.track.toggleMute();
		var tool = _.find(scope.data.tools,function(tool){return tool.name=='volumeonofftool'});
		tool.icon_toggle = scope.current.music.track.muted;
	    }
	}}
    });	

    var cameraTool = Object.create(basicTool,{
	instructions: {value: "load or take a picture"},
	toolName: {value: "cameratool"},
	invokeWillSet: {value: {key: "backgroundurl", value:''}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    var reader;
	    var progress = $(".percent");
	    function errorHandler(evt){
		switch(evt.target.error.code){
		    case evt.target.error.NOT_FOUND_ERR:
		        alert("File Not Found!");
		        break;
		    case evt.taget.error.NOT_READABLE_ERR:
		        alert("File is not readable");
		        break;
		    case evt.target.error.ABORT_ERR:
		        break;
		    default:
		        alert("Error coocurred while reading file");
		}
	    }
	    function updateProgress(evt){
		if(evt.lengthComputable){
		    var percentLoaded = Math.round((evt.loaded/evt.total)*100);
		    if(percentLoaded<100){
			progress.attr("style","width:'"+percentLoaded+"%'");
			progress.attr("textContent",percentLoaded+"%");
		    }
		}
	    }
	    function handleFileSelect(evt){
		progress.attr("style","width:'0%'");
		progress.attr("textContent",'0%');
		reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onprogress = updateProgress;
		reader.onabort = function(e){alert("File read cancelled")}
		reader.onloadstart = function(e){
		    $("#background_img_file").attr("class","loading");
		}
		reader.onloadend = function(e){
		    e.preventDefault();
		    progress.attr("style","width:'100%'");
		    progress.attr("textContent","100%");
		    setTimeout(function(){
			$("#background_img_file").attr("class","");
		    },2000);
		    //filetype like image/jpeg
		    //var filetype = evt.target.files[0].type;
		    var num_elements = _.reduce(_.map(scope.data.decor.decor_lines,function(dl){return dl.elements.length}),function(sum,num){return sum+num});
		    if(num_elements>0){
			if(confirm("Do you want to start over?")){
			    scope.clear_all_decors();
			    scope.data.decor.backgroundurl = e.target.result;
			    scope.setDirty(true);
			    if(!scope.$$phase){
				scope.$apply();
			    }
			    return false;
			}else{
			    $("#background_img_file").val("");
			    return false;
			};
		    }else{
			scope.data.decor.backgroundurl = e.target.result;
			if(!scope.$$phase){
			    scope.$apply();
			}
		    }
		}
		//read image file as binary string
		reader.readAsDataURL(evt.target.files[0]);
	    }
	    //need to unbind change first since on change will add handleFileSelect to event listener
	    //causing multiple listeners be executed when file is changed
	    //which in turn causing confirm dialog show up multiple times
	    $("#background_img_file").unbind("change").on("change",handleFileSelect);
	    $("#background_img_file").click();
	}},
    });	

    var loadMediaTool = Object.create(basicTool,{
	instructions: {value: "load a music"},
	toolName: {value: "loadmediatool"},
	invokeWillSet: {value: {key: "mediaurl", value: ''}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //angularstrap modal
	    $modal({template: 'partials/loaddecormusic.html', show: true, backdrop: 'static', scope:scope});
	}}
    })

    var loadMediaTool2 = Object.create(basicTool,{
	instructions: {value: "load a picture or a music"},
	toolName: {value: "loadmediatool2"},
	invokeWillSet: {value: {key: "mediaurl", value:''}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    var reader;
	    var progress = $(".percent");
	    function errorHandler(evt){
		switch(evt.target.error.code){
		    case evt.target.error.NOT_FOUND_ERR:
		        alert("File Not Found!");
		        break;
		    case evt.taget.error.NOT_READABLE_ERR:
		        alert("File is not readable");
		        break;
		    case evt.target.error.ABORT_ERR:
		        break;
		    default:
		        alert("Error coocurred while reading file");
		}
	    }
	    function updateProgress(evt){
		if(evt.lengthComputable){
		    var percentLoaded = Math.round((evt.loaded/evt.total)*100);
		    if(percentLoaded<100){
			progress.attr("style","width:'"+percentLoaded+"%'");
			progress.attr("textContent",percentLoaded+"%");
		    }
		}
	    }
	    function handleFileSelect(evt){
		progress.attr("style","width:'0%'");
		progress.attr("textContent",'0%');
		reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onprogress = updateProgress;
		reader.onabort = function(e){alert("File read cancelled")}
		reader.onloadstart = function(e){
		    $("#background_img_file").attr("class","loading");
		}
		reader.onloadend = function(e){
		    e.preventDefault();
		    progress.attr("style","width:'100%'");
		    progress.attr("textContent","100%");
		    setTimeout(function(){
			$("#background_img_file").attr("class","");
		    },2000);
		    //filetype like image/jpeg
		    //var filetype = evt.target.files[0].type;
		    var num_elements = _.reduce(_.map(scope.data.decor.decor_lines,function(dl){return dl.elements.length}),function(sum,num){return sum+num});
		    //if(num_elements>0){
		    if(false){
			if(confirm("Do you want to start over?")){
			    scope.clear_all_decors();
			    scope.data.decor.mediaurl = e.target.result;
			    scope.setDirty(true);
			    scope.current.music.playing = false;
			    scope.current.animation.start = false;
			    if(scope.current.music.track){
				scope.current.music.track.destruct();
				scope.current.music.track = undefined;
				scope.current.music.playing = false;
			    }
			    if(!scope.$$phase){
				scope.$apply();
			    }
			    return false;
			}else{
			    $("#background_img_file").val("");
			    return false;
			};
		    }else{
			scope.data.decor.mediaurl = e.target.result;
			scope.setDirty(true);
			scope.current.music.playing = false;
			scope.current.animation.start = false;
			if(scope.current.music.track){
			    scope.current.music.track.destruct();
			    scope.current.music.track = undefined;
			    scope.current.music.playing = false;
			}
			if(!scope.$$phase){
			    scope.$apply();
			}
		    }
		}
		//read media file as binary string
		reader.readAsDataURL(evt.target.files[0]);
	    }
	    //need to unbind change first since on change will add handleFileSelect to event listener
	    //causing multiple listeners be executed when file is changed
	    //which in turn causing confirm dialog show up multiple times
	    $("#background_img_file").unbind("change").on("change",handleFileSelect);
	    $("#background_img_file").click();
	}}
    });

    var snowTool = Object.create(basicTool,{
	instructions: {value: "let it snow"},
	toolName: {value: "snowtool"},
	invokeWillSet: {value: {key: "", value: ""}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    var snowfunc = function($compile){
		//need to inject $compile service
		/*scope.svg.select("g.decor g.foreground").selectAll("g.weather").remove();
		scope.svg.select("g.decor g.foreground").append("g").attr("class","weather").attr("snow","");
		$compile($("g.weather"))(scope);*/
		$("div.decormain div.weather").remove();
		$("div.decormain").append("<div class='weather' snow></div>");
		$compile($("div.weather"))(scope);
	    };
	    //avoid minimization replace $compile paramter with b
	    snowfunc.$inject = ['$compile'];
	    $injector.invoke(snowfunc,null);
	}}
    });

    var rainTool = Object.create(basicTool,{
	instructions: {value: "wet day"},
	toolName: {value: "raintool"},
	invokeWillSet: {value: {key: "", value: ""}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    var rainfunc = function($compile){
		//need to inject $compile service
		/*scope.svg.select("g.decor g.foreground").selectAll("g.weather").remove();
		scope.svg.select("g.decor g.foreground").append("g").attr("class","weather")
		    .attr("rain","");
		$compile($("g.weather"))(scope);*/
		$("div.decormain div.weather").remove();
		$("div.decormain").append("<div class='weather' rain></div>");
		$compile($("div.weather"))(scope);
	    };
	    //avoid minimization replace $compile paramter with b
	    rainfunc.$inject = ['$compile'];
	    $injector.invoke(rainfunc,null);
	}}
    });

    var sunnyTool = Object.create(basicTool,{
	instructions: {value: "a clear bright day"},
	toolName: {value: "sunnytool"},
	invokeWillSet: {value: {key: "", value: ""}},
	invoke: {value: function(){
	    return this;
	}},
	afterinvoke: {value: function(scope){
	    //scope.svg.select("g.decor g.foreground").selectAll("g.weather").remove();
	    $("div.decormain div.weather").remove();
	}}
    });

    //return the service object which provide a lookup method getDecor to get the decor object given decor_line_type
    return {
      tools: [basicXmasLightTypeTool, basicGroundLightTypeTool, shiningXmasLightTypeTool, 
	      lineOneTool, lineMultiTool, polyMultiTool, 
	      yellowColorTool, whiteColorTool, orangeColorTool, greenColorTool, blueColorTool, 
	      redColorTool, purpleColorTool, randomColorTool, rgbColorTool, 
	      sizeUpTool, sizeDownTool, setSizeUpTool, setSizeDownTool, 
	      gapUpTool, gapDownTool, shadowSizeUpTool, shadowSizeDownTool,
	      rotateLeftTool, rotateRightTool, rotateRandomTool, 
	      nightTool, measureTool, cameraTool, loadMediaTool, loadMediaTool2, musicTool, volumeOnOffTool,
	      snowTool, rainTool, sunnyTool,
	      animateStartTool, 
	      animateStartPlusFiveSecondTool, animateStartMinusFiveSecondTool,
	      fancyWreathImageTool, inch24WreathImageTool, inch30WreathImageTool, inch36WreathImageTool, inch48WreathImageTool, inch60WreathImageTool, 
	      fancyGarlandImageTool,
	      saveTool, deleteTool, exitTool
	     ],
      getTool: function(tool_name){
	  //getToolByToolName
	  //find the tool object in tools with tool_type as toolName
	  for(var m=0;m<this.tools.length;m++){
	      if(this.tools[m].toolName.toLowerCase() == tool_name.toLowerCase()){
		  return this.tools[m];
	      }
	  }
	  return basicTool;
      },
      getToolByConfigField: function(config_key,config_value){
	  //getToolByConfigField
	  //find the tool object in tools with will set config_key to config_value
	  for(var m=0;m<this.tools.length;m++){
	      if(this.tools[m].invokeWillSet.key == config_key &&
		 this.tools[m].invokeWillSet.value == config_value){
		  return this.tools[m];
	      }
	  }
	  return basicTool;
      }
    };
  }]);

/*
 *   this file define utilService which provide some common utility functions
 */
angular.module("lightgalaApp")
  .factory("utilService",function(){
    return {
	getArrayIndexWithPropertyEqualTo: function(arr,propname,propval){
	    for(var i=0;i<arr.length;i++){
		if(angular.isObject(arr[i])){
		    if(arr[i].hasOwnProperty(propname)){
			if(arr[i][propname]==propval){
			    return i;
			}
		    }
		}
	    }
	    return undefined;
	},
	getArrayIndexWithPropertyEqualToIgnoreCase: function(arr,propname,propval){
	    for(var i=0;i<arr.length;i++){
		if(angular.isObject(arr[i])){
		    if(arr[i].hasOwnProperty(propname)){
			if((arr[i][propname]+'').toLowerCase()==(propval+'').toLowerCase()){
			    return i;
			}
		    }
		}
	    }
	    return undefined;
	},
	uniqueId: function(i){
	    return Date.now()+'_'+i;
	},
	maxmin: function(array,accessor_func){
	    //for each object in array get the value returned by accessor_func and return max of it
	    //this is the same as implemented in d3.max and d3.min
	    var lowest = Number.POSITIVE_INFINITY;
	    var highest = Number.NEGATIVE_INFINITY;
	    var tmp;
	    for (var i=array.length-1; i>=0; i--) {
		tmp = accessor_func(array[i]);
		if (tmp < lowest) lowest = tmp;
		if (tmp > highest) highest = tmp;
	    }
	    return {max:highest, min:lowest};
	},
	removeArrayElementSatisfy: function(array,cond_func){
	    //for each object in array get the value returned by accessor_func and return max of it
	    //this is the similar as implemented in $.grep except it modifies the array
	    for (var i=array.length-1; i>=0; i--) {
		if(cond_func(array[i])){
		    array.splice(i,1);
		}
	    }
	    return array;
	},
	isNumber: function(n){
	    return n == parseFloat(n);
	},
	isEven: function(n){
	    return this.isNumber(n) && (n % 2 == 0);
	},
	isOdd: function(n){
	    return this.isNumber(n) && (Math.abs(n) % 2 == 1);
	},
	dist: function(point_1,point_2){
	    //point like [12,14]
	    return Math.round(Math.sqrt(Math.pow((point_2[1]-point_1[1]),2) + Math.pow((point_2[0]-point_1[0]),2)));
	},
	addEvent: function(elem, type, eventHandle) {
	    //not working?
	    if (elem == null || typeof(elem) == 'undefined') return;
	    if ( elem.addEventListener ) {
		elem.addEventListener( type, eventHandle, false );
	    } else if ( elem.attachEvent ) {
		elem.attachEvent( "on" + type, eventHandle );
	    } else {
		elem["on"+type]=eventHandle;
	    }
	},
	onceFunc: function(f){
	    //create a function which will run f only run once
	    var i=0;
	    return function(){
		if(i==0){
		    i=i+1;
		    f();
		}
	    }
	},
	nceFunc: function(f,n){
	    //create a function which will run f no more than n times (0,1,...n-1)
	    var i=0;
	    return function(){
		if(i<n){
		    i=i+1;
		    f();
		}
	    };
	},
	convertToRelative: function(path) {
	    function set(type) {
		var args = [].slice.call(arguments, 1)
		, rcmd = 'createSVGPathSeg'+ type +'Rel'
		, rseg = path[rcmd].apply(path, args);
		segs.replaceItem(rseg, i);
	    }
	    var dx, dy, x0, y0, x1, y1, x2, y2, segs = path.pathSegList;
	    for (var x = 0, y = 0, i = 0, len = segs.numberOfItems; i < len; i++) {
		var seg = segs.getItem(i)
		, c   = seg.pathSegTypeAsLetter;
		if (/[MLHVCSQTAZz]/.test(c)) {
		    if ('x1' in seg) x1 = seg.x1 - x;
		    if ('x2' in seg) x2 = seg.x2 - x;
		    if ('y1' in seg) y1 = seg.y1 - y;
		    if ('y2' in seg) y2 = seg.y2 - y;
		    if ('x'  in seg) dx = -x + (x = seg.x);
		    if ('y'  in seg) dy = -y + (y = seg.y);
		    switch (c) {
		    case 'M': set('Moveto',dx,dy);                   break;
		    case 'L': set('Lineto',dx,dy);                   break;
		    case 'H': set('LinetoHorizontal',dx);            break;
		    case 'V': set('LinetoVertical',dy);              break;
		    case 'C': set('CurvetoCubic',dx,dy,x1,y1,x2,y2); break;
		    case 'S': set('CurvetoCubicSmooth',dx,dy,x2,y2); break;
		    case 'Q': set('CurvetoQuadratic',dx,dy,x1,y1);   break;
		    case 'T': set('CurvetoQuadraticSmooth',dx,dy);   break;
		    case 'A': set('Arc',dx,dy,seg.r1,seg.r2,seg.angle,
				  seg.largeArcFlag,seg.sweepFlag);   break;
		    case 'Z': case 'z': x = x0; y = y0; break;
		    }
		}
		else {
		    if ('x' in seg) x += seg.x;
		    if ('y' in seg) y += seg.y;
		}
		// store the start of a subpath
		if (c == 'M' || c == 'm') {
		    x0 = x;
		    y0 = y;
		}
	    }
	    path.setAttribute('d', path.getAttribute('d').replace(/Z/g, 'z'));
	},
	dynamicSortMultiple: function() {
	    /*
	     * save the arguments object as it will be overwritten
	     * note that arguments object is an array-like object
	     * consisting of the names of the properties to sort by
	     * usage: arr.sort(dynamicSortMultiple("c","b","a"))
	     */
	    var dynamicSort = function(property) { 
		return function (obj1,obj2) {
		    return obj1[property] > obj2[property] ? 1
		    : obj1[property] < obj2[property] ? -1 : 0;
		}
	    };
	    var props = arguments;
	    return function (obj1, obj2) {
		var i = 0, result = 0, numberOfProperties = props.length;
		/* try getting a different result from 0 (equal)
		 * as long as we have extra properties to compare
		 */
		while(result === 0 && i < numberOfProperties) {
		    result = dynamicSort(props[i])(obj1, obj2);
		    i++;
		}
		return result;
	    }
	},
	swapObjPropValue: function(obj,prop1,prop2){
	    var tmp = angular.copy(obj[prop1]);
	    obj[prop1] = obj[prop2];
	    obj[prop2] = tmp;
	},
	datediff: function(d1,d2){
	    var DateDiff = {
		
		inHours: function(d1,d2) {
		    var t2 = d2.getTime();
		    var t1 = d1.getTime();
		    
		    return parseInt((t2-t1)/(3600*1000));		    
		},

		inDays: function(d1, d2) {
		    var t2 = d2.getTime();
		    var t1 = d1.getTime();
		    
		    return parseInt((t2-t1)/(24*3600*1000));
		},
		
		inWeeks: function(d1, d2) {
		    var t2 = d2.getTime();
		    var t1 = d1.getTime();
		    
		    return parseInt((t2-t1)/(24*3600*1000*7));
		},
		
		inMonths: function(d1, d2) {
		    var d1Y = d1.getFullYear();
		    var d2Y = d2.getFullYear();
		    var d1M = d1.getMonth();
		    var d2M = d2.getMonth();
		    
		    return (d2M+12*d2Y)-(d1M+12*d1Y);
		},
		
		inYears: function(d1, d2) {
		    return d2.getFullYear()-d1.getFullYear();
		}
	    };
	    return DateDiff.inYears(d1,d2) > 1 ? DateDiff.inYears(d1,d2) + ' years ago' :
		DateDiff.inMonths(d1,d2) > 1 ? DateDiff.inMonths(d1,d2) + ' months ago' :
		DateDiff.inWeeks(d1,d2) > 1 ? DateDiff.inWeeks(d1,d2) + ' weeks ago' :
		DateDiff.inDays(d1,d2) > 1 ? DateDiff.inDays(d1,d2) + ' days ago':
		DateDiff.inHours(d1,d2) > 1 ? DateDiff.inHours(d1,d2) + ' hours ago':
		' just now';
	},
	arrays_equal: function(a,b) { 
	    return !(a<b || b<a); 
	},
	splitPrompts: function(prompts){
	    //split [{prompt:'I love you'}] to [{prompt: 'I',promtpindex:0,promptlen:10,letterindex:0},{prompt: 'l'},{prompt: 'o'}...]
	    return _.flatten(_.map(prompts,function(prompt,prompt_index){
		var letters = prompt.prompt.split("");
		return _.map(letters,function(letter,letter_index){
		    return {prompt:letter,
			    promptindex:prompt_index,
			    promptlen:prompt.prompt.length,
			    letterindex:letter_index
			   };
		})
	    }),true);
	},
	rgbStringToHslString: function(rgbStr){
	    var re = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
	    var rgb_m = re.exec(rgbStr);
	    var val = rgbStr;
            if(rgb_m){
		val = this.rgbToHsl(rgb_m[1],rgb_m[2],rgb_m[3]);
		var hsl = "hsl("+parseInt(val[0]*360)+","+parseInt(val[1]*100)+"%,"+parseInt(val[2]*100)+"%)";
		return hsl;
	    }
	    return val;	    
	},
	hslStringToRgbString: function(hslStr){
	    var re = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/;
	    var hsl_m = re.exec(hslStr);
	    var val = hslStr;
            if(hsl_m){
		val = this.hslToRgb(hsl_m[1]/360,hsl_m[2]/100,hsl_m[3]/100);
		var rgb = "rgb("+parseInt(val[0]*255)+","+parseInt(val[1]*255)+","+parseInt(val[2]*255)+")";
		return rgb;
	    }
	    return val;
	},
	rgbToHsl: function(r, g, b){
	    r /= 255, g /= 255, b /= 255;
	    var max = Math.max(r, g, b), min = Math.min(r, g, b);
	    var h, s, l = (max + min) / 2;
	    
	    if(max == min){
		h = s = 0; // achromatic
	    }else{
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch(max){
		case r: h = (g - b) / d + (g < b ? 6 : 0); break;
		case g: h = (b - r) / d + 2; break;
		case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	    }
	    
	    return [h, s, l];
	},
	hslToRgb: function (h, s, l){
	    var r, g, b;
		
	    if(s == 0){
		r = g = b = l; // achromatic
	    }else{
		function hue2rgb(p, q, t){
		    if(t < 0) t += 1;
		    if(t > 1) t -= 1;
		    if(t < 1/6) return p + (q - p) * 6 * t;
		    if(t < 1/2) return q;
		    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		    return p;
		}
		
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	    }
	    
	    //return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
	    return [r,g,b];
	},
	randomColor: function(){
	    var self = this;
	    var golden_ratio_conjugate = 0.618033988749895;
	    var h = Math.random();
	    
	    return function(){
		h += golden_ratio_conjugate;
		h %= 1;
		//return self.hslToRgb(h, 0.5, 0.60);
		return "hsl("+parseInt(h*360)+",50%,60%)";
	    };
	},
	interpolateHSL: function(hsl1,hsl2,n){
	    //interpolate n colors inbetween stopcolor1:'hsl(0, 0%, 43%)',stopcolor2:'hsl(200, 99%, 63%)'
	    var re = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/;
	    var hsl1_m = re.exec(String(hsl1));  //["hsl(0, 0%, 43%)", "0", "0", "43"]
	    var hsl2_m = re.exec(String(hsl2));
	    var hsl = _.map(new Array(n),function(x,i){
		var h = Math.min(hsl2_m[1],hsl1_m[1])+parseInt(i/n * Math.abs((hsl2_m[1]-hsl1_m[1])));
		var s = Math.min(hsl2_m[2],hsl1_m[2])+parseInt(i/n * Math.abs((hsl2_m[2]-hsl1_m[2])));
		var l = Math.min(hsl2_m[3],hsl1_m[3])+parseInt(i/n * Math.abs((hsl2_m[3]-hsl1_m[3])));
		return 'hsl('+h+', '+s+'%, '+l+'%)';
	    });
	    return hsl.concat(angular.copy(hsl).reverse()).join(";");
	},
	decStep: function(str,constantStep){
	    //begin_str like '1.9s'
	    if(str){
		var num = parseFloat(str.substring(0,str.length-1))
		num = num<=0? 0.1 : num;
	    }else{
		num = 0.1
	    }
	    if(constantStep){
		num = num-constantStep > 0? num-constantStep : 0;
		return Math.round(num*100)/100 + 's';
	    }else{
		return Math.round(num*0.75*100)/100 + 's';
	    }
	},
	incStep: function(str,constantStep){
	    //begin_str like '1.9s'
	    if(str){
		var num = parseFloat(str.substring(0,str.length-1))
		num = num>=60? 60 : num<=0? 0.1 : num; 
	    }else{
		num = 0.1
	    }
	    if(constantStep){
		return Math.round((num+constantStep)*100)/100 + 's';
	    }else{
		return Math.round(num*1.25*100)/100 + 's';
	    }
	},
	anotherFunc: function(){
	}
    }
});

angular.module("lightgalaApp")
  .directive("ads",function(){
    return {
        restrict: 'A',
	template: '<div ng-include="contentUrl"></div>',
	link: function(scope, element, attrs) {
	    //scope.contentUrl = 'partials/' + attrs.adname + '.html';
            /*attrs.$observe("adname",function(adname){
		scope.contentUrl = 'partials/' + adname + '.html';
            });*/
	},
        controller: function(){
	    (adsbygoogle = window.adsbygoogle || []).push({});
	}      
    }});

angular.module("lightgalaApp")
    .directive('rgbHsl',['utilService',function(utilService){
	return {
	    require: 'ngModel',
	    link: function(scope, element, attrs, modelCtrl) {
	        modelCtrl.$parsers.push(function(inputValue){
		    var re = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
		    var rgb_m = re.exec(inputValue);
		    var val = inputValue;
                    if(rgb_m){
			val = utilService.rgbToHsl(rgb_m[1],rgb_m[2],rgb_m[3]);
			var hsl = "hsl("+parseInt(val[0]*360)+","+parseInt(val[1]*100)+"%,"+parseInt(val[2]*100)+"%)";
			//modelCtrl.$setViewValue(hsl);
			//modelCtrl.$render();
			return hsl;
		    }
		    return val;
		});
		modelCtrl.$formatters.push(function(valInModel){
		    //widgets colorchooser use rgb, color in model is saved as hsl, convert here
		    var re = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/;
		    var hsl_m = re.exec(valInModel);
		    var val = valInModel;
                    if(hsl_m){
			val = utilService.hslToRgb(hsl_m[1]/360,hsl_m[2]/100,hsl_m[3]/100);
			var rgb = "rgb("+parseInt(val[0]*255)+","+parseInt(val[1]*255)+","+parseInt(val[2]*255)+")";
			return rgb;
		    }
		    return val;
		})
	    }
    }}])
    .directive('popOver', ['$compile','utilService','toolService','lightAnimService',function ($compile,utilService,toolService,lightAnimService) {
	//be careful, need to escape backslash in regex with another backslash in template of directive
	//and notice how toolname is passed to selectTool defined in isoloatedscope pointing to selectTool in controller scope
	//var animationsTemplate = "<table class='table table-condensed small anim-settings'><tr><th><small style='white-space: nowrap;display:inline-block'><span class='glyphicon icon-plus2' ng-click=selectTool({toolname:'animatestartplusfivesecondtool'})></span>{{anim_start_second}}<span class='glyphicon icon-minus' ng-click=selectTool({toolname:'animatestartminusfivesecondtool'})></span></small></th><th>set</th><th>seg</th><th>start</th><th>pattern</th><th>dur</th><th>delay</th><th>smooth</th></tr>	    <tr ng-repeat='anim in animations | filter:selectAnimation(decor_line_id)' decor_line_id='{{anim.decor_line_id}}' style='background-color:{{anim.config.stopcolor2}}' ng-mouseover='mouseOverAnim(anim.anim_id)' ng-mouseout='mouseLeaveAnim(anim.anim_id)'>	      <td><small><span class='glyphicon glyphicon-trash' anim-id='{{anim.anim_id}}' ng-click='delAnimation(anim.anim_id)'></span></small></td><td>{{anim.set}}</td><td>{{anim.segment}}</td><td><input type='number' ng-model='anim.start_second' ng-pattern='/^[\\d.]+$/' class='anim-input input-sm' /></td>	      <td><input ng-model='anim.config.pattern_code' ng-pattern='/^[01]+$/' class='anim-input input-sm' /></td>	      <td><input ng-model='anim.config.dur' ng-pattern='/^[\\d.]+s$/' class='anim-input input-sm' /></td>	      <td><input ng-model='anim.config.begin' ng-pattern='/^[\\d.]+s$/' class='anim-input input-sm' /></td>	      <td><select ng-model='anim.config.calcmode' ng-options='x.value as x.text for x in calcmodes' class='anim-input' /></td>	    </tr>	  </table>";
	var animationsTemplate = "<table class='table table-condensed small anim-settings'><tr><th><small style='white-space: nowrap;display:inline-block'><span class='glyphicon icon-plus2' ng-click=setAnimPlusFiveSecond(decor_line_id)></span>{{anim_start_second}}<span class='glyphicon icon-minus' ng-click=setAnimMinusFiveSecond(decor_line_id)></span></small></th><th>set</th><th>seg</th><th>start</th><th>pattern</th><th>dur</th><th>delay</th><th>smooth</th></tr>	    <tr ng-repeat='anim in animations | filter:selectAnimation(decor_line_id)' decor_line_id='{{anim.decor_line_id}}' style='background-color:{{anim.config.stopcolor2}}' class={{anim.active?'anim-active':''}} ng-mouseover='mouseOverAnim(anim.anim_id)' ng-mouseout='mouseLeaveAnim(anim.anim_id)'>	      <td><small><span class='glyphicon glyphicon-trash' anim-id='{{anim.anim_id}}' ng-click='delAnimation(anim.anim_id)'></span></small></td><td>{{anim.set}}</td><td>{{anim.segment}}</td><td><input type='number' ng-model='anim.start_second' ng-pattern='/^[\\d.]+$/' class='anim-input input-sm' /></td>	      <td ng-switch='anim.config.colorname'><div ng-switch-when='rgb'><span class='glyphicon icon-palette' style='background-color:{{anim.config.stopcolor1}}; font-size: 14px' rgb-hsl colorpicker='rgb' colorpicker-close-on-select colorpicker-position='bottom' ng-model='anim.config.stopcolor1'/><span class='glyphicon icon-palette' style='background-color:{{anim.config.stopcolor2}}; font-size: 14px' rgb-hsl colorpicker='rgb' colorpicker-close-on-select colorpicker-position='bottom' type='text' ng-model='anim.config.stopcolor2'/></div><input ng-switch-default ng-model='anim.config.pattern_code' ng-pattern='/^[01]+$/' class='anim-input input-sm' /></td>	      <td><input ng-model='anim.config.dur' ng-pattern='/^[\\d.]+s$/' class='anim-input input-sm' /></td>	      <td><input ng-model='anim.config.begin' ng-pattern='/^[\\d.]+s$/' class='anim-input input-sm' /></td>	      <td><select ng-model='anim.config.calcmode' ng-options='x.value as x.text for x in calcmodes' class='anim-input' /></td>	    </tr>	  </table>";
        var getTemplate = function (contentType) {
            var template = '';
            switch (contentType) {
                case 'animations':
                    template = animationsTemplate;
                    break;
            }
            return template;
        }
        return {
            restrict: "A",
            transclude: true,
            template: "<span ng-transclude></span>",
            link: function (scope, element, attrs) {
		//scope is isolocated scope
		scope.decor_line_id = attrs.decorLineId;
		scope.calcmodes = [{'value':'discrete','text':'N'},{'value':'','text':'Y'}];
		//rather than pointing to controller selectTool like the following, we defined selectTool in
		//isolated scope of the directive
		//scope.selectTool = scope.$parent.selectTool;
		//scope.anim_start_second = scope.$parent.element_config.anim_start_second;
		scope.selectAnimation = function(decor_line_id) {
		    return function(animation) {
			return decor_line_id?animation.decor_line_id == decor_line_id:false;
		    }
		};
		scope.delAnimation = function(anim_id){
		    var i = utilService.getArrayIndexWithPropertyEqualTo(scope.animations,"anim_id",anim_id);
		    scope.animations.splice(i,1);
		};
		scope.setAnimPlusFiveSecond = function(decor_line_id){
		    //check animations to see if it has start_second = this.current_config.anim_start_second +5
		    //if not, copy from anim_start_second
		    var anims_plus5 = _.filter(scope.animations,function(anim){
			return anim.decor_line_id == decor_line_id & anim.start_second == scope.anim_start_second +5;
		    });
		    if(anims_plus5.length==0){
			var anims_plus5 = angular.copy(_.filter(scope.animations,function(anim){
			    return anim.decor_line_id == decor_line_id & anim.start_second == scope.anim_start_second;
			}));
			_.forEach(anims_plus5,function(anim){
			    lightAnimService.getAnim().initialize(scope.animations,decor_line_id,anim.segment,anim.set,anim.color,anim.start_second+5,scope.defs[0].attributes);
			});
		    }
		    scope.anim_start_second += 5;
		};
		scope.setAnimMinusFiveSecond = function(decor_line_id){
		    //check animations to see if it has start_second = this.current_config.anim_start_second-5
		    //if not, copy from anim_start_second
		    var anims_minus5 = _.filter(scope.animations,function(anim){
			return anim.decor_line_id == decor_line_id & anim.start_second == scope.anim_start_second-5;
		    });
		    if(anims_minus5.length==0){
			var anims_minus5 = angular.copy(_.filter(scope.animations,function(anim){
			    return anim.decor_line_id == decor_line_id & anim.start_second == scope.anim_start_second;
			}));
			_.forEach(anims_minus5,function(anim){
			    lightAnimService.getAnim().initialize(scope.animations,decor_line_id,anim.segment,anim.set,anim.color,anim.start_second-5,scope.defs[0].attributes);
			});
		    }
		    scope.anim_start_second -= 5;
		};
		scope.mouseOverAnim = function(anim_id){
		    var anim = _.find(scope.animations,function(anim){
			return anim.anim_id == anim_id;
		    })
		    if(anim){
			d3.select("svg").select("g[decor_line_id='"+anim.decor_line_id+"']")
			    .selectAll("g[segment='"+anim.segment+"'][set='"+anim.set+"'][bulbcolor='"+anim.color+"']")
			    .selectAll(".click-capture")
			    .style("visibility","visible")
			    .classed("highlighted",true);
		    }
		};
		scope.mouseLeaveAnim = function(anim_id){
		    var anim = _.find(scope.animations,function(anim){
			return anim.anim_id == anim_id;
		    })
		    if(anim){
			d3.select("svg").select("g[decor_line_id='"+anim.decor_line_id+"']")
			    .selectAll("g[segment='"+anim.segment+"'][set='"+anim.set+"'][bulbcolor='"+anim.color+"']")
			    .selectAll(".click-capture")
			    .style("visibility","hidden")
			    .classed("highlighted",false);
		    }
		};
                var popOverContent;
                if (scope.animations) {
                    var html = getTemplate("animations");
                    popOverContent = $compile(html)(scope);                    
                }
                var options = {
                    content: popOverContent,
                    placement: "bottom",
                    html: true,
                    title: "animation settings",
                };
                $(element).popover(options).on("show.bs.popover", function(){ 
		    scope.anim_start_second = 0;
		    $('[data-original-title][decor_line_id!='+scope.decor_line_id+']').popover('hide');
		    $(this).data("bs.popover").tip().css("max-width", "360px"); 
		});
		//dismiss popover when click outside popover
		/*$('.widget_decor_lines').on('click', function (e) {
		    //did not click a popover toggle or popover or element with attr anim-id (trash icon)
		    if (!$(e.target).data('bs.popover')
			&& typeof( $(e.target).attr('anim-id')) == typeof(undefined)
			&& $(e.target).parents('.popover.in').length === 0) { 
			$('[data-original-title]').popover('hide');
		    }
		});*/
            },
	    scope: {
		animations: '=',
		current_config: '=',
		selectTool: '&',
		anim_start_second : '=animstartsecond',
		defs: '='
            },
        };
    }]);

angular.module("lightgalaApp")
  .directive("audiovisual",function(){
    //this directive generate audio visualization above the progressbar and under the decor svg
    return {
      restrict: 'EA',
      templateUrl: "../../partials/audiovisual.html",
      link: function(scope,ele,attrs){
	  
      } //end link function
    } //end return directive object
  })

angular.module("lightgalaApp")
  .directive("comments",function(){
    return {
        restrict: 'A',
	template: '',
	link: function(scope, element, attrs) {
	},
        controller: function(){
/* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
var disqus_shortname = 'lightgala-comments'; // required: replace example with your forum shortname

/* * * DON'T EDIT BELOW THIS LINE * * */
(function() {
var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
})();
	}      
    }});

angular.module("lightgalaApp")
  .directive("links",function(){
    return {
      restrict: 'EA',
      //templateUrl: "links.html",
      templateUrl: "../../partials/links.html",
      link: function(scope,ele,attrs){
      
      } //end link function
    } //end return directive object
  })

angular.module("lightgalaApp")
    .directive('mainDecor',['$q','$window','$http','$routeParams','$location','$alert','$modal','$rootScope','d3Service','decorsListService','decorService','decorDataService','lightSvgsService','lightService','lightAnimService','toolService','utilService',function($q,$window,$http,$routeParams,$location,$alert,$modal,$rootScope,d3Service,decorsListService,decorService,decorDataService,lightSvgsService,lightService,lightAnimService,toolService,utilService){
	return function(scope,ele,attrs){
	  scope.mode = attrs['mode']; //or view from attrs
	  //text shown in svg before backgroundurl is set
	  scope.backgroundtext = attrs['prompt'];
	  //scope.data.decor.backgroundurl = "/img/house.jpg";
	  scope.trashurl = "/img/trash.png";
	  scope.margins = {left: 14, right: 14, top: 10, bottom: 10};
	  //default current config
	  //scope.element_config = toolService.getTool("").current_config.install_supported_defs(scope.data.defs);

	  scope.init = function(){
	      if($routeParams.id){
		  //console.log("retrieving decor_id " + scope.decor_id);
		  if(true){
		    //use $resource
		    decorsListService.get({_id:$routeParams.id,mode:scope.mode},function(decor){
			if(!decor.with_app_data){
			    scope.data=decor;
			    //replace widget data and tools data with that in app_data
			    scope.data.widgets=decorDataService.getAppData().widgets;
			    scope.data.tools=decorDataService.getAppData().tools;
			    scope.data.defs=decorDataService.getAppData().defs;
			}else{
			    scope.data=decor;
			}
			scope.decor_id = decor._id;
			$rootScope.$broadcast("data_ready",{
			});
		    },function(response) {
			if(response.status === 401) {
			    $location.path('/login');
			    $alert({
				title: 'Login required!',
				content: 'Login required before editing decor.',
				placement: 'top-right',
				type: 'danger',
				duration: 3
			    });
			}
		    });
		  }else{
		    //use $http
		    $http.get('/db/collections/decors/' + $routeParams.id)
		      .success(function(data,status,headers,config){
			  scope.data = data;
			  scope.decor_id = data._id;
		      })
		      .error(function(data,status,headers,config){
			  scope.status = status;
		      });
		  }
	      }else{
		  //could start from cached data other than data_empty
		  console.log("make a new decor");
		  $rootScope.$broadcast("data_ready",{
		  });
	      }
	      if($routeParams.template_id){
		  if(true){
		    //use $resource
		    decorsListService.get({_id:$routeParams.template_id,mode:'edit_template'},function(decor){
			scope.data.decor.backgroundurl=decor.decor.backgroundurl;
			scope.data.decor.emailto=!decor.decor.user_id.fakedemail?decor.decor.user_id.email:'spearsear@gmail.com';  //populated with email
			scope.data.decor.address=decor.decor.address;
			if(!decor.with_app_data){
			    //replace widget data and tools data with that in app_data
			    scope.data.widgets=decorDataService.getAppData().widgets;
			    scope.data.tools=decorDataService.getAppData().tools;
			    scope.data.defs=decorDataService.getAppData().defs;
			}else{
			    scope.data.widgets=decor.widgets;
			    scope.data.tools=decor.tools;
			    scope.data.tools=decor.defs;
			}
			$rootScope.$broadcast("data_ready",{
			});
			console.log("using decor "+decor._id+" as template");
		    },function(response) {
			if(response.status === 401) {
			    $alert({
				title: 'Login required!',
				content: 'Login required before editing decor.',
				placement: 'top-right',
				type: 'danger',
				duration: 3
			    });
			}
		    });
		  }
	      }
	  };

	  /*ele.bind("$destroy", function () {
	      if(scope.current.music.playing){
		  //toggle stop music
		  toolService.getTool('musictool').invoke().afterinvoke(scope);
	      }
          });*/

	  var onRouteChangeOff = scope.$on('$locationChangeStart', function (event,newUrl) {
	      if(scope.current.animation.start){
		  scope.current.animation.start = false;
		  scope.current.animation.night = false;
	      }
	      if(scope.current.music.track){
		  //toggle stop music when user leave page
		  toolService.getTool('musictool').invoke().afterinvoke(scope);
		  //createjs.Sound.removeAllSounds();
		  scope.current.music.track.destruct();
		  scope.current.music.track = undefined;
		  scope.data.decor.mediaurl = undefined;
	      }
	      if(scope.mode === 'edit'){	      
		  if(scope.keepDataInCache){
		      //cache current decor data
		      decorDataService.setData(scope.data);
		  }else{
		      var exitModal = $modal({template: 'partials/exitdecor.html', show: false, backdrop: 'static', scope:scope});
		      if(!scope.dirty){
			  decorDataService.resetData();
			  onRouteChangeOff(); //Stop listening for location changes
			  $location.path(newUrl); //Go to page they're interested in
		      }else{
			  //dirty, ask save or not
			  exitModal.$promise.then(exitModal.show);
		      }
		      //prevent navigation by default since we'll handle it
		      //once the user selects a dialog option
		      event.preventDefault();
		      //return;
		  }
	      }
	      if(scope.mode === 'play'){
		  //always clean data as data_empty and reinitialize app_data before leaving play mode
		  decorDataService.resetData();
	      }
	      decorDataService.resetAppData();
	      //reset tool config for play and edit mode
	      scope.element_config = toolService.getTool("").current_config.reset();
	      return;
          });
/*          //browser resize event
	  var resized;
	  window.onresize=function() {
	      if (resized){clearTimeout(resized)};
	      resized = setTimeout(resize_func,100);
	  };
*/
          var resize_func = function(){
              //since window resize is not an angular event, angular will not know anything has changed, hence we need to tell angular 
              //to check any value has changed and apply the changes through the $apply call. ie start the digestion cycle explicitely
	      if(!scope.$$phase){	      
	        scope.$apply();
	      }
          }
	  utilService.addEvent(window,"resize",resize_func);

	  scope.watchSVGWidth = utilService.onceFunc(function(){
//the window onresize crash safari
          //watch for resize event
	  scope.$watch(function(){
	    //var mainpic = document.getElementsByClassName("mainpic")[0];
	    //return mainpic? mainpic.clientWidth : 0;
	    return scope.svg.node().clientWidth;
          },function(w){
	    scope.width = w;
            scope.height = w * scope.data.decor.decor_aspect_ratio;
	    if(w>0){
		scope.renderBackground();
		scope.init_current();
	    }
          });
	  })

          scope.$watch('data.decor.backgroundurl',function(newurl,oldurl){
	    var mainpic = document.getElementsByClassName("mainpic")[0];
	    if(mainpic && (mainpic.clientWidth>0 || mainpic.parentNode.clientWidth)){
		// firefox need parentNode.clientWidth
		scope.renderBackground();
	    }
          },true);

	  scope.$watch('current.decor.line_id',function(newVal){
	      var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",newVal);
	      if(!angular.isUndefined(i)){
	        scope.selectWidget(scope.data.decor.decor_lines[i].decor_line_type,true);
		$('[data-original-title][decor_line_id!='+scope.data.decor.decor_lines[i].decor_line_id+']').popover('hide');
		//shall we select subcat of last element?
	      }
	  },true);

	  scope.$watch('data.decor.num_inches_per_x_unit',function(newVal,oldVal){
	      if(newVal && oldVal){
		  for(var i=0;i<scope.data.decor.decor_lines.length;i++){
		      var update = false;
		      for(var j=0;j<scope.data.decor.decor_lines[i].elements.length;j++){
			  //find img object of the element
			  var img = lightService.getLight(scope.data.decor.decor_lines[i].elements[j].light_type);
			  if(img.size_scale_func){
			      var actual_inch = img.size_scale_reverse_func(scope.data.decor.decor_lines[i].elements[j].scale_factor,oldVal);
			      scope.data.decor.decor_lines[i].elements[j].scale_factor = img.size_scale_func(actual_inch,newVal);
			      update = true;
			  }
		      }
		      if(update){
			  scope.decor_line_element_update_func(scope.data.decor.decor_lines[i].decor_line_id);
		      }
		  }
	      }
	  },true);

	  scope.$watch('element_config',function(current_config){
	      //highlight selected tools
	      $(".tool").removeClass("currentSelectedGrey");
	      for(var key in current_config){
		  //find and highlight tool btn with name such as basicxmaslighttypetool
		  var tool = toolService.getToolByConfigField(key,current_config[key]);
		  $(".tool[name="+tool.toolName+"]").addClass("currentSelectedGrey");
	      }
	  },true);

	  scope.$watch('current.animation',function(oldVal,newVal){
	      if(oldVal.night != newVal.night){
	      var nighttool = _.find(scope.data.tools,function(tool){return tool.name=='nighttool'});
	      if(scope.current.animation.night){
		  //nighttool.icon = 'icon-sun';
		  nighttool.icon_toggle = true;
		  //nightsky 		    
		  var background_g = scope.svg.select("g.decor g.background").selectAll(".nightsky")
		      .data(["night"])
		      .enter()
		      //.insert("rect","g.decor_line")
		      .append("rect")
		      .attr("class","nightsky")
		      .attr("x", scope.margins.left)
                      .attr("y", scope.margins.top)
                      .attr("width", scope.width - scope.margins.left - scope.margins.right)
                      .attr("height", scope.height - scope.margins.top - scope.margins.bottom)
		      .attr("opacity",0)
		      //.attr("fill","url(#nightsky)")
		      .attr("fill","url("+$window.location+"#nightsky)")
		      .transition()
		      .duration(1000)
		      .attr("opacity",1);
		  d3.selectAll(".basicImage image").attr("filter","url(#darker)");
	      }else{
		  //nighttool.icon = 'icon-moon';
		  nighttool.icon_toggle = false;
		  if(scope.svg){
		      scope.svg.selectAll(".nightsky").transition().duration(1000).attr("opacity",0).remove();
		  }
		  d3.selectAll(".basicImage image").attr("filter","");
	      }
	      }//end if night
	      if(oldVal.start != newVal.start){
		  var starttool = _.find(scope.data.tools,function(tool){return tool.name=='animatestarttool'});
		  if(scope.current.animation.start){
		      starttool.icon_toggle = true;
		      if(scope.svg){
			  scope.animateStart(true);
			  scope.selectTool("musicTool");
		      }
		  }else{
		      starttool.icon_toggle = false;
		      if(scope.svg){
			  scope.animateStart(false);
			  //pause music
			  if(scope.current.music.playing){
			      scope.selectTool("musicTool");
			  }
		      }
		  }
	      }
	  },true);

          scope.$watch('current.music.playing',function(newval,oldval){
	      var tool = _.find(scope.data.tools,function(tool){return tool.name=='volumeonofftool'});
	      if(scope.current.music.track){
		  tool.icon_toggle = scope.current.music.track.muted;
	      }
	  })

	  scope.animateStart = function(animate){
	      //var decor_line_ids = _.pluck(scope.data.decor.decor_lines,function(x){return x.decor_line_id});
	      if(animate){
		  //prepare animation by setting all to be inactive
		  _.forEach(scope.data.animations,function(anim){
		      if(anim.start_second>0){
			  anim.active = false;
		      }else{
			  anim.active = true;
		      }
		  });
		  if(!scope.$$phase){	      
	              scope.$apply();
		  }
		  //start animation of each decor_line by setting active fired at start_seond by timeout service
		  _.forEach(scope.data.decor.decor_lines,function(dl){
		      //remove all inactive anims dom element
		      scope.decor_line_anim_enter_func(dl.decor_line_id);
		      var anim = lightAnimService.getAnim();
		      //anim.start(scope.data.animations,function(start_second){
		      anim.start(_.filter(scope.data.animations,function(a){return a.decor_line_id == dl.decor_line_id}),function(start_second){
			  _.forEach(scope.data.animations.sort(utilService.dynamicSortMultiple("start_second","set","segment")),function(a){
			      if(a.decor_line_id == dl.decor_line_id){
				  //kept a with last start_second if a has no start_second
				  if(a.start_second == start_second){
				      a.active = true;
				  }else{
				      if(a.start_second <= start_second){
					  //keep a active if there is no other a of same color bewteen a.start_second and start_second
					  var other_anims = _.filter(scope.data.animations,function(other_anim){
					      return other_anim.color == a.color &&
					          other_anim.decor_line_id == dl.decor_line_id &&
					          other_anim.start_second > a.start_second &&
					          other_anim.start_second <= start_second;
					  })
					  if(other_anims.length==0){
					      a.active = true;
					  }else{
					      a.active = false;
					  }
				      }else{
					  a.active = false;
				      }
				  }
			      }
			  });
			  //write animConfig from animations to radialgradient of decor_line dom, this is the bottleneck of animation
			  //to update active status. TEMPORARILY DISABLED FOR SLOW PERFORMANCE
			  scope.decor_line_anim_update_func(dl.decor_line_id);
		      },function(){},3);//10 numcycles
		  });
	      }else{
		  var anim = lightAnimService.getAnim();
		  anim.stop(function(){});
	      }
	      animateAll(animate);
	  }

	  var animateAll = function(animate){
	      if(animate){
		  //TROUBLE: when element is rotated, can not combine lightshine and lightglow, ca only use one
		  scope.svg.selectAll(".decor_line_element:not(.unlightable)").each(function(){
		     var light = lightService.getLight(d3.select(this).data()[0].light_type);
		     d3.select(this).call(light.turnon).call(light.flash).call(light.glow).call(light.castshadow).call(light.emitray);
		  })
	      }else{
		  scope.svg.selectAll(".decor_line_element:not(.unlightable)").each(function(){
		     var light = lightService.getLight(d3.select(this).data()[0].light_type);
		     d3.select(this).call(light.turnoff).call(light.unglow).call(light.uncastshadow).call(light.unemitray);
		  })
	      }
	  }
	    
	  d3Service.d3().then(function(dthree){
            scope.d3 = dthree;
            var d3_global = $window.d3;
            //local d3
            var d3 = d3_global || scope.d3;
	    lightSvgsService.loadAll(scope.d3 || d3_global);

	    scope.showTraceCircleFromPointWithRadius = function(point,radius){
		var pointzoomed = scope.zoomedPosition([point.x,point.y],true);
		point = {x:pointzoomed[0],y:pointzoomed[1]};
		var radiusZ = scope.zoomedRadius(radius,true);
		//scope.svg.select("g.tracecircle-g").remove();
		var trace_circle_g = scope.svg.append("g").attr("class","tracecircle-g"),
		    color = scope.element_config.color? scope.element_config.color : "orange";
		trace_circle_g.append("circle")
		    .attr("class","tracecircle")
		    .attr("stroke-width",1)
		    .attr("stroke","silver")
		    .attr("opacity",0.1)
		    .attr("fill",color)
		    .attr("cx",point.x)
		    .attr("cy",point.y)
		    .attr("r",0)
		    .transition()
		    .duration(500)
		    .attr("r",radiusZ)
		    .each("start",function(){
			trace_circle_g.append("text")
			    .attr("x",point.x+radiusZ)
			    .attr("y",point.y)
			    .attr("fill",color)
			    .text(function(){
				if(scope.data.decor.num_inches_per_x_unit){
				    var num_inches = radius*scope.data.decor.num_inches_per_x_unit;
				    return num_inches < 12? '|<-' + Math.round(num_inches*100)/100 + " inches" : '|<-' + Math.round((num_inches/12.0)*100)/100 + " feet";
				}
			    })
		    })
		    .transition()
		    .duration(1000)
		    .attr("r",0)
		    .each("end",function(){
			trace_circle_g.remove();
		    });
	    }

	    scope.showTraceLineFromPoint = function(){
		//expect first argument as the from point, optional second argument as offset
		var args = [].slice.call(arguments, 0);
		var point = args[0],
		    offset = args[1]? args[1] : [0,0],
		    mousemovealllinesofset = args[2]? args[2] : false;
		//select or create the trace line g
		var trace_line_g = scope.svg.select("g[decor_line_id='"+scope.current.decor.line_id+"']").select("g.traceline-g");
		if(trace_line_g.node()==null){
		    trace_line_g = scope.svg.select("g[decor_line_id='"+scope.current.decor.line_id+"']").append("g").attr("class","traceline-g");
		}
		var line = trace_line_g.append("line")
		    .classed("traceline",true)
		    .attr("x1",point[0]+offset[0])
		    .attr("y1",point[1]+offset[1])
		    .attr("x2",point[0]+offset[0])
		    .attr("y2",point[1]+offset[1])
		    .attr("x_offset",offset[0])
		    .attr("y_offset",offset[1]);
		trace_line_g.append("text");
		//reorder dom element so click will trigger event of light
		//otherwise it will trigger event of line then bubble to g
		trace_line_g.moveToBack();
		scope.svg.on("mousemove",function(){
		    var pointTo = d3.mouse(this);			
		    //update pointTo to zoomed position
		    pointTo = scope.zoomedPosition(pointTo);
		    var color = scope.element_config.color? scope.element_config.color : "orange";
		    //line.attr("x2",pointTo[0]+offset[0])
		    var lines;
		    if(mousemovealllinesofset){
			lines = trace_line_g.selectAll(".traceline");
		    }else{
			lines = line;
		    }
		    lines.each(function(){
			var x_offset = parseFloat(d3.select(this).attr("x_offset"))*scope.element_config.set_scale_factor;
			var y_offset = parseFloat(d3.select(this).attr("y_offset"))*scope.element_config.set_scale_factor;
			d3.select(this)
			.attr("x2",pointTo[0]+x_offset)
			.attr("y2",pointTo[1]+y_offset)
			.attr("stroke-width",1)
			.attr("stroke","silver")
			.each(function(){
			    trace_line_g.select("text")
				.attr("x",pointTo[0]+x_offset)
				.attr("y",pointTo[1]+y_offset)
				.attr("fill",color)
				.text(function(){
				    if(scope.data.decor.num_inches_per_x_unit){
					var dist = utilService.dist(point,pointTo);
					var num_inches = dist*scope.data.decor.num_inches_per_x_unit;
					return num_inches < 12? '|<-' + Math.round(num_inches*100)/100 + " inches" : '|<-' + Math.round((num_inches/12.0)*100)/100 + " feet";
				    }
				})
			});
		    })
		})
	    }

	    scope.showTraceLinesFromPointForPoints = function(point,points){
		//expect first argument as the from_point, optional second argument as the for_points
		var ssf = scope.element_config.set_scale_factor;
		for(var i=0;i<points.length;i++){
		    scope.showTraceLineFromPoint(point,[points[i][0]-point[0],points[i][1]-point[1]],true);
		}
	    }

	    scope.delTraceLine = function(decor_line_id){
		//remove and no longer show traceline
		//scope.svg.select("g[decor_line_id='"+decor_line_id+"']").selectAll(".traceline").remove();
		scope.svg.select("g[decor_line_id='"+decor_line_id+"']").selectAll(".traceline-g").remove();
		scope.svg.on("mousemove",null);
	    }

	    scope.showRulerFromPoint = function(decor_line_id,point){
		//point is in svg scale, ie after scope.xScale and scope.yScale
		//ruler offset so measurementTapeEnd is inside ruler background
		var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",decor_line_id);
		var ds = decorService.getDecor(scope.data.decor.decor_lines[i].decor_line_type).config(scope.element_config);
		var ruler_offset = ds.elementConfig.uselight.offset;
		//var decor_line_g = scope.svg.select("g[decor_line_id='"+decor_line_id+"']");
		//if(false && decor_line_g.select(".measurementTapeEnd").node()!=null){
		//    var ruler_end_bbox = decor_line_g.select(".measurementTapeEnd").node().getBBox();
		//    ruler_offset = {x:0,y:-ruler_end_bbox.height/2};
		//}
		scope.axis_domain_width_feet = 12;
		scope.axis_background_data = [
		    {id:1,side:'leftend',color:'orange',width:6},
		    {id:2,side:'middle',color:'yellow',width:0},
		    {id:3,side:'rightend',color:'orange',width:6},
		];
		scope.axis = d3.svg.axis()
		    .scale(d3.scale.linear().domain([0,scope.axis_domain_width_feet]).range([0,0]))
		    .orient("bottom")
		    .ticks(5)
		    .tickFormat(function(v){return v+"'"});
		var ruler = scope.svg.select("g[decor_line_id='"+decor_line_id+"']")
		    .append("g")
		    .classed("axis",true)
		    .classed("measurementTape",true)
		    //x-start stores x coordinate before scaling, it equals to x coordinate of first measurementTapeEnd
		    .attr("x-start",scope.xScale_reverse(point[0]))    
		    .call(scope.axis);
		//reorder dom element so click will trigger event of light
		//otherwise it will trigger event of line then bubble to g
		ruler.attr("transform",function(){
		    return "translate("+(point[0]+ruler_offset.x)+","+(point[1]+ruler_offset.y)+")";
		}).moveToBack();
		scope.svg.on("mousemove",function(){
		    var point = d3.mouse(this);
		    //update point to zoomed position
		    point = scope.zoomedPosition(point);
		    scope.extendRulerToPoint(decor_line_id,point);
		})
	    }

	    scope.extendRulerToPoint = function(decor_line_id,point){
	        var decor_line_g = scope.svg.select("g.decor g.decor_lines").select("g[decor_line_id='"+decor_line_id+"']"),
	            ruler = decor_line_g.select("g.measurementTape");
		//both ruler_width and x-start are in svg coordinate space before change window size
		var ruler_width = Math.abs(scope.xScale_reverse(point[0])-ruler.attr("x-start"));
		var num_ticks = ruler_width/25 > 3? ruler_width/25 : 3;
		if(ruler){
		    //x_start = parseFloat(ruler.attr("x_start"));
		    scope.axis.scale().range([0,scope.xScale(ruler_width)]);
		    scope.axis.ticks(num_ticks);
		    scope.axis_background_data[1].width = ruler_width;
		    ruler.attr("ruler_width",ruler_width)
			.call(scope.axis);
		    var bbox = ruler.node().getBBox();
		    //enter one ruler background
		    ruler.selectAll("rect.ruler-background").data(scope.axis_background_data,function(d){return d.id}).enter().append("rect")
			.attr('class', 'ruler-background')
			.attr('opacity',function(d){
			    return (d.side=='leftend' | d.side=='rightend')? 0.7 : 0.4;
			})
			.attr('fill',function(d){
			    return d.color;
			})
		        //.attr('x',bbox.x)
			.attr('x',0)
			.attr('y', bbox.y)
		        .attr('width', bbox.width)
			.attr('height', bbox.height);
		    //update ruler background
		    ruler.selectAll("rect.ruler-background").data(scope.axis_background_data,function(d){return d.id})
		        .attr("x",function(d){
			    if (d.side=='middle') {
				//return bbox.x;
				return 0;
			    }else{
				if(d.side=='leftend'){
				    //CRITICAL: since bbox.x is relative to parentNode, return bbox.x-5 will enlarge bbox
				    //next time bbox.x will be even smaller, so could not use bbox.x-scope.xScale(d.width)
				    return bbox.x;
				}else{
				    //rightend
				    return bbox.x + scope.xScale(ruler_width);
				}
			    }
			})
			.attr('width', function(d){
			    return d.side=='middle'? scope.xScale(ruler_width) : scope.xScale(d.width);
			})
		    //finalize ruler scale, ruler is 12 feet
		    scope.data.decor.num_inches_per_x_unit = Math.round(scope.axis_domain_width_feet*12/scope.xScale(ruler_width)*1000)/1000;
		    if(!scope.$$phase){	      
			scope.$apply();
		    }
		}
	    };

	    scope.cancelRuler = function(decor_line_id){
		scope.svg.on("mousemove",null);
	    }

            $(document).bind("keyup", function (event) {
		if(scope.current.decor.line_id){
		    if (event.keyCode == 27) {
			//escape key remove tracelines
			for(var i=0;i<scope.data.decor.decor_lines.length;i++){
			    scope.delTraceLine(scope.data.decor.decor_lines[i].decor_line_id);
			}
		    }
		    scope.current.decor = {};
		    event.preventDefault();
		}
            });
	      
            scope.renderLightGala = function(decor_lines){
              scope.svg.select("g.decor g.decor_lines").selectAll("g.decor_line").remove();
	      scope.svg.select("g.decor").append("g").attr("class","decor_lines");
	      scope.xScale = d3.scale.linear()
		    .domain([0,scope.data.decor.decor_width])
		    .range([0,scope.width]),
	      scope.xScale_reverse = d3.scale.linear()
		    .range([0,scope.data.decor.decor_width])
		    .domain([0,scope.width]),
	      scope.yScale = d3.scale.linear()
		    .domain([0,scope.data.decor.decor_width * scope.data.decor.decor_aspect_ratio])
		    .range([0,scope.height]),
	      scope.yScale_reverse = d3.scale.linear()
		    .range([0,scope.data.decor.decor_width * scope.data.decor.decor_aspect_ratio])
		    .domain([0,scope.height]),
	      scope.rScale = d3.scale.linear()
		    .domain([0,1])
		    .range([0,1 * scope.width / scope.data.decor.decor_width]),
	      scope.rScale_reverse = d3.scale.linear()
		    .range([0,1])
		    .domain([0,1 * scope.width / scope.data.decor.decor_width]);

	      //a click is a trivial 0px drag, if the element has a click eventhandler, the drag events
	      //will fire first. If you do not want drag event to fire if not really dragged, 
	      //you need to detect position change
	      scope.dragged = false;

	    scope.clear_all_decors = function(){
		for(var i=scope.data.decor.decor_lines.length-1;i>=0;i--){
		    scope.data.decor.decor_lines[i].elements = [];
		    scope.decor_line_element_exit_func(scope.data.decor.decor_lines[i].decor_line_id);
		}
	    }

	    scope.syncAnimsWithElements = function(decor_line_id){
		//synchronize animations with element by removing unecessary animation entries
		var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",decor_line_id);
		if(!i){return false}
		//look for required anim_keys for the decor_line_id in elements
		var anim_keys_required = _.unique(_.map(scope.data.decor.decor_lines[i].elements,function(ele){
		    return {decor_line_id: scope.data.decor.decor_lines[i].decor_line_id,segment: ele.segment,set: ele.set,color: ele.color};
		}));
		//remove animations entry from back of the array if anim_key does not exit in anim_keys_required
		for(var j=scope.data.animations.length-1;j>=0;j--){
		    var anim = scope.data.animations[j];
		    if(anim.decor_line_id==decor_line_id){
			var anim_key = {decor_line_id: anim.decor_line_id,segment: anim.segment,set: anim.set,color: anim.color};
			var anim_key_less_color = {decor_line_id: anim.decor_line_id,segment: anim.segment,set: anim.set};
			if(!_.find(anim_keys_required,function(ak){
			    var ak_less_color = {decor_line_id: ak.decor_line_id,segment: ak.segment,set: ak.set};
			    return _.isEqual(anim_key,ak) || (_.isEqual(anim_key_less_color,ak_less_color) && ak.color=='random');
			})){
			    scope.data.animations.splice(j,1);
			}
		    }
		}
	    }

	    scope.decor_line_exit_func = function(){
		return scope.svg.select("g.decor g.decor_lines").selectAll(".decor_line")
		    .data(scope.data.decor.decor_lines,function(d){
			return d.decor_line_id;
		    })
		    .exit()
		    .remove();
	    }

	    scope.decor_line_element_exit_func = function(decor_line_id){
		var decor_line_g = scope.svg.select("g.decor g.decor_lines").select("g[decor_line_id='"+decor_line_id+"']"),
		    i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",decor_line_id);
		decor_line_g
                   .selectAll("g.decor_line_element[decor_line_id='"+decor_line_id+"']")
                   .data(scope.data.decor.decor_lines[i].elements,function(d){
		     return scope.data.decor.decor_lines[i].decor_line_id + '_' + d.id;
		   }).exit()
		   .transition().duration(500)
		   .attr("transform",function(d){
		      var outline_ele = d3.select(this).select(".outline").node(),
		          bbox = outline_ele.getBBox(),
		          scaleFactor = scope.rScale(d.scale_factor*3),
		          offset_x,
		          offset_y;
		      var x = parseInt(d3.select(this).attr("x")),
		          y = parseInt(d3.select(this).attr("y")),
		          r = d.scale_factor;
		      if((x >= (scope.margins.left + r) && x <= (scope.width - scope.margins.right - r)) && (y >= (scope.margins.top + r) && y <= (scope.height - scope.margins.bottom - r))){
		          offset_x = Math.random()*bbox.width*4;
		          offset_y = Math.random()*bbox.height*4;

		      }else{
			  //element in margin, transition to a proper margin place
		          offset_x = x-d.x;
		          offset_y = y<scope.margins.top? -Math.random()*bbox.height*4-d.y : Math.random()*bbox.height*4 + y;
		      }
		      return "translate("+scope.xScale(d.x-scope.xScale_reverse(bbox.x+bbox.width/2)-scope.xScale_reverse(bbox.x+bbox.width/2)*(scaleFactor-1)+offset_x)+","+scope.yScale(d.y-scope.yScale_reverse(bbox.y+bbox.height/2)-scope.yScale_reverse(bbox.y+bbox.height/2)*(scaleFactor-1)+offset_y)+") scale("+scaleFactor+") rotate("+scope.element_config.rotate()+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")";
		   }).ease("cubic")
		   .remove();
		//when decor_line is empty, remove traceline
		if(scope.data.decor.decor_lines[i].elements.length == 0){
		    //remove decor_line data
		    scope.data.decor.decor_lines.splice(i,1);
		    scope.current.decor = {};
		    scope.decor_line_exit_func();
		    scope.delTraceLine(decor_line_id);
		}
		scope.syncAnimsWithElements(decor_line_id);
		if(!scope.$$phase){	      
		    scope.$apply();
		}
	    }

	    //called at tool afterinvoke
	    scope.decor_line_element_update_func = function(decor_line_id){
		scope.decor_line_anim_enter_func(decor_line_id);
		var decor_line_g = scope.svg.select("g.decor g.decor_lines").select("g[decor_line_id='"+decor_line_id+"']"),
		    i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",decor_line_id);
		decor_line_g.selectAll("g.decor_line_element[decor_line_id='"+decor_line_id+"']")
                   .data(scope.data.decor.decor_lines[i].elements,function(d){
		       return scope.data.decor.decor_lines[i].decor_line_id + '_' + d.id;
		   })
		   .attr("set",function(d){
		     return d.set;
		   })
		   .attr("segment",function(d){
		     return d.segment;
		   })
		   .attr("group",function(d){
		     return d.group;
		   })
		   .each(function(d){
		       Object.defineProperty(scope.element_config,'light_type',{value:d.light_type,writable:true,enumerable:true});
		       Object.defineProperty(scope.element_config,'light_subtype',{value:d.light_subtype,writable:true,enumerable:true});
		       Object.defineProperty(scope.element_config,'color',{value:d.color,writable:true,enumerable:true});
		       Object.defineProperty(scope.element_config,'rotate_degree',{value:d.rotate_degree,writable:true,enumerable:true});
		       Object.defineProperty(scope.element_config,'scale_factor',{value:d.scale_factor,writable:true,enumerable:true});
		       d3.select(this)
			   .call(decorService.getDecor(scope.data.decor.decor_lines[i].decor_line_type).config(scope.element_config).elementUpdateFunc())
			   .classed("decor_line_element",true)
			   .classed("unbreakable",d.light_unbreakable)
			   .classed("unlightable",d.light_unlightable)
			   .classed("unflashable",d.light_unflashable);
		       if(d3.select(this).classed("basicLight")){
			   //don't do this for baiscImage
			   d3.select(this).attr("bulbcolor",function(d){
			       //d.color could be random, so get bulbcolor from bulb
			       //return d.color;
			       return d3.select(this).select(".bulb").attr("bulbcolor");
			   })
		       }
		   })
		   .attr("x",function(d){
		       return scope.xScale(d.x);
		   })
		   .attr("y",function(d){
		       return scope.yScale(d.y);
		   })
		   .attr("transform",function(d){
		    var outline_ele = d3.select(this).select(".outline").node(),
		    bbox = outline_ele.getBBox(),
		    scaleFactor = scope.rScale(d.scale_factor);
		    return "translate("+scope.xScale(d.x-scope.xScale_reverse(bbox.x+bbox.width/2)-scope.xScale_reverse(bbox.x+bbox.width/2)*(scaleFactor-1))+","+scope.yScale(d.y-scope.yScale_reverse(bbox.y+bbox.height/2)-scope.yScale_reverse(bbox.y+bbox.height/2)*(scaleFactor-1))+") scale("+scaleFactor+") rotate("+scope.element_config.rotate(d.rotate_degree)+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")";
		   });		

		scope.syncAnimsWithElements(decor_line_id);
	    }

	    scope.decor_line_enter_func = function(){
		scope.svg.select("g.decor g.decor_lines").selectAll(".decor_line")
		    .data(scope.data.decor.decor_lines,function(d){
			return d.decor_line_id;
		    })
		    .enter()
		    .append("g").attr("decor_line_id",function(d){
			return d.decor_line_id;
		    })
 		    .attr("class","decor_line")
	    }

	    scope.decor_line_anim_enter_func = function(decor_line_id){
		//assuming decor_line already exist, append animation g with radialgradients
		//TODO: removing and reentering might be the bottleneck, should try update instead
		scope.svg.select("g.decor g.decor_lines g.decor_line[decor_line_id='"+decor_line_id+"']").selectAll("g.anim").remove();
		scope.svg.select("g.decor g.decor_lines g.decor_line[decor_line_id='"+decor_line_id+"']").selectAll("g.anim")
		    .data(_.filter(scope.data.animations,function(a){
			return a.decor_line_id == decor_line_id && a.active;
		    }),function(d){
			//return d.anim_id;
			//use anim identifier without start_second
			return d.decor_line_id + '-' + d.segment + '-' + d.set + '-' + d.color;
		    })
		    .enter()
		    .append("g").attr("decor_line_id",function(d){
			return d.decor_line_id;
		    })
 		    .attr("class","anim")
		    .attr("colorname",function(d){
			return d.color;
		    })
		    .attr("segment",function(d){
			return d.segment;
		    })
		    .attr("set",function(d){
			return d.set;
		    })
		    .attr("start-second",function(d){
			return d.start_second;
		    })
		    .each(function(d){
			var append_to = d3.select(this);
			var anim = lightAnimService.getAnim();
			append_to.call(anim.install_lighton).call(anim.install_lightoff).call(anim.install_lightflash);
		    });
		scope.svg.select("g.decor g.decor_lines g.decor_line[decor_line_id='"+decor_line_id+"']")
		    .selectAll("g.decor_line_element:not(.unlightable)").each(function(){
			var light = lightService.getLight(d3.select(this).data()[0].light_type);
			d3.select(this).call(light.unemitray).call(light.emitray);
		    });
	    }

	    scope.decor_line_anim_update_func = function(decor_line_id){
		//assuming decor_line already exist, update radialgradients of  animation g
		scope.svg.select("g.decor g.decor_lines g.decor_line[decor_line_id='"+decor_line_id+"']").selectAll("g.anim")
		    .data(_.filter(scope.data.animations,function(a){
			return a.decor_line_id == decor_line_id && a.active;
		    }),function(d){
			//return d.anim_id;
			//use anim identifier without start_second
			return d.decor_line_id + '-' + d.segment + '-' + d.set + '-' + d.color;
		    })
		    .attr("colorname",function(d){
			return d.color;
		    })
		    .attr("segment",function(d){
			return d.segment;
		    })
		    .attr("set",function(d){
			return d.set;
		    })
		    .attr("start-second",function(d){
			return d.start_second;
		    })
		    .each(function(d){
			var append_to = d3.select(this);
			var anim = lightAnimService.getAnim();
			append_to.call(anim.update_lighton).call(anim.update_lightoff).call(anim.update_lightflash);
		    });
		scope.svg.select("g.decor g.decor_lines g.decor_line[decor_line_id='"+decor_line_id+"']")
		    .selectAll("g.decor_line_element:not(.unlightable)").each(function(){
			var light = lightService.getLight(d3.select(this).data()[0].light_type);
			d3.select(this).call(light.unemitray).call(light.emitray);
		    });
	    }

	    scope.decor_line_element_enter_func = function(decor_line_id){
		scope.decor_line_enter_func();
		scope.decor_line_anim_enter_func(decor_line_id);
		var decor_line_g = scope.svg.select("g.decor g.decor_lines").select("g[decor_line_id='"+decor_line_id+"']"),
		    i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",decor_line_id),
		    ds = decorService.getDecor(scope.data.decor.decor_lines[i].decor_line_type).config(scope.element_config);

                decor_line_g
                   //decor elements on each line
		   .selectAll("g.decor_line_element[decor_line_id='"+decor_line_id+"']")
                   .data(scope.data.decor.decor_lines[i].elements,function(d){
		     return scope.data.decor.decor_lines[i].decor_line_id + '_' + d.id;
		   }).enter()
		   .append("g")
		   .attr("decor_line_id",scope.data.decor.decor_lines[i].decor_line_id)
		   .attr("decor_line_element_id",function(d){
		     return d.id;
		   })
		   .attr("id",function(d){
		     return "id_"+ scope.data.decor.decor_lines[i].decor_line_id + "_" + d.id;
		   })
		   .attr("set",function(d){
		     return d.set;
		   })
		   .attr("segment",function(d){
		     return d.segment;
		   })
		   .attr("group",function(d){
		     return d.group;
		   })
		   .each(function(d){
		     //other than color,rotate_degree and scale_factor, still need to get gap, decor_method etc from element_config
		     Object.defineProperty(scope.element_config,'light_type',{value:d.light_type,writable:true,enumerable:true});
		     Object.defineProperty(scope.element_config,'light_subtype',{value:d.light_subtype,writable:true,enumerable:true});
		     Object.defineProperty(scope.element_config,'color',{value:d.color,writable:true,enumerable:true});
		     Object.defineProperty(scope.element_config,'rotate_degree',{value:d.rotate_degree,writable:true,enumerable:true});
		     Object.defineProperty(scope.element_config,'scale_factor',{value:d.scale_factor,writable:true,enumerable:true});
		     d3.select(this)
		       .call(decorService.getDecor(scope.data.decor.decor_lines[i].decor_line_type).config(scope.element_config).elementMakeFunc())
		       .classed("decor_line_element",true)
		       .classed("unbreakable",d.light_unbreakable)
		       .classed("unlightable",d.light_unlightable)
		       .classed("unflashable",d.light_unflashable);
		     if(d3.select(this).classed("basicLight")){
			//don't do this for baiscImage
			d3.select(this).attr("bulbcolor",function(d){
			   //d.color could be random, so get bulbcolor from bulb
			   //return d.color;
			   return d3.select(this).select(".bulb").attr("bulbcolor");
		       })
		     }
		   })
		   //.style("fill",function(d){
		   //  return scope.current.decor && !d.unlightable? scope.current.decor.line_id == scope.data.decor.decor_lines[i].decor_line_id : false;
		   //})
		   .on("mouseenter",function(){
		     d3.select(this).attr("transform",function(d){
		     var outline_ele = d3.select(this).select(".outline").node(),
		         bbox = outline_ele.getBBox(),
		         scaleFactor = scope.rScale(d.scale_factor*3);
		     return "translate("+scope.xScale(d.x-scope.xScale_reverse(bbox.x+bbox.width/2)-scope.xScale_reverse(bbox.x+bbox.width/2)*(scaleFactor-1))+","+scope.yScale(d.y-scope.yScale_reverse(bbox.y+bbox.height/2)-scope.yScale_reverse(bbox.y+bbox.height/2)*(scaleFactor-1))+") scale("+scaleFactor+") rotate("+scope.element_config.rotate()+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")";
		     });		       
		   })
		   .on("mousemove",function(d){
		     if(scope.dragged && !d3.select(this).classed("dragging") && !d3.select(this).classed("unbreakable")){
		       var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",d3.select(this).attr("decor_line_id")),
			   j = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines[i].elements,"id",d3.select(this).attr("decor_line_element_id"));
		       if(j!=undefined){
			   var eleWithSameAnimId = _.filter(scope.data.decor.decor_lines[i].elements,function(ele){
			       return ele.decor_line_id == scope.data.decor.decor_lines[i].elements[j].decor_line_id &&
				      ele.segment == scope.data.decor.decor_lines[i].elements[j].segment &&
				      ele.set == scope.data.decor.decor_lines[i].elements[j].set &&
				      ele.color == scope.data.decor.decor_lines[i].elements[j].color;
			   });
			   //check decor_line_id/segment/set/color combination of the removed element still exist in elements
			   //if not, we can remove the corresponding animations data
			   if(eleWithSameAnimId.length==1){
			       //yup, no ele with same AnimId other than ele j itself, safe to remove animations entry of the AnimId
			       _.remove(scope.data.animations,function(anim){
				   return anim.decor_line_id == scope.data.decor.decor_lines[i].decor_line_id &&
				       anim.segment == scope.data.decor.decor_lines[i].elements[j].segment &&
				       anim.set == scope.data.decor.decor_lines[i].elements[j].set &&
				       anim.color == scope.data.decor.decor_lines[i].elements[j].color;
			       });
			   }
			   scope.data.decor.decor_lines[i].elements.splice(j,1);
			   scope.decor_line_element_exit_func(d3.select(this).attr("decor_line_id"));
		       }
		     }
		   })
		   .on("mouseleave",function(){
		     d3.select(this).attr("transform",function(d){
		     var outline_ele = d3.select(this).select(".outline").node(),
		         bbox = outline_ele.getBBox(),
		         scaleFactor = scope.rScale(d.scale_factor);
		     return "translate("+scope.xScale(d.x-scope.xScale_reverse(bbox.x+bbox.width/2)-scope.xScale_reverse(bbox.x+bbox.width/2)*(scaleFactor-1))+","+scope.yScale(d.y-scope.yScale_reverse(bbox.y+bbox.height/2)-scope.yScale_reverse(bbox.y+bbox.height/2)*(scaleFactor-1))+") scale("+scaleFactor+") rotate("+scope.element_config.rotate()+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")";
		     });
		   })
		   .on("click",function(){
		     //svg click event will not fire
		     d3.event.stopPropagation();

		     if(scope.mode === 'play'){
			 return;
		     }

		     if(!scope.data.decor.backgroundurl){
			 return;
		     }

		     //when no lights are selected, set as set operation
		     scope.current.operation.type = angular.equals(scope.current.decor,{})? 'set' : 'segment';

		     if(scope.dragged){
			 //complete the drag event
			 scope.dragged = false;
    			 d3.select(this).classed("dragging",false);
			 //after dragend, always start a new decor
			 //scope.current.decor = undefined;	    
			 scope.current.decor = {};	    
		     }else{
			 //not inside a drag event, close a decor_line
			 var last_decor = scope.current.decor;
			 scope.current.decor = {
			     line_id: d3.select(this).attr("decor_line_id"),
			     //line_element_id: d3.select(this).attr("decor_line_element_id")
			     line_element_id: scope.current.operation.type!='set'?d3.select(this).attr("decor_line_element_id"):null
			 }
			 scope.$apply();
		     }
		     var i = utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",d3.select(this).attr("decor_line_id"));
		     if(angular.isUndefined(i) || i === null) return;
		     //var ds = decorService.getDecor(scope.data.decor.decor_lines[i].decor_line_type).config(scope.element_config);
		     //if(last_decor && scope.current.decor && (last_decor.line_id == scope.current.decor.line_id)){
		     if(last_decor.line_element_id && scope.current.decor.line_element_id && (last_decor.line_id == scope.current.decor.line_id)){
			 //click the same decor line cancel the current decor 
			 //determine whether to decor last time by looking at segment
			 //ds.decor_line_end_at(scope,d3.select(this));
			 ds.decor_line_end_at(scope,[d3.select(this).attr("x"),d3.select(this).attr("y"),d3.select(this).attr("segment"),d3.select(this).attr("group")]);
		     }
		     var j = scope.current.decor? utilService.getArrayIndexWithPropertyEqualTo(scope.data.decor.decor_lines,"decor_line_id",scope.current.decor.line_id) : undefined;
		     if(j!=undefined){
			 scope.svg.selectAll("g.decor_line_element[decor_line_id='"+scope.data.decor.decor_lines[j].decor_line_id+"']:not(.unlightable)").each(function(){
			     var light = lightService.getLight(d3.select(this).data()[0].light_type);
			     d3.select(this).call(light.turnon).call(light.flash).call(light.glow);
			 })
			 scope.svg.selectAll("g.decor_line_element:not([decor_line_id='"+scope.data.decor.decor_lines[j].decor_line_id+"']):not(.unlightable)").each(function(){
			     var light = lightService.getLight(d3.select(this).data()[0].light_type);
			     d3.select(this).call(light.turnoff);
			 })
			 var decor_line_elements = scope.data.decor.decor_lines[j].elements,
			     ele = decor_line_elements[decor_line_elements.length-1],
			     point = ele? [scope.xScale(ele.x),scope.yScale(ele.y)] : undefined;
			 if(point){
			     //if(scope.current.operation.type=='set'){
				 ds.decor_line_start_at(scope,null).decor_line_trace_at(scope,point);
			     //}else{
				// ds.decor_line_start_at(scope,[point[0],point[1],null]).decor_line_trace_at(scope,point);
			     //}
			 }
		     }else{
			 //no current decor
			 scope.svg.selectAll("g.decor_line_element:not(.unlightable)").each(function(){
			     var light = lightService.getLight(d3.select(this).data()[0].light_type);
			     d3.select(this).call(light.turnoff);
			 })
		     }
		     return false;
		   })
		   .call(ds.decor_line_element_drag(scope))
		   .attr("x",function(d){
		       return scope.xScale(d.x);
		   })
		   .attr("y",function(d){
		       return scope.yScale(d.y);
		   })
		   .attr("transform",function(d){
		     //return "translate("+xScale(d.x)+","+yScale(d.y)+") rotate("+Math.floor(Math.random()*90-180)+") scale(1)"
		     var outline_ele = d3.select(this).select(".outline").node(),
		         bbox = outline_ele.getBBox(),
		         scaleFactor = scope.rScale(d.scale_factor);
		     //techniques for scaling around a center point
		     //  translate(-centerX*(factor-1), -centerY*(factor-1))
		     //  scale(factor)
		     //inside xScale, move: d.x-(bbox.x+bbox.width/2)
		     //               then -centerX*(factor-1)
		     return "translate("+scope.xScale(d.x-scope.xScale_reverse(bbox.x+bbox.width/2)-scope.xScale_reverse(bbox.x+bbox.width/2)*(scaleFactor-1))+","+scope.yScale(d.y-scope.yScale_reverse(bbox.y+bbox.height/2)-scope.yScale_reverse(bbox.y+bbox.height/2)*(scaleFactor-1))+") scale("+scaleFactor+") rotate("+scope.element_config.rotate(d.rotate_degree)+","+(bbox.x+bbox.width/2)+","+(bbox.y+bbox.height/2)+")";
		   });

		   //show ruler
		     if(scope.data.decor.decor_lines[i].decor_line_type == 'measurementScaling' && 
		        scope.data.decor.decor_lines[i].elements.length==2 &&
		        decor_line_g.select(".measurementTape").node()==null){
			 var point_start = [scope.xScale(scope.data.decor.decor_lines[i].elements[0].x),
					    scope.yScale(scope.data.decor.decor_lines[i].elements[0].y)]
			 scope.showRulerFromPoint(decor_line_id,point_start);

			 var point_end = [scope.xScale(scope.data.decor.decor_lines[i].elements[1].x),
					  scope.yScale(scope.data.decor.decor_lines[i].elements[1].y)]
			 scope.extendRulerToPoint(decor_line_id,point_end);
			 scope.cancelRuler(decor_line_id);
		     }

		     if(scope.data.decor.decor_lines[i].decor_line_type == 'measurementScaling' &&
		        scope.mode == 'play'){
			 scope.toggleDecorLine(scope.data.decor.decor_lines[i].decor_line_id);
		     }

		} //end decor_line_element_enter_func

		for(var i = 0;i<scope.data.decor.decor_lines.length;i++){
		    scope.decor_line_element_enter_func(scope.data.decor.decor_lines[i].decor_line_id);
		}//end for

		scope.svg.on("click",svg_onclick_func);
		scope.svg.on("mouseup",svg_mouseup_func);

            }//end renderLightGala function

	    window.onmousemove = function (e) {
		if (!e) e = window.event;
		if (e.shiftKey) {
		    scope.setZoomable(true);
		}else{
		    scope.setZoomable(false);
		}
	    }

	    var svg_mouseup_func = function(){
		scope.setZoomable(false);
	    };

	    var svg_onclick_func = function(){
		if(scope.mode === 'play'){
		    return;
		}

		if(!scope.data.decor.backgroundurl){
		    scope.selectTool("cameratool");
		    return;
		}

		if (d3.event.shiftKey) {
		    scope.setZoomable(true);
		    return;
		}
		var point = d3.mouse(this);
		point = scope.zoomedPosition(point);
		r_size = 4;
		if((point[0] >= (scope.margins.left + r_size) && point[0] <= (scope.width - scope.margins.right - r_size)) && (point[1] >= (scope.margins.top + r_size) && point[1] <= (scope.height - scope.margins.bottom - r_size))){
		    var ds = decorService.getDecor(scope.current.widget.line_type).config(scope.element_config);
		    ds.decor_line_start_at(scope,[point[0],point[1],null]).decor_line_trace_at(scope,point);
		}//end click inside pic
	    };

	    scope.zoomedPosition = function(point,forward){
		//a mouse point is relative to the svg on screen, when svg is zoomed/panned, need to convert mouse point relative to top/left corner
		//of the picture because the zoom/pan transform attribute will apply to the traceline pointTo for example
		//forward: x2 = translate[0]+scale*x1
		//backward: x1 = (x2 - translate[0])/scale
		if(scope.current.operation && scope.current.operation.translate && scope.current.operation.scale){
		    return forward?[scope.current.operation.translate[0]+point[0]*scope.current.operation.scale,scope.current.operation.translate[1]+point[1]*scope.current.operation.scale]:[(point[0]-scope.current.operation.translate[0])/scope.current.operation.scale,(point[1]-scope.current.operation.translate[1])/scope.current.operation.scale];
		}else{
		    return point;
		}
	    };

	    scope.zoomedRadius = function(radius,forward){
		if(scope.current.operation && scope.current.operation.scale){
		    return forward?radius*scope.current.operation.scale:radius/scope.current.operation.scale;
		}else{
		    return radius;
		}
	    };

	    scope.setZoomable = function(){
		function zoom(){
		    scope.svg.select("g.decor").attr("transform","translate("
			    +d3.event.translate+")scale("+d3.event.scale+")");
		    scope.current.operation.translate = d3.event.translate;
		    scope.current.operation.scale = d3.event.scale;
		    return false;
		}
		var args = Array.prototype.slice.call(arguments,0);
		if(args.length>0){
		    scope.zoomable = args[0];
		}
		if(scope.svg){
		    if(!scope.zoomable){
			scope.zoomable = false;
			scope.svg.on("mousedown.zoom", null);
			scope.svg.on("mousemove.zoom", null);
			scope.svg.on("dblclick.zoom", null);
			scope.svg.on("touchstart.zoom", null);
			scope.svg.on("wheel.zoom", null);
			scope.svg.on("mousewheel.zoom", null);
			scope.svg.on("MozMousePixelScroll.zoom", null);
			scope.svg.on("click",svg_onclick_func);
		    }else{
			scope.zoomable = true;
			scope.svg.call(
			    d3.behavior.zoom()
				.scaleExtent([1,10])
				.on("zoom",zoom)
			).on("dblclick.zoom", null).on("click",null);
		    }
		}
	    }

            scope.renderBackground = function(){
              //d3 = d3_global || scope.d3;
              if(angular.isObject(d3) && d3.hasOwnProperty("version")){
                if(scope.svg){
                  d3.select(ele[0]).selectAll("svg").remove();
                }
		var svg = d3.select(ele[0]).append("svg")
		//d3.select(ele[0]).select('svg').node().appendChild(scope.svg_defs);
		if(scope.svg_defs){
		    svg.node().appendChild(scope.svg_defs);
		}
                svg.attr("width",700).attr("class","mainpic");
		scope.svg = svg;
		//scope.width = document.getElementsByClassName("mainpic")[0].clientWidth;
		scope.width = document.getElementsByClassName("mainpic")[0].getBoundingClientRect().width;
		scope.height = scope.width * scope.data.decor.decor_aspect_ratio;
		svg.attr("width",scope.width)
                   .attr("height",scope.height);

		//!!!!!!TODO: this crash safari and makes firefox set scope.width to 0
		//scope.watchSVGWidth();

	        //prepare svg/g.decor/background/foreground
		svg.append("g").attr("class","decor");
		if (scope.data.decor.backgroundurl) {
		    scope.svg.select("g.decor").select("g.background").selectAll("text").data([])
			.exit().remove();
	            scope.svg.select("g.decor").append("g").attr("class","background").selectAll("image").data([0])
			.enter()
			.append("svg:image")
			.attr("xlink:href", scope.data.decor.backgroundurl)
			.attr("x", scope.margins.left)
			.attr("y", scope.margins.top)
			.attr("width", scope.width - scope.margins.left - scope.margins.right)
			.attr("height", scope.height - scope.margins.top - scope.margins.bottom)
			.attr("preserveAspectRatio", "none")
			.attr("class","background");
		    //.attr("filter","url(#hyperblue)");
		}else{
		    //no backgroundurl, render backgroundtext
		    var cycle = function(d,i){
			d3.select(this)
			    .transition()
			    .duration(3000)
		            .attrTween("transform",function() {
				var x = (scope.width - scope.margins.left - scope.margins.right)/2 + (d.letterindex-d.promptlen/2)*22;
				var y = (scope.height - scope.margins.top - scope.margins.bottom)/2 + d.promptindex*42;
				var transform_from = "translate(" + (Math.random()+0.5)*x + "," + (Math.random()+0.5)*y + ")";
				var transform_to = "translate(" + x + "," + y + ")";
				//return d3.interpolateString(d3.select(this).attr("transform")+" scale("+Math.random()*1.5+") rotate(0)", d3.select(this).attr("transform")+" scale(1) rotate(720)");
				return d3.interpolateString(transform_from+" scale("+Math.random()*1.5+") rotate(0)", transform_to +" scale(1) rotate(720)");
			    })
			    .each("end",scope.getPrompt().cycle?cycle:function(){});
		    }

	            scope.svg.select("g.decor").append("g").attr("class","background").selectAll("text").data(utilService.splitPrompts([{prompt:scope.backgroundtext},{prompt:'1i8h+8@1@.com'}]))
			.enter()
			.append("text")
			.text( function (d) { return d.prompt})
			.attr("text-anchor", "middle")
		        .attr("style","font-size:42px;font-style:normal;font-weight:normal;fill-opacity:1;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;font-family:sans-serif")
			.attr("fill",utilService.randomColor())
			.each(cycle);
		}
                scope.renderLightGala(scope.data.decor.decor_lines);
		scope.svg.select("g.decor").append("g").attr("class","foreground");
              }
            }; //end renderBackground

            d3.xml("/js/services/svgs/defs.svg", "image/svg+xml", function(error,documentFragment) {
	      if (error) {
	        console.log(error); 
		return;
	      }else{
		//read the defs node only and create svg dynamically, because the read-in svg node
		//act strangely such as won't resize the background images etc
	        scope.svg_defs = documentFragment.getElementsByTagName("defs")[0];
	        scope.renderBackground();
	      }
	    })

	    //render empty background with loading prompt while loading data
	    scope.renderBackground();
	    scope.init();

          }); //end d3 then
	}; //end return 
      }])//end directive

angular.module("lightgalaApp")
  .directive("playtools",function(){
    //this directive generate control tools under the decor svg for controlling play of the lighting
    return {
      restrict: 'EA',
      templateUrl: "../../partials/playtools.html",
      link: function(scope,ele,attrs){
	  scope.show_tool_options = false;
	  scope.toggleToolOptions = function(toolname){
	      var i = _.findIndex(scope.data.tools,function(tool){
		  return tool.name == toolname;
	      })
	      if(i>=0){
		  if(scope.data.tools[i].options.length>0){
		      scope.data.tools[i].show_options = !scope.data.tools[i].show_options;
		  }
	      }
	  }
      } //end link function
    } //end return directive object
  })

angular.module("lightgalaApp")
  .directive("rain",['$document',function($document){
    //this directive generate snow svg components inside the decor svg foreground
    return {
      restrict: 'EA',
      templateUrl: "../../partials/weather.html",
      controller: ["$scope","$element","$timeout",function($scope,$element,$timeout){
	  $timeout(function(){
	      var xhtmlNS = 'http://www.w3.org/1999/xhtml';
	      var canvas = $document[0].getElementsByTagNameNS(xhtmlNS,'canvas')[0];

/**
 * Defines a new instance of the rainyday.js.
 * @param options options element with script parameters
 * @param canvas to be used (if not defined a new one will be created)
 */

function RainyDay(options, canvas) {

	if (this === window) { //if *this* is the window object, start over with a *new* object
		return new RainyDay(options);
	}

	this.img = options.image;
	var defaults = {
		opacity: 1,
		blur: 10,
		crop: [0, 0, this.img.naturalWidth, this.img.naturalHeight],
		enableSizeChange: true,
		parentElement: document.getElementsByTagName('body')[0],
		fps: 30,
		fillStyle: '#8ED6FF',
		enableCollisions: true,
		gravityThreshold: 3,
		gravityAngle: Math.PI / 2,
		gravityAngleVariance: 0,
		reflectionScaledownFactor: 5,
		reflectionDropMappingWidth: 200,
		reflectionDropMappingHeight: 200,
		width: this.img.clientWidth,
		height: this.img.clientHeight,
		position: 'absolute',
		top: 0,
		left: 0
	};

	// add the defaults to options
	for (var option in defaults) {
		if (typeof options[option] === 'undefined') {
			options[option] = defaults[option];
		}
	}
	this.options = options;

	this.drops = [];

	// prepare canvas elements
	this.canvas = canvas || this.prepareCanvas();
	this.prepareBackground();
	this.prepareGlass();

	// assume defaults
	this.reflection = this.REFLECTION_MINIATURE;
	this.trail = this.TRAIL_DROPS;
	this.gravity = this.GRAVITY_NON_LINEAR;
	this.collision = this.COLLISION_SIMPLE;

	// set polyfill of requestAnimationFrame
	this.setRequestAnimFrame();
}

/**
 * Create the main canvas over a given element
 * @returns HTMLElement the canvas
 */
RainyDay.prototype.prepareCanvas = function() {
	var canvas = document.createElement('canvas');
	canvas.style.position = this.options.position;
	canvas.style.top = this.options.top;
	canvas.style.left = this.options.left;
	canvas.width = this.options.width;
	canvas.height = this.options.height;
	this.options.parentElement.appendChild(canvas);
	if (this.options.enableSizeChange) {
		this.setResizeHandler();
	}
	return canvas;
};

RainyDay.prototype.setResizeHandler = function() {
	// use setInterval if oneresize event already use by other.
	if (window.onresize !== null) {
		window.setInterval(this.checkSize.bind(this), 100);
	} else {
		window.onresize = this.checkSize.bind(this);
		window.onorientationchange = this.checkSize.bind(this);
	}
};

/**
 * Periodically check the size of the underlying element
 */
RainyDay.prototype.checkSize = function() {
	var clientWidth = this.img.clientWidth;
	var clientHeight = this.img.clientHeight;
	var clientOffsetLeft = this.img.offsetLeft;
	var clientOffsetTop = this.img.offsetTop;
	var canvasWidth = this.canvas.width;
	var canvasHeight = this.canvas.height;
	var canvasOffsetLeft = this.canvas.offsetLeft;
	var canvasOffsetTop = this.canvas.offsetTop;

	if (canvasWidth !== clientWidth || canvasHeight !== clientHeight) {
		this.canvas.width = clientWidth;
		this.canvas.height = clientHeight;
		this.prepareBackground();
		this.glass.width = this.canvas.width;
		this.glass.height = this.canvas.height;
		this.prepareReflections();
	}
	if (canvasOffsetLeft !== clientOffsetLeft || canvasOffsetTop !== clientOffsetTop) {
		this.canvas.offsetLeft = clientOffsetLeft;
		this.canvas.offsetTop = clientOffsetTop;
	}
};

/**
 * Start animation loop
 */
RainyDay.prototype.animateDrops = function() {
	if (this.addDropCallback) {
		this.addDropCallback();
	}
	// |this.drops| array may be changed as we iterate over drops
	var dropsClone = this.drops.slice();
	var newDrops = [];
	for (var i = 0; i < dropsClone.length; ++i) {
		if (dropsClone[i].animate()) {
			newDrops.push(dropsClone[i]);
		}
	}
	this.drops = newDrops;
	window.requestAnimFrame(this.animateDrops.bind(this));
};

/**
 * Polyfill for requestAnimationFrame
 */
RainyDay.prototype.setRequestAnimFrame = function() {
	var fps = this.options.fps;
	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback) {
				window.setTimeout(callback, 1000 / fps);
			};
	})();
};

/**
 * Create the helper canvas for rendering raindrop reflections.
 */
RainyDay.prototype.prepareReflections = function() {
	this.reflected = document.createElement('canvas');
	this.reflected.width = this.canvas.width / this.options.reflectionScaledownFactor;
	this.reflected.height = this.canvas.height / this.options.reflectionScaledownFactor;
	var ctx = this.reflected.getContext('2d');
	ctx.drawImage(this.img, this.options.crop[0], this.options.crop[1], this.options.crop[2], this.options.crop[3], 0, 0, this.reflected.width, this.reflected.height);
};

/**
 * Create the glass canvas.
 */
RainyDay.prototype.prepareGlass = function() {
	this.glass = document.createElement('canvas');
	this.glass.width = this.canvas.width;
	this.glass.height = this.canvas.height;
	this.context = this.glass.getContext('2d');
};

/**
 * Main function for starting rain rendering.
 * @param presets list of presets to be applied
 * @param speed speed of the animation (if not provided or 0 static image will be generated)
 */
RainyDay.prototype.rain = function(presets, speed) {
	// prepare canvas for drop reflections
	if (this.reflection !== this.REFLECTION_NONE) {
		this.prepareReflections();
	}
	this.animateDrops();

	// animation
	this.presets = presets;

	this.PRIVATE_GRAVITY_FORCE_FACTOR_Y = (this.options.fps * 0.001) / 25;
	this.PRIVATE_GRAVITY_FORCE_FACTOR_X = ((Math.PI / 2) - this.options.gravityAngle) * (this.options.fps * 0.001) / 50;

	// prepare gravity matrix
	if (this.options.enableCollisions) {

		// calculate max radius of a drop to establish gravity matrix resolution
		var maxDropRadius = 0;
		for (var i = 0; i < presets.length; i++) {
			if (presets[i][0] + presets[i][1] > maxDropRadius) {
				maxDropRadius = Math.floor(presets[i][0] + presets[i][1]);
			}
		}

		if (maxDropRadius > 0) {
			// initialize the gravity matrix
			var mwi = Math.ceil(this.canvas.width / maxDropRadius);
			var mhi = Math.ceil(this.canvas.height / maxDropRadius);
			this.matrix = new CollisionMatrix(mwi, mhi, maxDropRadius);
		} else {
			this.options.enableCollisions = false;
		}
	}

	for (var i = 0; i < presets.length; i++) {
		if (!presets[i][3]) {
			presets[i][3] = -1;
		}
	}

	var lastExecutionTime = 0;
	this.addDropCallback = function() {
		var timestamp = new Date().getTime();
		if (timestamp - lastExecutionTime < speed) {
			return;
		}
		lastExecutionTime = timestamp;
		var context = this.canvas.getContext('2d');
		context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		context.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
		// select matching preset
		var preset;
		for (var i = 0; i < presets.length; i++) {
			if (presets[i][2] > 1 || presets[i][3] === -1) {
				if (presets[i][3] !== 0) {
					presets[i][3]--;
					for (var y = 0; y < presets[i][2]; ++y) {
						this.putDrop(new Drop(this, Math.random() * this.canvas.width, Math.random() * this.canvas.height, presets[i][0], presets[i][1]));
					}
				}
			} else if (Math.random() < presets[i][2]) {
				preset = presets[i];
				break;
			}
		}
		if (preset) {
			this.putDrop(new Drop(this, Math.random() * this.canvas.width, Math.random() * this.canvas.height, preset[0], preset[1]));
		}
		context.save();
		context.globalAlpha = this.options.opacity;
		context.drawImage(this.glass, 0, 0, this.canvas.width, this.canvas.height);
		context.restore();
	}
		.bind(this);
};

/**
 * Adds a new raindrop to the animation.
 * @param drop drop object to be added to the animation
 */
RainyDay.prototype.putDrop = function(drop) {
	drop.draw();
	if (this.gravity && drop.r > this.options.gravityThreshold) {
		if (this.options.enableCollisions) {
			this.matrix.update(drop);
		}
		this.drops.push(drop);
	}
};

/**
 * Clear the drop and remove from the list if applicable.
 * @drop to be cleared
 * @force force removal from the list
 * result if true animation of this drop should be stopped
 */
RainyDay.prototype.clearDrop = function(drop, force) {
	var result = drop.clear(force);
	if (result) {
		var index = this.drops.indexOf(drop);
		if (index >= 0) {
			this.drops.splice(index, 1);
		}
	}
	return result;
};

/**
 * Defines a new raindrop object.
 * @param rainyday reference to the parent object
 * @param centerX x position of the center of this drop
 * @param centerY y position of the center of this drop
 * @param min minimum size of a drop
 * @param base base value for randomizing drop size
 */

function Drop(rainyday, centerX, centerY, min, base) {
	this.x = Math.floor(centerX);
	this.y = Math.floor(centerY);
	this.r = (Math.random() * base) + min;
	this.rainyday = rainyday;
	this.context = rainyday.context;
	this.reflection = rainyday.reflected;
}

/**
 * Draws a raindrop on canvas at the current position.
 */
Drop.prototype.draw = function() {
	this.context.save();
	this.context.beginPath();

	var orgR = this.r;
	this.r = 0.95 * this.r;
	if (this.r < 3) {
		this.context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
		this.context.closePath();
	} else if (this.colliding || this.yspeed > 2) {
		if (this.colliding) {
			var collider = this.colliding;
			this.r = 1.001 * (this.r > collider.r ? this.r : collider.r);
			this.x += (collider.x - this.x);
			this.colliding = null;
		}

		var yr = 1 + 0.1 * this.yspeed;
		this.context.moveTo(this.x - this.r / yr, this.y);
		this.context.bezierCurveTo(this.x - this.r, this.y - this.r * 2, this.x + this.r, this.y - this.r * 2, this.x + this.r / yr, this.y);
		this.context.bezierCurveTo(this.x + this.r, this.y + yr * this.r, this.x - this.r, this.y + yr * this.r, this.x - this.r / yr, this.y);
	} else {
		this.context.arc(this.x, this.y, this.r * 0.9, 0, Math.PI * 2, true);
		this.context.closePath();
	}

	this.context.clip();

	this.r = orgR;

	if (this.rainyday.reflection) {
		this.rainyday.reflection(this);
	}

	this.context.restore();
};

/**
 * Clears the raindrop region.
 * @param force force stop
 * @returns Boolean true if the animation is stopped
 */
Drop.prototype.clear = function(force) {
	this.context.clearRect(this.x - this.r - 1, this.y - this.r - 2, 2 * this.r + 2, 2 * this.r + 2);
	if (force) {
		this.terminate = true;
		return true;
	}
	if ((this.y - this.r > this.rainyday.h) || (this.x - this.r > this.rainyday.w) || (this.x + this.r < 0)) {
		// over edge so stop this drop
		return true;
	}
	return false;
};

/**
 * Moves the raindrop to a new position according to the gravity.
 */
Drop.prototype.animate = function() {
	if (this.terminate) {
		return false;
	}
	var stopped = this.rainyday.gravity(this);
	if (!stopped && this.rainyday.trail) {
		this.rainyday.trail(this);
	}
	if (this.rainyday.options.enableCollisions) {
		var collisions = this.rainyday.matrix.update(this, stopped);
		if (collisions) {
			this.rainyday.collision(this, collisions);
		}
	}
	return !stopped || this.terminate;
};

/**
 * TRAIL function: no trail at all
 */
RainyDay.prototype.TRAIL_NONE = function() {
	// nothing going on here
};

/**
 * TRAIL function: trail of small drops (default)
 * @param drop raindrop object
 */
RainyDay.prototype.TRAIL_DROPS = function(drop) {
	if (!drop.trailY || drop.y - drop.trailY >= Math.random() * 100 * drop.r) {
		drop.trailY = drop.y;
		this.putDrop(new Drop(this, drop.x + (Math.random() * 2 - 1) * Math.random(), drop.y - drop.r - 5, Math.ceil(drop.r / 5), 0));
	}
};

/**
 * TRAIL function: trail of unblurred image
 * @param drop raindrop object
 */
RainyDay.prototype.TRAIL_SMUDGE = function(drop) {
	var y = drop.y - drop.r - 3;
	var x = drop.x - drop.r / 2 + (Math.random() * 2);
	if (y < 0 || x < 0) {
		return;
	}
	this.context.drawImage(this.clearbackground, x, y, drop.r, 2, x, y, drop.r, 2);
};

/**
 * GRAVITY function: no gravity at all
 * @returns Boolean true if the animation is stopped
 */
RainyDay.prototype.GRAVITY_NONE = function() {
	return true;
};

/**
 * GRAVITY function: linear gravity
 * @param drop raindrop object
 * @returns Boolean true if the animation is stopped
 */
RainyDay.prototype.GRAVITY_LINEAR = function(drop) {
	if (this.clearDrop(drop)) {
		return true;
	}

	if (drop.yspeed) {
		drop.yspeed += this.PRIVATE_GRAVITY_FORCE_FACTOR_Y * Math.floor(drop.r);
		drop.xspeed += this.PRIVATE_GRAVITY_FORCE_FACTOR_X * Math.floor(drop.r);
	} else {
		drop.yspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_Y;
		drop.xspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_X;
	}

	drop.y += drop.yspeed;
	drop.draw();
	return false;
};

/**
 * GRAVITY function: non-linear gravity (default)
 * @param drop raindrop object
 * @returns Boolean true if the animation is stopped
 */
RainyDay.prototype.GRAVITY_NON_LINEAR = function(drop) {
	if (this.clearDrop(drop)) {
		return true;
	}

	if (drop.collided) {
		drop.collided = false;
		drop.seed = Math.floor(drop.r * Math.random() * this.options.fps);
		drop.skipping = false;
		drop.slowing = false;
	} else if (!drop.seed || drop.seed < 0) {
		drop.seed = Math.floor(drop.r * Math.random() * this.options.fps);
		drop.skipping = drop.skipping === false ? true : false;
		drop.slowing = true;
	}

	drop.seed--;

	if (drop.yspeed) {
		if (drop.slowing) {
			drop.yspeed /= 1.1;
			drop.xspeed /= 1.1;
			if (drop.yspeed < this.PRIVATE_GRAVITY_FORCE_FACTOR_Y) {
				drop.slowing = false;
			}

		} else if (drop.skipping) {
			drop.yspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_Y;
			drop.xspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_X;
		} else {
			drop.yspeed += 1 * this.PRIVATE_GRAVITY_FORCE_FACTOR_Y * Math.floor(drop.r);
			drop.xspeed += 1 * this.PRIVATE_GRAVITY_FORCE_FACTOR_X * Math.floor(drop.r);
		}
	} else {
		drop.yspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_Y;
		drop.xspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_X;
	}

	if (this.options.gravityAngleVariance !== 0) {
		drop.xspeed += ((Math.random() * 2 - 1) * drop.yspeed * this.options.gravityAngleVariance);
	}

	drop.y += drop.yspeed;
	drop.x += drop.xspeed;

	drop.draw();
	return false;
};

/**
 * Utility function to return positive min value
 * @param val1 first number
 * @param val2 second number
 */
RainyDay.prototype.positiveMin = function(val1, val2) {
	var result = 0;
	if (val1 < val2) {
		if (val1 <= 0) {
			result = val2;
		} else {
			result = val1;
		}
	} else {
		if (val2 <= 0) {
			result = val1;
		} else {
			result = val2;
		}
	}
	return result <= 0 ? 1 : result;
};

/**
 * REFLECTION function: no reflection at all
 */
RainyDay.prototype.REFLECTION_NONE = function() {
	this.context.fillStyle = this.options.fillStyle;
	this.context.fill();
};

/**
 * REFLECTION function: miniature reflection (default)
 * @param drop raindrop object
 */
RainyDay.prototype.REFLECTION_MINIATURE = function(drop) {
	var sx = Math.max((drop.x - this.options.reflectionDropMappingWidth) / this.options.reflectionScaledownFactor, 0);
	var sy = Math.max((drop.y - this.options.reflectionDropMappingHeight) / this.options.reflectionScaledownFactor, 0);
	var sw = this.positiveMin(this.options.reflectionDropMappingWidth * 2 / this.options.reflectionScaledownFactor, this.reflected.width - sx);
	var sh = this.positiveMin(this.options.reflectionDropMappingHeight * 2 / this.options.reflectionScaledownFactor, this.reflected.height - sy);
	var dx = Math.max(drop.x - 1.1 * drop.r, 0);
	var dy = Math.max(drop.y - 1.1 * drop.r, 0);
	this.context.drawImage(this.reflected, sx, sy, sw, sh, dx, dy, drop.r * 2, drop.r * 2);
};

/**
 * COLLISION function: default collision implementation
 * @param drop one of the drops colliding
 * @param collisions list of potential collisions
 */
RainyDay.prototype.COLLISION_SIMPLE = function(drop, collisions) {
	var item = collisions;
	var drop2;
	while (item != null) {
		var p = item.drop;
		if (Math.sqrt(Math.pow(drop.x - p.x, 2) + Math.pow(drop.y - p.y, 2)) < (drop.r + p.r)) {
			drop2 = p;
			break;
		}
		item = item.next;
	}

	if (!drop2) {
		return;
	}

	// rename so that we're dealing with low/high drops
	var higher,
		lower;
	if (drop.y > drop2.y) {
		higher = drop;
		lower = drop2;
	} else {
		higher = drop2;
		lower = drop;
	}

	this.clearDrop(lower);
	// force stopping the second drop
	this.clearDrop(higher, true);
	this.matrix.remove(higher);
	lower.draw();

	lower.colliding = higher;
	lower.collided = true;
};

/**
 * Resizes canvas, draws original image and applies blurring algorithm.
 */
RainyDay.prototype.prepareBackground = function() {
	this.background = document.createElement('canvas');
	this.background.width = this.canvas.width;
	this.background.height = this.canvas.height;

	this.clearbackground = document.createElement('canvas');
	this.clearbackground.width = this.canvas.width;
	this.clearbackground.height = this.canvas.height;

	var context = this.background.getContext('2d');
	context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        context.globalAlpha = 0.3;////sp make opacity
	context.drawImage(this.img, this.options.crop[0], this.options.crop[1], this.options.crop[2], this.options.crop[3], 0, 0, this.canvas.width, this.canvas.height);

	//sp nightsky
	if (this.options.nightsky){
  	    //nightsky
	    var skyGradient = context.createLinearGradient(0, 0, 0, this.canvas.height);
	    skyGradient.addColorStop(1,'rgba(0,0,51,0.25)');
	    skyGradient.addColorStop(0, 'rgba(112,112,112,0.75)');
	    context.fillStyle = skyGradient;
	    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	context = this.clearbackground.getContext('2d');
	context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        context.globalAlpha = 0.3;////sp make opacity
	context.drawImage(this.img, this.options.crop[0], this.options.crop[1], this.options.crop[2], this.options.crop[3], 0, 0, this.canvas.width, this.canvas.height);

	if (!isNaN(this.options.blur) && this.options.blur >= 1) {
	    this.stackBlurCanvasRGB(this.canvas.width, this.canvas.height, this.options.blur);
	}
};

/**
 * Implements the Stack Blur Algorithm (@see http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html).
 * @param width width of the canvas
 * @param height height of the canvas
 * @param radius blur radius
 */
RainyDay.prototype.stackBlurCanvasRGB = function(width, height, radius) {

	var shgTable = [
		[0, 9],
		[1, 11],
		[2, 12],
		[3, 13],
		[5, 14],
		[7, 15],
		[11, 16],
		[15, 17],
		[22, 18],
		[31, 19],
		[45, 20],
		[63, 21],
		[90, 22],
		[127, 23],
		[181, 24]
	];

	var mulTable = [
		512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
		454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
		482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
		437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
		497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
		320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
		446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
		329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
		505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
		399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
		324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
		268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
		451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
		385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
		332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
		289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259
	];

	radius |= 0;

	var context = this.background.getContext('2d');
	var imageData = context.getImageData(0, 0, width, height);
	var pixels = imageData.data;
	var x,
		y,
		i,
		p,
		yp,
		yi,
		yw,
		rSum,
		gSum,
		bSum,
		rOutSum,
		gOutSum,
		bOutSum,
		rInSum,
		gInSum,
		bInSum,
		pr,
		pg,
		pb,
		rbs;
	var radiusPlus1 = radius + 1;
	var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

	var stackStart = new BlurStack();
	var stackEnd = new BlurStack();
	var stack = stackStart;
	for (i = 1; i < 2 * radius + 1; i++) {
		stack = stack.next = new BlurStack();
		if (i === radiusPlus1) {
			stackEnd = stack;
		}
	}
	stack.next = stackStart;
	var stackIn = null;
	var stackOut = null;

	yw = yi = 0;

	var mulSum = mulTable[radius];
	var shgSum;
	for (var ssi = 0; ssi < shgTable.length; ++ssi) {
		if (radius <= shgTable[ssi][0]) {
			shgSum = shgTable[ssi - 1][1];
			break;
		}
	}

	for (y = 0; y < height; y++) {
		rInSum = gInSum = bInSum = rSum = gSum = bSum = 0;

		rOutSum = radiusPlus1 * (pr = pixels[yi]);
		gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
		bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);

		rSum += sumFactor * pr;
		gSum += sumFactor * pg;
		bSum += sumFactor * pb;

		stack = stackStart;

		for (i = 0; i < radiusPlus1; i++) {
			stack.r = pr;
			stack.g = pg;
			stack.b = pb;
			stack = stack.next;
		}

		for (i = 1; i < radiusPlus1; i++) {
			p = yi + ((width - 1 < i ? width - 1 : i) << 2);
			rSum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
			gSum += (stack.g = (pg = pixels[p + 1])) * rbs;
			bSum += (stack.b = (pb = pixels[p + 2])) * rbs;

			rInSum += pr;
			gInSum += pg;
			bInSum += pb;

			stack = stack.next;
		}

		stackIn = stackStart;
		stackOut = stackEnd;
		for (x = 0; x < width; x++) {
			pixels[yi] = (rSum * mulSum) >> shgSum;
			pixels[yi + 1] = (gSum * mulSum) >> shgSum;
			pixels[yi + 2] = (bSum * mulSum) >> shgSum;

			rSum -= rOutSum;
			gSum -= gOutSum;
			bSum -= bOutSum;

			rOutSum -= stackIn.r;
			gOutSum -= stackIn.g;
			bOutSum -= stackIn.b;

			p = (yw + ((p = x + radius + 1) < (width - 1) ? p : (width - 1))) << 2;

			rInSum += (stackIn.r = pixels[p]);
			gInSum += (stackIn.g = pixels[p + 1]);
			bInSum += (stackIn.b = pixels[p + 2]);

			rSum += rInSum;
			gSum += gInSum;
			bSum += bInSum;

			stackIn = stackIn.next;

			rOutSum += (pr = stackOut.r);
			gOutSum += (pg = stackOut.g);
			bOutSum += (pb = stackOut.b);

			rInSum -= pr;
			gInSum -= pg;
			bInSum -= pb;

			stackOut = stackOut.next;

			yi += 4;
		}
		yw += width;
	}

	for (x = 0; x < width; x++) {
		gInSum = bInSum = rInSum = gSum = bSum = rSum = 0;

		yi = x << 2;
		rOutSum = radiusPlus1 * (pr = pixels[yi]);
		gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
		bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);

		rSum += sumFactor * pr;
		gSum += sumFactor * pg;
		bSum += sumFactor * pb;

		stack = stackStart;

		for (i = 0; i < radiusPlus1; i++) {
			stack.r = pr;
			stack.g = pg;
			stack.b = pb;
			stack = stack.next;
		}

		yp = width;

		for (i = 1; i < radiusPlus1; i++) {
			yi = (yp + x) << 2;

			rSum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
			gSum += (stack.g = (pg = pixels[yi + 1])) * rbs;
			bSum += (stack.b = (pb = pixels[yi + 2])) * rbs;

			rInSum += pr;
			gInSum += pg;
			bInSum += pb;

			stack = stack.next;

			if (i < (height - 1)) {
				yp += width;
			}
		}

		yi = x;
		stackIn = stackStart;
		stackOut = stackEnd;
		for (y = 0; y < height; y++) {
			p = yi << 2;
			pixels[p] = (rSum * mulSum) >> shgSum;
			pixels[p + 1] = (gSum * mulSum) >> shgSum;
			pixels[p + 2] = (bSum * mulSum) >> shgSum;

			rSum -= rOutSum;
			gSum -= gOutSum;
			bSum -= bOutSum;

			rOutSum -= stackIn.r;
			gOutSum -= stackIn.g;
			bOutSum -= stackIn.b;

			p = (x + (((p = y + radiusPlus1) < (height - 1) ? p : (height - 1)) * width)) << 2;

			rSum += (rInSum += (stackIn.r = pixels[p]));
			gSum += (gInSum += (stackIn.g = pixels[p + 1]));
			bSum += (bInSum += (stackIn.b = pixels[p + 2]));

			stackIn = stackIn.next;

			rOutSum += (pr = stackOut.r);
			gOutSum += (pg = stackOut.g);
			bOutSum += (pb = stackOut.b);

			rInSum -= pr;
			gInSum -= pg;
			bInSum -= pb;

			stackOut = stackOut.next;

			yi += width;
		}
	}

	context.putImageData(imageData, 0, 0);

};

/**
 * Defines a new helper object for Stack Blur Algorithm.
 */
function BlurStack() {
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.next = null;
}

/**
 * Defines a gravity matrix object which handles collision detection.
 * @param x number of columns in the matrix
 * @param y number of rows in the matrix
 * @param r grid size
 */
function CollisionMatrix(x, y, r) {
	this.resolution = r;
	this.xc = x;
	this.yc = y;
	this.matrix = new Array(x);
	for (var i = 0; i <= (x + 5); i++) {
		this.matrix[i] = new Array(y);
		for (var j = 0; j <= (y + 5); ++j) {
			this.matrix[i][j] = new DropItem(null);
		}
	}
}

/**
 * Updates position of the given drop on the collision matrix.
 * @param drop raindrop to be positioned/repositioned
 * @param forceDelete if true the raindrop will be removed from the matrix
 * @returns collisions if any
 */
CollisionMatrix.prototype.update = function(drop, forceDelete) {
	if (drop.gid) {
		if (!this.matrix[drop.gmx] || !this.matrix[drop.gmx][drop.gmy]) {
			return null;
		}
		this.matrix[drop.gmx][drop.gmy].remove(drop);
		if (forceDelete) {
			return null;
		}

		drop.gmx = Math.floor(drop.x / this.resolution);
		drop.gmy = Math.floor(drop.y / this.resolution);
		if (!this.matrix[drop.gmx] || !this.matrix[drop.gmx][drop.gmy]) {
			return null;
		}
		this.matrix[drop.gmx][drop.gmy].add(drop);

		var collisions = this.collisions(drop);
		if (collisions && collisions.next != null) {
			return collisions.next;
		}
	} else {
		drop.gid = Math.random().toString(36).substr(2, 9);
		drop.gmx = Math.floor(drop.x / this.resolution);
		drop.gmy = Math.floor(drop.y / this.resolution);
		if (!this.matrix[drop.gmx] || !this.matrix[drop.gmx][drop.gmy]) {
			return null;
		}

		this.matrix[drop.gmx][drop.gmy].add(drop);
	}
	return null;
};

/**
 * Looks for collisions with the given raindrop.
 * @param drop raindrop to be checked
 * @returns DropItem list of drops that collide with it
 */
CollisionMatrix.prototype.collisions = function(drop) {
	var item = new DropItem(null);
	var first = item;

	item = this.addAll(item, drop.gmx - 1, drop.gmy + 1);
	item = this.addAll(item, drop.gmx, drop.gmy + 1);
	item = this.addAll(item, drop.gmx + 1, drop.gmy + 1);

	return first;
};

/**
 * Appends all found drop at a given location to the given item.
 * @param to item to which the results will be appended to
 * @param x x position in the matrix
 * @param y y position in the matrix
 * @returns last discovered item on the list
 */
CollisionMatrix.prototype.addAll = function(to, x, y) {
	if (x > 0 && y > 0 && x < this.xc && y < this.yc) {
		var items = this.matrix[x][y];
		while (items.next != null) {
			items = items.next;
			to.next = new DropItem(items.drop);
			to = to.next;
		}
	}
	return to;
};

/**
 * Removed the drop from its current position
 * @param drop to be removed
 */
CollisionMatrix.prototype.remove = function(drop) {
	this.matrix[drop.gmx][drop.gmy].remove(drop);
};

/**
 * Defines a linked list item.
 */
function DropItem(drop) {
	this.drop = drop;
	this.next = null;
}

/**
 * Adds the raindrop to the end of the list.
 * @param drop raindrop to be added
 */
DropItem.prototype.add = function(drop) {
	var item = this;
	while (item.next != null) {
		item = item.next;
	}
	item.next = new DropItem(drop);
};

/**
 * Removes the raindrop from the list.
 * @param drop raindrop to be removed
 */
DropItem.prototype.remove = function(drop) {
	var item = this;
	var prevItem = null;
	while (item.next != null) {
		prevItem = item;
		item = item.next;
		if (item.drop.gid === drop.gid) {
			prevItem.next = item.next;
		}
	}
};

			rainfall = function(background,canvas){
			    var engine = new RainyDay({image:background,blur:8,opacity:80,nightsky:true},canvas);
			    engine.rain([[1, 0, 20],[3, 3, 1]],100);
			}

	      var rain_background = $(".weather .weather_background")[0];
	      rainfall(rain_background,canvas);
	  },1000)//$timeout
      }] //end directive controler function
    } //end return directive object
  }])

angular.module("lightgalaApp")
    .directive('repeatPassword',function(){
	return {
	    require: 'ngModel',
	    link: function(scope,elem,attrs,ctrl){
		var otherInput = elem.inheritedData("$formController")[attrs.repeatPassword];
		//install password and confirmpassword check
		ctrl.$parsers.push(function(value){
		    if(value===otherInput.$viewValue){
			ctrl.$setValidity('repeat',true);
			return value;
		    }
		    ctrl.$setValidity('repeat',false);
		});
		otherInput.$parsers.push(function(value){
		    ctrl.$setValidity('repeat',value===ctrl.$viewValue);
		    return value;
		})
	    }
	}
    })

angular.module("lightgalaApp")
  .directive("snow",['$document',function($document){
    //this directive generate snow svg components inside the decor svg foreground
    return {
      restrict: 'EA',
      templateUrl: "../../partials/weather.html",
      controller: ["$scope","$element","$timeout",function($scope,$element,$timeout){
	  $timeout(function(){
	      var xhtmlNS = 'http://www.w3.org/1999/xhtml';
	      var canvas = $document[0].getElementsByTagNameNS(xhtmlNS,'canvas')[0];
	      var snowfall = function(canvas){
			    var ctx = canvas.getContext("2d");
			    var W = canvas.width;
			    var H = canvas.height;
	
			    //snowflake particles
			    var mp = 100; //max particles
			    var particles = [];
			    for(var i = 0; i < mp; i++){
				particles.push({
				    x: Math.random()*W, //x-coordinate
				    y: Math.random()*H, //y-coordinate
				    r: Math.random()*3+1, //radius
			            d: Math.random()*mp //density
				})
			    }
	
			    //draw the flakes, night sky
			    function draw(){
				ctx.clearRect(0, 0, W, H);
				//nightsky
				var skyGradient = ctx.createLinearGradient(0, 0, 0, H);
				skyGradient.addColorStop(1,'white');
				skyGradient.addColorStop(0.9,'rgba(0,0,51,0.25)');
				skyGradient.addColorStop(0, 'rgba(112,112,112,0.75)');
				ctx.fillStyle = skyGradient;
				ctx.fillRect(0, 0, W, H);
				//flakes
				ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
				ctx.beginPath();
				for(var i = 0; i < mp; i++){
				    var p = particles[i];
				    ctx.moveTo(p.x, p.y);
				    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, true);
				}
				ctx.fill();
				update();
			    }	

			    //Function to move the snowflakes
			    //angle will be an ongoing incremental flag. Sin/Cos funcs are applied to it to create vert/horiz movements of the flakes
			    var angle = 0;
			    function update(){
				angle += 0.01;
				for(var i = 0; i < mp; i++){
				    var p = particles[i];
				    //Updating X and Y coordinates
				    //We will add 1 to the cos function to prevent negative values which will lead flakes to move upwards
				    //Every particle has its own density which can be used to make the downward movement different for each flake
				    //Lets make it more random by adding in the radius
				    p.y += Math.cos(angle+p.d) + 1 + p.r/2;
				    p.x += Math.sin(angle) * 2;
			
				    //Sending flakes back from the top when it exits
				    //Lets make it a bit more organic and let flakes enter from the left and right also.
				    if(p.x > W+5 || p.x < -5 || p.y > H){
					if(i%3 > 0){ //66.67% of the flakes
					    particles[i] = {x: Math.random()*W, y: -10, r: p.r, d: p.d};
					}else{
					    //If the flake is exitting from the right
					    if(Math.sin(angle) > 0){
						//Enter from the left
						particles[i] = {x: -5, y: Math.random()*H, r: p.r, d: p.d};
					    }else{
						//Enter from the right
						particles[i] = {x: W+5, y: Math.random()*H, r: p.r, d: p.d};
					    }
					}
				    }
				}
			    }
	
			    //animation loop
			    setInterval(draw, 33);
			};//end snowfall;
	      snowfall(canvas);
	  },1000)//$timeout
      }] //end directive controler function
    } //end return directive object
  }])

angular.module("lightgalaApp")
  .directive("tools",['$timeout','utilService',function($timeout,utilService){
    return {
      restrict: 'EA',
      //templateUrl: "tools.html",
      templateUrl: "../../partials/tools.html",
      link: function(scope,ele,attrs){
	  //allow attachToolMenu only twice
	  scope.attachToolMenu = utilService.nceFunc(function(){
	      //console.log("attach tool submenu");
	      var toolname;
	      //just in case 1 secon timeout delay is not enough in tools.js before run attach tool menu
	      for(var i=0;i<scope.data.tools.length;i++){
		  if(scope.data.tools[i].options.length>0){
		      toolname = scope.data.tools[i].name;
		      $('#tool-'+toolname).toolbar({
			  content: '#options-'+toolname, 
			  position: 'bottom',
			  hideOnClick: true
		      });
		      $('.tool-item[toolbox-name='+toolname+']').on('click',function(e){
			  scope.selectTool($(this).attr("name"));
		      });      	  
	      }
	      }
	  },2);
	  scope.$on("data_ready",function(event,args){
	      $timeout(scope.attachToolMenu,1000);
	  });
	  scope.current.music.totalMusics = scope.app_data.musics.length;
	  scope.current.music.musicsPerPage = 5;
	  scope.current.music.currentPage = 1;
	  scope.current.music.maxSize = 5;
	  scope.$watch('current.music.currentPage + current.music.musicsPerPage',function(){
	      var begin = (scope.current.music.currentPage - 1) * scope.current.music.musicsPerPage,
	          end = begin + scope.current.music.musicsPerPage;
	      scope.current.music.filteredMusics = scope.app_data.musics.slice(begin,end);
	  });
      }, //end link function
    } //end return directive object
  }])

angular.module("lightgalaApp")
  .directive("widgets",['lightAnimService','utilService','$popover',function(lightAnimService,utilService,$popover){
    return {
      restrict: 'EA',
      //widgets.html is loaded from widgets directive, which is called in link like: http://localhost:3000/decor/0/
      //however widgets.html static file is under public/html, available at http://localhost:3000/html/widgets.html
      //templateUrl: "widgets.html",
      templateUrl: "../../partials/widgets.html",
      link: function(scope,ele,attrs){
	  //popover needed for subcat popover
	  var infer_anims=function(anims,i){
	      //start from i-th anim, infer dur, begin, pattern_code, stopcolor1, stopcolor2, 
	      //this helps us to quickly enter animations of a pattern
	      var keys = ['set','segment','start_second','color'];
	      //var values1 = ['begin','dur'];  //continuous value
	      var values1 = [{name:'begin',regex:'^([0-9.]+)s$'},
			     {name:'dur',regex:'^([0-9.]+)s$'}];  //continuous value
	      var values2 = [
		  {name:'calcmode',steps:[{'value':'discrete','text':'N'},{'value':'','text':'Y'}]},
		  //match all value
		  {name:'pattern_code',steps:[{'value':'^[01]+$','text':'*'}]},
		  {name:'stopcolor1',steps:[{'value':'^hsl\(\d+,[\d.]+%,[\d.]+%\)$','text':'*'}],when:{name:'colorname',regex:'^rgb$'}},
		  {name:'stopcolor2',steps:[{'value':'^hsl\(\d+,[\d.]+%,[\d.]+%\)$','text':'*'}],when:{name:'colorname',regex:'^rgb$'}}
	      ];     //discrete value
	      var values2_inc_func = function(value_name,value,inc_by){
		  var v2 = _.find(values2,function(v){
		      return v.name == value_name;
		  });
		  var v2_step_i = _.findIndex(v2.steps,function(s){
		      return s.value == value || (new RegExp(s.value,"i")).test(value);
		  });
		  v2_step_i_inc = (v2_step_i + inc_by)%v2.steps.length;
		  //return v2.steps[v2_step_i_inc].value;
		  return v2_step_i_inc==0 ? value : v2.steps[v2_step_i_inc].value;
	      }
	      var anims_dl = _.filter(anims,function(anim){
		  return anim.decor_line_id == anims[i].decor_line_id;
	      }).sort(utilService.dynamicSortMultiple("decor_line_id","start_second","set","segment","color"));
	      var i_dl = _.findIndex(anims_dl,function(anim){
		  return angular.equals(anim,anims[i]);
	      });
	      if(i_dl>0){
		  var keys_diff = _.filter(keys,function(key){
		      return anims_dl[i_dl][key] != anims_dl[i_dl-1][key];
		  });
		  var values1_diff = _.filter(values1,function(value){
		      return anims_dl[i_dl].config[value.name] != anims_dl[i_dl-1].config[value.name] || 
			     (anims_dl[i_dl+1] && anims_dl[i_dl].config[value.name] != anims_dl[i_dl+1].config[value.name]);
		  });
		  //when anims_dl[i_dl] and anims_dl[i_dl-1] values are the same, process both values
		  //values1_diff = values1_diff.length==0? values1 : values1_diff;
		  if(keys_diff.length==1){
		      //for now, only handle one key different situation
		      var key = keys_diff[0];
		      //process continues config values
		      //for(var value_i=0; value_i<values1_diff.length; value_i++){
		      for(value_i in values1_diff){
			  var value = values1_diff[value_i];
			  var anims_dl_i_value = anims_dl[i_dl].config[value.name];
			  var anims_dl_i1_value = anims_dl[i_dl-1].config[value.name];
			  var delta_value = 0;
			  var anims_dl_i_value_m = (new RegExp(value.regex)).exec(anims_dl_i_value);
			  var anims_dl_i1_value_m = (new RegExp(value.regex)).exec(anims_dl_i1_value);
			  if(anims_dl_i_value_m && anims_dl_i1_value_m){
			      //anims_dl_i_value like 0.3s, needs to parse the float value
			      //delta_value = Math.round((parseFloat(anims_dl_i_value.substr(0,anims_dl_i_value.length-1)) - parseFloat(anims_dl_i1_value.substr(0,anims_dl_i1_value.length-1)))*100)/100;
			      delta_value = Math.round((parseFloat(anims_dl_i_value_m[1]) - parseFloat(anims_dl_i1_value_m[1]))*100)/100;
			      for(var j_dl=i_dl+1;j_dl<anims_dl.length;j_dl++){
				  var j = _.findIndex(anims,function(anim){
				      return angular.equals(anim,anims_dl[j_dl]);
				  });
				  anims[j].config[value.name] = Math.round((parseFloat(anims_dl_i_value_m[1]) + delta_value*(j_dl-i_dl))*100)/100 + 's';
			      }
			  }//end if
		      }
		      //process discrete config values, values 2 is a array of objects with name and steps
		      //var values2_names = _.pluck(values2,function(v){return v.name});
		      //for(value_i in values2_names){
		      for(value_i in values2){
			  //var value = values2_names[value_i];
			  var value = values2[value_i].name;
			  var steps = values2[value_i].steps;
			  var when = values2[value_i].when;
			  var anims_dl_i_value = anims_dl[i_dl].config[value];
			  var anims_dl_i_value_step = _.findIndex(steps,function(s){
			      return s.value == anims_dl_i_value;
			  })
			  var anims_dl_i1_value = anims_dl[i_dl-1].config[value];
			  var anims_dl_i1_value_step = _.findIndex(steps,function(s){
			      return s.value == anims_dl_i1_value;
			  })
			  if(angular.isUndefined(when) ||
			     ((new RegExp(when.regex,"i")).test(anims_dl[i_dl].config[when.name]) &&
			      (new RegExp(when.regex,"i")).test(anims_dl[i_dl-1].config[when.name]))
			    ){
			      var delta_value = Math.abs(anims_dl_i_value_step - anims_dl_i1_value_step);
			      for(var j_dl=i_dl+1;j_dl<anims_dl.length;j_dl++){
				  var j = _.findIndex(anims,function(anim){
				      return angular.equals(anim,anims_dl[j_dl]);
				  });
				  anims[j].config[value] = values2_inc_func(value,anims_dl_i_value,delta_value*(j_dl-i_dl));
			      }			  
			  }
		      }
		  }
	      }
	  }
          scope.$watch('data.animations',function(newanims,oldanims){
	      var anim_service = lightAnimService.getAnim();
	      for(var i=0;i<newanims.length; i++){
		  var newanim = newanims[i];
		  var oldanim = _.find(oldanims,function(anim){
		      return anim.color == newanim.color &&
			     anim.start_second == newanim.start_second &&
			     anim.decor_line_id == newanim.decor_line_id &&
			     anim.segment == newanim.segment &&
			     anim.set == newanim.set;
		  });
		  if(!oldanim){
		      newanim.anim_id = anim_service.formAnimId(newanim.decor_line_id,newanim.segment,newanim.set,newanim.color,newanim.start_second);
		      //console.log("reenter anim for " + newanim.decor_line_id + " and update anim_id to " + newanim.anim_id);
		      if(scope.decor_line_anim_enter_func){
			  scope.decor_line_anim_enter_func(newanim.decor_line_id);
		      }
		      break;
		  }else{
		      if(!angular.equals(newanim.config,oldanim.config)){
			  //console.log("reenter anim for " + newanim.decor_line_id);
			  //infer dur or delay value change by anim_keys: set/segment/start_second/color
			  if(i>0){
			      infer_anims(newanims,i);
			  }
			  //end infer
			  scope.decor_line_anim_enter_func(newanim.decor_line_id);
			  break;
		      }
		  }
	      }
          },true);
      } //end link function
    } //end return directive object
  }])
