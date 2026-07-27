const express = require('express');
const { verificarToken } = require('../middlewares/auth-middleware');
const { listar, crear, actualizar } = require('../controllers/citas-controller');

const router = express.Router();

router.use(verificarToken);

router.get('/', listar);
router.post('/', crear);
router.patch('/:id', actualizar);

module.exports = router;
