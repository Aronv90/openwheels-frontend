'use strict';

/**
 * Kelley van Evert, 12 nov 2018
 * API:
 *   <timeframe-picker
 *      mobile-autoscroll    (=)  :: boolean (whether to autoscroll on mobile)
 *      show-extend-buttons  (=)  :: boolean (whether to show +1/+2/+4 extension buttons)
 *      disable-logic        (=)  :: boolean
 *      disable-time-fields  (=)  :: boolean
 *      pickup-date-time     (=)  :: string in format `API_DATE_FORMAT`
 *      return-date-time     (=)  :: string in format `API_DATE_FORMAT`
 *   />
 */
angular.module('timeframePickerDirective', [])

.directive('timeframePicker', function timeframePicker ($log, $rootScope, mobileDetectService) {

  // Configuration, constants, helpers
  // =====

  var mobile = (mobileDetectService.phone() || mobileDetectService.mobile() || mobileDetectService.tablet());

  var dateTimeConfig = {
    // showAccept: true,
    focusOnShow: false, // (!) important for mobile
    useCurrent: true,
    toolbarPlacement: 'bottom',
  };

  var dateConfig = Object.assign({}, dateTimeConfig, {
    format: 'DD-MM-YYYY',
    minDate: moment().startOf('day'),
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'auto', // 'left',
      vertical: 'bottom',
    },
    width: '20em',
  });

  var timePickerInterval = $rootScope.timePickerInterval || 15;

  var timeConfig = Object.assign({}, dateTimeConfig, {
    format: 'HH:mm',
    stepping: timePickerInterval, // minute step size
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'right',
      vertical: 'bottom',
    },
    width: '12em',
  });

  function getStartOfThisQuarter () {
    var mom = moment();
    var quarter = Math.floor((mom.minutes() | 0) / timePickerInterval); // returns 0, 1, 2 or 3 (if timePickerInterval = 15)
    var minutes = (quarter * timePickerInterval) % 60;
    mom.minutes(minutes);
    return mom;
  }

  function isToday (_moment) {
    return _moment.format('YYYY-MM-DD') === moment().format('YYYY-MM-DD');
  }


  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      mobileAutoscroll: '=',
      showExtendButtons: '=',
      disableLogic: '=',
      disableTimeFields: '=',
      pickupDateTime: '=', // a string in format `API_DATE_FORMAT` (for the data model, not the user)
      returnDateTime: '=', // a string in format `API_DATE_FORMAT` (for the data model, not the user)
    },
    templateUrl: 'directives/timeframePicker/timeframePicker.tpl.html',
    replace: true,
    controller: function timeframePickerController ($scope, $element, $log, API_DATE_FORMAT) {

      $scope.mobile = mobile; // see above

      // In order to pass to child components

      $scope.pickupDateConfig = angular.extend({}, dateConfig, {
        widgetParent: $element.find('.dt-line-pickup'),
      });
      $scope.pickupTimeConfig = angular.extend({}, timeConfig, {
        //widgetParent: $element.find('.dt-line-pickup'),
      });
      $scope.returnDateConfig = angular.extend({}, dateConfig, {
        widgetParent: $element.find('.dt-line-return'),
      });
      $scope.returnTimeConfig = angular.extend({}, timeConfig, {
        //widgetParent: $element.find('.dt-line-return'),
      });

      // Local state

      $scope.pickupDate = $scope.pickupDateTime ? moment($scope.pickupDateTime, API_DATE_FORMAT).format(dateConfig.format) : '';
      $scope.pickupTime = $scope.pickupDateTime ? moment($scope.pickupDateTime, API_DATE_FORMAT).format(timeConfig.format) : '';
      $scope.returnDate = $scope.returnDateTime ? moment($scope.returnDateTime, API_DATE_FORMAT).format(dateConfig.format) : '';
      $scope.returnTime = $scope.returnDateTime ? moment($scope.returnDateTime, API_DATE_FORMAT).format(timeConfig.format) : '';

      setTimeout(function () {
        if ($scope.pickupDate) {
          $scope.form.pickupDate.$setTouched(true); // ??
        }
        if ($scope.pickupTime) {
          $scope.form.pickupTime.$setTouched(true); // ??
        }
        if ($scope.returnDate) {
          $scope.form.returnDate.$setTouched(true); // ??
        }
        if ($scope.returnTime) {
          $scope.form.returnTime.$setTouched(true); // ??
        }
      }, 1);

      $scope.timeframeValid = false;

      // Methods

      function adjustPickup (tf) {
        if (!tf.return) {
          tf.pickup = moment();
        }
        else if (!tf.return.isValid()) {
          return;
        }
        else {
          tf.pickup = tf.return.clone().subtract('hours', 6);
        }
        
        $scope.pickupDate = tf.pickup.format(dateConfig.format);
        $scope.pickupTime = tf.pickup.format(timeConfig.format);
        
        $scope.form.pickupDate.$setTouched(true); // ??
        $scope.form.pickupTime.$setTouched(true); // ??
      }

      function adjustReturn (tf) {
        if (!tf.pickup.isValid()) {
          return;
        }

        /* #MW-1782: end time should not automagically jump to next day */
        var midnight = tf.pickup.clone().startOf('day').add(1, 'days');
        var sixHoursLater = tf.pickup.clone().add(6, 'hours');
        if (tf.pickup.isBefore(midnight) && !sixHoursLater.isBefore(midnight)) {
          tf.return = tf.pickup.clone().add(30, 'minutes');
        } else {
          tf.return = sixHoursLater;
        }

        $scope.returnDate = tf.return.format(dateConfig.format);
        $scope.returnTime = tf.return.format(timeConfig.format);
        
        $scope.form.returnDate.$setTouched(true); // ??
        $scope.form.returnTime.$setTouched(true); // ??
      }

      $scope.setPickupNow = setPickupNow;
      function setPickupNow () {
        $scope.pickupDate = moment().format(dateConfig.format);
        $scope.pickupTime = getStartOfThisQuarter().format(timeConfig.format);
        
        $scope.form.pickupDate.$setTouched(true); // ??
        $scope.form.pickupTime.$setTouched(true); // ??

        checkTimeframe('pickup_now');
      }

      $scope.extendReturnBy = extendReturnBy;
      function extendReturnBy (numHours) {
        numHours = numHours || 1;

        var tf = {
          returnDate: moment($scope.returnDate, dateConfig.format), // only used for date part (!)
          returnTime: moment($scope.returnTime, timeConfig.format), // only used for time part (!)
        };

        if (tf.returnDate.isValid() && tf.returnTime.isValid()) {
          // consolidate
          tf.return = moment($scope.returnDate + ' ' + $scope.returnTime, dateConfig.format + ' '+ timeConfig.format);

          // add hour extension
          tf.return = tf.return.add(numHours, 'hours');

          // write back
          $scope.returnDate = tf.return.format(dateConfig.format);
          $scope.returnTime = tf.return.format(timeConfig.format);
          $scope.form.returnDate.$setTouched(true); // ??
          $scope.form.returnTime.$setTouched(true); // ??

          $scope.returnDateTime = tf.return.format(API_DATE_FORMAT);
        }
      }

      $scope.checkTimeframe = checkTimeframe;
      function checkTimeframe (caller, $event) {
        var tf = {
          pickupDate: moment($scope.pickupDate, dateConfig.format), // only used for date part (!)
          pickupTime: moment($scope.pickupTime, timeConfig.format), // only used for time part (!)
          returnDate: moment($scope.returnDate, dateConfig.format), // only used for date part (!)
          returnTime: moment($scope.returnTime, timeConfig.format), // only used for time part (!)
        };
 
        // Step 1: possibly autofill date resp. time parts

        if (!$scope.disableLogic) {
        
          // If today, then the default timepicker behavior of opening with current time is logical.
          // If not today, then this is not logical and we preemptively set it to 9:00.
          if (tf.pickupDate.isValid() && !isToday(tf.pickupDate) && $scope.form.pickupTime.$untouched) {
            // set pickup time
            $scope.pickupTime = '9:00';
            tf.pickupTime = moment($scope.pickupTime, timeConfig.format);

            $scope.form.pickupTime.$setTouched(true); // ??
          }

          // If today, then the default timepicker behavior of opening with current time is logical.
          // If not today, then this is not logical and we preemptively set it to 9:00.
          if (tf.returnDate.isValid() && !isToday(tf.returnDate) && $scope.form.returnTime.$untouched) {
            // set return time
            $scope.returnTime = '18:00';
            tf.returnTime = moment($scope.returnTime, timeConfig.format);

            $scope.form.returnTime.$setTouched(true); // ??
          }

          if (tf.pickupTime.isValid() && $scope.form.pickupDate.$untouched) {
            tf.pickupDate = moment();
            $scope.pickupDate = tf.pickupDate.format(dateConfig.format);

            $scope.form.pickupDate.$setTouched(true); // ??
          }
        }

        // Step 2: consolidate into datetimes, if possible

        if (tf.pickupDate.isValid() && tf.pickupTime.isValid()) {
          tf.pickup = moment($scope.pickupDate + ' ' + $scope.pickupTime, dateConfig.format + ' '+ timeConfig.format);
        }

        if (tf.returnDate.isValid() && tf.returnTime.isValid()) {
          tf.return = moment($scope.returnDate + ' ' + $scope.returnTime, dateConfig.format + ' '+ timeConfig.format);
        }


        // Step 3: adjust window when necessary
        // (this logic used to reside in `src/common/directives/pickadate/TimeframeDirective.js`)

        if (!$scope.disableLogic) {

          var pickupAdjustable = (caller === 'pickup_now' && !$scope.pickupTime && !$scope.pickupDate) || ($scope.form.pickupTime.$untouched && $scope.form.pickupDate.$untouched);
          var returnAdjustable = (caller === 'pickup_now' && !$scope.returnTime && !$scope.returnDate) || ($scope.form.returnTime.$untouched && $scope.form.returnDate.$untouched);
          
          if (pickupAdjustable && returnAdjustable) {
            // just null
          }
          else if (tf.pickup && returnAdjustable) {
            adjustReturn(tf);
          }
          else if (pickupAdjustable && tf.return) {
            adjustPickup(tf);
          }
          else if (caller === 'pickup' && tf.pickup > tf.return) {
            adjustReturn(tf);
          }
          else if (caller === 'return' && tf.pickup > tf.return) {
            adjustPickup(tf);
          }
        }

        // <- outwards action
        $scope.pickupDateTime = tf.pickup ? tf.pickup.format(API_DATE_FORMAT) : '';
        $scope.returnDateTime = tf.return ? tf.return.format(API_DATE_FORMAT) : '';

        //delete tf.pickupDate;
        //delete tf.pickupTime;
        //delete tf.returnDate;
        //delete tf.returnTime;
        //controller.$setViewValue(tf);

        //controller.$setValidity('begin_before_end', $scope.timeframeValid);
      }
    },
  };

});