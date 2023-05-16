import { TABLE_STATE } from '../constants'

let table_states = {}

export default (state = table_states, action) => {
    switch (action.type) {
        case TABLE_STATE : 
        table_states = action.TableStates

            return table_states
        default :
            return state
    }
}