// Servicio del frontend para el modulo de vehiculos.
// Reutiliza la funcion peticion() de api-service.js, que ya adjunta el token
// JWT automaticamente. Aqui NO se duplica ninguna logica de autenticacion.
import { peticion } from './api-service.js';

/** GET /api/vehicles - lista los vehiculos del usuario autenticado. */
export function getVehicles() {
  return peticion('/vehicles');
}

/** GET /api/vehicles/:id - obtiene un vehiculo del usuario autenticado. */
export function getVehicleById(id) {
  return peticion(`/vehicles/${id}`);
}

/** POST /api/vehicles - registra un vehiculo. */
export function createVehicle(datos) {
  return peticion('/vehicles', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/** PUT /api/vehicles/:id - actualiza un vehiculo completo. */
export function updateVehicle(id, datos) {
  return peticion(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/** PATCH /api/vehicles/:id/mileage - actualiza solo el kilometraje. */
export function updateVehicleMileage(id, kilometraje) {
  return peticion(`/vehicles/${id}/mileage`, {
    method: 'PATCH',
    body: JSON.stringify({ kilometraje_actual: kilometraje }),
  });
}

/** DELETE /api/vehicles/:id - elimina un vehiculo. */
export function deleteVehicle(id) {
  return peticion(`/vehicles/${id}`, {
    method: 'DELETE',
  });
}

export default {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleMileage,
  deleteVehicle,
};
