import { useEffect, useRef, useState } from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';

// El Client ID es publico (no secreto) y se lee de las variables de entorno.
// El Client Secret NUNCA debe estar en el frontend.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleButton({ alExito, cargando = false, texto = 'Continuar con Google' }) {
  const contenedorRef = useRef(null);
  // Estado inicial perezoso: evita llamar setState de forma sincrona dentro del efecto.
  const [scriptCargado, setScriptCargado] = useState(() => Boolean(window.google?.accounts?.id));

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // sin client id no se inicializa GIS
    if (window.google?.accounts?.id) return; // ya disponible (estado inicial ya es true)

    // Cargar el script de Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptCargado(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (scriptCargado && GOOGLE_CLIENT_ID && window.google?.accounts?.id && contenedorRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (respuesta) => {
            if (respuesta.credential && alExito) {
              alExito(respuesta.credential);
            }
          },
        });

        contenedorRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(contenedorRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          locale: 'es',
        });
      } catch (err) {
        console.warn('[google-button] Error inicializando GIS:', err);
      }
    }
  }, [scriptCargado, alExito]);

  // Sin client id configurado: se muestra un boton informativo deshabilitado.
  if (!GOOGLE_CLIENT_ID) {
    return (
      <Box w="100%" my={3}>
        <Button
          w="100%"
          variant="outline"
          borderColor="secondary.300"
          bg="white"
          leftIcon={<FcGoogle size={20} />}
          isDisabled
        >
          {texto}
        </Button>
        <Text fontSize="xs" color="secondary.500" mt={1} textAlign="center">
          Configura VITE_GOOGLE_CLIENT_ID para habilitar el acceso con Google.
        </Text>
      </Box>
    );
  }

  return (
    <Box w="100%" my={3}>
      <Box ref={contenedorRef} display={scriptCargado ? 'block' : 'none'} w="100%" />

      {!scriptCargado && (
        <Button
          w="100%"
          variant="outline"
          borderColor="secondary.300"
          bg="white"
          _hover={{ bg: 'secondary.50' }}
          leftIcon={<FcGoogle size={20} />}
          isLoading={cargando}
          isDisabled
        >
          {texto}
        </Button>
      )}
    </Box>
  );
}

export default GoogleButton;
