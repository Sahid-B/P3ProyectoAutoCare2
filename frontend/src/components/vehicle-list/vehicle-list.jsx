import { SimpleGrid } from '@chakra-ui/react';
import VehicleCard from '../vehicle-card/index.jsx';

/**
 * Lista de vehiculos en forma de rejilla de tarjetas.
 * Los estados de carga, vacio y error los maneja la pagina contenedora.
 */
function VehicleList({ vehiculos = [], onVer, onEditar, onEliminar }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
      {vehiculos.map((vehiculo) => (
        <VehicleCard
          key={vehiculo.id}
          vehiculo={vehiculo}
          onVer={onVer}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      ))}
    </SimpleGrid>
  );
}

export default VehicleList;
