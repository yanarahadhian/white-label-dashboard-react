import { combineReducers } from 'redux'
import user from './reducer_user';
import mode from './reducer_mode';
import table_states from  './reducer_table'

export default combineReducers({
    user,
    mode,
    table_states
})