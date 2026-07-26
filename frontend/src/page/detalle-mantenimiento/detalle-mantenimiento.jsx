import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Flex, Spinner, Text, HStack, useToast, Alert, AlertIcon } from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import MaintenanceDetail from '../../components/maintenance-detail/index.jsx';
import { getMaintenanceById, deleteMaintenance } from '../../services/maintenance-service.js';
import {
  getMaintenance as getLocalMaintenance,
  deleteMaintenance as deleteLocalMaintenance,
  addPendingOperation,
} from '../../services/indexeddb-service.js';

function DetalleMantenimiento() {
  const { id } = useParams();
  const [mantenimiento, setMantenimiento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError('');
        const res = await getMaintenanceById(id);
        setMantenimiento(res.data);
      } catch (err) {
        console.warn('[detalle-mantenimiento] Error al cargar de la API, buscando en IndexedDB:', err.message);
        const local = await getLocalMaintenance(id);
        if (local) {
          setMantenimiento(local);
        } else {
          setError('No se pudo encontrar el mantenimiento solicitado.');
        }
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

  const handleEliminar = async (mantenimientoId) => {
    if (!window.confirm('¿Deseas eliminar este registro de mantenimiento?')) return;

    try {
      if (navigator.onLine) {
        await deleteMaintenance(mantenimientoId);
      } else {
        await addPendingOperation({ tipo: 'DELETE_MAINTENANCE', payload: { id: mantenimientoId } });
      }

      await deleteLocalMaintenance(mantenimientoId);
      toast({
        title: 'Mantenimiento eliminado',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      navigate('/mantenimientos');
    } catch (err) {
      toast({
        title: 'Error al eliminar',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout conSidebar>
      {cargando ? (
        <Flex align="center" justify="center" py={12}>
          <HStack spacing={3} color="secondary.600">
            <Spinner size="md" color="brand.500" />
            <Text>Cargando informacion del mantenimiento...</Text>
          </HStack>
        </Flex>
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <MaintenanceDetail mantenimiento={mantenimiento} alEliminar={handleEliminar} />
      )}
    </Layout>
  );
}

export default DetalleMantenimiento;
