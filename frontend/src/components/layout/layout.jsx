import { Box, Flex, Grid } from '@chakra-ui/react';
import Header from '../header/index.jsx';
import Footer from '../footer/index.jsx';
import Sidebar from '../sidebar/index.jsx';
import OnlineStatus from '../online-status/index.jsx';

/**
 * Estructura comun de las paginas: Header + contenido + Footer.
 * Con conSidebar={true} se muestra ademas el menu lateral del area privada
 * y el indicador de conexion (OnlineStatus).
 */
function Layout({ children, conSidebar = false }) {
  return (
    <Flex direction="column" minH="100vh">
      <Header />

      {/* Aviso de conexion en el area autenticada */}
      {conSidebar && <OnlineStatus />}

      <Box as="main" flex="1" w="100%">
        {conSidebar ? (
          <Grid
            maxW="1140px"
            mx="auto"
            px={{ base: 4, md: 6 }}
            py={{ base: 6, md: 8 }}
            gap={{ base: 6, lg: 8 }}
            templateColumns={{ base: '1fr', lg: '250px 1fr' }}
            alignItems="start"
          >
            <Sidebar />
            <Box minW="0">{children}</Box>
          </Grid>
        ) : (
          children
        )}
      </Box>

      <Footer />
    </Flex>
  );
}

export default Layout;
