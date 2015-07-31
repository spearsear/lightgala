/*
 *   this file define lightService which provide various kinds of light
 */
angular.module("lightgalaApp")
  .factory("lightService",['lightSvgsService','utilService','$window',function(lightSvgsService,utilService,$window){
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
	    if(angular.isDefined(d[0].shadow) && Object.keys(d[0].shadow).length>0){
	      //shadow is not {}
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
	  append_to.each(function(d){
	    //set bulbcolor in data so random color can be rendered as a real color in canvas
	    d.bulbcolor = light.color;
	  });
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
	  });
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
	  append_to.each(function(d){
	    //set bulbcolor in data so random color can be rendered as a real color in canvas
	    d.bulbcolor = light.color;
	  });
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
	    //deprecated
	    //append_to.attr("filter","url("+$window.location+"#lightglow)");
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
	    var rgdata = (angular.isDefined(shadow) && Object.keys(shadow).length>0)?[shadow]:[];
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
