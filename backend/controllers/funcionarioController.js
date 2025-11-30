// funcionarioController.js - CRUD de Funcionários
const { pool } = require('../db');
const path = require('path');

// Abrir página do CRUD
exports.abrirCrudFuncionario = (req, res) => {
    console.log('funcionarioController - Rota /abrirCrudFuncionario');
    res.sendFile(path.join(__dirname, '../../frontend/crud/funcionarios/funcionarios.html'));
};

// Listar todos os funcionários com dados do cargo (JOIN)
exports.listarFuncionarios = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                f.PessoaCpfPessoa as cpf,
                p.nome as nome,
                p.email as email,
                f.salario,
                f.porcentagemComissao,
                f.CargosIdCargo as idcargo,
                c.nomeCargo
            FROM Funcionario f
            JOIN Pessoa p ON p.cpf = f.PessoaCpfPessoa
            LEFT JOIN Cargo c ON c.idCargo = f.CargosIdCargo
            ORDER BY p.nome
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar funcionários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Obter funcionário por CPF
exports.obterFuncionario = async (req, res) => {
    try {
        const { cpf } = req.params;
        
        const result = await pool.query(`
            SELECT 
                f.PessoaCpfPessoa as cpf,
                p.nome as nome,
                p.email as email,
                f.salario,
                f.porcentagemComissao,
                f.CargosIdCargo as idcargo,
                c.nomeCargo
            FROM Funcionario f
            JOIN Pessoa p ON p.cpf = f.PessoaCpfPessoa
            LEFT JOIN Cargo c ON c.idCargo = f.CargosIdCargo
            WHERE f.PessoaCpfPessoa = $1
        `, [cpf]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter funcionário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar funcionário
exports.criarFuncionario = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { cpf, salario, porcentagemComissao, idCargo } = req.body;
        
        // Validações
        if (!cpf) {
            return res.status(400).json({ error: 'CPF é obrigatório' });
        }
        
        if (salario === undefined || salario === null) {
            return res.status(400).json({ error: 'Salário é obrigatório' });
        }
        
        await client.query('BEGIN');
        
        // Verificar se a pessoa existe
        const pessoaResult = await client.query(
            'SELECT cpf, nome FROM Pessoa WHERE cpf = $1',
            [cpf]
        );
        
        if (pessoaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'CPF não existe na tabela Pessoa. Cadastre a pessoa primeiro.' });
        }
        
        // Verificar se já é funcionário
        const funcionarioExistente = await client.query(
            'SELECT PessoaCpfPessoa FROM Funcionario WHERE PessoaCpfPessoa = $1',
            [cpf]
        );
        
        if (funcionarioExistente.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Esta pessoa já está cadastrada como funcionário' });
        }
        
        // Verificar se o cargo existe (se foi informado)
        if (idCargo) {
            const cargoResult = await client.query(
                'SELECT idCargo FROM Cargo WHERE idCargo = $1',
                [idCargo]
            );
            
            if (cargoResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Cargo não encontrado' });
            }
        }
        
        // Inserir funcionário
        const insertResult = await client.query(`
            INSERT INTO Funcionario (PessoaCpfPessoa, salario, porcentagemComissao, CargosIdCargo)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [cpf, salario, porcentagemComissao || 0, idCargo || null]);
        
        await client.query('COMMIT');
        
        // Buscar dados completos para retornar
        const funcionarioCompleto = await pool.query(`
            SELECT 
                f.PessoaCpfPessoa as cpf,
                p.nome as nome,
                p.email as email,
                f.salario,
                f.porcentagemComissao,
                f.CargosIdCargo as idcargo,
                c.nomeCargo
            FROM Funcionario f
            JOIN Pessoa p ON p.cpf = f.PessoaCpfPessoa
            LEFT JOIN Cargo c ON c.idCargo = f.CargosIdCargo
            WHERE f.PessoaCpfPessoa = $1
        `, [cpf]);
        
        res.status(201).json(funcionarioCompleto.rows[0]);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar funcionário:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Funcionário já existe' });
        }
        
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Referência inválida (CPF ou Cargo não existe)' });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
};

// Atualizar funcionário
exports.atualizarFuncionario = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { cpf } = req.params;
        const { salario, porcentagemComissao, idCargo } = req.body;
        
        await client.query('BEGIN');
        
        // Verificar se o funcionário existe
        const funcionarioExistente = await client.query(
            'SELECT * FROM Funcionario WHERE PessoaCpfPessoa = $1',
            [cpf]
        );
        
        if (funcionarioExistente.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Funcionário não encontrado' });
        }
        
        // Verificar se o cargo existe (se foi informado)
        if (idCargo) {
            const cargoResult = await client.query(
                'SELECT idCargo FROM Cargo WHERE idCargo = $1',
                [idCargo]
            );
            
            if (cargoResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Cargo não encontrado' });
            }
        }
        
        // Atualizar funcionário
        const currentData = funcionarioExistente.rows[0];
        const updatedSalario = salario !== undefined ? salario : currentData.salario;
        const updatedComissao = porcentagemComissao !== undefined ? porcentagemComissao : currentData.porcentagemcomissao;
        const updatedCargo = idCargo !== undefined ? idCargo : currentData.cargosidcargo;
        
        await client.query(`
            UPDATE Funcionario 
            SET salario = $1, porcentagemComissao = $2, CargosIdCargo = $3
            WHERE PessoaCpfPessoa = $4
        `, [updatedSalario, updatedComissao, updatedCargo, cpf]);
        
        await client.query('COMMIT');
        
        // Buscar dados completos para retornar
        const funcionarioCompleto = await pool.query(`
            SELECT 
                f.PessoaCpfPessoa as cpf,
                p.nome as nome,
                p.email as email,
                f.salario,
                f.porcentagemComissao,
                f.CargosIdCargo as idcargo,
                c.nomeCargo
            FROM Funcionario f
            JOIN Pessoa p ON p.cpf = f.PessoaCpfPessoa
            LEFT JOIN Cargo c ON c.idCargo = f.CargosIdCargo
            WHERE f.PessoaCpfPessoa = $1
        `, [cpf]);
        
        res.json(funcionarioCompleto.rows[0]);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar funcionário:', error);
        
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Cargo selecionado não existe' });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
};

// Deletar funcionário
exports.deletarFuncionario = async (req, res) => {
    try {
        const { cpf } = req.params;
        
        // Verificar se o funcionário existe
        const funcionarioExistente = await pool.query(
            'SELECT * FROM Funcionario WHERE PessoaCpfPessoa = $1',
            [cpf]
        );
        
        if (funcionarioExistente.rows.length === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado' });
        }
        
        // Deletar funcionário
        await pool.query(
            'DELETE FROM Funcionario WHERE PessoaCpfPessoa = $1',
            [cpf]
        );
        
        res.status(204).send();
        
    } catch (error) {
        console.error('Erro ao deletar funcionário:', error);
        
        if (error.code === '23503') {
            return res.status(400).json({ 
                error: 'Não é possível deletar funcionário com dependências associadas (pedidos, etc.)' 
            });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Listar pessoas disponíveis para se tornarem funcionários
exports.listarPessoasDisponiveis = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.cpf, p.nome, p.email
            FROM Pessoa p
            WHERE p.cpf NOT IN (SELECT PessoaCpfPessoa FROM Funcionario)
            ORDER BY p.nome
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pessoas disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
