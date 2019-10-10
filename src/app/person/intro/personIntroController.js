'use strict';

angular.module('owm.person.intro', [])

.controller('PersonIntroController', function ($scope, me, $state, $timeout, metaInfoService, Analytics, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/dashboard/intro'});
  metaInfoService.set({canonical: 'https://mywheels.nl/dashboard/intro'});

  activate();

  function activate() {
    $scope.openboxes = {};
    $scope.me = me;
  }

  if(me.status !== 'new') {
    Analytics.trackEvent('buglogging_v3', 'redirect_intro_to_dashboard', me.id + '_' + me.status, undefined, true);
    $timeout(function () {
      $state.go('owm.person.dashboard');
    }, 100);
  }

  $scope.toggleBox = function (box) {
    if (!$scope.openboxes[box]) {
      $scope.openboxes[box] = true;
    } else {
      $scope.openboxes[box] = !$scope.openboxes[box];
    }
  };

});
