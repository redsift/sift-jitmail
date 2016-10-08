/**
 * Setup node implementation
 * Creates the required Gmail labels after a successful oAuth
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var GmailAPI = require('./apis/gmailapi.js');
var Labels = require('./common/labels.js');

module.exports = function (got) {
  const inData = got['in'];
  return inData.data.map(function (datum) {
    // Safety check, couldn't be anything else
    if(datum.key === 'google') {
      var creds = JSON.parse(datum.value);
      var gmail = new GmailAPI(creds);
      return gmail.createLabels([Labels.SNOOZED, Labels.SENDLATER, Labels.RETURNED]).then(function () {
        return { name: 'state', key: 'auth', value: { valid: true } };
      }).catch(function (err) {
        console.error('setup.js: createLabels: error: ', err);
        return({ name: 'state', key: 'auth', value: { valid: false, error: err } });
      });
    }
  });
};
