DoorsAdmin.controller('doorsController', function ($scope,$location,$http) {
	var DOORS_COLUMNS=3;
	var reloadDoors=function(){
		$http.get('/api/doors').success(function(data,status){
			data=data.doors;
			$scope.doorsRows=[];
			var length=data.length;
			for(var i=0;i<length/DOORS_COLUMNS;i++){
				$scope.doorsRows[i]=[];
				for(var j=0;(j<DOORS_COLUMNS)&&(i*DOORS_COLUMNS+j)<length;j++){
					$scope.doorsRows[i][j]=data[i*DOORS_COLUMNS+j];
				}
			}
		});
	}
	reloadDoors();
});