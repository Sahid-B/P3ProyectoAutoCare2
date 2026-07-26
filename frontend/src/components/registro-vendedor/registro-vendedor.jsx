import { useState, useCallback } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { FaStore, FaUser } from 'react-icons/fa6';
import Input from '../input/index.jsx';
import Button from '../button/index.jsx';
import MapaSelector from '../mapa-selector/index.jsx';

// Formulario propio del rol "Vendo Repuestos". Es independiente del formulario
// de taller: tiene su propio estado, sus propias validaciones y sus propios campos.

const FORMULARIO_INICIAL = {
  nombre: '',
  apellido: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
  nombre_local: '',
  direccion: '',
  telefono: '',
  horario: '',
  descripcion: '',
  latitud: null,
  longitud: null,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\-\s()]{7,20}$/;

/**
 * Valida el formulario completo. Devuelve un objeto de errores por campo.
 */
function validarFormulario(formulario) {
  const errores = {};

  if (!formulario.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
  if (!formulario.apellido.trim()) errores.apellido = 'El apellido es obligatorio.';

  if (!formulario.correo.trim()) {
    errores.correo = 'El correo es obligatorio.';
  } else if (!EMAIL_REGEX.test(formulario.correo.trim())) {
    errores.correo = 'Ingresa un correo electronico valido.';
  }

  if (!formulario.contrasena) {
    errores.contrasena = 'La contrasena es obligatoria.';
  } else if (formulario.contrasena.length < 6) {
    errores.contrasena = 'Debe tener al menos 6 caracteres.';
  }

  if (!formulario.confirmarContrasena) {
    errores.confirmarContrasena = 'Confirma tu contrasena.';
  } else if (formulario.contrasena !== formulario.confirmarContrasena) {
    errores.confirmarContrasena = 'Las contrasenas no coinciden.';
  }

  if (!formulario.nombre_local.trim()) {
    errores.nombre_local = 'El nombre del local es obligatorio.';
  }

  if (!formulario.direccion.trim()) {
    errores.direccion = 'La direccion del local es obligatoria.';
  }

  if (!formulario.telefono.trim()) {
    errores.telefono = 'El telefono de contacto es obligatorio.';
  } else if (!TELEFONO_REGEX.test(formulario.telefono.trim())) {
    errores.telefono = 'Ingresa un telefono valido.';
  }

  return errores;
}

function RegistroVendedor({ alRegistrar, cargando = false, errorGeneral = '' }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [errorUbicacion, setErrorUbicacion] = useState('');

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
    setErrores((anteriores) => ({ ...anteriores, [name]: '' }));
  };

  const manejarUbicacion = useCallback((latitud, longitud) => {
    setFormulario((anterior) => ({ ...anterior, latitud, longitud }));
    setErrorUbicacion('');
  }, []);

  const manejarEnvio = (evento) => {
    evento.preventDefault();

    const erroresEncontrados = validarFormulario(formulario);
    setErrores(erroresEncontrados);

    if (formulario.latitud === null || formulario.longitud === null) {
      setErrorUbicacion('Debes seleccionar la ubicacion de tu tienda en el mapa.');
      return;
    }

    if (Object.keys(erroresEncontrados).length > 0) {
      return;
    }

    alRegistrar({
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      correo: formulario.correo.trim(),
      contrasena: formulario.contrasena,
      rol: 'vendedor_repuestos',
      tienda_datos: {
        nombre_local: formulario.nombre_local.trim(),
        direccion: formulario.direccion.trim(),
        telefono: formulario.telefono.trim(),
        horario: formulario.horario.trim(),
        descripcion: formulario.descripcion.trim(),
        latitud: formulario.latitud,
        longitud: formulario.longitud,
      },
    });
  };

  return (
    <Box as="form" onSubmit={manejarEnvio} textAlign="left" noValidate>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={8}>
        {/* Datos de la persona responsable de la tienda */}
        <Box>
          <HStack spacing={2} mb={4} color="secondary.700">
            <Icon as={FaUser} />
            <Text fontWeight="bold">Datos del responsable</Text>
          </HStack>

          <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={4}>
            <Input
              label="Nombre"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Maria"
              error={errores.nombre}
              required
            />
            <Input
              label="Apellido"
              name="apellido"
              value={formulario.apellido}
              onChange={manejarCambio}
              placeholder="Suarez"
              error={errores.apellido}
              required
            />
          </SimpleGrid>

          <Input
            label="Correo electronico"
            type="email"
            name="correo"
            value={formulario.correo}
            onChange={manejarCambio}
            placeholder="tienda@correo.com"
            error={errores.correo}
            required
          />

          <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={4}>
            <Input
              label="Contrasena"
              type="password"
              name="contrasena"
              value={formulario.contrasena}
              onChange={manejarCambio}
              placeholder="Minimo 6 caracteres"
              error={errores.contrasena}
              required
            />
            <Input
              label="Confirmar contrasena"
              type="password"
              name="confirmarContrasena"
              value={formulario.confirmarContrasena}
              onChange={manejarCambio}
              placeholder="Repite la contrasena"
              error={errores.confirmarContrasena}
              required
            />
          </SimpleGrid>

          <Divider my={4} display={{ base: 'block', md: 'none' }} />
        </Box>

        {/* Datos del local de repuestos */}
        <Box>
          <HStack spacing={2} mb={4} color="secondary.700">
            <Icon as={FaStore} />
            <Text fontWeight="bold">Datos de la tienda</Text>
          </HStack>

          <Input
            label="Nombre del local"
            name="nombre_local"
            value={formulario.nombre_local}
            onChange={manejarCambio}
            placeholder="Repuestos El Motor"
            error={errores.nombre_local}
            required
          />

          <Input
            label="Direccion"
            name="direccion"
            value={formulario.direccion}
            onChange={manejarCambio}
            placeholder="Av. Quito 456 y Colon"
            error={errores.direccion}
            required
          />

          <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={4}>
            <Input
              label="Telefono"
              name="telefono"
              value={formulario.telefono}
              onChange={manejarCambio}
              placeholder="0991234567"
              error={errores.telefono}
              required
            />
            <Input
              label="Horario"
              name="horario"
              value={formulario.horario}
              onChange={manejarCambio}
              placeholder="Lun-Vie 08:00-18:00"
            />
          </SimpleGrid>

          <FormControl mb={4}>
            <FormLabel htmlFor="descripcion">Descripcion</FormLabel>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formulario.descripcion}
              onChange={manejarCambio}
              placeholder="Cuentales a tus clientes que tipo de repuestos vendes."
              bg="white"
              focusBorderColor="brand.500"
              rows={3}
            />
          </FormControl>
        </Box>
      </SimpleGrid>

      <Box mt={2}>
        <Text fontSize="sm" fontWeight="semibold" mb={2} color="secondary.700">
          Ubicacion de la tienda en el mapa
        </Text>
        <MapaSelector
          latitud={formulario.latitud}
          longitud={formulario.longitud}
          alCambiar={manejarUbicacion}
          altura="260px"
          ayuda="Haz clic en el mapa para marcar donde esta tu local. Los clientes lo veran con un marcador rojo."
        />
        {errorUbicacion && (
          <Alert status="error" borderRadius="md" mt={3} fontSize="sm">
            <AlertIcon />
            {errorUbicacion}
          </Alert>
        )}
      </Box>

      {errorGeneral && (
        <Alert status="error" borderRadius="md" mt={4} fontSize="sm">
          <AlertIcon />
          {errorGeneral}
        </Alert>
      )}

      <Button type="submit" variant="primary" width="100%" mt={6} isLoading={cargando}>
        Registrarme como Vendedor de Repuestos
      </Button>
    </Box>
  );
}

export default RegistroVendedor;
