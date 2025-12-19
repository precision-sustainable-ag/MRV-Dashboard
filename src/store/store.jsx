import { createStore } from 'redux-autosetters';

const initialState = {};

export const store = createStore(initialState, {});
export { set, get } from 'redux-autosetters';
