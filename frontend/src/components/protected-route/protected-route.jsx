import { Navigate } from 'react-router-dom';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../../context/auth-context.jsx';

// Pagina de inicio de cada rol. Se usa para redirigir cuando alguien intenta
// entrar a una ruta que no le corresponde.
const INICIO_POR_ROL = {
  admin: '/admin',
  taller: '/taller-dashboard',
  vendedor_repuestos: '/vendedor-dashboard',
};

/**
 * Componente para proteger rutas privadas.
 * Si la sesion esta cargando, muestra un indicador.
 * Si el usuario no esta autenticado, redirige a /login.
 * Con rolesPermitidos se limita el acceso a determinados roles.
 */
function ProtectedRoute({ children, requireAdmin = false, rolesPermitidos = null }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="secondary.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="md" color="secondary.600">
            Verificando sesion...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && usuario.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to={INICIO_POR_ROL[usuario.rol] || '/dashboard'} replace />;
  }

  return children;
}

export default ProtectedRoute;
