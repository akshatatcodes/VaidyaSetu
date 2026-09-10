import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import i18n from './i18n'
import axios from 'axios'

axios.interceptors.request.use((config) => {
  const language = (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0];
  config.headers = {
    ...config.headers,
    'x-user-language': language
  };

  if (config.data && typeof config.data === 'object' && !Array.isArray(config.data) && !config.data.language) {
    config.data.language = language;
  }

  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
