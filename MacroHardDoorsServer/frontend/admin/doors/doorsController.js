DoorsAdmin.controller('doorsController', [ '$scope','$location','$http' ,function ($scope,$location,$http) {
	var reloadDoors=function(){
		$http.get('/api/doors').success(function(data,status){
			$scope.doors=data.doors;
		});
	}
	reloadDoors();
	$scope.$on('doorEvent',function(){
		console.log("Door event, reloading");
		reloadDoors();
	});
	//setInterval(reloadDoors,1000)
	$scope.deactivateDoor=function(door){
		$http.post('/api/doors/'+door.name+'/active',{active:false}).success(function(data,status){
			reloadDoors();
		});
	}
	$scope.activateDoor=function(door){
		$http.post('/api/doors/'+door.name+'/active',{active:true}).success(function(data,status){
			reloadDoors();
		});
	}
}]);