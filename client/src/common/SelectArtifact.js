import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import '../styles/css/common/Select.css';
import '../styles/css/common/SelectArtifact.css';
import link_image from '../images/link.svg';

class SelectArtifact extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedArtifactId: 0,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.artifacts !== this.props.artifacts && this.props.artifacts.length > 0){
      this.setState({ selectedArtifactId: this.props.artifacts[0].ma_id });
    }
  }

  handleChangeArtifact(e) {
    this.setState({ selectedArtifactId: e.target.value });
    this.props.onChange(e);
  }

  render() {
    const { selectedArtifactId } = this.state;
    const { intl, artifacts } = this.props;
    const view_on_ma_string = intl.formatMessage({
      id: "view_on_ma"
    });
    return (
      <div className="Select SelectArtifact">
        <div><FormattedMessage id="select_artifact" /></div>
        <select onChange={this.handleChangeArtifact.bind(this)}>
          {artifacts != null && artifacts.map((artifact) => (
            <option value={artifact.ma_id} key={artifact.ma_id}>
              {artifact.name}
            </option>
          ))}
        </select>
        { selectedArtifactId != null
          && <a href={"https://musical-artifacts.com/artifacts/" + selectedArtifactId} target="_blank" rel="noopener noreferrer">
               <img className="linkImage" src={link_image} alt={view_on_ma_string}/>
             </a>
         }
      </div>
    );
  }
}

export default injectIntl(SelectArtifact);
