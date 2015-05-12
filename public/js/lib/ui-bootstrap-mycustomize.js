//enhance ui.bootstrap to fix conflict with ngAnimate
angular.module("ui.bootstrap.tpls")
.directive('disableNgAnimate',
    ['$animate', function ($animate) {
        return {
            link: function ($scope, $element, $attrs) {

                $scope.$watch(
                    function() {
                        return $scope.$eval($attrs.setNgAnimate, $scope);
                    },
                    function(newVal) {
                        $animate.enabled(!!newVal, $element);
                    }
                );
            }
        };
    }]
);
