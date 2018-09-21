import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import guitar from './images/electric_guitar.svg';
import midi_keyboard from './images/midi_keyboard.svg';
import drums from './images/drums.svg';
import './styles/css/SelectInstrument.css';

class SelectInstrument extends Component {
  render() {
    const intl = this.props.intl;
    const guitar_string = intl.formatMessage({
      id: "guitar"
    });
    const midi_controller_string = intl.formatMessage({
      id: "midi_controller"
    });
    const drums_string = intl.formatMessage({
      id: "drums"
    });

    return (
      <div className="SelectInstrument">
        <h4><FormattedMessage id="select_instrument" /></h4>
        <div className="instruments">
          <div className="instrument">
            <Link to="/guitar">
              <img src={guitar} id="electric_guitar_img" alt={guitar_string} /><br />
              <span><FormattedMessage id="guitar" /></span>
            </Link>
          </div>
          <div className="instrument">
            <Link to="/midi">
              <img src={midi_keyboard} id="midi_keyboard_img" alt={midi_controller_string} /><br />
              <span><FormattedMessage id="midi_controller" /></span>
            </Link>
          </div>
          <div className="instrument">
            <Link to="/drums">
              <img src={drums} id="drums_img" alt={drums_string} /><br />
              <span><FormattedMessage id="drums" /></span>
            </Link>
          </div>
        </div>
        <Link to="/about" className="about">
          <span><FormattedMessage id="about" /></span>
        </Link>
      </div>
    );
  }
}

export default injectIntl(SelectInstrument);
