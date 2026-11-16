import { initializeTheme } from './lib/theme';
import { useUIStore } from './stores/uiStore';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

initializeTheme(useUIStore);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
