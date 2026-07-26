import { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../../context/auth-context.jsx';

function RegistroVerificacion() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token2FA, setToken2FA] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  const { completarLogin2FA } = useAuth();
  const userId = location.state?.userId;
  const correo = location.state?.correo || '';

  useEffect(() => {
    if (!userId || !correo) navigate('/registro', { replace: true });
  }, [correo, navigate, userId]);

  const manejarConfirmar = async () => {
    setErrorMsg('');

    if (!token2FA.trim()) {
      setErrorMsg('Ingresa el código de verificación enviado a tu correo.');
      return;
    }

    try {
      setCargando(true);
      await completarLogin2FA(userId, token2FA.trim());
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg(error.message || 'Código inválido o expirado.');
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
            Verificar cuenta
          </Heading>
          <Text fontSize="sm" color="secondary.600" mb={6}>
            Se envió un código de verificación al correo <strong>{correo}</strong>. Ingresa ese número para completar el registro.
          </Text>

          <Input
            label="Código de verificación"
            name="token2FA"
            value={token2FA}
            onChange={(event) => {
              setToken2FA(event.target.value);
              setErrorMsg('');
            }}
            placeholder="Ej. 123456"
            maxLength={6}
            required
          />

          <Button variant="primary" width="100%" mt={4} onClick={manejarConfirmar} isLoading={cargando}>
            Confirmar y continuar
          </Button>

          {errorMsg && (
            <Alert status="error" borderRadius="md" mt={4} fontSize="sm">
              <AlertIcon />
              {errorMsg}
            </Alert>
          )}

          <Text fontSize="sm" color="secondary.600" mt={6}>
            Si no recibiste el código, vuelve a intentarlo o verifica que el correo sea correcto.
          </Text>
          <Text fontSize="sm" color="secondary.600" mt={3}>
            <Link as={RouterLink} to="/registro" color="brand.600" fontWeight="semibold">
              Volver al registro
            </Link>
          </Text>
        </Box>
      </Flex>
    </Layout>
  );
}

export default RegistroVerificacion;
