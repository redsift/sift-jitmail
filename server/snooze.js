/**
 * Snooze node implementation
 * Sonoozes the requested email until the time specified
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var moment = require('moment');
var GmailAPI = require('./apis/gmailapi.js');
var PromiseFlattener = require('./common/promiseflattener.js');
var Labels = require('./common/labels.js');

module.exports = function (got) {
  const inData = got['in'];
  const lookupData = got['lookup'];
  var credentials = null;

  // Fetch Google API credentials
  try{
    credentials = JSON.parse(lookupData[0].data.value);
  }catch(e){
    console.warn('snooze.js: no google credentials provided yet.', e);
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  if (!credentials)
    console.warn('snooze.js: no google credentials provided yet.');
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  var gmail = new GmailAPI(credentials);

  var promises = inData.data.map(function (datum) {
    var info = JSON.parse(datum.value);
    return _snooze(gmail, datum.key).then(function () {
      return [
        {
          name: 'threads',
          key: datum.key,
          value: {
            detail: info,
            list: { snoozed: info.snoozed }
          }
        },
        {
          name: 'snoozed',
          key: datum.key,
          value: { info: info }
        }
      ];
    });
  });
  // Flattens array of array responses into an array
  var pf = new PromiseFlattener();
  return pf.flatten(promises);
};

/**
 * Moves email thread to the snoozed folder
 * @param {GmailAPI} gmail - the GmailAPI object
 * @param {String} tid - the thread ID
 * @return {Promise} - resolves when the operation completes
 */
function _snooze(gmail, tid) {
  return new Promise(function (resolve, reject) {
    gmail.listLabels().then(function (labels) {
      // Move email from INBOX to TimelyMail folders
      gmail.modifyLabels('threads', tid, [gmail.getLabelIdByName(labels, Labels.SNOOZED)], [Labels.INBOX]).then(resolve).catch(reject);
    }).catch(reject);
  });
}
