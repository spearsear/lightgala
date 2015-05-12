angular.module("lightgalaApp")
  .directive("playtools",function(){
    //this directive generate control tools under the decor svg for controlling play of the lighting
    return {
      restrict: 'EA',
      templateUrl: "../../partials/playtools.html",
      link: function(scope,ele,attrs){
	  scope.show_tool_options = false;
	  scope.toggleToolOptions = function(toolname){
	      var i = _.findIndex(scope.data.tools,function(tool){
		  return tool.name == toolname;
	      })
	      if(i>=0){
		  if(scope.data.tools[i].options.length>0){
		      scope.data.tools[i].show_options = !scope.data.tools[i].show_options;
		  }
	      }
	  }
      } //end link function
    } //end return directive object
  })
