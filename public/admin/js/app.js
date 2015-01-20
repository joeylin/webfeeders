'use strict';
/*global angular*/
window.wf = true;

// 配置APP 
angular.module('WF', ['ngAnimate', 'wf.tools', 'wf.router', 'wf.filters', 'wf.services', 'wf.locale', 'wf.directives', 'wf.controllers']).
config(['$httpProvider', 'app',
    function($httpProvider, app) {
        // global error handling
        $httpProvider.interceptors.push(function() {
            return {
                response: function(res) {
                    var error, data = res.data;
                    if (data.code === 404) {
                        error = data.info;
                    }
                    if (error) {
                        app.toast.error(error);
                        return app.q.reject(data);
                    } else {
                        return res;
                    }
                },
                responseError: function(res) {
                    var data = res.data || res,
                        status = res.status || '',
                        message = data.info || (angular.isObject(data) ? 'Error!' : data);

                    app.toast.error(message, status);
                    return app.q.reject(data);
                }
            };
        });
    }
]).run(['app', '$q', '$rootScope', '$routeParams', '$location', '$filter', '$locale', 'getFile', 'tools', 'toast',
    'applyFn', 'param',
    function(app, q, $rootScope, $routeParams, $location, $filter, $locale,
        getFile, tools, toast, applyFn, param) {

        var global = $rootScope.global = {
            user: window.WF_USER
        };

        window.wf = app;
        app.toast = toast;
        app.q = q;
        app.param = param;
        app.location = $location;
        app.filter = $filter;
        app.locale = $locale;
        app.getFile = getFile;
        app.rootScope = $rootScope;
        angular.extend(app, tools); 

        app.loading = function(value) {
            $rootScope.loading.show = value;
        };
        $rootScope.loading = {
            show: false
        };
        $rootScope.current = {};
        $rootScope.$on('$routeChangeStart', function(event, next, current) {
            if (next && next.$$route) {
                $rootScope.current.path = next.$$route.originalPath.replace('/admin/','');
            }
        });
    }
]);

// 启动APP
angular.bootstrap(document, ['WF']);