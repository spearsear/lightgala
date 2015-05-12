angular.module("lightgalaApp")
  .factory("lightSvgsService",function(){
    return {
      svg_libs: [],

      loadAll: function(d3){
	var self = this;
        //preload svg files
	var svg_files = [
	    {light_type: 'basicXmasLight', url: "/js/services/svgs/basicxmaslight.svg"},
	    {light_type: 'shiningXmasLight', url: "/js/services/svgs/shiningxmaslight.svg"},
	    {light_type: 'basicGroundLight', url: "/js/services/svgs/basicgroundlight.svg"},
	    {light_type: 'measurementTapeEnd', url: "/js/services/svgs/measurementtapeend.svg"},
	];
	//====== basicXmasLight, basicGroundLight, measurementTapeEnd  =======
	for(i in svg_files){
	    var svg_file = svg_files[i].url;
	    //need j inside ief
	    (function(){
		var j = i;
		d3.xml(svg_file, "image/svg+xml", function(xml) {
		    var light_obj = xml.documentElement;
		    var outline_path = d3.select(light_obj).select(".outline").attr("d"),
		        outline_style = d3.select(light_obj).select(".outline").attr("style"),
		        outline_fill = d3.select(light_obj).select(".outline").attr("fill"),
		        outline_fillopacity = d3.select(light_obj).select(".outline").attr("fill-opacity"),
		        base = {x: d3.select(light_obj).select(".base").attr("x"),
				y: d3.select(light_obj).select(".base").attr("y"),
				width: d3.select(light_obj).select(".base").attr("width"),
				height: d3.select(light_obj).select(".base").attr("height")},
		        base_style = d3.select(light_obj).select(".base").attr("style"),
		        base_fill = d3.select(light_obj).select(".base").attr("fill"),
		        base_fillopacity = d3.select(light_obj).select(".base").attr("fill-opacity"),
		        bulb_path = d3.select(light_obj).select(".bulb").attr("d"),
		        bulb_style = d3.select(light_obj).select(".bulb").attr("style");
		        bulb_fill = d3.select(light_obj).select(".bulb").attr("fill"),
		        bulb_fillopacity = d3.select(light_obj).select(".bulb").attr("fill-opacity"),
		        ray_path = d3.select(light_obj).select(".ray").attr("d"),
		        ray_style = d3.select(light_obj).select(".ray").attr("style"),
		        ray_fill = d3.select(light_obj).select(".ray").attr("fill"),
		        ray_fillopacity = d3.select(light_obj).select(".ray").attr("fill-opacity"),
		        //in callback, this point to window, so I use self which stores this
		        self.svg_libs.push({light_type:svg_files[j].light_type,
					    outline_path:outline_path,
					    outline_style:outline_style,
					    outline_fill:outline_fill,
					    outline_fillopacity:outline_fillopacity,
					    base:base,
					    base_style:base_style,
					    base_fill:base_fill,
					    base_fillopacity:base_fillopacity,
					    bulb_path:bulb_path,
					    bulb_style:bulb_style,
					    bulb_fill:bulb_fill,
					    bulb_fillopacity:bulb_fillopacity,
					    ray_path:ray_path,
					    ray_style:ray_style,
					    ray_fill:ray_fill,
					    ray_fillopacity:ray_fillopacity
					   });
		})//end d3.xml
	    })(); //end imediately executed function
	}
      },
      getSvgByType: function(light_type){
	var svg;
	for(var i=0;i<this.svg_libs.length;i++){
	  if(this.svg_libs[i].light_type==light_type){
	    return this.svg_libs[i];
	  }
	}
      }
    }
  })
