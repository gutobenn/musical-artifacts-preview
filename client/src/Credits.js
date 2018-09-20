import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

class Credits extends Component {
  render() {
    return (
      <div>
        <h2><FormattedMessage id="credits" /></h2>
        <b><FormattedMessage id="icons" /></b>:
        <ul>
          <li>MIDI keyboard by Simphiwe Mangole from the Noun Project</li>
          <li>electric guitar by Alone forever from the Noun Project</li>
          <li>Record Button by adekuncoro from the Noun Project</li>
          <li>Download by Vivian Lai from the Noun Project</li>
          <li>drum kit by Tom Fricker from the Noun Project</li>
          <li>forward by andriwidodo from the Noun Project</li>
        </ul>
        <br />
        Source code: <a href="https://github.com/gutobenn/musical-artifacts-preview">https://github.com/gutobenn/musical-artifacts-preview</a>
      </div>
    );
  }
}

export default Credits;
