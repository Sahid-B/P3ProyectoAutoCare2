import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';

const formularioInicial = {
  nombre: '',
  apellido: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
};

// Pantalla de registro. Solo interfaz: todavia no se guardan usuarios.
function Registro() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mensaje, setMensaje] = useState('');

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  };

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    setMensaje('El registro de usuarios se implementara en la Parte 2 del proyecto.');
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
                placeholder="Jhonny"
                required
              />

              <Input
                label="Apellido"
                name="apellido"
                value={formulario.apellido}
                onChange={manejarCambio}
                placeholder="Romero"
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
              placeholder="Minimo 8 caracteres"
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

            <Button type="submit" variant="primary" width="100%" mt={2}>
              Registrarse
            </Button>
          </Box>

          {mensaje && (
            <Alert status="warning" borderRadius="md" mt={6} fontSize="sm">
              <AlertIcon />
              {mensaje}
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
