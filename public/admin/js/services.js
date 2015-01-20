angular.module('wf.services', ['ngResource', 'ngCookies']).
factory('applyFn', ['$rootScope',
    function($rootScope) {
        return function(fn, scope) {
            fn = angular.isFunction(fn) ? fn : angular.noop;
            scope = scope && scope.$apply ? scope : $rootScope;
            fn();
            if (!scope.$$phase) {
                scope.$apply();
            }
        };
    }
]).factory('toast', ['$log', 'tools',
    function($log, tools) {
        var toast = {},
            methods = ['info', 'error', 'success', 'warning'];
        angular.forEach(methods, function(x) {
            toast[x] = function(message, title) {
                var log = $log[x] || $log.log;
                title = tools.toStr(title);
                log(message, title);
                message = angular.isObject(message) ? angular.toJson(message) : tools.toStr(message);
                toastr[x](message, title);
            };
        });
        toastr.options = angular.extend({
            positionClass: 'toast-bottom-full-width'
        }, toast.options);
        toast.clear = toastr.clear;
        return toast;
    }
]).factory('swalert', ['$log', 'tools',
    function($log, tools) {      
        return function(cb) {
            swal({
                title: '确定要删除此内容吗？',
                text: '删除后将无法恢复',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: '确定删除',
                cancelButtonText: '取消'
            }, function() {
                if (typeof cb === 'function') {
                    cb();
                }
            });
        };
    }
]).factory('param', function() {
    return $.param;
});