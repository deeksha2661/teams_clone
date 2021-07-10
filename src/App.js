import './App.css';
import React from 'react';
import MakeCall from './MakeCall/MakeCall'
import { initializeIcons } from '@uifabric/icons';

initializeIcons();


function App() {
  return (
    <div className="App">
      <div className="header ms-Grid">
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-lg6">
            <h2>
              Microsoft Teams Clone
            </h2>
          </div>

        </div>
      </div>
      <MakeCall />
    </div>
  );
}

export default App;
