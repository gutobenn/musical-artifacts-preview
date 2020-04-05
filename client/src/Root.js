import React from 'react'
import { IntlProvider } from 'react-intl';
import {BrowserRouter, Route, Switch} from 'react-router-dom'
import {flattenMessages} from "./utils";
import messages from "./messages";
import SelectInstrument from "./SelectInstrument";
import Guitarix from "./Guitarix";
import Midi from "./Midi";
import Drums from "./Drums";
import About from "./About";
import NoMatch from "./NoMatch";
import { connect } from 'react-redux';
import { changeEmbedded, setDefaultSoundfont } from './redux/actions/actions';
import './styles/css/Root.css';


let params = new URLSearchParams(document.location.search.substring(1));
let locale =
    params.get("lang")
    || navigator.language.split(/[-_]/)[0] // language without region code
    || 'en';

export class App extends React.Component {
    componentDidMount() {
        // Set embedded = true
        if (params.get("embed") === 'true') {
            this.props.changeEmbedded();
        }
        if (params.get("soundfont") !== undefined) {
            this.props.setDefaultSoundfont(params.get("soundfont"));
        }
    }

    render() {
        return (
            <IntlProvider locale={locale} messages={flattenMessages(messages[locale])}>
                <BrowserRouter>
                    <Switch>
                        <Route path="/" exact={true} component={SelectInstrument}/>
                        <Route path="/guitarix" component={Guitarix}/>
                        <Route path="/midi" component={Midi}/>
                        <Route path="/drums" component={Drums}/>
                        <Route path="/about" component={About}/>
                        <Route component={NoMatch}/>
                    </Switch>
                </ BrowserRouter>
            </IntlProvider>
        )
    }
};

const mapStateToProps = state => ({
    embedded: state.embedded,
    defaultSoundfont: state.defaultSoundfont
});

const mapDispatchToProps = {
    changeEmbedded,
    setDefaultSoundfont
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
