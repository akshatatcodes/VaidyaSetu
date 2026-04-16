import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import i18n from './i18n'
import { ClerkProvider } from '@clerk/clerk-react'
import axios from 'axios'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

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
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/onboarding"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
