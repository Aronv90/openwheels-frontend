angular.module('personalDataDirective', [])

.directive('personalData', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      next: '&',
      resource: '=resource'
    },
    templateUrl: 'directives/personalData/personalData.tpl.html',
    controller: function ($scope, $rootScope, $q, $log, $state, $location, $stateParams, $filter, personService, authService,resourceService,
      $anchorScroll, $timeout, alertService, account2Service, accountService, dutchZipcodeService, Analytics, $translate, featuresService) {

      const _cache = {};

      function performGeocode(params, cont, key, it = 0) {
        return $q((resolve, reject) => {
          if (_cache[key]) {
            console.log("cache hit", key);
            resolve(_cache[key])
          } else if (it >= 20) {
            // console.log("max retries", debugId || params);
            reject("max retries");
          } else if (!window.google) {
            // console.log("defer geocode because google not loaded yet", debugId || params);
            $timeout(() => {
              if (!cont()) {
                console.log("don't continue");
                reject("stale");
              } else {
                performGeocode(params, cont, key, it + 1).then(resolve).catch(reject);
              }
            }, 300);
          } else {
            // console.log("start geocode", debugId || params);
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(params, (results, status) => {
              if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                // console.log("over query limit, retrying in 1000ms...", debugId || params);
                $timeout(() => {
                  if (!cont()) {
                    console.log("don't continue");
                    reject("stale");
                  } else {
                    console.log("  over limit")
                    performGeocode(params, cont, key, it + 1).then(resolve).catch(reject);
                  }
                }, 300);
              } else if (status !== google.maps.GeocoderStatus.OK) {
                // console.log("error geocoding", status, debugId || params);
                reject(`status: ${status}`);
              } else {
                _cache[key] = results;
                resolve(results);
              }
            });
          }
        });
      }

      $scope.countries = [
        { value: "Nederland", iso: "nl" },
        { value: "België", iso: "be" },
        { value: "Frankrijk", iso: "fr" },
        { value: "Duitsland", iso: "de" },
      ];

      //person info
      var masterPerson = null;
      var that;
      //set all vars
      $scope.person = null;
      $scope.genderText = '';
      $scope.submitPersonalDataForm = null;
      $scope.ownerflow = false;
      $rootScope.personSubmitted = false;
      $scope.ibanIsDefined = true;
      $scope.personSubmitted = $stateParams.personSubmitted === 'true' ? true : false;

      $scope.months = [
        {label: $translate.instant('JANUARY'), value: 1},
        {label: $translate.instant('FEBRUARY'), value: 2},
        {label: $translate.instant('MARCH'), value: 3},
        {label: $translate.instant('APRIL'), value: 4},
        {label: $translate.instant('MAY'), value: 5},
        {label: $translate.instant('JUNE'), value: 6},
        {label: $translate.instant('JULY'), value: 7},
        {label: $translate.instant('AUGUST'), value: 8},
        {label: $translate.instant('SEPTEMBER'), value: 9},
        {label: $translate.instant('OCTOBER'), value: 10},
        {label: $translate.instant('NOVEMBER'), value: 11},
        {label: $translate.instant('DECEMBER'), value: 12}
      ];

      $timeout(function () {
        $scope.personalDataForm.$setPristine();
      }, 0);
      var personPage = {
        init: function () {
          $scope.submitPersonalDataForm = personPage.submitDataForm;
          $scope.ownerflow = $state.current.name === 'owm.resource.create.details' ? true : false;
          this.initPerson();
          that = this;

          var initOptions = function () {
            $scope.preferenceOptions = [{
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

          $scope.$on('$translateChangeSuccess', function () {
            initOptions();
          });
          initOptions();
        },
        submitDataForm: function () {
          var _this = this;
          alertService.closeAll();
          alertService.load();

          // check if person had verified phone numbers
          that.initPhoneNumbers();

          var newProps = $filter('returnDirtyItems')(angular.copy($scope.person), $scope.personalDataForm);

          // don't alter firstname or surname if value isn't changed
          if(masterPerson.firstName === $scope.person.firstName) {
            newProps.firstName = undefined;
          }
          if(masterPerson.surname === $scope.person.surname) {
            newProps.surname = undefined;
          }

          // add fields not in form
          if (newProps.zipcode || newProps.streetNumber) {
            newProps.streetName = $scope.person.streetName;
            newProps.city = $scope.person.city;
            newProps.latitude = $scope.person.latitude;
            newProps.longitude = $scope.person.longitude;
          }
          if($scope.person.companyName) {
            newProps.isCompany = true;
          }
          if (moment(masterPerson.dateOfBirth).format('YYYY') + '-' + moment(masterPerson.dateOfBirth).format('M') + '-' + moment(masterPerson.dateOfBirth).format('D') !== $scope.date.year + '-' + $scope.date.month + '-' + $scope.date.day) {
            $scope.person.dateOfBirth = $scope.date.year + '-' + $scope.date.month + '-' + $scope.date.day;
            newProps.dateOfBirth = $scope.person.dateOfBirth;
          }
          newProps.male = $scope.person.male;

          var firstName = $scope.person.firstName,
            surname = $scope.person.surname,
            year = $scope.date.year,
            month = $scope.date.month,
            day = $scope.date.day,
            male = $scope.genderText,
            phoneNumbers = $scope.verifiedPhoneNumbers,
            city = $scope.person.city,
            zipcode = $scope.person.zipcode,
            streetNumber = $scope.person.streetNumber;

          // add phone numbers (not automatically included by 'returnDirtyItems')
          var shouldSavePhoneNumbers = $scope.person.phoneNumbers && (!angular.equals(masterPerson.phoneNumbers, $scope.person.phoneNumbers));
          if (shouldSavePhoneNumbers) {
            angular.forEach($scope.person.phoneNumbers, function (phoneNumber) {
              if (phoneNumber.number) {
                newProps.phoneNumbers = newProps.phoneNumbers || [];
                newProps.phoneNumbers.push({
                  id: phoneNumber.id,
                  number: phoneNumber.number,
                  confidential: phoneNumber.confidential
                });
              }
            });

            if (!Object.keys(newProps).length) {
              // nothing to save
              $scope.personalDataForm.$setPristine();
              return;
            }
          }

          // first check if all person data is filled in
          if (firstName && surname) {
            if (year && month && day) {
              if (phoneNumbers) {
                if (male) {
                  if (streetNumber && zipcode && city && containsStreetNumber(streetNumber)) {
                    // save persons info
                    personService.alter({
                      person: $scope.person.id,
                      newProps: newProps
                    })
                    .then(function () {
                      Analytics.trackEvent('person', 'edited', $scope.person.id, undefined, true);
                      that.initPerson($scope.person);
                      // if person is renter, send to next page
                      $scope.next();
                      // if person is owner, save IBAN if no IBAN is defined
                      if ($state.current.name === 'owm.resource.create.details' && !$scope.ibanIsDefined) {
                        if($scope.account.iban) {
                          accountService.alter({
                            'id': $scope.account.id,
                            'newProps': {
                              'iban': $scope.account.iban
                            }
                          }).then(function(){
                            // make resource availble if IBAN is saved successfully
                            makeResourceAvailable();
                          }).catch(function (err) {
                            alertService.addError(err);
                          })
                          .finally(function () {
                            alertService.loaded();
                          });
                        } else {
                          alertService.add('danger', 'Vul je IBAN-nummer in zodat we verhuuropbrengst kunnen uitbetalen.', 5000);
                          alertService.loaded();
                        }
                      // if person is owner and IBAN is already defined, make resource available
                      } else if ($state.current.name === 'owm.resource.create.details') {
                        makeResourceAvailable();
                      }
                    })
                    .catch(function (err) {
                      if (err.message.match('firstName')) {
                        alertService.add('danger', 'Je voornaam mag je op dit moment niet aanpassen.', 5000);
                        that.initPerson($scope.person);
                      } else if (err.message.match('surname')) {
                        alertService.add('danger', 'Je achternaam mag je op dit moment niet aanpassen.', 5000);
                        that.initPerson($scope.person);
                      } else if (err.message.match('dateOfBirth')) {
                        alertService.add('danger', 'Je geboortedatum mag je op dit moment niet aanpassen.', 5000);
                      } else {
                        alertService.add(err.level, err.message, 5000);
                      }
                    })
                    .finally(function () {
                      alertService.loaded();
                    });
                  } else {
                    alertService.add('danger', 'Vul je postcode en huisnummer in zodat we je post kunnen sturen.', 5000);
                    alertService.loaded();
                  }
                } else {
                  alertService.add('danger', 'Selecteer wat je geslacht is.', 5000);
                  alertService.loaded();
                }
              } else {
                alertService.add('danger', 'Verifieer een telefoonnummer zodat we contact met je kunnen opnemen.', 5000);
                alertService.loaded();
              }
            } else {
              alertService.add('danger', 'Vul je geboortedatum in zodat we weten of je auto mag rijden.', 5000);
              alertService.loaded();
            }
          } else {
            alertService.add('danger', 'Vul je voor- en achternaam in zodat we weten hoe we je mogen aanspreken.', 5000);
            alertService.loaded();
          }

          function containsStreetNumber (string) {
            return /\d/.test(string);
          }

          var makeResourceAvailable = function () {
            // make resource available for renters
            resourceService.alter({
              'resource': $scope.resource.id,
              'newProps': {
                'isAvailableOthers': true,
                'isAvailableFriends': true
              }
            }).then(function(){
              Analytics.trackEvent('resource', 'resource_finished', $scope.resource.id, undefined, true);
              // send owner to next page
              $log.debug($rootScope.personSubmitted);
              $rootScope.personSubmitted = true;
              $anchorScroll('scroll-to-top-anchor');
              // add parameter to url
              $location.search('personSubmitted', 'true');
            }).catch(function (err) {
              alertService.addError(err);
            })
            .finally(function () {
              alertService.loaded();
            });
          };

        },
        initAccount: function (person) {
          if ($state.current.name === 'owm.resource.create.details') {
            alertService.load();
            accountService.get({
              'person': person.id
            }).then(function (value) {
              if (!value.iban) {
                $scope.account = value;
                $scope.ibanIsDefined = false;
              } else {
                $scope.ibanIsDefined = true;
              }

              alertService.loaded();
            }).catch(function (err) {
              alertService.addError(err);
            });
          }
        },
        initPerson: function () {
          var _this = this;
          authService.me(
            !!'forceReload'
          )
          .then(function (person) {
            masterPerson = person;
            $scope.person = angular.copy(person);

            //check if person has iban account
            _this.initAccount(person);

            // check if person has verified phone number
            _this.initPhoneNumbers();

            // certain fields may only be edited if driver license is not yet checked by the office (see template)
            $scope.allowLicenseRelated = (person.driverLicenseStatus !== 'ok');

            // always show at least one phone number field
            phoneNumber.ensure();

            // Gender dropdown is bound to $scope.genderText instead of person.male
            // Binding to person.male doesn't work, because ng-options doesn't differentiate between false and null
            $scope.genderText = (person.male === true ? 'male' : (person.male === false ? 'female' : ''));

            $scope.date = {
              day: Number(moment($scope.person.dateOfBirth).format('DD')),
              month: Number(moment($scope.person.dateOfBirth).format('MM')),
              year: Number(moment($scope.person.dateOfBirth).format('YYYY'))
            };
          });
        },
        initPhoneNumbers: function () {
          $scope.verifiedPhoneNumbers = false;

          for(var i=0; i<$scope.person.phoneNumbers.length; i++) {
            if($scope.person.phoneNumbers[i].verified === true) {
              $scope.verifiedPhoneNumbers = true;
            }
          }
        }
      };

      var phoneNumber = {
        ensure: function () {
          if (!$scope.person.phoneNumbers || !$scope.person.phoneNumbers.length) {
            phoneNumber.add();
          }
        },
        add: function () {
          $scope.person.phoneNumbers = $scope.person.phoneNumbers || [];
          $scope.person.phoneNumbers.push({
            number: '',
            type: 'mobile'
          });
        }
      };

      const lookingUpAddress = $scope.lookingUpAddress = {
        loading: false,
      };

      function lookupAddress(country, zip, streetNo) {
        function mostRecent() {
          return lookingUpAddress.country === country &&
            lookingUpAddress.zip === zip &&
            lookingUpAddress.streetNo === streetNo;
        }

        lookingUpAddress.loading = false;
        delete lookingUpAddress.result;
        delete lookingUpAddress.failed;
        delete lookingUpAddress.country;
        delete lookingUpAddress.zip;
        delete lookingUpAddress.streetNo;

        if (!zip || !streetNo) {
          console.log("not looking up because no data");
          return;
        }

        lookingUpAddress.loading = true;
        lookingUpAddress.country = country;
        lookingUpAddress.zip = zip;
        lookingUpAddress.streetNo = streetNo;

        $timeout(() => {
          if (!mostRecent()) return console.log("abort [0]");

          performGeocode({
            componentRestrictions: {
              country: country,
              postalCode: zip,
            }
          }, mostRecent, `zip: ${zip}, ${country}`)
          .then(results => {
            if (!mostRecent()) return console.log("abort [1]");

            const location = results[0].geometry.location.toJSON();
            performGeocode({
              location,
            }, mostRecent, `location: ${location.lat}, ${location.lng}`)
            .then(results => {
              if (!mostRecent()) return console.log("abort [2]");

              const street_name = results[0].address_components
                .filter(comp => ["route", "street_address"].indexOf(comp.types[0]) >= 0)
                .map(comp => comp.long_name)
                .join(" ");
              const address = `${street_name} ${streetNo}`;
              console.log("ADD", address, results[0]);
              performGeocode({
                address,
                componentRestrictions: {
                  country: country,
                  postalCode: zip,
                }
              }, mostRecent, `address: ${address}, ${zip}, ${country}`)
              .then(results => {
                if (!mostRecent()) return console.log("abort [3]");

                lookingUpAddress.loading = false;
                lookingUpAddress.result = results[0];
                console.log(" >>", results[0]);
              })
              .catch(() => {
                if (!mostRecent()) return console.log("abort [3]");

                lookingUpAddress.loading = false;
                lookingUpAddress.failed = true;
              })
            })
            .catch(() => {
              if (!mostRecent()) return console.log("abort [2]");

              lookingUpAddress.loading = false;
              lookingUpAddress.failed = true;
            })
          })
          .catch(() => {
            if (!mostRecent()) return console.log("abort [1]");

            lookingUpAddress.loading = false;
            lookingUpAddress.failed = true;
          })
        }, 500);
      }

      var inputs = {
        init: function () {
          this.adress();
        },
        adress: function () {
          $scope.$watch('[person.country, person.zipcode, person.streetNumber]',
            ([newCountry, newZip, newStreetNo], [oldCountry, oldZip, oldStreetNo]) => {
              if (newCountry === oldCountry && newZip === oldZip && newStreetNo === oldStreetNo) {
                return;
              }

              lookupAddress($scope.person.country, newZip, newStreetNo);

              // dutchZipcodeService.autocomplete({
              //     country: country,
              //     zipcode: _this.stripWhitespace(newValue[0]),
              //     streetNumber: newValue[1]
              //   })
              //   .then(function (data) {
              //     /*jshint sub: true */
              //     $scope.person.city = data[0].city;
              //     $scope.person.streetName = data[0].street;
              //     $scope.person.latitude = data[0].lat;
              //     $scope.person.longitude = data[0].lng;
              //   }, function (error) {
              //     if ($scope.person.zipcode !== newValue[0] || $scope.person.streetNumber !== newValue[1]) {
              //       //resolved too late
              //       return;
              //     }
              //     $scope.person.city = null;
              //     $scope.person.streetName = null;
              //     $scope.person.latitude = null;
              //     $scope.person.longitude = null;
              //   })
              //   .finally(function () {
              //     $scope.lookingUpAddress = false;
              //   });
            }, true);
        },
        stripWhitespace: function (str) { //remove all spaces
          var out = str;
          while (out.indexOf(' ') >= 0) {
            out = out.replace(' ', '');
          }
          return out;
        }
      };
      personPage.init();
      inputs.init();

    }
  };
});
