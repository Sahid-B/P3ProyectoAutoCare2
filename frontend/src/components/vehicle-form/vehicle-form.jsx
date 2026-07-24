import { useState } from 'react';
import {
  Box,
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  Button,
  HStack,
} from '@chakra-ui/react';
import { TIPOS_VEHICULO } from '../../constants/vehicle-types.js';

const ANIO_MIN = 1900;
const ANIO_MAX = new Date().getFullYear() + 1;

const VALORES_INICIALES = {
  marca: '',
  modelo: '',
  anio: '',
  placa: '',
  color: '',
  tipo_vehiculo: 'automovil',
  kilometraje_actual: '',
  imagen_url: '',
  observaciones: '',
};

/** Normaliza la placa: sin espacios y en mayusculas. */
function normalizarPlaca(placa) {
  return String(placa).trim().toUpperCase().replace(/\s+/g, '');
}

/** Construye el estado inicial del formulario a partir de un vehiculo (o vacio). */
function construirEstado(valorInicial) {
  if (!valorInicial) return VALORES_INICIALES;
  return {
    marca: valorInicial.marca ?? '',
    modelo: valorInicial.modelo ?? '',
    anio: valorInicial.anio ?? '',
    placa: valorInicial.placa ?? '',
    color: valorInicial.color ?? '',
    tipo_vehiculo: valorInicial.tipo_vehiculo ?? 'automovil',
    // El operador ?? conserva el 0 (solo reemplaza null/undefined por '').
    kilometraje_actual: valorInicial.kilometraje_actual ?? '',
    imagen_url: valorInicial.imagen_url ?? '',
    observaciones: valorInicial.observaciones ?? '',
  };
}

/**
 * Formulario reutilizable para crear o editar un vehiculo.
 * En modo edicion, la pagina monta este formulario solo cuando el vehiculo ya
 * fue cargado, por lo que el estado inicial se toma directamente de valorInicial.
 * Aunque valida en el frontend, la validacion definitiva la hace el backend.
 */
function VehicleForm({ valorInicial, onSubmit, cargando = false, textoBoton = 'Guardar', onCancelar }) {
  const [form, setForm] = useState(() => construirEstado(valorInicial));
  const [errores, setErrores] = useState({});

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setForm((anterior) => ({ ...anterior, [name]: value }));
    setErrores((anterior) => ({ ...anterior, [name]: '' }));
  };

  const validar = () => {
    const nuevos = {};

    if (!form.marca.trim()) nuevos.marca = 'La marca es obligatoria.';
    if (!form.modelo.trim()) nuevos.modelo = 'El modelo es obligatorio.';
    if (!String(form.placa).trim()) nuevos.placa = 'La placa es obligatoria.';

    const anio = Number(form.anio);
    if (!form.anio || !Number.isInteger(anio)) {
      nuevos.anio = 'Ingresa un anio valido.';
    } else if (anio < ANIO_MIN || anio > ANIO_MAX) {
      nuevos.anio = `El anio debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`;
    }

    if (form.kilometraje_actual !== '' && form.kilometraje_actual !== null) {
      const km = Number(form.kilometraje_actual);
      if (!Number.isInteger(km) || km < 0) {
        nuevos.kilometraje_actual = 'El kilometraje debe ser un numero igual o mayor que cero.';
      }
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    if (cargando) return; // evita doble envio
    if (!validar()) return;

    const datos = {
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: Number(form.anio),
      placa: normalizarPlaca(form.placa),
      color: form.color.trim(),
      tipo_vehiculo: form.tipo_vehiculo,
      kilometraje_actual: form.kilometraje_actual === '' ? 0 : Number(form.kilometraje_actual),
      imagen_url: form.imagen_url.trim(),
      observaciones: form.observaciones.trim(),
    };

    onSubmit(datos);
  };

  return (
    <Box as="form" onSubmit={manejarEnvio} noValidate>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={4}>
        <FormControl mb={4} isRequired isInvalid={Boolean(errores.marca)}>
          <FormLabel>Marca</FormLabel>
          <Input name="marca" value={form.marca} onChange={manejarCambio} placeholder="Chevrolet" />
          <FormErrorMessage>{errores.marca}</FormErrorMessage>
        </FormControl>

        <FormControl mb={4} isRequired isInvalid={Boolean(errores.modelo)}>
          <FormLabel>Modelo</FormLabel>
          <Input name="modelo" value={form.modelo} onChange={manejarCambio} placeholder="Aveo" />
          <FormErrorMessage>{errores.modelo}</FormErrorMessage>
        </FormControl>

        <FormControl mb={4} isRequired isInvalid={Boolean(errores.anio)}>
          <FormLabel>Anio</FormLabel>
          <Input
            type="number"
            name="anio"
            value={form.anio}
            onChange={manejarCambio}
            placeholder="2015"
            min={ANIO_MIN}
            max={ANIO_MAX}
          />
          <FormErrorMessage>{errores.anio}</FormErrorMessage>
        </FormControl>

        <FormControl mb={4} isRequired isInvalid={Boolean(errores.placa)}>
          <FormLabel>Placa</FormLabel>
          <Input
            name="placa"
            value={form.placa}
            onChange={manejarCambio}
            placeholder="PCX1234"
            textTransform="uppercase"
          />
          <FormErrorMessage>{errores.placa}</FormErrorMessage>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Color</FormLabel>
          <Input name="color" value={form.color} onChange={manejarCambio} placeholder="Rojo" />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Tipo de vehiculo</FormLabel>
          <Select name="tipo_vehiculo" value={form.tipo_vehiculo} onChange={manejarCambio}>
            {TIPOS_VEHICULO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl mb={4} isInvalid={Boolean(errores.kilometraje_actual)}>
          <FormLabel>Kilometraje actual</FormLabel>
          <Input
            type="number"
            name="kilometraje_actual"
            value={form.kilometraje_actual}
            onChange={manejarCambio}
            placeholder="85000"
            min={0}
          />
          <FormErrorMessage>{errores.kilometraje_actual}</FormErrorMessage>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Imagen (URL opcional)</FormLabel>
          <Input
            name="imagen_url"
            value={form.imagen_url}
            onChange={manejarCambio}
            placeholder="https://..."
          />
        </FormControl>
      </SimpleGrid>

      <FormControl mb={6}>
        <FormLabel>Observaciones</FormLabel>
        <Textarea
          name="observaciones"
          value={form.observaciones}
          onChange={manejarCambio}
          placeholder="Notas adicionales del vehiculo (opcional)"
          rows={3}
        />
      </FormControl>

      <HStack spacing={3}>
        <Button type="submit" variant="primary" isLoading={cargando} loadingText="Guardando">
          {textoBoton}
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

export default VehicleForm;
