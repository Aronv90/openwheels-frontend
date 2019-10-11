module.exports = {

  src_dir: 'src',
  build_dir: 'build',
  compile_dir: 'bin',
  vendor_dir: 'vendor',

  app_files: {
    js: [
      'src/**/*Module.js', // modules first
      'src/**/*.js',
    ],
    es6: [
      'src/**/*Module.es6', // modules first
      'src/**/*.es6',
    ],
    atpl: [ 'src/app/**/*.tpl.html' ],
    ctpl: [ 'src/common/**/*.tpl.html' ],
    html: [ 'src/index.html' ],
    less: 'src/less/main.less',
    htaccess: 'src/.htaccess'
  },

  vendor_files: {
    js: [
      'vendor_custom/polyfill.min.js',
      'src/polyfills/custom-event.js',

      'src/assets/js/tokenServiceFactory.js',
      'src/assets/js/moment-with-locales.js', // 2.9.0

      'vendor/jquery/dist/jquery.js',

      'vendor_custom/jquery.visible.js',

      'vendor/mobile-detect/mobile-detect.min.js',

      'vendor/angular/angular.js',
      'vendor/angular-aria/angular-aria.js',
      'vendor/angular-material/angular-material.js',
      'vendor/angular-messages/angular-messages.js',
      'vendor/angular-animate/angular-animate.js',
      'vendor/angular-cookies/angular-cookies.js',
      'vendor/angular-sanitize/angular-sanitize.js',
      'vendor/angular-ui-router/release/angular-ui-router.js',
      'vendor/underscore/underscore.js',
//      'vendor/momentjs/moment.js',
//      'vendor/momentjs/moment/lang/nl.js',
      'vendor/angular-bootstrap/ui-bootstrap-tpls.js',

      'vendor/angular-google-maps/dist/angular-google-maps.js',
      'vendor/lodash/dist/lodash.js', // required by angular-google-maps
      //'vendor_custom/markerclusterer.js',

      'vendor/angular-sticky/dist/angular-sticky.js',
      //'vendor/ngSticky/lib/sticky.js',

       // front page slider
      'vendor/slick-carousel/slick/slick.js',
      'vendor/angular-slick/dist/slick.js',

      'vendor/bootstrap/dist/js/bootstrap.js',
      'vendor_custom/eonasdan-bootstrap-datetimepicker/src/js/bootstrap-datetimepicker.js', // depends: jquery, momentjs

      'vendor_custom/nouislider/wNumb.js',
      'vendor_custom/nouislider/nouislider.min.js',

      'vendor/angular-uuid/uuid.js',
      'vendor/angular-jsonrpc-q/build/jsonrpc.js',
      'vendor/angular-moment/angular-moment.js',
      'vendor/angular-material-icons/angular-material-icons.min.js',
      'vendor/angular-percentage-filter/percentage.js',
      'vendor/angular-translate/angular-translate.js',
      'vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
      'vendor/angular-translate-storage-cookie/angular-translate-storage-cookie.js',
      'vendor/angular-translate-storage-local/angular-translate-storage-local.js',
      'vendor/angular-ui-utils/modules/unique/unique.js',
      'vendor/angularjs-socialshare/dist/angular-socialshare.js',
      'vendor/angular-ui-calendar/src/calendar.js',
      'vendor/fullcalendar/fullcalendar.js',
      'vendor/angularjs-geolocation/src/geolocation.js',
      'vendor/ngScrollTo/ng-scrollto.js',
      'vendor/ngstorage/ngStorage.js',
      'vendor/pickadate/lib/picker.js',
      'vendor/pickadate/lib/picker.date.js',
      'vendor/pickadate/lib/picker.time.js',
      'vendor/pickadate/lib/translations/nl_NL.js',
      'vendor/ng-sortable/dist/ng-sortable.js',
      'vendor/ng-optimizely/ng-optimizely.js',
      'vendor/ui-cropper/compile/unminified/ui-cropper.js',
      'vendor/ng-file-upload/ng-file-upload.min.js',
      // 'vendor/angular-recaptcha/release/angular-recaptcha.js',
      'vendor_custom/angular-locale/angular-locale_nl-nl.js',
      'vendor_custom/moment-locale/moment-locale_nl.js',
      'vendor_custom/ngAutocomplete/src/ngAutocomplete.js',
      'vendor_custom/pwstrength-bootstrap/pwstrength-bootstrap-1.2.2.js',
      'vendor_custom/angular-input-match/angular-input-match-1.4.1.js',
      'vendor_custom/angular-google-places-autocomplete/src/autocomplete.js',

      'vendor/owl.carousel/dist/owl.carousel.js',
      'vendor/angular-owl-carousel2/src/angular-owl-carousel-2.js',

      'vendor/angulartics/dist/angulartics.min.js',
      'vendor/angulartics-google-tag-manager/dist/angulartics-google-tag-manager.min.js',

      'vendor_custom/angular-load.js',

      'vendor_custom/snarkdown.js',
      'vendor_custom/LogRocket.min.js'
    ],
    fonts: [
      'vendor/font-awesome/fonts/*'
    ]
  }
};
