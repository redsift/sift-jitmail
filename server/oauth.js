/**
 * 'OAuth' node implementation
 * Implements the authorization code flow of an OAuth2 flow
 */
'use strict';

var rp = require('request-promise');

/**
 * OAuth node implementation
 *
 * Copyright (c) 2016 Redsift Limited
 */
module.exports = function (got) {
  const inData = got['in'];
  var results = inData.data.map(function (datum) {
    var jval = JSON.parse(datum.value);
    return _processOAuthCode(jval.code).then(function (creds) {
      if (creds.state === jval.state) {
        return { name: 'oauth', key: 'google', value: creds };
      }
      else {
        console.error('oauth.js: _processOAuthCode: incorrect state. expected %s got %s.', jval.state, creds.state);
        return { name: 'state', key: 'auth', value: { valid: false, error: 'Invalid state received' } };
      }
    }).catch(function (err) {
      console.error('oauth.js: _processOAuthCode: error: ', err);
      return { name: 'state', key: 'auth', value: { valid: false, error: err } };
    });
  });
  return results;
};

/**
 * Exchanges the authorization code for a set of credentials
 * @param {String} code - the authorization code
 * @return {Object} cred - the OAuth2 credentials object
 */
function _processOAuthCode(code) {
  var options = {
    method: 'POST',
    uri: process.env.OAUTH_URI + '/access_token',
    form: {
      code: code,
      key: process.env.OAUTH_KEY,
      secret: process.env.OAUTH_SECRET
    }
  };
  return rp(options).then(function (response) {
    var creds = JSON.parse(response);
    return creds;
  });
}
