import { SIGNED_IN } from '../constants';

let user = {
    Username: null,
    Name: null
}

export default (state = user, action) => {
    switch (action.type) {
        case SIGNED_IN:
            user = action.UserData

            return user;
        default:
            return state;
    }
}