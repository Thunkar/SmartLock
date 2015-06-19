var DoorsAdmin = angular.module('DoorsAdmin', ['ngAnimate', 'ngRoute']);

DoorsAdmin.config(function ($routeProvider, $locationProvider) {
    $routeProvider.when("/", {
        controller: "statsController",
        templateUrl: "stats/stats.html"
    }).when("/doors", {
        controller: "doorsController",
        templateUrl: "doors/doors.html"
    });
});