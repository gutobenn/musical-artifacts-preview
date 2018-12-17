// See https://github.com/danigb/soundfont-player
// for more documentation on prop options.
import React from 'react';
import PropTypes from 'prop-types';
import Soundfont from 'soundfont-player';

class SoundfontProvider extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeAudioNodes: {},
      instrument: null,
      midiInputs: [],
    };
  }

  componentDidMount() {
    this.loadInstrument(this.props.instrumentName);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.instrumentName !== this.props.instrumentName
        || prevProps.soundfont !== this.props.soundfont) {
      this.loadInstrument(this.props.instrumentName);
    }
  }

  loadInstrument = instrumentName => {
    // Re-trigger loading state
    this.setState({
      instrument: null,
    });
    Soundfont.instrument(this.props.audioContext, instrumentName, {
      format: this.props.format,
      soundfont: this.props.soundfont,
      nameToUrl: (name, soundfont, format) => {
        return `${this.props.hostname}/${soundfont}/${name}-${format}.js`;
      },
    }).then(instrument => {
      if (navigator.requestMIDIAccess !== undefined) {
        window.navigator.requestMIDIAccess().then(
          (midiAccess) => {
            this.state.midiInputs.forEach(function (oldMidiInput) {
              oldMidiInput.onmidimessage = null;
	    })
            midiAccess.inputs.forEach(function (midiInput) {
              instrument.listenToMidi(midiInput)
            })
            this.setState({
              midiInputs: midiAccess.inputs
	    });
            console.log("TODO you can use your midi device to test it");
          },
          (e) => {
            console.log("TODO something went wrong while requesting the MIDI devices");
          }
        );
      } else {
        console.log("TODO No access to MIDI devices: browser does not support WebMIDI API, please use the WebMIDIAPIShim together with the Jazz plugin");
      }
      this.setState({
        instrument,
      });
    });
  };

  playNote = midiNumber => {
    this.props.audioContext.resume().then(() => {
      const audioNode = this.state.instrument.play(midiNumber);
      this.setState({
        activeAudioNodes: Object.assign({}, this.state.activeAudioNodes, {
          [midiNumber]: audioNode,
        }),
      });
    });
  };

  stopNote = midiNumber => {
    this.props.audioContext.resume().then(() => {
      if (!this.state.activeAudioNodes[midiNumber]) {
        return;
      }
      const audioNode = this.state.activeAudioNodes[midiNumber];
      audioNode.stop();
      this.setState({
        activeAudioNodes: Object.assign({}, this.state.activeAudioNodes, {
          [midiNumber]: null,
        }),
      });
    });
  };

  // Clear any residual notes that don't get called with stopNote
  stopAllNotes = () => {
    this.props.audioContext.resume().then(() => {
      const activeAudioNodes = Object.values(this.state.activeAudioNodes);
      activeAudioNodes.forEach(node => {
        if (node) {
          node.stop();
        }
      });
      this.setState({
        activeAudioNodes: {},
      });
    });
  };

  render() {
    return this.props.render({
      isLoading: !this.state.instrument,
      playNote: this.playNote,
      stopNote: this.stopNote,
      stopAllNotes: this.stopAllNotes,
    });
  }
}

SoundfontProvider.propTypes = {
  instrumentName: PropTypes.string.isRequired,
  hostname: PropTypes.string.isRequired,
  format: PropTypes.oneOf(['mp3', 'ogg']),
  soundfont: PropTypes.string.isRequired,
  audioContext: PropTypes.instanceOf(window.AudioContext),
  render: PropTypes.func,
};

SoundfontProvider.defaultProps = {
  format: 'mp3',
  soundfont: 'MusyngKite',
  instrumentName: 'acoustic_grand_piano',
};

export default SoundfontProvider;
