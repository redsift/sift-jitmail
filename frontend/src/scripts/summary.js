/**
 * sift-jitmail: summary view
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { select, selectAll } from 'd3-selection';
import { html as squares } from "@redsift/d3-rs-squares";
import { body as tip } from '@redsift/d3-rs-tip';
import { SiftView, registerSiftView } from "@redsift/sift-sdk-web";
import LoadingIndicator from './lib/loading-indicator';
import Login from './lib/login';
import moment from 'moment/moment';
import tingle from 'tingle.js';
import '@redsift/ui-rs-hero';

export default class SummaryView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be reflown during transitions
    this._data = null;
    this._sizeClass = null;

    this._loginButton = null;
    this._loadingIndicator = new LoadingIndicator();

    this._calendar = {};

    // Subscribe to 'calendarupdated' updates from the Controller
    this.controller.subscribe('calendarupdated', this.onCalendarUpdated.bind(this));

    // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad) and when it is
    // resizing (onResize).
    this.registerOnLoadHandler(this.onLoad.bind(this));
    this.registerOnResizeHandler(this.onResize.bind(this));
  }

  onLoad() {
    this._setupHelp();
    this.controller.subscribe('auth', (loggedIn) => {
      if (loggedIn) {
        this._showView('calendar');
        this._drawCalendar('snoozedcal', this._data.snoozedcal || []);
        this._drawCalendar('sendlatercal', this._data.sendlatercal || []);
      }
      else {
        this._showView('signin');
      }
    });
    let gotos = document.getElementsByClassName('goto__button');
    for (let i = 0; i < gotos.length; i++) {
      gotos[i].addEventListener('click', (event) => {
        event.preventDefault();
        this.publish('goto', event.target.id);
      });
    }
  }

  onResize() {
    this._drawCalendar('snoozedcal', this._data.snoozedcal);
    this._drawCalendar('sendlatercal', this._data.sendlatercal);
  }

  onCalendarUpdated(ev) {
    if (ev.snoozedcal) {
      this._data.snoozedcal = ev.snoozedcal;
    }
    if (ev.sendlatercal) {
      this._data.sendlatercal = ev.sendlatercal;
    }

    let total = this._countQueued(this._data.snoozedcal);
    total += this._countQueued(this._data.sendlatercal);
    document.getElementById('total').textContent = total;

    this._drawCalendar('snoozedcal', this._data.snoozedcal);
    this._drawCalendar('sendlatercal', this._data.sendlatercal);
  }

  // TODO: link to docs
  presentView(value) {
    if (value.data && value.data.owhurl && !this._loginButton) {
      this._loginButton = new Login(value.data.owhurl);
      this._loginButton.setup(this._onLogin.bind(this));
    }
    if (value.sizeClass && value.sizeClass.current) {
      this._sizeClass = value.sizeClass.current;
    }
    if (value.client !== 'crx') {
      let viewButtons = document.getElementsByClassName('goto__button');
      for (let i = 0; i < viewButtons.length; i++) {
        viewButtons[i].style.display = 'none';
      }
    }
    if (value.data && value.data.snoozedcal && value.data.sendlatercal) {
      let sv = 'calendar';
      this._data = value.data;

      let total = this._countQueued(this._data.snoozedcal);
      total += this._countQueued(this._data.sendlatercal);
      document.getElementById('total').textContent = total;

      if (this._data.signin === true) {
        sv = 'signin';
      }
      this._showView(sv);

      this._drawCalendar('snoozedcal', this._data.snoozedcal);
      this._drawCalendar('sendlatercal', this._data.sendlatercal);
    }
  }

  // TODO: link to docs
  willPresentView(value) { }

  _countQueued(queue) {
    let count = 0;
    queue.forEach((q) => {
      count += q.v;
    });
    return count;
  }

  _drawCalendar(name, data) {
    let contentArea = document.querySelector('.calendar__row--centered');
    let calWeeks = 24;
    let scale = contentArea.clientWidth / 600;
    scale = (scale > 1) ? 1 : scale;
/* TODO: re-enable when squares is fixed
    if (contentArea.clientWidth <= 230) {
      calWeeks = 12;
    }
*/
    let _tip = this._tip;
    if (!_tip) {
      _tip = tip('tip-cal')
        .html((d) => {
          if (d.z > 0) {
            return moment(d.x).calendar(null, {
              sameDay: '[Today]',
              nextDay: '[Tomorrow]',
              nextWeek: 'dddd',
              lastDay: '[Yesterday]',
              lastWeek: '[Last] dddd',
              sameElse: 'DD/MM/YYYY'
            }) + ': ' + d.z
          }
        });
      this._tip = _tip;
    }
    if(!this._calendar[name]) {
      this._calendar[name] = squares('calendar-' + name)
        .type('calendar.days')
        .minDate(moment().valueOf())
        .nice(false)
        .margin(0)
        .color('orange');
    }
    select('#' + name).datum(data).call(this._calendar[name].scale(scale).maxDate(moment().add(calWeeks, 'weeks').valueOf()));
    select('svg').call(_tip);
    selectAll('.square')
      .on('mouseover', _tip.show)
      .on('mouseout', _tip.hide);
  }

  _onLogin(state) {
    let sv = 'loader';
    if (state === 'fail') {
      sv = 'signin';
    }
    this._showView(sv);
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
    if (id === 'signin') {
      document.getElementById('total').style.display = 'none';
      document.getElementById('hero-tagline').textContent = "Please sign in below";
    }
    else if (id === 'calendar') {
      document.getElementById('total').style.display = '';
      document.getElementById('hero-tagline').textContent = "Emails waiting for the right time to make their entrance";
    }

    if (id === 'loader') {
      this._loadingIndicator.start();
    }
    else {
      this._loadingIndicator.stop();
    }
  }

  _setupHelp() {
    document.getElementById('help').addEventListener('click', function (ev) {
      ev.preventDefault();
      let help = new tingle.modal();
      help.setContent(
        '<h1>The Timely Mail Sift</h1>' +
        '<p>Want your email to cause maximum impact and arrive at the right time? Dreaming of a zero inbox?</p>' +
        '<p>The Timely Mail Sift allows you to schedule your outgoing emails to arrive at their destination at a particular time. It also allows you to snooze emails from your inbox until it is time for you to deal with them.</p>' +
        '<h2>Getting started</h2>' +
        '<p>Simple, just sign in with your Gmail account and start scheduling and snoozing those emails.</p>' +
        '<p>Your scheduled and snoozed emails are available in the folders that the Sift creates for you so you can always cancel or deal with them earlier if you want to.</p>' +
        '<h2>Improve this Sift</h2>' +
        '<p>Found an issue with this Sift or have a suggestion? Report it <a href="https://github.com/redsift/sift-jitmail/issues" target="_blank">here</a> or, if you have no idea what Github is, you can send an email to <a href="mailto:sift-timelymail@redsift.com">sift-timelymail@redsift.com</a></p>' +
        '<p>Are you a developer? We love pull requests.</p>' +
        '<p>Want to customize this Sift for your own functionality? <a href="https://redsift.com" target="_blank">Sign up</a> and become a Red Sift developer, <a href="https://github.com/redsift/sift-jitmail" target="_blank">fork this Sift</a> (or create a new one), run it and share it with the world.</p>');
      help.open();
    });
  }
}

registerSiftView(new SummaryView(window));
