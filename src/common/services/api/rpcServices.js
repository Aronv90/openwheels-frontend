'use strict';

angular.module('rpcServices', [])

.service('personService', function (api) {
  var m = function (name, isAnonymous) {
    return api.createRpcMethod('person.' + name, isAnonymous);
  };

  /* REQUIRES parameter version=2 (version 1 deprecated on 13-5-2015) */
  this.get = m('get');

  /* REQUIRES parameter version=2 (version 1 deprecated on 19-5-2015) */
  this.me = m('me');

  /* REQUIRES parameter version=2 (version 1 deprecated on 19-5-2015) */
  this.meAnonymous = m('me', true);

  this.validateEmail = m('validateEmail');
  this.alter = m('alter');
  this.search = m('search');
  this.dropPhoneWithPhoneId = m('dropPhoneWithPhoneId');
  this.alterPhoneWithPhoneId = m('alterPhoneWithPhoneId');
  this.addPhoneWithPersonId = m('addPhoneWithPersonId');
  this.alterEmail = m('alterEmail');
  this.sendResetPassword = m('sendResetPassword');
  this.resetPassword = m('resetPassword');
  this.addLicenseImages = m('addLicenseImages');
  this.setProfileImage = m('setProfileImage');
  this.emailBookingLink = m('emailBookingLink');
  this.emailPreferenceToNone = m('emailPreferenceToNone');
  this.sendVerificationCode = m('sendVerificationCode');
  this.verifyPhoneNumber = m('verifyPhoneNumber');
  this.addPhoneNumber = m('addPhoneNumber');
})

.service('placeService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('place.' + name);
  };
  this.search = m('search');
})

.service('contractService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('contract.' + name);
  };
  this.get = m('get');
  this.all = m('all');
  this.alter = m('alter');
  this.create = m('create');
  this.allTypes = m('allTypes');
  this.forDriver = m('forDriver');
  this.forContractor = m('forContractor');
  this.forBooking = m('forBooking');
  this.addPerson = m('addPerson');
  this.removePerson = m('removePerson');
  this.invitePerson = m('invitePerson');
  this.requestContract = m('requestContract');
})

.service('chipcardService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('chipcard.' + name);
  };
  this.forPerson = m('forPerson');
  this.create = m('create');
  this.alter = m('alter');
  this.getFish = m('getFish');
  this.createFish = m('createFish');
  this.deleteFish = m('deleteFish');
  this.block = m('block');
  this.unblock = m('unblock');
})

.service('resourceService', function (api) {
  var m = function (name, isAnonymous) {
    return api.createRpcMethod('resource.' + name, isAnonymous);
  };
  this.all = m('all');
  this.get = m('get');
  this.alter = m('alter');
  this.select = m('select');
  this.forOwner = m('forOwner');
  this.search = m('search');
  this.searchV2 = m('searchV2');
  this.searchV3 = m('searchV3');
  this.searchMapV1 = m('searchMapV1');
  this.create = m('create');
  this.getMembers = m('getMembers');
  this.addMember = m('addMember');
  this.removeMember = m('removeMember');
  this.invitePerson = m('invitePerson');
  this.addPicture = m('addPicture');
  this.removePicture = m('removePicture');
  this.alterPicture = m('alterPicture');
  this.checkAvailability = m('checkAvalibility', true);
  this.getFavorites = m('getFavorites');
  this.addFavorite = m('addFavorite');
  this.removeFavorite = m('removeFavorite');
  this.getMemberResources = m('getMemberResources');
  this.addProperty = m('addProperty');
  this.removeProperty = m('remProperty');
  this.createParkingpermit = m('createParkingpermit');
  this.alterParkingpermit = m('alterParkingpermit');
  this.removeParkingpermit = m('removeParkingpermit');
  this.getParkingpermits = m('getParkingpermits');
})

.service('bookingService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('booking.' + name);
  };
  this.alterRequest = m('alterRequest');
  this.addDriver = m('addDriver');
  this.removeDriver = m('removeDriver');
  this.driversForBooking = m('driversForBooking');
  this.acceptRequest = m('acceptRequest');
  this.rejectRequest = m('rejectRequest');
  this.create = m('create');
  this.get = m('get');
  this.alter = m('alter');
  this.stop = m('stop');
  this.cancel = m('cancel');
  this.setTrip = m('setTrip');
  this.finishTrip = m('finishTrip');
  this.forResource = m('forResource');
  this.forOwner = m('forOwner');
  this.getBookingList = m('getBookingList');
  this.clearDrivers= m('clearDrivers');
})

.service('boardcomputerService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('boardcomputer.' + name);
  };
  this.control = m('control');
  this.currentLocation = m('currentLocation');
})

.service('invoiceService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('invoice.' + name);
  };
  this.get = m('get');
  this.allGroups = m('allGroups');
  this.paymentsForPerson = m('paymentsForPerson');
})

.service('invoice2Service', function (api) {
  var m = function (name) {
    return api.createRpcMethod('invoice2.' + name);
  };
  this.getSent = m('getSent');
  this.getReceived = m('getReceived'); // status = paid | unpaid | both
  this.getUngroupedForPerson = m('getUngroupedForPerson');
  this.calculateBookingPrice = m('calculateBookingPrice'); // status = paid | unpaid | both
  this.createSenderInvoiceGroup = m('createSenderInvoiceGroup');
  this.createRecipientInvoiceGroup = m('createRecipientInvoiceGroup');
  this.calculatePrice = m('calculatePrice');
  this.getInvoiceGroup = m('getInvoiceGroup');
})

.service('accountService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('account.' + name);
  };
  this.get = m('get');
  this.alter = m('alter');
})
.service('account2Service', function (api) {
  var m = function (name) {
    return api.createRpcMethod('account2.' + name);
  };
  this.forMe = m('forMe');
})

.service('actionService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('actions.' + name);
  };
  this.all = m('all');
  this.delete = m('delete');
})

.service('declarationService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('declaration.' + name);
  };
  this.create = m('create');
  this.forBooking = m('forBooking');
})

.service('idealService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('ideal.' + name);
  };
  this.payInvoiceGroup = m('payInvoiceGroup');
})

.service('voucherService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('voucher.' + name);
  };
  this.search = m('search');
  this.calculateRequiredCredit = m('calculateRequiredCredit');
  this.calculateCredit = m('calculateCredit');
  this.calculateDebt = m('calculateDebt');
  this.createVoucher = m('createVoucher');
  this.calculateRequiredCreditForBooking = m('calculateRequiredCreditForBooking');
})

.service('ratingService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('rating.' + name);
  };
  this.getPrefill = m('getPrefill');
  this.create = m('create');
  this.getResourceRatings = m('getResourceRatings');
  this.getDriverRatings = m('getDriverRatings');
  this.commentOnRating = m('commentOnRating');
})

.service('anwbService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('anwb.' + name);
  };
  this.setAnwbNumber = m('setAnwbNumber');
})

.service('paymentService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('payment.' + name);
  };
  this.pay = m('pay');
  this.payBooking = m('payBooking');
  this.payVoucher = m('payVoucher');
  this.payInvoiceGroup = m('payInvoiceGroup');
  this.getInvoiceGroups = m('getInvoiceGroups');
  this.payoutVoucher = m('payoutVoucher');
  this.payoutInvoiceGroup = m('payoutInvoicegroup');
})

.service('calendarService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('calender.' + name);
  };
  this.createBlock = m('createBlock');
  this.alterBlock = m('alterBlock');
  this.removeBlock = m('removeBlock');
  this.createPeriodic = m('createPeriodic');
  this.alterPeriodic = m('alterPeriodic');
  this.removePeriodic = m('removePeriodic');
  this.between = m('between');
  this.search = m('search');
})

.service('messageService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('message.' + name);
  };
  this.sendMessageTo = m('sendMessageTo');
  // this.getMyConversations = m('getMyConversations');
  this.getConversationWith = m('getConversationWith');
  this.getMessagesAfter = m('getMessagesAfter');
  this.getMessagesBefore = m('getMessagesBefore');

  function sortFilterConversations (conversations) {
    // In the unlikely situation that multiple messages were
    //  sent in the same second in a particular conversation,
    //  these messages will both show up in the API call result.
    var had = {};
    conversations = _.sortBy(conversations, 'date').reverse().filter(function (message) {
      var between = [message.sender.id, message.recipient.id].join('-');
      if (had[between]) {
        return false;
      }
      had[between] = true;
      return true;
    });
    
    return conversations;
  }

  // `getInbox` is the updated `getMyConversations`
  var getInbox = m('getInbox');
  this.getMyConversations = function (params) {
    return getInbox(params).then(function (data) {
      if (data.length) {
        var arr = sortFilterConversations(data);
        return {
          result: arr,
          total: arr.length,
        };
      } else {
        return {
          result: sortFilterConversations(data.result),
          total: data.total,
        };
      }
    });
  };
})

.service('discountService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('discount.' + name);
  };
  this.create = m('create');
  this.get = m('get');
  this.search = m('search');
  this.isApplicable = m('isApplicable');
  this.getApplicableState = m('getApplicableState');
  this.apply = m('apply');
  this.disable = m('disable');
})

.service('discountUsageService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('discount_usage.' + name);
  };
  this.search = m('search');
})

.service('inviteService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('invite.' + name);
  };
  this.getInvitedFriends = m('getInvitedFriends');
  this.inviteFriend = m('inviteFriend');
})

.service('extraDriverService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('extra_driver.' + name);
  };
  this.addDriver = m('addDriver');
  this.removeDriver = m('removeDriver');
  this.getRequest = m('getRequest');
  this.driversForBooking = m('driversForBooking');
  this.clearDrivers = m('clearDrivers');
  this.acceptRequest = m('acceptRequest');
  this.declineRequest = m('declineRequest');
  this.getRequestsForPerson = m('getRequestsForPerson');
  this.acceptContractRequest = m('acceptContractRequest');
  this.declineContractRequest = m('declineContractRequest');
  this.revokeContractRequest = m('revokeContractRequest');
  this.revokeBookingRequest = m('revokeBookingRequest');
  this.getRequestsForContract = m('getRequestsForContract');
  this.invitePersonForContract = m('invitePersonForContract');
  this.removePersonFromContract = m('removePersonFromContract');
  this.getExtraDriverBookingList = m('getExtraDriverBookingList');
})

.service('kmPointService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('kmpoint.' + name);
  };
  this.forPerson = m('forPerson');
})

.service('damageService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('damage.' + name);
  };
  this.addUserDamage = m('addUserDamage');
  this.dirty = m('dirty');
})

.service('instantPaymentService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('instant_payment.' + name);
  };
  this.getByIdAndToken = m('getByIdAndToken');
  this.createByIdAndToken = m('createByIdAndToken');
  this.create = m('create');
})

.service('formSubmissionService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('form_submission.' + name);
  };
  var _send = m('send');
  this.send = function (params) {
    return _send({
      other: params,
    });
  };
});