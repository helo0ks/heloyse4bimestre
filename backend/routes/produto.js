const express = require('express');
const router = express.Router();

const produtoController = require('../controllers/produtoController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Rotas públicas (SEM autenticação) - DEVEM VIR PRIMEIRO
// Rotas específicas ANTES de rotas dinâmicas
router.get('/publicos', produtoController.listarProdutosPublicos);

// CRUD Produtos (COM autenticação)
// Rotas dinâmicas com /:id
// POST com upload opcional via campo 'imagemArquivo'
router.post('/', verifyToken, isAdmin, upload.single('imagemArquivo'), produtoController.cadastrarProduto);
router.get('/', verifyToken, isAdmin, produtoController.listarProdutos);

// Rotas de imagem (imagem principal - compatível com legado)
router.get('/:id/imagem', produtoController.buscarImagemProduto);

// Rotas CRUD básicas
router.get('/:id', verifyToken, isAdmin, produtoController.buscarProdutoPorId);
// PUT com upload opcional via campo 'imagemArquivo'
router.put('/:id', verifyToken, isAdmin, upload.single('imagemArquivo'), produtoController.editarProduto);
router.delete('/:id', verifyToken, isAdmin, produtoController.excluirProduto);

module.exports = router;
