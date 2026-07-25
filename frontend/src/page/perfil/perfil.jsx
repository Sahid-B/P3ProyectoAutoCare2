import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Flex,
  Badge,
  Alert,
  AlertIcon,
  Divider,
  Icon,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Code,
  Spinner,
} from '@chakra-ui/react';
import {
  FaUser,
  FaShieldHalved,
  FaKey,
  FaGoogle,
  FaEnvelope,
  FaQrcode,
  FaCheck,
  FaLock,
  FaFloppyDisk,
  FaMobileScreenButton,
} from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';
import { useAuth } from '../../context/auth-context.jsx';
import {
  actualizarPerfil,
  configurarTOTP,
  alternar2FA,
  enviarOtpPrueba,
} from '../../services/api-service.js';

function Perfil() {
  const { usuario, actualizarUsuarioLocal } = useAuth();

  // Estados para datos personales
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [apellido, setApellido] = useState(usuario?.apellido || '');
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState({ tipo: '', texto: '' });

  // Estados para cambio de contrasena
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [cargandoPass, setCargandoPass] = useState(false);
  const [msgPass, setMsgPass] = useState({ tipo: '', texto: '' });

  // Estados para 2FA / TOTP / SMTP
  const [is2faEnabled, setIs2faEnabled] = useState(Boolean(usuario?.is_2fa_enabled));
  const [datosTotp, setDatosTotp] = useState(null); // { secret, qrCodeUrl }
  const [token2FA, setToken2FA] = useState('');
  const [cargando2FA, setCargando2FA] = useState(false);
  const [msg2FA, setMsg2FA] = useState({ tipo: '', texto: '' });

  // Modal 2FA
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  // Sincroniza los campos locales cuando cambia el usuario del contexto.
  // Patron oficial de React de "ajustar estado durante el render" (evita
  // llamar setState dentro de un useEffect).
  const [usuarioSincronizado, setUsuarioSincronizado] = useState(usuario);
  if (usuario && usuario !== usuarioSincronizado) {
    setUsuarioSincronizado(usuario);
    setNombre(usuario.nombre || '');
    setApellido(usuario.apellido || '');
    setIs2faEnabled(Boolean(usuario.is_2fa_enabled));
  }

  // Manejar guardado de datos del perfil
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setMsgPerfil({ tipo: '', texto: '' });

    if (!nombre.trim() || !apellido.trim()) {
      setMsgPerfil({ tipo: 'error', texto: 'El nombre y apellido son obligatorios.' });
      return;
    }

    try {
      setCargandoPerfil(true);
      const res = await actualizarPerfil({ nombre: nombre.trim(), apellido: apellido.trim() });
      if (res?.usuario) {
        actualizarUsuarioLocal({ nombre: res.usuario.nombre, apellido: res.usuario.apellido });
        setMsgPerfil({ tipo: 'success', texto: 'Perfil actualizado exitosamente.' });
      }
    } catch (err) {
      setMsgPerfil({ tipo: 'error', texto: err.message || 'Error al actualizar perfil.' });
    } finally {
      setCargandoPerfil(false);
    }
  };

  // Manejar cambio de contrasena
  const handleCambiarContrasena = async (e) => {
    e.preventDefault();
    setMsgPass({ tipo: '', texto: '' });

    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      setMsgPass({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setMsgPass({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    try {
      setCargandoPass(true);
      await actualizarPerfil({
        nombre,
        apellido,
        contrasenaActual,
        nuevaContrasena,
      });
      setMsgPass({ tipo: 'success', texto: 'Contraseña cambiada exitosamente.' });
      setContrasenaActual('');
      setNuevaContrasena('');
      setConfirmarContrasena('');
    } catch (err) {
      setMsgPass({ tipo: 'error', texto: err.message || 'Error al cambiar la contraseña.' });
    } finally {
      setCargandoPass(false);
    }
  };

  // Iniciar configuracion 2FA con Google Authenticator (TOTP)
  const handleIniciarConfigTOTP = async () => {
    setMsg2FA({ tipo: '', texto: '' });
    try {
      setCargando2FA(true);
      const res = await configurarTOTP();
      if (res?.secret && res?.qrCodeUrl) {
        setDatosTotp(res);
        onModalOpen();
      }
    } catch (err) {
      setMsg2FA({ tipo: 'error', texto: err.message || 'Error al generar código QR 2FA.' });
    } finally {
      setCargando2FA(false);
    }
  };

  // Confirmar y activar 2FA
  const handleConfirmarActivar2FA = async () => {
    if (!token2FA.trim()) {
      setMsg2FA({ tipo: 'error', texto: 'Ingresa el código de 6 dígitos de tu aplicación.' });
      return;
    }

    try {
      setCargando2FA(true);
      const res = await alternar2FA({ activar: true, token2FA: token2FA.trim() });
      if (res?.success) {
        setIs2faEnabled(true);
        actualizarUsuarioLocal({ is_2fa_enabled: true });
        setMsg2FA({ tipo: 'success', texto: 'Autenticación en 2 Pasos (2FA) activada exitosamente.' });
        onModalClose();
        setToken2FA('');
      }
    } catch (err) {
      setMsg2FA({ tipo: 'error', texto: err.message || 'Código TOTP incorrecto.' });
    } finally {
      setCargando2FA(false);
    }
  };

  // Desactivar 2FA
  const handleDesactivar2FA = async () => {
    try {
      setCargando2FA(true);
      const res = await alternar2FA({ activar: false });
      if (res?.success) {
        setIs2faEnabled(false);
        actualizarUsuarioLocal({ is_2fa_enabled: false });
        setMsg2FA({ tipo: 'info', texto: 'Autenticación en 2 Pasos (2FA) desactivada.' });
      }
    } catch (err) {
      setMsg2FA({ tipo: 'error', texto: err.message || 'Error al desactivar 2FA.' });
    } finally {
      setCargando2FA(false);
    }
  };

  // Probar envio de OTP por correo SMTP
  const handleProbarOtpCorreo = async () => {
    setMsg2FA({ tipo: '', texto: '' });
    try {
      setCargando2FA(true);
      const res = await enviarOtpPrueba();
      if (res?.success) {
        setMsg2FA({
          tipo: 'success',
          texto: `¡Correo SMTP enviado con éxito a ${usuario?.correo}! Revisa tu bandeja de entrada o spam.`,
        });
      }
    } catch (err) {
      setMsg2FA({ tipo: 'error', texto: err.message || 'Error enviando código por correo.' });
    } finally {
      setCargando2FA(false);
    }
  };

  return (
    <Layout conSidebar>
      <Box mb={6}>
        <Heading as="h1" size="xl" color="brand.800" mb={1}>
          Mi Perfil de Usuario
        </Heading>
        <Text fontSize="sm" color="secondary.600">
          Administra la información de tu cuenta, seguridad y la autenticación en dos pasos (2FA).
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* Tarjeta 1: Datos Personales */}
        <Box
          bg="white"
          p={6}
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="sm"
        >
          <HStack spacing={3} mb={4}>
            <Flex align="center" justify="center" boxSize="40px" bg="brand.50" borderRadius="md">
              <Icon as={FaUser} boxSize={5} color="brand.600" />
            </Flex>
            <Box>
              <Heading as="h2" size="md" color="secondary.900">
                Información Personal
              </Heading>
              <Text fontSize="xs" color="secondary.500">
                Datos principales registrados en la plataforma.
              </Text>
            </Box>
          </HStack>

          <Divider mb={5} />

          <VStack as="form" onSubmit={handleGuardarPerfil} spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <Input
                label="Nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <Input
                label="Apellido"
                name="apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
              />
            </SimpleGrid>

            <Input
              label="Correo electrónico"
              name="correo"
              value={usuario?.correo || ''}
              disabled
            />

            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="secondary.600" mb={1}>
                Método de Autenticación Principal
              </Text>
              {usuario?.google_id ? (
                <Badge colorScheme="red" px={3} py={1} borderRadius="full" display="inline-flex" alignItems="center" gap={1.5}>
                  <Icon as={FaGoogle} boxSize={3.5} />
                  Google OAuth 2.0
                </Badge>
              ) : (
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full" display="inline-flex" alignItems="center" gap={1.5}>
                  <Icon as={FaKey} boxSize={3.5} />
                  Contraseña Local
                </Badge>
              )}
            </Box>

            {msgPerfil.texto && (
              <Alert status={msgPerfil.tipo === 'error' ? 'error' : 'success'} borderRadius="md" fontSize="sm">
                <AlertIcon />
                {msgPerfil.texto}
              </Alert>
            )}

            <Button type="submit" variant="primary" isLoading={cargandoPerfil} leftIcon={<FaFloppyDisk />}>
              Guardar Cambios
            </Button>
          </VStack>
        </Box>

        {/* Tarjeta 2: Seguridad 2FA & TOTP / SMTP */}
        <Box
          bg="white"
          p={6}
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="sm"
        >
          <HStack spacing={3} mb={4}>
            <Flex align="center" justify="center" boxSize="40px" bg="brand.50" borderRadius="md">
              <Icon as={FaShieldHalved} boxSize={5} color="brand.600" />
            </Flex>
            <Box>
              <Heading as="h2" size="md" color="secondary.900">
                Autenticación en 2 Pasos (2FA)
              </Heading>
              <Text fontSize="xs" color="secondary.500">
                Google Authenticator (TOTP) y Verificación por Correo (SMTP).
              </Text>
            </Box>
          </HStack>

          <Divider mb={5} />

          <VStack spacing={5} align="stretch">
            <Flex justify="space-between" align="center" p={4} bg="secondary.50" borderRadius="md" borderWidth="1px" borderColor="secondary.200">
              <HStack spacing={3}>
                <Icon as={FaMobileScreenButton} boxSize={6} color={is2faEnabled ? 'green.500' : 'secondary.400'} />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">
                    Estado de Protección 2FA
                  </Text>
                  <Text fontSize="xs" color="secondary.600">
                    {is2faEnabled
                      ? 'Tu cuenta requiere un código de 6 dígitos al iniciar sesión.'
                      : 'Protege tu cuenta activando el segundo factor de autenticación.'}
                  </Text>
                </Box>
              </HStack>
              <Badge colorScheme={is2faEnabled ? 'green' : 'gray'} px={3} py={1} borderRadius="full">
                {is2faEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
              </Badge>
            </Flex>

            {msg2FA.texto && (
              <Alert status={msg2FA.tipo === 'error' ? 'error' : msg2FA.tipo === 'info' ? 'info' : 'success'} borderRadius="md" fontSize="sm">
                <AlertIcon />
                {msg2FA.texto}
              </Alert>
            )}

            <VStack spacing={3} align="stretch">
              {!is2faEnabled ? (
                <Button
                  variant="primary"
                  onClick={handleIniciarConfigTOTP}
                  isLoading={cargando2FA}
                  leftIcon={<FaQrcode />}
                >
                  Configurar Google Authenticator (TOTP)
                </Button>
              ) : (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDesactivar2FA}
                  isLoading={cargando2FA}
                  leftIcon={<FaLock />}
                >
                  Desactivar 2FA
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={handleProbarOtpCorreo}
                isLoading={cargando2FA}
                leftIcon={<FaEnvelope />}
              >
                Probar Envío de OTP por Correo SMTP
              </Button>
            </VStack>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Modal para escaneo de codigo QR TOTP */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="brand.800" pb={1}>
            Configurar Google Authenticator
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={4}>
            <VStack spacing={4} textStyle="center">
              <Text fontSize="sm" color="secondary.600">
                1. Abre tu aplicación <strong>Google Authenticator</strong> o <strong>Authy</strong> en tu teléfono móvil.
              </Text>
              <Text fontSize="sm" color="secondary.600">
                2. Escanea el siguiente código QR:
              </Text>

              {datosTotp?.qrCodeUrl && (
                <Box p={2} bg="white" borderWidth="1px" borderRadius="md" boxShadow="sm">
                  <Image src={datosTotp.qrCodeUrl} alt="QR Code Google Authenticator" boxSize="180px" mx="auto" />
                </Box>
              )}

              <Text fontSize="xs" color="secondary.500">
                O ingresa manualmente la clave secreta: <Code fontSize="xs">{datosTotp?.secret}</Code>
              </Text>

              <Divider my={2} />

              <Box w="100%" textAlign="left">
                <Input
                  label="3. Ingresa el código de 6 dígitos generado por tu app:"
                  placeholder="Ej. 123456"
                  value={token2FA}
                  onChange={(e) => setToken2FA(e.target.value)}
                  maxLength={6}
                  required
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onModalClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmarActivar2FA} isLoading={cargando2FA} leftIcon={<FaCheck />}>
              Verificar y Activar 2FA
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}

export default Perfil;
