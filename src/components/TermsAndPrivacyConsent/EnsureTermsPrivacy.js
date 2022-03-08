import React from 'react';

import Store from '../../store';
import { LOCAL_STORAGE_PRIVACY_CONSENT_KEY } from '../../utils/const';

export default class EnsureTermsPrivacy extends React.Component {
  state = {
    ensuringConsentComplete: false
  };

  componentDidMount() {
    const consent = localStorage.getItem(LOCAL_STORAGE_PRIVACY_CONSENT_KEY);

    if (consent !== 'true') {
      Store.setTermsPrivacyAccepted(false);
    } else {
      Store.setTermsPrivacyAccepted(true);
    }

    this.setState({ ensuringConsentComplete: true });
  }

  render() {
    const { ensuringConsentComplete } = this.state;
    if (ensuringConsentComplete) {
      return this.props.children;
    }
    return (
      <div className="initial-loader">
        <i className="fa fa-cog fa-spin fa-3x fa-fw" />
      </div>
    );
  }
}
