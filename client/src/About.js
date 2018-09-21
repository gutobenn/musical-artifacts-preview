import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import './styles/css/About.css';

class About extends Component {
  render() {
    return (
      <div>
        <h2><FormattedMessage id="about" /></h2>
        <FormattedMessage id="project_description" /><br /><br />
        <FormattedMessage id="link_to_github" values={{ link: <a href="https://github.com/gutobenn/musical-artifacts-preview" target="_blank" rel="noopener noreferrer">GitHub</a> }} />
        <br /><br />
        <b><FormattedMessage id="icons_credits" /></b>:
        <ul className="icons_credits">
          <li>MIDI keyboard by Simphiwe Mangole from the Noun Project</li>
          <li>electric guitar by Alone forever from the Noun Project</li>
          <li>Record Button by adekuncoro from the Noun Project</li>
          <li>Download by Vivian Lai from the Noun Project</li>
          <li>drum kit by Tom Fricker from the Noun Project</li>
          <li>forward by andriwidodo from the Noun Project</li>
        </ul>
      </div>
    );
  }
}

export default About;
