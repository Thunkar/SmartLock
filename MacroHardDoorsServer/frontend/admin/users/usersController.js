DoorsAdmin.controller('usersController', function ($scope,$location,$http,$modal,$log) {
	var USERS_COLUMNS=3;
	var reloadUsers=function(){
		$http.get('/api/users').success(function(data,status){
			$scope.usersRows=[];
			var length=data.length;
			for(var i=0;i<length/USERS_COLUMNS;i++){
				$scope.usersRows[i]=[];
				for(var j=0;(j<USERS_COLUMNS)&&(i*USERS_COLUMNS+j)<length;j++){
					$scope.usersRows[i][j]=data[i*USERS_COLUMNS+j];
				}
			}
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
	$scope.deleteUser=function(parent,index){
		var user=$scope.usersRows[parent][index];
		$http.post('/api/users/'+user.alias+'/delete',{}).success(function(data,status){
			if(status==200){
				reloadUsers();
			}
		});
	}
		$scope.viewUser=function(parent,index){
		var user=$scope.usersRows[parent][index];
		$location.path('/users/'+user.alias);
	}
});
DoorsAdmin.controller('addUserCtrl', function ($http, $scope, $modalInstance) {
	$scope.ok = function () {
		var formData = new FormData();
		formData.append("profilePic", $("#image")[0].files[0]);
		formData.append("name", $scope.name);
		formData.append("alias", $scope.alias);
		formData.append("password", $scope.password);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', window.location.origin + '/api/users/newuser');
		xhr.onload = function () {
			if (xhr.status === 200) {
				$modalInstance.close();
				$scope.$apply();
			} else {
				console.log('Something went terribly wrong...');
			}

		};
		xhr.send(formData);

	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});