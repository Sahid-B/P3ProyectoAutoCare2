import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Heading, Text, Button, Flex, useToast, Spinner, HStack, Alert, AlertIcon } from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import MaintenanceForm from '../../components/maintenance-form/index.jsx';
import { getMaintenanceById, updateMaintenance } from '../../services/maintenance-service.js';
import { getVehicles } from '../../services/vehicle-service.js';
import {
  getMaintenance as getLocalMaintenance,
  getVehicles as getLocalVehicles,
  saveMaintenance as saveLocalMaintenance,
  addPendingOperation,
} from '../../services/indexeddb-service.js';

function EditarMantenimiento() {
  const { id } = useParams();
  const [mantenimiento, setMantenimiento] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setErrorServidor('');

        const [resMaintenance, resVehicles] = await Promise.all([
          getMaintenanceById(id),
          getVehicles(),
        ]);

        setMantenimiento(resMaintenance.data);
        setVehiculos(resVehicles.data || []);
      } catch (err) {
        console.warn('[editar-mantenimiento] Error al cargar de la API, buscando localmente:', err.message);
        const [localM, localV] = await Promise.all([
          getLocalMaintenance(id),
          getLocalVehicles(),
        ]);

        if (localM) {
          setMantenimiento(localM);
          setVehiculos(localV || []);
        } else {
          setErrorServidor('No se encontro el registro de mantenimiento.');
        }
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

  const handleEnviar = async (datos) => {
    try {
      setGuardando(true);
      setErrorServidor('');

      if (navigator.onLine) {
        const res = await updateMaintenance(id, datos);
        if (res.data) {
          await saveLocalMaintenance(res.data);
        }
        toast({
          title: 'Mantenimiento actualizado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const objLocal = { ...datos, id: Number(id), offlinePending: true };
        await saveLocalMaintenance(objLocal);
        await addPendingOperation({ tipo: 'UPDATE_MAINTENANCE', payload: { ...datos, id: Number(id) } });

        toast({
          title: 'Cambios guardados localmente',
          description: 'Se sincronizara automaticamente al conectarse a internet.',
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      }

      navigate(`/mantenimientos/${id}`);
    } catch (err) {
      console.error('[editar-mantenimiento] Error:', err);
      setErrorServidor(err.message || 'No se pudo actualizar el mantenimiento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" mb={6}>
        <Box>
          <Heading as="h1" size="xl" color="brand.800">
            Editar Mantenimiento
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Modifica la informacion del registro de mantenimiento.
          </Text>
        </Box>
        <Button
          as={RouterLink}
          to={`/mantenimientos/${id}`}
          variant="outline"
          leftIcon={<FaArrowLeft />}
          size="sm"
        >
          Volver
        </Button>
      </Flex>

      {cargando ? (
        <Flex align="center" justify="center" py={12}>
          <HStack spacing={3} color="secondary.600">
            <Spinner size="md" color="brand.500" />
            <Text>Cargando datos del mantenimiento...</Text>
          </HStack>
        </Flex>
      ) : !mantenimiento ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          No se pudo cargar el mantenimiento.
        </Alert>
      ) : (
        <Box bg="white" p={6} borderRadius="lg" borderWidth="1px" borderColor="secondary.200" boxShadow="sm">
          <MaintenanceForm
            datosIniciales={mantenimiento}
            vehiculos={vehiculos}
            alEnviar={handleEnviar}
            cargando={guardando}
            errorServidor={errorServidor}
          />
        </Box>
      )}
    </Layout>
  );
}

export default EditarMantenimiento;
