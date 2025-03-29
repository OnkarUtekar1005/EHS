// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  // Debug message if the root element is missing
  console.error('Root element not found! Check your public/index.html file');
  
  // Create a fallback element for debugging
  const fallbackElement = document.createElement('div');
  fallbackElement.id = 'debug-root';
  fallbackElement.innerHTML = '<h1 style="color:red;padding:20px;">Error: Root element not found!</h1>';
  document.body.appendChild(fallbackElement);
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}