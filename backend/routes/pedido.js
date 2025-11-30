const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verifyToken } = require('../middleware/authMiddleware');

// Rota para o cliente ver seus próprios pedidos
router.get('/meus-pedidos', verifyToken, pedidoController.meusPedidos);

// Rotas auxiliares para dropdowns (antes das rotas com parâmetros)
router.get('/auxiliar/clientes', verifyToken, pedidoController.listarClientes);
router.get('/auxiliar/funcionarios', verifyToken, pedidoController.listarFuncionarios);
router.get('/auxiliar/produtos', verifyToken, pedidoController.listarProdutosPedido);
router.get('/auxiliar/formas-pagamento', verifyToken, pedidoController.listarFormasPagamento);

// Rota pública para finalizar pedido do carrinho (sem autenticação admin)
router.post('/finalizar-carrinho', verifyToken, pedidoController.finalizarPedidoCarrinho);

// Rota pública para listar formas de pagamento (para o carrinho)
router.get('/formas-pagamento-publicas', pedidoController.listarFormasPagamento);



// Rotas principais de pedidos
router.get('/', verifyToken, pedidoController.listarPedidos);
router.get('/:id', verifyToken, pedidoController.buscarPedidoPorId);
router.post('/', verifyToken, pedidoController.cadastrarPedido);
router.put('/:id', verifyToken, pedidoController.editarPedido);
router.delete('/:id', verifyToken, pedidoController.excluirPedido);

module.exports = router;