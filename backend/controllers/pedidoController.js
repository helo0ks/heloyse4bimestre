const { pool } = require('../db');

// Listar pedidos do cliente logado (meus pedidos)
exports.meusPedidos = async (req, res) => {
  try {
    const clienteCpf = req.user.cpf;
    
    // Buscar pedidos do cliente
    const pedidosResult = await pool.query(`
      SELECT 
        p.idPedido,
        p.dataDoPedido,
        p.ClientePessoaCpfPessoa,
        cliente.nome as nomeCliente,
        COALESCE(pag.valorTotalPagamento, 0) as valorTotal,
        pag.dataPagamento,
        pag.idPagamento
      FROM Pedido p
      LEFT JOIN Cliente c ON p.ClientePessoaCpfPessoa = c.PessoaCpfPessoa
      LEFT JOIN pessoa cliente ON c.PessoaCpfPessoa = cliente.cpf
      LEFT JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
      WHERE p.ClientePessoaCpfPessoa = $1
      ORDER BY p.dataDoPedido DESC, p.idPedido DESC
    `, [clienteCpf]);

    // Para cada pedido, buscar produtos e formas de pagamento
    const pedidosCompletos = await Promise.all(pedidosResult.rows.map(async (pedido) => {
      // Buscar produtos do pedido
      const produtosResult = await pool.query(`
        SELECT 
          php.ProdutoIdProduto,
          pr.nome as nomeProduto,
          php.quantidade,
          php.precoUnitario
        FROM PedidoHasProduto php
        JOIN produto pr ON php.ProdutoIdProduto = pr.id
        WHERE php.PedidoIdPedido = $1
      `, [pedido.idpedido]);

      // Buscar formas de pagamento
      const pagamentoResult = await pool.query(`
        SELECT 
          fp.nomeFormaPagamento,
          phfp.valorPago
        FROM PagamentoHasFormaPagamento phfp
        JOIN FormaDePagamento fp ON phfp.FormaPagamentoIdFormaPagamento = fp.idFormaPagamento
        JOIN Pagamento pag ON phfp.PagamentoIdPedido = pag.idPagamento
        WHERE pag.PedidoIdPedido = $1
      `, [pedido.idpedido]);

      return {
        ...pedido,
        produtos: produtosResult.rows,
        formasPagamento: pagamentoResult.rows
      };
    }));

    res.json({ 
      sucesso: true, 
      pedidos: pedidosCompletos,
      total: pedidosCompletos.length
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao listar seus pedidos' });
  }
};

// Listar todos os pedidos com informações completas
exports.listarPedidos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.idPedido,
        p.dataDoPedido,
        p.ClientePessoaCpfPessoa,
        cliente.nome as nomeCliente,
        cliente.email as emailCliente,
        p.FuncionarioPessoaCpfPessoa,
        funcionario.nome as nomeFuncionario,
        COALESCE(pag.valorTotalPagamento, 0) as valorTotal,
        pag.dataPagamento,
        pag.idPagamento
      FROM Pedido p
      LEFT JOIN Cliente c ON p.ClientePessoaCpfPessoa = c.PessoaCpfPessoa
      LEFT JOIN pessoa cliente ON c.PessoaCpfPessoa = cliente.cpf
      LEFT JOIN Funcionario f ON p.FuncionarioPessoaCpfPessoa = f.PessoaCpfPessoa
      LEFT JOIN pessoa funcionario ON f.PessoaCpfPessoa = funcionario.cpf
      LEFT JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
      ORDER BY p.dataDoPedido DESC, p.idPedido DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao listar pedidos' });
  }
};

// Buscar pedido por ID com detalhes completos
exports.buscarPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar dados básicos do pedido
    const pedidoResult = await pool.query(`
      SELECT 
        p.idPedido,
        p.dataDoPedido,
        p.ClientePessoaCpfPessoa,
        cliente.nome as nomeCliente,
        cliente.email as emailCliente,
        p.FuncionarioPessoaCpfPessoa,
        funcionario.nome as nomeFuncionario,
        COALESCE(pag.valorTotalPagamento, 0) as valorTotal,
        pag.dataPagamento,
        pag.idPagamento
      FROM Pedido p
      LEFT JOIN Cliente c ON p.ClientePessoaCpfPessoa = c.PessoaCpfPessoa
      LEFT JOIN pessoa cliente ON c.PessoaCpfPessoa = cliente.cpf
      LEFT JOIN Funcionario f ON p.FuncionarioPessoaCpfPessoa = f.PessoaCpfPessoa
      LEFT JOIN pessoa funcionario ON f.PessoaCpfPessoa = funcionario.cpf
      LEFT JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
      WHERE p.idPedido = $1
    `, [id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Buscar produtos do pedido
    const produtosResult = await pool.query(`
      SELECT 
        php.ProdutoIdProduto,
        pr.nome as nomeProduto,
        php.quantidade,
        php.precoUnitario,
        (php.quantidade * php.precoUnitario) as subtotal
      FROM PedidoHasProduto php
      JOIN produto pr ON php.ProdutoIdProduto = pr.id
      WHERE php.PedidoIdPedido = $1
    `, [id]);

    // Buscar formas de pagamento
    const pagamentoResult = await pool.query(`
      SELECT 
        fp.idFormaPagamento,
        fp.nomeFormaPagamento,
        phfp.valorPago
      FROM PagamentoHasFormaPagamento phfp
      JOIN FormaDePagamento fp ON phfp.FormaPagamentoIdFormaPagamento = fp.idFormaPagamento
      JOIN Pagamento pag ON phfp.PagamentoIdPedido = pag.idPagamento
      WHERE pag.PedidoIdPedido = $1
    `, [id]);

    const pedido = {
      ...pedidoResult.rows[0],
      produtos: produtosResult.rows,
      formasPagamento: pagamentoResult.rows
    };

    res.json(pedido);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao buscar pedido' });
  }
};

// Cadastrar novo pedido
exports.cadastrarPedido = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { 
      dataDoPedido, 
      ClientePessoaCpfPessoa, 
      FuncionarioPessoaCpfPessoa,
      produtos,
      valorTotalPagamento,
      formasPagamento
    } = req.body;

    // Inserir pedido
    const pedidoResult = await client.query(
      'INSERT INTO Pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa) VALUES ($1, $2, $3) RETURNING *',
      [dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa]
    );

    const pedidoId = pedidoResult.rows[0].idpedido;

    // Inserir produtos do pedido
    if (produtos && produtos.length > 0) {
      for (const produto of produtos) {
        await client.query(
          'INSERT INTO PedidoHasProduto (ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario) VALUES ($1, $2, $3, $4)',
          [produto.ProdutoIdProduto, pedidoId, produto.quantidade, produto.precoUnitario]
        );
      }
    }

    // Inserir pagamento se fornecido
    if (valorTotalPagamento && valorTotalPagamento > 0) {
      const pagamentoResult = await client.query(
        'INSERT INTO Pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento) VALUES ($1, NOW(), $2) RETURNING *',
        [pedidoId, valorTotalPagamento]
      );

      const pagamentoId = pagamentoResult.rows[0].idpagamento;

      // Inserir formas de pagamento
      if (formasPagamento && formasPagamento.length > 0) {
        for (const forma of formasPagamento) {
          await client.query(
            'INSERT INTO PagamentoHasFormaPagamento (PagamentoIdPedido, FormaPagamentoIdFormaPagamento, valorPago) VALUES ($1, $2, $3)',
            [pagamentoId, forma.FormaPagamentoIdFormaPagamento, forma.valorPago]
          );
        }
      }
    }

    await client.query('COMMIT');
    
    // Buscar pedido completo para retornar
    const pedidoCompleto = await pool.query(`
      SELECT 
        p.idPedido,
        p.dataDoPedido,
        p.ClientePessoaCpfPessoa,
        cliente.nome as nomeCliente,
        p.FuncionarioPessoaCpfPessoa,
        funcionario.nome as nomeFuncionario,
        COALESCE(pag.valorTotalPagamento, 0) as valorTotal
      FROM Pedido p
      LEFT JOIN Cliente c ON p.ClientePessoaCpfPessoa = c.PessoaCpfPessoa
      LEFT JOIN pessoa cliente ON c.PessoaCpfPessoa = cliente.cpf
      LEFT JOIN Funcionario f ON p.FuncionarioPessoaCpfPessoa = f.PessoaCpfPessoa
      LEFT JOIN pessoa funcionario ON f.PessoaCpfPessoa = funcionario.cpf
      LEFT JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
      WHERE p.idPedido = $1
    `, [pedidoId]);

    res.status(201).json(pedidoCompleto.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).json({ message: 'Erro ao cadastrar pedido' });
  } finally {
    client.release();
  }
};

// Editar pedido existente
exports.editarPedido = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { 
      dataDoPedido, 
      ClientePessoaCpfPessoa, 
      FuncionarioPessoaCpfPessoa,
      produtos,
      valorTotalPagamento,
      formasPagamento
    } = req.body;

    // Atualizar pedido
    const pedidoResult = await client.query(
      'UPDATE Pedido SET dataDoPedido = $1, ClientePessoaCpfPessoa = $2, FuncionarioPessoaCpfPessoa = $3 WHERE idPedido = $4 RETURNING *',
      [dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa, id]
    );

    if (pedidoResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Remover produtos antigos
    await client.query('DELETE FROM PedidoHasProduto WHERE PedidoIdPedido = $1', [id]);

    // Inserir novos produtos
    if (produtos && produtos.length > 0) {
      for (const produto of produtos) {
        await client.query(
          'INSERT INTO PedidoHasProduto (ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario) VALUES ($1, $2, $3, $4)',
          [produto.ProdutoIdProduto, id, produto.quantidade, produto.precoUnitario]
        );
      }
    }

    // Atualizar ou criar pagamento
    const pagamentoExistente = await client.query('SELECT idPagamento FROM Pagamento WHERE PedidoIdPedido = $1', [id]);
    
    if (valorTotalPagamento && valorTotalPagamento > 0) {
      let pagamentoId;
      
      if (pagamentoExistente.rows.length > 0) {
        // Atualizar pagamento existente
        await client.query(
          'UPDATE Pagamento SET valorTotalPagamento = $1, dataPagamento = NOW() WHERE PedidoIdPedido = $2',
          [valorTotalPagamento, id]
        );
        pagamentoId = pagamentoExistente.rows[0].idpagamento;
      } else {
        // Criar novo pagamento
        const novoPagamento = await client.query(
          'INSERT INTO Pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento) VALUES ($1, NOW(), $2) RETURNING *',
          [id, valorTotalPagamento]
        );
        pagamentoId = novoPagamento.rows[0].idpagamento;
      }

      // Remover formas de pagamento antigas
      await client.query('DELETE FROM PagamentoHasFormaPagamento WHERE PagamentoIdPedido = $1', [pagamentoId]);

      // Inserir novas formas de pagamento
      if (formasPagamento && formasPagamento.length > 0) {
        for (const forma of formasPagamento) {
          await client.query(
            'INSERT INTO PagamentoHasFormaPagamento (PagamentoIdPedido, FormaPagamentoIdFormaPagamento, valorPago) VALUES ($1, $2, $3)',
            [pagamentoId, forma.FormaPagamentoIdFormaPagamento, forma.valorPago]
          );
        }
      }
    }

    await client.query('COMMIT');
    
    // Buscar pedido atualizado
    const pedidoAtualizado = await pool.query(`
      SELECT 
        p.idPedido,
        p.dataDoPedido,
        p.ClientePessoaCpfPessoa,
        cliente.nome as nomeCliente,
        p.FuncionarioPessoaCpfPessoa,
        funcionario.nome as nomeFuncionario,
        COALESCE(pag.valorTotalPagamento, 0) as valorTotal
      FROM Pedido p
      LEFT JOIN Cliente c ON p.ClientePessoaCpfPessoa = c.PessoaCpfPessoa
      LEFT JOIN pessoa cliente ON c.PessoaCpfPessoa = cliente.cpf
      LEFT JOIN Funcionario f ON p.FuncionarioPessoaCpfPessoa = f.PessoaCpfPessoa
      LEFT JOIN pessoa funcionario ON f.PessoaCpfPessoa = funcionario.cpf
      LEFT JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
      WHERE p.idPedido = $1
    `, [id]);

    res.json(pedidoAtualizado.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).json({ message: 'Erro ao editar pedido' });
  } finally {
    client.release();
  }
};

// Excluir pedido
exports.excluirPedido = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Buscar pagamento associado
    const pagamentoResult = await client.query('SELECT idPagamento FROM Pagamento WHERE PedidoIdPedido = $1', [id]);
    
    if (pagamentoResult.rows.length > 0) {
      const pagamentoId = pagamentoResult.rows[0].idpagamento;
      
      // Remover formas de pagamento
      await client.query('DELETE FROM PagamentoHasFormaPagamento WHERE PagamentoIdPedido = $1', [pagamentoId]);
      
      // Remover pagamento
      await client.query('DELETE FROM Pagamento WHERE idPagamento = $1', [pagamentoId]);
    }

    // Remover produtos do pedido
    await client.query('DELETE FROM PedidoHasProduto WHERE PedidoIdPedido = $1', [id]);

    // Remover pedido
    const result = await client.query('DELETE FROM Pedido WHERE idPedido = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Pedido excluído com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).json({ message: 'Erro ao excluir pedido' });
  } finally {
    client.release();
  }
};

// Listar clientes para dropdown
exports.listarClientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.PessoaCpfPessoa as cpf, p.nome, p.email
      FROM Cliente c
      JOIN pessoa p ON c.PessoaCpfPessoa = p.cpf
      ORDER BY p.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao listar clientes' });
  }
};

// Listar funcionários para dropdown
exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.PessoaCpfPessoa as cpf, p.nome, p.email
      FROM Funcionario f
      JOIN pessoa p ON f.PessoaCpfPessoa = p.cpf
      ORDER BY p.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao listar funcionários' });
  }
};

// Listar produtos para dropdown
exports.listarProdutosPedido = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, preco, estoque
      FROM produto
      WHERE estoque > 0
      ORDER BY nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao listar produtos' });
  }
};

// Listar formas de pagamento para dropdown
exports.listarFormasPagamento = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT idFormaPagamento, nomeFormaPagamento
      FROM FormaDePagamento
      ORDER BY nomeFormaPagamento
    `);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao listar formas de pagamento' });
  }
};

// Finalizar pedido do carrinho (endpoint público para clientes)
exports.finalizarPedidoCarrinho = async (req, res) => {
  // Verificar se o usuário é admin - admin não pode fazer compras
  if (req.user && req.user.tipo === 'admin') {
    return res.status(403).json({ 
      error: 'Ação proibida para usuários admin',
      message: 'Administradores não podem realizar compras. Por favor, use uma conta de cliente.' 
    });
  }

  const client = await pool.connect();
  try {
    console.log('=== FINALIZANDO PEDIDO DO CARRINHO ===');
    console.log('Dados recebidos:', req.body);
    
    await client.query('BEGIN');

    const { 
      clienteCpf, 
      itensCarrinho,
      formaPagamento,
      valorTotal
    } = req.body;

    // Verificar se o cliente existe
    const clienteResult = await client.query(`
      SELECT c.PessoaCpfPessoa, p.nome, p.email 
      FROM Cliente c 
      JOIN pessoa p ON c.PessoaCpfPessoa = p.cpf 
      WHERE c.PessoaCpfPessoa = $1
    `, [clienteCpf]);

    if (clienteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Buscar um funcionário padrão (primeiro admin disponível)
    const funcionarioResult = await client.query(`
      SELECT f.PessoaCpfPessoa 
      FROM Funcionario f 
      JOIN pessoa p ON f.PessoaCpfPessoa = p.cpf 
      WHERE p.tipo = 'admin' 
      LIMIT 1
    `);

    if (funcionarioResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ message: 'Nenhum funcionário disponível para processar o pedido' });
    }

    const funcionarioCpf = funcionarioResult.rows[0].pessoacpfpessoa;

    // Criar pedido
    const pedidoResult = await client.query(
      'INSERT INTO Pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa) VALUES (CURRENT_DATE, $1, $2) RETURNING *',
      [clienteCpf, funcionarioCpf]
    );

    const pedidoId = pedidoResult.rows[0].idpedido;
    console.log('Pedido criado com ID:', pedidoId);

    // Inserir produtos do pedido
    for (const item of itensCarrinho) {
      // Verificar se o produto existe e tem estoque
      const produtoResult = await client.query('SELECT id, nome, preco, estoque FROM produto WHERE id = $1', [item.id]);
      
      if (produtoResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: `Produto com ID ${item.id} não encontrado` });
      }

      const produto = produtoResult.rows[0];
      
      if (produto.estoque < item.quantidade) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.estoque}, Solicitado: ${item.quantidade}` });
      }

      // Inserir item do pedido
      await client.query(
        'INSERT INTO PedidoHasProduto (ProdutoIdProduto, PedidoIdPedido, quantidade, precoUnitario) VALUES ($1, $2, $3, $4)',
        [item.id, pedidoId, item.quantidade, item.preco]
      );

      // Atualizar estoque do produto
      await client.query(
        'UPDATE produto SET estoque = estoque - $1 WHERE id = $2',
        [item.quantidade, item.id]
      );
    }

    // Criar pagamento
    const pagamentoResult = await client.query(
      'INSERT INTO Pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento) VALUES ($1, NOW(), $2) RETURNING *',
      [pedidoId, valorTotal]
    );

    const pagamentoId = pagamentoResult.rows[0].idpagamento;

    // Inserir forma de pagamento
    await client.query(
      'INSERT INTO PagamentoHasFormaPagamento (PagamentoIdPedido, FormaPagamentoIdFormaPagamento, valorPago) VALUES ($1, $2, $3)',
      [pagamentoId, formaPagamento, valorTotal]
    );

    await client.query('COMMIT');
    console.log('Pedido finalizado com sucesso! ID:', pedidoId);

    // Retornar dados do pedido criado
    const pedidoCompleto = await pool.query(`
      SELECT 
        p.idPedido,
        p.dataDoPedido,
        cliente.nome as nomeCliente,
        cliente.email as emailCliente,
        pag.valorTotalPagamento,
        pag.dataPagamento,
        fp.nomeFormaPagamento
      FROM Pedido p
      JOIN Cliente c ON p.ClientePessoaCpfPessoa = c.PessoaCpfPessoa
      JOIN pessoa cliente ON c.PessoaCpfPessoa = cliente.cpf
      JOIN Pagamento pag ON p.idPedido = pag.PedidoIdPedido
      JOIN PagamentoHasFormaPagamento phfp ON pag.idPagamento = phfp.PagamentoIdPedido
      JOIN FormaDePagamento fp ON phfp.FormaPagamentoIdFormaPagamento = fp.idFormaPagamento
      WHERE p.idPedido = $1
    `, [pedidoId]);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Pedido finalizado com sucesso!',
      pedido: pedidoCompleto.rows[0],
      itensComprados: itensCarrinho.length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.log('Erro ao finalizar pedido do carrinho:', err);
    res.status(500).json({ message: 'Erro ao finalizar pedido' });
  } finally {
    client.release();
  }
};

