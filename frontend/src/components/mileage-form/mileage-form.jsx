import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
  HStack,
} from '@chakra-ui/react';

/**
 * Formulario para actualizar unicamente el kilometraje de un vehiculo.
 * No permite valores negativos ni un valor menor que el kilometraje actual.
 */
function MileageForm({ kilometrajeActual = 0, onSubmit, cargando = false, onCancelar }) {
  const [valor, setValor] = useState(String(kilometrajeActual ?? ''));
  const [error, setError] = useState('');

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    if (cargando) return;

    const km = Number(valor);

    if (valor === '' || !Number.isInteger(km)) {
      setError('Ingresa un kilometraje valido.');
      return;
    }
    if (km < 0) {
      setError('El kilometraje no puede ser negativo.');
      return;
    }
    if (km < kilometrajeActual) {
      setError(`El nuevo kilometraje no puede ser menor que el actual (${kilometrajeActual} km).`);
      return;
    }

    setError('');
    onSubmit(km);
  };

  return (
    <Box as="form" onSubmit={manejarEnvio} noValidate>
      <FormControl isRequired isInvalid={Boolean(error)}>
        <FormLabel>Nuevo kilometraje</FormLabel>
        <Input
          type="number"
          value={valor}
          onChange={(evento) => {
            setValor(evento.target.value);
            setError('');
          }}
          min={kilometrajeActual}
          autoFocus
        />
        {error ? (
          <FormErrorMessage>{error}</FormErrorMessage>
        ) : (
          <FormHelperText>Kilometraje actual: {kilometrajeActual} km</FormHelperText>
        )}
      </FormControl>

      <HStack spacing={3} mt={5}>
        <Button type="submit" variant="primary" isLoading={cargando} loadingText="Guardando">
          Actualizar kilometraje
        </Button>
        {onCancelar && (
          <Button variant="secondary" onClick={onCancelar} isDisabled={cargando}>
            Cancelar
          </Button>
        )}
      </HStack>
    </Box>
  );
}

export default MileageForm;
