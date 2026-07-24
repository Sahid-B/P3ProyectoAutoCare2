import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Text, Alert, AlertIcon, useToast } from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import VehicleForm from '../../components/vehicle-form/index.jsx';
import { createVehicle } from '../../services/vehicle-service.js';

// Pagina para registrar un nuevo vehiculo.
function NuevoVehiculo() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarCrear = async (datos) => {
    setCargando(true);
    setError('');
    try {
      await createVehicle(datos);
      toast({
        title: 'Vehiculo registrado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/vehiculos');
    } catch (err) {
      setError(err.message || 'No se pudo registrar el vehiculo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Layout conSidebar>
      <Box mb={6}>
        <Heading as="h1" size="xl">
          Registrar vehiculo
        </Heading>
        <Text fontSize="sm" color="secondary.600">
          Completa los datos del vehiculo.
        </Text>
      </Box>

      {error && (
        <Alert status="error" borderRadius="md" mb={6} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Box
        p={{ base: 5, md: 8 }}
        bg="white"
        borderWidth="1px"
        borderColor="secondary.200"
        borderRadius="lg"
        boxShadow="sm"
      >
        <VehicleForm
          onSubmit={manejarCrear}
          cargando={cargando}
          textoBoton="Registrar vehiculo"
          onCancelar={() => navigate('/vehiculos')}
        />
      </Box>
    </Layout>
  );
}

export default NuevoVehiculo;
