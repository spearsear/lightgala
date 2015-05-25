/*
 *   this file define toolService which provide widget subcategory icon and toolbox icon functionalities
 *   widget subcategory icon and toolbox icon functionalities are considered to be tools
 *   to config current_config which is referenced by scope.element_config
 */
angular.module("lightgalaApp")
  .factory("toolService",['$location','decorService','decorDataService','lightService','lightAnimService','utilService','usSpinnerService','$modal','$aside','$alert','$popover','$injector','$q','$timeout',function($location,decorService,decorDataService,lightService,lightAnimService,utilService,usSpinnerService,$modal,$aside,$alert,$popover,$injector,$q,$timeout){      
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
	    usSpinnerService.spin('spinner-1');
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
	    //toggleAudio as a promise
	    var defer = $q.defer();
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
				    defer.resolve('music loaded');
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
			    defer.reject("can not play sound");
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

	    defer.promise.then(function(str_success){
		updateProgress(0,this.duration);
		console.log(str_success);
	    },function(str_error){
		console.log(str_error);
	    });

	    $timeout(toggleAudio,0);
	    return this;
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
	    usSpinnerService.spin('spinner-1');
	    scope.snow_defer = $q.defer();
	    var snowfunc = function($compile){
		//need to inject $compile service
		/*scope.svg.select("g.decor g.foreground").selectAll("g.weather").remove();
		scope.svg.select("g.decor g.foreground").append("g").attr("class","weather").attr("snow","");
		$compile($("g.weather"))(scope);*/
		$("div.decormain div.weather").remove();
		$("div.decormain").append("<div class='weather' snow></div>");
		$compile($("div.weather"))(scope);
		scope.snow_defer.resolve("snow started");
	    };
	    //avoid minimization replace $compile paramter with b
	    snowfunc.$inject = ['$compile'];
	    $injector.invoke(snowfunc,null);
	    scope.snow_defer.promise.then(function(str_success){
		console.log(str_success);
		usSpinnerService.stop('spinner-1');
	    },function(str_error){
		console.log(str_error);
	    });
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
	    usSpinnerService.spin('spinner-1');
	    scope.rain_defer = $q.defer();
	    var rainfunc = function($compile){
		//need to inject $compile service
		/*scope.svg.select("g.decor g.foreground").selectAll("g.weather").remove();
		scope.svg.select("g.decor g.foreground").append("g").attr("class","weather")
		    .attr("rain","");
		$compile($("g.weather"))(scope);*/
		$("div.decormain div.weather").remove();
		$("div.decormain").append("<div class='weather' rain></div>");
		$compile($("div.weather"))(scope);
		scope.rain_defer.resolve("rain started");
	    };
	    //avoid minimization replace $compile paramter with b
	    rainfunc.$inject = ['$compile'];
	    $injector.invoke(rainfunc,null);
	    scope.rain_defer.promise.then(function(str_success){
		console.log(str_success);
		usSpinnerService.stop('spinner-1');
	    },function(str_error){
		console.log(str_error);
	    });
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
