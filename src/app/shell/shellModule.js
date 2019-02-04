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
      }]
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
    resolve: {
      me: ['authService', function (authService) {
        return authService.userPromise().then(function (user) {
          return user.isAuthenticated ? user.identity : null;
        });
      }],
    },
  });

  /**
   * Application with populated menu, toolbar & footer
   */
  $stateProvider.state('owmlanding', {
    parent: 'shell',
    views: {
      'toolbar@shell': {
        templateUrl: 'shell/landing/toolbar/toolbar.tpl.html',
        controller: 'LandingToolbarController'
      },
      'menu@shell': {
        templateUrl: 'shell/landing/menu/menu.tpl.html',
        controller: 'LandingMenuController'
      },
      'footer@shell': {
        templateUrl: 'shell/footer/footer.tpl.html',
        controller: 'FooterController'
      },
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.userPromise().then(function (user) {
          return user.isAuthenticated ? user.identity : null;
        });
      }],
    },
  });

});
