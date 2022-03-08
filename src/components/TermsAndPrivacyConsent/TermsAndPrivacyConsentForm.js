import React from 'react';
import Rodal from 'rodal';
import 'rodal/lib/rodal.css';

import ExternalLink from '../ExternalLink';
import Store from '../../store';
import { LOCAL_STORAGE_PRIVACY_CONSENT_KEY } from '../../utils/const';

import './TermsAndPrivacyConsentForm.scss';

export default class TermsAndPrivacyConsentForm extends React.Component {
  state = {
    hasRejected: false
  };

  onSelect = selection => {
    if (selection) {
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_CONSENT_KEY, true);
      Store.setTermsPrivacyAccepted(true);
    } else {
      Store.setTermsPrivacyAccepted(false);
      this.setState({ hasRejected: true });
    }
  };

  render() {
    const { hasRejected } = this.state;
    return (
      <Rodal
        animation="slideUp"
        visible={true}
        customStyles={{
          width: '30vw',
          minWidth: 200,
          height: 'auto',
          bottom: 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: 30
        }}
        showCloseButton={false}
      >
        <div className="terms-and-privacy">
          {hasRejected ? (
            <div>
              <div className="message reject-message">
                We use third-party cookies to provide secure authentication with Sentinel Hub
                services, which is required to provide the basic functionality of the application.
                <div className="learn-more">
                  Learn more about{' '}
                  <ExternalLink
                    href="https://www.sentinel-hub.com/explore/sentinelplayground/"
                    className="link-external"
                  >
                    Playground
                  </ExternalLink>
                  .
                </div>
              </div>
              <div onClick={() => this.setState({ hasRejected: false })} className="btn back-btn">
                <i className="fa fa-arrow-left" />
                Back
              </div>
            </div>
          ) : (
            <div>
              <div className="message">
                In order to use the application, you need to accept{' '}
                <ExternalLink href="https://www.sentinel-hub.com/tos/" className="link-external">
                  Terms of Service and Privacy Policy
                </ExternalLink>
                .
              </div>
              <div className="button-holder">
                <div className="btn accept-btn" onClick={() => this.onSelect(true)}>
                  ACCEPT
                </div>
                <div className="btn reject-btn" onClick={() => this.onSelect(false)}>
                  REJECT
                </div>
              </div>
              <div className="log-in-option">
                If you have an account, you have already agreed to Terms of Service and Privacy
                Policy. You can open Playground for your instances from the{' '}
                <ExternalLink
                  href="https://apps.sentinel-hub.com/dashboard"
                  className="link-external"
                >
                  Dashboard
                </ExternalLink>
                .
              </div>
            </div>
          )}
        </div>
      </Rodal>
    );
  }
}
