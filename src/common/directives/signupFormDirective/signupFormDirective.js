'use strict';

angular.module('signupFormDirective', [])

.directive('signupForm', function () {
  return {
    restrict: 'AE',
    replace: true,
    transclude: true,
    templateUrl: 'directives/signupFormDirective/signupFormDirective.tpl.html',
    controller: function ($scope, $rootScope, $state, $stateParams, $translate, $q, authService, featuresService, alertService, personService, $mdDialog, Analytics, appConfig, $localStorage, $window) {
      $scope.auth = {};
      $scope.user = {};
      $scope.me = {};
      $scope.auth.terms = false;
      $scope.closeAlert = alertService.closeAlert;
      if ($rootScope.prefilledMail) {
        $scope.auth.email = $rootScope.prefilledMail;
      }

      $scope.facebookSignup = function() {
        var booking = $scope.booking;
        var resource = $scope.resource;
        var data;
        if(resource && booking) { // opgeroepen vanaf huur een auto page
          data = { // should fill in the details
            pageNumber: '1',
            city: resource.city ? resource.city : 'utrecht',
            resourceId: resource.id,
            startDate: booking.beginRequested,
            endDate: booking.endRequested,
            discountCode: booking.discountCode,
            remarkRequester: booking.remarkRequester,
            riskReduction: booking.riskReduction,
            preference: 'renter',
            flow: 'booking'
          };
          $localStorage.booking_before_signup = data;
        } else if ($state.current.name === 'list-your-car') { // opgeroepen vanuit verhuur je auto flow
          data = { // should fill in the details
            preference: 'owner',
            flow: 'add_resource',
            dayPrice: $scope.calculateYourPrice.dayPrice,
            numberOfDays: $scope.calculateYourPrice.numberOfDays,
            licencePlate: $scope.licencePlate.content,
            brand: $scope.brand,
            model: $scope.model,
            seats: $scope.seats,
            color: $scope.color,
            fuel: $scope.fuel,
            type: $scope.type,
            year: $scope.year,
            personSubmitted: false
          };
          $localStorage.booking_before_signup = data;
        } else {
          data = { // should fill in the details
            preference: undefined,
            flow: undefined,
          };
          $localStorage.booking_before_signup = data;
          // do nothing
        }
        var url = appConfig.serverUrl+'/fb/redirect/t';
        $window.location.href = url;
      };

      var initOptions = function () {
        $scope.preferenceOptions = [{
          label: '',
          value: false
        }, {
          label: $translate.instant('USER_PREFERENCE_RENTER'),
          value: 'renter'
        }, {
          label: $translate.instant('USER_PREFERENCE_OWNER'),
          value: 'owner'
        }, {
          label: $translate.instant('USER_PREFERENCE_BOTH'),
          value: 'both'
        }];
      };

      $scope.$on('$translateChangeSuccess', function () {
        initOptions();
      });
      initOptions();

      if (featuresService.get('hideSignupPreference')) {
        $scope.user.preference = 'both';
      } else {
        if ($state.previous.name === 'owm.resource.own') {
          $scope.user.preference = 'owner';
        } else {
          $scope.user.preference = false;
        }
      }
      $scope.login = function () {
        if($scope.cancel !== undefined && typeof $scope.cancel === 'function') {
          $scope.cancel();
        }
        authService.loginPopup().then(function () {
          if ($state.current.name === 'home' || $state.current.name === 'owm.auth.signup') {
            $state.go('owm.person.dashboard');
          }
        });
      };

      $scope.signup = function () {
        alertService.load();
        if ($scope.url === 'owm.person.details({pageNumber: \'1\'})') {
          $scope.user.preference = 'renter';
        } else if ($scope.url === 'owm.resource.create.carInfo') {
          $scope.user.preference = 'owner';
        }

        if($scope.inviter) {
          $scope.user.invited_by = $scope.inviter.id;
        }

        var email = $scope.auth.email,
          password = $scope.auth.password,
          user = $scope.user,
          terms = $scope.auth.terms,
          preference = user.preference;

        // var captcha = user.captcha;

        if (user.firstName) {
          if (email) {
            if (password) {
              if (preference) {
                if (terms === true) {
                  authService.oauthSubscribe({
                      email: email.trim().toLowerCase(),
                      password: password,
                      other: user
                      // captcha: captcha
                    }).then(function (res) {
                      Analytics.trackEvent('person', 'created', res.id, undefined, true);
                      if ($scope.url === 'owm.person.details({pageNumber: \'1\'})') {
                        var booking = $scope.booking;
                        var resource = $scope.resource;
                        $mdDialog.cancel();
                        $state.go('owm.person.details', { // should fill in the details
                          pageNumber: '1',
                          city: resource.city ? resource.city : 'utrecht',
                          resourceId: resource.id,
                          startDate: booking.beginRequested,
                          endDate: booking.endRequested,
                          discountCode: booking.discountCode,
                          remarkRequester: booking.remarkRequester,
                          riskReduction: booking.riskReduction
                        });
                      } else if ($scope.url === 'owm.resource.create.carInfo') {
                        var licencePlate = $scope.licencePlate;
                        var calculateYourPrice = $scope.calculateYourPrice;
                        var brand = $scope.brand;
                        var model = $scope.model;
                        var seats = $scope.seats;
                        var color = $scope.color;
                        var fuel = $scope.fuel;
                        var type = $scope.type;
                        var year = $scope.year;
                        $mdDialog.cancel();

                        $state.go('owm.resource.create.carInfo', { // should fill in the details
                          licencePlate: licencePlate.content,
                          dayPrice: calculateYourPrice.dayPrice,
                          numberOfDays: calculateYourPrice.numberOfDays,
                          brand: brand,
                          model: model,
                          seats: seats,
                          color: color,
                          fuel: fuel,
                          type: type,
                          year: year
                        });
                      } else {
                        $state.go($scope.url);
                      }
                    })
                    .catch(function (err) {
                      alertService.add(err.level, err.message, 4000);
                    })
                    .finally(function () {
                      alertService.loaded();
                    });
                } else {
                  alertService.add('danger', $translate.instant('SIGNUP_AGREE_TO_TERMS_ALERT'), 4000);
                  alertService.loaded();
                }
              } else {
                alertService.add('danger', $translate.instant('SIGNUP_RENTER_OWNER_CHOICE_ALERT'), 4000);
                alertService.loaded();
              }
            } else {
              alertService.add('danger', $translate.instant('SIGNUP_FILL_IN_PASSWORD_ALERT'), 4000);
              alertService.loaded();
            }
          } else {
            alertService.add('danger', $translate.instant('SIGNUP_FILL_IN_MAIL_ALERT'), 4000);
            alertService.loaded();
          }
        } else {
          alertService.add('danger', $translate.instant('SIGNUP_FILL_IN_FIRSTNAME_ALERT'), 4000);
          alertService.loaded();
        }
      };
    }
  };
});
