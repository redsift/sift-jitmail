/**
 * sift-jitmail: email-thread view
 *
 * Copyright (c) 2016 Redsift Limited
 */
import LoadingIndicator from './lib/loading-indicator';
import Login from './lib/login';
import TimeSelector from './lib/time-selector';
import Webhook from './lib/webhook';
import { SiftView, registerSiftView } from "@redsift/sift-sdk-web";
import moment from 'moment/moment';

export default class EmailThreadView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be redrawn on events
    this._data = null;

    this._loginButton = null;
    this._snoozeButton = null;

    this._timeSelector = new TimeSelector('snoozetime', 'snoozedate', 'snooze-button', '#snoozeclock', 132);
    this._snoozedDisplay = new TimeSelector('snoozedtime', 'snoozeddate', null, '#snoozedclock', 160);
    this._loadingIndicator = new LoadingIndicator();

    // Subscribe to events from the Controller
    this.controller.subscribe('detail', this.onDetail.bind(this));
    this.controller.subscribe('auth', this.onAuth.bind(this));

    // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad) and when it is
    // resizing (onResize).
    this.registerOnLoadHandler(this.onLoad.bind(this));
  }

  onLoad() {
    // Initialise time selector
    this._timeSelector.setup();
  }

  onDetail(detail) {
    this._data.detail = detail;
    this._showView(this._selectView());
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
      if (!this._snoozeButton) {
        this.snoozeButton = this._setupSnoozeButton();
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
    let sv = 'loader';
    if (this._data.detail.snoozed) {
      this._snoozedDisplay.displayClock(moment(this._data.detail.snoozed));
      sv = 'snoozed-display';
    }
    else {
      sv = 'snoozer';
    }
    // If user signed out
    if (this._data.signin === true) {
      sv = 'signin';
    }
    return sv;
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

  _setupSnoozeButton() {
    let snb = document.getElementById('snooze-button');
    snb.addEventListener('click', this._onSnooze.bind(this));
    return snb;
  }

  _onSnooze() {
    this._showView('loader');
    // TODO: Deal with errors
    this._data.detail.snoozed = this._timeSelector.selected.toISOString();
    this._data.detail.day = this._timeSelector.selected.format('YYYY-MM-DD');

    let wh = new Webhook(this._data.snwhurl);
    wh.send(this._data.tid, JSON.stringify(this._data.detail))
      .catch((error) => {
        console.error('sift-jitmail: send button: failed to send webhook: ', error);
      });
  }
}

registerSiftView(new EmailThreadView(window));
