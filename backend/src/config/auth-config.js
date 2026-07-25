// Configuracion centralizada de JWT para AutoCare.
// Unica fuente de verdad: tanto auth-controller (firma) como auth-middleware
// (verificacion) deben importar JWT_SECRET desde aqui para evitar desajustes.

const NODE_ENV = process.env.NODE_ENV || 'development';

// Valor SOLO para desarrollo. No es un secreto real: existe unicamente para que
// el entorno local funcione sin configurar nada. En produccion el backend falla
// si JWT_SECRET no esta definido.
const DEV_ONLY_SECRET = 'autocare_dev_only_secret_not_for_production';

const secretConfigurado = process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

let JWT_SECRET;
if (secretConfigurado) {
  JWT_SECRET = secretConfigurado;
} else if (NODE_ENV === 'production') {
  // Nunca se imprime el valor; solo se informa la ausencia.
  throw new Error(
    '[auth-config] JWT_SECRET no esta definido. Configura JWT_SECRET en el entorno para produccion.',
  );
} else {
  console.warn(
    '[auth-config] JWT_SECRET no definido: se usa un valor de desarrollo. No usar en produccion.',
  );
  JWT_SECRET = DEV_ONLY_SECRET;
}

const JWT_EXPIRES_IN =
  (process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN.trim()) || '24h';

module.exports = { JWT_SECRET, JWT_EXPIRES_IN };
