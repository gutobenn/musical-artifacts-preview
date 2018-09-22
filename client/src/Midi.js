import React, { Component } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import DimensionsProvider from './DimensionsProvider';
import SoundfontProvider from './SoundfontProvider';
// CSS styles are required in order to render piano correctly. Importing CSS requires
// a CSS loader. Alternatively, copy the CSS file directly from src/styles.css into your <head>.
import 'react-piano/dist/styles.css';
import "./styles/css/Midi.css";

// webkitAudioContext fallback needed to support Safari
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const noteRange = {
  first: MidiNumbers.fromNote('c3'),
  last: MidiNumbers.fromNote('f5'),
};
const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote: noteRange.first,
  lastNote: noteRange.last,
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
});

class Midi extends Component {
  render() {
    return (
        <ResponsivePiano />
    );
  }
}

function ResponsivePiano(props) {
  return (
    <DimensionsProvider>
      {({ containerWidth, containerHeight }) => (
        <SoundfontProvider
          instrumentName="acoustic_grand_piano"
          audioContext={audioContext}
          hostname={soundfontHostname}
          render={({ isLoading, playNote, stopNote }) => (
            <Piano
              noteRange={noteRange}
              width={containerWidth}
              onPlayNote={playNote}
              onStopNote={stopNote}
              disabled={isLoading}
              keyboardShortcuts={keyboardShortcuts}
            />
          )}
        />
      )}
    </DimensionsProvider>
  );
}

export default Midi;
