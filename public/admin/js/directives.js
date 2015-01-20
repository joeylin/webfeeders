angular.module('wf.directives', []).
directive('popup', ['$http', 
    function($http) {
        return {
            restrict: 'AE',
            link: function(scope, element, attrs, ngModel) {
                setTimeout(function() {
                    $(element).magnificPopup({
                        type: 'inline',
                        closeOnBgClick: false,
                        midClick: true
                    });
                }, 300);
            }
        };
    }
]).directive('dropdown', ['$http',
    function($http) {
        return {
            restrict: 'AE',
            scope: {
                open: '&',
                close: '&'
            },
            link: function($scope, element, attrs) {
                if (!$(element).find('.dropdown-toggle')) {
                    return false;
                }
                $(element).on('show.bs.dropdown', function() {
                    if (typeof $scope.open == 'function') {
                        $scope.open();
                    }
                });
                $(element).on('hide.bs.dropdown', function() {
                    if (typeof $scope.close == 'function') {
                        $scope.close();
                    }
                });
            }
        };
    }
]);