// Servicio de Notificaciones Push y Alertas del Service Worker.

/** Solicita permiso de notificaciones al usuario. */
export async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    console.warn('[notification-service] Las notificaciones no son soportadas en este navegador.');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permiso = await Notification.requestPermission();
    return permiso;
  }

  return 'denied';
}

/** Envia una notificacion Push local mediante el Service Worker o el objeto Notification. */
export async function mostrarNotificacionPush(titulo, opciones = {}) {
  const permiso = await solicitarPermisoNotificaciones();
  if (permiso !== 'granted') return;

  const defaultOps = {
    body: opciones.body || 'Tienes un recordatorio de mantenimiento en AutoCare.',
    icon: opciones.icon || '/logo-autocare.png',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: opciones.data || {},
  };

  if ('serviceWorker' in navigator) {
    const registroSW = await navigator.serviceWorker.ready.catch(() => null);
    if (registroSW && 'showNotification' in registroSW) {
      await registroSW.showNotification(titulo, defaultOps);
      return;
    }
  }

  // Fallback a notificacion del sistema estándar
  new Notification(titulo, defaultOps);
}

/** Comprueba una lista de mantenimientos y dispara notificaciones para aquellos proximos o vencidos. */
export function comprobarYNotificarMantenimientos(alertas = []) {
  if (!alertas || alertas.length === 0) return;

  const notificadosGuardados = JSON.parse(localStorage.getItem('autocare_notificados') || '{}');
  const hoyStr = new Date().toISOString().split('T')[0];

  alertas.forEach((item) => {
    const key = `${item.id}_${item.estado}_${hoyStr}`;
    if (!notificadosGuardados[key]) {
      let titulo = `Alerta de Mantenimiento: ${item.maintenance_type}`;
      let body = `${item.vehicle_marca} ${item.vehicle_modelo} (${item.vehicle_placa}) - ${item.detalle}`;

      if (item.estado === 'vencido') {
        titulo = `⚠️ MANTENIMIENTO VENCIDO: ${item.maintenance_type}`;
      } else if (item.estado === 'urgente') {
        titulo = `🚨 MANTENIMIENTO URGENTE: ${item.maintenance_type}`;
      }

      mostrarNotificacionPush(titulo, { body, data: { url: `/mantenimientos/${item.id}` } });
      notificadosGuardados[key] = true;
    }
  });

  localStorage.setItem('autocare_notificados', JSON.stringify(notificadosGuardados));
}

export default {
  solicitarPermisoNotificaciones,
  mostrarNotificacionPush,
  comprobarYNotificarMantenimientos,
};
