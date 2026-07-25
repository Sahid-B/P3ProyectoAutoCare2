import { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  SimpleGrid,
  Heading,
  Text,
  Badge,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Wrap,
  WrapItem,
  Code,
  Spinner,
  Icon,
  Button,
} from '@chakra-ui/react';
import {
  FaCar,
  FaClock,
  FaTriangleExclamation,
  FaDollarSign,
  FaCalendarDays,
  FaCircleCheck,
  FaWrench,
  FaArrowRight,
} from 'react-icons/fa6';

import { Link as RouterLink } from 'react-router-dom';
import Layout from '../../components/layout/index.jsx';
import NotificationCard from '../../components/notification-card/index.jsx';
import { obtenerEstadoApi } from '../../services/api-service.js';
import { getVehicles } from '../../services/vehicle-service.js';
import { getMaintenances, getMaintenanceStats } from '../../services/maintenance-service.js';
import {
  getVehicles as getLocalVehicles,
  getMaintenances as getLocalMaintenances,
} from '../../services/indexeddb-service.js';
import { calcularEstadoMantenimiento } from '../../utils/rule-engine.js';
import { solicitarPermisoNotificaciones, comprobarYNotificarMantenimientos } from '../../services/notification-service.js';
import { useAuth } from '../../context/auth-context.jsx';


function Dashboard() {
  const [estadoApi, setEstadoApi] = useState({ cargando: true, datos: null, error: '' });
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [modoOffline, setModoOffline] = useState(false);
  const [permisoPush, setPermisoPush] = useState(Notification.permission || 'default');

  const [resumen, setResumen] = useState({
    totalVehiculos: 0,
    proximosMantenimientos: 0,
    mantenimientosVencidos: 0,
    alertasActivas: 0,
    gastoTotal: 0,
    gastoMes: 0,
  });

  const [ultimosMantenimientos, setUltimosMantenimientos] = useState([]);
  const [alertasUrgentesVencidas, setAlertasUrgentesVencidas] = useState([]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  useEffect(() => {
    let activo = true;

    // 1. Estado de la API
    obtenerEstadoApi()
      .then((datos) => {
        if (activo) setEstadoApi({ cargando: false, datos, error: '' });
      })
      .catch((error) => {
        if (activo) setEstadoApi({ cargando: false, datos: null, error: error.message });
      });

    // 2. Cargar datos de vehiculos y mantenimientos reales
    async function cargarDashboard() {
      try {
        const [resVehicles, resMaintenances, resStats] = await Promise.all([
          getVehicles(),
          getMaintenances(),
          getMaintenanceStats().catch(() => null),
        ]);

        const listaVehiculos = resVehicles.data || [];
        const listaMantenimientos = resMaintenances.data || [];

        if (!activo) return;

        procesarMetricas(listaVehiculos, listaMantenimientos, resStats?.data);
        setModoOffline(false);
      } catch (err) {
        console.warn('[dashboard] Error consultando backend, usando datos de IndexedDB:', err.message);
        const [localVehicles, localMaintenances] = await Promise.all([
          getLocalVehicles(),
          getLocalMaintenances(),
        ]);

        if (!activo) return;

        procesarMetricas(localVehicles || [], localMaintenances || [], null);
        setModoOffline(true);
      } finally {
        if (activo) setCargandoDatos(false);
      }
    }

    cargarDashboard();

    return () => {
      activo = false;
    };
  }, []);

  const procesarMetricas = (vehiculos, mantenimientos, statsServidor) => {
    let proximos = 0;
    let vencidos = 0;
    let urgentes = 0;

    const mantenimientosEvaluados = mantenimientos.map((m) => {
      const v = vehiculos.find((veh) => String(veh.id) === String(m.vehicle_id));
      const evaluacion = calcularEstadoMantenimiento(m, v?.kilometraje_actual);
      return { ...m, ...evaluacion };
    });

    mantenimientosEvaluados.forEach((m) => {
      if (m.estado === 'vencido') vencidos++;
      else if (m.estado === 'urgente') urgentes++;
      else if (m.estado === 'proximo') proximos++;
    });

    const alertas = mantenimientosEvaluados.filter(
      (item) => item.estado === 'urgente' || item.estado === 'vencido',
    );

    let gastoTotal = Number(statsServidor?.gasto_total || 0);
    let gastoMes = Number(statsServidor?.gasto_mes || 0);

    if (!statsServidor) {
      gastoTotal = mantenimientos.reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
      const primerDiaMes = new Date();
      primerDiaMes.setDate(1);
      primerDiaMes.setHours(0, 0, 0, 0);

      gastoMes = mantenimientos
        .filter((m) => new Date(m.date) >= primerDiaMes)
        .reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
    }

    setResumen({
      totalVehiculos: vehiculos.length,
      proximosMantenimientos: proximos,
      mantenimientosVencidos: vencidos,
      alertasActivas: alertas.length,
      gastoTotal,
      gastoMes,
    });

    setUltimosMantenimientos(mantenimientosEvaluados.slice(0, 5));
    setAlertasUrgentesVencidas(alertas);

    // Enviar notificaciones push si existen alertas activas
    comprobarYNotificarMantenimientos(alertas);
  };

  const handlePedirPermisosPush = async () => {
    const res = await solicitarPermisoNotificaciones();
    setPermisoPush(res);
  };

  const tarjetasIndicadores = [
    {
      titulo: 'Vehiculos Registrados',
      valor: String(resumen.totalVehiculos),
      detalle: 'Total en tu cuenta',
      icono: FaCar,
      colorIcono: 'brand.600',
      bgIcono: 'brand.50',
    },
    {
      titulo: 'Proximos Mantenimientos',
      valor: String(resumen.proximosMantenimientos),
      detalle: 'Programados en los siguientes 30 dias',
      icono: FaClock,
      colorIcono: 'blue.600',
      bgIcono: 'blue.50',
    },
    {
      titulo: 'Mantenimientos Vencidos',
      valor: String(resumen.mantenimientosVencidos),
      detalle: 'Servicios que requieren atencion inmediata',
      icono: FaTriangleExclamation,
      colorIcono: 'red.600',
      bgIcono: 'red.50',
    },
    {
      titulo: 'Alertas Activas',
      valor: String(resumen.alertasActivas),
      detalle: 'Alertas por fecha o kilometraje',
      icono: FaWrench,
      colorIcono: 'orange.600',
      bgIcono: 'orange.50',
    },
    {
      titulo: 'Gastos Totales',
      valor: formatCurrency(resumen.gastoTotal),
      detalle: 'Inversion acumulada',
      icono: FaDollarSign,
      colorIcono: 'green.600',
      bgIcono: 'green.50',
    },
    {
      titulo: 'Gastos del Mes',
      valor: formatCurrency(resumen.gastoMes),
      detalle: 'Servicios del mes actual',
      icono: FaCalendarDays,
      colorIcono: 'purple.600',
      bgIcono: 'purple.50',

    },
  ];

  const { usuario } = useAuth();

  return (
    <Layout conSidebar>
      <Flex align="center" justify="space-between" gap={4} flexWrap="wrap" mb={3}>
        <Box>
          <Heading as="h1" size="xl" color="brand.800">
            {usuario?.nombre ? `¡Hola, ${usuario.nombre}! 👋` : 'Dashboard'}
          </Heading>
          <Text fontSize="sm" color="secondary.600">
            Resumen en tiempo real del estado de tus vehiculos y mantenimientos.
          </Text>
        </Box>

        <Badge colorScheme="success" px={3} py={1} borderRadius="full" textTransform="uppercase">
          Datos 100% Reales
        </Badge>
      </Flex>

      {modoOffline ? (
        <Alert status="warning" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          Modo Offline: Mostrando datos locales guardados en IndexedDB.
        </Alert>
      ) : (
        <Alert status="success" variant="subtle" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          Todos los datos de vehiculos, mantenimientos, costos y alertas provienen en vivo del backend.
        </Alert>
      )}

      {/* Indicadores Principales */}
      {cargandoDatos ? (
        <Flex align="center" justify="center" py={8}>
          <HStack spacing={3} color="secondary.600">
            <Spinner size="md" color="brand.500" />
            <Text>Calculando indicadores...</Text>
          </HStack>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6} mb={8}>
          {tarjetasIndicadores.map((indicador) => (
            <Box
              key={indicador.titulo}
              p={5}
              bg="white"
              borderWidth="1px"
              borderColor="secondary.200"
              borderRadius="lg"
              boxShadow="sm"
            >
              <Flex align="center" justify="space-between" mb={2}>
                <Flex align="center" justify="center" boxSize="42px" bg={indicador.bgIcono} borderRadius="md">
                  <Icon as={indicador.icono} boxSize={5} color={indicador.colorIcono} />
                </Flex>
                <Badge colorScheme="success" fontSize="0.65rem">
                  Real
                </Badge>
              </Flex>
              <Stat>
                <StatLabel color="secondary.500">{indicador.titulo}</StatLabel>
                <StatNumber color="brand.800">{indicador.valor}</StatNumber>
                <StatHelpText color="secondary.500" mb={0}>
                  {indicador.detalle}
                </StatHelpText>
              </Stat>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Notificaciones y Alertas Activas */}
      <NotificationCard
        alertas={alertasUrgentesVencidas}
        alPedirPermisosPush={handlePedirPermisosPush}
        permisoPush={permisoPush}
      />

      {/* Ultimos Mantenimientos Registrados */}
      <Box
        p={6}
        mb={8}
        bg="white"
        borderWidth="1px"
        borderColor="secondary.200"
        borderRadius="lg"
        boxShadow="sm"
      >
        <Flex align="center" justify="space-between" mb={4}>
          <Heading as="h2" size="md" color="brand.800">
            Ultimos Mantenimientos Registrados
          </Heading>
          <Button
            as={RouterLink}
            to="/historial"
            size="xs"
            colorScheme="brand"
            variant="ghost"
            rightIcon={<FaArrowRight />}
          >
            Ver Historial Completo
          </Button>
        </Flex>

        {ultimosMantenimientos.length === 0 ? (
          <Text fontSize="sm" color="secondary.500" py={4}>
            Aun no has registrado mantenimientos.
          </Text>
        ) : (
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead bg="secondary.50">
                <Tr>
                  <Th>Fecha</Th>
                  <Th>Servicio</Th>
                  <Th>Vehiculo</Th>
                  <Th>Costo</Th>
                  <Th>Estado Motor Reglas</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ultimosMantenimientos.map((item) => {
                  const badgeColorScheme = {
                    al_dia: 'green',
                    proximo: 'blue',
                    urgente: 'orange',
                    vencido: 'red',
                  }[item.estado] || 'gray';

                  return (
                    <Tr key={item.id}>
                      <Td fontWeight="medium">{item.date}</Td>
                      <Td fontWeight="semibold" color="brand.800">
                        {item.maintenance_type}
                      </Td>
                      <Td>
                        {item.vehicle_marca
                          ? `${item.vehicle_marca} ${item.vehicle_modelo} (${item.vehicle_placa})`
                          : `Vehiculo #${item.vehicle_id}`}
                      </Td>
                      <Td fontWeight="bold" color="brand.700">
                        {formatCurrency(item.cost)}
                      </Td>
                      <Td>
                        <Badge colorScheme={badgeColorScheme} fontSize="0.65rem">
                          {item.label}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Estado de la API y PostgreSQL */}
      <Box
        p={6}
        bg="white"
        borderWidth="1px"
        borderColor="secondary.200"
        borderRadius="lg"
        boxShadow="sm"
      >
        <Heading as="h2" size="md" mb={1} color="brand.800">
          Estado del Sistema
        </Heading>
        <Text fontSize="sm" color="secondary.600" mb={3}>
          Diagnostico en vivo del endpoint <Code>/api/health</Code> y servicio PostgreSQL.
        </Text>

        {estadoApi.cargando && (
          <HStack fontSize="sm" color="secondary.600">
            <Spinner size="sm" />
            <Text>Consultando el backend...</Text>
          </HStack>
        )}

        {estadoApi.error && (
          <Alert status="error" borderRadius="md" fontSize="sm">
            <AlertIcon />
            No se pudo contactar al backend: {estadoApi.error}
          </Alert>
        )}

        {estadoApi.datos && (
          <Wrap spacing={3}>
            <WrapItem>
              <Badge colorScheme="success" px={3} py={1} borderRadius="md">
                API: {estadoApi.datos.api}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="success" px={3} py={1} borderRadius="md">
                Base de datos: {estadoApi.datos.database}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge colorScheme="success" px={3} py={1} borderRadius="md">
                Consultado: {estadoApi.datos.timestamp}
              </Badge>
            </WrapItem>
          </Wrap>
        )}
      </Box>
    </Layout>
  );
}

export default Dashboard;
