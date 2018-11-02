'use strict';

angular.module('owm.resource.edit', [
  'owm.resource.edit.data',
  'owm.resource.edit.sharing_settings',
  'owm.resource.edit.price',
  'owm.resource.edit.members',
  'owm.resource.edit.location',
  'owm.resource.edit.pictures'
])

.controller('ResourceEditController', function ($timeout, $state, $scope, me, resource, members, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/auto/' + resource.id + '/wijzigen'});
  metaInfoService.set({canonical: 'https://mywheels.nl/auto/' + resource.id + '/wijzigen'});

  // PERMISSION CHECK
  // Redirect if not owner or contactperson
  $scope.hasPermission = false;
  if (resource.owner.id !== me.id && resource.contactPerson.id !== me.id) {
    $state.go('owm.resource.show', {
      resourceId: resource.id,
      city: (resource.city || '').toLowerCase().replace(/ /g, '-')
    });
  } else {
    $scope.hasPermission = true;
  }

  $scope.me = me;
  $scope.resource = resource;
  $scope.members = members;
  $scope.isLocationCollapsed = true;

  // $scope.hiddenCards = {};

  // if ($scope.resource.isAvailableOthers !== false) {
  //   $scope.hiddenCards.friends = true;
  // }
  // if ($scope.features.friendsOfCar !== false) {
  //   $scope.hiddenCards.friends = false;
  // }

  $scope.toggleLocation = function () {
    $scope.isLocationCollapsed = !!!$scope.isLocationCollapsed;
    if (!$scope.isLocationCollapsed) {
      // notify google maps to redraw itself when container is fully expanded
      $timeout(function () {
        $scope.$broadcast('collapseContainerVisible');
      }, 0);
    }
  };

  // $scope.$on('ResourceEditSharingsettings:AvailableOthersChange', function (event, isAvailableOthers) {
  //   if (!isAvailableOthers) {
  //     delete $scope.hiddenCards.friends;
  //   } else {
  //     $scope.hiddenCards.friends = true;
  //   }
  // });
});
