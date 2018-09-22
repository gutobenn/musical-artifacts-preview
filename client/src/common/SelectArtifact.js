import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import '../styles/css/common/Select.css';

class SelectArtifact extends Component {
  render() {
    return (
      <div className="Select">
        <div><FormattedMessage id="select_artifact" /></div>
        <select onChange={this.props.onChange}>
          {this.props.artifacts != null && this.props.artifacts.map((artifact) => (
            <option value={artifact.ma_id} key={artifact.ma_id}>
              {artifact.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

export default injectIntl(SelectArtifact);
