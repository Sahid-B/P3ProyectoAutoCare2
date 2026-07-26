import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';
import MapaSelector from '../../components/mapa-selector/index.jsx';
import { obtenerMiTienda, guardarMiTienda } from '../../services/repuestos-service.js';

const FORMULARIO_INICIAL = {
  nombre_local: '',
  descripcion: '',
  direccion: '',
  telefono: '',
  horario: '',
  latitud: null,
  longitud: null,
};

function MiTienda() {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [esNueva, setEsNueva] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let activo = true;

    async function cargarTienda() {
      try {
        const respuesta = await obtenerMiTienda();
        if (!activo || !respuesta?.tienda) return;

        const { tienda } = respuesta;
        setFormulario({
          nombre_local: tienda.nombre_local || '',
          descripcion: tienda.descripcion || '',
          direccion: tienda.direccion || '',
          telefono: tienda.telefono || '',
          horario: tienda.horario || '',
          latitud: tienda.latitud !== null ? Number(tienda.latitud) : null,
          longitud: tienda.longitud !== null ? Number(tienda.longitud) : null,
        });
      } catch (error) {
        // Un 404 solo significa que el vendedor todavia no registro su tienda.
        if (activo && /no has registrado/i.test(error.message)) {
          setEsNueva(true);
        } else if (activo) {
          setErrorMsg(error.message || 'No se pudo cargar la informacion de la tienda.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarTienda();
    return () => {
      activo = false;
    };
  }, []);

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
    setErrores((anteriores) => ({ ...anteriores, [name]: '' }));
    setErrorMsg('');
  };

  const manejarUbicacion = useCallback((latitud, longitud) => {
    setFormulario((anterior) => ({ ...anterior, latitud, longitud }));
  }, []);

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setErrorMsg('');

    const erroresEncontrados = {};
    if (!formulario.nombre_local.trim()) {
      erroresEncontrados.nombre_local = 'El nombre del local es obligatorio.';
    }
    if (!formulario.direccion.trim()) {
      erroresEncontrados.direccion = 'La direccion es obligatoria.';
    }

    setErrores(erroresEncontrados);

    if (formulario.latitud === null || formulario.longitud === null) {
      setErrorMsg('Debes seleccionar la ubicacion de tu tienda en el mapa.');
      return;
    }

    if (Object.keys(erroresEncontrados).length > 0) return;

    try {
      setGuardando(true);
      const respuesta = await guardarMiTienda(formulario);

      setEsNueva(false);
      toast({
        title: 'Tienda guardada',
        description: respuesta.message || 'Los datos de tu tienda se guardaron correctamente.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar la tienda.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Layout conSidebar>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout conSidebar>
      <Box maxW="900px">
        <Heading as="h1" size="lg" color="secondary.900" mb={1}>
          Mi tienda
        </Heading>
        <Text color="secondary.600" mb={6}>
          {esNueva
            ? 'Completa los datos de tu local para que aparezca en el mapa de los clientes.'
            : 'Actualiza la informacion y la ubicacion de tu tienda de repuestos.'}
        </Text>

        {errorMsg && (
          <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
            <AlertIcon />
            {errorMsg}
          </Alert>
        )}

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
                  placeholder="Que tipo de repuestos vendes, marcas que manejas..."
                  bg="white"
                  focusBorderColor="brand.500"
                  rows={4}
                />
              </FormControl>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2} color="secondary.700">
                Ubicacion en el mapa
              </Text>
              <MapaSelector
                latitud={formulario.latitud}
                longitud={formulario.longitud}
                alCambiar={manejarUbicacion}
                altura="320px"
                zoom={15}
                ayuda="Haz clic en el mapa para actualizar la ubicacion exacta de tu local."
              />
            </Box>
          </SimpleGrid>

          <Button type="submit" variant="primary" mt={6} w={{ base: '100%', sm: 'auto' }} isLoading={guardando}>
            {esNueva ? 'Registrar tienda' : 'Guardar cambios'}
          </Button>
        </Box>
      </Box>
    </Layout>
  );
}

export default MiTienda;
