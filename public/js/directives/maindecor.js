angular.module("lightgalaApp")
    .directive('mainDecor',['$q','$timeout','$window','$http','$routeParams','$location','$alert','$modal','$rootScope','d3Service','decorsListService','decorService','decorDataService','lightSvgsService','lightService','lightAnimService','toolService','utilService','usSpinnerService',function($q,$timeout,$window,$http,$routeParams,$location,$alert,$modal,$rootScope,d3Service,decorsListService,decorService,decorDataService,lightSvgsService,lightService,lightAnimService,toolService,utilService,usSpinnerService){
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
			  //dirty, ask save or not if currently logged in
			  if($rootScope.currentUser){
			      exitModal.$promise.then(exitModal.show);
			  }else{
			      //decorDataService.resetData();
			      onRouteChangeOff(); //Stop listening for location changes
			      $location.path(newUrl); //Go to page they're interested in
			  }
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
		  scope.animate_defer = $q.defer();
		  var starttool = _.find(scope.data.tools,function(tool){return tool.name=='animatestarttool'});
		  if(scope.current.animation.start){
		      starttool.icon_toggle = true;
		      if(scope.svg){
			  //asynch start animation
			  $timeout(function(){scope.animateStart(true)},0);
			  scope.selectTool("musicTool");
		      }
		  }else{
		      starttool.icon_toggle = false;
		      if(scope.svg){
			  $timeout(function(){scope.animateStart(false)},0);
			  //pause music
			  if(scope.current.music.playing){
			      scope.selectTool("musicTool");
			  }
		      }
		  }
		  scope.animate_defer.promise.then(function(str_success){
		      console.log(str_success);
		      usSpinnerService.stop('spinner-1');
		  },function(str_error){
		      console.log(str_error);
		  });
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
		  var anim = lightAnimService.getAnim();
		  _.forEach(scope.data.decor.decor_lines,function(dl){
		      //remove all inactive anims dom element
		      scope.decor_line_anim_enter_func(dl.decor_line_id);
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
			  scope.animate_defer.resolve("animate started");
		      },function(){},3);//10 numcycles
		  });
	      }else{
		  var anim = lightAnimService.getAnim();
		  anim.stop(function(){});
		  if(scope.animate_defer){
		      scope.animate_defer.resolve("animate stopped");
		  }
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
			d3.select(this).call(light.uncastshadow).call(light.castshadow).call(light.unemitray).call(light.emitray);
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
			d3.select(this).call(light.uncastshadow).call(light.castshadow).call(light.unemitray).call(light.emitray);
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
		         //scaleFactor = scope.rScale(d.scale_factor*3);
			 scaleFactor = scope.rScale(d.scale_factor*1.2);
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
