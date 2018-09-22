import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import '../styles/css/common/Select.css';

class Select extends Component {
  render() {
    return (
      <div className="Select">
        <div><FormattedMessage id={this.props.nameId} /></div>
        <select onChange={this.props.onChange}>
          {this.props.options != null && this.props.options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

export default injectIntl(Select);
