const express = require('express');
const {
  listar,
  obtener,
  crear,
  actualizar,
  actualizarKilometraje,
  eliminar,
} = require('../controllers/vehicle-controller');
const { verificarToken } = require('../middlewares/auth-middleware');

const router = express.Router();

// Todas las rutas de vehiculos requieren un token JWT valido.
// El usuario se obtiene del token (req.usuario.id), nunca del cuerpo de la peticion.
router.use(verificarToken);

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', crear);
router.put('/:id', actualizar);
router.patch('/:id/mileage', actualizarKilometraje);
router.delete('/:id', eliminar);

module.exports = router;
