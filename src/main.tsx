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

const root = document.getElementById('root')!;
if (framed) {
  const link = document.createElement('a');
  // indirizzo fisso dell'app, non l'URL corrente: chi incornicia la pagina controlla i parametri
  link.href = import.meta.env.BASE_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Apri allMeteo in una nuova scheda';
  link.style.cssText = 'color:#38bdf8;font-family:system-ui;display:block;padding:2rem;text-align:center';
  root.replaceChildren(link);
} else {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <UnitsProvider>
          <App />
        </UnitsProvider>
      </ThemeProvider>
    </StrictMode>,
  )
}
