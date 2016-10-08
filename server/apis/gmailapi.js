/**
 * Gmail API utilities
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var google = require('googleapis');
var googleAuth = require('google-auth-library');

var _oauth2Client = null;
var _gmail = null;

function GmailAPI(credentials) {
  var auth = new googleAuth();
  _oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.OAUTH_URI);
  _oauth2Client.setCredentials({
    refresh_token: credentials.refresh_token
  });
  _gmail = google.gmail('v1');
}

function _createLabel(name) {
  return new Promise(function (resolve, reject) {
    _gmail.users.labels.create({
      auth: _oauth2Client,
      userId: 'me',
      resource: {
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
        name: name
      }
    }, function (err, response) {
      if (err) {
        console.error('gmail.js: _createLabel: ', err);
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
};

GmailAPI.prototype.createLabels = function (cLabels) {
  return new Promise(function (resolve, reject) {
    GmailAPI.prototype.listLabels().then(function (labels) {
      var ps = [];
      cLabels.forEach(function (cl) {
        var found = labels.filter(function (l) {
            return l.name === cl;
        });
        if(found.length === 0) {
          ps.push(_createLabel(cl));
        }
      });
      resolve(Promise.all(ps).then(function () {}));
    }).catch(reject);
  });
};

GmailAPI.prototype.getLabelIdByName = function (labels, name) {
  for(var i = 0; i < labels.length; i++) {
    if(labels[i].name === name) {
      return labels[i].id;
    }
  }
};

GmailAPI.prototype.listLabels = function () {
  if (!_oauth2Client) {
    throw new Error('OAuth2 client not initialised');
  }
  return new Promise(function (resolve, reject) {
    _gmail.users.labels.list({
      auth: _oauth2Client,
      userId: 'me',
    }, function (err, response) {
      if (err) {
        console.error('gmail.js: listLabels: ', err);
        reject(err);
      }
      else {
        resolve(response.labels);
      }
    });
  });
};

GmailAPI.prototype.modifyLabels = function (type, id, addLabelIds, removeLabelIds) {
  if (!_oauth2Client) {
    throw new Error('OAuth2 client not initialised');
  }
  return new Promise(function (resolve, reject) {
    _gmail.users[type].modify({
      auth: _oauth2Client,
      userId: 'me',
      id: id,
      resource: {
        addLabelIds: addLabelIds,
        removeLabelIds: removeLabelIds
      }
    }, function (err, response) {
      if (err) {
        console.error('gmail.js: modifyLabels: ', err);
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
};

GmailAPI.prototype.sendMessage = function (email, tid) {
  if (!_oauth2Client) {
    throw new Error('OAuth2 client not initialised');
  }
  return new Promise(function (resolve, reject) {
    var base64EncodedEmail = new Buffer(email).toString('base64');
    base64EncodedEmail = base64EncodedEmail.replace(/\//g, '_').replace(/\+/g, '-');
    var resource = { raw: base64EncodedEmail };
    if (tid) {
      resource.threadId = tid;
    }
    _gmail.users.messages.send({
      auth: _oauth2Client,
      userId: 'me',
      resource: resource
    }, function (err, response) {
      if (err) {
        console.error('gmail.js: sendMessage: ', err);
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
};

GmailAPI.prototype.sendDraft = function (id) {
  if (!_oauth2Client) {
    throw new Error('OAuth2 client not initialised');
  }
  return new Promise(function (resolve, reject) {
    _gmail.users.drafts.send({
      auth: _oauth2Client,
      userId: 'me',
      resource: {
        id: id
      }
    }, function (err, response) {
      if (err) {
        console.error('gmail.js: sendDraft: ', err);
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
};

GmailAPI.prototype.getDraft = function (id) {
  if (!_oauth2Client) {
    throw new Error('OAuth2 client not initialised');
  }
  return new Promise(function (resolve, reject) {
    _gmail.users.drafts.get({
      auth: _oauth2Client,
      userId: 'me',
      id: id
    }, function (err, response) {
      if (err) {
        console.error('gmail.js: getDraft: ', err);
        reject(err);
      }
      else {
        resolve(response);
      }
    });
  });
};


module.exports = GmailAPI;
