DoorsAdmin.controller('adminsController', ['$scope','$location','$http','$modal','$log' , function ($scope,$location,$http,$modal,$log) {

    var reloadAdmins=function(){
        $http.get('/api/admins').success(function(data,status){
            $scope.admins=data;
        });
    };
    reloadAdmins();
    
    $scope.addAdmin=function(){
        var modalInstance = $modal.open({
            templateUrl: 'addAdmin.html',
            controller: 'addAdminCtrl',
            resolve: {
            }
        });

        modalInstance.result.then(function () {
            reloadAdmins();
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };
    
    $scope.deleteAdmin=function(admin){
        $http.post('/api/admins/'+admin._id+'/delete',{}).success(function(data,status){
            if(status==200){
                reloadAdmins();
            }
        });
    };
    
}]);
DoorsAdmin.controller('addAdminCtrl',  ['$http', '$scope','$modalInstance', function ($http, $scope, $modalInstance) {
    $scope.ok = function () {
        if($scope.addAdminForm.$valid){
            $http.post("/api/admins/newadmin",{
                alias:$scope.newAdmin.alias,
                name : $scope.newAdmin.name,
                password : CryptoJS.SHA256($scope.newAdmin.password).toString().toUpperCase()
            }).success(function(data,status){
                $modalInstance.close();
            }).error(function(data){
                console.log(data);
            })
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
