import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installNetworkMonitor } from './lib/networkMonitor'

// Must run before any other code makes a request — catches the login
// call and everything after it. Safe to call once; no-ops if called again.
installNetworkMonitor()

// Self-hosted fonts (replaces the old Google Fonts @import in index.css).
// These ship as local .woff2 files bundled by Vite — zero runtime network
// calls, on first load or ever after. Weights match what index.css uses.
import '@fontsource/plus-jakarta-sans/300.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
 
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)