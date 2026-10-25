import 'leaflet/dist/leaflet.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './state/theme.tsx'
import { UnitsProvider } from './state/units.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <UnitsProvider>
        <App />
      </UnitsProvider>
    </ThemeProvider>
  </StrictMode>,
)
