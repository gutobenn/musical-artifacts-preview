import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import '../styles/css/common/LoadingMessage.css';
import spinner from '../images/spinner.svg';

class LoadingMessage extends Component {
  render() {
    const { intl } = this.props;
    const loading_string = intl.formatMessage({
      id: "loading"
    });
    return (
      this.props.message != null
      && <div className="LoadingMessage"><img src={spinner} alt={loading_string}/><span>{this.props.message}</span></div>
    );
  }
}

export default injectIntl(LoadingMessage);
