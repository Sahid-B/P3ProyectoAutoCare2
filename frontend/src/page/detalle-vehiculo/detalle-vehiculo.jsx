import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Skeleton,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import VehicleDetail from '../../components/vehicle-detail/index.jsx';
import MileageForm from '../../components/mileage-form/index.jsx';
import {
  getVehicleById,
  updateVehicleMileage,
  deleteVehicle,
} from '../../services/vehicle-service.js';
import {
  saveVehicle as saveVehicleLocal,
  deleteVehicle as deleteVehicleLocal,
} from '../../services/indexeddb-service.js';

// Pagina de detalle de un vehiculo.
function DetalleVehiculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [vehiculo, setVehiculo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Modal de kilometraje
  const modalKm = useDisclosure();
  const [guardandoKm, setGuardandoKm] = useState(false);

  // Dialogo de borrado
  const dialogo = useDisclosure();
  const cancelarRef = useRef(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    let activo = true;

    getVehicleById(id)
      .then((respuesta) => {
        if (activo) setVehiculo(respuesta.data);
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudo cargar el vehiculo.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const actualizarKilometraje = async (nuevoKm) => {
    setGuardandoKm(true);
    try {
      const respuesta = await updateVehicleMileage(id, nuevoKm);
      setVehiculo(respuesta.data);
      await saveVehicleLocal(respuesta.data);
      toast({ title: 'Kilometraje actualizado', status: 'success', duration: 3000, isClosable: true });
      modalKm.onClose();
    } catch (err) {
      toast({
        title: 'No se pudo actualizar',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setGuardandoKm(false);
    }
  };

  const confirmarEliminar = async () => {
    setEliminando(true);
    try {
      await deleteVehicle(id);
      await deleteVehicleLocal(id);
      toast({ title: 'Vehiculo eliminado', status: 'success', duration: 3000, isClosable: true });
      navigate('/vehiculos');
    } catch (err) {
      toast({
        title: 'No se pudo eliminar',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setEliminando(false);
    }
  };

  return (
    <Layout conSidebar>
      {cargando && <Skeleton height="480px" borderRadius="lg" />}

      {!cargando && error && (
        <Alert status="error" borderRadius="md" fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!cargando && !error && vehiculo && (
        <Box
          p={{ base: 5, md: 8 }}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="sm"
        >
          <VehicleDetail
            vehiculo={vehiculo}
            onEditar={() => navigate(`/vehiculos/${id}/editar`)}
            onActualizarKm={modalKm.onOpen}
            onEliminar={dialogo.onOpen}
            onVolver={() => navigate('/vehiculos')}
          />
        </Box>
      )}

      {/* Modal para actualizar kilometraje */}
      <Modal isOpen={modalKm.isOpen} onClose={modalKm.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Actualizar kilometraje</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <MileageForm
              kilometrajeActual={vehiculo?.kilometraje_actual ?? 0}
              onSubmit={actualizarKilometraje}
              cargando={guardandoKm}
              onCancelar={modalKm.onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Dialogo de confirmacion de borrado */}
      <AlertDialog
        isOpen={dialogo.isOpen}
        leastDestructiveRef={cancelarRef}
        onClose={dialogo.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar vehiculo
            </AlertDialogHeader>
            <AlertDialogBody>
              Estas seguro de eliminar{' '}
              <strong>
                {vehiculo?.marca} {vehiculo?.modelo}
              </strong>
              ? Esta accion no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelarRef} onClick={dialogo.onClose} isDisabled={eliminando}>
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

export default DetalleVehiculo;
