/**
 * sift-jitmail: webhook sending utility class
 *
 * Copyright (c) 2016 Redsift Limited
 */
export default class Webhook {
  constructor(url) {
    this.url = url;
  }

  send(key, value) {
    return new Promise((resolve, reject) => {
      console.log('webhook: send: ', key, value);
      var wh = new XMLHttpRequest();
      var whurl = this.url;
      if (key) {
        whurl = whurl.replace('{key}', encodeURIComponent(key));
      }
      if (value) {
        whurl = whurl.replace('{value}', encodeURIComponent(value));
      }
      wh.addEventListener('load', (event) => {
        console.log('webhook: send: load: ', event);
        resolve();
      });
      wh.addEventListener('error', (event) => {
        console.error('webhook: send: error: ', event);
        reject();
      });
      wh.open('GET', whurl);
      console.log('webhook: send: sending: ', whurl);
      wh.send();
    });
  }
}
