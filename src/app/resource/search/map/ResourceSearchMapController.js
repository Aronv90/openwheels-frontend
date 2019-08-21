'use strict';

angular.module('owm.resource.search.map', ['uiGmapgoogle-maps'])

  .controller('ResourceSearchMapController', function ($scope, uiGmapGoogleMapApi, uiGmapIsReady, $stateParams, appConfig,
    $log,
    unwrap,
    metaInfoService, resourceService, resourceQueryService, $state, $location, $rootScope, $timeout, $filter) {

    metaInfoService.set({url: appConfig.serverUrl + '/auto-huren/kaart'});
    metaInfoService.set({canonical: 'https://mywheels.nl/auto-huren/kaart'});

    var timer;
    $scope.filtersUpdated = false;
    var DEFAULT_MAP_CENTER_LOCATION = {
      // Utrecht, The Netherlands
      latitude : 52.091667,
      longitude: 5.117778000000044
    };
    var zoom = 14;
    var center = {
      latitude:  $stateParams.lat || DEFAULT_MAP_CENTER_LOCATION.latitude,
      longitude: $stateParams.lng || DEFAULT_MAP_CENTER_LOCATION.longitude
    };
    var windows = [];
    $scope.markers = [];

    uiGmapGoogleMapApi.then(function(maps) {
      var boundsFromSearch;
      var google_maps = maps;

      //Google Maps options
      angular.extend($scope, {
        map: {
          draggable: false,
          center: center,
          zoom: zoom,
          markers: $scope.markers,
          windows: windows,
          fitMarkers: true,
          clickableIcons: false,
          control: {},
          options: {
            minZoom: 12,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            gestureHandling: 'greedy',
            // https://snazzymaps.com/editor/customize/120165
            styles: [/*
              {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [
                  {
                    visibility: 'off',
                  },
                ],
              },*/
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [
                  {
                    visibility: 'off',
                  },
                ],
              },
              {
                featureType: 'landscape',
                elementType: 'labels',
                stylers: [
                  {
                    visibility: 'off',
                  },
                ],
              },
            ],
          },
          windowOptions: {
            boxClass: 'mw-gmap-window',
            boxStyle: {
              width: '280px',
              padding: '0px',
            },

            disableAutoPan: false,
            maxWidth: 0,
            pixelOffset: new google_maps.Size(-140, 0),
            zIndex: null,

            // https://yoksel.github.io/url-encoder/
            closeBoxURL: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath d="M0 0h24v24H0z" fill="white"/%3E%3Cpath d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="black"/%3E%3C/svg%3E',
            infoBoxClearance: new google.maps.Size(1, 1),
            isHidden: false,
            pane: 'floatPane',
            enableEventPropagation: false,
          },
        }
      });

      $scope.$watch('map.control.getGMap', function () {
        if (!$scope.map.control.getGMap) {
          return;
        }

        var map = $scope.map.control.getGMap();

        //default map on relevance
        $scope.sort = 'distance';

        $scope.$watch('bounds', function(){
          if(map && $scope.bounds){
            map.fitBounds($scope.bounds);
          }
        });

        //on change map show button
        map.addListener('idle', function() {
          if($stateParams.lat) {
            if($stateParams.lat !== map.getCenter().lat()) {
              $rootScope.idleChange = true;
            }
          } else {
            if(DEFAULT_MAP_CENTER_LOCATION.latitude !== map.getCenter().lat()) {
              $rootScope.idleChange = true;
            }
          }
          if(map.getZoom() !== zoom) {
            $rootScope.idleChange = true;
          }
        });

        //update timeframe
        $scope.$watch('booking', function (newValue, oldValue) {
          if (newValue !== oldValue) {
            $scope.markers.length = 0;

            $scope.newTimeFrame = null;
            $scope.newTimeFrame = {
              startDate: newValue.beginRequested,
              endDate: newValue.endRequested
            };

            $scope.filtersUpdated = true;
            $scope.updateResources();
          }
        });

        //remove timeframe
        $rootScope.$watch('timeFrameRemoved', function (newValue, oldValue) {
          if (newValue !== oldValue) {
            $rootScope.timeFrameRemoved = false;
            $scope.markers.length = 0;
            $scope.newTimeFrame = null;
            $scope.filtersUpdated = true;
            $scope.updateResources();
          }
        });

        //update filters, options and radius on filter change
        $scope.$watch('filters', function (newValue, oldValue) {
          if (newValue !== oldValue) {
            $scope.markers.length = 0;

            $scope.newFilters = null;
            angular.forEach(newValue.filters, function (value, key) {
              if (!value) { return; }
              if (key === 'minSeats') {
                try {
                  $scope.newFilters = $scope.newFilters || {};
                  $scope.newFilters[key] = parseInt(value);
                } catch (e) {
                }
              } else {
                $scope.newFilters = $scope.newFilters || {};
                $scope.newFilters[key] = value;
              }
            });

            $scope.newOptions = [];
            angular.forEach(newValue.options, function (value, option) {
              if (value === true) {
                $scope.newOptions.push(option);
              }
            });

            $scope.newRadius = newValue.props.radius;
            $scope.filtersUpdated = true;
            $scope.updateResources();
          }
        }, true);

        $rootScope.$watch('updateArea', function(){
          if($rootScope.updateArea > 0) {
            $scope.sort = 'distance';
            $scope.updateResources();
          }
        });

        //update resources
        $scope.updateResources = function() {

          $log.debug(map.getCenter().lat(), map.getCenter().lng());
          resourceQueryService.setLocation({
            latitude: map.getCenter().lat(),
            longitude: map.getCenter().lng()
          });

          //$state.go($state.$current, resourceQueryService.createStateParams());
          $location.search(resourceQueryService.createStateParams());

          var params = [];
          if($scope.filtersUpdated) {
            params = {
              filters: $scope.newFilters || [],
              options: $scope.newOptions || [],
              radius: $scope.newRadius,
              sort: $scope.sort,
              location: resourceQueryService.data.location,
              timeFrame: $scope.newTimeFrame || [],
              maxresults: 30
            };
          } else {
            params = {
              filters: resourceQueryService.data.filters || [],
              options: resourceQueryService.data.options || [],
              radius: resourceQueryService.data.radius,
              sort: $scope.sort,
              location: resourceQueryService.data.location,
              timeFrame: resourceQueryService.data.timeFrame,
              maxresults: 30
            };
          }

          resourceService.searchV3(params)
          .then(function (resources) {
            $scope.resources = resources.results;
            $scope.filtersUpdated = false;
            $rootScope.idleChange = false;
          });
        };

        $scope.updateResources();

        //update markers on change of resources
        $scope.$watch('resources', function(){
          if(!$scope.resources.length){
            return;
          }

          angular.forEach($scope.resources, function(resource){
            var coords = {
              latitude: resource.latitude,
              longitude: resource.longitude
            };

            var keyType = (resource.locktypes.indexOf('chipcard') >= 0 || resource.locktypes.indexOf('smartphone') >= 0) ? '-open' : '-key';
            var approx = (resource.parkingType === 'zone') ? '-approx' : '';
            var marker = {
              id: resource.id,
              coords: coords,
              title: resource.alias,
              animation: maps.Animation.DROP,
              resource: resource,
              icon: 'assets/img/mywheels' + keyType + approx + '-marker-v2-40.png',
              showWindow: false
            };

            marker.onClick = function(){
              $scope.$apply(function(){
                $scope.selectedMarker = null;
              });
              $scope.$apply(function(){
                $scope.selectedMarker = marker;
                $scope.selectedMarker.imgUrl = resource.pictures && resource.pictures.length > 0 ? (resource.pictures[0].large || resource.pictures[0].normal || resource.pictures[0].small) : 'assets/img/resource-avatar-large.jpg';
                if ($scope.selectedMarker.imgUrl && !$scope.selectedMarker.imgUrl.match(/^http/)) {
                  $scope.selectedMarker.imgUrl = appConfig.serverUrl + '/' + $scope.selectedMarker.imgUrl;
                }
                $scope.selectedMarker.showWindow = true;
              });
            };

            $scope.markers.push(new google.maps.Marker(marker));
          });

          if(!boundsFromSearch){
            $scope.map.fitMarkers = true;
          }
        });

      });

      $scope.closeWindow = function () {
        $scope.$apply(function(){
          $scope.selectedMarker.showWindow = false;
          $scope.selectedMarker = null;
        });
      };

      $scope.$watch('placeDetails', function() {
        var viewport;
        if($scope.placeDetails && $scope.placeDetails.geometry){
          if( $scope.placeDetails.geometry.viewport){
            viewport = $scope.placeDetails.geometry.viewport;
            boundsFromSearch = new maps.LatLngBounds(
              new maps.LatLng(viewport.getSouthWest().lat(), viewport.getSouthWest().lng()),
              new maps.LatLng(viewport.getNorthEast().lat(), viewport.getNorthEast().lng())
            );
            $scope.map.fitMarkers = false;
            $scope.bounds = angular.copy(boundsFromSearch);
          }else if($scope.placeDetails.geometry.location){
            $scope.map.center = {
              latitude:  unwrap($scope.placeDetails.geometry.location.lat),
              longitude: unwrap($scope.placeDetails.geometry.location.lng),
            };
            $scope.map.zoom = 13;
          }
        }
      });

    });
  })

  .controller('mapControlController',function($scope, $rootScope){
    $rootScope.updateArea = 0;
    $scope.idleMoved = false;
    $scope.updateArea = function() {
      $rootScope.updateArea++;
    };

    $rootScope.$watch('idleChange', function (newValue, oldValue) {
      if (newValue === true) {
        $scope.idleMoved = true;
      } else if (newValue === false) {
        $scope.idleMoved = false;
      }
    });

  });