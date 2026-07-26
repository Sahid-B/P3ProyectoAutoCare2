const talleresService = require('../services/talleres-service');

async function listarTodos(req, res) {
  try {
    const talleres = await talleresService.listarTodos();
    return res.json({
      success: true,
      data: talleres,
    });
  } catch (error) {
    console.error('[talleres-controller] Error al listar talleres:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de talleres.',
    });
  }
}

async function obtenerMiTaller(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const taller = await talleresService.obtenerMiTaller(usuarioId);
    if (!taller) {
      return res.status(404).json({ success: false, message: 'Taller no encontrado.' });
    }
    return res.json({ success: true, taller });
  } catch (error) {
    console.error('[talleres-controller] Error al obtener mi taller:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el taller.' });
  }
}

async function actualizarMiTaller(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { nombre_taller, direccion, telefono, latitud, longitud } = req.body;
    
    if (!nombre_taller || !direccion || latitud === undefined || longitud === undefined) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios del taller.' });
    }

    const tallerActualizado = await talleresService.actualizarMiTaller(usuarioId, req.body);
    return res.json({ success: true, message: 'Taller actualizado exitosamente.', taller: tallerActualizado });
  } catch (error) {
    console.error('[talleres-controller] Error al actualizar mi taller:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar el taller.' });
  }
}

module.exports = {
  listarTodos,
  obtenerMiTaller,
  actualizarMiTaller,
};
