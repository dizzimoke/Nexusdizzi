
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('[System] Booting Nexus Pro...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("FATAL: Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[System] Mount Successful');
} catch (e) {
  console.error('[System] Boot Failed:', e);
  document.body.innerHTML = `<div style="color:red; padding: 20px; font-family: monospace;">SYSTEM FAILURE: ${e.message}</div>`;
}
