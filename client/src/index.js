import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { addLocaleData, IntlProvider } from 'react-intl';
import SelectInstrument from './SelectInstrument';
import Guitar from './Guitar';
import Midi from './Midi';
import Drums from './Drums';
import Credits from './Credits';
import NoMatch from './NoMatch';
import registerServiceWorker from './registerServiceWorker';
import en from 'react-intl/locale-data/en';
import pt from 'react-intl/locale-data/pt';
import { flattenMessages } from './utils';
import messages from './messages';
import './styles/css/index.css';

addLocaleData([...en, ...pt]);
let params = new URLSearchParams(document.location.search.substring(1));
let locale =
  params.get("lang")
  || navigator.language.split(/[-_]/)[0] // language without region code
  || 'en';

ReactDOM.render(
  <IntlProvider locale={locale} messages={flattenMessages(messages[locale])}>
    <BrowserRouter>
      <Switch>
        <Route path="/" exact={true} component={SelectInstrument} />
        <Route path="/guitar" component={Guitar} />
        <Route path="/midi" component={Midi} />
        <Route path="/drums" component={Drums} />
        <Route path="/credits" component={Credits} />
        <Route component={NoMatch} />
      </Switch>
    </ BrowserRouter>
  </IntlProvider>
  , document.getElementById('internal'));
registerServiceWorker();
