DoorsAdmin.controller('usersController', ['$scope','$location','$http','$modal','$log' , function ($scope,$location,$http,$modal,$log) {
	var USERS_COLUMNS=3;
	var reloadUsers=function(){
		$http.get('/api/users').success(function(data,status){
			$scope.users=data;
		});
	}
	reloadUsers();
	$scope.addUser=function(){
		var modalInstance = $modal.open({
			templateUrl: 'addUser.html',
			controller: 'addUserCtrl',
			resolve: {
			}
		});

		modalInstance.result.then(function () {
			reloadUsers();
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	}
	$scope.deleteUser=function(user){
		$http.post('/api/users/'+user._id+'/delete',{}).success(function(data,status){
			if(status==200){
				reloadUsers();
			}
		});
	}
	$scope.setUserActive=function(user,value){
		$http.post('/api/users/'+user._id+'/activate',{active:value}).success(function(data,status){
			if(status==200){
				reloadUsers();
			}
		});
	}
	$scope.viewUser=function(user){
		$location.path('/users/'+user._id);
	}
}]);
DoorsAdmin.controller('addUserCtrl',  ['$http', '$scope','$modalInstance', function ($http, $scope, $modalInstance) {
	$scope.ok = function () {
		var formData = new FormData();
		formData.append("profilePic", $("#image")[0].files[0]);
		formData.append("name", $scope.name);
		formData.append("alias", $scope.alias);
		formData.append("password", CryptoJS.SHA256($scope.password).toString().toUpperCase());
		formData.append("email",$scope.mail);
		$http.post('/api/users/newuser', formData, {
			transformRequest: angular.identity,
			headers: { 'Content-Type': undefined }
		}).success(function (data, status) {
			$modalInstance.close();
		}).error(function(data, status){
			alert(data);
		});

	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
}]);
