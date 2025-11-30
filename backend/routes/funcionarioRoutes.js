// funcionarioRoutes.js - Rotas do CRUD de Funcionários
const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Proteger todas as rotas (apenas administradores)
router.use(verifyToken, isAdmin);

// CRUD de Funcionários
router.get('/abrirCrudFuncionario', funcionarioController.abrirCrudFuncionario);
router.get('/', funcionarioController.listarFuncionarios);
router.get('/pessoas-disponiveis', funcionarioController.listarPessoasDisponiveis);
router.get('/:cpf', funcionarioController.obterFuncionario);
router.post('/', funcionarioController.criarFuncionario);
router.put('/:cpf', funcionarioController.atualizarFuncionario);
router.delete('/:cpf', funcionarioController.deletarFuncionario);

module.exports = router;
