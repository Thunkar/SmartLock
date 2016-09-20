DoorsAdmin.controller('tokensController', ['$scope','$location','$http','$modal','$log' , function ($scope,$location,$http,$modal,$log) {
	
	var reloadTokens = function(){
		$http.get("/api/tokens").success(function(tokens){
			$scope.tokens = tokens;
		});
	};
	reloadTokens();

	$scope.getToString=function(token){
		var date=moment(new Date(token.validity.to));
		return token.validity.repeat.length>0? date.format('h:mm:ss a') : date.format('MMMM Do YYYY, h:mm:ss a');
	};

	$scope.getFromString=function(token){
		var date=moment(new Date(token.validity.from));
		return token.validity.repeat.length>0? date.format('h:mm:ss a') : date.format('MMMM Do YYYY, h:mm:ss a');
	};
	$scope.getDayString=function(integer){
		switch(parseInt(integer)){
			case 1:
			return "Monday"
			case 2:
			return "Tuesday"
			case 3:
			return "Wednesday"
			case 4:
			return "Thursday"
			case 5:
			return "Friday"
			case 6:
			return "Saturday"
			case 0:
			return "Sunday"
		}
	};

	$scope.newToken = function(){
		var modalInstance = $modal.open({
			templateUrl: 'addTokenPattern.html',
			controller: 'addTokenPatternController',
			windowClass: 'token-modal-window',
			resolve: {
			}
		});

		modalInstance.result.then(function () {
			reloadTokens();
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	};

	$scope.editToken = function(token){
		$http.get("/api/tokens/"+token._id).success(function(completeToken,status){
			var modalInstance = $modal.open({
			templateUrl: 'tokenAssignation.html',
			controller: 'tokenAssignationController',
			windowClass: 'token-modal-window',
			resolve: {
				token:function(){return completeToken;}
			}
		});

		modalInstance.result.then(function () {
			reloadTokens();
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
		});
	}

	$scope.deleteToken = function(token){
		$http.post("/api/tokens/"+token._id+"/delete",{}).success(function(data){
			reloadTokens();
		});
	};

	$scope.assignToken = function(token){
		var modalInstance = $modal.open({
			templateUrl: 'tokenAssignation.html',
			controller: 'tokenAssignationController',
			windowClass: 'token-modal-window',
			resolve: {
				token:function(){return token;}
			}
		});

		modalInstance.result.then(function () {
			reloadTokens();
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	};

}]);

DoorsAdmin.controller('addTokenPatternController', ['$scope','$location','$http','$modal','$modalInstance','$log' , function ($scope,$location,$http,$modal,$modalInstance,$log) {
	$scope.newToken = {};

	$http.get('/api/users').success(function(data,status){
		$scope.users=data;
		$scope.selectedUsers = [];
	});

	$scope.ok = function(){
		var doors=[];
		for(var i=0;i<$scope.newToken.addedDoors.length;i++){
			doors.push($scope.newToken.addedDoors[i].name);
		}
		var days=[];
		for(var i=0;i<$scope.newToken.days.length;i++){
			if($scope.newToken.days[i])
				days.push(i);
		}
		var from={};
		var to={};
		var uses=$scope.newToken.unlimitedUses? -1:$scope.newToken.uses;

		if($scope.newToken.daily){
			from=$scope.newToken.dates.startDailyTime;
			to=$scope.newToken.dates.endDailyTime;
		}else{
			from=$scope.newToken.startDateTime;
			to=$scope.newToken.endDateTime;
			days=[];
		}
		var token={
			name:$scope.newToken.name,
			doors:doors,
			validity:{
				from: from,
				to: to,
				repeat:days,
				uses:uses
			},
			default:$scope.newToken.default
		}
		var ids = [];
		for (var i = $scope.users.length - 1; i >= 0; i--) {
			if($scope.selectedUsers[i]){
				ids.push($scope.users[i]._id);
			}
		}
		$http.post("/api/tokens",token).success(function(tokenId,status){
			$http.post("/api/tokens/"+tokenId+"/bulkinsert",{users:ids}).success(function(data,status){
				$modalInstance.close();
			});
		});
	};

	$scope.cancel = function(){
		$modalInstance.dismiss('cancel');
	};

}]);

DoorsAdmin.controller('tokenAssignationController', ['$scope','$location','$http','$modal','$modalInstance','$log' ,'token', function ($scope,$location,$http,$modal,$modalInstance,$log,token) {

	var originalUsers = [];
	if(!token.users){
		token.users = [];
	}

	$http.get('/api/users').success(function(data,status){
		$scope.users=data;
		$scope.selectedUsers = [];
		for (var i = data.length - 1; i >= 0; i--) {
			var user = data[i];
			if(token.users.findBy(user,"_id")!==-1){
				$scope.selectedUsers[i] = true;
			}
		}
		angular.extend(originalUsers,$scope.selectedUsers);
	});

	$scope.ok = function(){
		var toAssign = [];
		var toRemove = [];
		for (var i = $scope.users.length - 1; i >= 0; i--) {
			if(originalUsers[i]&&!$scope.selectedUsers[i]){
				toRemove.push($scope.users[i]._id);
			}
			if(!originalUsers[i]&&$scope.selectedUsers[i]){
				toAssign.push($scope.users[i]._id);
			}
		}
		$http.post("/api/tokens/"+token._id+"/bulkinsert",{users:toAssign}).success(function(data,status){
			$http.post("/api/tokens/"+token._id+"/bulkdelete",{users:toRemove}).success(function(data,status){
				$modalInstance.close();
			});
		});
	}

	$scope.cancel = function(){
		$modalInstance.dismiss('cancel');
	};

}]);



