'use strict';

angular.module('owm.shell', [])

.config(function ($stateProvider) {

  /**
   * Empty app shell with placeholders (ui-view's) for menu, toolbar, main content & footer.
   */
  $stateProvider.state('shell', {
    templateUrl: 'shell/shell.tpl.html',
    controller: 'ShellController',
    resolve: {
      isLanguageLoaded: ['$q', '$rootScope', function ($q, $rootScope) {
        var dfd = $q.defer();
        var unbindWatch = $rootScope.$watch('isLanguageLoaded', function (isLoaded) {
          if (isLoaded) {
            unbindWatch();
            dfd.resolve();
          }
        });
        return dfd.promise;
      }],
      me: ['authService', 'providerInfoService', '$log', '$filter', '$rootScope', function (authService, providerInfoService, $log, $filter, $rootScope) {
        return authService.userPromise().then(function (user) {
          if (user.isAuthenticated) {
            return providerInfoService.getInfo({ provider: user.identity.provider.id })
            .then(function (info) {

              info.isBusiness = user.identity.isBusinessConnected;

              // interface ProviderInfo {
              //   extraInfo: any | ProviderExtraInfo;
              //   fleetManager: Person;
              //   visibleName: string;
              //   isBusiness: boolean;
              // }

              // type URL = string;
              // type markdown = string;

              // enum ProfileBlacklistItem {
              //   gender        = "gender";
              //   dateOfBirth   = "dateOfBirth";
              //   address       = "address";
              //   driverLicense = "driverLicense";
              //   social        = "social";
              // }

              // interface ProviderExtraInfo {
              //   emergencyNumber: string;
              //   timePickerInterval?: number;
              //   welcomeText: markdown;
              //   logo: URL;
              //   helpText: markdown;
              //   personProfileBlacklist: {
              //     [item: ProfileBlacklistItem]: boolean;
              //   }
              // }

              $rootScope.providerInfo = info;

              $rootScope.timePickerInterval = (info ? info.extraInfo : {}).timePickerInterval || 15;
              $log.debug('timePickerInterval', $rootScope.timePickerInterval);

              return user.identity;
            });
          } else {
            return null;
          }
        });
      }],

      // This is really whacko, but I blieve the presence of another resolve here,
      //  that depends upon `me`, causes that `me` to be needed earlier on in the
      //  process, and somehow hence triggering a state change error, leading to
      //  a cycle of silent refresh attempts.
      // Quick solution (I don't really know how to solve it more cleanly right now)
      //  is to just get the provider info within the `me` resolver.

      // providerInfo: ['me', 'providerInfoService', function (me, providerInfoService) {
      //   if (!me) {
      //     return null;
      //   }
      //   
      //   return providerInfoService.getInfo({ provider: me.provider.id })
      //   .then(function (info) {
      //     return info;
      //   });
      // }],
    }
  });

  /**
   * Application with populated menu, toolbar & footer
   */
  $stateProvider.state('owm', {
    parent: 'shell',
    views: {
      'toolbar@shell': {
        templateUrl: 'shell/toolbar/toolbar.tpl.html',
        controller: 'ToolbarController'
      },
      'menu@shell': {
        templateUrl: 'shell/menu/menu.tpl.html',
        controller: 'MenuController'
      },
      'footer@shell': {
        templateUrl: 'shell/footer/footer.tpl.html',
        controller: 'FooterController'
      }
    },
  });

  /**
   * Application with populated menu, toolbar & footer
   */
  $stateProvider.state('owmlanding', {
    parent: 'shell',
    views: {
      'menu@shell': {
        templateUrl: 'shell/landing/menu/menu.tpl.html',
        controller: 'LandingMenuController'
      },
      'footer@shell': {
        templateUrl: 'shell/footer/footer.tpl.html',
        controller: 'FooterController'
      },
    },
  });

});
