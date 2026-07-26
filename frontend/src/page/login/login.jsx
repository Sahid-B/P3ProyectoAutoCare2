import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Image,
  Heading,
  Text,
  Link,
  Alert,
  AlertIcon,
  Divider,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Icon,
} from '@chakra-ui/react';
import { FaShieldHalved, FaKey } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';
import GoogleButton from '../../components/google-button/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';

const formularioInicial = {
  correo: '',
  contrasena: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pantalla de inicio de sesion con autenticacion JWT, 2FA (TOTP/SMTP) y Google OAuth 2.0.
function Login() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados para verificacion 2FA
  const [requiere2FA, setRequiere2FA] = useState(false);
  const [userId2FA, setUserId2FA] = useState(null);
  const [token2FA, setToken2FA] = useState('');
  const [msg2FA, setMsg2FA] = useState('');
  const { isOpen: isModal2FAOpen, onOpen: onOpen2FA, onClose: onClose2FA } = useDisclosure();

  const { login, completarLogin2FA, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
    setErrorMsg('');
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setErrorMsg('');

    if (!formulario.correo.trim() || !formulario.contrasena) {
      setErrorMsg('El correo electronico y la contrasena son obligatorios.');
      return;
    }

    if (!EMAIL_REGEX.test(formulario.correo.trim())) {
      setErrorMsg('Por favor ingresa un correo electronico valido.');
      return;
    }

    try {
      setCargando(true);
      const res = await login({
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
      });

      if (res?.requiereVerificacion) {
        navigate('/registro/verificacion', {
          state: { userId: res.userId, correo: res.correo },
        });
      } else if (res?.requiere2FA) {
        setRequiere2FA(true);
        setUserId2FA(res.userId);
        onOpen2FA();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error al iniciar sesion. Verifica tus credenciales.');
    } finally {
      setCargando(false);
    }
  };

  const manejarConfirmar2FA = async () => {
    setMsg2FA('');
    if (!token2FA.trim()) {
      setMsg2FA('Ingresa el código de 6 dígitos.');
      return;
    }

    try {
      setCargando(true);
      await completarLogin2FA(userId2FA, token2FA.trim());
      onClose2FA();
      navigate('/dashboard');
    } catch (error) {
      setMsg2FA(error.message || 'Código 2FA incorrecto o expirado.');
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
      setErrorMsg(error.message || 'Error al iniciar sesion con Google.');
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

            <Button type="submit" variant="primary" width="100%" isLoading={cargando}>
              Iniciar sesion
            </Button>
          </Box>

          <HStack my={5} spacing={3}>
            <Divider />
            <Text fontSize="xs" color="secondary.500" whiteSpace="nowrap">
              O continua con
            </Text>
            <Divider />
          </HStack>

          {/* Boton Google OAuth 2.0 */}
          <GoogleButton alExito={manejarExitoGoogle} cargando={cargando} texto="Iniciar sesion con Google" />

          {errorMsg && (
            <Alert status="error" borderRadius="md" mt={4} fontSize="sm">
              <AlertIcon />
              {errorMsg}
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

      {/* Modal Verificacion 2FA (TOTP / OTP Correo) */}
      <Modal isOpen={isModal2FAOpen} onClose={onClose2FA} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="brand.800" display="flex" alignItems="center" gap={2}>
            <Icon as={FaShieldHalved} color="brand.600" />
            Verificación en 2 Pasos (2FA)
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={4}>
            <Text fontSize="sm" color="secondary.700" mb={4}>
              Tu cuenta está protegida. Ingresa el código de 6 dígitos de tu aplicación <strong>Google Authenticator</strong> o enviado a tu correo electrónico.
            </Text>

            <Input
              label="Código de Seguridad de 6 Dígitos"
              placeholder="Ej. 123456"
              value={token2FA}
              onChange={(e) => setToken2FA(e.target.value)}
              maxLength={6}
              autoFocus
              required
            />

            {msg2FA && (
              <Alert status="error" borderRadius="md" mt={3} fontSize="sm">
                <AlertIcon />
                {msg2FA}
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose2FA}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={manejarConfirmar2FA} isLoading={cargando} leftIcon={<FaKey />}>
              Verificar e Iniciar Sesión
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}

export default Login;
