'use strict';

angular.module('openwheels', [
/* Framework */
  'ngAria',
  'ngAnimate',
  'ngCookies',
  'ngMaterial',
  'ngMessages',
  'ngSanitize',

  /* Tools */
  'ui.router',
  'ui.unique',
  'ui.bootstrap',
  'ui.calendar',
  'ui.sortable', // bower install ng-sortable
  'validation.match', // see vendor_custom
  'angularMoment',
  'ngMdIcons',
  'uiGmapgoogle-maps',
  'ngStorage',
  'pascalprecht.translate',
  'geolocation',
  'geocoder',
  'ngAutocomplete',
  'ngScrollTo',
  'ngFileUpload',
  'uiCropper',
  // 'vcRecaptcha',
  'angularLoad',

  /* Auto-generated */
  'templates-app',
  'templates-common',
  'openwheels.environment',
  'openwheels.config',

  /* API communication & access control */
  'api',
  'rpcServices',
  'authService',
  'tokenService',
  'oAuth2Callback',
  'oAuth2MessageListener',
  'stateAuthorizer',

  /* Services */
  'alertService',
  'dialogService',
  'DutchZipcodeService',
  'brandedFileLoader',
  'TimeFrameService',
  'windowSizeService',
  'owm.geoPositionService',
  'owm.linksService',
  'owm.featuresService',
  'owm.metaInfoService',
  'owm.meHelperService',
  // 'angular-google-analytics', // this is `angular-track`, and is being phased out
  'mobileDetectService',
  'mw.simpleCache',

  'Cookies',
  'AB',

  /* Directives */
  'form.validation',
  'signupFormDirective',
  'pickadate',
  '720kb.socialshare',
  'timeframe',
  'datetimeDirective',
  'bookingListDirective',
  'licencePlateInfoDirective',
  'phoneNumberDirective',
  'formGroupDirective',
  'bindingDirectives',
  'ratingThumbDirective',
  'ratingThumbBinaryDirective',
  'badgeListDirective',
  'infoIconDirective',
  'vouchersDirective',
  'resourceSidebarDirective',
  'fileInputDirective',
  'resourceCarouselDirective',
  'bookingDirectives',
  'personDirectives',
  'passwordStrengthDirective',
  'geocoderDirective',
  'geocoderDirectiveSearchbar',
  'socialDirectives',
  'bindMetaDirective',
  'personalDataDirective',
  'sameHeightDirective',
  'autoblurDirective',
  'restrictToDirective',
  'autoResize',
  'infoDialogDirective',
  'huurkostenLineDirective',
  'userStatusLine',

  'bookingInvoicesDirective',
  'inlineConfirmDirective',

  'mwResourceLocationMap',

  'angular-owl-carousel-2',
  'hl.sticky',
  
  'bootstrapDateTimePickerDirective',
  'timeframePickerDirective',
  'resourcePricingDirective',
  'invoiceEstimateDirective',
  'noUiSliderDirective',
  'validPhoneNumberDirective',
  'hasFeatureIconDirective',

  /* Filters */
  'filters.util',
  'filters.dateUtil',
  'filters.getByPropertyFilter',
  'filters.fullname',
  'filters.avatar',
  'filters.replace',
  'filters.ratingStars',
  'filters.dirty',
  'filters.reverse',
  'filters.percentage',
  'filters.bookingStatus',
  'filters.booking',
  'filters.resource',
  'filters.translateOrDefault',
  'filters.removeEntersFilter',

  /* Components */
  'openwheels.analytics',
  'openwheels.social',
  'owm.shell',
  'owm.alert',
  'owm.translate',
  'owm.auth',
  'owm.home',
  'owm.pages',
  'owm.resource',
  'owm.booking',
  'owm.person',
  'owm.finance',
  'owm.payment',
  'owm.trips',
  'owm.chat',
  'owm.message',
  'owm.discount',
  'owm.contract',
  
  /* Visual components */
  'owm.components',
])

.constant('API_DATE_FORMAT', 'YYYY-MM-DD HH:mm')
.constant('FRONT_DATE_FORMAT', 'dddd DD MMMM HH:mm')

.provider('authUrl', function () {
  this.$get = ['$window', 'appConfig', function ($window, appConfig) {
    return function authUrl (errorPath, successPath) {
      var oAuth2CallbackUrl =
        $window.location.protocol + '//' +
        $window.location.host +
        //$state.href('oauth2callback') +
        '/assets/oauth2callback.html' +
        '?' +
        (!successPath ? '' : '&successPath=' + encodeURIComponent(successPath)) +
        (!errorPath ? '' : '&errorPath=' + encodeURIComponent(errorPath));

      return appConfig.authEndpoint +
        '?client_id=' + appConfig.appId +
        '&response_type=' + 'token' +
        '&redirect_uri=' + encodeURIComponent(oAuth2CallbackUrl);
    };
  }];
})

.config(function (ngMdIconServiceProvider) {
  ngMdIconServiceProvider.addShape('info_italic', `
    <path d="m 12.861328,4.5846655 c -0.496,0 -0.923297,0.1640937 -1.279297,0.4960937 -0.353,0.331 -0.533203,0.7322656 -0.533203,1.1972655 0,0.466 0.179203,0.86536 0.533203,1.19336 0.356,0.327999 0.783297,0.492187 1.279297,0.492187 0.497,0 0.922391,-0.164188 1.275391,-0.492187 0.353,-0.328 0.53125,-0.72636 0.53125,-1.19336 0,-0.4649999 -0.17825,-0.8662655 -0.53125,-1.1972655 -0.352,-0.332 -0.778391,-0.4960937 -1.275391,-0.4960937 z" />
    <path d="m 11.179688,9.4909157 c -0.405001,0 -0.834063,0.07275 -1.289063,0.21875 -0.455,0.144 -0.9316875,0.3165313 -1.4296875,0.5195313 l -0.2011719,0.828125 c 0.146,-0.056 0.3223438,-0.112781 0.5273438,-0.175781 0.207,-0.061 0.4094687,-0.08984 0.6054687,-0.08984 0.401,0 0.6694999,0.06617 0.8124999,0.201172 0.141,0.135 0.212891,0.374797 0.212891,0.716797 0,0.192 -0.02236,0.402812 -0.06836,0.632812 -0.046,0.228 -0.102921,0.472469 -0.169921,0.730469 l -0.7617192,2.689453 c -0.067,0.283 -0.1154844,0.533813 -0.1464844,0.757813 -0.03,0.224 -0.044922,0.445156 -0.044922,0.660156 0,0.553 0.2033281,1.008187 0.6113281,1.367187 0.4080005,0.359 0.9807965,0.539063 1.7167975,0.539063 0.479,0 0.899718,-0.06345 1.261718,-0.189453 0.363,-0.126 0.847078,-0.308828 1.455078,-0.548828 l 0.203125,-0.826172 c -0.106,0.049 -0.273859,0.105922 -0.505859,0.169922 -0.234,0.064 -0.441953,0.0957 -0.626953,0.0957 -0.392,0 -0.668172,-0.06436 -0.826172,-0.19336 -0.16,-0.129 -0.240234,-0.372515 -0.240234,-0.728515 0,-0.141 0.02522,-0.35 0.07422,-0.625 0.05,-0.275 0.104016,-0.521328 0.166016,-0.736328 l 0.757813,-2.679688 c 0.074,-0.247 0.125343,-0.515547 0.152343,-0.810547 0.027,-0.294 0.04102,-0.500187 0.04102,-0.617187 0,-0.564 -0.200703,-1.023953 -0.595703,-1.376953 -0.397,-0.3520003 -0.960407,-0.5292973 -1.691406,-0.5292973 z" />
  `);
  ngMdIconServiceProvider.addShape('table_chart', `
    <path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10H3v9z"/>
  `);
  ngMdIconServiceProvider.addShape('excel', `
    <path d="M 12 3 L 2 5 L 2 19 L 12 21 L 12 3 z M 14 5 L 14 7 L 16 7 L 16 9 L 14 9 L 14 11 L 16 11 L 16 13 L 14 13 L 14 15 L 16 15 L 16 17 L 14 17 L 14 19 L 21 19 C 21.552 19 22 18.552 22 18 L 22 6 C 22 5.448 21.552 5 21 5 L 14 5 z M 18 7 L 20 7 L 20 9 L 18 9 L 18 7 z M 4.1757812 8.296875 L 5.953125 8.296875 L 6.8769531 10.511719 C 6.9519531 10.692719 7.0084063 10.902625 7.0664062 11.140625 L 7.0917969 11.140625 C 7.1247969 10.997625 7.1919688 10.779141 7.2929688 10.494141 L 8.3222656 8.296875 L 9.9433594 8.296875 L 8.0078125 11.966797 L 10 15.703125 L 8.2714844 15.703125 L 7.1582031 13.289062 C 7.1162031 13.204062 7.0663906 13.032922 7.0253906 12.794922 L 7.0097656 12.794922 C 6.9847656 12.908922 6.934375 13.079594 6.859375 13.308594 L 5.7363281 15.703125 L 4 15.703125 L 6.0605469 11.996094 L 4.1757812 8.296875 z M 18 11 L 20 11 L 20 13 L 18 13 L 18 11 z M 18 15 L 20 15 L 20 17 L 18 17 L 18 15 z"/>
  `);
  ngMdIconServiceProvider.addShape('xls', `
    <path d="M6.474 22.226c-.613-.195-1.048-.571-1.317-1.137-.162-.34-.17-.412-.19-1.625l-.02-1.269-.283-.042c-.382-.058-1.022-.386-1.227-.63a3.657 3.657 0 0 1-.342-.53l-.174-.33V10.399l.174-.33c.096-.181.247-.416.336-.522.214-.254.835-.579 1.215-.635l.305-.045.018-2.819.019-2.819.169-.355a2.156 2.156 0 0 1 1.026-1.026l.355-.169 4.877-.017 4.877-.018 2.6 2.603 2.602 2.602-.017 6.943-.018 6.942-.168.356a2.156 2.156 0 0 1-1.027 1.026l-.355.169-6.588.012c-5.189.01-6.644-.005-6.847-.07zm12.95-3.01v-1.034H7.024v2.067H19.425zm-12.79-3.988c.196-.47.37-.855.389-.855.017 0 .192.384.388.855l.356.854.667.019.667.018-.677-1.31-.677-1.31.638-1.228c.35-.675.638-1.249.639-1.275 0-.027-.282-.048-.629-.048h-.63l-.352.84c-.194.461-.37.839-.39.839-.021 0-.197-.378-.39-.84l-.353-.838-.63-.001c-.346 0-.63.021-.629.048.001.026.288.6.639 1.275l.636 1.228-.676 1.31-.676 1.31.667-.018.667-.019zm6.59.37v-.517h-2.067v-4.134h-1.034v5.168h3.1zm3.146.442c.194-.049.39-.165.57-.339.437-.42.533-.984.264-1.56-.188-.405-.578-.746-1.178-1.031-.751-.357-.999-.807-.641-1.164.333-.333.94-.104.94.355v.196h1.049l-.042-.265c-.12-.744-.638-1.206-1.426-1.268-1.01-.08-1.677.472-1.669 1.381.007.71.314 1.072 1.354 1.595.254.127.523.31.597.405.317.403.065.93-.445.93-.336 0-.55-.2-.612-.574l-.046-.27-.495.018-.494.019.022.226c.032.327.249.797.463 1.002.372.356 1.148.506 1.789.344zm3.055-7.677v-.516H15.29V3.713H7.023V8.88H19.425z"/>
  `);
  ngMdIconServiceProvider.addShape('csv', `
    <path d="M6.493 22.264c-.309-.075-.863-.4-1.039-.609a3.568 3.568 0 0 1-.332-.52c-.169-.32-.174-.367-.196-1.631l-.023-1.301-.786-.027c-.745-.025-.808-.038-1.194-.245-.451-.241-.646-.442-.905-.932l-.174-.33V10.4l.174-.33c.259-.49.454-.691.905-.933.386-.206.45-.219 1.196-.244l.789-.027.019-2.852.02-2.852.22-.407c.245-.453.447-.648.936-.905l.33-.175 4.911-.017 4.912-.018 2.603 2.605 2.602 2.604-.017 6.978-.018 6.978-.22.407c-.246.452-.447.647-.936.905l-.33.174-6.625.01c-3.643.007-6.713-.01-6.822-.037zm12.897-3.042v-1.034H6.982v2.068H19.39zM6.82 15.92c.613-.29 1.084-.925 1.174-1.58l.04-.289h-.51l-.51.001-.097.302a1.012 1.012 0 0 1-1.784.307c-.179-.233-.188-.278-.208-1.036-.025-.91.045-1.142.43-1.435.186-.143.295-.174.598-.174.317 0 .407.028.62.198.168.135.279.296.344.5l.097.303h1.02l-.04-.288c-.09-.653-.556-1.283-1.174-1.586-.464-.227-1.28-.227-1.744 0-.413.202-.8.59-1.001 1.002-.14.286-.161.428-.183 1.248-.027 1.035.04 1.367.383 1.864.537.78 1.674 1.077 2.545.663zm4.778.008c.415-.2.635-.544.671-1.045.055-.758-.308-1.252-1.315-1.785-.463-.246-.602-.353-.692-.539-.202-.411.043-.77.525-.77.221 0 .444.225.5.504l.041.207h.953v-.21c-.002-.115-.055-.326-.12-.468-.33-.721-1.169-1.04-2.05-.778-.968.288-1.253 1.606-.501 2.312.103.097.477.33.83.52.72.385.915.607.84.953-.065.293-.268.45-.583.45-.326 0-.52-.179-.597-.551l-.053-.257-.499-.018c-.571-.022-.57-.023-.398.557.151.51.52.875 1.063 1.053.298.098 1.057.024 1.385-.135zm5.007-2.313c.37-1.377.685-2.54.701-2.585.023-.06-.107-.08-.522-.08-.47 0-.557.016-.586.112-.019.063-.226.855-.46 1.761a79.758 79.758 0 0 1-.462 1.745c-.028.076-.511-1.674-.95-3.441-.043-.177-.047-.178-.599-.178-.416 0-.547.02-.525.081.016.045.331 1.208.7 2.585l.672 2.504h1.359l.672-2.504zm2.785-5.25v-.518h-4.136V3.711H6.982v5.17H19.39z" />
  `);
  ngMdIconServiceProvider.addShape('volledig_document', `
    <path d="M19.808 15.541a.765.765 0 0 1-.763.764H5.154a.766.766 0 0 1-.765-.764V8.468c0-.421.344-.764.765-.764h13.891a.765.765 0 0 1 .763.764zm-.763-8.936H5.154A1.865 1.865 0 0 0 3.29 8.468v7.073a1.865 1.865 0 0 0 1.863 1.863h13.89a1.865 1.865 0 0 0 1.863-1.863V8.468a1.865 1.865 0 0 0-1.862-1.863" />
    <path d="M2.863 8.377h-1.16v-3.34h3.34v1.16h-2.18zm19.69 0h-1.16v-2.18h-2.18v-1.16h3.34zm0 10.66h-3.341v-1.159h2.18l.001-2.18h1.16zm-17.51 0h-3.34v-3.34h1.16v2.18l2.18.002z" />
  `);
  ngMdIconServiceProvider.addShape('voldoende_licht', `
    <path d="M12.027 6.482a.638.638 0 0 0 .638-.638V4.168a.639.639 0 0 0-1.276 0v1.676c0 .352.285.638.638.638M7.17 8.12a.636.636 0 0 0 .903 0 .638.638 0 0 0 0-.903L6.888 6.032a.637.637 0 1 0-.902.903zM4.121 12.712h1.676a.638.638 0 0 0 0-1.277H4.121a.638.638 0 0 0 0 1.277M7.17 16.027l-1.184 1.185a.638.638 0 1 0 .902.903l1.185-1.185a.638.638 0 0 0-.902-.903M11.389 18.303v1.677a.638.638 0 0 0 1.276 0v-1.677a.638.638 0 1 0-1.276 0M15.98 16.027a.638.638 0 0 0 0 .903l1.186 1.185a.635.635 0 0 0 .902 0 .638.638 0 0 0 0-.903l-1.185-1.185a.638.638 0 0 0-.902 0M17.618 12.074c0 .352.286.638.639.638h1.675a.639.639 0 0 0 0-1.277h-1.675a.638.638 0 0 0-.639.639M9.524 9.57a3.529 3.529 0 0 1 2.503-1.034c.906 0 1.813.344 2.503 1.034a3.544 3.544 0 0 1 0 5.007 3.544 3.544 0 0 1-5.006 0 3.544 3.544 0 0 1 0-5.007m-.903 5.91a4.801 4.801 0 0 0 3.406 1.408c1.233 0 2.466-.47 3.405-1.409a4.821 4.821 0 0 0 0-6.811 4.822 4.822 0 0 0-6.81 0 4.821 4.821 0 0 0 0 6.811M16.432 8.307a.637.637 0 0 0 .451-.187l1.185-1.185a.638.638 0 0 0-.902-.903l-1.185 1.186a.638.638 0 0 0 .45 1.089" />
  `);
  ngMdIconServiceProvider.addShape('geen_flits', `
    <path d="M18.658 19.674a.76.76 0 0 0 1.078 0 .762.762 0 0 0 0-1.078l-4.5-4.498 1.9-2.62h-3.793l3.315-7.557h-5.406l-1.663 4.53-4.579-4.58A.762.762 0 0 0 3.933 4.95zM14.041 15.746l-2.122-2.121-2.788 7.082h1.314zM7.877 13.12h3.538l-2.589-2.588z" />
  `);
  ngMdIconServiceProvider.addShape('geen_reflecties', `
    <path d="M20.693 16.26a.864.864 0 0 1-.862.863H4.138a.864.864 0 0 1-.864-.863V8.27c0-.476.388-.864.864-.864H19.83c.476 0 .862.388.862.863zm-.862-10.095H4.138c-1.16 0-2.104.944-2.104 2.104v7.991c0 1.16.944 2.104 2.104 2.104H19.83c1.16 0 2.103-.944 2.103-2.104V8.27c0-1.161-.943-2.105-2.103-2.105" />
    <path d="M7.411 7.929l-3.613 3.614v2.672l6.285-6.286zM3.892 16.495a.338.338 0 0 0 .246.105h6.136l8.672-8.671h-6.489z" />
  `);
})

.config(function ($locationProvider, $stateProvider, $urlRouterProvider) {

  $locationProvider.html5Mode(true);

  $urlRouterProvider.rule(function($injector, $location) {

    var path = $location.path();
    var hasTrailingSlash = path[path.length-1] === '/';

    if(hasTrailingSlash) {

      //if last charcter is a slash, return the same url without the slash
      var newPath = path.substr(0, path.length - 1);
      return newPath;
    }

  });

  /**
   * Prevent infinite loop when requesting non-existing url
   * see https://github.com/angular-ui/ui-router/issues/600
   */
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var $state = $injector.get('$state');
    if (window.LogRocket) {
      window.LogRocket.debug('[$state.go] non-existing url -> home');
    }
    // $log.debug('[$state.go] non-existing url -> home');
    $state.go('home');
  });

  /**
  * Force server reload for these urls:
  */
  $stateProvider.state('autodelen', {
    url: '/autodelen',
    onEnter: ['$window', function ($window) {
      $window.location.reload();
    }]
  });
  $stateProvider.state('autodelen2', {
    url: '/autodelen/*path',
    onEnter: ['$window', function ($window) {
      $window.location.reload();
    }]
  });

})

.config(function (appConfig, uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: appConfig.gmaps_js_api_key,
    v: '3.35.0',
    libraries: 'places',
    language: 'nl'
  });
})

.config(function (appConfig, googleTagManagerProvider) {
  if (appConfig.gtmContainerId) {
    googleTagManagerProvider.init(appConfig.gtmContainerId);
  }
})

.config(function (appConfig, facebookProvider, twitterProvider) {
    // if (appConfig.features.facebook && appConfig.fbAppId) {
    //   facebookProvider.init(appConfig.fbAppId);
    // }
    // if (appConfig.features.twitter) {
    //   twitterProvider.init();
    // }
})
  /**
   * Disable logging for non-development environments
   */
  .config(function ($logProvider, ENV) {
    if (ENV !== 'development') {
      $logProvider.debugEnabled(false);
    }
  })

.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default');
   // .primaryPalette('pink', {
   //   'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
   // })
   // // If you specify less than all of the keys, it will inherit from the
   // // default shades
   // .accentPalette('purple', {
   //   'default': '200' // use shade 200 for default, and keep all other shades the same
   // });
})

.directive('spinner', function () {
  return {
    restrict: 'E',
    //replace: true,
    template: '<md-progress-circular md-mode="indeterminate" md-diameter="60" class="mw-primary md-hue-2" style="margin: 0 auto;"></md-progress-circular>',
  };
})

.directive('inlineSpinner', function () {
  return {
    restrict: 'E',
    //replace: true,
    template: '<span style="display: inline-block; margin: 0 2px; vertical-align: middle; width: 28px; height: 28px; position: relative;"><md-progress-circular md-mode="indeterminate" md-diameter="40" class="mw-primary md-hue-2" style="position: absolute; top: -6px; left: -6px;"></md-progress-circular></span>',
  };
})

.directive('convertToNumber', function() {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) {
        return val !== null ? parseInt(val, 10) : null;
      });
      ngModel.$formatters.push(function(val) {
        return val !== null ? '' + val : null;
      });
    }
  };
})

.directive('smoothScrollToItem', function () {
  return {
    restrict: 'A',
    scope: {
      smoothScrollToItem: '@',
    },
    link: function (scope, element, attr) {
      element.on('click', function() {
        $('html,body').animate({ scrollTop: $(scope.smoothScrollToItem).offset().top }, 300);
      });
    },
  };
})

.factory('autocompleteOptions', function ($filter) {
  return {
    componentRestrictions: { country: $filter('translateOrDefault')('SEARCH_COUNTRY', 'nl') },
    types   : ['geocode'],
    fields : [
      'formatted_address',
      'address_component',
      'geometry',
      'icon',
      'id',
      'place_id',
    ],
  };
})

.value('unwrap', function (x) {
  return typeof x === 'function' ? x() : x;
})

.value('makeHomeAddressPrefill', function (me) {
  if (!me) {
    return '';
  }
  else if (me.streetName && me.streetNumber && me.city) {
    return me.streetName + ' ' + me.streetNumber + ', ' + me.city;
  }
  else if (me.streetName && me.city) {
    return me.streetName + ' ' + me.city;
  }
  else if (me.city) {
    return me.city;
  }
  else {
    return '';
  }
})

// A mapping from the blacklisted "fields"
//  to the concrete excluded properties of a given
//  person entity
.value('personProfileBlacklistPropMap', {
  gender            : ["male"],
  dateOfBirth       : ["dateOfBirth"],
  address           : ["zipcode", "streetNumber", "city", "streetName", "latitude", "longitude"],
  driverLicense     : ["driverLicenseNumber", "drivingLicenseValidUntil"],
  externalIdentifier: ["externalIdentifier"],
})

.factory('blacklistFilterPersonProps', function ($rootScope, personProfileBlacklistPropMap) {
  const blacklistedProps = Object.entries($rootScope.providerInfo.extraInfo.personProfileBlacklist)
    .map(([field, blacklist]) => blacklist ? field : null)
    .map(field => field ? personProfileBlacklistPropMap[field] : [])
    .reduce((a, b) => a.concat(b), []);

  return function (personProps) {
    personProps = _.clone(personProps);
    blacklistedProps.forEach(prop => {
      delete personProps[prop];
    });
    return personProps;
  };
})

.value('isBeheerder', function (person, resource) {
  return (resource.contactPersonId === person.id) && (resource.ownerId !== person.id);
})

.filter('removeIdAnnotation', function () {
  return function (str) {
    return (str || '').replace(/[ ]*\[[a-z0-9]*\][ ]*$/i, '');
  };
})

.filter('snarkdown', () => md => {
  return snarkdown(md || "");
})

.filter('homeAddress', function (makeHomeAddressPrefill) {
  return makeHomeAddressPrefill;
})

.filter('toParagraphs', function () {
  return function (text) {
    return text.replace(/\r/g, '').split('\n\n').map(function (p) {
      return '<p>' + p + '</p>';
    }).join('');
  };
})

.filter('highlightPin', function () {
  return function (html) {
    return html.replace(/De pincode van de tankpas is ([0-9]{4})./, function (str, pin) {
      return 'De pincode van de tankpas is <strong class="pin">' + pin + '</strong>.';
    });
  };
})

.run(function (windowSizeService, oAuth2MessageListener, stateAuthorizer, authService, featuresService) {
  /* Intentionally left blank */
})

.run(function ($window, $log, $timeout, $state, $stateParams, $rootScope, $anchorScroll,
  appConfig,
  alertService, featuresService, linksService, metaInfoService, Analytics, authService, $location, $localStorage,
  AB,
  $analytics) {

  
  $rootScope.moment = moment;

  $rootScope.appConfig = appConfig;
  $rootScope.dev = typeof appConfig.test === 'object';

  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.isLanguageLoaded = false;

  var hash = function(s) {
    /* Simple hash function. */
    var a = 1, c = 0, h, o;
    if (s) {
      a = 0;
      for (h = s.length - 1; h >= 0; h--) {
        o = s.charCodeAt(h);
        a = (a<<6&268435455) + o + (o<<14);
        c = a & 266338304;
        a = c!==0?a^c>>21:a;
      }
    }
    return String(a);
  };

  function possiblyRedirectToProfileFlow (e) {
    if (authService.user.isAuthenticated) {
      const me = authService.user.identity;
      const shouldFlow = me && me.isBusinessConnected && !me.flowCompleted;
      const onDashboard = $state.includes('owm.person.dashboard');
      const onLandingPage = $state.includes('owmlanding');
      if (shouldFlow && !onDashboard && !onLandingPage) {
        e.preventDefault();
        $log.debug('[$state.go] possiblyRedirectToProfileFlow -> owm.person.dashboard');
        $state.go('owm.person.dashboard');
      }
    }
  }

  function setAnalyticsUser () {
    if (authService.user.isAuthenticated) {
      var userId = authService.user.identity.firstName + authService.user.identity.id;
      var hashedUserId = hash(userId);
      $analytics.setUsername(hashedUserId);
    }

    var dataLayer = window.dataLayer = window.dataLayer || [];
    dataLayer.push({
      'mywheels user category': (!authService.user || !authService.user.identity || authService.user.identity.status === 'new') ? 'newUser' : 'returningUser'
    });
  }

  function setAnalyticsUserStats () {
    if (authService.user.isAuthenticated) {
      setAnalyticsUser();

      var userStatus = authService.user.identity.status;
      var numberBookings = authService.user.identity.numberOfBookings;
      var userPreference = authService.user.identity.preference;

      var dataLayer = window.dataLayer = window.dataLayer || [];
      dataLayer.push({
        'mywheels user status': userStatus,
        'mywheels number of bookings': numberBookings,
        'mywheels user preference': userPreference,
      });
    }
  }
  $rootScope.setAnalyticsUserStats = setAnalyticsUserStats;

  $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState) {
    // show spinner
    if (toParams.loader !== false && !toState.noGlobalLoader) {
      alertService.load();
    }

    setAnalyticsUser();

    if (toState.redirectTo) {
      e.preventDefault();
      var redirectTo = (typeof toState.redirectTo === 'function') ? toState.redirectTo() : toState.redirectTo;
      var redirectToParams = (typeof toState.redirectToParams === 'function') ? toState.redirectToParams() : toState.redirectToParams;
      $state.go(redirectTo, angular.merge(toParams, redirectToParams || {}), { location: 'replace' });
    }
  });

  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    $state.previous = fromState;

    possiblyRedirectToProfileFlow(event);

    $rootScope.previousState = fromState;
    $rootScope.previousStateParams = fromParams;
    // hide spinner
    alertService.loaded();

    if (authService.user.isAuthenticated) {
      setAnalyticsUserStats();
    }

    $localStorage.discountCode = ($location.search().discountCode || $localStorage.discountCode);

    // scroll to top, except for place pages (for toggling map <--> list)
    // depends on presence of DOM-element with id="scroll-to-top-anchor"
    // TODO(?): move to a better place
    if (['owm.resource.place.list', 'owm.resource.place.map'].indexOf(toState.name) < 0) {
      $anchorScroll('scroll-to-top-anchor');
    }

    // set page title
    if (!metaInfoService.isSet('title') && toState.data) {
      metaInfoService.setTranslated({
        title: toState.data.title,
        description: toState.data.description
      });
    }
    metaInfoService.flush();

    /**
     * Use new bootstrap container width on certain pages
     * (can be removed when implemented everywhere)
     */
    $rootScope.containerTransitional = (
      (featuresService.get('filtersSidebar') && $state.includes('owm.resource.search')) ||
      (featuresService.get('filtersSidebar') && $state.includes('owm.resource.place')) ||
      (featuresService.get('resourceSidebar') && $state.includes('owm.resource.show')) ||
      $state.includes('subscribe') ||
      $state.includes('invite') ||
      $state.includes('member') ||
      $state.includes('owm.resource.edit') ||
      $state.includes('owm.resource.create') ||
      $state.includes('owm.resource.own') ||
      $state.includes('owm.message') ||
      $state.includes('owm.trips') ||
      $state.includes('owm.finance.vouchers') ||
      $state.includes('owm.finance.invoice') ||
      $state.includes('owm.instantpayment') ||
      $state.includes('owm.finance.v4') ||
      $state.includes('owm.finance.kmpoints') ||
      $state.includes('owm.auth.signup') ||
      $state.includes('owm.person.details') ||
      $state.includes('owm.person.profile') ||
      $state.includes('owm.person.dashboard') ||
      $state.includes('owm.booking.show') ||
      $state.includes('owmlanding') ||
      $state.includes('contractchoice')
    );
    $rootScope.containerHome = (
      ($state.includes('home')) || ($state.$current.self.url === '/auto-verhuren')
    );
    $rootScope.containerIntro = (
      ($state.includes('owm.person.intro'))
    );
    $rootScope.mdOk = ($rootScope.containerTransitional || $rootScope.containerHome);
  });

  // show an error on state change error
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    alertService.loaded();
    $log.debug('State change error', error);
    alertService.closeAll();
    
    if (!fromState.name) {
      $timeout(function () {
        $log.debug('[$state.go] $stateChangeError without fromState.name -> home');
        $state.go('home');
      }, 0);
    } else {
      // (stay on same page)
      alertService.add('danger', error.message || 'Woops, er is iets mis gegaan', 5000);
    }
  });

});

// MANUAL BOOTSTRAP

(function () {
  var injector = angular.injector(['ng']);
  var $http = injector.get('$http');
  var $window = injector.get('$window');
  var $q = injector.get('$q');
  var $log = injector.get('$log');

  if (window.LogRocket) {
    window.LogRocket.init('lftqp6/mywheels', {
      release: '2.82.0'
    });
  }

  if (!window.jasmine) {

    if ($window.location.host.indexOf('127.0.0.1') >= 0) {
      $window.location.replace($window.location.href.replace('127.0.0.1', 'localhost'));
    } else {

      // merge configs + bootstrap
      angular.element($window.document).ready(function () {
        $q.all([configFile(), featuresFile()]).then(function (configs) {
          var config = angular.extend(configs[0], configs[1]);
          var ok = bootstrap(config);
          if (ok) {
            $log.debug('app running at ' + config.app_url);
          } else {
            console.log('Invalid configuration');
          }
        });
      });
    }
  }

  function bootstrap(config) {
    window.IS_DEELAUTO = !!config.app_url.match(/deelauto/);

    if (isValidConfig(config)) {
      angular.module('openwheels.config', []).constant('appConfig', {
        appId: config.app_id,
        appSecret: config.app_secret,
        appUrl: config.app_url,
        appTokenRdw: config.app_token_rdw,
        serverUrl: config.server_url,
        authEndpoint: config.auth_endpoint,
        tokenEndpoint: config.token_endpoint,
        gtmContainerId: config.gtm_container_id || null,
        gmaps_js_api_key: (config.test || {}).gmaps_js_api_key || config.gmaps_js_api_key,
        ga_tracking_id: config.ga_tracking_id || null,
        fbAppId: config.fb_app_id || null,
        features: config.features || {},
        test: config.test || {},
      });

      angular.module(['openwheels']).animation('.slide-toggleable', function () {
        return {
          addClass: function (element, className, doneFn) {
            if (className === 'ct-show') {
              window.jQuery(element).slideDown(100, doneFn);
            }
          },
          removeClass: function (element, className, doneFn) {
            if (className === 'ct-show') {
              window.jQuery(element).slideUp(100, doneFn);
            }
          },
        };
      });

      angular.bootstrap(angular.element('html'), ['openwheels']);
      return true;
    }
    return false;
  }

  function configFile() {
    var dfd = $q.defer();
    $http.get('branding/config.json?v=' + moment().format('YYMMDDHHmmss')).then(function (response) {
      dfd.resolve(response.data);
    }).catch(function () {
      dfd.resolve({});
    });
    return dfd.promise;
  }

  function featuresFile() {
    var dfd = $q.defer();
    $http.get('branding/features.json?v=' + moment().format('YYMMDDHHmmss')).then(function (response) {
      dfd.resolve(response.data);
    }).catch(function () {
      dfd.resolve({});
    });
    return dfd.promise;
  }

  function isValidConfig(config) {
    return config &&
      config.app_id &&
      config.app_secret &&
      config.app_url &&
      config.server_url &&
      config.auth_endpoint &&
      config.token_endpoint;
  }
}());
