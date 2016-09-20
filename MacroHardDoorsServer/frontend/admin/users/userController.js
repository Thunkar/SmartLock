DoorsAdmin.controller('userController', [ '$scope','$location','$http' ,'$modal','$log','$routeParams', function ($scope,$location,$http,$modal,$log,$routeParams) {
	var userId=$routeParams.userId;
	var TOKENS_COLUMNS = 4;
	$scope.editedUser={};
	$scope.$watch('user',function(){
		$scope.editedUser=$.extend(true,{},$scope.user);
	});

	var reloadUser=function(){
		$http.get('/api/users/'+userId).success(function(data,status){
			if(status==200){
				$scope.user=data;
				$scope.tokensRows=[];
				var tokens=data.tokens;
			var length=tokens.length;
			for(var i=0;i<length/TOKENS_COLUMNS;i++){
				$scope.tokensRows[i]=[];
				for(var j=0;(j<TOKENS_COLUMNS)&&(i*TOKENS_COLUMNS+j)<length;j++){
					$scope.tokensRows[i][j]=tokens[i*TOKENS_COLUMNS+j];
				}
			}
			}
		});
	}

	reloadUser();

	$scope.saveProfile=function(){
		var formData = new FormData();
		if($("#image")[0].files.length>0)
			formData.append("profilePic", $("#image")[0].files[0]);
		if($scope.editedUser.name!==undefined)
			formData.append("name", $scope.editedUser.name);
		if($scope.editedUser.password!==undefined)
			formData.append("password", CryptoJS.SHA256($scope.editedUser.password).toString().toUpperCase());
		if($scope.editedUser.email!==undefined)
			formData.append("email",$scope.editedUser.email);
		if($scope.editedUser.active!==undefined)
			formData.append("active",$scope.editedUser.active);

		$http.post('/api/users/'+userId, formData, {
				transformRequest: angular.identity,
				headers: { 'Content-Type': undefined }
			}).success(function (data, status) {
			$scope.editedUser={};
			reloadUser();
		}).error(function(data, status){
			alert(data);
		});
	};

	$scope.addToken=function(){
		var modalInstance = $modal.open({
			templateUrl: 'addToken.html',
			controller: 'addTokenCtrl',
			windowClass: 'token-modal-window',
			resolve: {
				user:function(){
					return userId;
				}
			}
		});

		modalInstance.result.then(function () {
			reloadUser();
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});
	}

	$scope.getToString=function(token){
		var date=moment(new Date(token.validity.to));
		return token.validity.repeat.length>0? date.format('h:mm:ss a') : date.format('MMMM Do YYYY, h:mm:ss a');
	}

	$scope.getFromString=function(token){
		var date=moment(new Date(token.validity.from));
		return token.validity.repeat.length>0? date.format('h:mm:ss a') : date.format('MMMM Do YYYY, h:mm:ss a');
	}
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
	}

	$scope.deleteToken=function(parent,index){
		var token=$scope.user.tokens[parent*TOKENS_COLUMNS+index];
		$http.post('/api/users/'+userId+'/tokens/revoke',{token:token._id}).success(function(data,status){
			reloadUser();
		})
	}

}]);
DoorsAdmin.controller('addTokenCtrl', ['$http', '$scope','$modalInstance','user' , function ($http, $scope, $modalInstance,user) {
    $scope.newToken = {};

	$scope.ok = function () {
		if(($scope.newToken.startDateTime&&$scope.newToken.endDateTime)||($scope.newToken.dates.startDailyTime&&$scope.newToken.dates.endDailyTime)){
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
				user:user,
				doors:doors,
				validity:{
					from: from,
					to: to,
					repeat:days,
					uses:uses
				}
			}
			$http.post('/api/users/'+user+'/tokens',token).success(function(data,status){
				$modalInstance.close();
			});
		}else{
			alert("Form is not valid");
		}
	};

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
	$scope.open = function($event) {
		$event.preventDefault();
		$event.stopPropagation();

		$scope.opened = true;
	};
}]);
