'use strict';

angular.module('owm.trips', [
  'owm.trips.index'
])

.config(function config($stateProvider) {

  $stateProvider

  .state('owm.trips', {
    url: '/trips?start&end&cancelled&otherOnContract',
    views: {
      'main-full@shell': {
        templateUrl: 'trips/index/tripsIndex.tpl.html',
        controller: 'TripsIndexController'
      }
    },
    data: {
      access: { deny: { anonymous: true } }
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.me();
      }]
    }
  });

});


