import { useEffect, useRef, useState } from 'react';
import { Box, Button, Icon, Text, Flex, Spinner } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';

const GOOGLE_CLIENT_ID = '1005936377796-4h6ivu6448a99u69bkup7vmkq695dojc.apps.googleusercontent.com';

function GoogleButton({ alExito, cargando = false, texto = 'Continuar con Google' }) {
  const contenedorRef = useRef(null);
  const [scriptCargado, setScriptCargado] = useState(false);

  useEffect(() => {
    // Si la API de Google ya existe en window
    if (window.google?.accounts?.id) {
      setScriptCargado(true);
      return;
    }

    // Cargar script de Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptCargado(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (scriptCargado && window.google?.accounts?.id && contenedorRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (respuesta) => {
            if (respuesta.credential && alExito) {
              alExito(respuesta.credential);
            }
          },
        });

        // Renderizar boton oficial de Google
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
