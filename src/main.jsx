import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initObservability } from './lib/observability.js';
import './index.css';

initObservability();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary name="root">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
