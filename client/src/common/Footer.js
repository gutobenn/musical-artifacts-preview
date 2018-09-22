import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import '../styles/css/common/Footer.css';

class Footer extends Component {
  render() {
    return (
      <div className="linkToMa">
        <FormattedMessage id="artifacts_listed_here" values={{ link: <a href={"https://musical-artifacts.com/?formats=" + this.props.artifactFileFormat} target="_blank" rel="noopener noreferrer"><FormattedMessage id="musical_artifacts" /></a> }} />
      </div>
    );
  }
}

export default injectIntl(Footer);
