import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import guitar from './images/electric_guitar.svg';
import midi_keyboard from './images/midi_keyboard.svg';
import './styles/css/SelectInstrument.css';

class SelectInstrument extends Component {
  render() {
    const intl = this.props.intl;
    const guitar_bass_string = intl.formatMessage({
      id: "guitar_bass"
    });
    const midi_controller_string = intl.formatMessage({
      id: "midi_controller"
    });
    return (
      <div className="SelectInstrument">
        <h4><FormattedMessage id="select_instrument" /></h4>
        <div className="instruments">
          <div className="instrument">
            <Link to="/guitarix">
              <img src={guitar} id="electric_guitar_img" alt={guitar_bass_string} /><br />
              <span><FormattedMessage id="guitar_bass" /></span>
            </Link>
          </div>
          <div className="instrument">
            <Link to="/midi">
              <img src={midi_keyboard} id="midi_keyboard_img" alt={midi_controller_string} /><br />
              <span><FormattedMessage id="midi_controller" /></span>
            </Link>
          </div>
        </div>
        {/* TODO use Footer component? */}
        <div className="change_language">
          <Link to="/?lang=pt" target="_self">Português</Link> | <Link to="/?lang=en" target="_self">English</Link>
        </div>
        <Link to="/about" className="about">
          <span><FormattedMessage id="about" /></span>
        </Link>
      </div>
    );
  }
}

export default injectIntl(SelectInstrument);
