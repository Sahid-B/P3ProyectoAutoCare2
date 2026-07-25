// Servicio de sincronizacion offline para AutoCare.
import {
  getPendingOperations,
  removePendingOperation,
  saveVehicles,
  saveMaintenances,
} from './indexeddb-service.js';
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicles,
} from './vehicle-service.js';
import {
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenances,
} from './maintenance-service.js';

let sincronizando = false;

/**
 * Procesa la cola de operaciones pendientes almacenadas en IndexedDB.
 */
export async function procesarColaOperaciones() {
  if (sincronizando || !navigator.onLine) return;

  try {
    sincronizando = true;
    const operaciones = await getPendingOperations();
    if (!operaciones || operaciones.length === 0) {
      sincronizando = false;
      return;
    }

    console.log(`[sync-service] Iniciando sincronizacion de ${operaciones.length} operaciones pendientes...`);

    for (const op of operaciones) {
      try {
        switch (op.tipo) {
          case 'CREATE_VEHICLE':
            await createVehicle(op.payload);
            break;
          case 'UPDATE_VEHICLE':
            await updateVehicle(op.payload.id, op.payload);
            break;
          case 'DELETE_VEHICLE':
            await deleteVehicle(op.payload.id);
            break;
          case 'CREATE_MAINTENANCE':
            await createMaintenance(op.payload);
            break;
          case 'UPDATE_MAINTENANCE':
            await updateMaintenance(op.payload.id, op.payload);
            break;
          case 'DELETE_MAINTENANCE':
            await deleteMaintenance(op.payload.id);
            break;
          default:
            console.warn('[sync-service] Tipo de operacion desconocido:', op.tipo);
        }
        await removePendingOperation(op.id);
      } catch (err) {
        console.error(`[sync-service] Error procesando operacion ${op.tipo}:`, err.message);
        // Si es un error de conflicto o 404/403, eliminamos la operacion para no bloquear la cola infinita
        if (err.message.includes('404') || err.message.includes('403')) {
          await removePendingOperation(op.id);
        }
      }
    }

    // Tras sincronizar, refrescar los almacenes locales con la version autoritativa del servidor
    try {
      const [resVehicles, resMaintenances] = await Promise.all([
        getVehicles().catch(() => null),
        getMaintenances().catch(() => null),
      ]);

      if (resVehicles?.data) await saveVehicles(resVehicles.data);
      if (resMaintenances?.data) await saveMaintenances(resMaintenances.data);
    } catch (e) {
      console.warn('[sync-service] Error al refrescar almacenes locales:', e.message);
    }

    console.log('[sync-service] Sincronizacion completada con exito.');
  } finally {
    sincronizando = false;
  }
}

/** Escucha eventos de red para sincronizar automaticamente al recuperar internet. */
export function inicializarSincronizador() {
  window.addEventListener('online', () => {
    console.log('[sync-service] Conexion restablecida. Ejecutando cola de sincronizacion...');
    procesarColaOperaciones();
  });
}

export default {
  procesarColaOperaciones,
  inicializarSincronizador,
};
