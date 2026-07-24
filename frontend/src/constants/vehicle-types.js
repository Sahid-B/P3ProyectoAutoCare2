// Tipos de vehiculo aceptados por AutoCare.
// El "value" coincide con los valores canonicos que valida el backend.
export const TIPOS_VEHICULO = [
  { value: 'automovil', label: 'Automovil' },
  { value: 'motocicleta', label: 'Motocicleta' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'suv', label: 'SUV' },
  { value: 'camion', label: 'Camion' },
  { value: 'otro', label: 'Otro' },
];

/** Devuelve la etiqueta legible de un tipo de vehiculo. */
export function etiquetaTipo(valor) {
  const tipo = TIPOS_VEHICULO.find((item) => item.value === valor);
  return tipo ? tipo.label : 'Otro';
}
