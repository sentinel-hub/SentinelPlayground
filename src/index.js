import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'font-awesome/css/font-awesome.css'
import './animate.css';
import './toast.css';

import 'style!css!sass!./index.scss';
import { Provider } from 'react-redux'
import Store from './store'

const rootEl = document.getElementById('root')

ReactDOM.render(
    <Provider store={Store.Store}>
      <App />
    </Provider>,
    rootEl
)

if (module.hot) {
    module.hot.accept('./App', () => {
        const NextApp = require('./App').default
        ReactDOM.render(
            <NextApp />,
            rootEl
        )
    })
}
