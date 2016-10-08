/**
 * Map node implementation
 * Maps inbound emails and provides a suggested snooze time for them when possible
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  // inData contains the key/value pairs that match the given query
  const inData = got['in'];

  var result = inData.data.map(function (datum) {
    var jmapInfo = JSON.parse(datum.value);
    // TODO: Parse email message with NLP to extract snooze suggestions
    return {
      name: 'threads',
      key: datum.key,
      value: {
        detail: {
          received: jmapInfo.date,
          user: jmapInfo.user,
          subject: jmapInfo.subject,
          suggestion: {
            date: "2020-01-01T20:10:10-01:00", // TODO: Integrate AI to suggest the best time
            reason: "Mañana, mañana"
          }
        }
      }
    };
  });
  return result;
};
