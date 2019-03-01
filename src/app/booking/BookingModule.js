'use strict';

angular.module('owm.booking', [
  'owm.booking.list',
  'owm.booking.list-rental',
  'owm.booking.show',
  'owm.booking.rating',
  'owm.booking.administer'
])

.config(function config($stateProvider) {

  $stateProvider

  .state('owm.booking', {
    abstract: true,
    url: '/booking/:bookingId?start&end&orderStatusId',
    views: {
      'main@shell': {
        template: '<div ui-view></div>'
      }
    },
    data: {
      denyAnonymous: true
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.me();
      }],
      booking: ['$stateParams', 'bookingService', function ($stateParams, bookingService) {
        return bookingService.get({
          id: $stateParams.bookingId
        });
      }],
      contract: ['$stateParams', 'contractService', function ($stateParams, contractService) {
        return contractService.forBooking({
          booking: $stateParams.bookingId
        })
        .then(function(contract) {
          contract.type.canHaveDeclaration = false;
          if(contract.type.id === 50 || contract.type.id === 60 || contract.type.id === 62 || contract.type.id === 63 || contract.type.id === 64 || contract.type.id === 75) {
            contract.type.canHaveDeclaration = true;
          }
          return contract;
        });
      }],
      resource: ['booking', function (booking) {
        return booking.resource;
      }],
      perspective: ['me', 'contract', 'booking', 'resource', function (me, contract, booking, resource) {

        var perspective = {};


        // First, the facts
        // ================

        // Jij bent de eigenaar van het contract waarop de boeking gemaakt is
        //  (of je de boeking nu zelf hebt gemaakt, of dat dat iemand op jouw contract was).
        perspective.isContractHolder = (contract.contractor.id === me.id);

        // Jij bent degene die de boeking heeft gemaakt
        //  (of dat nu op je eigen contract is, of iemand anders' contract).
        perspective.isRenter = (booking.person.id === me.id);

        // Jij bent de eigenaar van de auto.
        // (Je kunt tegelijkertijd ook de huurder zijn! B.v. bij MW Open.)
        perspective.isOwner = (resource.owner.id === me.id);

        perspective.isContractor = perspective.isContractHolder && !perspective.isRenter;


        // Then, the UI logic
        // ==================

        // In principe zijn 7 van de 8 combinaties hiervan zijn mogelijk,
        //  maar we willen toch maar 1 'view'
        if (perspective.isRenter) {
          // - not owner + not contract holder => "contractant" i.e. renting on someone else's contract
          // - not owner +     contract holder => normal rent
          // -     owner + not contract holder => [a bit weird but technically possible]
          //                                      renting your own car on someone else's contract
          //                                      (possibly this is your work-contract or something...)
          // -     owner +     contract holder => renting your own car
          //                                      (normal for the lease-construction)
          perspective.pageView = 'renting';
        }
        else if (perspective.isOwner) {
          // - not contract holder => normal renting out situation
          // -     contract holder => [weird but technically possible]
          //                          someone is renting your car on your contract
          //                          (maybe the child of someone in a lease construction or something...)
          perspective.pageView = 'rentingOut';
        }
        else /*if (perspective.isContractHolder)*/ {
          // you are the contract-holder, and you're now viewing
          //  this rental action
          perspective.pageView = 'renting';
        }


        return perspective;
      }],
    }
  })

  .state('owm.booking.show', {
    url: '',
    views: {
      'main@shell': {
        templateUrl: 'booking/show/booking-show.tpl.html',
        controller: 'BookingShowController',
      },
      'main-full@shell': {
        templateUrl: 'booking/show/booking-show-2.tpl.html',
        controller: 'BookingShowController',
      },
    },
  })


  /**
   * Accept a booking & redirect to booking detail
   */
  .state('owm.booking.accept', {
    url: '/accept',
    onEnter: ['$state', '$stateParams', '$filter', 'alertService', 'bookingService', 'Analytics',
     function ($state ,  $stateParams ,  $filter ,  alertService ,  bookingService, Analytics) {

      var bookingId = $stateParams.bookingId;
      bookingService.acceptRequest({ booking: bookingId }).then(function (booking) {
        Analytics.trackEvent('booking', 'accepted', bookingId, 4, undefined, true);
        alertService.add('success', $filter('translate')('BOOKING.ACCEPT.SUCCESS'), 8000);
      })
      .catch(alertService.addError)
      .finally(function () {
        $state.go('owm.booking.show', { bookingId: bookingId });
      });
    }]
  })

  /**
   * Reject a booking & redirect to booking detail
   */
  .state('owm.booking.reject', {
    url: '/reject',
    onEnter: ['$state', '$stateParams', '$filter', 'alertService', 'bookingService', 'Analytics',
     function ($state ,  $stateParams ,  $filter ,  alertService ,  bookingService, Analytics) {

      var bookingId = $stateParams.bookingId;
      bookingService.rejectRequest({ booking: bookingId }).then(function (booking) {
        Analytics.trackEvent('booking', 'rejected', bookingId, undefined, true);
        alertService.add('success', $filter('translate')('BOOKING.REJECT.SUCCESS'), 8000);
      })
      .catch(alertService.addError)
      .finally(function () {
        $state.go('owm.booking.show', { bookingId: bookingId });
      });
    }]
  })

  .state('owm.booking.rating-renter', {
    url: '/rating/renter?setsatisfaction',
    templateUrl: 'booking/rating/booking-rating.tpl.html',
    controller: 'BookingRatingController',
    data: {
      requiredFeatures: ['ratings']
    },
    resolve: {
      rating: ['booking', 'ratingService', function (booking, ratingService) {
        return ratingService.getPrefill({ trip: booking.trip.id }).then(function (prefilledRating) {
          return prefilledRating || {};
        });
      }],
      userPerspective: function () {
        return 'renter';
      }
    }
  })

  .state('owm.booking.rating-owner', {
    url: '/rating/owner?setsatisfaction',
    templateUrl: 'booking/rating/booking-rating.tpl.html',
    controller: 'BookingRatingController',
    data: {
      requiredFeatures: ['ratings']
    },
    resolve: {
      rating: ['booking', 'ratingService', function (booking, ratingService) {
        return ratingService.getPrefill({ trip: booking.trip.id }).then(function (prefilledRating) {
          return prefilledRating || {};
        });
      }],
      userPerspective: function () {
        return 'owner';
      }
    }
  })

  .state('owm.booking.administer', {
    url: '/administer',
    templateUrl: 'booking/administer/booking-administer.tpl.html',
    controller: 'BookingAdministerController'
  })
  
  .state('owm.booking.finalize', {
    url: '/finalize',
    templateUrl: 'booking/administer/booking-finalize.tpl.html',
    controller: 'BookingFinalizeController'
  })
  ;

})
;
