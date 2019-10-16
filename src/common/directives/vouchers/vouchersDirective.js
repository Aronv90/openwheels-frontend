'use strict';

angular.module('vouchersDirective', [])

.directive('voucher', function () {
  return {
    restrict: 'E',
    templateUrl: 'directives/vouchers/vouchers.tpl.html',
    scope: {
      me: '=',
      booking: '=',
      onChanged: '&',
      onExtraDriversChanged: '=',
      discount: '='
    },
    controller: function ($scope, voucherService, alertService, bookingService, $rootScope, paymentService, appConfig, $state,
      $window, contractService, $mdDialog, extraDriverService, $log) {
      $scope.features = $rootScope.features;

//      $scope.onChanged = $scope.onChanged || function () {
//        //$log.log('no callback for voucher/onChanged');
//      };
//      $scope.onExtraDriversChanged = $scope.onExtraDriversChanged || function () {
//        //$log.log('no callback for voucher/onExtraDriversChanged');
//      };

      $scope.extraDrivers = {
        price: 1.25,
        check: false,
        drivers: [],
        loading: false,
        new: '',
      };
      $scope.voucherError = {
        show: false,
        message: ''
      };

      $scope.readOnlyMode = ($scope.booking.person.id !== $scope.me.id);

      // update required credit on discount change
      $scope.$watch('discount', function(newValue, oldValue) {
        if (newValue !== oldValue && $rootScope.discountAdded) {
          init();
        }
      }, true);

      init();

      function init() {
        alertService.closeAll();
        alertService.load();
        //$log.log('-> voucher/init/load');
        contractService.forBooking({ booking: $scope.booking.id })
        .then(function(contract) {
          $scope.booking.contract = contract;

          var promise = (contract.type.id === 60) ?
            reloadExtraDrivers(true) :
            getVoucherPrice($scope.booking);
        }).finally(function () {
          alertService.loaded();
          //$log.log('<< voucher/init/loaded');
        });
      }

      function onExtraDriversChanged (isFirstLoad) {
        getVoucherPrice($scope.booking);
        console.log('calling on extra drivers changed', $scope.onExtraDriversChanged);
        if ($scope.onExtraDriversChanged) {
          $scope.onExtraDriversChanged($scope.booking, isFirstLoad);
        }
      }

      function setExtraDrivers (extraDriverInviteRequests, isFirstLoad) {
        $scope.extraDrivers.drivers = extraDriverInviteRequests;
        onExtraDriversChanged(isFirstLoad);
      }

      function reloadExtraDrivers (isFirstLoad) {
        $scope.extraDrivers.loading = true;

        return extraDriverService
          .driversForBooking({ booking: $scope.booking.id })
          .then(function (extraDriverInviteRequests) {
            setExtraDrivers(extraDriverInviteRequests, isFirstLoad);
            $scope.extraDrivers.loading = false;
          });
      }

      function getVoucherPrice(booking) {
        alertService.closeAll();
        alertService.load();
        //$log.log('-> voucher/getVoucherPrice/load');

        return voucherService.calculateRequiredCreditForBooking({
          booking: booking.id
        }).then(function (value) {
          var bookingObject = {
            riskReduction: booking.riskReduction,
            resource: booking.resource,
            approved: booking.approved,
            id: booking.id,
            title: 'Rit op ',
            booking_price: value.booking_price,
            contract_type: booking.contract.type.id,
            km_price: value.km_price,
            friend_invite_discount: value.friend_invite_discount,
            discount: value.discount,
          };
          if ($scope.extraDrivers.drivers.length > 0) {
            $scope.extraDrivers.check = true;
          }
          booking.details = bookingObject;
          $scope.booking = booking;
          $scope.now = moment();
          $scope.blockedUntil = moment(booking.createdAt).add('minutes', 15);
          $scope.minutesLeft = $scope.blockedUntil.diff($scope.now, 'minutes');
          $scope.holidaytrip = moment(booking.createdAt).add('days', 7).isBefore(moment(booking.cancelAfter));

          var price = $scope.booking.details.booking_price;
          $scope.estimateDialogController = {
            min: 0,
            max: Math.max(200, 2.7 * price.estimate_km_total),
            
            kilometerEstimate: price.estimate_km_total,
            estimatedPrice: angular.extend({}, price),
            updateKmEstimate: function () {
              var controller = $scope.estimateDialogController;
              
              controller.estimatedPrice.km_price_fuel = controller.kilometerEstimate * parseFloat($scope.booking.resource.price.fuelPerKilometer);
    
              var paidKms = Math.max(0, controller.kilometerEstimate - price.free_km_total);
              controller.estimatedPrice.km_price_rate = paidKms * (parseFloat($scope.booking.resource.price.kilometerRate) - (price.discount_per_km || 0));
    
              controller.estimatedPrice.discount_km_points_included = Math.min(controller.estimatedPrice.km_price_rate, price.discount_km_points_remaining || 0);
              controller.estimatedPrice.km_price_rate -= controller.estimatedPrice.discount_km_points_included;

              var rt = 0;
              if (booking.resource.price.vacationKilometerReduction) {
                if (price.time_days >= 7) {
                  rt = booking.resource.price.vacationLongRate;
                } else if (price.time_days >= 3) {
                  rt = booking.resource.price.vacationShortRate;
                }
              }
              controller.estimatedPrice.discount_vacation_km = controller.estimatedPrice.km_price_rate * rt;
              controller.estimatedPrice.km_price_rate -= controller.estimatedPrice.discount_vacation_km;
              controller.estimatedPrice.km_price_rate = Math.max(controller.estimatedPrice.km_price_rate, 0);

              controller.estimatedPrice.rit_totaal = price.total + price.km_price_fuel + price.km_price_rate - price.discount_vacation_km;
              controller.estimatedPrice.rit_totaal_estimate = price.total + controller.estimatedPrice.km_price_fuel + controller.estimatedPrice.km_price_rate;
              controller.estimatedPrice.rit_totaal_diff = Math.abs(controller.estimatedPrice.rit_totaal_estimate - controller.estimatedPrice.rit_totaal);
            },
          };
          $scope.estimateDialogController.updateKmEstimate();

          return bookingObject;
        }).then(function () {
          $scope.priceCalculated = true;
          $scope.isBusy = false;
          $rootScope.isPaymentLoading = false;
        }).catch(function (err) {
          alertService.addError(err);
        }).finally(function () {
          alertService.loaded();
          //$log.log('<< voucher/getVoucherPrice/loaded');
        });
      }

      $scope.redemptionPending = {}; /* by booking id */
      $scope.toggleRedemption = function () {
        $scope.voucherError.show = false;
        alertService.closeAll();
        alertService.load();
        //$log.log('-> voucher/toggleRedemption/load');

        /* checkbox is already checked, so new value is now: */
        $scope.redemptionPending[$scope.booking.id] = true;

        bookingService.alter({
          booking: $scope.booking.id,
          newProps: {
            riskReduction: $scope.booking.details.riskReduction
          }
        })
        .then(function (updatedBooking) {
          if ($scope.booking.details.riskReduction !== updatedBooking.riskReduction) {
            // na begintijd oid
          }
          $scope.booking.riskReduction = $scope.booking.details.riskReduction = updatedBooking.riskReduction;
          return getVoucherPrice($scope.booking);
        })
        .then(function () {
          $scope.voucherError.show = false;

          $scope.onChanged($scope.booking);
        })
        .catch(function (err) {
          if (err.message === 'Bij je huidige gebruiksvorm is verlaging van het eigen risico verplicht.') {
            $scope.voucherError = {
              show: true,
              message: err.message
            };
          } else {
            alertService.addError(err);
          }
          /* revert */
          $scope.booking.details.riskReduction = !$scope.booking.details.riskReduction;
        })
        .finally(function () {
          $scope.redemptionPending = {};
          alertService.loaded();
          $scope.isBusy = false;
        });
      };

      /* EXTRA DRIVER FOR GO CONTRACT */

      $scope.toggleExtraDrivers = function(to, event) {
        var numberOfDrivers = $scope.extraDrivers.drivers.length;

        if(to === undefined) { // if clicking input directly
          if(!$scope.extraDrivers.check && numberOfDrivers) { // and checked -> unchecked
            var confirm = $mdDialog.confirm()
            .title('Wil je de extra bestuurders verwijderen?')
            .textContent('Je hebt al extra bestuurders toegevoegd. Weet je zeker dat je ze weer wilt verwijderen van de rit?')
            .ok('Ja, verwijder')
            .cancel('Nee ');

            $mdDialog.show(confirm)
            .then(function (res) {
              alertService.load();
              //$log.log('-> voucher/toggleExtraDrivers/load');
              return extraDriverService.clearDrivers({booking: $scope.booking.id});
            })
            .then(function () {
              $scope.extraDrivers.check = false;
              $scope.booking.details.booking_price.total -= $scope.extraDrivers.drivers.length * $scope.extraDrivers.price;
              $scope.extraDrivers.drivers = [];
              $scope.onChanged($scope.booking);
            })
            .catch(function (e) {
              $scope.extraDrivers.check = true;
              alertService.addError(e);
            })
            .finally(function () {
              alertService.loaded();
              //$log.log('<< voucher/toggleExtraDrivers/loaded');
            });
          }
        }
        if(to === true && $scope.extraDrivers.check !== true) { //focus, select if not already
          $scope.extraDrivers.check = true;
          return;
        }
        if(to === false) { // blur, uncheck if no extra drivers
          if(numberOfDrivers === 0) {
            $scope.extraDrivers.check = false;
          } else {
            $scope.extraDrivers.check = true;
          }
        }
      };

      $scope.addExtraDriver = function() {
        if ($scope.extraDrivers.new === '') {
          return;
        }

        if ($scope.extraDrivers.drivers.indexOf($scope.extraDrivers.new) < 0) {
          alertService.closeAll();
          alertService.load();
          //$log.log('-> voucher/addExtraDriver/load');

          extraDriverService.addDriver({
            booking: $scope.booking.id,
            email: $scope.extraDrivers.new,
          })
          .then(function (newInviteRequest) {
            $scope.extraDrivers.drivers.push(newInviteRequest);
          })
          .then(function () {
            onExtraDriversChanged();
          })
          .then(function () {
            $scope.extraDrivers.new = '';
            $scope.extraDrivers.check = true;
          })
          .catch(function(e) {
            alertService.addError(e);
          })
          .finally(function() {
            alertService.loaded();
            //$log.log('<< voucher/addExtraDriver/loaded');
          });
        }
      };

      $scope.removeExtraDriver = function (inviteRequest) {

        var confirm = $mdDialog.confirm()
              .title('Extra bestuurder van rit verwijderen?')
              .textContent('Weet je zeker dat je deze persoon als extra bestuurder van de rit wilt verwijderen?')
              .ariaLabel('Lucky day')
              .ok('Akkoord')
              .cancel('Annuleren');
        
        $mdDialog.show(confirm).then(function () {
        
          alertService.closeAll();
          alertService.load();
          //$log.log('-> voucher/removeExtraDriver/load');
          extraDriverService.removeDriver({
            booking: $scope.booking.id,
            email: inviteRequest.recipient.email,
          })
          .then(function () {
            var i = $scope.extraDrivers.drivers.indexOf(inviteRequest);
            $scope.extraDrivers.drivers.splice(i, 1);
          })
          .then(function () {
            onExtraDriversChanged();
          })
          .catch(function(e) {
            alertService.addError(e);
          })
          .finally(function() {
            alertService.loaded();
            //$log.log('<< voucher/removeExtraDriver/loaded');
          });
        
        });
      };

    }
  };
});
