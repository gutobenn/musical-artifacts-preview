import React, { Component } from "react";
import { injectIntl } from 'react-intl';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import DimensionsProvider from './DimensionsProvider';
import SoundfontProvider from './SoundfontProvider';
import { Footer, Header, LoadingMessage, Select, SelectArtifact } from './common';
import { sortBy } from 'lodash';
import 'react-piano/dist/styles.css';
import "./styles/css/Midi.css";

// webkitAudioContext fallback needed to support Safari
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote: MidiNumbers.fromNote('c3'),
  lastNote: MidiNumbers.fromNote('f5'),
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
})

class Midi extends Component {
  constructor(props) {
    super(props);
    this.GUITARIX_URL = "https://preview-api.musical-artifacts.com/guitarix.json"; // TODO define it in a config file // TODO change
    this.state = {
      artifacts: [],
      artifactToTest: null,
      instrument: "acoustic_grand_piano",
      instruments: ['acoustic_grand_piano',
                  'acoustic_guitar_nylon',
                  'acoustic_guitar_steel',
                  'electric_guitar_jazz',
                  'distortion_guitar',
                  'electric_bass_finger',
                  'electric_bass_pick',
                  'trumpet',
                  'brass_section',
                  'soprano_sax',
                  'alto_sax',
                  'tenor_sax',
                  'baritone_sax',
                  'flute',
                  'synth_drum'],
      noteRange: {
        first: MidiNumbers.fromNote('c3'),
        last: MidiNumbers.fromNote('f5'),
      },
      loadingMessage: null
    };
  }

  componentDidMount() {
    const intl = this.props.intl;
    this.setState({ loadingMessage: intl.formatMessage({ id: "loading_guitarix_artifacts" })});

    fetch(this.GUITARIX_URL)
      .then(res => res.json())
      .then(
        (result) => {
          const ordered_result = sortBy(result, [function(o) { return o.name.toUpperCase(); }]);
          this.setState({
            artifacts: ordered_result,
            artifactToTest: ordered_result[0].ma_id,
            loadingMessage: null,
          });
        },
        (error) => {
          this.setState({
            loadingMessage: intl.formatMessage({ id: "error" })
          });
        }
      );
  }

  handleSelectArtifact(e) {
    const { artifacts } = this.state;
    const artifactId = e.target.value;
    const artifact_presets = artifacts.find(a => a.ma_id.toString() === artifactId).presets;
    this.setState({ artifactToTest: artifactId, presets: artifacts.find(a => a.ma_id.toString() === artifactId).presets, presetToTest: artifact_presets[0] });
  }

  handleChangeNoteRangeFirst(e) {
    this.setState({ noteRange: { ...this.state.noteRange, first: MidiNumbers.fromNote(e.target.value) } });
  }

  handleChangeNoteRangeLast(e) {
    this.setState({ noteRange: { ...this.state.noteRange, last: MidiNumbers.fromNote(e.target.value) } });
  }

  handleSelectInstrument(e) {
    this.setState({ instrument: e.target.value });
  }

  render() {
    const { artifacts, noteRange, instrument, instruments, loadingMessage } = this.state;
    return (
      <div className="Midi">
        <Header titleId="header_midi" />
        <LoadingMessage message={loadingMessage} />
        <SelectArtifact onChange={this.handleSelectArtifact.bind(this)} artifacts={artifacts} />
        <Select nameId="select_midi_instrument" onChange={this.handleSelectInstrument.bind(this)}  options={instruments}/>
        <Select nameId="select_note_range_first" onChange={this.handleChangeNoteRangeFirst.bind(this)} options={['c1', 'c2']}/>
        <Select nameId="select_note_range_last" onChange={this.handleChangeNoteRangeLast.bind(this)} options={['f4', 'f5']}/>
        <ResponsivePiano noteRange={noteRange} instrument={instrument}/>
        <Footer artifactFileFormat="sf2"/>
      </div>
    );
  }
}

function ResponsivePiano(props) {
  return (
      <DimensionsProvider>
        {({ containerWidth, containerHeight }) => (
          <SoundfontProvider
            instrumentName={props.instrument}
            audioContext={audioContext}
            hostname={soundfontHostname}
            render={({ isLoading, playNote, stopNote }) => (
              <Piano
                noteRange={props.noteRange}
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

export default injectIntl(Midi);
