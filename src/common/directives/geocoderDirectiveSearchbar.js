'use strict';

angular.module('geocoderDirectiveSearchbar', ['geocoder', 'google.places', 'ngMaterial'])
 
.directive('owGeocoderSearchbar', function ($filter, Geocoder, resourceQueryService, $state, $mdMenu, $window, alertService, $location) {
  return {
    restrict: 'E',
    templateUrl: 'directives/geocoderDirectiveSearchbar.tpl.html',
    scope: {
      'onFocus': '=',
      'onBlur': '=',
      'onNewPlace': '=',
      'onClickTime': '=',
      'onClickFilters': '=',
      'onSortChange': '=',
      'filters': '=',
      'searchtext': '=',
      'lightweight': '=',
    },
    link: function($scope, element) {
      $scope.geolocation = false;

      $window.s = $state;
      $window.loc = $location;

      if($scope.filters) {
        $scope.hasFilters = !$scope.filters.filters.fuelType && !$scope.filters.filters.resourceType && !$scope.filters.filters.minSeats;
      } else {
        $scope.hasFilters = false;
      }
      $scope.$mdMenu = $mdMenu;
      $scope.search = {};

      if($scope.searchtext) {
        $scope.search.text = $scope.searchtext;
      } else {
        $scope.search.text = resourceQueryService.data.text;
      }

      $scope.$on('g-places-autocomplete:select', function(event, res) {
        handleEvent(res);
      });

      $scope.placeDetails = null;
      $scope.searcher = {loading: false};

      $scope.showFilters = _.isFunction($scope.onClickFilters);
      $scope.showTime = _.isFunction($scope.onClickTime);
      $scope.showSort = _.isFunction($scope.onSortChange);

      $scope.sort = resourceQueryService.getSort();

      $scope.handleFocus = function () {
        if (_.isFunction($scope.onFocus)) {
          $scope.onFocus();
        }
      };

      $scope.handleBlur = function () {
        if (_.isFunction($scope.onBlur)) {
          $scope.onBlur();
        }
      };

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

      if($window.navigator.geolocation) {
        $scope.geolocation = true;
      }

      $scope.clear = function () {
        $scope.search.text = '';
        setTimeout(function () {
          element.find('input[form-control]').focus();
        }, 10);
      };

      $scope.getLocation = function() {
        $window.navigator.geolocation.getCurrentPosition(setLocation, locationError);
      };

      function setLocation(position) {
        var geocoder = new google.maps.Geocoder();
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        geocoder.geocode({
          latLng: latLng
        }, function (results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results.length) {
              resourceQueryService.setText(results[0].formatted_address);
              resourceQueryService.setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
              doCall(resourceQueryService.createStateParams());
            }
          }
        });
      }

      function locationError() {
        alertService.add('danger', 'Jouw huidige locatie kan helaas niet opgehaald worden.', 5000);
      }

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
        var targetStateName = $state.includes('owm.resource.search') ? '.' : 'owm.resource.search.list';
        return $state.go(targetStateName, res, {reload: false, notify: true})
        .then(function() {
          if(_.isFunction($scope.onNewPlace)) {
            $scope.onNewPlace(res);
          }
        });
      }

      function handleEvent(res) {
        if (true || !$scope.lightweight) {
          if(res) {
            //close keyboard on iOS
            document.activeElement.blur();
            var inputs = document.querySelectorAll('input');
            for(var i=0; i < inputs.length; i++) {
              inputs[i].blur();
            }
            
            resourceQueryService.setText(res.formatted_address);
            resourceQueryService.setLocation({
              latitude: res.geometry.location.lat(),
              longitude: res.geometry.location.lng()
            });
            doCall(resourceQueryService.createStateParams());
          }
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
