/**
 * sift-jitmail: login screen and flow handling
 *
 * Copyright (c) 2016 Redsift Limited
 */
import OAuthIO from 'oauthio-web';
import Webhook from './webhook';

export default class Login {
  constructor(owhurl) {
    this._webhook = new Webhook(owhurl);
    this._eventHandler = null;
  }

  setup(eh) {
    console.log('login: setup');
    this._eventHandler = eh;
    // Initialise OAuth library
    OAuthIO.OAuth.initialize('1ARQmyXw3CaFxDdzPchCqrjPVv0');
    OAuthIO.OAuth.setOAuthdURL('https://oauth.redsift.cloud');
    // Register button event listener
    let signin = document.getElementById('google-signin');
    signin.addEventListener('click', this._onClick.bind(this));
  }

  _onClick() {
    console.log('login: click');
    if(this._eventHandler) {
      this._eventHandler('start');
    }
    var state = this._generateGUID();
    OAuthIO.OAuth.popup('google', { authorize: { approval_prompt: 'force' }, state: state }).done((result) => {
      console.log('sift-jitmail: google: result: ', result);
      this._webhook.send('google', JSON.stringify({ code: result.code, state: state }));
    }).fail((err) => {
      console.error('sift-jitmail: google: fail', err);
      if(this._eventHandler) {
        // TODO: also propagate error or show a toast
        this._eventHandler('fail');
      }
    });
  }

  /**
   * Generates a random GUID to be used the state for the OAuth flow
   * @returns guid - a GUID
   */
  _generateGUID() {
    let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return guid;
  }
}
