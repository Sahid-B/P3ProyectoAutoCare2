const citasService = require('../services/citas-service');

async function listar(req, res) {
  try {
    const citas = await citasService.listarParaUsuario(req.usuario.id, req.usuario.rol);
    return res.json({ success: true, data: citas });
  } catch (error) {
    console.error('[citas-controller] listar:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener la lista de citas.' });
  }
}

async function crear(req, res) {
  try {
    const { taller_id, vehiculo_id, fecha, hora } = req.body;
    if (!taller_id || !vehiculo_id || !fecha || !hora) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios para agendar la cita.' });
    }

    const cita = await citasService.crear(req.usuario.id, req.body);
    return res.status(201).json({ success: true, message: 'Cita solicitada exitosamente.', data: cita });
  } catch (error) {
    console.error('[citas-controller] crear:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error al solicitar la cita.' });
  }
}

async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;
    if (!estado) {
      return res.status(400).json({ success: false, message: 'Falta indicar el nuevo estado de la cita.' });
    }

    const cita = await citasService.actualizarEstado(id, req.usuario.id, req.usuario.rol, estado);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada o sin permisos.' });
    }

    return res.json({ success: true, message: 'Estado de cita actualizado.', data: cita });
  } catch (error) {
    console.error('[citas-controller] actualizar:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error al actualizar la cita.' });
  }
}

module.exports = {
  listar,
  crear,
  actualizar,
};
