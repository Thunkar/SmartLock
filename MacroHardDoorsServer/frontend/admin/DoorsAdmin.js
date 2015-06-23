var DoorsAdmin = angular.module('DoorsAdmin', ['ngAnimate', 'ngRoute','ui.bootstrap','ui.bootstrap.datetimepicker',"angucomplete-alt"]);
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
        templateUrl: "stats/stats.html"
    }).when("/doors", {
        controller: "doorsController",
        templateUrl: "doors/doors.html"
    }).when("/users",{
    	controller: "usersController",
    	templateUrl: "users/users.html"
    }).when("/users/:userAlias", {
        controller: "userController",
        templateUrl: "users/user.html"
    }).otherwise({redirectTo: '/stats'});
});
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