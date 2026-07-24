import { Box, Flex, Stack, Text } from '@chakra-ui/react';

// Pie de pagina con la informacion academica del proyecto.
function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <Box as="footer" mt="auto" bg="secondary.900" color="secondary.200">
      <Flex
        maxW="1140px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={8}
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'flex-start', sm: 'center' }}
        justify="space-between"
        gap={6}
      >
        <Box>
          <Text fontSize="lg" fontWeight="bold" color="white">
            AutoCare
          </Text>
          <Text fontSize="sm" color="secondary.300">
            Tu vehiculo siempre al dia
          </Text>
        </Box>

        <Stack spacing={1} textAlign={{ base: 'left', sm: 'right' }} fontSize="sm">
          <Text color="secondary.300">Grupo 5</Text>
          <Text color="secondary.300">Programacion Integrativa de Componentes Web</Text>
          <Text color="secondary.300">&copy; {anioActual}</Text>
        </Stack>
      </Flex>
    </Box>
  );
}

export default Footer;
