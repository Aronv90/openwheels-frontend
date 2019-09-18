
const PARKING_TYPES = {
  "parking_spot": "Vaste plek",
  "zone": "Zoneplek"
};

const PARKING_TYPES_TOOLTIPS = {
  "parking_spot": "Deze auto heeft een vaste aangewezen parkeerplaats.",
  "zone": "Deze auto heeft geen vaste parkeerplaats, en kan vrij in de gemarkeerde zone geparkeerd worden."
};

angular.module("filters.resource", [])

.filter("resourcePicture", function ($filter, appConfig) {
  return function (resource, size = "normal") {
    if (!resource || !resource.pictures || !resource.pictures.length) {
      return defaultPicture(size);
    }
    const pictures = $filter("orderBy")(resource.pictures, "order", false);

    let imageUrl;
    if (pictures[0][size]) {
      imageUrl = pictures[0][size];
      if (!imageUrl.match(/^http/)) {
        imageUrl = appConfig.serverUrl + "/" + imageUrl;
      }
    }
    return imageUrl;
  };
})

.filter("parkingType", function () {
  return function (parkingType) {
    return PARKING_TYPES[parkingType] || "Onbekend";
  };
})

.filter("parkingTypeTooltip", function () {
  return function (parkingType) {
    return PARKING_TYPES_TOOLTIPS[parkingType] || "";
  };
})

.filter("fuelChargingIconName", function () {
  return function (resource) {
    if (resource.fuelLevel === null) {
      return "battery_unknown";
    }
    const prefix = "battery_" + (resource.charging ? "charging_" : "");
    for (const level of [90, 80, 60, 50, 30, 20]) {
      if (resource.fuelLevel >= level) {
        return prefix + level;
      }
    }
    return prefix + 20;
  };
});


function defaultPicture (size) {
  return "assets/img/resource-avatar-" + size + ".jpg";
}
