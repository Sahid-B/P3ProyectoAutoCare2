import { Link as RouterLink } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  IconButton,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Text,
} from '@chakra-ui/react';
import { FaGear, FaStore, FaCartShopping, FaPenToSquare, FaTrash } from 'react-icons/fa6';
import { moneda } from '../../utils/formato.js';

/**
 * Tarjeta de producto del catalogo de repuestos.
 * Muestra imagen, categoria, precio, stock y la tienda que lo vende.
 */
function ProductoCard({ producto, alAgregar, alEditar, alEliminar, agregando = false }) {
  const stock = Number(producto.stock);
  const sinStock = stock <= 0;

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="secondary.200"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="sm"
      display="flex"
      flexDirection="column"
      transition="box-shadow 0.2s ease, border-color 0.2s ease"
      _hover={{ boxShadow: 'md', borderColor: 'brand.300' }}
    >
      <Box position="relative">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            w="100%"
            h="180px"
            objectFit="cover"
          />
        ) : (
          <Flex h="180px" bg="secondary.100" align="center" justify="center" color="secondary.400">
            <Icon as={FaGear} boxSize={12} />
          </Flex>
        )}

        <Badge
          position="absolute"
          top={3}
          left={3}
          colorScheme="brand"
          borderRadius="full"
          px={3}
          py={1}
          fontSize="xs"
        >
          {producto.categoria}
        </Badge>

        {(alEditar || alEliminar) && (
          <HStack position="absolute" top={3} right={3} spacing={2} bg="rgba(255,255,255,0.9)" p={1} borderRadius="md" boxShadow="sm">
            {alEditar && (
              <IconButton
                aria-label="Editar repuesto"
                icon={<FaPenToSquare />}
                size="xs"
                colorScheme="blue"
                onClick={() => alEditar(producto)}
              />
            )}
            {alEliminar && (
              <IconButton
                aria-label="Eliminar repuesto"
                icon={<FaTrash />}
                size="xs"
                colorScheme="red"
                onClick={() => alEliminar(producto.id)}
              />
            )}
          </HStack>
        )}
      </Box>

      <Box p={5} display="flex" flexDirection="column" flex="1">
        <Heading as="h3" size="sm" color="secondary.900" mb={1} noOfLines={2}>
          {producto.nombre}
        </Heading>

        {producto.marca && (
          <Text fontSize="xs" color="secondary.500" mb={2}>
            Marca: {producto.marca}
          </Text>
        )}

        {producto.descripcion && (
          <Text fontSize="sm" color="secondary.600" mb={3} noOfLines={2}>
            {producto.descripcion}
          </Text>
        )}

        <HStack spacing={2} mb={3} color="secondary.500" fontSize="xs">
          <Icon as={FaStore} />
          <Text noOfLines={1}>{producto.nombre_local}</Text>
        </HStack>

        <Flex justify="space-between" align="center" mt="auto" mb={4}>
          <Text fontSize="xl" fontWeight="bold" color="brand.700">
            {moneda(producto.precio)}
          </Text>
          <Badge colorScheme={sinStock ? 'red' : stock <= 5 ? 'orange' : 'green'} borderRadius="md" px={2}>
            {sinStock ? 'Sin stock' : `${stock} disponibles`}
          </Badge>
        </Flex>

        <Flex gap={2}>
          <Button
            as={RouterLink}
            to={`/repuestos/${producto.id}`}
            size="sm"
            variant="outline"
            flex="1"
          >
            Ver detalle
          </Button>
          {alAgregar && (
            <Button
              size="sm"
              variant="primary"
              flex="1"
              leftIcon={<FaCartShopping />}
              isDisabled={sinStock}
              isLoading={agregando}
              onClick={() => alAgregar(producto)}
            >
              Agregar
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
}

export default ProductoCard;
