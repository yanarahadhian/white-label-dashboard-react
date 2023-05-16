import { SIGNED_IN, PASSING_BOOK_DATA, GET_PAYMENT_METHOD, FORM_MODE, TABLE_STATE } from '../constants';

export function LogUser(UserData) {
    const action = {
        type: SIGNED_IN,
        UserData
    }
    return action;
}

export function FormMode(Mode) {
    const action = {
        type: FORM_MODE,
        Mode
    }

    return action;
}

export function PassBookData(BookData) {
    const action = {
        type: PASSING_BOOK_DATA,
        BookData
    }

    return action;
}

export function GetPaymentMethod(PaymentMethod) {
    const action = {
        type: GET_PAYMENT_METHOD,
        PaymentMethod
    }
    return action;
}

export function SetTableStates (TableStates) {
    const action = {
        type : TABLE_STATE,
        TableStates
    }

    return action
}
