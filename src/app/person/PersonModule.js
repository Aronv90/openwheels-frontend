'use strict';

angular.module('owm.person', [
  'owm.person.dashboard',
  'owm.person.intro',
  'owm.person.profile',
  'owm.person.contractchoice',
  'owm.person.details',
  'owm.person.aboutme',
  'owm.person.action.payinvoicegroup',
  'owm.person.invite-requests',
  'owm.person.license',
  'owm.person.anwbId',
  'owm.person.account',
  'owm.person.fileread',
])

.config(function config($stateProvider) {
  /**
   * person
   */
  $stateProvider.state('owm.person', {
    abstract: true,
    url: '/dashboard',
    data: {
      access: {
        deny: {
          anonymous: true
        }
      }
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.me();
      }],
      homeAddressPrefill: ['me', 'makeHomeAddressPrefill', function (me, makeHomeAddressPrefill) {
        return makeHomeAddressPrefill(me);
      }],
      person: ['personService', function (personService) {
        return personService.me({
          version: 2
        });
      }],

      bookingList: ['$stateParams', 'me', 'authService', 'bookingService', 'API_DATE_FORMAT', function ($stateParams, me, authService, bookingService, API_DATE_FORMAT) {
        var timeFrame = {
          startDate: moment().add(-1, 'day').format(API_DATE_FORMAT),
          endDate: moment().startOf('day').add(1, 'years').format(API_DATE_FORMAT)
        };
        if (me.preference === 'owner') {
          return {
            bookings: null,
            timeFrame: timeFrame
          };
        }
        return bookingService.getBookingList({
            person: me.id,
            timeFrame: timeFrame,
            cancelled: true,
            limit: 10
          })
          .then(function (bookings) {
            var tempCount = 0;

            if(bookings){
              if(bookings[0]){
                tempCount = bookings[0].count;
              }
            }

            return {
              bookings: bookings,
              totalBookings: tempCount,
              timeFrame: timeFrame
            };
          });
      }],

      hasBooked: ['person', 'bookingList', function (person, bookingList) {
        // if the user has any succesful bookings in the past, or any (open) booking (requests) in the future
        return (person.numberOfBookings + bookingList.totalBookings) > 0;
      }],

    }
  });
  /**
   * intro
   */
  $stateProvider.state('owm.person.intro', {
    abstract: false,
    url: '/intro',
    data: {
      access: {
        deny: {
          anonymous: true
        }
      }
    },
    views: {
      'main-full@shell': {
        templateUrl: 'person/intro/person-intro.tpl.html',
        controller: 'PersonIntroController'
      }
    },
  });
  /**
   * dashboard/aboutme
   */
  $stateProvider.state('owm.person.aboutme', {
    url: '/aboutme',
    redirectTo: 'owm.person.profile',
    redirectToParams: {
      highlight: 'profiel',
    },
    /*
    views: {
      'main@shell': {
        templateUrl: 'person/aboutme/about-me.tpl.html',
        controller: 'aboutMeController'
      }
    },*/
    // person
  });

  /**
   * dashboard/details
   */
  $stateProvider.state('owm.person.details', {
    url: '/details/:pageNumber?city&resourceId&bookingId&startDate&endDate&discountCode&remarkRequester&riskReduction',
    views: {
      'main-full@shell': {
        templateUrl: 'person/details/details-profile.tpl.html',
        controller: 'DetailsProfileController'
      }
    },
    // person
  });

  /**
   * dashboard
   */
  $stateProvider.state('owm.person.dashboard', {
    url: '',
    views: {
      'main-full@shell': {
        templateUrl: 'person/dashboard/person-dashboard-hero.tpl.html',
        controller: 'PersonDashboardController'
      }
    },
    resolve: {
      blogItems: ['$http', '$translate', function ($http, $translate) {
        return $translate('BLOG_URL')
          .then(function (url) {
            if (!url) {
              return {};
            }
            return $http.get(url);
          })
          .then(function (response) {
            var maxResults = 4;
            if (response.data && response.data.items) {
              return response.data.items.slice(0, maxResults);
            }
            return [];
          })
          .catch(function () {
            return [];
          });
      }],

      rentalList: ['$stateParams', 'me', 'authService', 'bookingService', 'API_DATE_FORMAT', function ($stateParams, me, authService, bookingService, API_DATE_FORMAT) {
        var timeFrame = {
          startDate: moment().startOf('day').add(-1, 'weeks').format(API_DATE_FORMAT),
          endDate: moment().endOf('day').add(1, 'years').format(API_DATE_FORMAT)
        };

        if (me.preference === 'renter') {
          return {
            bookings: null,
            timeFrame: timeFrame
          };
        }
        return bookingService.forOwner({
            person: me.id,
            timeFrame: timeFrame,
            limit: 10
          })
          .then(function (bookings) {
            var tempCount = 0;

            if(bookings){
              if(bookings[0]){
                tempCount = bookings[0].count;
              }
            }

            return {
              bookings: bookings,
              totalBookings: tempCount,
              timeFrame: timeFrame
            };
          });
      }],

      actions: ['actionService', 'me', function (actionService, me) {
        return actionService.all({
          person: me.id
        });
      }],
    }
  });

  /**
   * dashboard/profile
   */
  $stateProvider.state('owm.person.profile', {
    url: '/profile?highlight',
    /*params: {
      highlight: {
        value: 'profiel',
      },
    },*/
    views: {
      'main-full@shell': {
        templateUrl: 'person/profile/person-profile.tpl.html',
        controller: 'PersonProfileController'
      }
    },
    // person
  });


  /**
   * action
   */
  $stateProvider.state('owm.person.action', {
    abstract: true,
    url: '/action',
    views: {
      'main@shell': {
        template: '<ui-view></ui-view>'
      }
    }
  });

  /**
   * dashboard
   */
  $stateProvider.state('owm.person.action.resendactivationmail', {
    url: '/resendactivationmail',
    onEnter: ['me', 'personService', 'alertService', '$state', '$translate', function (me, personService, alertService, $state, $translate) {
      personService.alterEmail({
        id: me.id,
        email_adres: me.email
      }).then(function () {
          alertService.add('success', $translate.instant('ACTIVATION_MAIL_RESEND_SUCCESS'), 5000);
        },
        function () {
          alertService.add('warning', $translate.instant('ACTIVATION_MAIL_RESEND_FAIL'), 5000);
        }
      ).finally(function () {
        $state.go('owm.person.dashboard');
      });
    }]
  });

  /**
   * dashboard
   */
  $stateProvider.state('owm.person.action.payinvoicegroup', {
    url: '/payinvoicegroup?invoiceGroupId',
    templateUrl: 'person/action/payinvoicegroup/person-action-payinvoicegroup.tpl.html',
    controller: 'PersonActionPayInvoiceGroupController',
    resolve: {
      paymentData: ['$stateParams', 'idealService', function ($stateParams, idealService) {
        return idealService.payInvoiceGroup({
          invoiceGroup: $stateParams.invoiceGroupId
        });
      }]
    }

  });

  /**
   * dashboard/requests
   */
  $stateProvider.state('owm.person.invite-requests', {
    url: '/invite-requests',
    redirectTo: 'owm.person.profile.invite-requests',
  });
  $stateProvider.state('owm.person.profile.invite-requests', {
    url: '/invite-requests',
    views: {
      '@owm.person.profile': {
        templateUrl: 'person/action/requests/action-invite-requests.tpl.html',
        controller: 'ActionInviteRequestsController'
      }
    },
    resolve: {
      inviteRequestsBooking: ['me', 'extraDriverService', function (me, extraDriverService) {
        return extraDriverService.getRequestsForPerson({
          person: me.id,
          type: 'booking',
        });
      }],
      inviteRequestsContract: ['me', 'extraDriverService', function (me, extraDriverService) {
        return extraDriverService.getRequestsForPerson({
          person: me.id,
          type: 'contract',
        });
      }],
    }
  });

  /**
   * dashboard/chipcards
   */
  $stateProvider.state('owm.person.chipcard', {
    url: '/chipcard',
    redirectTo: 'owm.person.profile.chipcard',
  });
  $stateProvider.state('owm.person.profile.chipcard', {
    url: '/chipcards',
    views: {
      '@owm.person.profile': {
        templateUrl: 'person/chipcard/list/person-chipcards.tpl.html',
        controller: 'PersonChipcardsController'
      }
    },
    resolve: {
      chipcards: ['authService', 'chipcardService', function (authService, chipcardService) {
        var chipcardsPromise = authService.me().then(function (me) {
          return chipcardService.forPerson({
            person: me.id,
            onlyActive: true
          });
        });
        return chipcardsPromise;
      }]
    }
  });


  // dashboard/contracts
  $stateProvider.state('owm.person.contract', {
    url: '/contracts',
    redirectTo: 'owm.person.profile.contract',
  });
  $stateProvider.state('owm.person.profile.contract', {
    url: '/contracts',
    views: {
      '@owm.person.profile': {
        templateUrl: 'person/contract/index/person-contract-index.tpl.html',
        controller: 'PersonContractIndexController'
      }
    }
  });

  $stateProvider.state('owm.person.profile.contractchoice', {
    url: '/contractkeuze',
    views: {
      '@owm.person.profile': {
        templateUrl: 'person/contractchoice/contractchoice.tpl.html',
        controller: 'ContractChoiceController'
      }
    },
    data: {
      denyAnonymous: true
    },
    resolve: {
      person: ['authService', function (authService) {
        return authService.me();
      }],
      contracts: ['$stateParams', 'person', 'contractService', function ($stateParams, person, contractService) {
        return contractService.forContractor({
          person: person.id
        });
      }]
    }
  });


  $stateProvider.state('owm.person.anwbId', {
    url: '/anwb-id',
    views: {
      'main@shell': {
        templateUrl: 'person/anwbId/personAnwbId.tpl.html',
        controller: 'PersonAnwbIdController'
      }
    }
  });

  // dashboard/license
  $stateProvider.state('owm.person.license', {
    url: '/license',
    views: {
      'main@shell': {
        templateUrl: 'person/license/person-license.tpl.html',
        controller: 'PersonLicenseController'
      }
    },
    // person
  });

});
