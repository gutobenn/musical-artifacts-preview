import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import Root from './Root'

import store from './redux/store/store';

render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.getElementById('root')
);

