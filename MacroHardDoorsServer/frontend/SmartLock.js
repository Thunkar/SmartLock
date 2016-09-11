/**
 * Created by assistant on 7/6/16.
 */

Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};


var SmartLock = angular.module('SmartLock', ['ngAnimate', 'ngRoute','ui.bootstrap']);

SmartLock.run(['$rootScope','$http', function($rootScope,$http) {

    $rootScope.checkAuth = function(){
        var savedUser = localStorage.getObject("user", null);
        if(savedUser){
            $http.get("/api/mobile/info/"+savedUser._id).success(function(data){
                $rootScope.appUser = data;
            }).error(function(data,status){
                $rootScope.appUser = null;
                $rootScope.logout();
            });
        }else{
            $rootScope.appUser = null;
        }
    };

    $rootScope.logout = function(){
        localStorage.setObject("user",null);
        $rootScope.checkAuth();
    };

    $rootScope.checkAuth();

}]);

SmartLock.controller('LoginController', [ '$scope','$location','$http' ,'$modal','$log','$routeParams', function ($scope,$location,$http,$modal,$log,$routeParams) {
    $scope.login = function(){
        $http.post("/api/mobile/userlogin",{alias:$scope.alias,password: CryptoJS.SHA256($scope.password).toString().toUpperCase()}).success(function(data){
            localStorage.setObject("user",data);
            $scope.checkAuth();
        }).error(function(data,status){
            alert(data);
        });
    };


}]);

SmartLock.controller('DoorsController', [ '$scope','$location','$http' ,'$modal','$log','$routeParams', function ($scope,$location,$http,$modal,$log,$routeParams) {
    var reloadUser = function(){
        $http.get("/api/mobile/info/"+$scope.appUser._id).success(function(data){
            console.log(data);
            $scope.appUser = data;
        });
    };

    $scope.isValid = function(token){
        if (token.validity.uses == 0) return false;
        if (token.validity.repeat.length == 0 && moment(token.validity.from).isAfter(moment())) return false;
        if (token.validity.repeat.length == 0 && moment(token.validity.to).isBefore(moment())) return false;
        if (token.validity.repeat.length != 0) {
            if (token.validity.repeat.indexOf(moment().day()) == -1) return false;
            if (moment(token.validity.from).isAfter(moment(), 'second')) return false;
            if (moment(token.validity.to).isBefore(moment(), 'second')) return false;
        }
        return true;
    };

    $scope.openDoor= function(token,door){
        $http.post("/api/mobile/open",{user: $scope.appUser._id,door:door,token:token._id}).success(function(data,status){
            reloadUser();
            alert("Opened");
        }).error(function(data,status){
            alert(data);
        });
    };
    reloadUser();
}]);
