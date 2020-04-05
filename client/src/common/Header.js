import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import '../styles/css/common/Header.css';

class Header extends Component {
  render() {
    const intl = this.props.intl;
    const { embedded } = this.props;
    const select_another_instrument_string = intl.formatMessage({
      id: "select_another_instrument"
    });
    return (
      <div className="Header">
        { ! embedded &&
          <Link to="/" className="back_link" title={select_another_instrument_string}>&laquo;</Link> }
        <div className="header_title"><FormattedMessage id={this.props.titleId} /></div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  embedded: state.embedded,
});

export default injectIntl(connect(mapStateToProps, null)(Header));
