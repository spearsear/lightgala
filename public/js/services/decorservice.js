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
		    //shadow could be undefined,{},or {...}
		    shadow: ele_cfg.rgConfigured.dirty? angular.copy(ele_cfg.rgConfigured) : {}
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
		    scope.resetShadow();
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
