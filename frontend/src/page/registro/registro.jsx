import { useState } from 'react';
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
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';
import GoogleButton from '../../components/google-button/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';

const formularioInicial = {
  nombre: '',
  apellido: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pantalla de registro de usuarios conectada con el backend (Parte 2 y Google OAuth Parte 4).
function Registro() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const { registro, loginGoogle } = useAuth();
  const navigate = useNavigate();

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
      setErrorMsg('Todos los campos son obligatorios.');
      return;
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
      await registro({
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
      });
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg(error.message || 'Error al registrar el usuario.');
    } finally {
      setCargando(false);
    }
  };

  const manejarExitoGoogle = async (credential) => {
    try {
      setCargando(true);
      setErrorMsg('');
      await loginGoogle(credential);
      navigate('/dashboard');
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
          maxW="520px"
          alignSelf="flex-start"
          p={8}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="lg"
          textAlign="center"
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
            Registrate para llevar el control de tus vehiculos.
          </Text>

          <Box as="form" onSubmit={manejarEnvio} textAlign="left" noValidate>
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

            <Button type="submit" variant="primary" width="100%" mt={2} isLoading={cargando}>
              Registrarse
            </Button>
          </Box>

          <HStack my={5} spacing={3}>
            <Divider />
            <Text fontSize="xs" color="secondary.500" whiteSpace="nowrap">
              O registrate con
            </Text>
            <Divider />
          </HStack>

          {/* Boton Google OAuth 2.0 */}
          <GoogleButton alExito={manejarExitoGoogle} cargando={cargando} texto="Registrarse con Google" />

          {errorMsg && (
            <Alert status="error" borderRadius="md" mt={4} fontSize="sm">
              <AlertIcon />
              {errorMsg}
            </Alert>
          )}

          <Text fontSize="sm" color="secondary.600" mt={6}>
            Ya tienes una cuenta?{' '}
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
