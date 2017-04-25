'use strict';

angular.module('owm.resourceQueryService', [])

.factory('resourceQueryService', function (API_DATE_FORMAT) {

  var URL_DATE_TIME_FORMAT = 'YYMMDDHHmm';

  var sortModes = ['relevance', 'distance', 'price'];
  var defaultSortMode = 'relevance';

  var data = {
    text     : '',
    location : null,
    timeFrame: null,
    radius   : null,
    options  : null,
    filters  : null,
    sort     : defaultSortMode,
    version  : null,
  };


  var optionApi2Url = {};
  var optionUrl2Api = {};
  (function () {
    var url = ['airco','fietsendrager','winderbanden','kinderzitje','navigatie','trekhaak','automaat','mp3','rolstoel'];
    var api = [
      'airconditioning',
      'fietsendrager',
      'winterbanden',
      'kinderzitje',
      'navigatie',
      'trekhaak',
      'automaat',
      'mp3-aansluiting',
      'rolstoelvriendelijk'
    ];
    for (var i=0; i < url.length; i++) {
      optionApi2Url[api[i]] = url[i];
      optionUrl2Api[url[i]] = api[i];
    }
  }());

  var filterApi2Url = {};
  var filterUrl2Api = {};
  (function () {
    var url = ['fuel','lock','seats','type', 'smartwheels'];
    var api = [
      'fuelType',
      'locktype', // FIXME: apparently needs lowercase
      'minSeats',
      'resourceType',
      'smartwheels'
    ];
    for (var i=0; i < url.length; i++) {
      filterApi2Url[api[i]] = url[i];
      filterUrl2Api[url[i]] = api[i];
    }
  }());

  function setText (text) {
    data.text = text || '';
  }

  function setRadius (radius) {
    try {
      data.radius = parseInt(radius);
    } catch (e) {
      data.radius = null;
    }
  }

  function setLocation (location) {
    if (location && location.latitude && location.longitude) {
      data.location = {
        latitude : location.latitude,
        longitude: location.longitude
      };
    } else {
      data.location = null;
    }
  }

  function setSort(sort) {
    if(sortModes.indexOf(sort) >= 0) {
      data.sort = sort;
    }
  }

  function getSort() {
    return data.sort;
  }


  /**
   * Expects API-date-formatted strings
   */
  function setTimeFrame (timeFrame) {
    var d1 = timeFrame ? timeFrame.startDate : null;
    var d2 = timeFrame ? timeFrame.endDate   : null;
    if ( d1 && d2 && moment(d1).isValid() && moment(d2).isValid() ) {
      data.timeFrame = {
        startDate: d1,
        endDate  : d2
      };
    } else {
      data.timeFrame = null;
    }
  }

  function setOptions (optionsArray) {
    data.options = optionsArray && optionsArray.length ? optionsArray : null;
  }

  function setPage (page) {
    if(page) {
      data.page = parseInt(page);
    } else {
      data.page = page;
    }
  }

  function setFilters (filtersObject) {
    data.filters = null;
    angular.forEach(filtersObject, function (value, key) {
      if (!value) { return; }
      if (key === 'minSeats') {
        try {
          data.filters = data.filters || {};
          data.filters[key] = parseInt(value);
        } catch (e) {
        }
      } else {
        data.filters = data.filters || {};
        data.filters[key] = value;
      }
    });
  }

  function createStateParams () {
    var stateParams = {};
    if (data.location) {
      stateParams.lat = data.location.latitude;
      stateParams.lng = data.location.longitude;
    }
    if (data.timeFrame) {
      stateParams.start = moment(data.timeFrame.startDate).format(URL_DATE_TIME_FORMAT);
      stateParams.end   = moment(data.timeFrame.endDate  ).format(URL_DATE_TIME_FORMAT);
    }
    if (data.text) {
      stateParams.text = data.text;
    }
    if (data.radius) {
      stateParams.radius = data.radius;
    }
    if (data.page && data.page !== 1) {
      stateParams.page = data.page;
    }

    if(data.sort && data.sort !== defaultSortMode) {
      stateParams.sort = data.sort;
    }

    if(data.version) {
      stateParams.version = data.version;
    }

    if (data.options) {
      stateParams.options = data.options.map(function (option) {
        return optionApi2Url[option];
      }).join(',');
    }

    if (data.filters) {
      Object.keys(data.filters).forEach(function (key) {
        stateParams[filterApi2Url[key]] = data.filters[key];
      });
    }

    return stateParams;
  }

  function setVersion(version) {
    version = window.parseInt(version);
    if(version === 3 || version === 2) {
      data.version = version;
    }
  }

  function parseStateParams (stateParams) {
    if (!stateParams) { return; }

    setText(stateParams.text);

    setLocation({
      latitude : stateParams.lat,
      longitude: stateParams.lng
    });

    if (stateParams.start && stateParams.end) {
      var momStart = moment(stateParams.start, URL_DATE_TIME_FORMAT, !!'strict');
      var momEnd   = moment(stateParams.end  , URL_DATE_TIME_FORMAT, !!'strict');
      if (momStart.isValid() && momEnd.isValid()) {
        setTimeFrame({
          startDate: momStart.format(API_DATE_FORMAT),
          endDate  : momEnd.format(API_DATE_FORMAT)
        });
      }
    }

    if(stateParams.sort) {
      setSort(stateParams.sort);
    }

    if(stateParams.version) {
      setVersion(stateParams.version);
    }

    setRadius(stateParams.radius);
    setPage(stateParams.page);

    var options = [];
    try {
      stateParams.options.split(',').forEach(function (option) {
        if (optionUrl2Api[option]) {
          options.push(optionUrl2Api[option]);
        }
      });
    } catch (e) {
    }
    setOptions(options);

    var filters = {};
    Object.keys(filterUrl2Api).forEach(function (key) {
      if (stateParams[key]) {
        filters[filterUrl2Api[key]] = stateParams[key];
      }
    });
    setFilters(filters);
  }

  return {
    data             : data,
    setText          : setText,
    setRadius        : setRadius,
    setLocation      : setLocation,
    setTimeFrame     : setTimeFrame,
    setPage          : setPage,
    setOptions       : setOptions,
    setFilters       : setFilters,
    setSort          : setSort,
    getSort          : getSort,
    createStateParams: createStateParams,
    parseStateParams : parseStateParams
  };
})
;
