import { CHANGE_EMBEDDED, SET_DEFAULT_SOUNDFONT } from "../actions/actions";

const initialState = {
    embedded: false,
    defaultSoundfont: undefined
};

const rootReducer = (state = initialState, action) => {
    switch (action.type) {
        case CHANGE_EMBEDDED:
            return Object.assign({}, state, {
                embedded: action.embedded
            });
        case SET_DEFAULT_SOUNDFONT:
            return Object.assign({}, state, {
                defaultSoundfont: action.defaultSoundfont
            });
        default:
            return state;
    }
};

export default rootReducer;