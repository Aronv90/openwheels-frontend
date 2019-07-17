'use strict';
angular.module('owm.resource.show.calendar.booking', [])

	.controller('ResourceShowCalendarBookingController', function (
		$scope,
		$state,
		$mdDialog,
		booking
	) {
		$scope.booking = booking;

		$scope.hide = function () {
			$mdDialog.cancel();
		};

    $scope.goMember = function (personId) {
      $mdDialog.cancel();
      $state.go('member', { personId: personId });
    };
	});
