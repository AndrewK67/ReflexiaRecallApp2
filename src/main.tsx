import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { captureInstallPrompt } from './services/durabilityService'

// ✅ Make sure CSS is imported here (and nowhere else)
import './index.css'

// Chromium fires beforeinstallprompt early; hold it so Profile can offer Install.
captureInstallPrompt()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
