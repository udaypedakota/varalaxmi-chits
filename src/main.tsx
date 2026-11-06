import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

// Register Service Worker for Mobile Web Push Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[SW] Sri Varalaxmi Chits Service Worker registered:', reg.scope);
    }).catch(err => {
      console.log('[SW] Service Worker registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

