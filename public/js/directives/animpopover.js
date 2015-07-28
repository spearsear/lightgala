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
    .directive('popOver', ['$compile','$window','utilService','toolService','lightAnimService',function ($compile,$window,utilService,toolService,lightAnimService) {
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
			    //.selectAll(".click-capture")
			    //.style("visibility","visible")
			    .append("image")
			    .classed("pointer",true)
			    .attr("xlink:href","/img/pointer.png")
			    .attr("width",30)
			    .attr("height",30);
			    //.attr("fill","url("+$window.location+"#pointer)");
		    }
		};
		scope.mouseLeaveAnim = function(anim_id){
		    var anim = _.find(scope.animations,function(anim){
			return anim.anim_id == anim_id;
		    })
		    if(anim){
			d3.select("svg").select("g[decor_line_id='"+anim.decor_line_id+"']")
			    .selectAll("g[segment='"+anim.segment+"'][set='"+anim.set+"'][bulbcolor='"+anim.color+"']")
			    //.selectAll(".click-capture")
			    //.style("visibility","hidden")
			    .selectAll("image.pointer")
			    .remove();
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
