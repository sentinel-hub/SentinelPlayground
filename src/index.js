import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'font-awesome/css/font-awesome.css';
import './animate.css';
import './toast.css';

import './index.scss';
import { Provider } from 'react-redux';
import EnsureTermsPrivacy from './components/TermsAndPrivacyConsent/EnsureTermsPrivacy';
import Store from './store';

const rootEl = document.getElementById('root');

ReactDOM.render(
  <Provider store={Store.Store}>
    <EnsureTermsPrivacy>
      <App />
    </EnsureTermsPrivacy>
  </Provider>,
  rootEl
);

if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    ReactDOM.render(<NextApp />, rootEl);
  });
}
