import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertIcon, Box, Flex, Heading, Spinner, Text, useToast } from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import ProductoForm from '../../components/producto-form/index.jsx';
import {
  obtenerCategorias,
  obtenerMiProducto,
  actualizarProducto,
} from '../../services/repuestos-service.js';

function EditarProducto() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCarga, setErrorCarga] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const [respuestaProducto, respuestaCategorias] = await Promise.all([
          obtenerMiProducto(id),
          obtenerCategorias(),
        ]);

        if (!activo) return;
        setProducto(respuestaProducto.producto);
        setCategorias(respuestaCategorias.categorias || []);
      } catch (error) {
        if (activo) setErrorCarga(error.message || 'No se pudo cargar el producto.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [id]);

  const manejarGuardado = async (datos) => {
    setErrorMsg('');

    try {
      setGuardando(true);
      await actualizarProducto(id, datos);

      toast({
        title: 'Producto actualizado',
        description: `Los cambios en "${datos.nombre}" se guardaron correctamente.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      navigate('/mis-productos');
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo actualizar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Layout conSidebar>
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
        </Flex>
      </Layout>
    );
  }

  if (errorCarga) {
    return (
      <Layout conSidebar>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {errorCarga}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout conSidebar>
      <Box maxW="900px">
        <Heading as="h1" size="lg" color="secondary.900" mb={1}>
          Editar producto
        </Heading>
        <Text color="secondary.600" mb={6}>
          Actualiza los datos, el precio o el stock de "{producto?.nombre}".
        </Text>

        <ProductoForm
          valoresIniciales={producto}
          categorias={categorias}
          alGuardar={manejarGuardado}
          guardando={guardando}
          errorGeneral={errorMsg}
          textoBoton="Guardar cambios"
          alCancelar={() => navigate('/mis-productos')}
        />
      </Box>
    </Layout>
  );
}

export default EditarProducto;
