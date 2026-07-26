// Servicio de IndexedDB para vehiculos, mantenimientos y operaciones pendientes (Parte 4).
import { openDB } from 'idb';

const DB_NAME = 'autocare-db';
// Version 3: se agrega el almacen de productos para consultar el catalogo de
// repuestos sin conexion. Los almacenes anteriores no se tocan.
const DB_VERSION = 3;
const STORE_VEHICLES = 'vehicles';
const STORE_MAINTENANCES = 'maintenances';
const STORE_PENDING = 'pending_operations';
const STORE_PRODUCTS = 'products';

let dbPromise = null;

/** Abre (o crea/actualiza) la base de datos IndexedDB y sus almacenes. */
export function initDatabase() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_VEHICLES)) {
          db.createObjectStore(STORE_VEHICLES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PENDING)) {
          db.createObjectStore(STORE_PENDING, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORE_MAINTENANCES)) {
          db.createObjectStore(STORE_MAINTENANCES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
          db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// --- Vehiculos ---

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

// --- Mantenimientos ---

/** Reemplaza el listado local de mantenimientos. */
export async function saveMaintenances(maintenances = []) {
  const db = await initDatabase();
  const tx = db.transaction(STORE_MAINTENANCES, 'readwrite');
  await tx.store.clear();
  for (const item of maintenances) {
    await tx.store.put(item);
  }
  await tx.done;
}

/** Devuelve todos los mantenimientos guardados localmente. */
export async function getMaintenances() {
  const db = await initDatabase();
  return db.getAll(STORE_MAINTENANCES);
}

/** Devuelve un mantenimiento por ID local. */
export async function getMaintenance(id) {
  const db = await initDatabase();
  return db.get(STORE_MAINTENANCES, Number(id));
}

/** Guarda o actualiza un mantenimiento localmente. */
export async function saveMaintenance(maintenance) {
  const db = await initDatabase();
  return db.put(STORE_MAINTENANCES, maintenance);
}

/** Elimina un mantenimiento local. */
export async function deleteMaintenance(id) {
  const db = await initDatabase();
  return db.delete(STORE_MAINTENANCES, Number(id));
}

// --- Catalogo de repuestos ---
//
// Solo se guarda una copia de lectura del catalogo para poder consultarlo sin
// conexion. Las compras nunca se confirman offline: el stock y el pago se
// validan siempre contra el backend.

/** Reemplaza la copia local del catalogo de repuestos. */
export async function saveProducts(products = []) {
  const db = await initDatabase();
  const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
  await tx.store.clear();
  for (const producto of products) {
    await tx.store.put(producto);
  }
  await tx.done;
}

/** Devuelve el catalogo guardado localmente. */
export async function getProducts() {
  const db = await initDatabase();
  return db.getAll(STORE_PRODUCTS);
}

/** Devuelve un producto del catalogo local por id. */
export async function getProduct(id) {
  const db = await initDatabase();
  return db.get(STORE_PRODUCTS, Number(id));
}

// --- Cola de operaciones pendientes ---

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

/** Elimina una operacion pendiente por su id. */
export async function removePendingOperation(id) {
  const db = await initDatabase();
  return db.delete(STORE_PENDING, id);
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
  saveMaintenances,
  getMaintenances,
  getMaintenance,
  saveMaintenance,
  deleteMaintenance,
  saveProducts,
  getProducts,
  getProduct,
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  clearPendingOperations,
};
