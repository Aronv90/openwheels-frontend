'use strict';

angular.module('owm.resource.filter', [])

  .controller('ResourceFilterController', function ($scope, $stateParams, $mdDialog, $translate, props, filters, options) {
    $scope.props   = props; // .radius, ...
    $scope.filters = filters;
    $scope.options = options;

    $scope.radiusOptions = [
      { value:  1000, label: '< 1 km' },
      { value:  5000, label: '< 5 km' },
      { value: 10000, label: '< 10 km' },
      { value: 25000, label: '< 25 km' },
      { value: 50000, label: '< 50 km' }
    ];

    $scope.fuelTypeOptions = [
      {value: 'benzine', label: $translate.instant('FUEL_TYPE.BENZINE')},
      {value: 'elektrisch', label: $translate.instant('FUEL_TYPE.ELECTRIC')}
    ];

    $scope.resourceTypeOptions = [
      {value: 'Stadsauto', label: $translate.instant('RESOURCE_TYPE.CITY')},
      {value: 'Elektrische auto', label: $translate.instant('RESOURCE_TYPE.ELECTRIC')},
      {value: 'Gezinsauto', label: $translate.instant('RESOURCE_TYPE.FAMILY')}
    ];

    $scope.minSeatOptions = [
      {value: 3, label: '3'},
      {value: 4, label: '4'},
      {value: 5, label: '5'}
    ];

    $scope.optionsLabels = {
      'automaat':            $translate.instant('ACCESSORIES.AUTOMATICTRANSMISSION'),
      'navigatie':           $translate.instant('ACCESSORIES.NAVIGATION'),
      'trekhaak':            $translate.instant('ACCESSORIES.TOW_BAR'),
      'winterbanden':        $translate.instant('ACCESSORIES.WINTER_TIRES')
    };

    $scope.selectResourceType = function(value){
      $scope.filters.resourceType = value;
    };

    $scope.resetResourceType= function() {
      $scope.filters.resourceType = undefined;
    };

    $scope.selectFuelType = function(value){
      $scope.filters.fuelType = value;
    };

    $scope.resetFuelType= function() {
      $scope.filters.fuelType = undefined;
    };

    $scope.selectMinSeats = function(value){
      $scope.filters.minSeats = value;
    };

    $scope.resetMinSeats = function() {
      $scope.filters.minSeats = undefined;
    };

    $scope.selectRadius = function(value){
      $scope.props.radius = value;
    };

    $scope.resetRadius = function() {
      $scope.props.radius = 25000;
    };

    $scope.ok = function () {
      $mdDialog.hide({filters: $scope.filters, options: $scope.options, props: $scope.props });
    };

    $scope.cancel = function () {
      $mdDialog.hide({filters: $scope.filters, options: $scope.options, props: $scope.props });
    };
  })

;
