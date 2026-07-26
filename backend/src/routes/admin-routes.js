const express = require('express');
const { getStats, getUsers, toggleUserStatus } = require('../controllers/admin-controller');
const { verificarToken, verificarRolAdmin } = require('../middlewares/auth-middleware');

const router = express.Router();

// Todas las rutas de admin requieren token válido y rol de administrador
router.use(verificarToken);
router.use(verificarRolAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
