angular.module("lightgalaApp")
  .directive("ads",function(){
    return {
        restrict: 'A',
	template: '<div ng-include="contentUrl"></div>',
	link: function(scope, element, attrs) {
	    //scope.contentUrl = 'partials/' + attrs.adname + '.html';
            /*attrs.$observe("adname",function(adname){
		scope.contentUrl = 'partials/' + adname + '.html';
            });*/
	},
        controller: function(){
	    (adsbygoogle = window.adsbygoogle || []).push({});
	}      
    }});
