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
    controller: function ($scope, $rootScope, unwrap, $q, $log, $element, $state, $location, $stateParams, $filter, personService, authService,resourceService,
      $anchorScroll, $timeout, alertService, autocompleteOptions, account2Service, accountService, dutchZipcodeService, Analytics, $translate, featuresService) {

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

          var newProps = {
            ...$filter('returnDirtyItems')(angular.copy($scope.person), $scope.personalDataForm),
            streetName: $scope.person.streetName,
            streetNumber: $scope.person.streetNumber,
            city: $scope.person.city,
            zipcode: $scope.person.zipcode,
            country: $scope.person.country,
            latitude: $scope.person.latitude,
            longitude: $scope.person.longitude,
          };

          // don't alter firstname or surname if value isn't changed
          if(masterPerson.firstName === $scope.person.firstName) {
            newProps.firstName = undefined;
          }
          if(masterPerson.surname === $scope.person.surname) {
            newProps.surname = undefined;
          }

          // add fields not in form
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
            country = $scope.person.country,
            city = $scope.person.city,
            zipcode = $scope.person.zipcode,
            streetName = $scope.person.streetName,
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
                  if (streetName && streetNumber && city && zipcode && containsStreetNumber(streetNumber) && !zipcodeInvalid(country, zipcode)) {

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
                    alertService.add('danger', 'Vul een geldig adres in, inclusief straatnaam en huisnummer, zodat we je post kunnen sturen.', 5000);
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

            if (person.streetName && person.streetNumber) {
              $scope.addressSearch.found = {};
            }
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

      function zipcodeInvalid(country, zipcode) {
        if (!(zipcode || '').trim()) {
          return 'Vul een postcode in';
        } else if (country === 'Nederland' && !zipcode.match(/^[0-9]{4}[ ]*[A-Z]{2}$/)) {
          return 'Vul een geldige postcode in';
        } else {
          // no error
          return false;
        }
      }
      $scope.zipcodeInvalid = zipcodeInvalid;

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

      const { componentRestrictions: __, ...rest } = autocompleteOptions;
      $scope.autocompleteOptions = rest;

      // Step 0: show google autocomplete searchbar [found = falsey]
      // Step 1: split into components, allow changes and try to fetch more accurate lat/lng [found = object]
      $scope.addressSearch = {
        // address?: google autocomplete result
        // found?: parsed version of previously google-found address, or just empty object in case of existing data
        // error
      };

      function extract(address) {
        // `address` is single geocoder result
        return angular.merge(
          address.address_components.reduce((found, { short_name, long_name, types }) => {
            if (types[0] === "street_number") {
              found.streetNumber = long_name;
            } else if (types[0] === "route" || types[0] === "street_address") {
              found.streetName = long_name;
            } else if (types[0] === "locality") {
              found.city = long_name;
            } else if (types[0] === "country") {
              found.country = long_name;
            } else if (types[0] === "postal_code") {
              found.zipcode = long_name;
            }
            return found;
          }, {}),
          (address.geometry && address.geometry.location)
            ? {
                latitude: unwrap(address.geometry.location.lat),
                longitude: unwrap(address.geometry.location.lng),
              }
            : {}
        );
      }

      $scope.backToAutocomplete = () => {
        delete $scope.addressSearch.found;
        delete $scope.addressSearch.address;
        delete $scope.person.streetName;
        delete $scope.person.streetNumber;
        delete $scope.person.zipcode;
        delete $scope.person.country;
        delete $scope.person.city;
        $timeout(() => {
          $element.find("#autocomplete_address_search").focus();
        }, 0);
      };

      $scope.selectAutocompleteAddress = () => {
        const address = $scope.addressSearch.address;
        if (!$scope.addressSearch.found && address && address.address_components) {
          const found = extract(address);
          // console.log(address, found);
          if (!found.streetName || !found.city || !found.country || !found.latitude || !found.longitude) {
            $scope.addressSearch.error = "not_enough_info";
            $scope.addressSearch.address = null;
          } else {
            delete $scope.addressSearch.error;
            console.log("found", found);
            $scope.addressSearch.found = found;
            angular.merge($scope.person, found);
            $timeout(() => {
              $element.find("#streetNumber").focus();
            }, 0);
          }
        }
      };

      const _additionalGeocode = {};
      $scope.onSplitAddressChange = () => {
        const promise = _additionalGeocode.mostRecent = $q((resolve, reject) => {
          $timeout(() => {
            if (promise !== _additionalGeocode.mostRecent) {
              // console.log("skipping result because not most recent [before geocode]");
              return;
            }
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({
              address: `${$scope.person.streetName}, ${$scope.person.streetNumber}, ${$scope.person.zipcode}, ${$scope.person.city}`,
              componentRestrictions: { country: $scope.person.country },
              region: "nl"
            }, (results, status) => {
              if (promise !== _additionalGeocode.mostRecent) {
                // console.log("skipping result because not most recent [on geocode result]");
                return;
              }
              if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                $timeout($scope.onSplitAddressChange, 500);
              } else if (status === google.maps.GeocoderStatus.OK) {
                const found = extract(results[0]);
                // console.log(found);
                if (found.streetName && found.latitude && found.longitude) {
                  if ((found.streetName === $scope.person.streetName) ||
                      (found.zipcode || '').replace(/ /g, '') === ($scope.person.zipcode || '').replace(/ /g, '')
                  ) {
                    const newLocData = { latitude: found.latitude, longitude: found.longitude };
                    angular.merge($scope.person, newLocData);
                  }
                }
              }
            });
          }, 500);
        });
      };

      personPage.init();

    }
  };
});
