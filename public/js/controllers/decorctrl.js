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
    .controller('decorCtrl',['$scope','$q','$timeout','$http','$alert','$location','$rootScope','$routeParams','baseUrl','decorsListService','subscriptionService','decorService','decorDataService','toolService','lightService','utilService','vcRecaptchaService','usSpinnerService',function($scope,$q,$timeout,$http,$alert,$location,$rootScope,$routeParams,baseUrl,decorsListService,subscriptionService,decorService,decorDataService,toolService,lightService,utilService,vcRecaptchaService,usSpinnerService){
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
	  //save asyncly
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
	      usSpinnerService.spin("spinner-1");
	      $scope.data.decor.user_id = $rootScope.currentUser._id;
	      $scope.data.decor.last_mod_time = new Date();
	      //update
	      //decorsListService.update({_id: $scope.decor_id}, $scope.data);

	      var data_n_captcha = {
		  data: $scope.data,
		  recaptcha_response: 0 //vcRecaptchaService.getResponse()
	      }

	      //decorsListService.update({_id: $scope.decor_id}, $scope.data).$promise.then(function(updatedDecor){
	      decorsListService.update({_id: $scope.decor_id}, data_n_captcha).$promise.then(function(updatedDecor){
		  //updated successfully
		  $scope.setDirty(false);
		  $scope.saveDialog.$promise.then(function(){
		      decorDataService.resetData();
		      $scope.saveDialog.hide();	
		      usSpinnerService.stop("spinner-1");	      
		  })
	      },function(err){
		  //error occured
		  usSpinnerService.stop("spinner-1");
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
		      //vcRecaptchaService.reload($scope.recaptcha.widgetId);
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
	      usSpinnerService.spin("spinner-1");
	      $scope.data.decor.user_id = $rootScope.currentUser._id;
	      $scope.data.decor.create_time = new Date();
	      $scope.data.decor.last_mod_time = new Date();
	      var data_n_captcha = {
		  data: $scope.data,
		  //disable recaptcha
		  recaptcha_response: 0 //vcRecaptchaService.getResponse()
	      }
	      //new decorsListService($scope.data).$save().then(function(newData){
	      new decorsListService(data_n_captcha).$save().then(function(newData){
		  $scope.data = newData;
		  $scope.decor_id = newData._id;
		  $scope.setDirty(false);
		  $scope.saveDialog.hide();
		  decorDataService.resetData();
		  usSpinnerService.stop("spinner-1");
	      },function(err){
		  usSpinnerService.stop("spinner-1");
		  //error occured
		  if(err.status==401){
		      //Unauthorized
		      $scope.saveDialog.hide();
		      $location.path('/login/');
		  }else if(err.status==409){
		      //recaptcha failed
		      //disable recaptcha
		      //vcRecaptchaService.reload($scope.recaptcha.widgetId);
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
	      usSpinnerService.spin("spinner-1");
	      $scope.data.$delete(function(){
		  //success callback
		  usSpinnerService.stop("spinner-1");
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

      $scope.resetShadow = function(){
	  $scope.element_config.rgConfigured.dirty = false;
      };

      $scope.initShadowStopColors = function(){
	  //initialize shadow stop colors to be the stopcolor1 and stopcolor2 of current selected color
	  if($scope.current.decor.line_element_id){
	      var ele = d3.select("g[decor_line_id='"+$scope.current.decor.line_id+"'][decor_line_element_id='"+$scope.current.decor.line_element_id+"']");
	      var stops = $scope.element_config.rgConfigured.stops;
	      var light = lightService.getLight(ele.data()[0].light_type);
	      if(light.getColorDef){
		  var color_def = light.getColorDef(light.color);
		  if(color_def){
		      stops[0].color = utilService.hslStringToRgbString(color_def.stopcolor1);
		      stops[stops.length-1].color = utilService.hslStringToRgbString(color_def.stopcolor2);
		  }
	      }
	  }
      }

      $scope.shadowViewFunc = function(){
	  //attach configured shadow data to current decor_line_element
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
		      if(d){
			  var light = lightService.getLight(d.light_type);
			  var stops = d.shadow.stops;
			  var bulb_color = ele.attr("bulbcolor");
			  if(light.getColorDef){
			      var color_def = light.getColorDef(bulb_color);
			      if(color_def){
				  stops[0].color = utilService.hslStringToRgbString(color_def.stopcolor1);
				  stops[stops.length-1].color = utilService.hslStringToRgbString(color_def.stopcolor2);
			      }
			  }
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
			  if(light.getColorDef){
			      var color_def = light.getColorDef(bulb_color);
			      if(color_def){
				  stops[0].color = utilService.hslStringToRgbString(color_def.stopcolor1);
				  stops[stops.length-1].color = utilService.hslStringToRgbString(color_def.stopcolor2);
			      }
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
