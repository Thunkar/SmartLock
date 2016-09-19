Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

var DoorsAdmin = angular.module('DoorsAdmin', ['ngRoute', 'ui.bootstrap', 'ui.bootstrap.datetimepicker', "angucomplete-alt"]);

DoorsAdmin.run(['$rootScope', '$http', function ($rootScope, $http) {
    var socketConnected = false;
    var path = window.location.pathname + '/socket.io';
    var socket = io('/events', {path: path.replace('/admin/', '')});

    socket.on('connect', function () {
        socketConnected = true;
        console.log('Client has connected to the server!');
    });
    // Add a connect listener
    socket.on('event', function (data) {
        console.log('Received a message from the server!', data);
        if (data.type === 'nodeHandshake' || data.type === 'nodeOffline' || data.type === 'nodeActivated' || data.type === 'nodeDeactivated')
            $rootScope.$broadcast('doorEvent', data);
        $rootScope.$broadcast('event', data);
    });
    // Add a disconnect listener
    socket.on('disconnect', function () {
        socketConnected = false;
        console.log('The client has disconnected!');
    });

    $rootScope.checkAuth = function () {
        var savedUser = localStorage.getObject("admin", null);
        if (savedUser) {
            $http.get("/api/admins/" + savedUser._id).success(function (data) {
                if (!socketConnected) {
                    socket.connect();
                }
                $rootScope.appUser = data;
            }).error(function (data, status) {
                $rootScope.appUser = null;
                $rootScope.logout();
            });
        } else {
            $rootScope.appUser = null;
        }
    };

    $rootScope.logout = function () {
        localStorage.setObject("admin", null);
        $rootScope.checkAuth();
    };

    $rootScope.checkAuth();

}]);

Array.prototype.filterBy = function (attr, validation) {
    var findings = [];
    for (var i = 0; i < this.length; i++) {
        if (validation(this[i][attr]))
            findings.push(this[i]);
    }
    return findings;
};

Array.prototype.findBy = function (item, attr) {
    if (attr === undefined)
        return this.indexOf(item);
    for (var i = 0; i < this.length; i++) {
        if (this[i][attr] === item[attr])
            return i;
    }
    return -1;
};

DoorsAdmin.config(function ($routeProvider, $locationProvider) {
    $routeProvider.when("/stats", {
        controller: "statsController",
        templateUrl: "stats/stats.html"
    }).when("/doors", {
        controller: "doorsController",
        templateUrl: "doors/doors.html"
    }).when("/users", {
        controller: "usersController",
        templateUrl: "users/users.html"
    }).when("/users/:userId", {
        controller: "userController",
        templateUrl: "users/user.html"
    }).when("/admins", {
        controller: "adminsController",
        templateUrl: "admins/admins.html"
    }).when("/tokens", {
        controller: "tokensController",
        templateUrl: "tokens/tokens.html"
    }).otherwise({redirectTo: '/stats'});
});

DoorsAdmin.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.timeout = 5000;
}]);

DoorsAdmin.controller('LoginController', ['$scope', '$location', '$http', '$modal', '$log', '$routeParams', function ($scope, $location, $http, $modal, $log, $routeParams) {

    $scope.login = function () {
        if ($scope.loginForm.$valid) {
            $http.post("/api/admins/adminlogin", {
                alias: $scope.alias,
                password: CryptoJS.SHA256($scope.password).toString().toUpperCase()
            }).success(function (data) {
                localStorage.setObject("admin", data);
                $scope.checkAuth();
            }).error(function (data, status) {
                alert(data);
            });
        }
    };

}]);

DoorsAdmin.filter('pages', function() {
  return function(input, currentPage, pageSize) {
    //check if there is an array to work with so you don't get an error on the first digest
    if(angular.isArray(input)) {
        if(currentPage===undefined||currentPage===null){
            currentPage = 1;
        }
      //arrays are 0-base, so subtract 1 from the currentPage value to calculate the slice start
      var start = (currentPage-1)*pageSize;
      //slice extracts up to, but not including, the element indexed at the end parameter,
      //so just multiply the currentPage by the pageSize to get the end parameter
      var end = currentPage*pageSize;
      return input.slice(start, end);
    }
  };
});


DoorsAdmin.factory('apiRelative', function ($q) {
    return {
        request: function (config) {
            if (config.url.startsWith('/api'))
                config.url = ".." + config.url;
            return config;
        }
    }
}).config(function ($httpProvider) {
    $httpProvider.interceptors.push('apiRelative');
});

DoorsAdmin.directive('userSelector',function(){
    return {
        templateUrl : 'userSelector.html',
        scope:{
            users:'=',
            selectedUsers:'='
        },
        link : function(scope, element, attr) {
            scope.itemsPerPage = 20;
            scope.$watch('selectAll',function(newVal,oldVal){
                if(newVal!=oldVal){
                    if(newVal){
                        for (var i = scope.users.length - 1; i >= 0; i--) {
                            scope.selectedUsers[i] = true;
                        }
                    }else{
                        for (var i = scope.users.length - 1; i >= 0; i--) {
                            scope.selectedUsers[i] = false;
                        }
                    }
                }
            });
        }
    }
});