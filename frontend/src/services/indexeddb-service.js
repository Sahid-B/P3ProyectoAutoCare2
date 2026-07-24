// Servicio de IndexedDB inicial para el modulo de vehiculos (Parte 3).
//
// Objetivo de esta etapa:
//   - Guardar localmente el ultimo listado de vehiculos recibido del backend.
//   - Permitir mostrar esos vehiculos si la conexion falla (modo lectura offline).
//   - Dejar preparado un almacen "pending_operations" para la FUTURA cola de
//     sincronizacion (Parte 4). En esta parte NO se sincroniza nada todavia.
//
// Se usa la libreria "idb" (envoltura ligera sobre IndexedDB). No se usa
// localStorage para los datos de vehiculos.
import { openDB } from 'idb';

const DB_NAME = 'autocare-db';
const DB_VERSION = 1;
const STORE_VEHICLES = 'vehicles';
const STORE_PENDING = 'pending_operations';

let dbPromise = null;

/** Abre (o crea) la base de datos IndexedDB y sus almacenes. */
export function initDatabase() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_VEHICLES)) {
          db.createObjectStore(STORE_VEHICLES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PENDING)) {
          // Almacen preparado para la cola de sincronizacion futura (Parte 4).
          db.createObjectStore(STORE_PENDING, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

/** Reemplaza el listado local con el ultimo listado recibido del backend. */
export async function saveVehicles(vehicles = []) {
  const db = await initDatabase();
  const tx = db.transaction(STORE_VEHICLES, 'readwrite');
  await tx.store.clear();
  for (const vehiculo of vehicles) {
    await tx.store.put(vehiculo);
  }
  await tx.done;
}

/** Devuelve todos los vehiculos guardados localmente. */
export async function getVehicles() {
  const db = await initDatabase();
  return db.getAll(STORE_VEHICLES);
}

/** Devuelve un vehiculo local por id. */
export async function getVehicle(id) {
  const db = await initDatabase();
  return db.get(STORE_VEHICLES, Number(id));
}

/** Inserta o actualiza un vehiculo en el almacen local. */
export async function saveVehicle(vehicle) {
  const db = await initDatabase();
  return db.put(STORE_VEHICLES, vehicle);
}

/** Elimina un vehiculo del almacen local. */
export async function deleteVehicle(id) {
  const db = await initDatabase();
  return db.delete(STORE_VEHICLES, Number(id));
}

// --- Cola de operaciones pendientes (preparada para la Parte 4) ---
// En la Parte 3 estas funciones existen pero la sincronizacion real NO se
// implementa. No se debe simular que una operacion llego al backend.

/** Agrega una operacion pendiente de sincronizar. */
export async function addPendingOperation(operacion) {
  const db = await initDatabase();
  return db.add(STORE_PENDING, { ...operacion, createdAt: new Date().toISOString() });
}

/** Devuelve las operaciones pendientes almacenadas. */
export async function getPendingOperations() {
  const db = await initDatabase();
  return db.getAll(STORE_PENDING);
}

/** Vacia la cola de operaciones pendientes. */
export async function clearPendingOperations() {
  const db = await initDatabase();
  return db.clear(STORE_PENDING);
}

export default {
  initDatabase,
  saveVehicles,
  getVehicles,
  getVehicle,
  saveVehicle,
  deleteVehicle,
  addPendingOperation,
  getPendingOperations,
  clearPendingOperations,
};
