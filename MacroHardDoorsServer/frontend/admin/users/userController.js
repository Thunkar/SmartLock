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
	$scope.uses=0;
	$scope.dates={}
	$scope.dates.startDate=new Date();
	$scope.dates.startTime=new Date();
	$scope.dates.endDate=new Date();
	$scope.dates.endTime=new Date();
	$scope.dates.startDailyTime=new Date();
	$scope.dates.endDailyTime=new Date();
	$scope.days=[];
	$scope.addedDoors=[];

	$scope.incrementUses=function(){
		$scope.uses++;
	}

$scope.decrementUses=function(){
	if($scope.uses>0)
		$scope.uses--;
	}

	var updateDates=function(){
		var startDate=$scope.dates.startDate;
		var startTime=$scope.dates.startTime;
		if(startDate&&startTime)
		$scope.startDateTime=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate(),startTime.getHours(),startTime.getMinutes(),startTime.getSeconds(),startTime.getMilliseconds());
		var endDate=$scope.dates.endDate;
		var endTime=$scope.dates.endTime;
		if(endDate&&endTime)
		$scope.endDateTime=new Date(endDate.getFullYear(),endDate.getMonth(),endDate.getDate(),endTime.getHours(),endTime.getMinutes(),endTime.getSeconds(),endTime.getMilliseconds());
		
	}
	$scope.updateDates=updateDates;
	updateDates();
	$scope.$watch('dates.startDate', function(newVal, oldVal){
		updateDates();
	});
	$scope.$watch('dates.startTime', function(newVal, oldVal){
		updateDates();
	});
	$scope.$watch('dates.endDate', function(newVal, oldVal){
		updateDates();
	});
	$scope.$watch('dates.endDate', function(newVal, oldVal){
		updateDates();
	});
	$scope.$watch('doorToAdd',function(newVal,oldVal){
		if($scope.doorToAdd!==undefined){
		$scope.addedDoors.push($scope.doorToAdd);
		$scope.doorToAdd=undefined;
	}
	});

	$scope.doorFormatter=function(query){
		return {
			door:query
		}
	}

	$scope.prettyDate=function(date){
		return moment(date).format('MMMM Do YYYY, h:mm:ss a')
	}

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