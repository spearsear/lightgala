angular.module("radialgradient.module",["colorpicker.module"])
	//Helper is from colorpicker.module
	.directive("rgChooser",['$window','$rootScope','$compile','$document','Helper',function($window,$rootScope,$compile,$document,Helper){
		'use strict';
		return {
			//require controller of the directive named ngModel
			require: '?ngModel',
			restrict: "EA",
			scope: {
				rgConfigured: '=ngModel',
				runAfter: '&runAfter'
			},
			//required ngModel controller is supplied as an argiment
			link: function(scope, element, attrs, ngModel){
				//controller code: rgdata should've be in controller
				scope.margin = {top: 10, right: 10, bottom: 10, left: 10};
				scope.rgdata = {
					width: 256 + scope.margin.left + scope.margin.right,
					height: 256 + scope.margin.top + scope.margin.bottom,
					center: {x: 0.5, y:0.5},
					focal: {x: 0.5, y: 0.5},
					radius: 0.5,
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
				};
				scope.rgdata.colors = [];
				scope.colors_changed = false;
				scope.num_colors = 11;  //number of control colors to change stop color
				scope.num_temps = 4;    //keep 4 temp rgdata
				scope.rgdata_temps = [];

				scope.computeColorArray = function(){
				    if(typeof d3 == "undefined"){
					return false;
				    }
					if(!scope.rgdata.colors){
						scope.rgdata.colors = [];
					}
					scope.rgdata.colors.splice(0,scope.rgdata.colors.length);
					var colors = [];
					var offsets = [];
					var offsets_exp = [];  //light exponential falloff, not used
					for(var i=0;i<scope.rgdata.stops.length;i++){
						colors.push(scope.rgdata.stops[i].color);
						offsets.push(parseFloat(scope.rgdata.stops[i].offset));
						offsets_exp.push(0.095*Math.exp(0.465*parseFloat(scope.rgdata.stops[i].offset)));
					}
					var stopcolor_scale = d3.scale.linear()
						.domain(colors)
						.range(offsets);
					var stopcolor_scale_reverse = d3.scale.linear()
						.domain(offsets)
						.range(colors);
					//interpret $scope.num_colors colors based on stop color
					for(var i=0;i<=scope.num_colors-1;i++){
						var original = false;
						for(var j=0; j<scope.rgdata.stops.length;j++){
							if(parseFloat(scope.rgdata.stops[j].offset)*10 == i){
								original = true;
							}
						}
						scope.rgdata.colors[i] = {
							original: original,
							color: stopcolor_scale_reverse(i/10)
						}
					}
				};

				scope.sortStops = function(){
					scope.rgdata.stops.sort(function(stop1,stop2){
						if(parseFloat(stop1.offset)>parseFloat(stop2.offset)){
							return 1;
						}
						if(parseFloat(stop1.offset)<parseFloat(stop2.offset)){
							return -1;
						}
						return 0;
					})
				};

				scope.getFillUrl = function(){
					return "url("+$window.location+"#rg-grad-1)";
				}

				scope.$watch("rgdata.colors",function(newVal,oldVal){
					if(!scope.colors_changed){
						return false;
					}
					scope.colors_changed = false;
					for(var i=0;i<newVal.length;i++){
						if(newVal[i].color!=oldVal[i].color){
							//the i-th color changed
							//scope.colors_changed = true;
							if(newVal[i].original){
								//original stop color changed, update corresponding stops
								for(var j=0;j<scope.rgdata.stops.length;j++){
									if(parseFloat(scope.rgdata.stops[j].offset)*10 == i){
										scope.rgdata.stops[j].color = newVal[i].color;
									}
								}
							}else{
								//new original
								//insert new original to stops
								scope.rgdata.stops.push({
									offset: String(i/10), 
									color: newVal[i].color, 
									opacity: scope.computeStopOpacity(i)
								})
								scope.sortStops();
							}
							if (ngModel) {
        						//ngModel directive controller saves rgdata
             					ngModel.$setViewValue(scope.rgdata);
             					ngModel.$render();
             				}
						}
						if(newVal[i].original!=oldVal[i].original){
							if(!newVal[i].original){
								//remove a non head/tail stop
								for(var j=1;j<scope.rgdata.stops.length-1;j++){
									if(parseFloat(scope.rgdata.stops[j].offset)*10 == i){
										scope.rgdata.stops.splice(j,1);
									}
								}
							}
							if (ngModel) {
        						//ngModel directive controller saves rgdata
             					ngModel.$setViewValue(scope.rgdata);
             					ngModel.$render();
             				}
						}
            		}
					scope.computeColorArray();
				},true);

				// this watch is only needed when jquery is loaded, jqlite does not need this
				/*if(typeof jQuery != 'undefined'){
					scope.$watch(function(){return scope.computeGradientTransform()}, function(value) {
						//jquery lowercase gradientTransform to gradienttransform, need to convert it back, geez 
        				//document.getElementById('rg-grad-1').setAttribute("gradientTransform", value);
        				//either find by id or by tag, both works
        				//$document.find('#rg-grad-1')[0].setAttribute("gradientTransform", value);
        				$document.find('.rgchooser').find('radialGradient')[0].setAttribute("gradientTransform", value);
      				});
				}*/

				scope.$on("colorpicker-selected",function(event,data){
					//one of the stop colors changed
					scope.colors_changed = true;
					if(ngModel) {
        				//ngModel directive controller saves rgdata
             			ngModel.$setViewValue(scope.rgdata);
             			ngModel.$render();
             			//scope.runAfter();
            		}
					scope.$apply();
				});

				scope.computeColorArray();

				//directive code:
				var //target = element,
					//do not append rgChooserTemplate to element, insteaed append to body, otherwise Firefix mousedown event will fire even with stopPropogation
					target = angular.isDefined(attrs.rgchooserParent) ? elem.parent() : angular.element(document.body),
					position = angular.isDefined(attrs.rgchooserPosition) ? attrs.rgchooserPosition : 'bottom',
					inline = angular.isDefined(attrs.rgchooserInline) ? attrs.rgchooserInline : false,
					template = "<div class='rgchooser dropdown'>"
					+ "<div class='dropdown-menu'>"
					+ "<svg class='svg-Viewer' xmlns='http://www.w3.org/2000/svg'>"
					+ "  <defs>"
    				+ "    <radialGradient id='rg-grad-1' cx='{{rgdata.center.x}}' cy='{{rgdata.center.y}}' r='{{rgdata.radius}}' fx='{{rgdata.focal.x}}' fy='{{rgdata.focal.y}}' gradientTransform='{{ computeGradientTransform() }}' spreadMethod='pad'>"
    				+ "      <stop ng-repeat='stop in rgdata.stops' offset='{{stop.offset}}' style='{{ computeGradientStopStyle($index) }}'>"
    				+ "      </stop>"
    				+ "    </radialGradient>"
  					+ "  </defs>"
					+ "  <rect x={{margin.left}} y={{margin.right}} width={{rgdata.width-margin.left-margin.right}} height={{rgdata.height-margin.top-margin.bottom}} fill='{{ getFillUrl() }}'>"
					+ "  </rect>"
					+ "</svg>"
					+ "<div class='stopcolor-Ctrl'>"
					+ "  <div class='stopcolor-Chooser'>"
					+ "    <div ng-repeat='color in rgdata.colors' class='stopcolor {{stopColorClass(color)}}' colorpicker='rgb' colorpicker-close-on-select colorpicker-position='bottom' ng-model='rgdata.colors[$index].color' style='{{ computeStopColorStyle($index) }}'></div>"
					+ "		<div class='rgchooser-Reset' ng-click='resetRgChooser()'>{{ computeRgdataIndexInTemps() }}</div>"
					+ "  </div>"
					+ "  <div class='stopcolor-ToggleStop rgchooser-Ctrl'>"
					+ "    <div ng-repeat='color in rgdata.colors' class='stopcolor {{stopColorClass(color)}}' ng-click=' toggleStopColorOriginal($index) ' style='{{ computeStopColorToggleStyle($index) }}'></div>"
					+ "  </div>"
					+ "</div>"
					+ "</div></div>",
					rgChooserTemplate = angular.element(template);

				$compile(rgChooserTemplate)(scope);
				rgChooserTemplate.addClass('rgchooser-position-' + position);
				if (inline === 'true') {
            		rgChooserTemplate.addClass('rgchooser-inline');
          		}

				target.append(rgChooserTemplate);

          		//setup and render rgChooser view in d3
				if(attrs.stopcolor1 || attrs.stopcolor2){
					if(attrs.stopcolor1){
						scope.rgdata.stops[0].color = attrs.stopcolor1;
					}
					if(attrs.stopcolor2){
						scope.rgdata.stops[1].color = attrs.stopcolor2;
					}
					scope.computeColorArray();
				}

				scope.computeGradientTransform = function(){
					//return "rotate(41.17887931034482,0.47918701171875,0.50390625) translate(0,0.3556665880926724) scale(1,0.2941810344827587)";
					return "rotate("+scope.rgdata.transform.rotate+","+scope.rgdata.center.x+","+scope.rgdata.center.y+") translate("+scope.rgdata.transform.translate.x+","+scope.rgdata.transform.translate.y+") scale("+scope.rgdata.transform.scale.x+","+scope.rgdata.transform.scale.y+")";
				};

				scope.computeStopOpacity = function(i){
					var opac = (1-i/10)-(1-scope.rgdata.opacity)*(1-i/10);
					return opac<0 ? 0.1 : opac;
				};

				scope.computeGradientStopStyle = function(i){
					//<stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:0" />
      		        //<stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
					return "stop-color:"+scope.rgdata.stops[i].color+";stop-opacity:"+scope.rgdata.stops[i].opacity;
				};

				scope.computeStopColorStyle = function(i){
					return "width: "+ scope.rgdata.width/(scope.num_colors+1) + 'px; '
						+ "height: "+ scope.rgdata.height/(scope.num_colors+1) + 'px; '
						+ "display: inline-block; "
						+ "background-color: " + scope.rgdata.colors[i].color;
				};

				scope.computeStopColorToggleStyle = function(i){
					var s = "width: "+ scope.rgdata.width/(scope.num_colors+1) + 'px; '
						+ "height: "+ scope.rgdata.height/(scope.num_colors+1) + 'px; '
						+ "display: inline-block; ";
					return s + (scope.rgdata.colors[i].original?'border-top: ' + scope.rgdata.colors[i].color +' 4px solid;':'');
				}

				scope.toggleStopColorOriginal = function(i){
					if(i>0 && i<scope.rgdata.colors.length-1){
						scope.rgdata.colors[i].original = !scope.rgdata.colors[i].original;
						scope.colors_changed = true;
					}
				};

				scope.stopColorClass = function(color){
					return color.original? 'original' : 'interpreted';
				};

				scope.inArray = function(obj,arr){
					var inarr = false;
					for(var i=0;i<arr.length;i++){
						if(angular.equals(obj,arr[i])){
							inarr=true;
							break;
						}
					}
					return inarr;
				}


				scope.computeRgdataIndexInTemps = function(){
					for(var i=0;i<scope.rgdata_temps.length;i++){
						if(angular.equals(scope.rgdata,scope.rgdata_temps[i])){
							return i;
						}
					}
					return 9;
				};

				scope.resetRgChooser = function(){
					//rgdata-temps saves all versions of rgdata being worked on, including rgdata_default
					if(!scope.inArray(scope.rgdata_default,scope.rgdata_temps)){
						scope.rgdata_temps.push(angular.copy(scope.rgdata_default));
					}
					//cycle thru items in rgdata_temps to rgdata
					var index = scope.computeRgdataIndexInTemps();
					var index_next = index == scope.rgdata_temps.length-1? 0 : index+1;
					scope.rgdata = scope.rgdata_temps[index_next];
					scope.computeColorArray();
					controlsUpdateFunc();
					if(ngModel) {
        				//ngModel directive controller saves rgdata
             			ngModel.$setViewValue(scope.rgdata);
             			ngModel.$render();
            		}
				};

				var radius_scale = d3.scale.linear()
					.domain([0,1])
					.range([0,2]);
				var radius_scale_reverse = d3.scale.linear()
					.domain([0,2])
					.range([0,1]);

				var opacity_scale = d3.scale.linear()
					.domain([0,1])
					.range([0,1]);
				var opacity_scale_reverse = d3.scale.linear()
					.domain([0,1])
					.range([0,1]);

				var rotate_scale = d3.scale.linear()
					.domain([0,1])
					.range([-360,360]);
				var rotate_scale_reverse = d3.scale.linear()
					.domain([-360,360])
					.range([0,1]);

				var drag = d3.behavior.drag()
    				.origin(function(d) { return d; })
    				.on("dragstart", dragstarted)
    				.on("drag", dragged)
    				.on("dragend", dragended);

      			function dragstarted(d) {
      				if(d3.event.sourceEvent){
 	 					d3.event.sourceEvent.stopPropagation();
 	 				}
  					d3.select(this).classed("dragging", true);
				}

				function dragged(d) {
  					d3.select(this)
  						.attr("cx", function(){
  							var x_new;
  							if(d.name=='radius'){
  								//radius is left edge, do not change x
  								x_new = parseFloat(d3.select(this).attr("cx"));
  							}else{
  								x_new =  d3.event.dx + parseFloat(d3.select(this).attr("cx"));
  							}
  							d.x = x_new/scope.rgdata.width;
  							//handle drag out side x-axis
  							if(d.x<0){
  								d.x = 0.02;
  								x_new = scope.rgdata.width*d.x;
  							}
  							if(d.x>1){
  								d.x = 0.98;
  								x_new = scope.rgdata.width*d.x;
  							}
  							if(d.name == 'opacity'){
  								scope.rgdata.opacity = opacity_scale(d.x);
  								for(var i=0;i<scope.rgdata.stops.length;i++){
  									scope.rgdata.stops[i].opacity = scope.computeStopOpacity(scope.rgdata.stops[i].offset*10);
  								}
  							}
  							if(d.name == 'rotate'){
  								scope.rgdata.transform.rotate = rotate_scale(d.x);
  							}
  							if(d.name == 'center' || d.name == 'focal'){
  								scope.rgdata[d.name].x = d.x;
  							}
  							/*if(d.name == 'translate' || d.name == 'scale'){
  								scope.rgdata.transform[d.name].x = d.x;
  							}*/
  							if(d.name == 'translate'){
  								scope.rgdata.transform[d.name].x = d.x - 0.45;
  							}
  							if(d.name == 'scale'){
  								scope.rgdata.transform[d.name].x = d.x + 0.45;
  							}
  							return x_new;
  						})
  						.attr("cy", function(){
  							var y_new;
  							if(d.name == 'rotate' || d.name == 'opacity'){
  								//rotate and opacity are top and bottom edge, do not change y
  								y_new = parseFloat(d3.select(this).attr("cy"));
  							}else{
  								y_new =  d3.event.dy + parseFloat(d3.select(this).attr("cy"));
  							}
  							d.y = y_new/scope.rgdata.height;
  							//handle drag out side y-axis
  							if(d.y<0){
  								d.y = 0.02;
  								y_new = scope.rgdata.height*d.y;
  							}
  							if(d.y>1){
  								d.y = 0.98;
  								y_new = scope.rgdata.width*d.y;
  							}
  							if(d.name=='radius'){
  								scope.rgdata.radius = radius_scale(d.y);
  							}
  							if(d.name == 'center' || d.name == 'focal'){
  								scope.rgdata[d.name].y = d.y;
  							}
  							/*if(d.name == 'translate' || d.name == 'scale'){
  								scope.rgdata.transform[d.name].y = d.y;
  							}*/
  							if(d.name == 'translate'){
  								scope.rgdata.transform[d.name].y = d.y - 0.45;
  							}
  							if(d.name == 'scale'){
  								scope.rgdata.transform[d.name].y = d.y + 0.45;
  							}
  							return y_new;
  						});
  					if(ngModel) {
        				//ngModel directive controller saves rgdata
             			ngModel.$setViewValue(scope.rgdata);
             			ngModel.$render();
             			//scope.runAfter();
            		}
  					scope.$apply();
				}

				function dragended(d) {
  					d3.select(this).classed("dragging", false);
				}

				//setup control points to manually change radialgradient
				var svg = d3.select(".rgchooser svg.svg-Viewer")
					.attr("width", scope.rgdata.width)
					.attr("height", scope.rgdata.height);
				
				var controlsEnterFunc = function(){
					svg.append("g")
						.attr("class","rgchooser-Ctrls")
						.selectAll("circle")
						.data([
							angular.extend(scope.rgdata.center,{name:'center',ctrl_color:'orange'}),
							angular.extend(scope.rgdata.focal,{name:'focal',ctrl_color:'pink'}),
							angular.extend(scope.rgdata.transform.translate,{name:'translate',ctrl_color:'blue'}),
							angular.extend(scope.rgdata.transform.scale,{name:'scale',ctrl_color:'red'}),
							angular.extend({x:0.02,y:radius_scale_reverse(scope.rgdata.radius)},{name:'radius',ctrl_color:'green'}),
							angular.extend({x:rotate_scale_reverse(scope.rgdata.transform.rotate),y:0.98},{name:'rotate',ctrl_color:'yellow'}),
							angular.extend({x:opacity_scale_reverse(scope.rgdata.opacity),y:0.02},{name:'opacity',ctrl_color:'purple'}),
						])
						.enter()
						.append("circle")
						.attr("class",function(d){
							return d.name + " rgchooser-Ctrl";
						})
						.attr("cx",function(d){
							if(d.name=='translate'){
								return scope.rgdata.width*(d.x+0.45);
							}else if(d.name=='scale'){
								return scope.rgdata.width*(d.x-0.45);
							}else{
								return scope.rgdata.width*d.x;
							}
						})
						.attr("cy",function(d){
							if(d.name=='translate'){
								return scope.rgdata.height*(d.y+0.45);
							}else if(d.name=='scale'){
								return scope.rgdata.height*(d.y-0.45);
							}else{
								return scope.rgdata.height*d.y;
							}
						})
						.attr("r",4)
						.attr("fill",function(d){
							return d.ctrl_color;
						})
						.attr("stroke","gray")
						.attr("stroke-width","1")
						.call(drag)
						.append("svg:title")
   						.text(function(d) {
   							return d.name; 
   						});

					//control lines at edge, hard code edge at 0.02 and 0.98 inset from svg border
					svg.append("g")
						.attr("class","rgchooser-Ctrl-Lines")
						.selectAll("line")
						.data([
							{name:'left-edge',start:{x:0.02,y:0.02},end:{x:0.02,y:0.98}},
							{name:'bottom-edge',start:{x:0.02,y:0.98},end:{x:0.98,y:0.98}},
							{name:'top-edge',start:{x:0.02,y:0.02},end:{x:0.98,y:0.02}},
							{name:'right-edge',start:{x:0.98,y:0.02},end:{x:0.98,y:0.98}},
						])
						.enter()
						.append("line")
						.attr("class",function(d){
							return d.name + " rgchooser-Ctrl-Line";
						})
						.attr("x1",function(d){
							return d.start.x * scope.rgdata.width;
						})
						.attr("y1",function(d){
							return d.start.y * scope.rgdata.height;
						})
						.attr("x2",function(d){
							return d.end.x * scope.rgdata.width;
						})
						.attr("y2",function(d){
							return d.end.y * scope.rgdata.height;
						})
						.attr("stroke","gray")
						.attr("stroke-width","1")
				};//end controlsEnterFunc

				var controlsUpdateFunc = function(){
					svg.select("g.rgchooser-Ctrls")
						.selectAll("circle")
						.data([
							angular.extend(scope.rgdata.center,{name:'center',ctrl_color:'orange'}),
							angular.extend(scope.rgdata.focal,{name:'focal',ctrl_color:'pink'}),
							angular.extend(scope.rgdata.transform.translate,{name:'translate',ctrl_color:'blue'}),
							angular.extend(scope.rgdata.transform.scale,{name:'scale',ctrl_color:'red'}),
							angular.extend({x:0.02,y:radius_scale_reverse(scope.rgdata.radius)},{name:'radius',ctrl_color:'green'}),
							angular.extend({x:rotate_scale_reverse(scope.rgdata.transform.rotate),y:0.98},{name:'rotate',ctrl_color:'yellow'}),
							angular.extend({x:opacity_scale_reverse(scope.rgdata.opacity),y:0.02},{name:'opacity',ctrl_color:'purple'}),
						])
						//.append("circle")
						.attr("class",function(d){
							return d.name + " rgchooser-Ctrl";
						})
						.attr("cx",function(d){
							if(d.name=='translate'){
								return scope.rgdata.width*(d.x+0.45);
							}else if(d.name=='scale'){
								return scope.rgdata.width*(d.x-0.45);
							}else{
								return scope.rgdata.width*d.x;
							}
						})
						.attr("cy",function(d){
							if(d.name=='translate'){
								return scope.rgdata.height*(d.y+0.45);
							}else if(d.name=='scale'){
								return scope.rgdata.height*(d.y-0.45);
							}else{
								return scope.rgdata.height*d.y;
							}
						});
				};//end controlsUpdateFunc

				controlsEnterFunc();

				//create a shape filled with #rg-grad-1 as demo
				svg.append("g")
					.selectAll("rect.demo")
					.data([{x:0.05,y:0.75,width:0.2,height:0.2}])
					.enter()
					.append("rect")
					.attr("class","demo")
					.attr("x",function(d){
						return d.x*scope.rgdata.width;
					})
					.attr("y",function(d){
						return d.y*scope.rgdata.height;
					})
					.attr("width",function(d){
						return d.width*scope.rgdata.width;
					})
					.attr("height",function(d){
						return d.height*scope.rgdata.height;
					})
					//.attr("fill","url(#rg-grad-1)");
					//.attr("fill","url("+$window.location+"#rg-grad-1)");
					.attr("fill",function(){
						return scope.getFillUrl();
					})

				//after d3 setup
				//make a copy we can reset to
				scope.rgdata_default = angular.copy(scope.rgdata);
				if(scope.rgdata_temps.length==0){
					scope.rgdata_temps.push(angular.copy(scope.rgdata_default));
				}
				if(ngModel) {
            		ngModel.$render = function () {
              			//element.val(ngModel.$viewValue);
              			//render the $viewValue which is a radialgradient as the fill of another DOM element
              			//this is generally defined as a func in another controller passed to the isolated scope
              			if(scope.runAfter){
              				scope.runAfter();
              			}
            		};
            		scope.$watch(attrs.ngModel, function(newVal) {
            			if(angular.isDefined(newVal)){
            				scope.rgdata = newVal;
            				//save a few versions of rgdata
            				if(scope.rgdata_temps.length<2 || !scope.inArray(scope.rgdata,scope.rgdata_temps)){
            					scope.rgdata_temps.push(scope.rgdata);
            				}
              				controlsUpdateFunc();
              			}
            		},true);
            		scope.$watch("rgConfigured",function(newVal){
            			if(angular.isDefined(newVal)){
            				scope.rgdata = newVal;
            				//save a few versions of rgdata
            				if(scope.rgdata_temps.length<2 || !scope.inArray(scope.rgdata,scope.rgdata_temps)){
            					scope.rgdata_temps.push(scope.rgdata);
            				}
            				scope.computeColorArray();
              				controlsUpdateFunc();
            			}
            		},true);
          		}else{
          			//save a few versions of rgdata
          			if(scope.rgdata_temps.length<2 || !scope.inArray(scope.rgdata,scope.rgdata_temps)){
            			scope.rgdata_temps.push(scope.rgdata);
            		}
          		}

          		element.on('$destroy', function() {
            		rgChooserTemplate.remove();
          		});

          		var emitEvent = function(name) {
            		if(ngModel) {
              			scope.$emit(name, {
                			name: attrs.ngModel,
                			value: ngModel.$modelValue
              			});
            		}
          		};
          		
				var getRgChooserTemplatePosition = function() {
            		var
                		positionValue,
                		positionOffset = Helper.getOffset(element[0]);

            			if(angular.isDefined(attrs.rgchooserParent)) {
              				positionOffset.left = 0;
              				positionOffset.top = 0;
            			}

            			if (position === 'top') {
              				positionValue =  {
                				'top': positionOffset.top - 147,
                				'left': positionOffset.left
              				};
            			} else if (position === 'right') {
              				positionValue = {
                				'top': positionOffset.top,
                				'left': positionOffset.left + 126
              				};
            			} else if (position === 'bottom') {
              				positionValue = {
                				'top': positionOffset.top + element[0].offsetHeight + 2,
                				'left': positionOffset.left
              				};
            			} else if (position === 'left') {
              				positionValue = {
                				'top': positionOffset.top,
                				'left': positionOffset.left - 150
              				};
            			}
            			return {
              				'top': positionValue.top + 'px',
              				'left': positionValue.left + 'px'
            			};
          		};

          		var documentMousedownHandler = function() {
            		hideRgChooserTemplate();
          		};
          
          		var showRgChooserTemplate = function() {
            		if (!rgChooserTemplate.hasClass('rgchooser-visible')) {
              			controlsUpdateFunc();
              			rgChooserTemplate
                			.addClass('rgchooser-visible')
                			.css(getRgChooserTemplatePosition());
              			emitEvent('rgchooser-shown');

              			if (inline === false) {
                			// register global mousedown event to hide the rgchooser
                			$document.on('mousedown', documentMousedownHandler);
              			}

              			if (attrs.rgChooserIsOpen) {
                			scope[attrs.rgChooserIsOpen] = true;
                			/*if (!scope.$$phase) {
                  				scope.$digest(); //trigger the watcher to fire
                			}*/
              			}
              			//trigger the watcher to fire
              			if (!scope.$$phase) {
                  			scope.$digest(); //trigger the watcher to fire
                		}
            		}
          		};

          		if(inline === false) { 
            		element.on('click', showRgChooserTemplate);
          		} else {
            		showRgChooserTemplate();
          		}

          		rgChooserTemplate.on('mousedown', function (event) {
            		event.stopPropagation();
            		event.preventDefault();
          		});

          		var hideRgChooserTemplate = function() {
            		if (rgChooserTemplate.hasClass('rgchooser-visible')) {
              			rgChooserTemplate.removeClass('rgchooser-visible');
              			emitEvent('rgchooser-closed');
              			// unregister the global mousedown event
              			$document.off('mousedown', documentMousedownHandler);

              			if (attrs.rgChooserIsOpen) {
                			scope[attrs.rgChooserIsOpen] = false;
                			if (!scope.$$phase) {
                  				scope.$digest(); //trigger the watcher to fire
                			}
              			}
            		}
          		};

          		rgChooserTemplate.find('button').on('click', function () {
            		hideRgChooserTemplate();
          		});

          		if (attrs.rgchooserIsOpen) {
           			scope.$watch(attrs.rgchooserIsOpen, function(shouldBeOpen) {
              			if (shouldBeOpen === true) {
                			showRgChooserTemplate();
              			} else if (shouldBeOpen === false) {
                			hideRgChooserTemplate();
              			}
            		});
          		}
          	}
		}
	}]);
