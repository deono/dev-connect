import uuid from 'uuid';
import { SET_ALERT, REMOVE_ALERT } from './types';

export const setAlert = (msg, alertType, timeout = 5000) => dispatch => {
  // create unique id
  const id = uuid.v4();
  // dispatch action
  dispatch({
    type: SET_ALERT,
    payload: {
      msg,
      alertType,
      id
    }
  });
  // timer to remove alert
  setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
};
