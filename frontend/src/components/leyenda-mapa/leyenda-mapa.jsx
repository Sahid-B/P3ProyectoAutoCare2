import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { COLOR_TALLER, COLOR_TIENDA } from '../../utils/mapa-iconos.js';

const ENTRADAS = [
  { color: COLOR_TALLER, texto: 'Taller mecanico' },
  { color: COLOR_TIENDA, texto: 'Tienda de repuestos' },
];

/**
 * Leyenda del mapa. Se superpone sobre el mapa para explicar el color de cada
 * marcador. El zIndex queda por encima de las capas de Leaflet.
 */
function LeyendaMapa({ posicion = 'absolute' }) {
  return (
    <Box
      position={posicion}
      bottom={4}
      left={4}
      zIndex={1000}
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      borderColor="secondary.200"
      boxShadow="md"
      px={3}
      py={2}
    >
      <Text fontSize="xs" fontWeight="bold" color="secondary.700" mb={1.5}>
        Leyenda
      </Text>
      <VStack align="flex-start" spacing={1}>
        {ENTRADAS.map((entrada) => (
          <HStack key={entrada.texto} spacing={2}>
            <Box w="12px" h="12px" borderRadius="full" bg={entrada.color} flexShrink={0} />
            <Text fontSize="xs" color="secondary.600">
              {entrada.texto}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

export default LeyendaMapa;
