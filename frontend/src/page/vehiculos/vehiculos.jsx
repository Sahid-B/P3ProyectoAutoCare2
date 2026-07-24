import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Icon,
  SimpleGrid,
  Skeleton,
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaPlus, FaCar } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import VehicleList from '../../components/vehicle-list/index.jsx';
import { getVehicles, deleteVehicle } from '../../services/vehicle-service.js';
import {
  saveVehicles,
  getVehicles as getVehiclesLocal,
  deleteVehicle as deleteVehicleLocal,
} from '../../services/indexeddb-service.js';

// Estados de origen de los datos mostrados.
const ORIGEN = { SERVIDOR: 'servidor', LOCAL: 'local' };

function Vehiculos() {
  const navigate = useNavigate();
  const toast = useToast();

  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [origen, setOrigen] = useState(ORIGEN.SERVIDOR);

  // Control del dialogo de confirmacion de borrado
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelarRef = useRef(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    let activo = true;

    // Carga los vehiculos con respaldo offline en IndexedDB.
    async function cargar() {
      try {
        // 1) Intentar el backend.
        const respuesta = await getVehicles();
        const data = respuesta.data || [];
        if (!activo) return;
        setVehiculos(data);
        setOrigen(ORIGEN.SERVIDOR);
        // 2) Guardar el ultimo listado en IndexedDB para uso offline.
        await saveVehicles(data);
      } catch (err) {
        // 3) Si falla (por ejemplo, sin conexion), recuperar el listado local.
        let locales;
        try {
          locales = await getVehiclesLocal();
        } catch {
          locales = [];
        }
        if (!activo) return;
        if (locales && locales.length > 0) {
          setVehiculos(locales);
          setOrigen(ORIGEN.LOCAL);
        } else {
          setError(err.message || 'No se pudieron cargar los vehiculos.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  const pedirEliminar = (vehiculo) => {
    setSeleccionado(vehiculo);
    onOpen();
  };

  const confirmarEliminar = async () => {
    if (!seleccionado) return;
    setEliminando(true);
    try {
      await deleteVehicle(seleccionado.id);
      await deleteVehicleLocal(seleccionado.id);
      setVehiculos((prev) => prev.filter((v) => v.id !== seleccionado.id));
      toast({
        title: 'Vehiculo eliminado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      toast({
        title: 'No se pudo eliminar',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="xl">
            Vehiculos
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Administra los vehiculos de tu cuenta.
          </Text>
        </Box>
        <Button
          variant="primary"
          leftIcon={<Icon as={FaPlus} />}
          onClick={() => navigate('/vehiculos/nuevo')}
        >
          Registrar vehiculo
        </Button>
      </Flex>

      {/* Aviso de datos locales (sin conexion) */}
      {origen === ORIGEN.LOCAL && (
        <Alert status="warning" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          No se pudo contactar al servidor. Se muestran los vehiculos guardados en este dispositivo.
        </Alert>
      )}

      {/* Estado de carga */}
      {cargando && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height="320px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      )}

      {/* Estado de error */}
      {!cargando && error && (
        <Alert status="error" borderRadius="md" fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Estado vacio */}
      {!cargando && !error && vehiculos.length === 0 && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          py={16}
          px={6}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
        >
          <Icon as={FaCar} boxSize={12} color="brand.300" mb={4} />
          <Heading as="h2" size="md" mb={2}>
            Aun no tienes vehiculos
          </Heading>
          <Text color="secondary.600" mb={6} maxW="40ch">
            Registra tu primer vehiculo para empezar a llevar el control de su mantenimiento.
          </Text>
          <Button
            variant="primary"
            leftIcon={<Icon as={FaPlus} />}
            onClick={() => navigate('/vehiculos/nuevo')}
          >
            Registrar vehiculo
          </Button>
        </Flex>
      )}

      {/* Listado */}
      {!cargando && !error && vehiculos.length > 0 && (
        <VehicleList
          vehiculos={vehiculos}
          onVer={(v) => navigate(`/vehiculos/${v.id}`)}
          onEditar={(v) => navigate(`/vehiculos/${v.id}/editar`)}
          onEliminar={pedirEliminar}
        />
      )}

      {/* Dialogo de confirmacion de borrado */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelarRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar vehiculo
            </AlertDialogHeader>
            <AlertDialogBody>
              Estas seguro de eliminar{' '}
              <strong>
                {seleccionado?.marca} {seleccionado?.modelo}
              </strong>
              ? Esta accion no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelarRef} onClick={onClose} isDisabled={eliminando}>
                Cancelar
              </Button>
              <Button
                colorScheme="error"
                onClick={confirmarEliminar}
                ml={3}
                isLoading={eliminando}
                loadingText="Eliminando"
              >
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
}

export default Vehiculos;
