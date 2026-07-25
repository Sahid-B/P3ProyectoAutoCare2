import { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Badge,
  Heading,
  Text,
  Image,
  Icon,
  Button,
  Divider,
} from '@chakra-ui/react';
import { FaCar, FaEye, FaPen, FaTrash } from 'react-icons/fa6';
import { etiquetaTipo } from '../../constants/vehicle-types.js';

/** Formatea una fecha ISO a formato local corto. */
function formatearFecha(iso) {
  if (!iso) return '-';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '-' : fecha.toLocaleDateString('es-EC');
}

/** Imagen del vehiculo con respaldo a un icono si no hay URL o si falla la carga. */
function ImagenVehiculo({ url, alt }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <Flex align="center" justify="center" h="160px" bg="brand.50">
        <Icon as={FaCar} boxSize={12} color="brand.300" />
      </Flex>
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      h="160px"
      w="100%"
      objectFit="cover"
      onError={() => setError(true)}
    />
  );
}

/**
 * Tarjeta de un vehiculo. Muestra imagen, datos principales y acciones de forma limpia.
 */
function VehicleCard({ vehiculo, onVer, onEditar, onEliminar }) {
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="secondary.200"
      borderRadius="lg"
      boxShadow="sm"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      display="flex"
      flexDirection="column"
    >
      <ImagenVehiculo url={vehiculo.imagen_url} alt={`${vehiculo.marca} ${vehiculo.modelo}`} />

      <Box p={5} flex="1" display="flex" flexDirection="column">
        <HStack justify="space-between" align="start" mb={2}>
          <Heading as="h3" size="md" noOfLines={1}>
            {vehiculo.marca} {vehiculo.modelo}
          </Heading>
          <Badge colorScheme="brand">{vehiculo.anio}</Badge>
        </HStack>

        <HStack spacing={2} mb={3} flexWrap="wrap">
          <Badge colorScheme="secondary" variant="subtle">
            {etiquetaTipo(vehiculo.tipo_vehiculo)}
          </Badge>
          <Badge colorScheme="secondary" variant="outline">
            {vehiculo.placa}
          </Badge>
        </HStack>

        <Text fontSize="sm" color="secondary.600">
          Kilometraje: <strong>{Number(vehiculo.kilometraje_actual).toLocaleString('es-EC')} km</strong>
        </Text>
        <Text fontSize="xs" color="secondary.500" mb={4}>
          Registrado el {formatearFecha(vehiculo.created_at)}
        </Text>

        <Divider mb={3} mt="auto" />

        <HStack spacing={1} justify="space-between">
          <Button
            size="sm"
            variant="ghost"
            colorScheme="brand"
            leftIcon={<Icon as={FaEye} />}
            onClick={() => onVer?.(vehiculo)}
            flex="1"
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            leftIcon={<Icon as={FaPen} />}
            onClick={() => onEditar?.(vehiculo)}
            flex="1"
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="red"
            leftIcon={<Icon as={FaTrash} />}
            onClick={() => onEliminar?.(vehiculo)}
            flex="1"
          >
            Eliminar
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}

export default VehicleCard;
