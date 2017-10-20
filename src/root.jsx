import R from 'react';
import RD from 'react-dom';

// Needed for React initialization
window.React = R;
window.ReactDOM = RD;

import App from './components/App';
// import conf from '../conf';

ReactDOM.render(
  <App />,
  document.getElementById('global-intern'),
);
