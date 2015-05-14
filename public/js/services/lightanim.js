/*
 *   this file define lightAnimService which provide various kinds of light animation pattern for each decor_line
 */
angular.module("lightgalaApp")
  .factory("lightAnimService",['$timeout','lightService','utilService',function($timeout,lightService,utilService){
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
	    //do not stop anim here otherwise timers of other decor_line will be cleared
	    //self.stop(function(){});
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
