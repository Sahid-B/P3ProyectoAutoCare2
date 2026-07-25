import { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { FaPlus, FaWrench } from 'react-icons/fa6';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../../components/layout/index.jsx';
import MaintenanceList from '../../components/maintenance-list/index.jsx';
import ExpenseCard from '../../components/expense-card/index.jsx';
import NotificationCard from '../../components/notification-card/index.jsx';
import { getMaintenances, getMaintenanceStats, deleteMaintenance } from '../../services/maintenance-service.js';
import { getVehicles } from '../../services/vehicle-service.js';
import {
  saveMaintenances,
  getMaintenances as getLocalMaintenances,
  getVehicles as getLocalVehicles,
  deleteMaintenance as deleteLocalMaintenance,
  addPendingOperation,
} from '../../services/indexeddb-service.js';
import { calcularEstadoMantenimiento } from '../../utils/rule-engine.js';
import { solicitarPermisoNotificaciones, comprobarYNotificarMantenimientos } from '../../services/notification-service.js';

function Mantenimientos() {
  const [cargando, setCargando] = useState(true);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [stats, setStats] = useState({ gasto_total: 0, gasto_mes: 0 });
  const [error, setError] = useState('');
  const [modoOffline, setModoOffline] = useState(false);
  const [permisoPush, setPermisoPush] = useState(Notification.permission || 'default');

  const toast = useToast();

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      // Intentar cargar de la API
      const [resMaintenances, resVehicles, resStats] = await Promise.all([
        getMaintenances(),
        getVehicles(),
        getMaintenanceStats().catch(() => null),
      ]);

      const listaMantenimientos = resMaintenances.data || [];
      const listaVehiculos = resVehicles.data || [];

      setMantenimientos(listaMantenimientos);
      setVehiculos(listaVehiculos);
      setModoOffline(false);

      if (resStats?.data) {
        setStats({
          gasto_total: Number(resStats.data.gasto_total || 0),
          gasto_mes: Number(resStats.data.gasto_mes || 0),
        });
      } else {
        calcularEstadisticasLocales(listaMantenimientos);
      }

      // Guardar en IndexedDB para lectura offline
      await saveMaintenances(listaMantenimientos);

      // Comprobar alertas para notificaciones push
      verificarAlertasYNotificar(listaMantenimientos, listaVehiculos);
    } catch (err) {
      console.warn('[mantenimientos] Error al consultar API, intentando IndexedDB:', err.message);
      setModoOffline(true);

      const [localMaintenances, localVehicles] = await Promise.all([
        getLocalMaintenances(),
        getLocalVehicles(),
      ]);

      setMantenimientos(localMaintenances || []);
      setVehiculos(localVehicles || []);
      calcularEstadisticasLocales(localMaintenances || []);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticasLocales = (lista) => {
    const total = lista.reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    primerDiaMes.setHours(0, 0, 0, 0);

    const mes = lista
      .filter((m) => new Date(m.date) >= primerDiaMes)
      .reduce((acc, curr) => acc + Number(curr.cost || 0), 0);

    setStats({ gasto_total: total, gasto_mes: mes });
  };

  const verificarAlertasYNotificar = (listaMantenimientos, listaVehiculos) => {
    const alertas = listaMantenimientos
      .map((m) => {
        const v = listaVehiculos.find((veh) => String(veh.id) === String(m.vehicle_id));
        const est = calcularEstadoMantenimiento(m, v?.kilometraje_actual);
        return { ...m, ...est };
      })
      .filter((item) => item.estado === 'urgente' || item.estado === 'vencido');

    comprobarYNotificarMantenimientos(alertas);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handlePedirPermisosPush = async () => {
    const res = await solicitarPermisoNotificaciones();
    setPermisoPush(res);
    if (res === 'granted') {
      toast({
        title: 'Notificaciones activadas',
        description: 'Recibiras alertas de mantenimientos proximos o vencidos.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Esta seguro de eliminar este registro de mantenimiento?')) return;

    try {
      if (navigator.onLine && !modoOffline) {
        await deleteMaintenance(id);
      } else {
        await addPendingOperation({ tipo: 'DELETE_MAINTENANCE', payload: { id } });
      }

      await deleteLocalMaintenance(id);
      setMantenimientos((prev) => prev.filter((m) => String(m.id) !== String(id)));

      toast({
        title: 'Mantenimiento eliminado',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
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

  const alertasUrgentesVencidas = mantenimientos
    .map((m) => {
      const v = vehiculos.find((veh) => String(veh.id) === String(m.vehicle_id));
      const est = calcularEstadoMantenimiento(m, v?.kilometraje_actual);
      return { ...m, ...est };
    })
    .filter((item) => item.estado === 'urgente' || item.estado === 'vencido');

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap" mb={6}>
        <Box>
          <Heading as="h1" size="xl" color="brand.800">
            Mantenimientos
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Gestiona los servicios y mantenimientos preventivos de tus vehiculos.
          </Text>
        </Box>

        <Button
          as={RouterLink}
          to="/mantenimientos/nuevo"
          colorScheme="brand"
          leftIcon={<FaPlus />}
          size="md"
        >
          Nuevo Mantenimiento
        </Button>
      </Flex>

      {modoOffline && (
        <Alert status="warning" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          Modo Offline: Mostrando mantenimientos guardados localmente en IndexedDB.
        </Alert>
      )}

      {/* Indicadores Financieros */}
      <ExpenseCard
        gastoTotal={stats.gasto_total}
        gastoMes={stats.gasto_mes}
        totalVehiculos={vehiculos.length || 1}
      />

      {/* Notificaciones y Alertas del Motor de Reglas */}
      <NotificationCard
        alertas={alertasUrgentesVencidas}
        alPedirPermisosPush={handlePedirPermisosPush}
        permisoPush={permisoPush}
      />

      {/* Lista Principal */}
      {cargando ? (
        <Flex align="center" justify="center" py={12}>
          <HStack spacing={3} color="secondary.600">
            <Spinner size="md" color="brand.500" />
            <Text>Cargando mantenimientos...</Text>
          </HStack>
        </Flex>
      ) : (
        <MaintenanceList
          mantenimientos={mantenimientos}
          vehiculos={vehiculos}
          alEliminar={handleEliminar}
        />
      )}
    </Layout>
  );
}

export default Mantenimientos;
