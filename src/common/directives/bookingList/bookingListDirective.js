'use strict';

angular.module('bookingListDirective', [])

.directive('bookingList', function () {
  return {
    restrict: 'E',
    templateUrl: 'directives/bookingList/bookingList.tpl.html',
    scope: {
      resource: '=',
    },
    controller: function functionName($scope, $log, bookingService, alertService, $state) {
      $scope.busy = false;
      $scope.bookings = [];
      $scope.now = moment().format('YYYY-MM-DD HH:mm');

      //Set begin and end day of the current month as the current timeframe
      $scope.currentTimeFrame = {
        startDate: moment().startOf('month').format('YYYY-MM-DD HH:mm'),
        endDate: moment().endOf('month').format('YYYY-MM-DD HH:mm')
      };

      //Load booking with the current timeframe
      loadBookings();

      //Load bookings of the previous month
      $scope.previous = function () {
        $scope.currentTimeFrame = {
          startDate: moment($scope.currentTimeFrame.startDate).subtract('months', 1).startOf('month').format('YYYY-MM-DD HH:mm'),
          endDate: moment($scope.currentTimeFrame.endDate).subtract('months', 1).endOf('month').format('YYYY-MM-DD HH:mm')
        };
        loadBookings();
      };

      //Load bookings of the next month
      $scope.next = function () {
        $scope.currentTimeFrame = {
          startDate: moment($scope.currentTimeFrame.startDate).add('months', 1).startOf('month').format('YYYY-MM-DD HH:mm'),
          endDate: moment($scope.currentTimeFrame.endDate).add('months', 1).endOf('month').format('YYYY-MM-DD HH:mm')
        };
        loadBookings();
      };

      function loadBookings () {
        if($scope.resource) {
          $scope.busy = true;
          alertService.load();
          return bookingService.forResource({
            resource: $scope.resource.id,
            timeFrame: $scope.currentTimeFrame
          }).then(function (bookings) {
            $scope.busy = false;
            alertService.loaded();
            $scope.bookings = bookings;
          }).then(function () {
            //Get the total hours of the bookings in the current timeframe
            var bookingsHours = 0;
            var bookingsLength = 0;

            $scope.getTotalHours = function(){
              for(var i = 0; i < $scope.bookings.length; i++){
                if([50076, 53808, 904804, 904803, 886218, 904763, 924281, 934650, 934646, 934651, 61664, 912291, 921428, 909163, 916080, 877081, 868897, 865782, 886219, 912372, 911835, 66244].indexOf($scope.bookings[i].contract.id) < 0) {
                  var hours = moment($scope.bookings[i].endBooking).diff(moment($scope.bookings[i].beginBooking), 'hours');
                  var minutes = moment($scope.bookings[i].endBooking).diff(moment($scope.bookings[i].beginBooking), 'minutes');
                  bookingsHours += hours + (minutes / 60 - hours);
                  bookingsLength += 1;
                }
              }
            };

            $scope.getTotalHours();
            $scope.bookingsHours = bookingsHours.toFixed(0);
            $scope.bookingsLength = bookingsLength;
          })
          .catch(function (err) {
            $log.debug('error loading bookings', err);
          });
        }
      }

      $scope.$watch('resource', function(newValue, oldValue) {
        $scope.resource = newValue;
        loadBookings();
      }, true);

    }
  };
});
