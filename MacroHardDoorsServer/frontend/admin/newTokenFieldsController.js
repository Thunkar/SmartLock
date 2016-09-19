DoorsAdmin.controller('newTokenFieldsController', [ '$scope','$location','$http' ,function ($scope,$location,$http) {
	$scope.newToken.uses=0;
	$scope.newToken.dates={}
	$scope.newToken.dates.startDate=new Date();
	$scope.newToken.dates.startTime=new Date();
	$scope.newToken.dates.endDate=new Date();
	$scope.newToken.dates.endTime=new Date();
	$scope.newToken.dates.startDailyTime=new Date();
	$scope.newToken.dates.endDailyTime=new Date();
	$scope.newToken.days=[];
	$scope.newToken.addedDoors=[];

	$scope.incrementUses=function(){
		$scope.newToken.uses++;
	}

	$scope.decrementUses=function(){
		if($scope.newToken.uses>0)
			$scope.newToken.uses--;
	}

	
	$scope.updateDates=function(){
		var startDate=$scope.newToken.dates.startDate;
		var startTime=$scope.newToken.dates.startTime;
		if(startDate&&startTime)
			$scope.newToken.startDateTime=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate(),startTime.getHours(),startTime.getMinutes(),startTime.getSeconds(),startTime.getMilliseconds());
		var endDate=$scope.newToken.dates.endDate;
		var endTime=$scope.newToken.dates.endTime;
		if(endDate&&endTime)
			$scope.newToken.endDateTime=new Date(endDate.getFullYear(),endDate.getMonth(),endDate.getDate(),endTime.getHours(),endTime.getMinutes(),endTime.getSeconds(),endTime.getMilliseconds());

	}
	$scope.updateDates();

	$scope.$watch('newToken.dates.startDate', function(newVal, oldVal){
		$scope.updateDates();
	});
	$scope.$watch('newToken.dates.startTime', function(newVal, oldVal){
		$scope.updateDates();
	});
	$scope.$watch('newToken.dates.endDate', function(newVal, oldVal){
		$scope.updateDates();
	});
	$scope.$watch('newToken.dates.endDate', function(newVal, oldVal){
		$scope.updateDates();
	});
	$scope.$watch('newToken.doorToAdd',function(newVal,oldVal){
		if($scope.newToken.doorToAdd!==undefined){
			var door=$scope.newToken.doorToAdd.originalObject;
			if($scope.newToken.addedDoors.findBy(door,'name')===-1)
				$scope.newToken.addedDoors.push(door);
			$scope.newToken.doorToAdd=undefined;
		}
	});

	$scope.deleteAddedDoor=function(index){
		$scope.newToken.addedDoors.splice(index,1);
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
		$scope.newToken.daily=boolean;
	}

}]);