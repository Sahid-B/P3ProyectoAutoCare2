import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Skeleton,
  useToast,
} from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import VehicleForm from '../../components/vehicle-form/index.jsx';
import { getVehicleById, updateVehicle } from '../../services/vehicle-service.js';

// Pagina para editar un vehiculo existente.
function EditarVehiculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [vehiculo, setVehiculo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');

  useEffect(() => {
    let activo = true;

    getVehicleById(id)
      .then((respuesta) => {
        if (activo) setVehiculo(respuesta.data);
      })
      .catch((err) => {
        if (activo) setErrorCarga(err.message || 'No se pudo cargar el vehiculo.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const manejarActualizar = async (datos) => {
    setGuardando(true);
    setErrorGuardar('');
    try {
      await updateVehicle(id, datos);
      toast({
        title: 'Vehiculo actualizado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate(`/vehiculos/${id}`);
    } catch (err) {
      setErrorGuardar(err.message || 'No se pudo actualizar el vehiculo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout conSidebar>
      <Box mb={6}>
        <Heading as="h1" size="xl">
          Editar vehiculo
        </Heading>
        <Text fontSize="sm" color="secondary.600">
          Modifica los datos del vehiculo.
        </Text>
      </Box>

      {cargando && <Skeleton height="420px" borderRadius="lg" />}

      {!cargando && errorCarga && (
        <Alert status="error" borderRadius="md" fontSize="sm">
          <AlertIcon />
          {errorCarga}
        </Alert>
      )}

      {!cargando && !errorCarga && vehiculo && (
        <Box
          p={{ base: 5, md: 8 }}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
          boxShadow="sm"
        >
          {errorGuardar && (
            <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
              <AlertIcon />
              {errorGuardar}
            </Alert>
          )}

          <VehicleForm
            valorInicial={vehiculo}
            onSubmit={manejarActualizar}
            cargando={guardando}
            textoBoton="Guardar cambios"
            onCancelar={() => navigate(`/vehiculos/${id}`)}
          />
        </Box>
      )}
    </Layout>
  );
}

export default EditarVehiculo;
