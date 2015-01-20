'use strict';
/*global angular, jsGenVersion*/

angular.module('wf.router', ['ngRoute']).
constant('app', {
    version: Date.now()
}).provider('getFile', ['app',
    function(app) {
        this.html = function(fileName) {
            return '/public/admin/tpl/' + fileName + '?v=' + app.version;
        };
        this.$get = function() {
            return {
                html: this.html
            };
        };
    }
]).config(['$routeProvider', '$locationProvider', 'getFileProvider',
    function($routeProvider, $locationProvider, getFileProvider) {
        var index = {
            templateUrl: getFileProvider.html('index.html'),
            controller: 'indexCtrl'
        },
        users = {
            templateUrl: getFileProvider.html('users.html'),
            controller: 'usersCtrl'
        },
        topics = {
            templateUrl: getFileProvider.html('topics.html'),
            controller: 'topicsCtrl'
        },
        unchecked = {
            templateUrl: getFileProvider.html('unchecked.html'),
            controller: 'uncheckedCtrl'
        };        
        $routeProvider.
        when('/admin/users', users).
        when('/admin/topics', topics).
        when('/admin/unchecked', unchecked).
        when('/admin/', index).
        otherwise({
            redirectTo: '/admin/'
        });
        $locationProvider.html5Mode(true).hashPrefix('!');
    }
]);