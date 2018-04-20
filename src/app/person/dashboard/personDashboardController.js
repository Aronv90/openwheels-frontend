'use strict';

angular.module('owm.person.dashboard', [])

.controller('PersonDashboardController', function ($q, $scope, $sce, $state, me, bookingList, rentalList, actions,
  authService, bookingService, alertService, boardcomputerService, actionService, resourceService, resourceQueryService,
  blogItems, $localStorage, personService, dialogService, $translate, $timeout, Analytics, metaInfoService, appConfig, $window) {

  metaInfoService.set({url: appConfig.serverUrl + '/dashboard'});
  metaInfoService.set({canonical: 'https://mywheels.nl/dashboard'});

  // If booking_before_signup in local storage exists that means we have been redirected to this page after facebook signup
  // decide where to go next and try to guess user preference. If we do not know what flow to redirect
  // to, we present the user a modal and ask what he/she wants to do
  //
  // Else show normal dashboard/intro page
  if($localStorage.booking_before_signup) {
    var data = angular.copy($localStorage.booking_before_signup);
    delete $localStorage.booking_before_signup;
    if(data.flow === 'add_resource') {
      setPreference('owner');
      $state.go('owm.resource.create.carInfo', data);
    } else if(data.flow === 'booking') {
      setPreference('renter');
      $state.go('owm.person.details', data);
    } else if (!me.preference){
      showModal()
      .then(redirect);
    }
  } else {
    if(me.status === 'new' && !me.preference) {
      showModal()
      .then(redirect);
    } else if(me.status === 'new' && me.preference !== 'owner') {
      $state.go('owm.person.intro');
    }
  }

  function redirect(a) {
    if(me.preference === 'renter' || me.preference === 'both') {
      $state.go('owm.person.intro');
    } else {
      $timeout(function() {
        actionService.all({
          person: me.id
        })
        .then(function(res) {
          angular.extend($scope.actions, res);
        });
      });
    }
  }

  $scope.goToMyWheelsOpen = function() {
    window.open('http://open.mywheels.nl','_blank');
  };

  $scope.goToInviteFriends = function() {
    $state.go('invite');
  };

  function setPreference(pref) {
    if(!me.preference) {
      return personService.alter({person: me.id, newProps: {preference: pref}})
      .then(function(res) {
        me = res;
        return me;
      })
      .catch(function(err) {
      })
      ;
    }
  }

  function showModal() {
    var initOptions = function () {
      return [{
        label: $translate.instant('USER_PREFERENCE_RENTER'),
        value: 'renter'
      }, {
        label: $translate.instant('USER_PREFERENCE_OWNER'),
        value: 'owner'
      }, {
        label: $translate.instant('USER_PREFERENCE_BOTH'),
        value: 'both'
      }];
    };

    initOptions = initOptions();
    return dialogService.showModal({templateUrl: 'person/dashboard/preference-dialog.tpl.html'}, {
      me: me,
      preferenceOptions: initOptions,
    })
    .then(setPreference);
  }

  $scope.me = me;
  $scope.blogItems = blogItems;
  $scope.bookings = bookingList.bookings;
  $scope.totalBookings = bookingList.totalBookings;
  $scope.rentals = rentalList.bookings;
  $scope.totalRentals = rentalList.totalBookings;
  $scope.actions = actions;
  $scope.favoriteResources = null;
  $scope.membersResources = null;
  $scope.search = {
    text: ''
  };
  if (me.preference !== 'owner') {
    loadFavoriteResources();
    loadMemberResources();
  }

  if (me.preference !== 'renter') {
    loadResources();
  }

  if(me.registerSource === 'facebook_register') {
    Analytics.trackEvent('person', 'created', me.id, undefined, true);
    saveRegisterSource('facebook_login');
  }

  //Syntus Utrecht offer for MyWheels Open
  if ($scope.zipde) {
    $scope.zipcode = $scope.me.zipcode.substring(0, 4);
    $scope.MyWheelsOpenUtrecht = ($scope.zipcode >= 3400 && $scope.zipcode <= 4133 && ['Culemborg', 'Den Haag', '\'s-Gravenhage'].indexOf($scope.me.city) < 0) ? true : false;
  } else {
    $scope.MyWheelsOpenUtrecht = false;
  }

  $scope.renderHtml = function (html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.doSearch = function (placeDetails) {
    if (placeDetails) {
      resourceQueryService.setText($scope.search.text);
      resourceQueryService.setLocation({
        latitude: placeDetails.geometry.location.lat(),
        longitude: placeDetails.geometry.location.lng()
      });
    }
    $state.go('owm.resource.search.list', resourceQueryService.createStateParams());
  };

  $scope.openDoor = function (resource, booking) {
    alertService.load();
    boardcomputerService.control({
        action: 'OpenDoorStartEnable',
        resource: resource.id,
        booking: booking ? booking.id : undefined
      })
      .then(function (result) {
        if (result === 'error') {
          return alertService.add('danger', result, 5000);
        }
        alertService.add('success', 'Boardcomputer opened door and enabled start', 3000);
      }, function (error) {
        alertService.add('danger', error.message, 5000);
      })
      .finally(function () {
        alertService.loaded();
      });
  };

  $scope.closeDoor = function (resource, booking) {
    alertService.load();
    boardcomputerService.control({
        action: 'CloseDoorStartDisable',
        resource: resource.id,
        booking: booking ? booking.id : undefined
      })
      .then(function (result) {
        if (result === 'error') {
          return alertService.add('danger', result, 5000);
        }
        alertService.add('success', 'Boardcomputer closed door and disabled start', 3000);
      }, function (error) {
        alertService.add('danger', error.message, 5000);
      })
      .finally(function () {
        alertService.loaded();
      });
  };

  $scope.deleteAction = function (action) {
    alertService.load();
    actionService.delete({
        action: action.id
      })
      .then(function (result) {
        if (result.deleted === true) {
          $scope.actions.splice($scope.actions.indexOf(action), 1);
        } else {
          return $q.reject(new Error('De actie kan niet worden verwijderd'));
        }
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
      });
  };

  function saveRegisterSource(result) {
    var params = {
      person: me.id,
      newProps: {
        registerSource: result
      }
    };

    alertService.load();
    $scope.busy = true;
    personService.alter(params).then(function () {

    })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
        $scope.busy = false;
      });
  }

  function loadResources() {
    resourceService.forOwner({
        person: me.id,
        removed: false
      }).then(function (resources) {
        $scope.resources = resources || [];
      })
      .catch(function () {
        $scope.resources = [];
      });
  }

  function loadFavoriteResources() {
    resourceService.getFavorites({
        maxResults: 5
      }).then(function (favoriteResources) {
        $scope.favoriteResources = favoriteResources || [];
      })
      .catch(function () {
        $scope.favoriteResources = [];
      });
  }

  function loadMemberResources() {
    resourceService.getMemberResources({
      person: $scope.me.id
    })
    .then(function (membersResources) {
      $scope.membersResources = membersResources || [];
    })
    .catch(function () {
      $scope.membersResources = [];
    });
  }

  $scope.selectFavoriteResource = function (resource) {
    $state.go('owm.resource.show', {
      resourceId: resource.id,
      city: resource.city
    });
  };

});
