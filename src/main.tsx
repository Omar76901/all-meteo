import 'leaflet/dist/leaflet.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './state/theme.tsx'
import { UnitsProvider } from './state/units.tsx'

// GitHub Pages non permette l'header frame-ancestors (e nel <meta> CSP viene ignorato):
// dentro un iframe di un altro sito l'app non parte, contro il clickjacking
// (es. il pulsante 📍 che chiede la posizione cliccato con l'inganno)
const framed = (() => {
  try {
    return window.top !== window.self;
  } catch {
    return true; // accesso a window.top negato: siamo in un frame di un'altra origine
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {framed ? (
      // indirizzo fisso dell'app, non l'URL corrente: chi incornicia la pagina ne controlla i parametri
      <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener noreferrer" className="block p-8 text-center text-sky-400">
        Apri allMeteo in una nuova scheda
      </a>
    ) : (
      <ThemeProvider>
        <UnitsProvider>
          <App />
        </UnitsProvider>
      </ThemeProvider>
    )}
  </StrictMode>,
)
