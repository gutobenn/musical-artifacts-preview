export const CHANGE_EMBEDDED = 'CHANGE_EMBEDDED';
export const SET_DEFAULT_SOUNDFONT = 'SET_DEFAULT_SOUNDFONT';

export const changeEmbedded = embedded => ({
    type: CHANGE_EMBEDDED,
    embedded: true,
});

export const setDefaultSoundfont = defaultSoundfont => ({
    type: SET_DEFAULT_SOUNDFONT,
    defaultSoundfont,
});
