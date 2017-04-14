'use strict';

angular.module('geocoderDirectiveSearchbar', ['geocoder', 'google.places', 'ngMaterial'])
 
.directive('owGeocoderSearchbar', function ($filter, Geocoder, resourceQueryService, $state, $mdMenu) {
  return {
    restrict: 'E',
    templateUrl: 'directives/geocoderDirectiveSearchbar.tpl.html',
    scope: {
      'onNewPlace': '=',
      'onClickTime': '=',
      'onClickFilters': '=',
      'onSortChange': '=',
      'version': '='
    },
    link: function($scope, element) {

      var version3 = $scope.version === 3;

      $scope.$mdMenu = $mdMenu;
      $scope.search = {};
      $scope.search.text = resourceQueryService.data.text;


      $scope.$on('g-places-autocomplete:select', function(event, res) {
        handleEvent(res);
      });

      $scope.placeDetails = null;
      $scope.searcher = {loading: false};

      $scope.showFilters = _.isFunction($scope.onClickFilters);
      $scope.showTime = _.isFunction($scope.onClickTime);
      $scope.showSort = _.isFunction($scope.onSortChange) && version3;

      $scope.sort = resourceQueryService.getSort();

      $scope.setSort = function(sort) {
        $scope.sort = sort;
        resourceQueryService.setSort(sort);
        if(_.isFunction($scope.onSortChange)) {
          $scope.onSortChange(sort);
        }
      };

      $scope.labelForSort = function(sort) {
        if(sort === 'relevance') {
          return 'Relevantie';
        }
        if(sort === 'distance') {
          return 'Afstand';
        }
        if(sort === 'price') {
          return 'Prijs';
        }
      };

      $scope.doClickFilters = function() {
        if(_.isFunction($scope.onClickFilters)) {
          $scope.onClickFilters();
        }
      };

      $scope.doClickTime = function() {
        if(_.isFunction($scope.onClickTime)) {
          $scope.onClickTime();
        }
      };

      $scope.doSearch = function() {
        if($scope.search.text === '') {
          return doCall(resourceQueryService.createStateParams());
        }

        $scope.searcher.loading = true;
        return Geocoder.latLngForAddress($scope.search.text)
        .then(function(res) {
          resourceQueryService.setText(res[0].address);
          resourceQueryService.setLocation({
            latitude: res[0].latlng.latitude,
            longitude: res[0].latlng.longitude
          });
          doCall(resourceQueryService.createStateParams());
        })
				.finally(function() {
					$scope.searcher.loading = false;
				})
        ;
      };

      function doCall(res) {
        $scope.search.text = res.text;
        return $state.go('owm.resource.search.list', res, {reload: true, inherit: false, notify: true})
        .then(function() {
          if(_.isFunction($scope.onNewPlace)) {
            $scope.onNewPlace(res);
          }
        });
      }

      function handleEvent(res) {
        if(res) {
          resourceQueryService.setText(res.formatted_address);
          resourceQueryService.setLocation({
            latitude: res.geometry.location.lat(),
            longitude: res.geometry.location.lng()
          });
          doCall(resourceQueryService.createStateParams());
        }
      }

      $scope.options = {
				componentRestrictions: { country: $filter('translateOrDefault')('SEARCH_COUNTRY', 'nl') },
        types   : ['geocode'],
      };

    },
  };
})
;
