/**
 * sift-jitmail: email client controller
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { EmailClientController, registerEmailClientController } from '@redsift/sift-sdk-web';
import moment from 'moment/moment';

export default class JITMailEmailClientController extends EmailClientController {
  constructor() {
    super();
  }

  loadThreadListView (listInfo) {
    if (listInfo) {
      let st;
      if (listInfo.snoozed) {
        st = 'Snoozed: ' + moment(listInfo.snoozed).calendar();
      }
      else if (listInfo.sendlater) {
        st = 'Send later: ' + moment(listInfo.sendlater).calendar();
      }
      if (st) {
        return {
          template: '003_list_common_img',
          value: {
            image: { url: 'assets/icon.svg' },
            subtitle: st
          }
        };
      }
    }
  }
}

registerEmailClientController(new JITMailEmailClientController());
