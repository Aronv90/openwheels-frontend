'use strict';

angular.module('owm.components')

.directive('resourceDashboard', function (
  $state,
  $q,
  $filter,
  $mdDialog,
  appConfig,
  angularLoad,

  API_DATE_FORMAT,
  
  contractService,
  resourceService,
  bookingService,
  extraDriverService,
  calendarService
) {
  return {
    restrict: 'E',
    scope: {
      me: '=',
    },
    templateUrl: 'components/resourceDashboard/resourceDashboard.tpl.html',
    controller: function ($scope, $element) {

      // PUBLIC

      const dateTimeConfig = {
        // showAccept: true,
        focusOnShow: false, // (!) important for mobile
        useCurrent: true,
        toolbarPlacement: 'bottom',
      };

      const dateConfig = $scope.dateConfig = {
        ...dateTimeConfig,
        format: 'DD-MM-YYYY',
        minDate: moment().startOf('day'),
        widgetPositioning: { // with knowledge of the html (!)
          horizontal: 'auto', // 'left',
          vertical: 'bottom',
        },
        width: '20em',
      };

      $scope.scales = {
        day: {
          text: '24 uur',
          interval: [1, "day"],
          makeTitle: a => a.format('ddd D MMMM YYYY'),
          tickFormat: date => moment(date).format('HH:mm'),
          ticks: () => d3.timeHour.every(2),
        },
        two_days: {
          text: '2 dagen',
          interval: [2, "day"],
          makeTitle: a => `${a.format('ddd D MMMM YYYY')} en ${a.clone().add(1, 'day').format('ddd D MMMM YYYY')}`,
          tickFormat: date => moment(date).format('HH:mm'),
          ticks: () => d3.timeHour.every(4),
        },
        week: {
          text: '1 week',
          interval: [1, "week"],
          makeTitle: a => `${a.format('ddd D MMMM YYYY')} t/m ${a.clone().add(6, 'day').format('ddd D MMMM YYYY')}`,
          tickFormat: date => moment(date).format('ddd D'),
          ticks: () => d3.timeDay.every(1),
        },
      };

      $scope.loading = true;
      $scope.grouped = [];
      $scope.data = {};

      $scope.focus = {
        scale: "day",
        date: moment().format(dateConfig.format),

        resourcesPerPage: 10,
        page: 0,

        contract: null,
      };

      $scope.setResourcesPerPage = function (num) {
        $scope.focus.resourcesPerPage = num;
        $scope.focus.page = 0;

        focusUpdated();
      };

      $scope.setPage = function (page) {
        $scope.focus.page = page;

        focusUpdated();
      };

      $scope.changeDate = function () {
        focusUpdated();
      };

      $scope.move = function (dir) {
        if (dir !== 'add' && dir !== 'subtract') {
          dir = 'add';
        }
        const curr = moment($scope.focus.date, dateConfig.format);
        $scope.focus.date = curr[dir](...$scope.scales[$scope.focus.scale].interval).format(dateConfig.format);
        $scope.calendarForm.date.$setTouched(true);
        focusUpdated();
      };

      $scope.setToday = function () {
        $scope.focus.date = moment().format(dateConfig.format);
        $scope.calendarForm.date.$setTouched(true);
        focusUpdated();
      };

      $scope.setScale = function (key) {
        $scope.focus.scale = key;
        focusUpdated();
      };

      $scope.showCreateBookingDialog = function ($event) {
        createBookingDialog({
          event: $event,
        });
      };

      $scope.refresh = function () {
        focusUpdated();
      };


      // PRIVATE

      const settings = {
        rowHeight: 50,
        resourceWidth: 200,
        marginTop: 40,
        marginRight: 4,
        marginBottom: 5,

        vPad: 4,
      };
      const elements = {};

      async function focusUpdated () {
        const scale = $scope.scales[$scope.focus.scale];
        $scope.data.startDate = moment($scope.focus.date, dateConfig.format).startOf(scale.interval[1]);
        $scope.data.endDate = $scope.data.startDate.clone().add(...scale.interval);

        $scope.data.title = scale.makeTitle($scope.data.startDate, $scope.data.endDate);

        $scope.loading = true;

        const { page } = $scope.focus;

        // TODO caching

        // Temporary API call (We're going to use the new `calender.search` later)
        try {
          $scope.data.apiResult = await calendarService.search({
            person: $scope.focus.contract.contractor.id,
            timeFrame: {
              startDate: $scope.data.startDate.format(API_DATE_FORMAT),
              endDate: $scope.data.endDate.format(API_DATE_FORMAT),
            },
            offset: page * $scope.focus.resourcesPerPage,
            limit: $scope.focus.resourcesPerPage,
          });
          $scope.data.grouped = $scope.data.apiResult.result;
          $scope.data.numPages = Math.ceil($scope.data.apiResult.total / $scope.focus.resourcesPerPage);

          $scope.data.paginationLinks = [];
          if (page >= 3) {
            $scope.data.paginationLinks.push({ text: 1, page: 0 });
            if (page > 3) {
              $scope.data.paginationLinks.push({ text: '...' });
            }
          }

          if (page > 1) {
            $scope.data.paginationLinks.push({ text: page - 1, page: page - 2 });
          }
          if (page > 0) {
            $scope.data.paginationLinks.push({ text: page    , page: page - 1 });
          }
          $scope.data.paginationLinks.push({ text: page + 1, page: page     });
          if (page < $scope.data.numPages - 1) {
            $scope.data.paginationLinks.push({ text: page + 2, page: page + 1 });
          }
          if (page < $scope.data.numPages - 2) {
            $scope.data.paginationLinks.push({ text: page + 3, page: page + 2 });
          }

          if (($scope.data.numPages - page - 1) >= 3) {
            if (($scope.data.numPages - page - 1) > 3) {
              $scope.data.paginationLinks.push({ text: '...' });
            }
            $scope.data.paginationLinks.push({ text: $scope.data.numPages, page: $scope.data.numPages - 1 });
          }
        }
        catch (error) {
          $scope.data.apiResult = null;
          $scope.data.grouped = [];
          $scope.data.error = error;
        }

        $scope.loading = false;

        redraw();

        $scope.$digest();
      }

      function redraw () {
        console.log("redraw");

        const W = settings.W = elements.svg.node().clientWidth;
        const Y = Math.max(1, $scope.data.grouped.length);
        const H = Y * settings.rowHeight + settings.marginTop + settings.marginBottom;
        const scale = $scope.scales[$scope.focus.scale];

        elements.container
          .style('height', H + 'px');
        
        elements.svg
          .attr("height", H)
          .attr("width", W)
          .attr("viewBox", `0 0 ${W} ${H}`);

        // VERTICAL LINES AND DATE/TIME AXIS
        const xScale = d3.scaleTime()
          .domain([$scope.data.startDate.toDate(), $scope.data.endDate.toDate()])
          .range([0, W - 200 - settings.marginRight]);
        const timeAxis = d3.axisTop(xScale)
          .ticks(scale.ticks())
          .tickSize(6 + H - settings.marginTop)
          .tickPadding(4)
          .tickFormat(scale.tickFormat);
        elements.svg.select(".time_axis")
          .attr("transform", `translate(${settings.resourceWidth} ${H})`)
          .call(timeAxis);

        // HORIZONTAL LINES
        const yScale = d3.scaleLinear()
          .domain([0, Y])
          .range([0, H - settings.marginTop - settings.marginBottom]);
        const resouceAxis = d3.axisRight(yScale)
          .ticks(Y)
          .tickSize(W);
        elements.svg.select(".resource_axis")
          .attr("transform", `translate(0 ${settings.marginTop})`)
          .call(resouceAxis)
          .select(".domain").remove();
        
        // Reservations
        const all_blocks = _.flatten($scope.data.grouped.map((group, i) => {
          return group.blocks.map(booking => ({
            y: i,
            x0: moment(booking.beginBooking || booking.beginRequested, API_DATE_FORMAT),
            x1: moment(booking.endBooking || booking.endRequested, API_DATE_FORMAT),
            booking,
          }));
        }));

        const block_divs = elements.calendar.select(".blocks").selectAll(".block").data(all_blocks, ({ booking }) => booking.id);
        block_divs.exit().remove();
        const new_block_divs = block_divs
          .enter()
            .append("a")
            .attr("href", "#")
            .attr("onclick", "return false;")
            .attr("class", ({ booking }) => "block")
            .on("click", openDialog);
        new_block_divs.append("div").append("strong").text(({ booking }) => (booking.remarkRequester || "").slice(0, 50))
        new_block_divs.append("div").text(({ booking }) => $filter('fullname')(booking.person))
        new_block_divs.merge(block_divs)
            .style("top", ({ y }) => (yScale(y) + settings.vPad) + "px")
            .style("left", ({ x0 }) => (200 + xScale(x0.toDate())) + "px")
            .style("width", ({ x0, x1 }) => (xScale(x1.toDate()) - xScale(x0.toDate())) + "px")
            .style("height", (settings.rowHeight - 2*settings.vPad) + "px");
        
        elements.calendar.select(".nw")
          .on("mousemove", null)
          .on("mousemove", function () {
            const [x, y] = d3.mouse(this);
            const i = Math.floor(yScale.invert(y));
            const group = $scope.data.grouped[i];
            if (group) {
              const datetime = moment(xScale.invert(x)).roundNext15Min();
              //console.log(x, y, datetime.format(API_DATE_FORMAT), group.resource.alias);
              elements.plus
                .style("display", "block")
                .style("top", (yScale(i + .5) - 23) + "px")
                .style("left", (x - 23) + "px")
                .on("click", () => createBookingDialog({
                  resource: group.resource,
                  datetime,
                  event: d3.event,
                }));
            } else {
              console.log("no resource for:", x, y, i);
            }
          })
          .on("mouseout", () => {
            elements.plus.style("display", "none");
          });
      }

      function openDialog ({ booking }) {
        $mdDialog.show({
          templateUrl: 'components/resourceDashboard/dialog-booking.tpl.html',
          parent: angular.element(document.body),
          targetEvent: d3.event,
          clickOutsideToClose: true,
          hasBackdrop: true,
          fullscreen: true,
          controller: ['$scope', function (dialogScope) {

            dialogScope.booking = booking;

            dialogScope.hide = function () {
              $mdDialog.hide();
            };
          }],
        });
      }

      function createBookingDialog ({ resource = null, datetime = moment(), event }) {
        $mdDialog.show({
          templateUrl: 'components/resourceDashboard/dialog-createBooking.tpl.html',
          parent: angular.element(document.body),
          targetEvent: event,
          clickOutsideToClose: false,
          hasBackdrop: true,
          fullscreen: true,
          controller: ['$scope', function (dialogScope) {

            dialogScope.fixedResource = !!resource;

            dialogScope.booking = {
              resource,
              beginRequested: datetime.format(API_DATE_FORMAT),
              endRequested: datetime.clone().add(1, 'hour').format(API_DATE_FORMAT),
              person: null,
              remarkRequester: '',
            };
            dialogScope.personQuery = '';
            dialogScope.resourceQuery = '';

            dialogScope.$watch('[booking.beginRequested, booking.endRequested]', function () {
              if (!dialogScope.booking.beginRequested || !dialogScope.booking.endRequested) {
                dialogScope.timeFrameError = true;
                return;
              }

              if (moment(dialogScope.booking.beginRequested) >= moment(dialogScope.booking.endRequested)) {
                dialogScope.timeFrameError = 'invalid';
                return;
              }

              dialogScope.timeFrameError = false;
            });

            dialogScope.searchResource = function (query) {
              return resourceService.forOwner({
                person: $scope.focus.contract.contractor.id,
              });
            };

            dialogScope.searchPerson = function (query) {
              return extraDriverService.search({
                person: $scope.focus.contract.contractor.id,
                contract: $scope.focus.contract.id,
                search: query,
                //limit: 999,
                //offset: 0,
              }).then(d => {
                return d.result;
              });
            };

            //dialogScope.selectPerson = () => {};
            //dialogScope.queryChange = () => {};

            dialogScope.create = function () {
              if (dialogScope.timeFrameError || !dialogScope.booking.person || !dialogScope.booking.resource) {
                return;
              }

              dialogScope.succeeded = false;
              dialogScope.failed = false;
              dialogScope.sending = true;
              
              bookingService.create({
                resource: dialogScope.booking.resource.id,
                timeFrame: {
                  startDate: dialogScope.booking.beginRequested,
                  endDate: dialogScope.booking.endRequested
                },
                person: dialogScope.booking.person.id,
                contract: $scope.focus.contract.id,
                remark: dialogScope.booking.remarkRequester,
              })
              .then(createdBooking => {
                dialogScope.succeeded = true;
                $scope.refresh();
              })
              .catch(error => {
                dialogScope.failed = true;
                dialogScope.error = error;
              })
              .finally(__ => {
                dialogScope.sending = false;
              });
            };

            dialogScope.hide = function () {
              $mdDialog.hide();
            };
          }],
        });
      };

      init();
      async function init () {

        moment.fn.roundNext15Min = function () {
          let intervals = Math.floor(this.minutes() / 15);
          if (this.minutes() % 15 != 0) {
            intervals++;
          }
          if(intervals == 4) {
            this.add('hours', 1);
            intervals = 0;
          }
          this.minutes(intervals * 15);
          this.seconds(0);
          return this;
        }

        const contracts = await contractService.forDriver({
          person: $scope.me.id
        });
        $scope.focus.contract = contracts.reduce((companyContract, contract) => {
          return companyContract || (contract.type.id === 120 ? contract : null);
        }, null);

        if ($scope.focus.contract) {

          await angularLoad.loadScript("https://cdnjs.cloudflare.com/ajax/libs/d3/5.9.2/d3.min.js");

          elements.container = d3.select($element.find('.resource_calendar')[0]);
          elements.svg = elements.container.select('svg');
          elements.calendar = elements.container.select('.calendar');
          elements.plus = elements.calendar.select('.plus');

          d3.select(window).on("resize", () => {
            if (!settings.W || settings.W !== elements.svg.node().clientWidth) {
              redraw();
            }
          });

          focusUpdated();
        }

        $scope.$digest();
      }

    },
  };
});