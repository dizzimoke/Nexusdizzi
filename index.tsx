import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('[System] Initializing Nexus Pro OS...');

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('[System] Root target missing from DOM.');
}