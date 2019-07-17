'use strict';
angular.module('owm.resource.show.calendar.blocking', [])

	.controller('ResourceShowCalendarBlockingController', function (
		$scope,
		$mdDialog,
		blocking,
		API_DATE_FORMAT
	) {
		$scope.blocking = angular.copy(blocking);

		var timeCache = {};

		function fillTimeCache(){
			timeCache.start = moment($scope.blocking.start, API_DATE_FORMAT);
			timeCache.until = moment($scope.blocking.until, API_DATE_FORMAT);
		}

		var dayModified = false;

		$scope.$watch('blocking.allDay', function (newValue){
			if(newValue){
				fillTimeCache();

				if(moment($scope.blocking.start).isSame($scope.blocking.until, 'day')){
					$scope.blocking.until = moment($scope.blocking.start).format(API_DATE_FORMAT);
					dayModified = true;
				}

				$scope.blocking.start = moment($scope.blocking.start, API_DATE_FORMAT).hours(0).minutes(0).format(API_DATE_FORMAT);
				$scope.blocking.until = moment($scope.blocking.until, API_DATE_FORMAT).hours(23).minutes(59).format(API_DATE_FORMAT);
			}else{
				if((dayModified || blocking._allDay) && moment($scope.blocking.start).add(1, 'days').isSame($scope.blocking.until, 'day')){
					$scope.blocking.until = moment($scope.blocking.until).subtract(1, 'days').format(API_DATE_FORMAT);
				}

				if(timeCache.start){
					$scope.blocking.start= moment($scope.blocking.start, API_DATE_FORMAT).hours(timeCache.start.hours()).minutes(timeCache.start.minutes()).format(API_DATE_FORMAT);
					$scope.blocking.until= moment($scope.blocking.until, API_DATE_FORMAT).hours(timeCache.until.hours()).minutes(timeCache.until.minutes()).format(API_DATE_FORMAT);
				}
			}
		});

		$scope.accept = function(){
			$mdDialog.hide($scope.blocking);
		};

		$scope.remove = function(){
			$scope.blocking.remove = true;
			$mdDialog.hide($scope.blocking);
		};

		$scope.hide = function () {
			$mdDialog.cancel();
		};
	});
