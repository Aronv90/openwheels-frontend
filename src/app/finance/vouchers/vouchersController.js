'use strict';

angular.module('owm.finance.vouchers', [])

.controller('VouchersController', function ($window, $q, $state, $scope, account2Service, appConfig, alertService, voucherService,
  payRedirect,
  paymentService, bookingService, me, Analytics, metaInfoService) {

  metaInfoService.set({url: appConfig.serverUrl + '/vouchers'});
  metaInfoService.set({canonical: 'https://mywheels.nl/vouchers'});

  var cachedBookings = {};
  $scope.busy = true;
  $scope.requiredValue = null;
  $scope.voucherOptions = [25, 50, 100, 250, 500];
  $scope.showVoucherOptions = false;
  $scope.redemptionPending = {}; /* by booking id */
  $scope.accountApproved = false;

  account2Service.forMe()
  .then(function (value) {
    $scope.accounts = value;
    for(var i = 0; i < value.length; i++){
      if (value[i].approved === true) {
        $scope.accountApproved = true;
      }
      if (value[i].approved === false) {
        $scope.name = value[i].lastName;
        $scope.person = value[i].person;
        $scope.accountDisapproved = true;
      }
    }
  });

  // get vouchers // from finance v4 controller
  $scope.vouchersPerPage = 15;
  $scope.vouchers = [];
  voucherService.search({
    person: me.id,
    minValue: 0.0,
  })
    .then(function(vouchers) {
      $scope.vouchers = vouchers;
    });

  // when one of the bookings has been changed we need to fetch the new total we need to pay
  // we make sure we don't update the bookings because it will glitch and is not nescessary
  $scope.bookingChanged = function(booking) {
    return voucherService.calculateRequiredCredit({
        person: me.id
      }).then(function (value) {
        delete value.bookings;
        _.extend($scope.requiredValue, value);
        return $scope.requiredValue;
      })
      .catch(function (err) {
        alertService.addError(err);
      });
  };

  //alertService.load($scope);
  getRequiredValue().then(getBookings).finally(function () {
    //alertService.loaded($scope);
    $scope.busy = false;
  });
  $scope.toggleBookingCards = function (index) {
    var isOpen = $scope.requiredValue.bookings[index].isOpen;
    if (isOpen === true) {
      $scope.requiredValue.bookings[index].isOpen = false;
    } else {

      $scope.requiredValue.bookings[index].isOpen = true;
    }

  };

  $scope.toggleVoucherOptions = function (toggle) {
    $scope.showVoucherOptions = toggle;
  };

  $scope.buyVoucher = function (value) {
    Analytics.trackEvent('payment', 'started', undefined, undefined, true);
    if (!value || value < 0) {
      return;
    }
    alertService.load($scope);
    voucherService.createVoucher({
        person: me.id,
        value: value
      })
      .then(function (voucher) {
        return paymentService.payVoucher({
          voucher: voucher.id
        });
      })
      .then(function (data) {
        if (!data.url) {
          throw new Error('Er is een fout opgetreden');
        }
        /* redirect to payment url */
        payRedirect(data.url, {
          redirect: {
            state: 'owm.finance.vouchers'
          },
        });
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded($scope);
      });
  };

  function getRequiredValue() {
    return voucherService.calculateRequiredCredit({
        person: me.id
      }).then(function (value) {
        $scope.requiredValue = value;
        return value;
      })
      .catch(function (err) {
        alertService.addError(err);
      });
  }

  /**
   * Extend the requiredValue object's bookings
   * Use cache, no need to reload, e.g. after toggling redemption
   */
  function getBookings(requiredValue) {
    if (!requiredValue.bookings || !requiredValue.bookings.length) {
      return true;
    }
    var results = [];

    requiredValue.bookings.forEach(function (booking, index) {
      results.push(cachedBookings[booking.id] ||
        bookingService.get({
          booking: booking.id
        }).then(function (_booking) {
          cachedBookings[_booking.id] = _booking;
          _booking.statusValue = checkStatus(_booking.approved);
          _booking.isOpen = isOpenStatus(index, _booking.statusValue);

          angular.extend(booking, _booking);
        })
      );
    });
    return $q.all(results).catch(function (err) {
      alertService.addError(err);
    });
  }

  function checkStatus(approvedStatus) {
    if (approvedStatus === 'OK') {
      return true;
    } else {
      return false;
    }
  }

  function isOpenStatus(index, statusValue) {
    if (index <= 1 && statusValue === false) {
      return false;
    } else {
      return true;
    }
  }

});
