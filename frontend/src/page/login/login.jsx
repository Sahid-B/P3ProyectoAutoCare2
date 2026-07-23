import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Image,
  Heading,
  Text,
  Link,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';

const formularioInicial = {
  correo: '',
  contrasena: '',
};

// Pantalla de inicio de sesion. Solo interfaz: la autenticacion real llega en la Parte 2.
function Login() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mensaje, setMensaje] = useState('');

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  };

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    setMensaje('La autenticacion se implementara en la Parte 2 del proyecto.');
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
          maxW="440px"
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
            Iniciar sesion
          </Heading>
          <Text fontSize="sm" color="secondary.600" mb={6}>
            Ingresa a tu cuenta de AutoCare.
          </Text>

          <Box as="form" onSubmit={manejarEnvio} textAlign="left" noValidate>
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
              placeholder="Tu contrasena"
              required
            />

            <Flex justify="flex-end" mb={4}>
              <Link fontSize="sm" color="brand.600">
                Olvide mi contrasena
              </Link>
            </Flex>

            <Button type="submit" variant="primary" width="100%">
              Iniciar sesion
            </Button>
          </Box>

          {mensaje && (
            <Alert status="warning" borderRadius="md" mt={6} fontSize="sm">
              <AlertIcon />
              {mensaje}
            </Alert>
          )}

          <Text fontSize="sm" color="secondary.600" mt={6}>
            No tienes una cuenta?{' '}
            <Link as={RouterLink} to="/registro" color="brand.600" fontWeight="semibold">
              Crear cuenta
            </Link>
          </Text>
        </Box>
      </Flex>
    </Layout>
  );
}

export default Login;
