
angular.module("owm.components")

.component("alternativesCard", {
  templateUrl: "components/alternativesCard/alternativesCard.tpl.html",
  bindings: {
    // booking OR resource
    booking: "=",
    resource: "=", // a removed resource
  },
  controller: ['$scope', '$state', 'resourceService', function ($scope, $state, resourceService) {

    let params = {};

    if (this.booking) {
      const URL_DATE_TIME_FORMAT = "YYMMDDHHmm";
      $scope.startDate = moment(this.booking.beginRequested).format(URL_DATE_TIME_FORMAT);
      $scope.endDate = moment(this.booking.endRequested).format(URL_DATE_TIME_FORMAT);

      params = {
        timeframe: {
          startDate: this.booking.beginRequested,
          endDate: this.booking.endRequested
        },
        location: {
          latitude: this.booking.person.latitude,
          longitude: this.booking.person.longitude
        },
        filters: {
          minSeats: this.booking.resource.numberOfSeats,
          resourceType: this.booking.resource.resourceType
        },
        radius: 5000,
        maxresults: 4,
        person: this.booking.person.id,
        sort: "relevance",
      };
    } else if (this.resource) {
      params = {
        location: {
          latitude: this.resource.latitude,
          longitude: this.resource.longitude
        },
        radius: 5000,
        maxresults: 4,
        sort: "relevance",
      };
    }

    resourceService.searchV3(params).then(alternatives => {
      $scope.resourceAlternatives = alternatives.results.filter(resource => {
        return resource.id !== (this.booking ? this.booking.resource.id : this.resource.id);
      });
    });

    $scope.selectResourceAlternative = function (resource) {
      $state.go('owm.resource.show', {
        resourceId: resource.id,
        city: (resource.city || '').toLowerCase().replace(/ /g, '-'),
        start: $scope.startDate,
        end: $scope.endDate
      });
    };
  }],
});
