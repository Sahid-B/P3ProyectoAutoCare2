import { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Wrap,
  WrapItem,
  SimpleGrid,
  Heading,
  Text,
  Badge,
  Image,
  Icon,
  Button,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FaCar,
  FaPen,
  FaTrash,
  FaGaugeHigh,
  FaArrowLeft,
} from 'react-icons/fa6';
import { etiquetaTipo } from '../../constants/vehicle-types.js';

function formatearFecha(iso) {
  if (!iso) return '-';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '-' : fecha.toLocaleString('es-EC');
}

/** Muestra un dato con etiqueta y valor. */
function Dato({ etiqueta, valor }) {
  return (
    <Box>
      <Text fontSize="xs" color="secondary.500" textTransform="uppercase" letterSpacing="0.04em">
        {etiqueta}
      </Text>
      <Text fontWeight="medium" color="secondary.800">
        {valor || '-'}
      </Text>
    </Box>
  );
}

/** Imagen del vehiculo con respaldo a un icono. */
function ImagenDetalle({ url, alt }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <Flex align="center" justify="center" h="220px" bg="brand.50" borderRadius="lg">
        <Icon as={FaCar} boxSize={16} color="brand.300" />
      </Flex>
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      h="220px"
      w="100%"
      objectFit="cover"
      borderRadius="lg"
      onError={() => setError(true)}
    />
  );
}

/**
 * Vista de detalle de un vehiculo con sus datos y acciones.
 */
function VehicleDetail({ vehiculo, onEditar, onActualizarKm, onEliminar, onVolver }) {
  if (!vehiculo) return null;

  return (
    <Box>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon as={FaArrowLeft} />}
        onClick={onVolver}
        mb={4}
      >
        Volver
      </Button>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ImagenDetalle url={vehiculo.imagen_url} alt={`${vehiculo.marca} ${vehiculo.modelo}`} />

        <Box>
          <Heading as="h1" size="lg" mb={1}>
            {vehiculo.marca} {vehiculo.modelo}
          </Heading>
          <Wrap spacing={2} mb={4}>
            <WrapItem>
              <Badge colorScheme="brand">{vehiculo.anio}</Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="secondary" variant="subtle">
                {etiquetaTipo(vehiculo.tipo_vehiculo)}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="secondary" variant="outline">
                {vehiculo.placa}
              </Badge>
            </WrapItem>
          </Wrap>

          <SimpleGrid columns={2} spacingY={4} spacingX={4}>
            <Dato etiqueta="Placa" valor={vehiculo.placa} />
            <Dato etiqueta="Anio" valor={vehiculo.anio} />
            <Dato etiqueta="Color" valor={vehiculo.color} />
            <Dato etiqueta="Tipo" valor={etiquetaTipo(vehiculo.tipo_vehiculo)} />
            <Dato
              etiqueta="Kilometraje"
              valor={`${Number(vehiculo.kilometraje_actual).toLocaleString('es-EC')} km`}
            />
          </SimpleGrid>
        </Box>
      </SimpleGrid>

      {vehiculo.observaciones && (
        <Box mt={6}>
          <Text fontSize="xs" color="secondary.500" textTransform="uppercase" letterSpacing="0.04em">
            Observaciones
          </Text>
          <Text color="secondary.700">{vehiculo.observaciones}</Text>
        </Box>
      )}

      <Divider my={6} />

      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
        <Dato etiqueta="Fecha de creacion" valor={formatearFecha(vehiculo.created_at)} />
        <Dato etiqueta="Ultima actualizacion" valor={formatearFecha(vehiculo.updated_at)} />
      </SimpleGrid>

      <HStack spacing={3} flexWrap="wrap">
        <Button variant="primary" leftIcon={<Icon as={FaPen} />} onClick={onEditar}>
          Editar
        </Button>
        <Button variant="outline" leftIcon={<Icon as={FaGaugeHigh} />} onClick={onActualizarKm}>
          Actualizar kilometraje
        </Button>
        <Button
          variant="ghost"
          colorScheme="error"
          leftIcon={<Icon as={FaTrash} />}
          onClick={onEliminar}
        >
          Eliminar
        </Button>
      </HStack>

      <Divider my={6} />

      {/* Seccion informativa: los mantenimientos llegan en la Parte 4 */}
      <Box>
        <Heading as="h2" size="md" mb={2}>
          Mantenimientos
        </Heading>
        <Alert status="info" borderRadius="md" fontSize="sm">
          <AlertIcon />
          Los mantenimientos de este vehiculo se implementaran en la Parte 4.
        </Alert>
      </Box>
    </Box>
  );
}

export default VehicleDetail;
