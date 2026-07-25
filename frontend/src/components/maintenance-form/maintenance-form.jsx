import { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  SimpleGrid,
  FormHelperText,
  FormErrorMessage,
  Alert,
  AlertIcon,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FaWandMagicSparkles, FaFloppyDisk } from 'react-icons/fa6';

import { sugerirProximoMantenimiento, REGLAS_TIPO_MANTENIMIENTO } from '../../utils/rule-engine.js';

const TIPOS_MANTENIMIENTO = Object.keys(REGLAS_TIPO_MANTENIMIENTO);

function MaintenanceForm({
  datosIniciales = null,
  vehiculos = [],
  alEnviar,
  cargando = false,
  errorServidor = '',
  vehicleIdPredefinido = null,
}) {
  const hoyStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    vehicle_id: vehicleIdPredefinido || datosIniciales?.vehicle_id || (vehiculos[0]?.id ? String(vehiculos[0].id) : ''),
    maintenance_type: datosIniciales?.maintenance_type || TIPOS_MANTENIMIENTO[0],
    date: datosIniciales?.date ? String(datosIniciales.date).split('T')[0] : hoyStr,
    kilometers: datosIniciales?.kilometers ?? '',
    cost: datosIniciales?.cost ?? '',
    workshop: datosIniciales?.workshop || '',
    description: datosIniciales?.description || '',
    next_date: datosIniciales?.next_date ? String(datosIniciales.next_date).split('T')[0] : '',
    next_kilometers: datosIniciales?.next_kilometers ?? '',
  });

  const [errores, setErrores] = useState({});

  // Selecciona por defecto el primer vehiculo cuando la lista llega. Patron
  // oficial de React de "ajustar estado durante el render" (evita setState
  // dentro de un useEffect).
  const [vehiculosVistos, setVehiculosVistos] = useState(vehiculos);
  if (vehiculos !== vehiculosVistos) {
    setVehiculosVistos(vehiculos);
    if (vehiculos.length > 0 && !form.vehicle_id) {
      setForm((prev) => ({ ...prev, vehicle_id: String(vehiculos[0].id) }));
    }
  }

  const vehiculoSeleccionado = vehiculos.find((v) => String(v.id) === String(form.vehicle_id));

  // Al cambiar el vehiculo seleccionado, sugiere su kilometraje actual si el
  // campo esta vacio (tambien ajustado en render, no en un efecto).
  const [vehicleIdPrevio, setVehicleIdPrevio] = useState(form.vehicle_id);
  if (form.vehicle_id !== vehicleIdPrevio) {
    setVehicleIdPrevio(form.vehicle_id);
    if (vehiculoSeleccionado && (!form.kilometers || form.kilometers === '0')) {
      setForm((prev) => ({
        ...prev,
        kilometers: String(vehiculoSeleccionado.kilometraje_actual || 0),
      }));
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const aplicarSugerenciasRuleEngine = () => {
    const sugerido = sugerirProximoMantenimiento(
      form.maintenance_type,
      form.date,
      form.kilometers !== '' ? Number(form.kilometers) : vehiculoSeleccionado?.kilometraje_actual || 0,
    );

    setForm((prev) => ({
      ...prev,
      next_date: sugerido.next_date || prev.next_date,
      next_kilometers: sugerido.next_kilometers !== null ? String(sugerido.next_kilometers) : prev.next_kilometers,
    }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.vehicle_id) nuevosErrores.vehicle_id = 'Debes seleccionar un vehiculo.';
    if (!form.maintenance_type) nuevosErrores.maintenance_type = 'El tipo de servicio es obligatorio.';
    if (!form.date) nuevosErrores.date = 'La fecha es obligatoria.';

    if (form.kilometers === '' || isNaN(form.kilometers) || Number(form.kilometers) < 0) {
      nuevosErrores.kilometers = 'Ingresa un kilometraje valido igual o mayor a 0.';
    }

    if (form.cost !== '' && (isNaN(form.cost) || Number(form.cost) < 0)) {
      nuevosErrores.cost = 'El costo debe ser igual o mayor a 0.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    alEnviar({
      vehicle_id: Number(form.vehicle_id),
      maintenance_type: form.maintenance_type,
      date: form.date,
      kilometers: Number(form.kilometers),
      cost: form.cost !== '' ? Number(form.cost) : 0,
      workshop: form.workshop || null,
      description: form.description || null,
      next_date: form.next_date || null,
      next_kilometers: form.next_kilometers !== '' ? Number(form.next_kilometers) : null,
    });
  };

  return (
    <Box as="form" onSubmit={handleSubmit} noValidate>
      {errorServidor && (
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          {errorServidor}
        </Alert>
      )}

      <VStack spacing={5} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired isInvalid={!!errores.vehicle_id}>
            <FormLabel fontWeight="medium">Vehiculo</FormLabel>
            <Select
              name="vehicle_id"
              value={form.vehicle_id}
              onChange={handleChange}
              placeholder="Selecciona un vehiculo"
              isDisabled={cargando || !!vehicleIdPredefinido}
            >
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} ({v.placa}) - {v.kilometraje_actual} km
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errores.vehicle_id}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errores.maintenance_type}>
            <FormLabel fontWeight="medium">Tipo de Mantenimiento</FormLabel>
            <Select
              name="maintenance_type"
              value={form.maintenance_type}
              onChange={handleChange}
              isDisabled={cargando}
            >
              {TIPOS_MANTENIMIENTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errores.maintenance_type}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl isRequired isInvalid={!!errores.date}>
            <FormLabel fontWeight="medium">Fecha de Realizacion</FormLabel>
            <Input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              isDisabled={cargando}
            />
            <FormErrorMessage>{errores.date}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errores.kilometers}>
            <FormLabel fontWeight="medium">Kilometraje del Servicio</FormLabel>
            <Input
              type="number"
              name="kilometers"
              value={form.kilometers}
              onChange={handleChange}
              placeholder="Ej: 45000"
              isDisabled={cargando}
            />
            <FormErrorMessage>{errores.kilometers}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errores.cost}>
            <FormLabel fontWeight="medium">Costo ($ USD)</FormLabel>
            <Input
              type="number"
              step="0.01"
              name="cost"
              value={form.cost}
              onChange={handleChange}
              placeholder="Ej: 45.50"
              isDisabled={cargando}
            />
            <FormErrorMessage>{errores.cost}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontWeight="medium">Taller / Proveedor</FormLabel>
            <Input
              name="workshop"
              value={form.workshop}
              onChange={handleChange}
              placeholder="Ej: Taller Central, Lubricentro Express"
              isDisabled={cargando}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="medium">Observaciones / Descripcion</FormLabel>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detalles adicionales del servicio..."
              rows={1}
              isDisabled={cargando}
            />
          </FormControl>
        </SimpleGrid>

        {/* Seccion de Motor de Reglas (Sugerencia de proximo servicio) */}
        <Box
          p={4}
          bg="secondary.50"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="md"
        >
          <HStack justify="space-between" mb={3} flexWrap="wrap">
            <FormLabel fontWeight="semibold" mb={0} fontSize="sm" color="brand.800">
              Proximo Mantenimiento (Calculado por Motor de Reglas)
            </FormLabel>
            <Button
              size="xs"
              colorScheme="brand"
              variant="outline"
              leftIcon={<FaWandMagicSparkles />}

              onClick={aplicarSugerenciasRuleEngine}
            >
              Autocalcular con Reglas
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="xs">Fecha Proxima Estimada</FormLabel>
              <Input
                type="date"
                name="next_date"
                value={form.next_date}
                onChange={handleChange}
                isDisabled={cargando}
                bg="white"
              />
              <FormHelperText fontSize="xs">Fecha limite sugerida para el proximo servicio.</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs">Kilometraje Proximo Estimado</FormLabel>
              <Input
                type="number"
                name="next_kilometers"
                value={form.next_kilometers}
                onChange={handleChange}
                placeholder="Ej: 50000"
                isDisabled={cargando}
                bg="white"
              />
              <FormHelperText fontSize="xs">Kilometraje objetivo para realizar la revision.</FormHelperText>
            </FormControl>
          </SimpleGrid>
        </Box>

        <Button
          type="submit"
          colorScheme="brand"
          size="lg"
          isLoading={cargando}
          leftIcon={<FaFloppyDisk />}

          mt={2}
        >
          Guardar Mantenimiento
        </Button>
      </VStack>
    </Box>
  );
}

export default MaintenanceForm;
