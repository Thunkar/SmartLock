var DoorsAdmin = angular.module('DoorsAdmin', ['ngAnimate', 'ngRoute','ui.bootstrap','ui.bootstrap.datetimepicker',"angucomplete-alt"]);

DoorsAdmin.run(['$rootScope', function($rootScope) {
    var socket = io('/events');

    socket.connect();

    socket.on('connect',function() {
        console.log('Client has connected to the server!');
    });
    // Add a connect listener
    socket.on('event',function(data) {
        console.log('Received a message from the server!',data);
        if(data.type==='nodeHandshake'||data.type==='nodeOffline'||data.type==='nodeActivated'||data.type==='nodeDeactivated')
            $rootScope.$broadcast('doorEvent', data);
        $rootScope.$broadcast('event', data);
    });
    // Add a disconnect listener
    socket.on('disconnect',function() {
        console.log('The client has disconnected!');
    });

}]);

Array.prototype.filterBy=function(attr,validation){
    var findings=[];
    for(var i=0;i<this.length;i++){
        if(validation(this[i][attr]))
            findings.push(this[i]);
    }
    return findings;
}
Array.prototype.findBy=function(item,attr){
    if(attr===undefined)
        return this.indexOf(item);
    for(var i=0;i<this.length;i++){
        if(this[i][attr]===item[attr])
            return i;
    }
    return -1;
}
DoorsAdmin.config(function ($routeProvider, $locationProvider) {
    $routeProvider.when("/stats", {
        controller:"statsController",
        templateUrl: "stats/stats.html"
    }).when("/doors", {
        controller: "doorsController",
        templateUrl: "doors/doors.html"
    }).when("/users",{
    	controller: "usersController",
    	templateUrl: "users/users.html"
    }).when("/users/:userId", {
        controller: "userController",
        templateUrl: "users/user.html"
    }).otherwise({redirectTo: '/stats'});
});
DoorsAdmin.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.timeout = 5000;
}]);
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