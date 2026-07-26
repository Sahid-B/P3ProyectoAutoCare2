const express = require('express');
const {
  listar,
  crear,
  eliminar,
  tasar,
  listarTodos,
} = require('../controllers/marketplace-controller');
const { verificarToken } = require('../middlewares/auth-middleware');

const router = express.Router();

router.use(verificarToken);

router.get('/todos', listarTodos);
router.get('/', listar);
router.post('/', crear);
router.post('/estimate', tasar);
router.delete('/:id', eliminar);

module.exports = router;
