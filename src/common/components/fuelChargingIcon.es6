'use strict';

angular.module('owm.components')

.directive('fuelChargingIcon', function () {
  return {
    restrict: 'E',
    scope: {
      resource: '=',
      showPercentage: '='
    },
    template:
      `<span ng-show="resource.fuelLevel !== null" style="white-space: nowrap;">
        <ng-md-icon
            icon="{{ resource | fuelChargingIconName }}"
            alt="Batterij"
            aria-label="Batterij"
            ng-if="resource.fuelType === 'elektrisch'"
        ></ng-md-icon>
        <ng-md-icon
            icon="local_gas_station"
            alt="Batterij"
            aria-label="Batterij"
            ng-if="resource.fuelType !== 'elektrisch'"
        ></ng-md-icon>
        <span ng-if="showPercentage" style="
          font-size: 14px;
          margin-left: -4px;
          position: relative;
          top: 1px;
        ">
          {{ resource.fuelLevel + '%' }}
        </span>
      </span>`,
  };
});
