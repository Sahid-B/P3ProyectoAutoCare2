// Capa de servicio de pagos de AutoCare.
//
// Dos modos, seleccionados por variables de entorno (nunca credenciales en el codigo):
//
// 1. PayPal Sandbox: se activa cuando existen PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET.
//    Se usa la API REST oficial (Orders v2): crear orden -> el cliente aprueba ->
//    capturar orden. La compra solo se marca como pagada si PayPal responde
//    con status COMPLETED.
//
// 2. Modo simulado (solo desarrollo): se activa con PAGOS_MODO_SIMULADO=true y
//    NODE_ENV distinto de production. Emula la misma interfaz (crear + capturar)
//    y devuelve un identificador de transaccion. Nunca se activa en produccion.
//
// En ambos casos la compra se marca como pagada unicamente al recibir una
// respuesta valida de la capa de pago; nunca al crear el pedido.

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const MONEDA = process.env.PAGOS_MONEDA || 'USD';

function paypalConfigurado() {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

function simulacionHabilitada() {
  return process.env.NODE_ENV !== 'production' && process.env.PAGOS_MODO_SIMULADO === 'true';
}

/**
 * Metodos de pago que el backend puede procesar en este momento.
 * El frontend usa esta informacion para mostrar solo las opciones reales.
 */
function metodosDisponibles() {
  const metodos = [];
  if (paypalConfigurado()) {
    metodos.push({
      id: 'paypal',
      nombre: 'PayPal (Sandbox)',
      descripcion: 'Pago mediante la cuenta de pruebas de PayPal Sandbox.',
      clientId: PAYPAL_CLIENT_ID,
    });
  }
  if (simulacionHabilitada()) {
    metodos.push({
      id: 'simulado',
      nombre: 'Pago simulado (desarrollo)',
      descripcion: 'Modo de desarrollo. No mueve dinero real ni contacta a PayPal.',
    });
  }
  return metodos;
}

function metodoSoportado(metodo) {
  return metodosDisponibles().some((item) => item.id === metodo);
}

/**
 * Token OAuth 2.0 de PayPal (client_credentials).
 */
async function obtenerTokenPayPal() {
  const credenciales = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const respuesta = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credenciales}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!respuesta.ok) {
    throw new Error(`PayPal rechazo las credenciales (HTTP ${respuesta.status}).`);
  }

  const datos = await respuesta.json();
  return datos.access_token;
}

/**
 * Crea la orden de pago. Devuelve el identificador de la orden y, en PayPal,
 * la URL de aprobacion a la que se redirige al cliente.
 */
async function crearOrden({ metodo, total, referencia }) {
  const importe = Number(total).toFixed(2);

  if (metodo === 'paypal') {
    if (!paypalConfigurado()) {
      throw new Error('PayPal no esta configurado en el servidor.');
    }

    const token = await obtenerTokenPayPal();
    const respuesta = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: String(referencia),
            description: `AutoCare - pedido ${referencia}`,
            amount: { currency_code: MONEDA, value: importe },
          },
        ],
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.id) {
      throw new Error(datos?.message || 'PayPal no pudo crear la orden de pago.');
    }

    const aprobacion = (datos.links || []).find((enlace) => enlace.rel === 'approve');

    return {
      metodo: 'paypal',
      ordenId: datos.id,
      urlAprobacion: aprobacion?.href || null,
      estado: datos.status,
    };
  }

  if (metodo === 'simulado') {
    if (!simulacionHabilitada()) {
      throw new Error('El modo de pago simulado no esta habilitado en este entorno.');
    }

    return {
      metodo: 'simulado',
      ordenId: `SIM-${referencia}-${Date.now()}`,
      urlAprobacion: null,
      estado: 'CREATED',
    };
  }

  throw new Error('Metodo de pago no soportado.');
}

/**
 * Confirma el cobro. Devuelve { pagado, transaccionId, estado }.
 * Solo devuelve pagado=true con una respuesta valida del proveedor.
 */
async function capturarOrden({ metodo, ordenId }) {
  if (metodo === 'paypal') {
    if (!paypalConfigurado()) {
      throw new Error('PayPal no esta configurado en el servidor.');
    }

    const token = await obtenerTokenPayPal();
    const respuesta = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(ordenId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      return {
        pagado: false,
        transaccionId: null,
        estado: datos?.name || `HTTP_${respuesta.status}`,
        mensaje: datos?.message || 'PayPal rechazo la captura del pago.',
      };
    }

    const captura = datos?.purchase_units?.[0]?.payments?.captures?.[0];
    const completado = datos.status === 'COMPLETED' && captura?.status === 'COMPLETED';

    return {
      pagado: completado,
      transaccionId: completado ? captura.id : null,
      estado: datos.status,
      mensaje: completado ? 'Pago aprobado por PayPal.' : 'PayPal no confirmo el pago.',
    };
  }

  if (metodo === 'simulado') {
    if (!simulacionHabilitada()) {
      throw new Error('El modo de pago simulado no esta habilitado en este entorno.');
    }

    if (!ordenId || !String(ordenId).startsWith('SIM-')) {
      return {
        pagado: false,
        transaccionId: null,
        estado: 'INVALID_ORDER',
        mensaje: 'La orden simulada no es valida.',
      };
    }

    return {
      pagado: true,
      transaccionId: `SIMTX-${String(ordenId).slice(4)}`,
      estado: 'COMPLETED',
      mensaje: 'Pago simulado aprobado (modo desarrollo).',
    };
  }

  throw new Error('Metodo de pago no soportado.');
}

module.exports = {
  paypalConfigurado,
  simulacionHabilitada,
  metodosDisponibles,
  metodoSoportado,
  crearOrden,
  capturarOrden,
  MONEDA,
};
