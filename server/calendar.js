/**
 * Calendar node implementation
 * Sums up the number of snoozed or sendlater emails into a day-based calendar bucket
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var moment = require('moment');

module.exports = function (got) {
  const inData = got['in'];

  var outbucket;
  switch (inData.bucket) {
    case 'snoozed':
      outbucket = 'snoozedcal';
      break;
    case 'sendlater':
      outbucket = 'sendlatercal';
      break;
  }
  var calendar = {};
  inData.data.map(function (datum) {
    var jval = JSON.parse(datum.value);
    if(jval.info) {
      var info = jval.info;
      if (info[inData.bucket]) {
        if (!calendar[info.day]) {
          calendar[info.day] = 0;
        }
        calendar[info.day]++;
      }
    }
  });
  var ret = [];
  Object.keys(calendar).forEach(function (k) {
    ret.push({ name: outbucket, key: k, value: { d: k, v: calendar[k] } });
  });

  return ret;
};
