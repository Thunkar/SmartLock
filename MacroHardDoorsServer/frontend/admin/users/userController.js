DoorsAdmin.controller('userController', function ($scope,$location,$http,$modal,$log,$routeParams) {
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
		var xhr = new XMLHttpRequest();
		xhr.open('POST', window.location.origin + '/api/users/'+userId);
		xhr.onload = function () {
			if (xhr.status === 200) {
				$scope.editedUser={};
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
			case 0:
			return "Monday"
			case 1:
			return "Tuesday"
			case 2:
			return "Wednesday"
			case 3:
			return "Thursday"
			case 4:
			return "Friday"
			case 5:
			return "Saturday"
			case 6:
			return "Sunday"
		}
	}

	$scope.deleteToken=function(parent,index){
		var token=$scope.user.tokens[parent*TOKENS_COLUMNS+index];
		$http.post('/api/users/'+userId+'/tokens/revoke',{token:token._id}).success(function(data,status){
			reloadUser();
		})
	}

});
DoorsAdmin.controller('addTokenCtrl', function ($http, $scope, $modalInstance,user) {
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
			var door=$scope.doorToAdd.originalObject;
			if($scope.addedDoors.findBy(door,'name')===-1)
				$scope.addedDoors.push(door);
			$scope.doorToAdd=undefined;
		}
	});

	$scope.deleteAddedDoor=function(index){
		$scope.addedDoors.splice(index,1);
	}

	$scope.doorFormatter=function(query){
		return {
			door:query
		}
	}

	$scope.prettyDate=function(date){
		return moment(date).format('MMMM Do YYYY, h:mm:ss a')
	}

	$scope.setDaily=function(boolean){
		$scope.daily=boolean;
	}

	$scope.ok = function () {
		var doors=[];
		for(var i=0;i<$scope.addedDoors.length;i++){
			doors.push($scope.addedDoors[i].name);
		}
		var days=[];
		for(var i=0;i<$scope.days.length;i++){
			if($scope.days[i])
				days.push(i);
		}
		var from={};
		var to={};
		var uses=$scope.unlimitedUses? -1:$scope.uses;

		if($scope.daily){
			from=$scope.dates.startDailyTime;
			to=$scope.dates.endDailyTime;
		}else{
			from=$scope.startDateTime;
			to=$scope.endDateTime;
			days=[];
		}
		var token={
			name:$scope.name,
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
