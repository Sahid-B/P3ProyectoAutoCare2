import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  SimpleGrid,
  Image,
  Heading,
  Text,
  Link,
  Alert,
  AlertIcon,
  Divider,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';
import GoogleButton from '../../components/google-button/index.jsx';
import RegistroVendedor from '../../components/registro-vendedor/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Arreglar problema de iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const formularioInicial = {
  nombre: '',
  apellido: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
  nombre_taller: '',
  direccion: '',
  telefono: '',
  latitud: null,
  longitud: null,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rol asociado a cada pestana del formulario de registro.
const ROLES_POR_PESTANA = ['usuario', 'taller', 'vendedor_repuestos'];

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

function Registro() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState('usuario');

  const { registro, loginGoogle } = useAuth();
  const navigate = useNavigate();

  // Intentar obtener la ubicacion inicial del usuario (geolocalizacion)
  useEffect(() => {
    if (rolSeleccionado === 'taller' && !formulario.latitud && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormulario((prev) => ({
            ...prev,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude
          }));
        },
        () => {
          // Si rechaza o falla, poner un default (ej. Guayaquil)
          setFormulario((prev) => ({ ...prev, latitud: -2.1894, longitud: -79.8891 }));
        }
      );
    } else if (rolSeleccionado === 'taller' && !formulario.latitud) {
      // Default
      setFormulario((prev) => ({ ...prev, latitud: -2.1894, longitud: -79.8891 }));
    }
  }, [rolSeleccionado, formulario.latitud]);

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
    setErrorMsg('');
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setErrorMsg('');

    if (
      !formulario.nombre.trim() ||
      !formulario.apellido.trim() ||
      !formulario.correo.trim() ||
      !formulario.contrasena ||
      !formulario.confirmarContrasena
    ) {
      setErrorMsg('Todos los campos basicos son obligatorios.');
      return;
    }

    if (rolSeleccionado === 'taller') {
      if (!formulario.nombre_taller.trim() || !formulario.direccion.trim()) {
        setErrorMsg('Debes llenar el nombre y la direccion del taller.');
        return;
      }
      if (formulario.latitud === null || formulario.longitud === null) {
        setErrorMsg('Debes seleccionar la ubicacion de tu taller en el mapa.');
        return;
      }
    }

    if (!EMAIL_REGEX.test(formulario.correo.trim())) {
      setErrorMsg('Por favor ingresa un correo electronico valido.');
      return;
    }

    if (formulario.contrasena.length < 6) {
      setErrorMsg('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (formulario.contrasena !== formulario.confirmarContrasena) {
      setErrorMsg('Las contrasenas no coinciden.');
      return;
    }

    try {
      setCargando(true);
      const payload = {
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
        rol: rolSeleccionado,
      };

      if (rolSeleccionado === 'taller') {
        payload.taller_datos = {
          nombre_taller: formulario.nombre_taller.trim(),
          direccion: formulario.direccion.trim(),
          telefono: formulario.telefono.trim(),
          latitud: formulario.latitud,
          longitud: formulario.longitud,
        };
      }

      const res = await registro(payload);

      if (res?.requiereVerificacion || res?.requiere2FA) {
        navigate('/registro/verificacion', {
          state: { userId: res.userId, correo: res.correo },
        });
      } else {
        const rolDestino = res?.usuario?.rol || rolSeleccionado;
        if (rolDestino === 'vendedor_repuestos') navigate('/vendedor-dashboard');
        else if (rolDestino === 'taller') navigate('/taller-dashboard');
        else navigate('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error al registrar el usuario.');
    } finally {
      setCargando(false);
    }
  };

  // Registro del rol "Vendo Repuestos". El componente RegistroVendedor valida
  // sus propios campos y entrega aqui el payload ya listo para el backend.
  const manejarEnvioVendedor = async (payload) => {
    setErrorMsg('');

    try {
      setCargando(true);
      const res = await registro(payload);

      if (res?.requiereVerificacion || res?.requiere2FA) {
        navigate('/registro/verificacion', {
          state: { userId: res.userId, correo: res.correo },
        });
      } else {
        navigate('/vendedor-dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error al registrar la tienda de repuestos.');
    } finally {
      setCargando(false);
    }
  };

  const manejarExitoGoogle = async (credential) => {
    try {
      setCargando(true);
      setErrorMsg('');
      const res = await loginGoogle(credential);
      const rolDestino = res?.usuario?.rol;
      if (rolDestino === 'vendedor_repuestos') navigate('/vendedor-dashboard');
      else if (rolDestino === 'taller') navigate('/taller-dashboard');
      else if (rolDestino === 'admin') navigate('/admin-dashboard');
      else navigate('/dashboard');
    } catch (error) {
      setErrorMsg(error.message || 'Error al registrarse con Google.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Layout>
      <Flex
        justify="center"
        px={4}
        py={{ base: 10, md: 16 }}
        minH="calc(100vh - 68px)"
        bgGradient="linear(160deg, brand.50 0%, secondary.50 60%)"
      >
        <Box
          w="100%"
          maxW={rolSeleccionado === 'usuario' ? '520px' : '800px'}
          alignSelf="flex-start"
          p={8}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="lg"
          textAlign="center"
          transition="max-width 0.3s ease"
        >
          <Image
            src="/logo-autocare.png"
            alt="Logo de AutoCare"
            boxSize="64px"
            borderRadius="md"
            mx="auto"
            mb={4}
          />

          <Heading as="h1" size="lg" color="secondary.900" mb={1}>
            Crear cuenta
          </Heading>
          <Text fontSize="sm" color="secondary.600" mb={6}>
            Unete a AutoCare como cliente, como taller mecanico o como tienda de repuestos.
          </Text>

          <Tabs
            isFitted
            variant="enclosed"
            colorScheme="brand"
            mb={6}
            onChange={(index) => setRolSeleccionado(ROLES_POR_PESTANA[index])}
          >
            <TabList mb="1em">
              <Tab fontWeight="semibold">Soy Cliente</Tab>
              <Tab fontWeight="semibold">Soy Taller</Tab>
              <Tab fontWeight="semibold">Vendo Repuestos</Tab>
            </TabList>

            {rolSeleccionado === 'vendedor_repuestos' ? (
              <RegistroVendedor
                alRegistrar={manejarEnvioVendedor}
                cargando={cargando}
              />
            ) : (
            <Box as="form" onSubmit={manejarEnvio} textAlign="left" noValidate>
              <SimpleGrid columns={{ base: 1, md: rolSeleccionado === 'taller' ? 2 : 1 }} spacingX={8}>
                {/* Lado Izquierdo: Datos Basicos */}
                <Box>
                  <Text fontWeight="bold" mb={4} color="secondary.700">Datos del Propietario</Text>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={4}>
                    <Input
                      label="Nombre"
                      name="nombre"
                      value={formulario.nombre}
                      onChange={manejarCambio}
                      placeholder="Jose"
                      required
                    />
                    <Input
                      label="Apellido"
                      name="apellido"
                      value={formulario.apellido}
                      onChange={manejarCambio}
                      placeholder="Perez"
                      required
                    />
                  </SimpleGrid>

                  <Input
                    label="Correo electronico"
                    type="email"
                    name="correo"
                    value={formulario.correo}
                    onChange={manejarCambio}
                    placeholder="usuario@correo.com"
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
                      required
                    />
                    <Input
                      label="Confirmar contrasena"
                      type="password"
                      name="confirmarContrasena"
                      value={formulario.confirmarContrasena}
                      onChange={manejarCambio}
                      placeholder="Repite la contrasena"
                      required
                    />
                  </SimpleGrid>
                </Box>

                {/* Lado Derecho: Datos del Taller (Solo si es taller) */}
                {rolSeleccionado === 'taller' && (
                  <Box>
                    <Text fontWeight="bold" mb={4} color="secondary.700">Datos del Taller</Text>
                    <Input
                      label="Nombre del Taller"
                      name="nombre_taller"
                      value={formulario.nombre_taller}
                      onChange={manejarCambio}
                      placeholder="Mecanica Perez"
                      required
                    />
                    <Input
                      label="Direccion"
                      name="direccion"
                      value={formulario.direccion}
                      onChange={manejarCambio}
                      placeholder="Av. Principal 123"
                      required
                    />
                    
                    <Box mt={4} mb={2}>
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>Ubicacion en el Mapa</Text>
                      <Text fontSize="xs" color="gray.500" mb={2}>Haz clic en el mapa para marcar donde estas ubicado.</Text>
                      {formulario.latitud !== null ? (
                        <Box h="250px" borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.300">
                          <MapContainer 
                            center={[formulario.latitud, formulario.longitud]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationMarker 
                              position={[formulario.latitud, formulario.longitud]} 
                              setPosition={(pos) => setFormulario(prev => ({...prev, latitud: pos[0], longitud: pos[1]}))} 
                            />
                          </MapContainer>
                        </Box>
                      ) : (
                        <Box h="250px" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
                          <Text>Cargando mapa...</Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </SimpleGrid>

              <Button type="submit" variant="primary" width="100%" mt={8} isLoading={cargando}>
                Registrarse como {rolSeleccionado === 'taller' ? 'Taller' : 'Cliente'}
              </Button>
            </Box>
            )}
          </Tabs>

          <HStack my={5} spacing={3}>
            <Divider />
            <Text fontSize="xs" color="secondary.500" whiteSpace="nowrap">
              O registrate con
            </Text>
            <Divider />
          </HStack>

          <GoogleButton alExito={manejarExitoGoogle} cargando={cargando} texto="Registrarse con Google" />

          {errorMsg && (
            <Alert status="error" borderRadius="md" mt={4} fontSize="sm">
              <AlertIcon />
              {errorMsg}
            </Alert>
          )}

          <Text fontSize="sm" color="secondary.600" mt={6}>
            ¿Ya tienes una cuenta?{' '}
            <Link as={RouterLink} to="/login" color="brand.600" fontWeight="semibold">
              Iniciar sesion
            </Link>
          </Text>
        </Box>
      </Flex>
    </Layout>
  );
}

export default Registro;
