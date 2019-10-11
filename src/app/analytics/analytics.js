'use strict';

/*
  The Analytics methodology has changed per dec 2018.

  See `https://gist.github.com/kelleyvanevert/590813337f0ebf3fc8e97b52c65cb39e`
   for a more detailed description.

  The current setup involves:
  1. Manually registering the GTM tag in the `googleTagManager` provider
      - the provider below, and the actual config/init happens in `app.js`
  2. The Angulartics package, and a plugin for GTM (the two module dependencies below)
  3. A GTM configuration (in the GTM interface, that is), which delegates
      pageviews and events to Google Analytics,
      but is open-ended in possible usage.
*/

angular.module('openwheels.analytics', [
  'angulartics',
  'angulartics.google.tagmanager',
])

// proxy the old `Analytics.XX` methods to
//  the new Angulartics implementation
.provider('Analytics', function () {
  this.$get = function ($log, $analytics) {
    return {
      trackEvent: function (category, action, label, value, noninteraction) {
        $log.debug('Analytics.trackEvent', arguments);
        $analytics.eventTrack(action, {
          category: category,
          label: label,
          value: value,
          noninteraction: noninteraction,
        });
        if (window.LogRocket) {
          window.LogRocket.track(category + ':' + action);
        }
      },
    };
  };
})

// proxy the old `ga-track-event` directive to
//  the new Angulartics implementation
.directive('gaTrackEvent', function (Analytics) {
  return {
    restrict: 'A',
    scope: {
      options: '=gaTrackEvent',
      condition: '=gaTrackEventIf',
    },
    link: function (scope, element, attrs) {
      element.bind('click', function () {
        if (attrs.gaTrackEventIf) {
          if (!scope.condition) {
            return; // Cancel this event if we don't pass the ga-track-event-if condition
          }
        }
        if (scope.options) {
          Analytics.trackEvent.apply(Analytics, scope.options);
        }
      });
    }
  };
})

// This is just a custom piece of code, because
//  apparently `angulartics.google.tagmanager` doesn't
//  actually do the registering, and just uses
//  the current global `dataLayer` variable instead.
// Hence, we have to register ourselves.
.provider('googleTagManager', function () {

  this.init = function (gtmContainerId) {

    // log container id
    console.log('GTM', gtmContainerId);

    /* jshint ignore:start */
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', gtmContainerId);
    /* jshint ignore:end */
  };

  this.$get = ['$log', function ($log) {
    return angular.noop;
  }];
})

// This is Angulartics (confusingly providing `$analytics`)
.config(function ($analyticsProvider) {
  // noop
});






/*
LIST OF ALL EVENTS

BOOKING - DONE
  + created_pre
    - label: (boolean) isAuthenticated
    - triggers:
        - reservationForm.tpl click button
          * condition: button not disabled

  + created_post
    - label: booking.id
    - value: fixed number 11 iif owner 282, 4 if isConfirmationRequiredOthers = false, else undefined
    - triggers:
        - reservationForm.js then after booking.create

  + cancelled_renter
    - label: booking.id
    - value:
    - triggers:
        - BookingShowController.js then after bookingService.cancel

  + cancelled_owner
    - label: booking.id
    - value:
    - triggers:
        - BookingShowController.js then after bookingService.cancel

  + rejected
    - label: booking.id
    - value:
    - triggers
      - BookingModule.js OnEnter state owm.booking.reject
      - BookingShowController.js then after bookingService.rejectRequest

  + accepted
    - label: booking.id
    - value: 4
    - triggers
      - BookingModule.js OnEnter state owm.booking.accept
      - BookingShowController.js then after bookingService.acceptRequest

  + altered
    - label: booking.id
    - value:
    - triggers
      - BookingShowController.js then after bookingService.alterRequest

  + form_interaction
    - label:
    - value:

  + discount_applied
    - label:
    - value:
    - triggers
      - ReservationFrom.js then after discountService.isApplicable

  + tripdata_entered
    - label: booking.id
    - value:
    - triggers
      - BookingAdministerController then after bookingService.setTrip


RESOURCE - DONE
  + resource_created
    - label: resource.id
    - value:
    - triggers
      - ResourceCreateController then after resourceService.create

  + discount_created
    - label: resource.id
    - value:
    - triggers
      - discountList.js then after $mdDialog.show

  + picture_uploaded
    - label: resource.id
    - value:
    - triggers
      - ResourceEditPicturesController then after resourceService.addPicture

  + info_edited
    - label: resource.id
    - value:
    - triggers
      - ResourceEditSharingsettingsController then after resourceService.alter

  + calendar_edited
    - label: resource.id
    - value:
    - triggers
      - ResourceShowCalendarController then after calendarService.createPeriodic
      - ResourceShowCalendarController then after calendarService.createBlock


PERSON - DONE
  + created
    - label: person.id
    - value:
    - triggers
      - signupFormDirective.js then afther oauthService.subscribe

  + edited
    - label: person.id
    - value:
    - triggers
      - PersonDataDirective.js then after PersonService
      - AboutMeController then after PersonService

    + isFacebookSignUp
      - label: person.id
      - value:
      - triggers
      - PersonDashboardController.js

  + driverlicense_uploaded
    - label: person.id
    - value:
    - triggers
      - PersonLicenceController then after PersonService
      - DetailsController then after PersonService

  + profilepicture_uploaded
    - label: person.id
    - value:
    - triggers
      - AboutMeController then after PersonService

  + contract_ended
    - label: contract.id
    - value:
    - triggers
      - PersonContractIndexController then after contractService.alter


DISCOVERY - DONE
  + search
    - label: (boolean) isAuthenticated
    - value:
    - triggers
      - ResourceSearchController then after resourceService.searchV2

  + filters_applied
    - label:
    - value:
    - triggers
      - ResourceSearchController in sidebarFiltersChanged()
      - ResourceSearchController then after results

  + show_car
    - label: resource_id
    - value:
    - triggers
      - ResourceShowController first lines of controller

  + show_calendar
    - label: resource.id
    - value:
    - triggers
      - ResourceShowCalendarController first lines of controller

  + send_message
    - label: resource_id
    - value:
    - triggers
      - chatPopupController then after messageService.sendMessageTo


PAYMENT - DONE
  + started
    - label:
    - value:
    - triggers
      - vouchersController in buyVoucher()

  + failed
    - label:
    - value:
    - triggers
      - paymentResultController in init()

  + success
    - label:
    - value:
    - triggers
      - paymentResultController in init()

*/
