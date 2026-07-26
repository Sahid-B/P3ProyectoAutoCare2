import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Text, useToast } from '@chakra-ui/react';
import Layout from '../../components/layout/index.jsx';
import ProductoForm from '../../components/producto-form/index.jsx';
import { obtenerCategorias, crearProducto } from '../../services/repuestos-service.js';

function NuevoProducto() {
  const [categorias, setCategorias] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    let activo = true;

    obtenerCategorias()
      .then((respuesta) => {
        if (activo) setCategorias(respuesta.categorias || []);
      })
      .catch((error) => {
        if (activo) setErrorMsg(error.message || 'No se pudieron cargar las categorias.');
      });

    return () => {
      activo = false;
    };
  }, []);

  const manejarGuardado = async (datos) => {
    setErrorMsg('');

    try {
      setGuardando(true);
      await crearProducto(datos);

      toast({
        title: 'Producto creado',
        description: `"${datos.nombre}" ya esta disponible en el catalogo.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      navigate('/mis-productos');
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo crear el producto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout conSidebar>
      <Box maxW="900px">
        <Heading as="h1" size="lg" color="secondary.900" mb={1}>
          Nuevo producto
        </Heading>
        <Text color="secondary.600" mb={6}>
          Publica un repuesto nuevo en tu tienda. Los clientes lo veran en el catalogo.
        </Text>

        <ProductoForm
          categorias={categorias}
          alGuardar={manejarGuardado}
          guardando={guardando}
          errorGeneral={errorMsg}
          textoBoton="Crear producto"
          alCancelar={() => navigate('/mis-productos')}
        />
      </Box>
    </Layout>
  );
}

export default NuevoProducto;
