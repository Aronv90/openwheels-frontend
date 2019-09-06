'use strict';

angular.module('owm.pages', [
  'owm.pages.list-your-car',
  'owm.pages.member',
  'owm.pages.emailPreference',
  'owm.pages.invite',
  'owm.pages.invite.subscribe',

  'owmlanding.mywheels-open',
  'owmlanding.mywheels-lease',
  'owmlanding.mywheels-fleet',
  'owmlanding.mywheels-business',
  'owmlanding.mywheels-group',
  'owmlanding.mywheels-share',
  'owmlanding.mywheels-zakelijk',
  'owmlanding.beheerders',
])

.config(function ($stateProvider) {

  $stateProvider

  .state('home', {
    url: '/',
    parent: 'owm',
    views: {
      'main-full@shell': {
        templateUrl: 'home/home.tpl.html',
        controller: 'HomeController'
      }
    },
    resolve: {
      me: ['authService', 'tokenSilentRefreshService', function (authService, tokenSilentRefreshService) {
        return authService.userPromise().then(function (user) {
          if (!user.isAuthenticated) {
            tokenSilentRefreshService.silentRefresh().then(function (token) {
              // this does the rest of the magic
              // (on successful login, `authService.user` is (internally) changed in-place,
              //  which is noticed in the shell/toolbar template)
              authService.notifyFreshToken(token, true);
            });
          }
          return user.isAuthenticated ? user.identity : null;
        });
      }],
    },
  })

  .state('owmlanding.beheerders', {
    url: '/beheerders',
    views: {
      'toolbar@shell': {
        //templateUrl: 'pages/beheerders/toolbar.tpl.html',
        templateUrl: 'shell/toolbar/toolbar.tpl.html',
        controller: 'ToolbarController',
      },
      'menu@shell': {
        templateUrl: 'shell/menu/menu.tpl.html',
        controller: 'MenuController'
      },
      'main-full@shell': {
        templateUrl: 'pages/beheerders/beheerders.tpl.html',
        controller: 'BeheerdersPaginaController'
      }
    },
  })

  .state('owmlanding.mywheels-open', {
    url: '/open',
    views: {
      'toolbar@shell': {
        templateUrl: 'pages/mywheels-open/toolbar.tpl.html',
      },
      'main-full@shell': {
        templateUrl: 'pages/mywheels-open/mywheels-open.tpl.html',
        controller: 'MyWheelsOpenController'
      }
    },
  })

  .state('owmlanding.iedereendoetwat', {
    url: '/klimaat',
    views: {
      'toolbar@shell': {
        templateUrl: 'pages/iedereendoetwat/toolbar.tpl.html',
        controller: 'ToolbarController'
      },
      'main-full@shell': {
        templateUrl: 'pages/iedereendoetwat/iedereendoetwat.tpl.html',
        controller: 'IedereenDoetWatController'
      }
    },
  })

  // .state('owmlanding.mywheels-lease', {
  //   url: '/lease',
  //   views: {
  //     'toolbar@shell': {
  //       templateUrl: 'pages/mywheels-lease/toolbar.tpl.html',
  //     },
  //     'main-full@shell': {
  //       templateUrl: 'pages/mywheels-lease/mywheels-lease.tpl.html',
  //       controller: 'MyWheelsLeaseController'
  //     },
  //   },
  // })

  .state('owmlanding.mywheels-zakelijk', {
    url: '/zakelijk',
    views: {
      'toolbar@shell': {
        templateUrl: 'pages/mywheels-zakelijk/toolbar.tpl.html', // reused (!)
      },
      'main-full@shell': {
        templateUrl: 'pages/mywheels-zakelijk/mywheels-zakelijk.tpl.html',
        controller: 'MyWheelsZakelijkController',
      },
    },
  })

  .state('owmlanding.mywheels-fleet', {
    url: '/fleet',
    views: {
      'toolbar@shell': {
        templateUrl: 'pages/mywheels-zakelijk/toolbar.tpl.html', // reused (!)
      },
      'main-full@shell': {
        templateUrl: 'pages/mywheels-fleet/mywheels-fleet.tpl.html',
        controller: 'MyWheelsFleetController',
      },
    },
  })

  .state('owmlanding.mywheels-business', {
    url: '/business',
    views: {
      'toolbar@shell': {
        templateUrl: 'pages/mywheels-zakelijk/toolbar.tpl.html', // reused (!)
      },
      'main-full@shell': {
        templateUrl: 'pages/mywheels-business/mywheels-business.tpl.html',
        controller: 'MyWheelsBusinessController',
      },
    },
  })

  .state('owmlanding.mywheels-group', {
    url: '/group',
    views: {
      'toolbar@shell': {
        templateUrl: 'pages/mywheels-zakelijk/toolbar.tpl.html', // reused (!)
      },
      'main-full@shell': {
        templateUrl: 'pages/mywheels-group/mywheels-group.tpl.html',
        controller: 'MyWheelsGroupController',
      },
    },
  })

  .state('owmlanding.mywheels-share', {
    url: '/share',
    views: {
      'toolbar@shell': {
        templateUrl: 'pages/mywheels-zakelijk/toolbar.tpl.html', // reused (!)
      },
      'main-full@shell': {
        templateUrl: 'pages/mywheels-share/mywheels-share.tpl.html',
        controller: 'MyWheelsShareController',
      },
    },
  })

  .state('owm.pages', {
    resolve: {
      user: ['authService', function (authService) {
        return authService.userPromise();
      }]
    }
  })

  .state('list-your-car', {
    parent: 'owm.pages',
    url: '/auto-verhuren',
    views: {
      'main-full@shell': {
        templateUrl: 'pages/list-your-car/list-your-car.tpl.html',
        controller: 'listYourCarController'
      }
    },
    data: {
      title: 'META_LISTYOURCAR_TITLE',
      description: 'META_LISTYOURCAR_DESCRIPTION',
      access: {
        feature: 'verhuurTussenscherm'
      }
    }
  })

  .state('member', {
    parent: 'owm.pages',
    url: '/lid/:personId',
    views: {
      'main-full@shell': {
        templateUrl: 'pages/member/member.tpl.html',
        controller: 'MemberController'
      }
    },
    resolve: {
      member: ['$stateParams', 'personService', function ($stateParams, personService) {
        return personService.get({
          version: 2,
          person: $stateParams.personId
        });
      }]
    }
  })

  .state('invite', {
    parent: 'owm.pages',
    url: '/uitnodigen',
    views: {
      'main-full@shell': {
        templateUrl: 'pages/invite/invite.tpl.html',
        controller: 'InviteController'
      }
    },
    data: {
      access: {
        deny: {
          anonymous: true
        }
      }
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.userPromise().then(function (user) {
          return user.isAuthenticated ? user.identity : null;
        });
      }],
      metaInfo: ['$translate', 'metaInfoService', '$filter',
        function ($translate, metaInfoService) {
          return $translate('SITE_NAME').then(function () {
            metaInfoService.set({
              title: $translate.instant('META_INVITE_TITLE'),
              description: $translate.instant('META_INVITE_DESCRIPTION')
            });
          });
        }
      ]
    }
  })

  .state('subscribe', {
    parent: 'invite',
    url: '/:slug?mail&name',
    views: {
      'main-full@shell': {
        templateUrl: 'pages/inviteSubscribe/invite-subscribe.tpl.html',
        controller: 'InviteSubscribeController'
      }
    },
    data: {
      access: {
        deny: {
          anonymous: false
        }
      }
    },
    resolve: {
      inviter: ['$stateParams', 'personService', function ($stateParams, personService) {
        return personService.get({
          version: 2,
          slug: $stateParams.slug
        });
      }],
      metaInfo: ['$translate', 'inviter', 'metaInfoService', '$filter',
        function ($translate, inviter, metaInfoService, $filter) {
          if (!inviter) {
            return;
          }
          return $translate('SITE_NAME').then(function () {
            metaInfoService.set({
              title: $translate.instant('META_INVITE_SUBSCRIBE_TITLE', {
                firstName: $filter('toTitleCase')(inviter.firstName)
              }),
              description: $translate.instant('META_INVITE_SUBSCRIBE_DESCRIPTION', {
                firstName: $filter('toTitleCase')(inviter.firstName)
              })
            });
          });
        }
      ]
    }
  })

  .state('emailPreference', {
    parent: 'owm.pages',
    url: '/email-uitschrijven?person&hash',
    views: {
      'main@shell': {
        templateUrl: 'pages/email-preference/email-preference.tpl.html',
        controller: 'EmailPreferenceController'
      }
    }
  });
});
