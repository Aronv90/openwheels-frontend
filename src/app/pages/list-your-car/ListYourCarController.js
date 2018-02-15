'use strict';
angular.module('owm.pages.list-your-car', [])

.controller('listYourCarController', function ($scope, $state, $mdDialog, $log, $mdMedia, $filter) {

  $scope.openboxes = {};

  $scope.toggleBox = function (box) {
    if (!$scope.openboxes[box]) {
      $scope.openboxes[box] = true;
    } else {
      $scope.openboxes[box] = !$scope.openboxes[box];
    }
  };

  $scope.licencePlate = {
    content: '',
    data: false,
    showError: false,
    error: ''
  };
  $scope.calculateYourPrice = {
    total: 265,
    dayPrice: 30,
    numberOfDays: 4
  };

  //watch on changes on the form
  $scope.$watchCollection(function () {
    if ($scope.calculateYourPrice) {
      return $scope.calculateYourPrice;
    }
  }, function () {
    if ($scope.calculateYourPrice) {
      var sum = $scope.calculateYourPrice.numberOfDays * 12;
      $scope.calculateYourPrice.total = ($scope.calculateYourPrice.dayPrice + 5) * sum;
    }
  }, true);

  //the four buttons to add add an remove the number of days and dayPrice
  $scope.changePrice = function (e, change, elm, max) {
    if (change === '-') {
      if($scope.calculateYourPrice.dayPrice <= 15) {
        $scope.calculateYourPrice.dayPrice = 15;
      }
      else
      {
        if ($scope.calculateYourPrice[elm] > 0) {
          $scope.calculateYourPrice[elm]--;
        }
      }
    } else if (change === '+') {
      if ($scope.calculateYourPrice[elm] < max) {
        $scope.calculateYourPrice[elm]++;
      }
    }
  };

  $scope.beginRentingOut = function () {
    if ($scope.user.identity !== undefined && $scope.user.identity !== null) {
      $state.go('owm.resource.create.carInfo', { // should fill in the details
        licencePlate: $scope.licencePlate.content,
        brand: $filter('toTitleCase')($scope.licencePlate.data.merk),
        model: $filter('toTitleCase')($scope.licencePlate.data.handelsbenaming),
        seats: $scope.licencePlate.data.zitplaatsen,
        color: $filter('lowercase')($scope.licencePlate.data.kleur),
        fuel: $filter('lowercase')($scope.licencePlate.data.brandstof),
        type: $filter('lowercase')($scope.licencePlate.data.inrichting),
        year: $scope.licencePlate.data.datum_eerste_toelating,
        dayPrice: $scope.calculateYourPrice.dayPrice,
        numberOfDays: $scope.calculateYourPrice.numberOfDays,
        personSubmitted: false
      });
    } else {
      $mdDialog.show({
        clickOutsideToClose: true,
        locals: {
          licencePlate: $scope.licencePlate,
          calculateYourPrice: $scope.calculateYourPrice,
          brand: $filter('toTitleCase')($scope.licencePlate.data.merk),
          model: $filter('toTitleCase')($scope.licencePlate.data.handelsbenaming),
          seats: $scope.licencePlate.data.zitplaatsen,
          color: $filter('lowercase')($scope.licencePlate.data.kleur),
          fuel: $filter('lowercase')($scope.licencePlate.data.brandstof),
          type: $filter('lowercase')($scope.licencePlate.data.inrichting),
          year: $scope.licencePlate.data.datum_eerste_toelating
        },
        fullscreen: $mdMedia('xs'),
        templateUrl: 'pages/list-your-car/list-your-car-dialog.tpl.html',
        controller: ['$scope', '$mdDialog', 'authService', 'calculateYourPrice', 'licencePlate', 'brand', 'model', 'color', 'seats', 'fuel', 'type', 'year', function ($scope, $mdDialog, authService, calculateYourPrice, licencePlate, brand, model, color, seats, fuel, type, year, $filter) {
          $scope.url = 'owm.resource.create.carInfo';
          $scope.brand = brand;
          $scope.model = model;
          $scope.seats = seats;
          $scope.color = color;
          $scope.fuel = fuel;
          $scope.type = type;
          $scope.year = year;
          $scope.calculateYourPrice = calculateYourPrice;
          $scope.licencePlate = licencePlate;
          $scope.hide = function () {
            $mdDialog.hide();
          };
          $scope.cancel = function () {
            $mdDialog.cancel();
          };
          $scope.answer = function (answer) {
            $mdDialog.hide(answer);
          };
        }]
      });
    }
  };

});
