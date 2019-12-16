'use strict';

angular.module('owm.person.dashboard', [])

.controller('PersonDashboardController', function ($q, $scope, $sce, $state, me, bookingList, rentalList, actions, person,
  $log,
  homeAddressPrefill, $filter, hasBooked,
  unwrap,
  contractService,
  authService, bookingService, alertService, boardcomputerService, actionService, resourceService, resourceQueryService,
  blogItems, $localStorage, personService, extraDriverService, dialogService, $translate, $timeout, Analytics, metaInfoService, appConfig, $window) {

  metaInfoService.set({url: appConfig.serverUrl + '/dashboard'});
  metaInfoService.set({canonical: 'https://mywheels.nl/dashboard'});

  $scope.person = person;

  $scope.hasBooked = hasBooked;
  
  $scope.homeAddressPrefill = homeAddressPrefill;

  if (me.provider.id === 1 && me.preference) {
    // = MyWheels

    if (me.preference !== 'owner') {
      $scope.dashboardLinks = [
        { sref: 'owm.trips', title: 'Ritten' },
        { sref: 'owm.finance.v4', title: 'Financiën' },
        { sref: 'owm.message', title: 'Berichten' },
        { sref: 'owm.person.profile({ highlight: "profiel" })', title: 'Mijn gegevens' },
      ];
    }
    else /*if (me.preference === 'owner' && resource.length > 0) */ {
      $scope.dashboardLinks = [
        { sref: 'owm.trips', title: 'Verhuringen' },
        { sref: 'owm.finance.v4', title: 'Financiën' },
        { sref: 'owm.message', title: 'Berichten' },
        { sref: 'owm.resource.own', title: 'Mijn auto\'s' },
      ];
    }/*
    else if (me.preference === 'owner' && resource.length === 0) {
      $scope.dashboardLinks = [
        { sref: 'list-your-car', title: 'Auto toevoegen' },
        { sref: 'owm.trips', title: 'Verhuringen' },
        { sref: 'owm.finance.v4', title: 'Financiën' },
        { sref: 'owm.message', title: 'Berichten' },
      ];
    }*/
  } else if (me.isBusinessConnected) {
    $scope.dashboardLinks = [
      { sref: 'owm.trips', title: 'Ritten' },
      { sref: 'owm.resource.search.list', title: 'Huur een auto' },
      { sref: 'owm.message', title: 'Berichten' },
      { sref: 'owm.person.profile({ highlight: "profiel" })', title: 'Mijn gegevens' },
    ];
  }


  // If booking_before_signup in local storage exists that means we have been redirected to this page after facebook signup
  // decide where to go next and try to guess user preference. If we do not know what flow to redirect
  // to, we present the user a modal and ask what he/she wants to do
  //
  // Else show normal dashboard/intro page
  if (!me.isBusinessConnected) {
    if($localStorage.booking_before_signup) {
      var data = angular.copy($localStorage.booking_before_signup);
      delete $localStorage.booking_before_signup;
      if(data.flow === 'add_resource') {
        setPreference('owner');
        $state.go('owm.resource.create.carInfo', data);
      } else if(data.flow === 'booking') {
        setPreference('renter');
        $state.go('owm.person.details', data);
      } else if(data.flow === 'subscribe_resource_show') {
        setPreference('renter');
        $state.go('owm.resource.show', data);
      } else if (!me.preference){
        showModal()
        .then(redirect);
      }
    } else {
      if(me.status === 'new' && !me.preference && !me.extraDriver) {
        showModal()
        .then(redirect);
      } else if(me.status === 'new' && me.preference === 'renter' && !me.extraDriver) {
        Analytics.trackEvent('buglogging_v4', 'redirect_dashboard_to_intro', me.id + '_' + me.status, undefined, true);
        $timeout(function() {
          $state.go('owm.person.intro');
        }, 100);
      }
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
  $scope.extraDriverBookings = null;
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

  loadContracts();

  if(me.registerSource === 'web_fb') {
    Analytics.trackEvent('person', 'created', me.id, undefined, true);
    saveRegisterSource('web_fb_login');
  }

  $scope.renderHtml = function (html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.doSearch = function (placeDetails) {
    if (placeDetails) {
      resourceQueryService.setText($scope.search.text);
      resourceQueryService.setLocation({
        latitude: unwrap(placeDetails.geometry.location.lat),
        longitude: unwrap(placeDetails.geometry.location.lng),
      });
    }
    $state.go('owm.resource.search.list', resourceQueryService.createStateParams());
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
          return $q.reject(new Error('De actie kan niet worden verwijderd.'));
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

    personService.alter(params)
    .then(function(res) {
      me.registerSource = res.registerSource;
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
        maxResults: me.isBusinessConnected ? 10 : 5,
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

  $scope.getBookingListAsExtraDriver = function () {
    extraDriverService.getExtraDriverBookingList({
      person: $scope.me.id,
      limit: 2,
      offset: 0
    })
    .then(function (data) {
      $scope.extraDriverBookings = data.result.map(function (obj) {
        obj.booking.resource = obj.resource;
        return obj.booking;
      });
    })
    .catch(function () {
      $scope.extraDriverBookings = [];
    });
  };

  $scope.contracts = [];
  function loadContracts() {
    contractService.forDriver({
      person: $scope.me.id
    })
    .then(function (contracts) {
      $scope.contracts = contracts;
      $scope.hasGoContract = contracts.reduce(function (hasGoContract, contract) {
        return hasGoContract || contract.type.id === 60;
      }, false);
    });
  }

});
