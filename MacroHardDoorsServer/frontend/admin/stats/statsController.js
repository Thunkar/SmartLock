DoorsAdmin.controller('statsController', function ($scope,$location,$http) {
	var doorsDonut=Morris.Donut({
		element: 'doors-donut-chart',
		data: [{"value":"","label":""}],
		parseTime:false,
		resize: true
	});
	var lastDonutDoorData={};
	setInterval(function(){
		$http.get('/api/doors').success(function(data,status){
			$scope.doors=data.doors;
			$scope.deactivatedDoors=data.doors.filterBy('active',function(val){return val===false;});
			var newDonutData=[
			{
				label: "Active doors",
				value: data.doors.length-$scope.deactivatedDoors.length
			},
			{
				label: "Deactivated doors",
				value: $scope.deactivatedDoors.length
			}];
			if(JSON.stringify(lastDonutDoorData)!==JSON.stringify(newDonutData)){
				doorsDonut.setData(newDonutData);
				lastDonutDoorData=newDonutData;
			}
		});
	},1000);
	var usersDonut=Morris.Donut({
		element: 'users-donut-chart',
		data: [{"value":"","label":""}],
		parseTime:false,
		resize: true
	});
	var lastDonutUserData={};
	setInterval(function(){
		$http.get('/api/users').success(function(data,status){
			$scope.users=data;
			var activeCount=data.filterBy("active",function(val){return val===true}).length;
			var newDonutData=[{
				label: "Active users",
				value: activeCount
			}, {
				label: "Inactive users",
				value: data.length-activeCount
			}];
			if(JSON.stringify(lastDonutUserData)!==JSON.stringify(newDonutData)){
				usersDonut.setData(newDonutData);
				lastDonutUserData=newDonutData;
			}
		});},1000);

	$http.get('/api/statistics').success(function(data,status){
		$scope.stats=data;
		$scope.userRejections=data.filterBy('event',function(val){return val==='userRejected';});
	});

	var formatRelativeDays=function(diff){
		switch(diff){
			case 0:
			return "today";
			case -1:
			return "yesterday";

		}
		return (-diff )+" days ago";
	}
	var doorsArea=		Morris.Area({
		element: 'doors-area-chart',
		data: [],
		xkey: 'period',
		ykeys: ['userEntries', 'userRejections', 'nodesOffline'],
		labels: ['Accesses', 'Rejections', 'Crashes'],
		pointSize: 2,
		hideHover: 'auto',
		parseTime:false,
		lineColors:["#76FF03","#FFC107","#F44336"],
		resize: true
	});
	setInterval(function(){
		$http.get('/api/statistics?from='+moment().subtract(7, 'days').toISOString()+'&to='+new Date().toISOString()).success(function(data,status){
			var dailyStats=[];
			var findDailyStats=function(index){
				dailyStats.push(data.filterBy('date',function(dateStr){
					var date=moment(new Date(dateStr));
					return date.isSame(moment().subtract(index, 'days'),"day");
				}));
			}
			for(var i=0;i<7;i++){
				findDailyStats(i);
			}
			var dailyData=[];
			for(var i=dailyStats.length-1;i>-1;i--){
				dailyData.push({
					period:formatRelativeDays(-i),
					userEntries:dailyStats[i].filterBy("event",function(val){return val==='userEntry';}).length,
					userRejections:dailyStats[i].filterBy("event",function(val){return val==='userRejected';}).length,
					nodesOffline:dailyStats[i].filterBy("event",function(val){return val==='nodeOffline';}).length
				});
			}
			doorsArea.setData(dailyData);

		});},1000);

	

});

DoorsAdmin.controller('timelineController', function ($scope,$location,$http) {
	$http.get('/api/statistics').success(function(data,status){
		$scope.timeline=data;
	});

	$scope.formatDate=function(date){
		return " "+moment(new Date(date)).fromNow();
	}

});