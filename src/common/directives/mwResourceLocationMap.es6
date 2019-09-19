angular
  .module("mwResourceLocationMap", [])

  .directive("mwResourceLocationMap", function(appConfig, $window) {
    return {
      restrict: "E",
      templateUrl: "directives/mwResourceLocationMap.tpl.html",
      scope: {
        map: "="
      },
      controller: function($scope, $element, $timeout) {
        function render() {
          var center = "";
          var markers;

          if ($scope.map.markers && $scope.map.markers.length > 0) {
            markers = $scope.map.markers.map(m => {
              if (!m.icon.match(/^http/)) {
                m.icon = window.location.origin + "/" + m.icon;
              }
              return encodeURIComponent(
                [
                  "icon:" + m.icon,
                  "|",
                  "scale:2",
                  "|",
                  m.latitude + "," + m.longitude
                ].join("")
              );
            });
          } else {
            center =
              $scope.map.center.latitude + "," + $scope.map.center.longitude;
          }

          var width = 640; // = max width

          if ($window.innerWidth < 640) {
            width = $window.innerWidth;
          }

          var height = 350;

          // make sure polygon is a closed loop
          if ($scope.map.zonePolygon) {
            var coords = $scope.map.zonePolygon.coordinates;
            var a = coords[0];
            var z = coords[coords.length - 1];
            if (z.longitude - a.longitude + (z.latitude - a.latitude) < 0.01) {
              coords.push(a);
            }
          }

          $scope.src = [
            "https://maps.googleapis.com/maps/api/staticmap",
            "?zoom=",
            $scope.map.zoom || 14,
            center ? "?center=" + center : "", // not necessary if marker given
            "&scale=2", // for retina
            "&size=",
            width,
            "x",
            height,
            "&maptype=roadmap",
            markers ? markers.map(def => "&markers=" + def).join("") : "",
            $scope.map.zonePolygon
              ? "&path=color:0xe1a100ff|fillcolor:0xe1a10088|weight:2|" +
                $scope.map.zonePolygon.coordinates
                  .map(function(c) {
                    return c.latitude + "," + c.longitude;
                  })
                  .join("|")
              : "",
            "&key=",
            appConfig.gmaps_js_api_key
            // TODO        "&signature=",
          ].join("");
        }

        render();
        $scope.$watch("map", render);


        // pan-to-marker animation on marker click
        function easeInOutQuad (t) {
          return t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
        }

        $scope._panTimeout = null;
        $scope.panningMapTo = null;
        $scope.panAnimationStep = function () {
          if ($scope.panningMapTo) {
            var t = $scope.panningMapTo.t;
            if (t >= 0) {
              var l = easeInOutQuad(1 - ($scope.panningMapTo.t / $scope.panningMapTo.dur));
              $scope.map.center = {
                latitude: $scope.panningMapTo.from.latitude + l * ($scope.panningMapTo.to.latitude - $scope.panningMapTo.from.latitude),
                longitude: $scope.panningMapTo.from.longitude + l * ($scope.panningMapTo.to.longitude - $scope.panningMapTo.from.longitude),
              };
              $scope.panningMapTo.t -= 10;
              $scope._panTimeout = $timeout($scope.panAnimationStep, 10);
            } else {
              $scope.panningMapTo = null;
            }
          }
        };

        $scope.panToMarker = function (marker) {
          const markerPosition = marker.getPosition();
          const currentCenter = marker.map.getCenter();
          if ($scope._panTimeout) {
            $timeout.cancel($scope._panTimeout);
            $scope._panTimeout = null;
          }
          $scope.panningMapTo = {
            from: {
              latitude: currentCenter.lat(),
              longitude: currentCenter.lng(),
            },
            to: {
              latitude: markerPosition.lat(),
              longitude: markerPosition.lng(),
            },
            dur: 200,
            t: 200,
          };
          $scope._panTimeout = $timeout($scope.panAnimationStep, 0);
        };


        // switching from static to dynamic map

        $scope.openMap = function() {
          $scope.showMap = true;
        };
        $scope.showMap = false;
      }
    };
  });

/*
https://maps.googleapis.com/maps/api/staticmap
  ?center
  &key=AIzaSyAsnQSjaFmgUUm5N_hbgMwY86uuVV6u9nk
  &size=640x256
  &scale=2
  &zoom=15
  &markers=icon%3Ahttps%3A%2F%2Fd2y2masl4rtrav.cloudfront.net%2Fassets%2Fcar%2Fmarker_car%402x-4137c19c693ce3dae521587981f98e8b50065c776bedacafa2edbfb0c903d93e.png%7Cscale%3A2%7C48.878506%2C2.350925
  &signature=MxNgHw_k-IPv9-RN8D9sGpqcjTY=


  icon:https://d2y2masl4rtrav.cloudfront.net/assets/car/marker_car@2x-4137c19c693ce3dae521587981f98e8b50065c776bedacafa2edbfb0c903d93e.png|scale:2|48.878506,2.350925"
*/
