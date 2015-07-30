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
	combineRgbWithOpacity: function(rgbStr,opacity){
	    var re = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
	    var rgb_m = re.exec(rgbStr);	    
	    var val = rgbStr;
            if(rgb_m){
		var rgba = "rgba("+rgb_m[1]+','+rgb_m[2]+','+rgb_m[3]+','+opacity+")";
		return rgba;
	    }
	    return val;	    
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
	getTransformObject: function(point){
	    return (function(){
		var t_obj = {};
		t_obj.point = point;
		//transformMatrix: a,       b,       c,       d,       tx,          ty,          u,       v,       w
		//                 x scale, y skew,  x skew,  y scale, x translate, y translate  0,       0,       1
		//initialized to be identity matrix
		t_obj.transform_matrix = {
		    a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0
		};
		t_obj.translate = function(tx,ty){
		    t_obj.transform_matrix.tx += tx;
		    t_obj.transform_matrix.ty += ty;
		    return t_obj;
		};
		t_obj.scale = function(sx,sy){
		    t_obj.transform_matrix.a *= sx;
		    t_obj.transform_matrix.b *= sy;
		    t_obj.transform_matrix.c *= sx;
		    t_obj.transform_matrix.d *= sy;
		    t_obj.transform_matrix.tx *= sx;
		    t_obj.transform_matrix.ty *= sy;
		    return t_obj;
		};
		t_obj.rotate = function(angle){
		    //angle in radius eg Math.PI/4
		    var sin = Math.sin(angle);
		    var cos = Math.cos(angle);
		    var a = t_obj.transform_matrix.a;
		    var b = t_obj.transform_matrix.b;
		    var c = t_obj.transform_matrix.c;
		    var d = t_obj.transform_matrix.d;
		    var tx = t_obj.transform_matrix.tx;
		    var ty = t_obj.transform_matrix.ty;
		    t_obj.transform_matrix.a = a*cos - b*sin;
		    t_obj.transform_matrix.b = a*sin + b*cos;
		    t_obj.transform_matrix.c = c*cos - d*sin;
		    t_obj.transform_matrix.d = c*sin + d*cos;
		    t_obj.transform_matrix.tx = tx*cos - ty*sin;
		    t_obj.transform_matrix.ty = tx*sin + ty*cos;		    
		    return t_obj;
		};
		t_obj.transform = function(){
		    var a = t_obj.transform_matrix.a;
		    var b = t_obj.transform_matrix.b;
		    var c = t_obj.transform_matrix.c;
		    var d = t_obj.transform_matrix.d;
		    var tx = t_obj.transform_matrix.tx;
		    var ty = t_obj.transform_matrix.ty;
		    var x_star = t_obj.point.x * a + t_obj.point.y * c + tx;
		    var y_star = t_obj.point.x * b + t_obj.point.y * d + ty;
		    return {
			x: x_star,
			y: y_star
		    };
		};
		t_obj.getTransformMatrix = function(){
		    //eg: gradientTransform="matrix(0.87421145,0,0,1,123.23725,-120)"
		    var a = t_obj.transform_matrix.a;
		    var b = t_obj.transform_matrix.b;
		    var c = t_obj.transform_matrix.c;
		    var d = t_obj.transform_matrix.d;
		    var tx = t_obj.transform_matrix.tx;
		    var ty = t_obj.transform_matrix.ty;
		    //return "matrix("+a+","+b+","+c+","+d+","+tx+","+ty+")";
		    return [a,b,c,d,tx,ty];
		};
		return t_obj;
	    })();
	},
	anotherFunc: function(){
	}
    }
});
