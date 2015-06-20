DoorsAdmin.controller('userController', function ($scope,$location,$http,$modal,$log,$routeParams) {
	var alias=$routeParams.userAlias;

	var reloadUser=function(){
	$http.get('/api/users/'+alias).success(function(data,status){
		if(status==200){
			$scope.user=data;
		}
	});}

	reloadUser();

	$scope.saveProfile=function(){
		var formData = new FormData();
		if($("#image")[0].files.length>0)
		formData.append("profilePic", $("#image")[0].files[0]);
		if($scope.editedUser.name!==undefined)
		formData.append("name", $scope.editedUser.name);
		if($scope.editedUser.password!==undefined)
		formData.append("password", $scope.editedUser.password);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', window.location.origin + '/api/users/'+alias);
		xhr.onload = function () {
			if (xhr.status === 200) {
				$scope.editedUser=undefined;
				reloadUser();
				$scope.$apply();
			} else {
				console.log('Something went terribly wrong...');
			}

		};
		xhr.send(formData);
	}

	$scope.addToken=function(){
		var modalInstance = $modal.open({
			templateUrl: 'addToken.html',
			controller: 'addTokenCtrl',
			windowClass: 'token-modal-window',
			resolve: {
			}
		});

		modalInstance.result.then(function () {
			reloadUser();
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	}


});
DoorsAdmin.controller('addTokenCtrl', function ($http, $scope, $modalInstance) {
	$scope.ok = function () {
		

	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	 $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };
});