angular.module("lightgalaApp")
  .directive("links",function(){
    return {
      restrict: 'EA',
      //templateUrl: "links.html",
      templateUrl: "../../partials/links.html",
      link: function(scope,ele,attrs){
      
      } //end link function
    } //end return directive object
  })
