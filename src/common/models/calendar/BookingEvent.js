/**
 * Created by Wilgert on 8-1-2015.
 */
angular.module('owm.models.calendar.bookingEvent', ['owm.models.calendar.baseEvent'])
  .factory('BookingEvent', function(BaseEvent, authService){
    'use strict';

    var user = authService.user;

    function BookingEvent(event){
      this.setColor = function(){
        if (user.isAuthenticated && event.person && event.person.id === user.identity.id) {
          return this.selfColor;
        } else {
          return this.blockedColor;
        }
      };

      this.booking = event;

      this.start  = event.beginBooking;
      this.end    = event.endBooking;
      this.allDay = false;
      this.title  = this.getTitle();
      this.color  = this.setColor();
    }

    BookingEvent.prototype = Object.create(BaseEvent.prototype);

    return BookingEvent;
  });
