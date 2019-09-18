'use strict';

angular.module('owm.resource.show', [])

.controller('ResourceShowController', function ($window, $log, $q, $timeout, $location, $mdDialog, $mdMedia, $scope,
  $state, $filter, authService, resourceService, bookingService, invoice2Service, alertService,
  chatPopupService, ratingService, API_DATE_FORMAT, resource, me, resourceQueryService, featuresService, $stateParams,
  zoneService,
  prevState,
  linksService, Analytics, metaInfoService, $localStorage, $translate, appConfig, $anchorScroll) {
  Analytics.trackEvent('discovery', 'show_car', resource.id, undefined, true);

  metaInfoService.set({robots: resource.isActive && !resource.removed ? 'all' : 'noindex'});
  metaInfoService.set({url: appConfig.serverUrl + '/auto-huren/'+ (resource.city || '').toLowerCase().replace(/ /g, '-') + '/' + resource.id});
  metaInfoService.set({canonical: 'https://mywheels.nl/auto-huren/'+ (resource.city || '').toLowerCase().replace(/ /g, '-') + '/' + resource.id});

  if(resource.removed === undefined) {
    resource.removed = false;
  }
  

  // The car is not visible to the world,
  //  either because it is removed by owner (removed),
  //  or because it is set inactive by MyWheels (!isActive).
  $scope.removed = (resource.removed || !resource.isActive);

  // Still visible to the world, but not rentable,
  //  because the car is (temporarily) marked as unavailable by the owner.
  $scope.unavailable = (resource.isAvailableFriends === false);

  if($scope.removed) {
    resourceQueryService.setText(resource.location);
    resourceQueryService.setLocation({latitude: resource.latitude, longitude: resource.longitude});
    $scope.removedResourceAddress = resource.location;
  }

  $scope.prevState = prevState;

  /**
   * Warning: 'me' will be null for anonymous users
   */
  $scope.booking = {
    resource: resource,
  };
  $scope.resource = resource;
  $scope.me = me;
  $scope.showBookingForm = false;
  $scope.showBookingFormToggle = true;
  if(!$scope.removed) {
    $scope.satisfaction = Math.round($scope.resource.rating_totals.satisfaction * 100) + '%';
  }
  $scope.openDialogSpinner = false;

  $scope.openChatWith = openChatWith;
  $scope.openCommentDialog = openCommentDialog;
  $scope.isFavoriteResolved = false;
  $scope.toggleFavorite = toggleFavorite;

  $scope.shareUrl = featuresService.get('serverSideShare') ? linksService.resourceUrl(resource.id, (resource.city || '').toLowerCase().replace(/ /g, '-')) : $window.location.href;
  $log.debug('Share url = ' + $scope.shareUrl);

  setResourceType(resource);

  function setResourceType (resource) {
    if (resource.resourceType === 'car') {
      $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.CAR');
    } else if (resource.resourceType === 'van') {
      $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.VAN');
    } else if (resource.resourceType === 'station') {
      $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.STATION');
    } else {
      $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.CAR');
    }
  }

  //check resource properties
  if(!$scope.removed) {
    $scope.airconditioning = resource.properties.map(function(o) { return o.id;}).indexOf('airconditioning');
    $scope.automaticGear = resource.properties.map(function(o) { return o.id;}).indexOf('automaat');
    $scope.bikeCarrier = resource.properties.map(function(o) { return o.id;}).indexOf('fietsendrager');
    $scope.childSeat = resource.properties.map(function(o) { return o.id;}).indexOf('kinderzitje');
    $scope.mp3Connection = resource.properties.map(function(o) { return o.id;}).indexOf('mp3-aansluiting');
    $scope.navigation = resource.properties.map(function(o) { return o.id;}).indexOf('navigatie');
    $scope.wheelchairFriendly = resource.properties.map(function(o) { return o.id;}).indexOf('rolstoelvriendelijk');
    $scope.towbar = resource.properties.map(function(o) { return o.id;}).indexOf('trekhaak');
    $scope.winterTires = resource.properties.map(function(o) { return o.id;}).indexOf('winterbanden');
  }

  /**
   * Init
   */
  loadSearchState();

  if (me) { loadFavorite(); } else { $scope.isFavoriteResolved = true; }
  if (featuresService.get('ratings')) {
    loadRatings();
  }


  if(!$scope.removed) {
    $scope.images = resource.pictures
      .map(function (picture) {
        var path = (picture.large || picture.normal || picture.small || '');
        if (path && !path.match(/^http/)) {
          path = appConfig.serverUrl + '/' + path;
        }
        return path;
      })
      .filter(function (url) { return url; });

    if ($scope.images.length === 0) {
      $scope.images.push('assets/img/resource-avatar-large.jpg');
    }

    $scope.carouselBackgroundImage = {
      backgroundImage: 'url("' + $scope.images[0] + '")',
    };

    //  - aspect ratio of photos is 3:2
    //  - formula: (2 * screen width) / (3 * height) = #items
    //  - screen width + desired height => #items
    $scope.owlProperties = {
      loop: ($scope.images.length > 2),
      center: true,
      nav: true,
      dots: false,
      responsive: {},
    };
    for (var screenWidth = 0; screenWidth < 3000; screenWidth += 100) {
      var desiredHeight = Math.max(250, Math.min(330, screenWidth * (400 / 1800)));
      $scope.owlProperties.responsive[screenWidth] = {
        items: Math.max(1, (2 * screenWidth) / (3 * desiredHeight)),
      };
    }

    $scope.owlApi = null;
    $scope.owlReady = function ($api) {
      $scope.owlApi = $api;
    };
    $scope.owlGoto = function (i) {
      if ($scope.owlApi) {
        $scope.owlApi.trigger('to.owl.carousel', i);
      }
    };
    $scope.owlClick = function ($event) {
      var item = $($event.target).closest('.item');
      if (item.length) {
        var i = parseInt(item.attr('index'));
        $scope.owlApi.trigger('to.owl.carousel', i);
      }
    };
  }

  function openChatWith (otherPerson) {
    var otherPersonName = $filter('fullname')(otherPerson);
    chatPopupService.openPopup(otherPersonName, otherPerson.id, resource.id, null);
  }

//  function openSignupDialog () {
//    $scope.resource = resource;
//
//    $mdDialog.show({
//      fullscreen: $mdMedia('xs'),
//      preserveScope: true,
//      locals: {
//        resource: $scope.resource
//      },
//      templateUrl: 'resource/components/ReservationFormDialog.tpl.html',
//      parent: angular.element(document.body),
//      clickOutsideToClose:true,
//      controller: ['$scope', '$mdDialog', 'authService', 'resource', function($scope, $mdDialog, authService, resource) {
//        $scope.resource = resource;
//        $scope.url = 'owm.resource.show';
//
//        $scope.hide = function () {
//          $mdDialog.hide();
//        };
//        $scope.cancel = function () {
//          $mdDialog.cancel();
//        };
//
//      }],
//    });
//  }
//
//  if(!authService.user.isAuthenticated && !$localStorage.signupAlert) {
//    $localStorage.signupAlert = true;
//
//    $timeout(function () {
//      openSignupDialog($scope.resource);
//    }, 2500);
//  }

  function openCommentDialog (rating, $event) {
    $scope.rating = rating;

    $mdDialog.show({
      fullscreen: $mdMedia('xs'),
      preserveScope: true,
      scope: $scope,
      templateUrl: 'resource/partials/commentDialog.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose:true,
      controller: ['$scope', '$mdDialog', 'ratingService', function($scope, $mdDialog, ratingService) {
        $scope.rating = rating;

        $scope.hide = function() {
          $mdDialog.hide();
        };

        $scope.save = function() {
          ratingService.commentOnRating({
            ratingId: $scope.rating.id,
            comment: $scope.ratingComment
          })
          .then( function(response) {
            alertService.add('success', 'Jouw reactie op de beoordeling van ' + $filter('toTitleCase')($scope.rating.sender.firstName) + ' is opgeslagen.', 3000);
            loadRatings();
            $mdDialog.hide();
          }, function(error) {
            $scope.errorComment = error.message;
          })
          .finally( function() {
            alertService.loaded();
          });
        };

      }],
    });
  }

  function loadSearchState () {
    var timeFrame = resourceQueryService.data.timeFrame;
    if (timeFrame) {
      $scope.booking.beginRequested = timeFrame.startDate;
      $scope.booking.endRequested   = timeFrame.endDate;
    }
    $location.search(angular.extend($location.search(), resourceQueryService.createStateParams()));

    var discountCode = $stateParams.discountCode;
    if(!discountCode){
      if($localStorage.discountCode){
        discountCode = $localStorage.discountCode;
      }
    }
    $scope.booking.discountCode = discountCode;
  }

  function loadRatings () {
    return ratingService.getResourceRatings({
      resource: $scope.resource.id
    }).then(function (result) {
      $scope.resource.ratings = result;
    });
  }

  if (!$scope.removed) {
    var addMap = function (zonePolygon, chargingPoints) {
      var keyType = (resource.locktypes.indexOf('chipcard') >= 0 || resource.locktypes.indexOf('smartphone') >= 0) ? '-open' : '-key';
      var approx = (resource.parkingType === 'zone') ? /*'-approx'*/ '' : '';
      angular.extend($scope, {
        map: {
          zonePolygon: zonePolygon, // : { geometry: Array<{ latitude: number, longitude: number }>, type: "polygon" }
          center: {
            latitude: resource.latitude,
            longitude: resource.longitude
          },
          draggable: true,
          markers: [
            {
              idKey: 1,
              icon: 'assets/img/mywheels' + keyType + approx + '-marker-v2-80.png',
              latitude: resource.latitude,
              longitude: resource.longitude,
              title: resource.alias
            }
          ].concat((chargingPoints || []).map(function (chargingPoint, j) {
            var key = chargingPoint.status.available ? 1 : 0;
            return {
              idKey: j + 2,
              icon: 'assets/img/chargingpoint_' + key + '_2x.png',
              latitude: chargingPoint.location.latitude,
              longitude: chargingPoint.location.longitude
            };
          })),
          zoom: 15,
          options: {
            scrollwheel: false,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false
          }
        }
      });
    };

    if ($scope.resource.parkingType === 'zone') {
      zoneService
      .forResource({ resource: $scope.resource.id })
      .then(function (res) {
        zoneService
        .chargingPoints({
          coordinates: res.geometry.coordinates,
          type: 'polygon'
        })
        .then(function (res2) {
          addMap(res.geometry, res2.data);
        }).catch(function () {
          $log.warn('chargingpoints could not be loaded');
          addMap(res.geometry);
        });
      });
    } else {
      addMap();
    }
  }

  function loadFavorite () {
    $scope.isFavoriteResolved = false;

    var dfd = $q.defer();
    dfd.promise.then(function (bool) {
      $scope.isFavorite = bool;
      $scope.isFavoriteResolved = true;
    });

    resourceService.getFavorites({ maxResults: 3 }).then(function (favoritesRecentsAndSuggestions) {
      var isFavorite;
      angular.forEach(favoritesRecentsAndSuggestions, function (candidate) {
        isFavorite = isFavorite || (candidate.label === 'favorite' && candidate.id === resource.id);
      });
      dfd.resolve(isFavorite);
    })
    .catch(function () {
      dfd.resolve(false);
    });
  }

  function toggleFavorite (bool) {
    var params = { resource: resource.id };
    var method = bool ? resourceService.addFavorite : resourceService.removeFavorite;

    $scope.isFavoriteResolved = false;
    method(params).then(function () {
      $scope.isFavorite = bool;
    })
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function () {
      $scope.isFavoriteResolved = true;
    });
  }

  $scope.toggleBookingForm = function () {
    $scope.showBookingForm = !!!$scope.showBookingForm;
    $scope.showBookingFormToggle = !!!$scope.showBookingFormToggle;

    $anchorScroll('priceBookingContainer');

    if (!$scope.showBookingForm) {
      $scope.showBookingFormToggle = false;
      $timeout(function () {
        $scope.showBookingFormToggle = true;
      }, 250);
    }
  };

});
