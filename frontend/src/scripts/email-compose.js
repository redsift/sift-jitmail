/**
 * sift-jitmail: email-compose view
 *
 * Copyright (c) 2016 Redsift Limited
 */
import LoadingIndicator from './lib/loading-indicator';
import Login from './lib/login';
import TimeSelector from './lib/time-selector';
import Webhook from './lib/webhook';
import { SiftView, registerSiftView } from "@redsift/sift-sdk-web";

export default class EmailComposeView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be redrawn on events
    this._data = null;

    this._loginButton = null;
    this._sendButton = null;

    this._timeSelector = new TimeSelector('sendtime', 'senddate', 'send-button', '#sendclock', 132);
    this._loadingIndicator = new LoadingIndicator();

    // Subscribe to events from the Controller
    this.controller.subscribe('idChanged', this.onIdChanged.bind(this));
    this.controller.subscribe('auth', this.onAuth.bind(this));

    // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad) and when it is
    // resizing (onResize).
    this.registerOnLoadHandler(this.onLoad.bind(this));
  }

  onLoad() {
    // Initialise time selector
    this._timeSelector.setup();
  }

  onIdChanged(id) {
    this._data.draft.id = id;
  }

  onAuth(loggedIn) {
    this._data.signin = !loggedIn;
    this._showView(this._selectView(this._data));
  }

  // TODO: link to docs
  presentView(value) {
    let sv = 'loader';
    if (value.data) {
      this._data = value.data;
      if (!this._loginButton) {
        this._loginButton = new Login(this._data.owhurl);
        this._loginButton.setup(this._onLogin.bind(this));
      }
      if (!this.sendButton) {
        this._setupSendButton();
      }
      sv = this._selectView();
    }
    this._showView(sv);
  }

  // TODO: link to docs
  willPresentView(value) { }

  _onLogin(state) {
    let sv = 'loader';
    if(state === 'fail') {
      sv = 'signin';
    }
    this._showView(sv);
  }

  _selectView() {
    // If user signed out
    if (this._data.signin === true) {
      return 'signin';
    }
    else {
      return 'sender';
    }
  }

  _showView(id) {
    let views = document.getElementsByClassName('view');
    for (let i = 0; i < views.length; i++) {
      let v = views[i];
      if (v.id === id) {
        v.style.display = '';
      }
      else {
        v.style.display = 'none';
      }
    }
    if (id === 'loader') {
      this._loadingIndicator.start();
    }
    else {
      this._loadingIndicator.stop();
    }
  }

  _setupSendButton() {
    this._sendButton = document.getElementById('send-button');
    this._sendButton.addEventListener('click', this._onSendLater.bind(this));
  }

  _onSendLater() {
    if (this._data.draft.id) {
      this._showView('loader');
      let wh = new Webhook(this._data.slwhurl);
      // TODO: Deal with errors
      wh.send(this._data.draft.id, JSON.stringify({
        sendlater: this._timeSelector.selected.toISOString(),
        day: this._timeSelector.selected.format('YYYY-MM-DD')
      }))
        .catch((error) => {
          console.error('sift-jitmail: send button: failed to send webhook: ', error);
        });
    }
    else {
      console.error('sift-jitmail: send button: still missing id for draft');
    }
  }
}

registerSiftView(new EmailComposeView(window));
