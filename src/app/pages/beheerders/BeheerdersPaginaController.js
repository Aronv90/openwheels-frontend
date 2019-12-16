'use strict';

angular.module('owmlanding.beheerders', ['slick'])

.controller('BeheerdersPaginaController', function ($scope, $log, metaInfoService, appConfig, $anchorScroll, formSubmissionService, personService,
  Analytics) {

  metaInfoService.set({url: appConfig.serverUrl + '/beheerders'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/beheerders'});

  metaInfoService.set({
    title: 'MyWheels Beheerders',
//    description: '',
  });

  // Veelgestelde vragen
  $scope.FAQ = [
    {
      question: 'Wat zijn de taken van een beheerder?',
      answer_html: '<p>Een beheerder let erop dat diens auto in topconditie blijft. Concreet houdt dit in:</p><ul><li>nieuwe leden uitleg geven;</li><li>contact met gebruikers in de buurt onderhouden;</li><li>de reservesleutel beheren en bij nood beschikbaar stellen;</li></ul><p>Jaarlijks onderhoud wordt door de garage gedaan. Als beheerder maak je hier een afspraak voor.</p>',
    }, {
      question: 'Is er een vergoeding voor beheerderschap?',
      answer: 'Ja, al bedankje krijgen MyWheels beheerders maandelijks een vrijwilligersvergoeding in de vorm van 75 vrije kilometers.',
    },
    {
      question: 'Wat als er geen auto in mijn buurt staat?',
      answer_html: '<p>Staat er nog geen MyWheels auto bij jou in de buurt? Neem dan <a href="https://mywheels.nl/autodelen/community/contact/">contact</a> met ons op om de mogelijkheden te bespreken.</p>',
    },
  ];

  $scope.FAQ.left = $scope.FAQ.slice(0, Math.floor($scope.FAQ.length/2));
  $scope.FAQ.right = $scope.FAQ.slice(Math.floor($scope.FAQ.length/2));
  
});
