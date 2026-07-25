import { useState, useEffect } from 'react';
import { Box, Heading, Text, Button, Flex, useToast, Spinner, HStack } from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa6';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import Layout from '../../components/layout/index.jsx';
import MaintenanceForm from '../../components/maintenance-form/index.jsx';
import { createMaintenance } from '../../services/maintenance-service.js';
import { getVehicles } from '../../services/vehicle-service.js';
import {
  getVehicles as getLocalVehicles,
  saveMaintenance as saveLocalMaintenance,
  addPendingOperation,
} from '../../services/indexeddb-service.js';

function NuevoMantenimiento() {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');

  const [searchParams] = useSearchParams();
  const vehicleIdPredefinido = searchParams.get('vehicle_id');

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    async function cargarVehiculos() {
      try {
        const respuesta = await getVehicles();
        setVehiculos(respuesta.data || []);
      } catch (err) {
        console.warn('[nuevo-mantenimiento] Error al cargar vehiculos de API, usando IndexedDB:', err.message);
        const locales = await getLocalVehicles();
        setVehiculos(locales || []);
      } finally {
        setCargandoVehiculos(false);
      }
    }
    cargarVehiculos();
  }, []);

  const handleEnviar = async (datos) => {
    try {
      setGuardando(true);
      setErrorServidor('');

      if (navigator.onLine) {
        const res = await createMaintenance(datos);
        if (res.data) {
          await saveLocalMaintenance(res.data);
        }
        toast({
          title: 'Mantenimiento registrado',
          description: 'El mantenimiento se guardo exitosamente en el servidor.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Encolar operacion offline
        const tempId = Date.now();
        const objLocal = { ...datos, id: tempId, offlinePending: true };
        await saveLocalMaintenance(objLocal);
        await addPendingOperation({ tipo: 'CREATE_MAINTENANCE', payload: datos });

        toast({
          title: 'Mantenimiento guardado localmente',
          description: 'Se sincronizara automaticamente al recuperar la conexion a internet.',
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      }

      navigate('/mantenimientos');
    } catch (err) {
      console.error('[nuevo-mantenimiento] Error al guardar:', err);
      setErrorServidor(err.message || 'No se pudo registrar el mantenimiento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" mb={6}>
        <Box>
          <Heading as="h1" size="xl" color="brand.800">
            Registrar Mantenimiento
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Ingresa los detalles del servicio realizado a tu vehiculo.
          </Text>
        </Box>
        <Button
          as={RouterLink}
          to="/mantenimientos"
          variant="outline"
          leftIcon={<FaArrowLeft />}
          size="sm"
        >
          Volver
        </Button>
      </Flex>

      {cargandoVehiculos ? (
        <Flex align="center" justify="center" py={12}>
          <HStack spacing={3} color="secondary.600">
            <Spinner size="md" color="brand.500" />
            <Text>Cargando vehiculos disponibles...</Text>
          </HStack>
        </Flex>
      ) : (
        <Box bg="white" p={6} borderRadius="lg" borderWidth="1px" borderColor="secondary.200" boxShadow="sm">
          <MaintenanceForm
            vehiculos={vehiculos}
            alEnviar={handleEnviar}
            cargando={guardando}
            errorServidor={errorServidor}
            vehicleIdPredefinido={vehicleIdPredefinido}
          />
        </Box>
      )}
    </Layout>
  );
}

export default NuevoMantenimiento;
