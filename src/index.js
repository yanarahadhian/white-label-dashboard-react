import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Routes from './routes';
import reducer from './reducers';
import { loadState, saveState } from './localStorage';

const persistedState = loadState()

const store = createStore(
    reducer, 
    persistedState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    );

store.subscribe(() => {
    saveState(store.getState())
})

ReactDOM.render(
    <Provider store={store}>
        <Routes />
    </Provider>
    , document.getElementById('root'));