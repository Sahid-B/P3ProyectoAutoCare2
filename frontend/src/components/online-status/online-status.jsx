import { useEffect, useState } from 'react';
import { Box, Container, HStack, Icon, Text } from '@chakra-ui/react';
import { FaTriangleExclamation } from 'react-icons/fa6';

/**
 * Detecta el estado de conexion del navegador y muestra un aviso discreto
 * cuando no hay Internet. Cuando hay conexion no renderiza nada.
 *
 * Usa navigator.onLine y los eventos online/offline, y limpia los listeners
 * al desmontar el componente.
 */
function OnlineStatus() {
  const [enLinea, setEnLinea] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const alConectar = () => setEnLinea(true);
    const alDesconectar = () => setEnLinea(false);

    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);

    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, []);

  if (enLinea) {
    return null;
  }

  return (
    <Box bg="warning.100" borderBottomWidth="1px" borderColor="warning.300" py={2}>
      <Container maxW="1140px">
        <HStack spacing={2} color="warning.800" fontSize="sm">
          <Icon as={FaTriangleExclamation} />
          <Text>
            Sin conexion a Internet. Se muestran los datos guardados en este dispositivo.
          </Text>
        </HStack>
      </Container>
    </Box>
  );
}

export default OnlineStatus;
