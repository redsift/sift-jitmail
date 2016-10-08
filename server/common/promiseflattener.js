/**
 * Flattens the output of an array of promises which could themselves return arrays into a single array
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

function PromiseFlattener() {}

/**
 * Dagger only accepts an array of promises or an array of objects as a response,
 * this function flattens possible arrays of arrays into a single array of objects
 * @param {Array} promises - an array of promises
 * @return {Array} - a flattened aray
 */
PromiseFlattener.prototype.flatten = function (promises) {
  return Promise.all(promises).then(function (results) {
    var ret = [];
    if(results) {
      results.forEach(function (res) {
        if(res) {
          if(Array.isArray(res)) {
            res.forEach(function (r) {
              ret.push(r);
            });
          }
          else {
            ret.push(res);
          }
        }
      });
    }
    return ret;
  });
}

module.exports = PromiseFlattener;
