import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { FaDollarSign, FaCalendarDays, FaChartPie } from 'react-icons/fa6';


function ExpenseCard({ gastoTotal = 0, gastoMes = 0, totalVehiculos = 1 }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  const promedioPorVehiculo = totalVehiculos > 0 ? gastoTotal / totalVehiculos : 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
      <Box p={5} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="lg" boxShadow="sm">
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center" justify="center" boxSize="42px" bg="green.50" borderRadius="md">
            <Icon as={FaDollarSign} boxSize={5} color="green.600" />
          </Flex>
        </Flex>
        <Stat>
          <StatLabel color="secondary.500">Gastos Totales</StatLabel>
          <StatNumber color="brand.800">{formatCurrency(gastoTotal)}</StatNumber>
          <StatHelpText color="secondary.500" mb={0}>
            Inversion total en mantenimientos
          </StatHelpText>
        </Stat>
      </Box>

      <Box p={5} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="lg" boxShadow="sm">
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center" justify="center" boxSize="42px" bg="blue.50" borderRadius="md">
            <Icon as={FaCalendarDays} boxSize={5} color="blue.600" />
          </Flex>

        </Flex>
        <Stat>
          <StatLabel color="secondary.500">Gastos del Mes</StatLabel>
          <StatNumber color="brand.800">{formatCurrency(gastoMes)}</StatNumber>
          <StatHelpText color="secondary.500" mb={0}>
            Servicios realizados en el mes actual
          </StatHelpText>
        </Stat>
      </Box>

      <Box p={5} bg="white" borderWidth="1px" borderColor="secondary.200" borderRadius="lg" boxShadow="sm">
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center" justify="center" boxSize="42px" bg="purple.50" borderRadius="md">
            <Icon as={FaChartPie} boxSize={5} color="purple.600" />
          </Flex>
        </Flex>
        <Stat>
          <StatLabel color="secondary.500">Promedio por Vehiculo</StatLabel>
          <StatNumber color="brand.800">{formatCurrency(promedioPorVehiculo)}</StatNumber>
          <StatHelpText color="secondary.500" mb={0}>
            Costo promedio por cada auto
          </StatHelpText>
        </Stat>
      </Box>
    </SimpleGrid>
  );
}

export default ExpenseCard;
