/**
 * Sender node implementation
 * Cron node that runs on regular intervals to send emails sendlater emails
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var moment = require('moment');
var GmailAPI = require('./apis/gmailapi.js');
var PromiseFlattener = require('./common/promiseflattener.js');

module.exports = function (got) {
  const inData = got['in'];
  const lookupData = got['lookup'];
  var credentials = null;

  // Fetch Google API credentials
  try {
    credentials = JSON.parse(lookupData[0].data.value);
  } catch (e) {
    console.warn('sender.js: no google credentials provided yet.', e);
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  if (!credentials) {
    console.warn('sender.js: no google credentials provided yet.');
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  var gmail = new GmailAPI(credentials);

  var total = 0;
  var promises = inData.data.map(function (datum) {
    var value = JSON.parse(datum.value);
    if (value.info.sendlater) {
      if (moment().isSameOrAfter(value.info.sendlater, 'minute')) {
        return _send(gmail, datum.key, value.threadId);
      }
    }
  });
  var pf = new PromiseFlattener();
  return pf.flatten(promises);
};

/**
 * Sends a scheduled sendlater draft
 * @param {GmailAPI} gmail - the GmailAPI object
 * @param {String} id - the draft id
 * @param {String} threadId - the thread id of the draft
 */
function _send(gmail, id, threadId) {
  return new Promise(function (resolve) {
    gmail.sendDraft(id).then(function () {
      resolve([
        // Clear thread and message info
        { name: "threads", key: threadId, value: {} },
        { name: "messages", key: id, value: {} },
        // Clear sendlater info for draft
        { name: "sendlater", key: id, value: {} }
      ]);
    }).catch(function (error) {
      console.error('sender.js: _send: sendDraft: ', error);
      // If there was an error log it and resolve
      // TODO: sieve through errors to avoid accumulating errors e.g. non existent drafts should be ignored and removed from the list
      resolve([]);
    });
  });
}
