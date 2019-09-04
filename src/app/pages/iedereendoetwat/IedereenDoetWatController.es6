
angular.module("owmlanding.iedereendoetwat", ["slick"])

.controller("IedereenDoetWatController", function (
  // $scope,
  // $log,
  metaInfoService,
  appConfig,
  // $anchorScroll,
  // formSubmissionService,
  // personService,
  // Analytics
) {

  metaInfoService.set({ url: appConfig.serverUrl + "/klimaat" });
  metaInfoService.set({ canonical: "https://mywheels.nl" + "/klimaat" });

  metaInfoService.set({
    title: "MyWheels - Iedereen Doet WAT",
    description: "Laat buren, vrienden en anderen nog makkelijker jouw auto huren. Geen sleuteloverdracht, automatische kilometerregistratie en zorgeloos je auto verhuren waar je ook bent.",
  });

  // $scope.$anchorScroll = $anchorScroll;

  // $scope.formEntry = {};
  // $scope.formSendStatus = false;

  // personService.meAnonymous().then(autoFill).catch(function () {});

  // function autoFill (user) {
  //   if ($scope.form.$pristine) {
  //     $scope.formEntry.email = user.email;
  //     $scope.formEntry.firstName = user.firstName;
  //     $scope.formEntry.surname = (user.preposition ? (user.preposition + ' ') : '') + user.surname;
  //     $scope.formEntry.city = user.city;
  //     if (user.phoneNumbers && user.phoneNumbers.length > 0) {
  //       var preferred = user.phoneNumbers[0].number;
  //       for (var i = 0; i < user.phoneNumbers.length; i++) {
  //         if (user.phoneNumbers[i].type === 'mobile') {
  //           preferred = user.phoneNumbers[i].number;
  //         }
  //       }
  //       $scope.formEntry.phoneNumber = preferred;
  //     }
  //     //$scope.formEntry.registrationPlate;
  //   }
  // }

  // $scope.submit = function () {
  //   if ($scope.form.$valid) {
  //     $scope.formSendStatus = 'sending';

  //     formSubmissionService.send({
  //       type: 'mw_open',
  //       email: $scope.formEntry.email,
  //       firstName: $scope.formEntry.firstName,
  //       surname: $scope.formEntry.surname,
  //       city: $scope.formEntry.city,
  //       phoneNumber: $scope.formEntry.phoneNumber,
  //       extraInfo: {
  //         registrationPlate: $scope.formEntry.registrationPlate,
  //         kmStand: $scope.formEntry.kmStand,
  //       },
  //     })
  //     .then(function (r) {
  //       $scope.formSendStatus = 'success';
  //       Analytics.trackEvent('forms', 'mywheels_open_meedoen', undefined, undefined, true);
  //     })
  //     .catch(function (e) {
  //       $scope.formSendStatus = 'error';
  //       Analytics.trackEvent('exceptions', 'mywheels_open_meedoen', undefined, undefined, true);
  //     })
  //     .finally(function () {
  //       // hi
  //     });
  //   }
  // };

});
