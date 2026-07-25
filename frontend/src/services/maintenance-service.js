// Servicio de API para el modulo de mantenimientos.
import { peticion } from './api-service.js';

/** GET /api/maintenances - Obtener mantenimientos del usuario. */
export function getMaintenances(vehicleId = null) {
  const query = vehicleId ? `?vehicle_id=${vehicleId}` : '';
  return peticion(`/maintenances${query}`);
}

/** GET /api/maintenances/stats - Obtener estadisticas de mantenimientos. */
export function getMaintenanceStats() {
  return peticion('/maintenances/stats');
}

/** GET /api/maintenances/:id - Obtener un mantenimiento por ID. */
export function getMaintenanceById(id) {
  return peticion(`/maintenances/${id}`);
}

/** POST /api/maintenances - Crear un mantenimiento. */
export function createMaintenance(datos) {
  return peticion('/maintenances', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/** PUT /api/maintenances/:id - Actualizar un mantenimiento. */
export function updateMaintenance(id, datos) {
  return peticion(`/maintenances/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/** DELETE /api/maintenances/:id - Eliminar un mantenimiento. */
export function deleteMaintenance(id) {
  return peticion(`/maintenances/${id}`, {
    method: 'DELETE',
  });
}

export default {
  getMaintenances,
  getMaintenanceStats,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
};
