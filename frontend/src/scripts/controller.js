/**
 * sift-jitmail: controller
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';
import moment from 'moment/moment';

export default class JITMailController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // The thread ID of the email being viewed
    this._tid = null;
    // The Draft ID of the email being composed
    this._did = null;

    // Bind this so it can be used in callbacks
    this.onStorageUpdate = this.onStorageUpdate.bind(this);
    this._onIdChanged = this._onIdChanged.bind(this);
    this._onRecipientsChanged = this._onRecipientsChanged.bind(this);
    this._onGoto = this._onGoto.bind(this);
  }

  // TODO: link to docs
  loadView(state) {
    let ret = { html: state.type + '.html' };
    ret.data = new Promise((resolve, reject) => {
      this.storage.get({ bucket: '_redsift', keys: ['webhooks/oauth-wh', 'webhooks/snooze-wh', 'webhooks/sendlater-wh'] }).then((results) => {
        var data = {};
        data.owhurl = results[0].value;
        data.snwhurl = results[1].value;
        data.slwhurl = results[2].value;
        if (state.type === 'email-thread') {
          this._tid = state.params.tid;
          data.tid = this._tid;
          data.detail = state.params.detail;
          this._isAuthenticated().then(() => {
            resolve(data);
          }).catch((error) => {
            data.signin = true;
            if (error) {
              console.error('sift-jitmail: loadView: auth error: ', error);
              data.signinError = error;
            }
            resolve(data);
          });
        }
        else if (state.type === 'summary') {
          this.storage.getAll({ bucket: 'snoozedcal' }).then((snoozes) => {
            let today = moment().format('YYYY-MM-DD');
            data.snoozedcal = [];
            snoozes.forEach((b) => {
              if (b.key >= today) {
                data.snoozedcal.push(JSON.parse(b.value));
              }
            });
            this.storage.getAll({ bucket: 'sendlatercal' }).then((sendlaters) => {
              data.sendlatercal = [];
              sendlaters.forEach((s) => {
                if (s.key >= today) {
                  data.sendlatercal.push(JSON.parse(s.value));
                }
              });
              this._isAuthenticated().then(() => {
                resolve(data);
              }).catch((error) => {
                data.signin = true;
                if (error) {
                  console.error('sift-jitmail: loadView: auth error: ', error);
                  data.signinError = error;
                }
                resolve(data);
              });
            });
          });
        }
        else if (state.type === 'email-compose') {
          data.draft = state.params;
          this._did = state.params.id;
          this._isAuthenticated().then(() => {
            resolve(data);
          }).catch((error) => {
            data.signin = true;
            if (error) {
              console.error('sift-jitmail: loadView: auth error: ', error);
              data.signinError = error;
            }
            resolve(data);
          });
        }
      });
    });
    this.emailclient.subscribe('idChanged', this._onIdChanged);
    this.emailclient.subscribe('recipientsChanged', this._onRecipientsChanged);
    this.storage.subscribe(['_email.id', '_email.tid', 'state', 'snoozedcal', 'sendlatercal'], this.onStorageUpdate);
    this.view.subscribe('goto', this._onGoto.bind(this));
    return ret;
  }

  onStorageUpdate(updated) {
    updated.forEach((u) => {
      if (u === '_email.tid') {
        this.storage.get({ bucket: '_email.tid', keys: [this._tid] }).then((result) => {
          if (result[0].value) {
            let tinfo = JSON.parse(result[0].value);
            this.publish('detail', tinfo.detail);
          }
        });
      }
      else if (u === 'state') {
        this._isAuthenticated().then(() => {
          this.publish('auth', true);
        }).catch((error) => {
          this.publish('auth', false);
        });
      }
      else if (u === '_email.id' && this._did) {
        this.storage.get({ bucket: '_email.id', keys: [this._did] }).then((result) => {
          if (result[0].value) {
            this.emailclient.close();
          }
        });
      }
      else if (u === 'snoozedcal' || u === 'sendlatercal') {
        this.storage.getAll({ bucket: u }).then((responses) => {
          let today = moment().format('YYYY-MM-DD');
          let ret = {};
          ret[u] = [];
          responses.forEach((r) => {
            if (r.key >= today) {
              ret[u].push(JSON.parse(r.value));
            }
          });
          this.publish('calendarupdated', ret);
        });
      }
    });
  }

  _isAuthenticated() {
    return new Promise((resolve, reject) => {
      this.storage.get({ bucket: 'state', keys: ['auth'] }).then((result) => {
        if (result[0].value) {
          let auth = JSON.parse(result[0].value);
          if (auth.valid === true) {
            resolve();
          }
          else {
            reject(auth.error);
          }
        }
        else {
          reject();
        }
      });
    });
  }

  _onGoto(event) {
    let params;
    switch (event) {
      case 'goto-snoozed':
        params = 'label/TimelyMail-Snoozed';
        break;
      case 'goto-sendlater':
        params = 'label/TimelyMail-SendLater';
        break;
    }
    this.emailclient.goto(params);
  }

  _onIdChanged(event) {
    this._did = event.id;
    // Notify view
    this.publish('idChanged', this._did);
  }

  _onRecipientsChanged(event) {
    // TODO: Should make sure that the draft has at least one recipient for it to be valid
  }
}

registerSiftController(new JITMailController());