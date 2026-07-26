import { useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Select,
  SimpleGrid,
  Text,
  Textarea,
} from '@chakra-ui/react';
import Input from '../input/index.jsx';
import Button from '../button/index.jsx';

// Formulario compartido por "Nuevo producto" y "Editar producto".

const FORMULARIO_INICIAL = {
  nombre: '',
  descripcion: '',
  categoria: '',
  marca: '',
  compatibilidad: '',
  precio: '',
  stock: '',
  imagen_url: '',
  estado: 'activo',
};

/**
 * Construye el estado inicial. Al editar, la pagina espera a tener el producto
 * cargado antes de montar este formulario, por eso basta con inicializarlo aqui.
 */
function construirEstadoInicial(valoresIniciales) {
  if (!valoresIniciales) return FORMULARIO_INICIAL;

  return {
    nombre: valoresIniciales.nombre || '',
    descripcion: valoresIniciales.descripcion || '',
    categoria: valoresIniciales.categoria || '',
    marca: valoresIniciales.marca || '',
    compatibilidad: valoresIniciales.compatibilidad || '',
    precio: valoresIniciales.precio ?? '',
    stock: valoresIniciales.stock ?? '',
    imagen_url: valoresIniciales.imagen_url || '',
    estado: valoresIniciales.estado || 'activo',
  };
}

/**
 * Valida los campos del producto. Devuelve un objeto de errores por campo.
 */
function validarProducto(formulario) {
  const errores = {};

  if (!formulario.nombre.trim()) {
    errores.nombre = 'El nombre del producto es obligatorio.';
  }

  if (!formulario.categoria) {
    errores.categoria = 'Selecciona una categoria.';
  }

  const precio = Number(formulario.precio);
  if (formulario.precio === '' || Number.isNaN(precio)) {
    errores.precio = 'El precio es obligatorio.';
  } else if (precio <= 0) {
    errores.precio = 'El precio debe ser mayor que cero.';
  }

  const stock = Number(formulario.stock);
  if (formulario.stock === '' || Number.isNaN(stock)) {
    errores.stock = 'El stock es obligatorio.';
  } else if (!Number.isInteger(stock) || stock < 0) {
    errores.stock = 'El stock debe ser un numero entero mayor o igual que cero.';
  }

  return errores;
}

function ProductoForm({
  valoresIniciales = null,
  categorias = [],
  alGuardar,
  guardando = false,
  errorGeneral = '',
  textoBoton = 'Guardar producto',
  alCancelar,
}) {
  const [formulario, setFormulario] = useState(() => construirEstadoInicial(valoresIniciales));
  const [errores, setErrores] = useState({});

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
    setErrores((anteriores) => ({ ...anteriores, [name]: '' }));
  };

  const manejarEnvio = (evento) => {
    evento.preventDefault();

    const erroresEncontrados = validarProducto(formulario);
    setErrores(erroresEncontrados);

    if (Object.keys(erroresEncontrados).length > 0) return;

    alGuardar({
      ...formulario,
      nombre: formulario.nombre.trim(),
      precio: Number(formulario.precio),
      stock: Number(formulario.stock),
    });
  };

  return (
    <Box
      as="form"
      onSubmit={manejarEnvio}
      noValidate
      bg="white"
      p={{ base: 5, md: 6 }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="secondary.200"
      boxShadow="sm"
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={8}>
        <Box>
          <Input
            label="Nombre del repuesto"
            name="nombre"
            value={formulario.nombre}
            onChange={manejarCambio}
            placeholder="Pastillas de freno delanteras"
            error={errores.nombre}
            required
          />

          <FormControl mb={4} isRequired isInvalid={Boolean(errores.categoria)}>
            <FormLabel htmlFor="categoria">Categoria</FormLabel>
            <Select
              id="categoria"
              name="categoria"
              value={formulario.categoria}
              onChange={manejarCambio}
              placeholder="Selecciona una categoria"
              bg="white"
              focusBorderColor="brand.500"
            >
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </Select>
            {errores.categoria && <FormErrorMessage>{errores.categoria}</FormErrorMessage>}
          </FormControl>

          <Input
            label="Marca"
            name="marca"
            value={formulario.marca}
            onChange={manejarCambio}
            placeholder="Bosch"
          />

          <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={4}>
            <Input
              label="Precio (USD)"
              type="number"
              name="precio"
              value={formulario.precio}
              onChange={manejarCambio}
              placeholder="24.90"
              error={errores.precio}
              required
            />
            <Input
              label="Stock"
              type="number"
              name="stock"
              value={formulario.stock}
              onChange={manejarCambio}
              placeholder="10"
              error={errores.stock}
              required
            />
          </SimpleGrid>
        </Box>

        <Box>
          <FormControl mb={4}>
            <FormLabel htmlFor="descripcion">Descripcion</FormLabel>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formulario.descripcion}
              onChange={manejarCambio}
              placeholder="Detalles del repuesto, material, garantia..."
              bg="white"
              focusBorderColor="brand.500"
              rows={3}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel htmlFor="compatibilidad">Compatibilidad</FormLabel>
            <Textarea
              id="compatibilidad"
              name="compatibilidad"
              value={formulario.compatibilidad}
              onChange={manejarCambio}
              placeholder="Chevrolet Aveo 2010-2018, Kia Rio 2012-2016"
              bg="white"
              focusBorderColor="brand.500"
              rows={2}
            />
          </FormControl>

          <Input
            label="URL de la imagen"
            name="imagen_url"
            value={formulario.imagen_url}
            onChange={manejarCambio}
            placeholder="https://..."
          />

          <FormControl mb={4}>
            <FormLabel htmlFor="estado">Estado</FormLabel>
            <Select
              id="estado"
              name="estado"
              value={formulario.estado}
              onChange={manejarCambio}
              bg="white"
              focusBorderColor="brand.500"
            >
              <option value="activo">Activo (visible en el catalogo)</option>
              <option value="inactivo">Inactivo (oculto para los clientes)</option>
            </Select>
          </FormControl>

          {formulario.imagen_url && (
            <Box mb={4}>
              <Text fontSize="xs" color="secondary.500" mb={2}>
                Vista previa
              </Text>
              <Image
                src={formulario.imagen_url}
                alt="Vista previa del producto"
                borderRadius="md"
                maxH="140px"
                objectFit="cover"
                fallback={
                  <Box bg="secondary.100" borderRadius="md" p={4}>
                    <Text fontSize="xs" color="secondary.500">
                      No se pudo cargar la imagen.
                    </Text>
                  </Box>
                }
              />
            </Box>
          )}
        </Box>
      </SimpleGrid>

      {errorGeneral && (
        <Alert status="error" borderRadius="md" mt={2} mb={4} fontSize="sm">
          <AlertIcon />
          {errorGeneral}
        </Alert>
      )}

      <Flex gap={3} mt={4} direction={{ base: 'column', sm: 'row' }}>
        <Button type="submit" variant="primary" isLoading={guardando} flex="1">
          {textoBoton}
        </Button>
        {alCancelar && (
          <Button type="button" variant="secondary" onClick={alCancelar} flex="1">
            Cancelar
          </Button>
        )}
      </Flex>
    </Box>
  );
}

export default ProductoForm;
