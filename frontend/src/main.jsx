import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import App from './App.jsx';
import theme from './theme/theme.js';
import { inicializarSincronizador, procesarColaOperaciones } from './services/sync-service.js';
import './index.css';

// Inicializar listener de sincronizacion automatica al recuperar internet
inicializarSincronizador();
if (navigator.onLine) {
  procesarColaOperaciones();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);

