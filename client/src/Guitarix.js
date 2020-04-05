import React, { Component } from 'react';
import { ReactMic } from 'react-mic';
import { injectIntl, FormattedMessage } from 'react-intl';
import record_button from './images/record-button-red.svg';
import start_processing_button from './images/start_processing.svg';
import download_image from './images/download.svg';
import { Footer, Header, LoadingMessage, Select, SelectArtifact } from './common';
import './styles/css/Guitarix.css';
import classNames from 'classnames';
import Plyr from 'react-plyr';
import { sortBy } from 'lodash';
import DetectBrowser from 'react-detect-browser';

class Guitarix extends Component {
  constructor(props) {
    super(props);
    // TODO define urls in a config file
    this.API_URL = "https://preview-api.musical-artifacts.com/api";
    this.GUITARIX_URL = "https://preview-api.musical-artifacts.com/guitarix.json";
    this.state = {
      artifacts: [],
      artifactToTest: null,
      presets: [],
      presetToTest: null,
      isRecording: false,
      isProcessing: false,
      record: null,
      processedFiles: [],
      loadingMessage: null,
      alreadyUploadedFilename: null,
    };
    this.handleToggleRecording = this.handleToggleRecording.bind(this);
    this.handleSelectArtifact = this.handleSelectArtifact.bind(this);
    this.handleSelectPreset = this.handleSelectPreset.bind(this);
    this.handleStartProcessing = this.handleStartProcessing.bind(this);
    this.onStop = this.onStop.bind(this);
  }

  componentDidMount() {
    const intl = this.props.intl;
    this.setState({ loadingMessage: intl.formatMessage({ id: "loading_guitarix_artifacts" })});

    fetch(this.GUITARIX_URL)
      .then(res => res.json())
      .then(
        (result) => {
          const ordered_result = sortBy(result, [function(o) { return o.name.toUpperCase(); }]);
          this.setState({
            artifacts: ordered_result,
            artifactToTest: ordered_result[0].ma_id,
            presets: ordered_result[0].presets,
            presetToTest: ordered_result[0].presets[0],
            loadingMessage: null
          });
        },
        (error) => {
          this.setState({
            loadingMessage: null,
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

  onStop(recordedBlob) {
    this.setState({ record: recordedBlob, alreadyUploadedFilename: null });
  }

  handleToggleRecording(){
    this.setState({ isRecording : !this.state.isRecording, record: null });
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
    const { alreadyUploadedFilename, artifacts, artifactToTest, record , presetToTest, isProcessing, processedFiles } = this.state;
    const intl = this.props.intl;

    if (presetToTest === null || artifactToTest === null || record === null || isProcessing) {
      return;
    }

    this.setState({ isProcessing: true, loadingMessage: intl.formatMessage({ id: "uploading_recording" })});

    const method = "POST";
    var body = new FormData();
    body.append('mode', 'guitarix');
    body.append('preset', presetToTest);
    body.append('artifact', artifactToTest);
    if (alreadyUploadedFilename !== null) {
      body.append('filename', alreadyUploadedFilename);
    } else {
      body.append('file', record.blob);
    }
    fetch(this.API_URL + "/request", { method, body })
      .then(res => res.json())
      .then(data => {
        this.setState({ loadingMessage: null });

        this.interval = setInterval(() => {
          fetch(this.API_URL + "/request/" + data.id)
           .then(res => res.json())
           .then(data => {
             console.log(data);
             if (data.status === "error") {
               clearInterval(this.interval);
               this.setState({ isProcessing: false, loadingMessage: intl.formatMessage({ id: "error" })});
               setTimeout(function(){
                 this.setState({ loadingMessage: null });
               }
               .bind(this),
               3000);
             }
             else if (data.status === "done") {
               clearInterval(this.interval);
               const processed_file = {
                 artifactId: data.artifact,
                 artifactName: artifacts.find(a => a.ma_id.toString() === data.artifact).name,
                 preset: data.preset,
                 file: data.processed_file,
                 request: data.id
               };
               this.setState({ isProcessing: false, processedFiles: [processed_file, ...processedFiles], loadingMessage: intl.formatMessage({ id: "done" }), alreadyUploadedFilename: data.filename});
               setTimeout(function(){
                 this.setState({ loadingMessage: null });
               }
               .bind(this),
               1000);
             } else if (data.status === "queue"){
               this.setState({ loadingMessage: intl.formatMessage({ id: "queue_position"}, { position_in_queue: data.position_in_queue })});
             } else if (data.status === 'processing') {
               this.setState({ loadingMessage: intl.formatMessage({ id: "processing_record" }) });
             }
           })
           .catch( error => {
             clearInterval(this.interval);
           });
         }, 1000);
     },
     (error) => {
       clearInterval(this.interval);
       this.setState({ isProcessing: false, loadingMessage: intl.formatMessage({ id: "error" })});
       setTimeout(function(){
         this.setState({ loadingMessage: null });
       }
       .bind(this),
       3000);
     });
  }

  render() {
    const { presets, artifacts, artifactToTest, presetToTest, isRecording, isProcessing, record, processedFiles, loadingMessage } = this.state;
    const intl = this.props.intl;
    const record_start_string = intl.formatMessage({
      id: "record_start"
    });
    const record_stop_string = intl.formatMessage({
      id: "record_stop"
    });
    const start_processing_string = intl.formatMessage({
      id: "start_processing"
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
      <DetectBrowser>
        {({ browser }) =>
          browser && (browser.name === "firefox" || browser.name === "chrome") ? (
           <div className="Guitarix">
             <Header titleId="header_guitarix_artifacts" />
             <LoadingMessage message={loadingMessage} />
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
                    <Plyr type="audio" sources={[{ src: record.blobURL, type: 'audio/ogg' }]} className={ "react-plyr-user-record-" + record.stopTime } />
                    {/*<a href={record.blobURL}><img src={download_image} alt={download_string} className="download_button"/></a>*/}
                  </div>
                }
             </div>
             <div>
               <SelectArtifact onChange={this.handleSelectArtifact.bind(this)} artifacts={artifacts} />
               <Select nameId="select_preset" onChange={this.handleSelectPreset.bind(this)} options={presets}/>
               <img src={start_processing_button} className={startProcessingClass} alt={start_processing_string} title={start_processing_string} onClick={this.handleStartProcessing}/>
               <div className="clearfix"></div>
               <ProcessedFilesList files={processedFiles} intl={intl}/>
             </div>
             <Footer artifactFileFormat="gx"/>
           </div>
         ) : (
           <h2><FormattedMessage id="guitarix_browser_not_supported" /></h2>
         )
       }
     </DetectBrowser>
   );
 }
}

class ProcessedFilesList extends React.Component {
  render (){
    const { intl, files } = this.props;
    const download_string = intl.formatMessage({
      id: "download"
    });
    const view_on_ma_string = intl.formatMessage({
      id: "view_on_ma"
    });
    return (
      files.length > 0
      && <div>
           <h5 className="processed_files_title"><FormattedMessage id="processed_files" /></h5>
           <ul className="list_of_recordings">
             {files.map((processed_file, index) => (
              <li key={processed_file.file}>
                <a href={"https://musical-artifacts.com/artifacts/" + processed_file.artifactId} className="view_artifact" title={view_on_ma_string}  target="_blank" rel="noopener noreferrer">{processed_file.artifactName} - {processed_file.preset}</a>
                <div>
                  <Plyr type="audio" sources={[{ src: processed_file.file, type: 'audio/mp3' }]} className={"react-plyr-processed-" + index} />
                  <a href={processed_file.file} target="_blank" rel="noopener noreferrer"><img src={download_image} alt={download_string} className="download_button"/></a>
                </div>
              </li>
            ))}
           </ul>
         </div>
    );
  }
}

export default injectIntl(Guitarix);
