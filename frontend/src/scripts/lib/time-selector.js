/**
 * sift-jitmail: time selector and polar clock display utility
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { Sliders } from '@redsift/ui-rs-core';
import moment from 'moment/moment';
import { select } from 'd3-selection';
import { html as polar } from '@redsift/d3-rs-polars';

export default class TimeSelector {
  constructor(time, date, button, clock, clockSize) {
    this.selected = null;
    this.value = {
      minutes: 0,
      hours: 0,
      days: 0
    };
    this.config = {
      minutes: { max: 60, step: 15 },
      hours: { max: 24, step: 1 },
      days: { max: 90, step: 1 }
    };
    this.slider = null;
    this.precision = 'hours';
    // DOM element ids
    this.time = time;
    this.date = date;
    this.button = button;
    this.clock = clock;
    this.clockSize = clockSize;
  }

  setup() {
    console.log('time-selector: setup');
    Sliders.initAllRanges();
    this.slider = document.getElementById('slider');
    this.slider.addEventListener('input', this._onInput.bind(this));
    let radios = document.getElementsByName('radios');
    for (let i = 0; i < radios.length; i++) {
      let r = radios.item(i);
      r.addEventListener('click', this._onPrecision.bind(this));
    }
  }

  _onPrecision(ev) {
    console.log('time-selector: _onPrecision: ', ev);
    this.precision = ev.target.id;
    this.slider.max = this.config[this.precision].max;
    this.slider.step = this.config[this.precision].step;
    Sliders.setValue(slider, this.value[this.precision]);
  }

  _onInput(ev) {
    console.log('time-selector: _onInput: ', ev);
    this.value[this.precision] = parseInt(ev.target.value);
    let when = moment();
    let delta = 0;
    Object.keys(this.value).forEach((k) => {
      when.add(this.value[k], k);
      delta += this.value[k];
    });
    if (delta > 0) {
      // Round it to the closest 15 minutes interval to match cron
      let round = (Math.round(when.minute() / 15) * 15) % 60;
      let carry = Math.floor((Math.round(when.minute() / 15) * 15) / 60);
      when.minute(round);
      when.add(carry, 'hours');
      this.selected = when;

      this.displayClock(when);
      // Enable send button
      document.getElementById(this.button).disabled = false;
    }
    else {
      document.getElementById(this.button).disabled = true;
      this.displayClock();
    }
  }

  displayClock(when) {
    console.log('time-selector: displayClock: ', when);
    let clocktime = { minutes: 0, hours: 0, days: 0 };
    if (when) {
      clocktime.minutes = when.minutes() / this.config.minutes.max;
      clocktime.hours = when.hours() / this.config.hours.max;
      clocktime.days = when.diff(moment(), 'days') / this.config.days.max;
      // Display the time
      document.getElementById(this.time).innerHTML = when.format('HH:mm');
      document.getElementById(this.date).innerHTML = when.calendar(null, { sameDay: "[Today]", nextDay: "[Tomorrow]", nextWeek: "dddd", sameElse: "ddd, DD MMM" });
    }
    else {
      // Display empty state
      document.getElementById(this.time).innerHTML = '-';
      document.getElementById(this.date).innerHTML = 'Select time';
    }
    // Display polar clock
    select(this.clock).datum([
      clocktime.minutes,
      clocktime.hours,
      clocktime.days])
      .call(polar('basic')
        .width(this.clockSize)
        .height(this.clockSize)
        .margin(0)
        .thickness(2)
        .fill(['#ED9200', '#FCBB54', '#F8D296']));
  }
}
