import { FORM_MODE } from '../constants';

let mode = null

export default (state = mode, action) => {
    switch (action.type) {
        case FORM_MODE:
            mode = action.Mode

            return mode;
        default:
            return state;
    }
}