import React, { Component } from "react";
import { injectIntl } from 'react-intl';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import DimensionsProvider from './DimensionsProvider';
import SoundfontProvider from './SoundfontProvider';
import { Footer, Header, LoadingMessage, Select, SelectArtifact } from './common';
import { sortBy } from 'lodash';
import { connect } from 'react-redux';
import 'react-piano/dist/styles.css';
import "./styles/css/Midi.css";

// webkitAudioContext fallback needed to support Safari
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';
const soundfontHostname = 'https://preview-api.musical-artifacts.com/soundfonts';

const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote: MidiNumbers.fromNote('c3'),
  lastNote: MidiNumbers.fromNote('c8'),
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
})

class Midi extends Component {
  constructor(props) {
    super(props);
    this.SOUNDFONTS_JSON_URL = "https://preview-api.musical-artifacts.com/soundfonts.json"; // TODO define it in a config file // TODO change
    this.state = {
      artifacts: [],
      artifactToTest: null,
      instrument: "0",
      instruments: [],
      numberOfKeys: '25',
      noteRange: {
        first: MidiNumbers.fromNote('c3'),
        last: MidiNumbers.fromNote('c5'),
      },
      loadingMessage: null,
      isLoaded: false
    };
  }

  componentDidMount() {
    const { intl } = this.props;
    this.setState({ loadingMessage: intl.formatMessage({ id: "loading_soundfont_artifacts" })});

    fetch(this.SOUNDFONTS_JSON_URL)
      .then(res => res.json())
      .then(
        (result) => {
          const ordered_result = sortBy(result, [function(o) { return o.name.toUpperCase(); }]);
          this.setState({
            artifacts: ordered_result,
            artifactToTest: String(ordered_result[0].ma_id),
            instruments: ordered_result[0].instruments,
            instrument: this.convertInstrumentName(ordered_result[0].instruments[0]),
            loadingMessage: null,
            isLoaded: true
          }, () => {
            if (this.props.defaultSoundfont !== undefined) {
              this.setCurrentArtifact(this.props.defaultSoundfont); // TODO it's changing the artifacts, but not on select field
            }
          });
        },
        (error) => {
          this.setState({
            loadingMessage: intl.formatMessage({ id: "error" })
          });
        }
      );
  }

  convertInstrumentName(s){
    return parseInt(s.slice(0,3)).toString();
  }

  handleSelectArtifact(e) {
    const artifactId = e.target.value;
    this.setCurrentArtifact(artifactId);
  }

  setCurrentArtifact(artifactId) {
    const { artifacts } = this.state;
    const artifact_instruments = artifacts.find(a => a.ma_id.toString() === artifactId).instruments;
    this.setState({ artifactToTest: artifactId, instruments: artifacts.find(a => a.ma_id.toString() === artifactId).instruments, instrument: this.convertInstrumentName(artifact_instruments[0]) });
  }

  handleChangeNumberOfKeys(e) {
    let noteRange;
    switch(e.target.value) {
      case "88":
        noteRange = { first: MidiNumbers.fromNote('a0'), last: MidiNumbers.fromNote('c8') };
        break;
      case "49":
        noteRange = { first: MidiNumbers.fromNote('c2'), last: MidiNumbers.fromNote('c6') };
        break;
      default:
        noteRange = { first: MidiNumbers.fromNote('c3'), last: MidiNumbers.fromNote('c5') };
        break;
    }
    this.setState({ noteRange, numberOfKeys: e.target.value });
  }

  handleSelectInstrument(e) {
    this.setState({ instrument: this.convertInstrumentName(e.target.value) });
  }

  render() {
    const { artifacts, artifactToTest, isLoaded, noteRange, instrument, instruments, loadingMessage } = this.state;
    const { embedded } = this.props;
    return (
      <div className="Midi">
        <Header titleId="header_midi" />
        <LoadingMessage message={loadingMessage} />
        <div className="Selects-Container">
          { ! embedded && <SelectArtifact onChange={this.handleSelectArtifact.bind(this)} artifacts={artifacts} /> }
          <Select nameId="select_midi_instrument" onChange={this.handleSelectInstrument.bind(this)}  options={instruments}/>
          <Select nameId="select_number_keys" onChange={this.handleChangeNumberOfKeys.bind(this)} options={['25', '49', '88']}/>
        </div>
        <div className="clearfix"></div>
        { isLoaded &&
          <ResponsivePiano noteRange={noteRange} instrument={instrument} soundfont={artifactToTest}/>}
        { ! embedded &&
          <Footer artifactFileFormat="sf2"/>}
      </div>
      // TODO display error message if artifact does not exist
    );
  }
}

function ResponsivePiano(props) {
  return (
      <DimensionsProvider>
        {({ containerWidth, containerHeight }) => (
          <SoundfontProvider
            instrumentName={props.instrument}
            soundfont={props.soundfont}
            audioContext={audioContext}
            hostname={soundfontHostname}
            render={({ isLoading, playNote, stopNote }) => (
              <Piano
                noteRange={props.noteRange}
                width={containerWidth}
                playNote={playNote}
                stopNote={stopNote}
                disabled={isLoading}
                keyboardShortcuts={keyboardShortcuts}
              />
            )}
          />
        )}
      </DimensionsProvider>
  );
}

const mapStateToProps = state => ({
  embedded: state.embedded,
  defaultSoundfont: state.defaultSoundfont
});

export default injectIntl(connect(mapStateToProps, null)(Midi));

