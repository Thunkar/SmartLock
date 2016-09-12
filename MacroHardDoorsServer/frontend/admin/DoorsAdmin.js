Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

var DoorsAdmin = angular.module('DoorsAdmin', ['ngAnimate', 'ngRoute', 'ui.bootstrap', 'ui.bootstrap.datetimepicker', "angucomplete-alt"]);

DoorsAdmin.run(['$rootScope', '$http', function ($rootScope, $http) {
    var socketConnected = false;
    var path = window.location.host+window.location.pathname;
    var socket = io(path.replace("/admin/","/events"));

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
                if (!socketConnected)
                    socket.connect();
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
}
Array.prototype.findBy = function (item, attr) {
    if (attr === undefined)
        return this.indexOf(item);
    for (var i = 0; i < this.length; i++) {
        if (this[i][attr] === item[attr])
            return i;
    }
    return -1;
}
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
    }).otherwise({redirectTo: '/stats'});
});
DoorsAdmin.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.timeout = 5000;
}]);

DoorsAdmin.controller('LoginController', ['$scope', '$location', '$http', '$modal', '$log', '$routeParams', function ($scope, $location, $http, $modal, $log, $routeParams) {
    $scope.login = function () {
        $http.post("/api/admins/adminlogin", {
            alias: $scope.alias,
            password: CryptoJS.SHA256($scope.password).toString().toUpperCase()
        }).success(function (data) {
            localStorage.setObject("admin", data);
            $scope.checkAuth();
        }).error(function (data, status) {
            alert(data);
        });
    };


}]);



DoorsAdmin.factory('apiRelative', function($q) {
  return {
    request: function(config) {
        if(config.url.startsWith('/api'))
            config.url =  ".."+config.url ;
        return config ;
    }
  }
}).config(function($httpProvider) {
  $httpProvider.interceptors.push('apiRelative');
})

/*
 DoorsAdmin.controller('sidebarController', function ($scope,$location) {
 var url =   $location.path();
 var element = $('ul.nav a').filter(function() {
 return this.href == url || url.href.indexOf(this.href) == 0;
 }).addClass('active').parent().parent().addClass('in').parent();
 if (element.is('li')) {
 element.addClass('active');
 }
 });
 });*/