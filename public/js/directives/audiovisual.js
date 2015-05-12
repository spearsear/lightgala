angular.module("lightgalaApp")
  .directive("audiovisual",function(){
    //this directive generate audio visualization above the progressbar and under the decor svg
    return {
      restrict: 'EA',
      templateUrl: "../../partials/audiovisual.html",
      link: function(scope,ele,attrs){
	  
      } //end link function
    } //end return directive object
  })
