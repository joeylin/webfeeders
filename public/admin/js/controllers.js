'use strict';
/*global angular*/

angular.module('wf.controllers', []).
controller('indexCtrl', ['app', '$scope', '$routeParams', '$http',
    function(app, $scope, $routeParams, $http) {
               
    }
]).controller('uncheckedCtrl', ['app', '$scope', '$routeParams', '$location', '$http',
    function(app, $scope, $routeParams, $location, $http) {
        $scope.content = [];
        var url = '/api/admin/unchecked';
        $scope.pager = {
            total: 1,
            current: 1
        };
        var params = {
            page: 1
        };
        $scope.next = function() {
            if ($scope.pager.current >= $scope.pager.total) {
                return false;
            }
            $scope.pager.current += 1;
            params.page = $scope.pager.current;
            $http.get(url, {
                params: params,
            }).success(function(data) {
                $scope.content = data.content;
                $scope.pager.total = data.total;
            });
            return false;
        };
        $scope.prev = function() {
            if ($scope.pager.current <= 1) {
                return false;
            }
            $scope.pager.current -= 1;
            params.page = $scope.pager.current;
            $http.get(url, {
                params: params,
            }).success(function(data) {
                $scope.content = data.content;
                $scope.pager.total = data.total;
            });
            return false;
        };
        $scope.check = function(topic, check) {
            var data = {
                topic_id: topic._id,
                checked: check
            };
            $http.post('/api/admin/check', data).success(function(data) {
                var index = $scope.content.indexOf(topic);
                $scope.content.splice(index, 1);
            });
        };
        $http.get(url, {
            params: params,
        }).success(function(data) {
            $scope.content = data.content;
            $scope.pager.total = data.total;
        });
        
    }
]).controller('topicsCtrl', ['app', 'swalert', '$scope', '$routeParams', '$http', '$rootScope',
    function(app, swalert, $scope, $routeParams, $http, $rootScope) {
        $scope.content = [];
        var url = '/api/admin/topics';
        $scope.pager = {
            total: 1,
            current: 1
        };
        var params = {
            page: 1
        };
        $scope.next = function() {
            if ($scope.pager.current >= $scope.pager.total) {
                return false;
            }
            $scope.pager.current += 1;
            params.page = $scope.pager.current;
            $http.get(url, {
                params: params,
            }).success(function(data) {
                $scope.content = data.content;
                $scope.pager.total = data.total;
            });
            return false;
        };
        $scope.prev = function() {
            if ($scope.pager.current <= 1) {
                return false;
            }
            $scope.pager.current -= 1;
            params.page = $scope.pager.current;
            $http.get(url, {
                params: params,
            }).success(function(data) {
                $scope.content = data.content;
                $scope.pager.total = data.total;
            });
            return false;
        };
        $scope.del = function(topic) {
            var data = {
                topic_id: topic._id
            };
            swalert(function() {
                $http.post('/api/admin/topic/del', data).success(function(data) {
                    var index = $scope.content.indexOf(topic);
                    $scope.content.splice(index, 1);
                });
            });
        };
        $http.get(url, {
            params: params,
        }).success(function(data) {
            $scope.content = data.content;
            $scope.pager.total = data.total;
        });
    }
]).controller('usersCtrl', ['app', '$scope', '$routeParams', '$http', '$rootScope',
    function(app, $scope, $routeParams, $http, $rootScope) {
        $scope.content = [];
        var url = '/api/admin/users';
        $scope.pager = {
            total: 1,
            current: 1
        };
        var params = {
            page: 1
        };
        $scope.next = function() {
            if ($scope.pager.current >= $scope.pager.total) {
                return false;
            }
            $scope.pager.current += 1;
            params.page = $scope.pager.current;
            $http.get(url, {
                params: params,
            }).success(function(data) {
                $scope.content = data.content;
                $scope.pager.total = data.total;
            });
        };
        $scope.prev = function() {
            if ($scope.pager.current <= 1) {
                return false;
            }
            $scope.pager.current -= 1;
            params.page = $scope.pager.current;
            $http.get(url, {
                params: params,
            }).success(function(data) {
                $scope.content = data.content;
                $scope.pager.total = data.total;
            });
        };
        $scope.setAdmin = function(user, admin) {
            var url = '/api/admin/setAdmin'
            $http.post(url, {
                admin: admin,
                user_id: user._id
            }, function(data) {
                if (data.code === 200) {
                    user.isAdmin = !!admin;
                } else {

                }
            });
        };
        $http.get(url, {
            params: params,
        }).success(function(data) {
            $scope.content = data.content;
            $scope.pager.total = data.total;
        });
    }
]);