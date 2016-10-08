/**
 * sift-jitmail: Custom loading indicator using a polar clock representation
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { select } from 'd3-selection';
import { transition } from 'd3-transition';
import { html as polar } from '@redsift/d3-rs-polars';

export default class LoadingIndicator {
  constructor() {
    this._interval = null;
    this._outer = 0;
    this._inner = 1;
    this._infinite = null;

    transition();
  }

  start() {
    this._infinite = polar('infinite')
      .padAngle(0.01)
      .outerRadius(80)
      .margin(0)
      .thickness(2)
      .width(160)
      .height(160)
      .fill(['#ED9200', '#FCBB54']);

    select('#loading').datum([this._outer, this._inner]).call(this._infinite);

    this._spin();
    this._interval = setInterval(this._spin.bind(this), 1000);
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _spin() {
    let direction = (this._outer === 0);
    this._infinite.reverse(!direction);
    if (direction) {
      this._outer = 1
      this._inner = 0;
    }
    else {
      this._outer = 0;
      this._inner = 1;
    };
    select('#loading')
      .datum([this._outer, this._inner])
      .transition()
      .duration(1000)
      .call(this._infinite);
  }
}
