/**
 * Wake Up node implementation
 * Wakes up snoozed emails back
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var moment = require('moment');
var GmailAPI = require('./apis/gmailapi.js');
var Labels = require('./common/labels.js');
var PromiseFlattener = require('./common/promiseflattener.js');

module.exports = function (got) {
  const inData = got['in'];
  const lookupData = got['lookup'];
  var credentials = null;

  // Fetch Google API credentials
  try{
    credentials = JSON.parse(lookupData[0].data.value);
  }catch(e){
    console.warn('wakeup.js: no google credentials provided yet.', e);
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  if (!credentials){
    console.warn('wakeup.js: no google credentials provided yet.');
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  var gmail = new GmailAPI(credentials);

  var total = 0;
  var promises = inData.data.map(function (datum) {
    var msgInfo = JSON.parse(datum.value).info;
    if (msgInfo.snoozed) {
      if (moment().isSameOrAfter(msgInfo.snoozed, 'minute')) {
        return _bringBack(gmail, datum.key, msgInfo);
      }
    }
  });
  var pf = new PromiseFlattener();
  return pf.flatten(promises);
};

/**
 * Brings back a znoozed email thread
 * @param {GmailAPI} gmail - the GmailAPI object
 * @param {String} tid - the thread ID
 * @param {Object} info - the original info associated with the thread
 * @return {Promise} - the promise resoves to an array of objects for the DAG
 */
function _bringBack(gmail, tid, info) {
  return new Promise(function (resolve) {
    var msg = 'Content-Type: text/plain; charset="UTF-8"\nMIME-Version: 1.0\nContent-Transfer-Encoding: 7bit\nto: <TO>\nfrom: <FROM>\nsubject: <SUBJECT>\n\n<TEXT>';
    gmail.listLabels().then(function (labels) {
      // Move from SNOOZED folder into RETURNED and INBOX
      gmail.modifyLabels('threads', tid, [gmail.getLabelIdByName(labels, Labels.RETURNED), Labels.INBOX], [gmail.getLabelIdByName(labels, Labels.SNOOZED)]).then(function () {
        msg = msg.replace('<TO>', info.user);
        msg = msg.replace('<FROM>', 'me via Timely Mail Sift <' + info.user + '>');
        msg = msg.replace('<SUBJECT>', 'Re: ' + info.subject);
        msg = msg.replace('<TEXT>', 'Brought back to your inbox by the Timely Mail Sift');
        // Reply to the email thread to bump it up to the top
        gmail.sendMessage(msg, tid).then(function () {
          resolve([
            // Return thread info back to normal so it can be bounced again
            {
              name: "threads",
              key: tid,
              value: {
                detail: {
                  received: moment().toISOString(),
                  user: info.user,
                  subject: info.subject,
                  suggestion: info.suggestion
                }
              }
            },
            // Clear snoozed info for thread
            { name: "snoozed", key: tid, value: {} }
          ]);
        }).catch(function (error) {
          console.error('wakeup.js: _bringBack: sendMessage: ', error);
          resolve([]);
        });
      }).catch(function (error) {
        console.error('wakeup.js: _bringBack: modifyLabels', error);
        resolve([]);
      });
    }).catch(function (error) {
      console.error('wakeup.js: _bringBack: listLabels', error);
      resolve([]);
    });
  });
}
