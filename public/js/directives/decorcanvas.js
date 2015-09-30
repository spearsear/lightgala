angular.module("lightgalaApp")
  .directive("decorcanvas",['$document',function($document){
    //this directive plays lightshow animation in canvas with much better performance than svg
    return {
	restrict: 'EA',
	templateUrl: "../../partials/decorcanvas.html",
	controller: ["$scope","$element","$q","$timeout","lightService","lightSvgsService","utilService",function($scope,$element,$q,$timeout,lightService,lightSvgsService,utilService){	
	    $scope.mode = $element.attr('mode'); //or view from attrs
	    $scope.margins = {left: 14, right: 14, top: 10, bottom: 10};
	    $scope.loadDecor();

	    $scope.renderCanvas = function(){
		//we use fabic instead of directly draw on canvas
		/*$scope.canvas = $element.find('canvas')[0];
		$scope.canvas.width = document.getElementsByClassName("decor_svg_or_canvas")[0].getBoundingClientRect().width;
		$scope.canvas.height = $scope.canvas.width * $scope.data.decor.decor_aspect_ratio;
		$scope.ctx = $scope.canvas.getContext("2d");*/
		$scope.canvas = new fabric.Canvas('decorcanvas');
		$scope.canvas.setWidth(document.getElementsByClassName("decor_svg_or_canvas")[0].getBoundingClientRect().width);
		$scope.canvas.setHeight($scope.canvas.getWidth() * $scope.data.decor.decor_aspect_ratio);
		if($scope.mode == 'play'){
		    var onclickfunc = function() {
			$scope.canvas.renderAll();
			return false;
		    };
		    $('.decor_area').on('touchstart touchmove touchend', onclickfunc);
		    $('.decor_area').on('click', onclickfunc);
		}
		$scope.renderDecorLinesOnCanvas();
	    };

	    //deprecated
	    $scope.renderCanvasBackground = function(callback){
		var img = new Image();
		img.onload = function(){
		    $scope.ctx.drawImage(img,
					 $scope.margins.left,
					 $scope.margins.top,
					 $scope.canvas.width - $scope.margins.left - $scope.margins.right,
					 $scope.canvas.height - $scope.margins.top - $scope.margins.bottom);
		    callback();
		};
		img.src = $scope.data.decor.backgroundurl;
	    };

	    $scope.renderDecorLinesOnCanvas = function(){
		for(var i=0;i<$scope.data.decor.decor_lines.length;i++){
		    if($scope.data.decor.decor_lines[i].decor_line_type == 'measurementScaling' &&
		       $scope.mode == 'play'){
		    }else{
			$timeout((function(){
			    var j = i;
			    return function(){$scope.renderDecorLineOnCanvas($scope.data.decor.decor_lines[j].decor_line_id)};
			})(),0);
		    }
		}
	    };

	    $scope.renderDecorLineOnCanvas = function(decor_line_id){
		var decor_line = _.find($scope.data.decor.decor_lines,function(dl){
		    return dl.decor_line_id == decor_line_id;
		})
		//borrow the d3 scale function
		$scope.xScale = d3.scale.linear()
		    .domain([0,$scope.data.decor.decor_width])
		    .range([0,$scope.width]),
		$scope.xScale_reverse = d3.scale.linear()
		    .range([0,$scope.data.decor.decor_width])
		    .domain([0,$scope.width]),
		$scope.yScale = d3.scale.linear()
		    .domain([0,$scope.data.decor.decor_width * $scope.data.decor.decor_aspect_ratio])
		    .range([0,$scope.height]),
		$scope.yScale_reverse = d3.scale.linear()
		    .range([0,$scope.data.decor.decor_width * $scope.data.decor.decor_aspect_ratio])
		    .domain([0,$scope.height]),
		$scope.rScale = d3.scale.linear()
		    .domain([0,1])
		    .range([0,1 * $scope.width / $scope.data.decor.decor_width]),
		$scope.rScale_reverse = d3.scale.linear()
		    .range([0,1])
		    .domain([0,1 * $scope.width / $scope.data.decor.decor_width]);

		//decor_line object:
		//decor_line_animtype: "onandoff"decor_line_id: "1433799608268_26"decor_line_subtype: "Fascia"decor_line_type: "Roof Lighting"decor_line_visible: trueelements: Array[1]0: Objectcolor: "rgb"group: 0h: 10id: "1433799608268_1"light_subtype: "C1"light_type: "shiningXmasLight"light_unbreakable: falselight_unflashable: falselight_unlightable: falserotate_degree: 0scale_factor: 0.12288000000000002scale_factor_shadow: 95.39621664406894segment: 0set: 0shadow: Objecttag: "original"w: 8x: 215y: 376
		//object in elements:
		//color: "rgb"group: 0h: 10id: "1433799608268_1"light_subtype: "C1"light_type: "shiningXmasLight"light_unbreakable: falselight_unflashable: falselight_unlightable: falserotate_degree: 0scale_factor: 0.12288000000000002scale_factor_shadow: 95.39621664406894segment: 0set: 0shadow: Objecttag: "original"w: 8x: 215y: 376
		//color: "yellow" group: 0 h: 10 id: "1436881267649_1" light_subtype: "C1" light_type: "shiningXmasLight" light_unbreakable: false light_unflashable: false light_unlightable: false rotate_degree: 0 scale_factor: 0.12288000000000002 scale_factor_shadow: 1 segment: 1 set: 0 shadow: Object tag: "original" w: 8 x: 239.9798941798942 y: 318.64550264550263
		//shadow object:
		//center: Objectcolors: Array[11]dirty: truefocal: Objectheight: 276opacity: 0.6radius: 0.03478260869565218stops: Array[2]transform: Objectwidth: 276

		//for now draw a circle on canvas
		for(var i=0;i<decor_line.elements.length;i++){
		    var ele = decor_line.elements[i];
		    //render the element: parse svg and render outline,base,bulb,ray,shadow etc
		    var light = lightService.getLight(ele.light_type).initColors($scope.data.defs);
		    var svg = lightSvgsService.getSvgByType(ele.light_type);
		    var scaleFactor = $scope.rScale(ele.scale_factor);
		    if(light.__proto__.light_type == 'basicLight'){
			var bulb = new fabric.Path(svg.bulb_path);
			bulb.set({
			    //left:$scope.xScale(ele.x-ele.w/2),
			    //top:$scope.yScale(ele.y-ele.h/2),
			    left:$scope.xScale(ele.x),
			    top:$scope.yScale(ele.y),
			    scaleX: scaleFactor,
			    scaleY: scaleFactor,
			    //ele.color could be random, rgb, or a real color, so use bulbcolor and take rgb color from shadow
			    fill: ele.color == 'rgb'? (ele.shadow? ele.shadow.stops[0].color : 'red') : (ele.bulbcolor? ele.bulbcolor: ele.color)
			})
			$scope.canvas.add(bulb);
			if(ele.shadow){
			    var sf_shadow = ele.scale_factor_shadow? ele.scale_factor_shadow: 1;
			    var bbox_bulb = bulb.getBoundingRect();
			    var //x = $scope.xScale(ele.x-Math.max(ele.w,ele.h)*5*sf_shadow),
			        //y = $scope.yScale(ele.y-Math.max(ele.w,ele.h)*5*sf_shadow),
			        //w = $scope.xScale(Math.max(ele.w,ele.h)*10*sf_shadow),
				//h = $scope.yScale(Math.max(ele.w,ele.h)*10*sf_shadow);
			        w = Math.max(bbox_bulb.width,bbox_bulb.height)*10*sf_shadow,
			        h = Math.max(bbox_bulb.width,bbox_bulb.height)*10*sf_shadow,
			        x = bbox_bulb.left-w/2,
			        y = bbox_bulb.top-h/2;
			    var center = {
				x: ele.shadow.center.x * w,
				y: ele.shadow.center.y * h
			    };
			    var focal = {
				x: ele.shadow.focal.x * w,
				y: ele.shadow.focal.y * h
			    }
			    var tr = ele.shadow.transform;
			    //var center_star = utilService.getTransformObject(center).rotate(tr.rotate*Math.PI/180).translate(tr.translate.x*w,tr.translate.y*h).scale(tr.scale.x,tr.scale.y).transform();
			    //var focal_star = utilService.getTransformObject(focal).rotate(tr.rotate*Math.PI/180).translate(tr.translate.x*w,tr.translate.y*h).scale(tr.scale.x,tr.scale.y).transform();
			    //var transform_matrix = utilService.getTransformObject(center).rotate(tr.rotate*Math.PI/180).translate(tr.translate.x*w,tr.translate.y*h).scale(tr.scale.x,tr.scale.y).getTransformMatrix();
			    var x_str = "rotate("+(tr.rotate)+",0.5,0.5) translate("+(tr.translate.x*w)+","+(tr.translate.y*h)+") scale("+tr.scale.x+","+tr.scale.y+")";
			    var transform_matrix = fabric.parseTransformAttribute(x_str);
			    //radial gradient
			    var rg = {
				type: 'radial',
				x1: center.x, //center_star.x,
				y1: center.y,  //center_star.y,
				r1: 0*w,
				x2: focal.x,  //focal_star.x,
				y2: focal.y,  //focal_star.y,
				r2: ele.shadow.radius * w,
				/*colorStops: {
				    0: 'blue',
				    0.5: 'white',
				    1: 'rgba(0,0,255,0.5)'
				},*/
				//transformMatrix: [1,0,0,2,0,0],
				//transformMatrix: transform_matrix,
				colorStops: (function(){
				    var color_stops = {};
				    for(var i=0;i<ele.shadow.stops.length;i++){
					color_stops[ele.shadow.stops[i].offset] = utilService.combineRgbWithOpacity(ele.shadow.stops[i].color,ele.shadow.stops[i].opacity);
				    }
				    return color_stops;
				})()
			    }
			    var rect = new fabric.Rect({left: x,
							top: y,
							width: w,
							height: h,
							opacity: ele.shadow.opacity
						       });
			    rect.setGradient('fill', rg);
			    //fabric should have set this in rg, they will fix this
			    rect.fill.gradientTransform = transform_matrix;

			    //can we createRadialGradient from svg string: <radialGradient id="id_1437959762135_2_1437959762135_1_shadow" class="rg" cx="0.5" cy="0.5" r="0.31014492753623174" fx="0.5" fy="0.5" spreadMethod="pad" gradientTransform="rotate(0,0.5,0.5) translate(0.02173913043478254,0.21014492753623176) scale(1,1)"><stop offset="0" stop-color="rgb(106,52,5)" stop-opacity="1"><animate attributeName="stop-opacity" values="0;1;0;0" keyTimes="0;0.3333333333333333;0.6666666666666666;1" dur="1.75s" begin="0.2s" repeatCount="indefinite"></animate></stop><stop offset="1" stop-color="rgb(245,152,70)" stop-opacity="0"><animate attributeName="stop-opacity" values="0;0;0;0" keyTimes="0;0.3333333333333333;0.6666666666666666;1" dur="1.75s" begin="0.2s" repeatCount="indefinite"></animate></stop></radialGradient>
			    //which can be obtained from
			    //d3.select('#id_1437959762135_2_1437959762135_1_shadow')[0][0].outerHTML
			    $scope.canvas.add(rect);
			}
		    }else{
			fabric.Image.fromURL(light.url, (function(){
			    var ele_cp = ele;
			    return function(oImg) {
				//oImg.scale(scaleFactor);
				oImg.scale(ele_cp.scale_factor);
				oImg.setLeft($scope.xScale(ele_cp.x-ele_cp.w/2));
				oImg.setTop($scope.yScale(ele_cp.y-ele_cp.h/2));
				oImg.setWidth($scope.xScale(light.size.width));
				oImg.setHeight($scope.yScale(light.size.height));
				oImg.setAngle(ele_cp.rotate_degree);
				$scope.canvas.add(oImg);
			    }})());
		    }
		    /*we use fabric object instead of directly draw on canvas
		    $scope.ctx.save();
		    $scope.ctx.globalCompositionOperation = "source-over";
		    $scope.ctx.fillStyle = ele.color;
		    $scope.ctx.strokeStyle = ele.color;
		    $scope.ctx.beginPath();
		    $scope.ctx.arc($scope.xScale(ele.x),$scope.yScale(ele.y),2,0,Math.PI*2,false);
		    $scope.ctx.stroke();
		    $scope.ctx.fill();
		    $scope.ctx.restore();*/
		}
	    };

            $scope.$watch('data.decor.decor_lines',function(newdl,olddl){
		$scope.renderCanvas();
            },true);

	}] //end directive controller func
    } //end return directive object
}])
