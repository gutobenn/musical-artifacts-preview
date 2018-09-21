import React, { Component } from 'react';
import { ReactMic } from 'react-mic';
import { injectIntl, FormattedMessage } from 'react-intl';
import record_button from './images/record-button-red.svg';
import start_processing_button from './images/start_processing.svg';
import spinner from './images/spinner.svg';
import download_image from './images/download.svg';
import { Link } from 'react-router-dom';
import './styles/css/Guitar.css';
import classNames from 'classnames';
import Plyr from 'react-plyr';
import { sortBy } from 'lodash';

class Guitar extends Component {
  constructor(props) {
    super(props);
    this.API_URL = "http://localhost:3000"; // TODO define it in a config file
    this.state = {
      isLoaded: false,
      artifacts: [],
      artifactToTest: null,
      presets: [],
      presetToTest: null,
      isRecording: false,
      isProcessing: false,
      record: null,
      processedFiles: [],
      loadingMessage: null,
      currentRequestId: null
    };
    this.handleToggleRecording = this.handleToggleRecording.bind(this);
    this.handleSelectArtifact = this.handleSelectArtifact.bind(this);
    this.handleSelectPreset = this.handleSelectPreset.bind(this);
    this.handleStartProcessing = this.handleStartProcessing.bind(this);
    this.onStop = this.onStop.bind(this);
    this.setLoadingMessage = this.setLoadingMessage.bind(this);
  }

  componentDidMount() {
    const intl = this.props.intl;
    this.setLoadingMessage(intl.formatMessage({ id: "loading_guitarix_artifacts" }));

    fetch(this.API_URL + "/guitarix.json")
      .then(res => res.json())
      .then(
        (result) => {
          const ordered_result = sortBy(result, [function(o) { return o.name.toUpperCase(); }]);
          this.setState({
            isLoaded: true,
            artifacts: ordered_result,
            artifactToTest: ordered_result[0].ma_id,
            presets: ordered_result[0].presets,
            presetToTest: ordered_result[0].presets[0],
            loadingMessage: null
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => { // TODO handle errors
          this.setState({
            isLoaded: true,
            loadingMessage: null,
            error
          });
        }
      );
  }

  startRecording() {
    this.setState({ isRecording: true });
  }

  stopRecording() {
    this.setState({ isRecording: false });
  }

  setLoadingMessage(loadingMessage) {
    this.setState({ loadingMessage });
  }

  onStop(recordedBlob) {
    this.setState({ record: recordedBlob });
  }

  handleToggleRecording(){
    this.setState({ isRecording : !this.state.isRecording });
  }

  handleSelectArtifact(e) {
    const { artifacts } = this.state;
    const artifactId = e.target.value;
    const artifact_presets = artifacts.find(a => a.ma_id.toString() === artifactId).presets;
    this.setState({ artifactToTest: artifactId, presets: artifacts.find(a => a.ma_id.toString() === artifactId).presets, presetToTest: artifact_presets[0] });
  }

  handleSelectPreset(e) {
    this.setState({ presetToTest: e.target.value });
  }

  handleStartProcessing() {
    const { artifacts, artifactToTest, record , presetToTest, isProcessing, processedFiles } = this.state;
    const intl = this.props.intl;

    if (presetToTest === null || artifactToTest === null || record === null || isProcessing) {
      return;
    }

    this.setState({ isProcessing: true });
    this.setLoadingMessage(intl.formatMessage({ id: "uploading_recording" }));

    const method = "POST";
    var body = new FormData();
    body.append('mode', 'guitar');
    body.append('file', record.blob);
    body.append('preset', presetToTest);
    body.append('artifact', artifactToTest);
    fetch(this.API_URL + "/order", { method, body })
      .then(res => res.json())
      .then(data => {
        this.setState({ currentRequestId: data.id, loadingMessage: null });

        this.interval = setInterval(() => {
          fetch(this.API_URL + "/order/" + data.id)
           .then(res => res.json())
           .then(data => {
             if (data.status === "done") {
               clearInterval(this.interval);
               const processed_file = {
                 artifactId: data.artifact,
                 artifactName: artifacts.find(a => a.ma_id.toString() === data.artifact).name,
                 preset: data.preset,
                 file: data.processed_file,
                 order: data.id
               };
               setTimeout(function(){
                 this.setState({ isProcessing: false, processedFiles: [processed_file, ...processedFiles], loadingMessage: intl.formatMessage({ id: "done" })});
                 setTimeout(function(){
                   this.setState({ loadingMessage: null });
                 }
                 .bind(this),
                 1000);
               }
               .bind(this),
               1000); // TODO FIXME the file takes some time to be available on the server. This timeout is just to guarantee the server is not going to return a 404 when plyr try to load it.
             } else if (data.status === "queue"){
               this.setLoadingMessage(intl.formatMessage({ id: "queue_position", values: { position_in_queue: data.position_in_queue } }));
             } else if (data.status === 'processing') {
               this.setLoadingMessage(intl.formatMessage({ id: "processing_record" }));
             }
           });
         }, 1000);
     });
  }

  render() {
    const { presets, artifacts, artifactToTest, presetToTest, isRecording, isProcessing, record, processedFiles, loadingMessage, currentRequestId } = this.state;
    const intl = this.props.intl;
    const record_start_string = intl.formatMessage({
      id: "record_start"
    });
    const record_stop_string = intl.formatMessage({
      id: "record_stop"
    });
    const loading_string = intl.formatMessage({
      id: "loading"
    });
    const download_string = intl.formatMessage({
      id: "download"
    });
    const start_processing_string = intl.formatMessage({
      id: "start_processing"
    });
    const select_another_instrument_string = intl.formatMessage({
      id: "select_another_instrument"
    });
    const view_on_ma_string = intl.formatMessage({
      id: "view_on_ma"
    });
    var record_button_string = isRecording ? record_stop_string : record_start_string;
    var recordStuffClass = classNames(
      'recordStuff',
      {'recording': isRecording}
    );
    var recordClass = classNames(
      'record_button_img',
      {'recording': isRecording}
    );
    var startProcessingClass = classNames(
      'start_processing_button_img',
      {'disabled': presetToTest === null || artifactToTest === null || record === null || isProcessing}
    );
    return (
     <div className="Guitar">
       <div className="selected_header">
         <Link to="/" className="back_link" title={select_another_instrument_string}>&laquo;</Link>
         <div className="selected_header_title"><FormattedMessage id="preview_guitarix_artifacts" /></div>
       </div>
       { loadingMessage != null &&
         <div className="loading-message"><img src={spinner} alt={loading_string}/><span>{loadingMessage}</span></div>
       }
       <div className={recordStuffClass}>
         <h5><FormattedMessage id="recording_title" /></h5>
         <div>
           <img src={record_button} className={recordClass} alt={record_button_string} title={record_button_string} onClick={this.handleToggleRecording}/>
         </div>
         {record == null && !isRecording &&
           <div className="first_record_msg"><FormattedMessage id="record_please_msg"/></div>
         }
         <div>
           <ReactMic
              record={this.state.isRecording}
              className="sound-wave"
              onStop={this.onStop}
              strokeColor="#000000"
              />
          </div>
          {record != null && !isRecording &&
            <div className="record_player">
              <Plyr type="audio" sources={[{ src: record.blobURL, type: 'audio/ogg' }]} className={"react-plyr-user-record-" + currentRequestId} />
              {/*<a href={record.blobURL}><img src={download_image} alt={download_string} className="download_button"/></a>*/}
            </div>
          }
       </div>
       <div>
         <div className="select_artifact_div">
           <div><FormattedMessage id="select_artifact" /></div>
           <select className="select_artifact" onChange={this.handleSelectArtifact}>
             {artifacts.map((artifact) => (
               <option value={artifact.ma_id} key={artifact.ma_id}>
                 {artifact.name}
               </option>
             ))}
           </select>
         </div>
         <div className="select_artifact_div">
           <div><FormattedMessage id="select_preset" /></div>
           <select className="select_preset" onChange={this.handleSelectPreset}>
             {presets != null && presets.map((preset) => (
               <option value={preset} key={preset}>
                 {preset}
               </option>
             ))}
           </select>
         </div>
         <img src={start_processing_button} className={startProcessingClass} alt={start_processing_string} title={start_processing_string} onClick={this.handleStartProcessing}/>
         <div className="clearfix"></div>
         {processedFiles.length > 0
           && <div>
                <h5 className="processed_files_title"><FormattedMessage id="processed_files" /></h5>
                <ul className="list_of_recordings">
                  {processedFiles.map((processed_file, index) => (
                   <li key={processed_file.file}>
                     <a href={"https://musical-artifacts.com/artifacts/" + processed_file.artifactId} className="view_artifact" title={view_on_ma_string}  target="_blank">{processed_file.artifactName} - {processed_file.preset}</a>
                     <div>
                       <Plyr type="audio" sources={[{ src: processed_file.file, type: 'audio/mp3' }]} className={"react-plyr-processed-" + index} />
                       <a href={processed_file.file} target="_blank"><img src={download_image} alt={download_string} className="download_button"/></a>
                     </div>
                   </li>
                 ))}
                </ul>
              </div>
         }
       </div>
       <div className="linkToMa">
         <FormattedMessage id="artifacts_listed_here" values={{ link: <a href="https://musical-artifacts.com/?formats=gx" target="_blank"><FormattedMessage id="musical_artifacts" /></a> }} />
       </div>
     </div>
   );
 }
}

export default injectIntl(Guitar);
