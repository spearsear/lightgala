angular.module("lightgalaApp")
  .directive("decorcanvas",['$document',function($document){
    //this directive plays lightshow animation in canvas with much better performance than svg
    return {
	restrict: 'EA',
	templateUrl: "../../partials/decorcanvas.html",
	controller: ["$scope","$element","$q","$timeout","lightService","lightSvgsService",function($scope,$element,$q,$timeout,lightService,lightSvgsService){	
	    $scope.mode = $element.attr('mode'); //or view from attrs
	    $scope.margins = {left: 14, right: 14, top: 10, bottom: 10};
	    $scope.loadDecor();

	    $scope.renderCanvas = function(){
		//we use fabic instead of directly draw on canvas
		/*$scope.canvas = $element.find('canvas')[0];
		$scope.canvas.width = document.getElementsByClassName("decor_svg")[0].getBoundingClientRect().width;
		$scope.canvas.height = $scope.canvas.width * $scope.data.decor.decor_aspect_ratio;
		$scope.ctx = $scope.canvas.getContext("2d");*/
		$scope.canvas = new fabric.Canvas('decorcanvas');
		$scope.canvas.setWidth(document.getElementsByClassName("decor_svg")[0].getBoundingClientRect().width);
		$scope.canvas.setHeight($scope.canvas.getWidth() * $scope.data.decor.decor_aspect_ratio);
		$timeout($scope.renderDecorLinesOnCanvas,1);
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
		    $scope.renderDecorLineOnCanvas($scope.data.decor.decor_lines[i].decor_line_id);
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
			    fill: ele.color
			})
			$scope.canvas.add(bulb);
		    }else{
			fabric.Image.fromURL(light.url, function(oImg) {
			    oImg.scale(scaleFactor);
			    oImg.setLeft($scope.xScale(ele.x-ele.w/2));
			    oImg.setTop($scope.yScale(ele.y-ele.h/2));
			    oImg.setWidth(light.size.width);
			    oImg.setHeight(light.size.height);
			    $scope.canvas.add(oImg);
			});
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
