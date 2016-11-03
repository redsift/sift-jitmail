/**
 * Send Later node implementation
 * Schedules emails to be sent later
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
  try {
    credentials = JSON.parse(lookupData[0].data.value);
  } catch (e) {
    console.warn('sendlater.js: no google credentials provided yet.', e);
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  if (!credentials) {
    console.warn('sendlater.js: no google credentials provided yet.');
    return { name: 'state', key: 'auth', value: { valid: false, error: 'please sign in with Google' } };
  }
  var gmail = new GmailAPI(credentials);

  var promises = inData.data.map(function (datum) {
    var info = JSON.parse(datum.value);
    return _sendLater(gmail, datum.key).then(function (ids) {
      return [
        {
          name: 'messages',
          key: datum.key,
          value: {
            detail: info,
            list: { sendlater: info.sendlater }
          }
        },
        {
          name: 'threads',
          key: ids.threadId,
          value: {
            detail: info,
            list: { sendlater: info.sendlater }
          }
        },
        {
          name: 'sendlater',
          key: datum.key,
          value: { info: info, threadId: ids.threadId }
        }
      ];
    });
  });
  var pf = new PromiseFlattener();
  return pf.flatten(promises);
};

/**
 * Schedules a draft to be sent later
 * @param {GmailAPI} gmail - the GmailAPI object
 * @param {String} id - the draft id
 * @returns {Promise} - the promise resolves to an object with the draft message id and thread id when the operation completes
 */
function _sendLater(gmail, id) {
  return new Promise(function (resolve, reject) {
    gmail.getDraft(id).then(function (draft) {
      gmail.listLabels().then(function (labels) {
        gmail.modifyLabels('messages', draft.message.id, [gmail.getLabelIdByName(labels, Labels.SENDLATER)], []).then(function () {
          resolve({ id: draft.message.id, threadId: draft.message.threadId });
        }).catch(reject);
      }).catch(reject);
    }).catch(reject);
  });
}
