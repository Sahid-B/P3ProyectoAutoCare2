import { peticion } from './api-service';

export function obtenerCitas() {
  return peticion('/citas');
}

export function solicitarCita(datos) {
  return peticion('/citas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function actualizarEstadoCita(id, estado) {
  return peticion(`/citas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}
