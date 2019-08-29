'use strict';

angular.module('owm.booking.show', [])

.controller('BookingShowRentingOutController', function (
  metaInfoService,
  appConfig,

  $log,
  $scope
) {
  // $scope = { account, me, perspective, details, flowContinuation, resource, booking, contract }
})

.controller('BookingShowRentingController', function (
  metaInfoService,
  appConfig,
  Analytics,

  buyVoucherRedirect,

  personService,
  extraDriverService,
  bookingService,
  alertService,
  voucherService,
  discountService,

  $log,
  $q,
  $state,
  $timeout,
  $filter,
  $mdDialog,
  $sessionStorage,
  $scope
) {
  // $scope = { account, me, perspective, details, flowContinuation, resource, booking, contract }

  if ($scope.me.driverLicenseStatus === "pending") {
    const POLL_INTERVAL = 3000;
    const POLL_TIMEOUT = 45000;
    let _timeout;

    function requestPoll(i) {
      if (i >= POLL_TIMEOUT / POLL_INTERVAL) {
        // console.log("poll timeout reached");
      } else {
        _timeout = $timeout(() => licensePendingPoll(i), POLL_INTERVAL);
      }
    }

    function licensePendingPoll(i = 0) {
      // console.log("pending poll #", i)

      personService.me()
      .then(me => {
        // console.log("status", me.driverLicenseStatus);

        if (me.driverLicenseStatus !== "pending") {
          // console.log("resolved!");
          $scope.me = me;
          $state.reload();
        } else if (me.driverLicenseStatus === "pending") {
          requestPoll(i + 1);
        }
      })
      .catch(function (err) {
        // if the API fails we can't really do anything
        requestPoll(i + 1);
      });
    }

    licensePendingPoll();

    $scope.$on("$destroy", function () {
      if (_timeout) {
        $timeout.cancel(_timeout);
      }
    });
  }

  $scope.getCurrentCredit = function () {
    return voucherService
      .calculateRequiredCredit({ person: $scope.me.id })
      .then(function (requiredCredit) {
        // + credit (24 E rijtegoed)
        // - sub_total (boeking kost 24 E)
        // - debt (openstaande facturen)
        // = actual spendable amount of money

        // and then cap anything below 0E, because we don't want the user to pay for future bookings
        //  or open invoices just to add an extra driver or extend the timeframe
        return Math.max(requiredCredit.credit - requiredCredit.sub_total - requiredCredit.debt, 0);
      });
  };

  $scope.declarationsDialog = function ($event) {
    $mdDialog.show({
      templateUrl: 'booking/show/renting/dialog-declarations.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: false,
      hasBackdrop: true,
      fullscreen: true,
      controller: ['$scope', function (dialogScope) {

        dialogScope.appConfig = $scope.appConfig;
        dialogScope.booking = $scope.booking;
        dialogScope.allowDeclarationsAdd = $scope.allowDeclarationsAdd;

        dialogScope.hide = function () {
          $mdDialog.hide();
        };
      }],
    });
  };

  $scope.kmStandenDialog = function ($event) {
    $mdDialog.show({
      templateUrl: 'booking/show/dialog-kmStanden.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: false,
      hasBackdrop: true,
      fullscreen: true,
      controller: ['$scope', function (dialogScope) {

        dialogScope.me = $scope.me;
        dialogScope.booking = $scope.booking;
        dialogScope.perspective = $scope.perspective;
        dialogScope.details = $scope.details;

        dialogScope.hide = function () {
          $mdDialog.hide();
        };

        dialogScope.finalize = function () {
          alertService.load();
          bookingService.finishTrip({ booking: $scope.booking.id })
          .then(function () {
            alertService.loaded($scope);
            alertService.add('success', 'De rit is afgerond', 4000);
            $mdDialog.hide();
            $state.reload();
          })
          .catch(function (err) {
            dialogScope.apiError = err.message || true;
          });
        };
      }],
    });
  };

  $scope.discountCodeDialog = function ($event) {
    $mdDialog.show({
      templateUrl: 'booking/show/dialog-discountCode.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: false,
      hasBackdrop: true,
      fullscreen: true,
      controller: ['$scope', function (dialogScope) {

        dialogScope.showSpinner = false;
        dialogScope.discountError = null;
        dialogScope.changeset = {};
        
        dialogScope.details = $scope.details;
        
        dialogScope.discount = $scope.discount;
        dialogScope.resource = $scope.resource;

        dialogScope.hide = function () {
          $mdDialog.hide();
        };

        dialogScope.onChange = function () {
          dialogScope.discountError = false;
        };

        dialogScope.applyDiscountCode = function () {
          dialogScope.showSpinner = true;
          discountService.apply({
            booking: $scope.booking.id,
            discount: dialogScope.changeset.discountCode,
          })
          .then(function (discount) {
            dialogScope.discount.push(discount);
            if (!$scope.progress.steps.payment.checked) {
              $scope.bookingChanged($scope.booking);
            }
          })
          .catch(function (err) {
            dialogScope.discountError = err.message;
          })
          .finally(function () {
            dialogScope.showSpinner = false;
          });
        };
      }],
    });
  };

  $scope.cancelReservationDialog = function ($event) {
    $mdDialog.show({
      templateUrl: 'booking/show/dialog-cancelReservation.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: false,
      hasBackdrop: true,
      fullscreen: true,
      controller: ['$scope', function (dialogScope) {

        dialogScope.me = $scope.me;

        dialogScope.hide = function () {
          $mdDialog.hide();
        };
        
        dialogScope.booking = $scope.booking;
        dialogScope.details = $scope.details;

        dialogScope.cancel = function () {

          alertService.load();
          bookingService.cancel({
            id: dialogScope.booking.id
          })
          .then(function (booking) {
            Analytics.trackEvent('booking', $scope.userPerspective === 'owner' ? 'cancelled_owner' : 'cancelled_renter', booking.id, undefined, true);
            angular.merge(dialogScope.booking, booking);
            alertService.add('success', $filter('translate')('BOOKING_CANCELED'), 5000);
            $state.go('owm.person.dashboard');
          })
          .catch(function (e) {
            alertService.addError(e);
          })
          .finally(function () {
            $mdDialog.hide();
            alertService.loaded();
          });
        };
      }],
    });
  };

  $scope.editReservationTimeframeDialog = function ($event) {
    $mdDialog.show({
      templateUrl: 'booking/show/dialog-editReservationTimeframe.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: false,
      hasBackdrop: true,
      fullscreen: true,
      controller: ['$scope', function (dialogScope) {

        dialogScope.hide = function () {
          $mdDialog.hide();
        };
        
        dialogScope.currentCredit = null;
        $scope.getCurrentCredit().then(function (currentCredit) {
          dialogScope.currentCredit = currentCredit;
        });

        dialogScope.perspective = $scope.perspective;
        dialogScope.contract = $scope.contract;
        dialogScope.booking = $scope.booking;
        dialogScope.resource = $scope.resource;

        dialogScope.changeset = {};
        dialogScope.changeset.beginRequested = $scope.booking.beginRequested ? $scope.booking.beginRequested : $scope.booking.beginBooking;
        dialogScope.changeset.endRequested   = $scope.booking.endRequested   ? $scope.booking.endRequested   : $scope.booking.endBooking;
        dialogScope.changeset.remarkRequester = $scope.booking.remarkRequester;

        dialogScope.timeFrameError = null;
        dialogScope.extraCreditError = null;

        dialogScope.$watch('[changeset.beginRequested, changeset.endRequested]', function () {
          //$log.log($scope.booking.beginRequested + ' -> ' + $scope.booking.endRequested);
          dialogScope.extraCreditError = null;

          if (!dialogScope.changeset.beginRequested || !dialogScope.changeset.endRequested) {
            return false;
          }

          if (moment(dialogScope.changeset.beginRequested) >= moment(dialogScope.changeset.endRequested)) {
            dialogScope.timeFrameError = 'invalid';
          }
          else {
            dialogScope.timeFrameError = null;
          }
        });

        dialogScope.makeRequest = function () {
          alertService.load();
          bookingService.alterRequest({
            booking: dialogScope.booking.id,
            timeFrame: {
              startDate: dialogScope.changeset.beginRequested,
              endDate: dialogScope.changeset.endRequested,
            },
            remark: dialogScope.changeset.remarkRequester,
          })
          .then(function (updatedBbooking) {
            Analytics.trackEvent('altered', 'success', updatedBbooking.id, undefined, true);
            angular.merge(dialogScope.booking, updatedBbooking);
            $scope.initPermissions();
            
            var actionResultMessage = (dialogScope.booking.beginRequested) ?
              'De wijziging is aangevraagd bij de verhuurder.' :
              'Het huurverzoek is geaccepteerd.';
            
            $mdDialog.hide();
            alertService.add('success', actionResultMessage, 5000);
          })
          .catch(function (err) {
            if (err && err.level && err.message) {
              dialogScope.extraCredit = false;
              if (err.message.match('onvoldoende')) {
                dialogScope.extraCreditError = {
                  required: err.data.extra_credit,
                  message: err.message + '. Verhoog eerst je rijtegoed om de rit te kunnen verlengen.',
                };
              } else {
                alertService.add(err.level, err.message, 5000);
              }
            } else {
              alertService.addError(err);
            }
          })
          .finally(function () {
            alertService.loaded();
          });
        };

        dialogScope.pay = function (amount) {
          $sessionStorage.alterTimeframeChangeset = angular.merge({}, dialogScope.changeset);

          buyVoucherRedirect({
            amount: amount,
            afterPayment: {
              redirect: {
                state: 'owm.booking.show',
                params: {
                  bookingId: $scope.booking.id,
                  cont: 'alter_timeframe',
                },
              },
              paymentErrorRedirect: {
                state: 'owm.booking.show',
                params: {
                  bookingId: $scope.booking.id,
                  cont: 'error_payment_alter_timeframe',
                },
              },
            },
          });
        };
      }],
    });
  };

  $scope.editRiskReductionDialog = function ($event) {
    if ($scope.contract.type.id === 60) {
      $mdDialog.show({
        templateUrl: 'booking/show/dialog-editRiskReductionGo.tpl.html',
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose: false,
        hasBackdrop: true,
        fullscreen: true,
        controller: ['$scope', function (dialogScope) {
          dialogScope.hide = function () {
            $mdDialog.hide();
          };
        }],
      });
    } else {
      $mdDialog.show({
        templateUrl: 'booking/show/dialog-editRiskReduction.tpl.html',
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose: false,
        hasBackdrop: true,
        fullscreen: true,
        controller: ['$scope', function (dialogScope) {

          dialogScope.hide = function () {
            $mdDialog.hide();
          };
          
          dialogScope.currentCredit = null;
          $scope.getCurrentCredit().then(function (currentCredit) {
            dialogScope.currentCredit = currentCredit;
          });

          dialogScope.perspective = $scope.perspective;
          dialogScope.contract = $scope.contract;
          dialogScope.booking = $scope.booking;

          var numMinutes = -Infinity;
          if ($scope.booking.beginBooking) {
            numMinutes = Math.max(numMinutes, moment($scope.booking.endBooking).diff($scope.booking.beginBooking, 'minutes'));
          }
          if ($scope.booking.beginRequested) {
            numMinutes = Math.max(numMinutes, moment($scope.booking.endRequested).diff($scope.booking.beginRequested, 'minutes'));
          }
          var numDaysRoundedUp = Math.ceil(numMinutes / (60 * 24));

          dialogScope.amount = 3.5 * numDaysRoundedUp;

          dialogScope.setRiskReduction = function (newRiskReduction) {
            bookingService.alter({
              booking: $scope.booking.id,
              newProps: {
                riskReduction: newRiskReduction,
              }
            })
            .then(function (updatedBooking) {
              if (newRiskReduction !== updatedBooking.riskReduction) {
                throw new Error({
                  message: 'Er is iets misgegaan',
                });
              }
              else {
                // We've already requested the booking, and an extra API call
                //  would be overkill, but we know exactly what changed,
                //  so now just change it in-place.
                $scope.booking.riskReduction = newRiskReduction;
                
                var actionResultMessage = 'De verlaging van je eigen risico is ' + (newRiskReduction ? 'aangezet' : 'uitgezet') + '.';
                
                $mdDialog.hide();
                alertService.add('success', actionResultMessage, 5000);
              }
            })
            .catch(function (e) {
              alertService.addError(e);
            });
          };
        }],
      });
    }
  };

  $scope.extraDriversDialog = function ($event) {
    if ($scope.contract.type.id === 60) {
      $scope.addExtraDriverDialog($event);
    } else {
      $mdDialog.show({
        templateUrl: 'booking/show/dialog-extraDriversNonGoContract.tpl.html',
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose: false,
        hasBackdrop: true,
        fullscreen: true,
        controller: ['$scope', function (dialogScope) {
          
          dialogScope.hide = function () {
            $mdDialog.hide();
          };

          dialogScope.contract = $scope.contract;
        }],
      });
    }
  };

  $scope.addExtraDriverDialog = function ($event) {
    $mdDialog.show({
      templateUrl: 'booking/show/dialog-addExtraDriver.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: false,
      hasBackdrop: true,
      fullscreen: true,
      controller: ['$scope', function (dialogScope) {

        dialogScope.hide = function () {
          $mdDialog.hide();
        };
        
        dialogScope.currentCredit = null;
        function fetchCredit () {
          $scope.getCurrentCredit().then(function (currentCredit) {
            dialogScope.currentCredit = currentCredit;
          });
        }
        fetchCredit();

        dialogScope.removeDriver = function (inviteRequest) {
          $scope.extraDrivers.removeForSure(inviteRequest).then(fetchCredit);
        };

        dialogScope.extraDrivers = $scope.extraDrivers;
        dialogScope.details = $scope.details;
        dialogScope.contract = $scope.contract;
        dialogScope.newEmails = [
          { text: '' }
        ];
        dialogScope.addEmailLine = function () {
          dialogScope.newEmails.push({ text: '' });
        };
        dialogScope.removeEmailLine = function (newEmail) {
          var i = dialogScope.newEmails.indexOf(newEmail);
          dialogScope.newEmails.splice(i, 1);
        };

        dialogScope.addDirectly = function () {
          $q.all(dialogScope.newEmails.map(function (newEmail) {
            return extraDriverService.addDriver({
              booking: $scope.booking.id,
              email: newEmail.text,
            });
          }))
          .then(function () {
            alertService.add('success', 'De extra bestuurders zijn uitgenodigd.', 4000);
            fetchCredit();
            $scope.extraDrivers.load();
          })
          .catch(function (e) {
            alertService.addError(e);
          })
          .finally(function () {
            dialogScope.newEmails = [
              { text: '' }
            ];
          });
        };

        dialogScope.pay = function (amount) {
          $sessionStorage.addExtraDriversEmails = dialogScope.newEmails.map(function (newEmail) {
            return newEmail.text;
          });

          buyVoucherRedirect({
            amount: amount,
            afterPayment: {
              redirect: {
                state: 'owm.booking.show',
                params: {
                  bookingId: $scope.booking.id,
                  cont: 'add_extra_drivers',
                },
              },
              paymentErrorRedirect: {
                state: 'owm.booking.show',
                params: {
                  bookingId: $scope.booking.id,
                  cont: 'error_payment_add_extra_drivers',
                },
              },
            },
          });
        };
      }],
    });
  };

  

  $scope.openEditDialog = function ($event) {
    $mdDialog.show({
      scope: $scope,
      preserveScope: true,
      locals: {
        hide: function () {
          $mdDialog.hide();
        },
      },
      templateUrl: 'booking/show/dialog-edit.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: true,
    })
    .then(function (res) {
    });
  };

})

.controller('BookingShowController', function (
  $q, $timeout, $log, $scope, $location, $filter, $translate, $state, $stateParams, appConfig, API_DATE_FORMAT,
  bookingService, resourceService, invoice2Service, alertService, dialogService,
  account,
  perspective,
  details,
  progress,
  flowContinuation,
  payRedirect,
  authService, boardcomputerService, discountUsageService, chatPopupService, linksService,
  booking, me, declarationService, $mdDialog, contract, Analytics, paymentService, voucherService,
  zoneService,
  $window, $mdMedia, discountService, account2Service, $rootScope, chipcardService, metaInfoService,
  extraDriverService,
  damageService) {

  metaInfoService.set({url: appConfig.serverUrl + '/booking/' + booking.id});
  metaInfoService.set({canonical: 'https://mywheels.nl/booking/' + booking.id});

  $scope.account = account;
  $scope.perspective = perspective;
  $scope.details = details;
  $scope.progress = progress; // for renters

  $scope.flowContinuation = flowContinuation;

  $scope.appConfig = appConfig;
  $scope.contract = contract;
  $scope.booking = booking;
  var resource = $scope.resource = booking.resource;
  $scope.me = me;

//  $state.transitionTo('owm.booking.show', { cont: 'sdf' }, { notify: false });
//  $state.current.reloadOnSearch = false;
//  $location.search({ cont: null });
//  $timeout(function () {
//    $state.current.reloadOnSearch = undefined;
//  });


  // Is person the renter or the owner
  $scope.ownContract = (contract.contractor.id === me.id);
  $scope.userPerspective = (function () {
    if (booking.person.id === me.id) {
      // het kan hier gaan om:
      // - een boeking op je eigen contract
      // - een boeking op iemand anders' contract [je bent contractant]
      return 'renter';
    }
    else if ($scope.ownContract) {
      // het gaat hier om een rit van een contractant
      // [dit is niet jouw eigen boeking, maar die van een contractant]
      return 'contract_holder';
    }
    else if (resource.owner.id === me.id) {
      return 'owner';
    }
  }());

  /*
  * Init booking times
  */
  $scope.initBookingRequestScope = function (booking) {
    $scope.bookingRequest = angular.copy(booking);
    $scope.bookingRequest.beginRequested = booking.beginRequested ? booking.beginRequested : booking.beginBooking;
    $scope.bookingRequest.endRequested   = booking.endRequested   ? booking.endRequested   : booking.endBooking;
  };
  $scope.initBookingRequestScope(booking);

  $scope.bookingStarted = moment().isAfter(moment(booking.beginBooking));
  $scope.bookingEnded = moment().isAfter(moment(booking.endBooking));
  $scope.bookingRequestEnded = moment().isAfter(moment(booking.endRequested));
  $scope.bookingStartsWithinOneHour = moment().isAfter(moment(booking.beginBooking).add(-1, 'hour'));
  $scope.bookingEndedReally = moment().isAfter(moment(booking.endBooking).add(30, 'minutes'));
  $scope.bookingRequestEndedReally = moment().isAfter(moment(booking.endRequested).add(30, 'minutes'));
  $scope.showBookingForm = !$scope.bookingEndedReally;
  $scope.requested = ($scope.booking.status === 'requested');
  $scope.accepted = ($scope.booking.status === 'accepted');
  $scope.firstTime = ($scope.booking.person.numberOfBookings === 0);
  
  $scope.userInput = {
    acceptRejectRemark: ''
  };

  $scope.openDialog = function($event, declaration) {
    $mdDialog.show({
      controller: ['$scope', '$mdDialog', 'appConfig', function($scope, $mdDialog, appConfig) {
        $scope.image = 'declaration/' + declaration.image;
        $scope.appConfig = appConfig;
        $scope.declaration = declaration;
        $scope.hide = function() {
          $mdDialog.hide();
        };
      }],
      templateUrl: 'booking/administer/declarationDialog.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose:true,
    })
    .then(function(res) {
    });
  };

  /*
  * Init permissions
  */
  $scope.initPermissions = initPermissions;
  initPermissions();

  function initPermissions() {
    var booking = $scope.booking;

    $scope.allowEdit   = false;
    $scope.allowCancel = false;
    $scope.allowStop   = false;
    $scope.allowAcceptReject  = false;
    $scope.allowDeclarations = contract.type.canHaveDeclaration && ($scope.booking.approved === 'OK' || $scope.booking.approved === null) && $scope.bookingStarted && !$scope.booking.resource.refuelByRenter && !booking.resource.fuelCardCar;
    $scope.allowDeclarationsAdd = $scope.allowDeclarations && moment().isBefore(moment(booking.endBooking).add(5, 'days'));

    $scope.showReviewTeaser = (booking.status === 'accepted') && booking.ok && // booking is definitely accepted and OK
      booking.beginBooking && booking.endBooking && // booking has a(n accepted) timeframe
      (moment().isAfter(moment(booking.beginBooking)) || moment().isAfter(moment(booking.endBooking))); // bezig of geweest

    // whether to show (possibly deactivated) buttons to open/close the car
    $scope.showBoardComputerButtons = false;

    // whether to enable the buttons (when you can actually open/close the car),
    //  or just show their shapes to prime people for the possibility
    $scope.enableBoardComputerButtons = false;

    if ($scope.booking.ok) {
      $scope.allowAgreementUrl = linksService.bookingAgreementPdf(booking.id);
    }

    if ($scope.userPerspective === 'renter' || $scope.userPerspective === 'contract_holder') {
      $scope.allowEdit = (function () {
        if (booking.endBooking) {
          return moment().isBefore(moment(booking.endBooking).add(30, 'minutes')); // hooguit 30 minuten geleden afgelopen
        }
        else if (booking.beginRequested) {
          return moment().isBefore(moment(booking.beginRequested).add(15, 'minutes')); // moet nog beginnen
        }
        return false;
      }());

      $scope.allowCancel = (function () {
        if (booking.beginBooking) {
          return moment().isBefore(moment(booking.beginBooking)); // moet nog beginnen
        }
        return true;
      }());

      $scope.showBoardComputerButtons = (booking.resource.locktypes.indexOf('smartphone') >= 0) && !$scope.bookingEndedReally;
      if ($scope.showBoardComputerButtons) {
        $scope.enableBoardComputerButtons = true &&
          (booking.status === 'accepted') && booking.ok && // booking is definitely accepted and OK
          booking.beginBooking && booking.endBooking && // booking has a(n accepted) timeframe
          moment().isAfter(moment(booking.beginBooking).add(-5, 'minutes')) && // hooguit 5 minuten geleden begonnen
          moment().isBefore(moment(booking.endBooking).add(1, 'hour')); // hooguit 1 uur geleden afgelopen
      }

      $scope.allowStop = (function () {
        return ($scope.allowEdit &&
          booking.status === 'accepted' &&
          booking.beginBooking && booking.endBooking &&
          moment().isAfter(moment(booking.beginBooking)) &&
          moment().isBefore(moment(booking.endBooking))
        );
      }());
    }

    if ($scope.userPerspective === 'owner' || ($scope.userPerspective === 'contract_holder' && resource.owner.id === me.id)) {
      $scope.allowAcceptReject = booking.beginRequested && booking.endRequested;
      $scope.allowCancel = (function () {
        return (
          !$scope.allowAcceptReject &&
          booking.status === 'accepted' &&
          booking.beginBooking &&
          moment().isBefore(moment(booking.beginBooking)) // is nog niet begonnen
        );
      }());
    }
  }

  $scope.hasAcceptedTimeframe = function (booking) {
    return booking.beginBooking && ( ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0 );
  };

  $scope.hasRequestedTimeframe = function (booking) {
    return booking.beginRequested && ( ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0 );
  };

  $scope.setTimeframe = function(booking, addDays) {
    booking.beginRequested = moment().add('days', addDays).format(API_DATE_FORMAT);
  };

  $scope.dateConfig = {
    //model
    modelFormat: API_DATE_FORMAT,
    formatSubmit: 'yyyy-mm-dd',

    //view
    viewFormat: 'DD-MM-YYYY',
    format: 'dd-mm-yyyy',
    //options
    selectMonths: true,
    container: 'body'
  };

  $scope.timeConfig = {
    //model
    modelFormat: API_DATE_FORMAT,
    formatSubmit: 'HH:i',

    //view
    viewFormat: 'HH:mm',
    format: 'HH:i',

    //options
    interval: $rootScope.timePickerInterval || 15,
    container: 'body'
  };

  /*
  * Boardcomputers functions
  */

  // general purpose dialog showing method
  $scope.infoDialog = infoDialog;
  function infoDialog (messageCode, $event, scopeExtender) {
    $mdDialog.show({
      templateUrl: 'booking/show/dialog-' + messageCode + '.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      fullscreen: true,
      clickOutsideToClose: true,
      // scope: $scope,
      // preserveScope: true,
      controller: ['$scope', function ($scope) {
        // $scope.resource = resource;
        $scope.hide = function () {
          $mdDialog.hide();
        };
        if (typeof scopeExtender === 'function') {
          scopeExtender($scope);
        }
      }],
    });
  }

  // intermediate board computer control method
  // which delegates user intentions to
  // actual api calls or other dialogs
  $scope.boardComputerControl = boardComputerControl;
  function boardComputerControl (action, $event) {

    if (!$scope.enableBoardComputerButtons) {
      return false;
    }

    // helpers
    function id (x) {
      return x;
    }
    function showInfoDialog (dialog, scopeExtender) {
      return function (errorMessage) {
        infoDialog(dialog, $event, function ($scope) {
          if (errorMessage) {
            $scope.errorMessage = errorMessage;
          }
          if (typeof scopeExtender === 'function') {
            scopeExtender($scope);
          }
        });
      };
    }

    if (action === 'closeDoor') {
      return closeDoor()
        .then(resource.askCleanliness ? showInfoDialog('closeDoorSuccess') : id)
        .catch(showInfoDialog('boardComputerError'));
    }

    if (action === 'openDoorAfterDamageReport') {
      return openDoor()
        .then(showInfoDialog('openDoorSuccess', function ($scope) {
          $scope.damageStateReported = true;

          $scope.askDamage = resource.askDamage;
          $scope.askCleanliness = resource.askCleanliness;

          $scope.messDescription = '';
          $scope.thanks = false;
          $scope.mess = false;
          $scope.noMess = function () {
            //$mdDialog.hide();
            reportMess(false);
            $scope.thanks = true;
          };
          $scope.isMess = function () {
            $scope.mess = true;
            // $scope.$apply(); // apparently already run
          };
          $scope.reportMessDescription = function () {
            reportMess(true, $scope.messDescription);
            //$mdDialog.hide();
            $scope.thanks = true;
          };
        }))
        .catch(showInfoDialog('boardComputerError'));
    }

    if (action === 'openDoor') {
      // console.log(booking.resource.askDamage);
      if (!booking || booking.trip.begin || !booking.resource.askDamage || !booking.resource.askCleanliness) {
        // If there is no related booking, or the trip has indeed already begun or askDamage or askCleanliness is false,
        //  just open the door and be done with it.
        return openDoor()
          .then(showInfoDialog('openDoorSuccess'))
          .catch(showInfoDialog('boardComputerError'));
      }

      // There is a booking, and the related trip has not yet begun,
      //  so show a dialog informing after possible new damage.
      return infoDialog('openDoorDamagePrompt', $event, function ($scope) {
        $scope.knownDamage = resource.knownDamage;
        $scope.schade = false;
        $scope.damageDescription = '';
        $scope.hide = function () {
          $mdDialog.hide();
        };
        $scope.geenSchade = function () {
          $mdDialog.hide();
          reportDamage(false);
          boardComputerControl('openDoorAfterDamageReport');
        };
        $scope.welSchade = function () {
          $scope.schade = true;
          // $scope.$apply(); // apparently already run
        };
        $scope.reportDamageDescription = function () {
          reportDamage(true, $scope.damageDescription);
          $mdDialog.hide();
          boardComputerControl('openDoorAfterDamageReport');
        };
      });
    }
  }

  // actual api call, no UI logic
  function closeDoor () {
    return $q(function (resolve, reject) {
      alertService.load();
      boardcomputerService.control({
        action: 'CloseDoorStartDisable',
        resource: resource.id,
        booking: booking ? booking.id : undefined
      })
      .then(function (result) {
        if (result === 'error') {
          reject(result);
        } else {
          resolve();
        }
      }, function (error) {
        reject(error.message);
      })
      .finally( function() {
        alertService.loaded();
      });
    });
  }

  // actual api call, no UI logic
  function openDoor () {
    return $q(function (resolve, reject) {
      alertService.load();
      boardcomputerService.control({
        action: 'OpenDoorStartEnable',
        resource: resource.id,
        booking: booking ? booking.id : undefined
      })
      .then(function (result) {
        if (result === 'error') {
          reject(result);
        } else {
          resolve();
        }
      }, function (error) {
        reject(error.message);
      })
      .finally( function() {
        alertService.loaded();
      });
    });
  }

  // These API calls are not tracked: failure
  //  does not impact UX, and hence should not
  //  form any obstruction
  function reportDamage (has_damage, description) {
    setTimeout(function () {
      damageService.addUserDamage({
        booking: booking.id,
        answer:      has_damage ? 'yes'       : 'no',
        description: has_damage ? description : undefined,
      });
    }, 10);
  }
  function reportMess (has_mess, description) {
    setTimeout(function () {
      damageService.dirty({
        booking: booking.id,
        answer:      has_mess ? 'yes'       : 'no',
        description: has_mess ? description : undefined,
      });
    }, 10);
  }

  //get currenct location of the resource if locktypes contains smartphone and booking begins within 60 minutes
  var longitude = null;
  var latitude = null;
  var zoom = 14;

  $scope.setMarkersForMap = function() {
    var addMap = function (zonePolygon, chargingPoints) {
      var keyType = ($scope.resource.locktypes.indexOf('chipcard') >= 0 || $scope.resource.locktypes.indexOf('smartphone') >= 0) ? '-open' : '-key';
      var approx = ($scope.resource.parkingType === 'zone') ? '-approx' : '';
      angular.extend($scope, {
        map: {
          zonePolygon: zonePolygon, // : { geometry: Array<{ latitude: number, longitude: number }>, type: "polygon" }
          center: {
            latitude: latitude,
            longitude: longitude
          },
          draggable: true,
          markers: [{
            idKey: 1,
            icon: 'assets/img/mywheels' + keyType + approx + '-marker-v2-80.png',
            latitude: latitude,
            longitude: longitude,
            title: $scope.resource.alias
          }].concat((chargingPoints || []).map(function (chargingPoint, j) {
            var key = Math.ceil(2 * (chargingPoint.status.available / (chargingPoint.status.available + chargingPoint.status.charging)));
            return {
              idKey: j + 2,
              icon: 'assets/img/chargingpoint_' + key + '.png',
              latitude: chargingPoint.location.latitude,
              longitude: chargingPoint.location.longitude
            };
          })),
          zoom: zoom,
          options: {
            scrollwheel: false,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false
          }
        }
      });
    };

    if ($scope.resource.parkingType === 'zone') {
      zoneService
      .forResource({ resource: $scope.resource.id })
      .then(function (res) {
        zoneService
        .chargingPoints({
          coordinates: res.geometry.coordinates,
          type: 'polygon'
        })
        .then(function (res2) {
          addMap(res.geometry, res2.data);
        });
      });
    } else {
      addMap();
    }
  };

  if (booking.resource.locktypes.indexOf('smartphone') >= 0 && !$scope.bookingEndedReally && $scope.accepted && booking.ok && $scope.bookingStartsWithinOneHour) {
    boardcomputerService.currentLocation({
      resource: $scope.resource.id
    })
    .then(function(location) {
      latitude = location.lat;
      longitude = location.lng;
      zoom = 16;
      $scope.setMarkersForMap();
    })
    .catch(function (error) {
      if (error.message === 'Not allowed to access log') {
        $scope.locationError = 'De huidige locatie kan niet opgehaald worden.';
      } else {
        $scope.locationError = error.message;
      }
      latitude = $scope.resource.latitude;
      longitude = $scope.resource.longitude;
      $scope.setMarkersForMap();
    });
  } else {
    latitude = $scope.resource.latitude;
    longitude = $scope.resource.longitude;
    $scope.setMarkersForMap();
  }

  // check is resource has fuelcard
  if ([282, 519038].indexOf(booking.resource.owner.id) >= 0 && booking.resource.boardcomputer) {
    $scope.fuelCard = true;
  } else {
    $scope.fuelCard = false;
  }

  // get chipcard fish if boardcomputer is convadis
  $scope.fish = false;

  $scope.getFish = function() {
    chipcardService.getFish({
      person: me.id
    }).then(function (fish) {
      if (fish !== null || fish !== undefined) {
        $scope.fish = fish;
      }
    });
  };

  if (booking.resource.locktypes.indexOf('smartphone') < 0 && booking.resource.locktypes.indexOf('chipcard') >= 0) {
    $scope.getFish();
  }

  /*
  * Booking alterations
  */
  $scope.editBooking = function(booking) {
    if( !$scope.showBookingForm ) {
      $scope.showBookingForm = true;
      return;
    }
    alertService.load();
    bookingService.alterRequest({
      booking: booking.id,
      timeFrame: {
        startDate: booking.beginRequested,
        endDate: booking.endRequested
      },
      remark: booking.remarkRequester
    })
    .then(function (booking) {
      Analytics.trackEvent('altered', 'success', booking.id, undefined, true);
      $scope.booking = booking;
      $state.reload();
      initPermissions();
      if (booking.beginRequested) {
        alertService.add('info', $filter('translate')('BOOKING_ALTER_REQUESTED'), 5000);
      } else {
        alertService.add('success', $filter('translate')('BOOKING_ALTER_ACCEPTED'), 5000);
      }
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.cancelBooking = function (booking) {
    var promise = function() {
      return dialogService.showModal({templateUrl: 'booking/show/dialog-cancel.tpl.html'}, {
        closeButtonText: $translate.instant('CLOSE'),
        actionButtonText: $translate.instant('CONFIRM'),
        headerText: $translate.instant('CANCEL_BOOKING'),
        bodyText: $translate.instant('BOOKING.CANCEL.CONFIRM_TEXT'),
        contract: contract,
        booking: booking,
        me: $scope.me,
      });
    };
    if($scope.requested){
      promise = function() { return $q.when(true); };
    }

    promise()
    .then(function () {
      alertService.load();
      return bookingService.cancel({
        id: booking.id
      });
    })
    .then(function (booking) {
      Analytics.trackEvent('booking', $scope.userPerspective === 'owner' ? 'cancelled_owner' : 'cancelled_renter', booking.id, undefined, true);
      $scope.booking = booking;
      alertService.add('success', $filter('translate')('BOOKING_CANCELED'), 5000);
      $state.go('owm.person.dashboard');
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.stopBooking = function (booking) {
    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CLOSE'),
      actionButtonText: $translate.instant('CONFIRM'),
      headerText: $translate.instant('STOP_BOOKING'),
      bodyText: $translate.instant('BOOKING.STOP.CONFIRM_TEXT')
    })
    .then(function () {
      alertService.load();
      return bookingService.stop({
        booking: booking.id
      });
    })
    .then(function (booking) {
      $scope.booking = booking;
      $state.reload();
      initPermissions();
      $scope.initBookingRequestScope(booking);
      alertService.add('success', $filter('translate')('BOOKING_STOPPED'), 10000);
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.extendBooking = function(booking, hours) {
    booking.endRequested = moment(booking.endRequested).add('hours', hours).format(API_DATE_FORMAT);
  };

  $scope.acceptBooking = function (booking) {
    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CLOSE'),
      actionButtonText: $translate.instant('CONFIRM'),
      headerText: $translate.instant('BOOKING.ACCEPT.TITLE'),
      bodyText: $translate.instant('BOOKING.ACCEPT.INTRO')
    })
    .then(function () {
      var params = {
        booking: booking.id
      };

      if ($scope.userInput.acceptRejectRemark) {
        params.remark = $scope.userInput.acceptRejectRemark;
      }
      alertService.load();
      return bookingService.acceptRequest(params);
    })
    .then(function (booking) {
      Analytics.trackEvent('booking', 'accepted', booking.id, 4, undefined, true);
      $scope.booking = booking;
      $state.reload();
      initPermissions();
      alertService.add('success', $filter('translate')('BOOKING.ACCEPT.SUCCESS'), 5000);
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.rejectBooking = function (booking) {
    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CLOSE'),
      actionButtonText: $translate.instant('CONFIRM'),
      headerText: $translate.instant('BOOKING.REJECT.TITLE'),
      bodyText: $translate.instant('BOOKING.REJECT.INTRO')
    })
    .then(function () {
      var params = {
        booking: booking.id
      };
      if ($scope.userInput.acceptRejectRemark) {
        params.remark = $scope.userInput.acceptRejectRemark;
      }
      alertService.load();
      return bookingService.rejectRequest(params);
    })
    .then(function (booking) {
      Analytics.trackEvent('booking', 'rejected', booking.id, undefined, true);
      $scope.booking = booking;
      $state.reload();
      initPermissions();
      alertService.add('success', $filter('translate')('BOOKING.REJECT.SUCCESS'), 5000);
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };


  /*
  * Load extra drivers
  */
  $scope.extraDrivers = {
    loading: false,
    inviteRequests: [],
    invited: [],
    accepted: [],
    
    basis: ($scope.contract.type.id === 60) ? 'per_booking' : 'per_contract',
    load: function () {
      if ($scope.extraDrivers.basis === 'per_contract' && !$scope.perspective.isContractHolder) {
        $scope.extraDrivers.noPermission = true;
        return;
      }

      if ($scope.userPerspective !== 'owner') { // to avoid permission problem for now

        $scope.extraDrivers.loading = true;

        var promise = ($scope.extraDrivers.basis === 'per_booking')  ?
          extraDriverService.driversForBooking({ booking: $scope.booking.id }) :
          extraDriverService.getRequestsForContract({ contract: $scope.contract.id });

        promise
        .then(function (inviteRequests) {
          if (inviteRequests.result && _.isArray(inviteRequests.result)) {
            inviteRequests = inviteRequests.result;
          }
          if ($scope.userPerspective === 'owner') {
            inviteRequests = inviteRequests.filter(function (request) {
              return request.status === 'accepted';
            });
          }
          $scope.extraDrivers.inviteRequests = inviteRequests;
          $scope.extraDrivers.invited = $scope.extraDrivers.inviteRequests.filter(function (inviteRequest) {
            return inviteRequest.status === 'invited';
          });
          $scope.extraDrivers.accepted = $scope.extraDrivers.inviteRequests.filter(function (inviteRequest) {
            return inviteRequest.status === 'accepted';
          });
        })
        .catch(function (e) {
          alertService.addError(e);
        })
        .finally(function () {
          $scope.extraDrivers.loading = false;
        });
      }
    },
    hasInvited: function () {
      return $scope.extraDrivers.invited.length > 0;
    },
    remove: function (inviteRequest, $event) {
      var confirm = $mdDialog.confirm()
            .title('Extra bestuurder verwijderen?')
            .textContent('Weet je zeker dat je deze persoon als extra bestuurder van de rit wilt verwijderen?')
            .ok('Akkoord')
            .cancel('Annuleren');
      
      $mdDialog.show(confirm).then(function () {
        $scope.extraDrivers.removeForSure(inviteRequest);
      });
    },
    removeForSure: function (inviteRequest) {
      return extraDriverService.removeDriver({
        booking: $scope.booking.id,
        email: inviteRequest.recipient.email,
      })
      .then(function () {
        $scope.extraDrivers.load();
      });
    },
  };
  $timeout($scope.extraDrivers.load, 50);


  /*
  * Load availability
  */
  $scope.availability = null;
  $scope.isAvailabilityLoading = false;
  var timer;

  $scope.$watch('[bookingRequest.beginRequested, bookingRequest.endRequested]', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      onTimeFrameChange();
    }
  }, true);

  function onTimeFrameChange() {
    $scope.extraCredit = false;
    $timeout.cancel(timer);
    timer = $timeout(function () {
      loadAvailability();
    }, 100);
  }

  function loadAvailability() {
    var dfd = $q.defer();
    var b = $scope.bookingRequest;
    var r = $scope.resource;
    $scope.availability = null;

    if (b.beginRequested && b.endRequested && $scope.userPerspective==='renter') {
      $scope.isAvailabilityLoading = true;
      resourceService.checkAvailability({
        resource: r.id,
        booking: b.id,
        timeFrame: {
          startDate: b.beginRequested,
          endDate: b.endRequested
        }
      })
      .then(function (isAvailable) {
        $scope.availability = { available: isAvailable ? 'yes' : 'no' };
        dfd.resolve($scope.availability);
      })
      .catch(function () {
        $scope.availability = { available: 'unknown' };
        dfd.resolve($scope.availability);
      })
      .finally(function () {
        $scope.isAvailabilityLoading = false;
      });
    }
    return dfd.promise;
  }

  /*
  * Chat
  */
  $scope.openChatWith = openChatWith;
  function openChatWith(otherPerson) {
    var otherPersonName = $filter('fullname')(otherPerson);
    chatPopupService.openPopup(otherPersonName, otherPerson.id, booking.resource.id, booking.id);
  }

  /*
  * Discount
  */
  loadDiscount();

  $scope.discount = [];

  function loadDiscount() {
    discountUsageService.search({
      booking: $scope.booking.id
    })
    .then(function (discount) {
      $scope.discount = discount;
    });
  }

  function addDiscount(value) {
    return discountService.apply({
      booking: booking.id,
      discount: value
    }).then(function (discount) {
      $scope.discount.push(discount);
      $rootScope.discountAdded = true;
      alertService.addSaveSuccess('De kortingscode is toegevoegd aan je boeking.');
      if ($scope.paymentInit) {
        $scope.bookingChanged(booking);
      }
      $mdDialog.cancel();
    }).catch(function (err) {
      alertService.addError(err);
    });
  }

  $scope.openDiscountDialog = function () {
    $mdDialog.show({
      fullscreen: $mdMedia('lg'),
      preserveScope: true,
      locals: {
      },
      scope: $scope,
      templateUrl: 'discount/discountBookingDialog.tpl.html',
      controller: ['$scope', '$mdDialog', '$mdMedia', function ($scope, $mdDialog, discountService, contractService) {

        $scope.checkingDiscountCode = false;
        $scope.hide = function () {
          $mdDialog.hide();
        };

        $scope.save = function () {
          addDiscount($scope.discountCode);
        };

        $scope.cancel = function () {
          $mdDialog.cancel();
        };
      }]
    });
  };

  /*
  * Load declarations
  */
  if($scope.allowDeclarations) {
    loadDeclarations();
  }

  function loadDeclarations() {
    declarationService.forBooking({
      booking: booking.id
    })
    .then(function(res) {
      $scope.booking.declarations = res;
    })
    .catch(function(err) {
      alertService.add('danger', 'Tankbonnen konden niet opgehaald worden.', 4000);
    });
  }

  /*
  * Payment
  */
  $scope.buyVoucher = function (value) {
    Analytics.trackEvent('payment', 'started', undefined, undefined, true);
    if (!value || value < 0) {
      return;
    }
    alertService.load($scope);
    $location.url($location.path());
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
        if ($scope.extraCredit) {
          // TODO test
          payRedirect(data.url, {
            redirect: {
              state: 'owm.booking.show',
              params: {
                bookingId: $scope.booking.id,
                start: moment($scope.bookingRequest.beginRequested).format('YYMMDDHHmm'),
                end: moment($scope.bookingRequest.endRequested).format('YYMMDDHHmm'),
              },
            },
          });
        } else {
          payRedirect(data.url, {
            redirect: {
              state: 'owm.booking.show',
              params: {
                bookingId: $scope.booking.id,
              },
            },
          });
        }
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded($scope);
      });
  };

  updateBookingTimesAfterPayment();

  //change booking times if user has bought voucher via Pay
  function updateBookingTimesAfterPayment() {
    $scope.paymentError = false;
    $scope.alteredAfterBuyVoucher = false;

    if ($stateParams.orderStatusId <= 0) {
      $scope.paymentError = true;
    }

    if ($stateParams.end && $stateParams.orderStatusId > 0) {
      bookingService.alterRequest({
        booking: booking.id,
        timeFrame: {
          startDate: moment($stateParams.start, 'YYMMDDHHmm').format(API_DATE_FORMAT),
          endDate: moment($stateParams.end, 'YYMMDDHHmm').format(API_DATE_FORMAT)
        }
      })
      .then(function (booking) {
        Analytics.trackEvent('altered', 'success', booking.id, undefined, true);
        $scope.booking = booking;
        $scope.initBookingRequestScope(booking);
        $state.reload();
        initPermissions();
        $scope.alteredAfterBuyVoucher = true;
        if (booking.beginRequested) {
          alertService.add('info', $filter('translate')('BOOKING_ALTER_REQUESTED'), 5000);
        } else {
          alertService.add('success', $filter('translate')('BOOKING_ALTER_ACCEPTED'), 5000);
        }
      })
      .catch(function (error) {
        alertService.add('danger', error.message, 5000);
      })
      .finally(function () {
        alertService.loaded();
      });
    }
  }

  $scope.paymentInit = $scope.perspective.pageView === 'renting' && !$scope.progress.steps.payment.checked;

  // open payment block to add extra driver
  $scope.addExtraDriver = false;

  $scope.addExtraDriverButton = function () {
    $scope.addExtraDriver = true;
    reload().then(function () {
      $('html, body').stop().animate({ scrollTop: $('#bookingPayment').offset().top }, 300, 'swing');
    });
  };

  $rootScope.$watch('extraDriverAdded', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      reload();
      $rootScope.extraDriverAdded = false;
    }
  }, true);

  // check if person is renter and needs to pay the booking
  if($scope.paymentInit && ($scope.userPerspective === 'renter' || $scope.userPerspective === 'contract_holder')) {

/*
    // check if person has already approved bank accounts
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
*/

    $scope.vouchers = null;
    $scope.requiredValue = null;
    $scope.credit = null;
    $scope.debt = null;

    reload();

  }

  $scope.bookingChanged = function() {
    $log.log('bookingChanged');
    reload();
  };

  $scope.bookingDriversChanged = function() {
    $log.log('bookingDriversChanged');
    reloadRequiredValue();
    $scope.extraDrivers.load();
  };

  function reloadRequiredValue() {
    alertService.load();

    $q.all([ getRequiredValue() ]).finally(function () {
      alertService.loaded();
    });
  }

  function reload() {
    $rootScope.isPaymentLoading = true;
    alertService.load();

    return $q.all([ getVouchers(), getRequiredValue(), getCredit(), getDebt() ]).finally(function () {
      alertService.loaded();
      $rootScope.isPaymentLoading = false;
    });
  }

  function getVouchers() {
    var promise = voucherService.search({ person: me.id, minValue: 0 });
    promise.then(function (vouchers) {
      $scope.vouchers = vouchers;
    })
      .catch(function (err) {
        $scope.vouchers = [];
      });
    return promise;
  }

  function getRequiredValue() {
    var promise = voucherService.calculateRequiredCredit({ person: me.id });
    promise.then(function (value) {
      $scope.requiredValue = { value: value };
    })
      .catch(function (err) {
        $scope.requiredValue = { error: err };
      });
    return promise;
  }

  function getCredit() {
    var promise = voucherService.calculateCredit({ person: me.id });
    promise.then(function (credit) {
      $scope.credit = { value: credit };
    })
      .catch(function (err) {
        $scope.credit = { error: err };
      });
    return promise;
  }

  function getDebt() {
    var promise = voucherService.calculateDebt({ person: me.id });
    promise.then(function (debt) {
      $scope.debt = { value: debt };
    })
      .catch(function (err) {
        $scope.debt = { error: err };
      });
    return promise;
  }

  /*
  * Error handling
  */
  function errorHandler(err) {
    if (err && err.level && err.message) {
      $scope.extraCredit = false;
      if(err.message.match('onvoldoende')) {
        $scope.extraCredit = err.data.extra_credit;
        $scope.errorExtraCredit = err.message + '. Betaal ' + err.data.extra_credit + ' euro extra rijtegoed om de rit te kunnen verlengen.';
      } else {
        alertService.add(err.level, err.message, 5000);
      }
    } else {
      //alertService.addGenericError();
    }
    if(!err.message || !err.message.match('onvoldoende')) {
      $scope.initBookingRequestScope($scope.booking);
    }
  }

  /*
  * Other
  */
  $scope.goToPrevious = function() {
    $state.go($rootScope.previousState, $rootScope.previousStateParams, {reload: true, inherit: false, notify: true});
  };

});