const { pool } = require('../db');

const SQL_IMAGEM_URL = `
  CASE 
    WHEN imagem_binaria IS NOT NULL THEN '/produtos/' || id::text || '/imagem'
    ELSE NULL 
  END as imagem`;

const gerarReferenciaImagem = (produtoId) =>
  produtoId !== undefined && produtoId !== null ? String(produtoId) : null;

// Upload-only: não aceitamos mais URL de imagem

// Removido suporte a URL: imagens devem ser enviadas via upload (multipart)

// Buscar imagem de um produto
exports.buscarImagemProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT imagem_binaria, imagem_tipo FROM produto WHERE id = $1', [id]);
    
    if (result.rows.length === 0 || !result.rows[0].imagem_binaria) {
      return res.status(404).json({ message: 'Imagem não encontrada' });
    }

    const { imagem_binaria, imagem_tipo } = result.rows[0];
    
    // Enviar imagem com header MIME correto e sem cache agressivo
    res.set('Content-Type', imagem_tipo || 'image/jpeg');
    // Evitar servir versão antiga: desabilitar cache no cliente
    res.set('Cache-Control', 'no-store');
    // Opcional: ETag simples para futuras otimizações
    res.set('ETag', `produto-${id}-${imagem_binaria.length}`);
    res.send(imagem_binaria);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao buscar imagem' });
  }
};

// Buscar produto por ID
exports.buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, nome, descricao, preco, estoque, imagem_tipo,
             ${SQL_IMAGEM_URL}
      FROM produto WHERE id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
};
// Editar produto existente
exports.editarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, estoque } = req.body;
    const referenciaImagem = gerarReferenciaImagem(id);

    // Baixar imagem se for URL
    let imagemBuffer = null;
    let imagemTipo = null;

    // Prioridade para arquivo enviado (multipart)
    if (req.file && req.file.buffer) {
      console.log(`[editarProduto] Recebido arquivo para id=${id}: name=${req.file.originalname}, mime=${req.file.mimetype}, size=${req.file.size}`);
      imagemBuffer = req.file.buffer;
      imagemTipo = req.file.mimetype || 'image/jpeg';
    }

    // Se imagem foi fornecida, atualizar. Caso contrário, manter a existente
    let queryText;
    let params;

    if (imagemBuffer !== null) {
      // Atualizar incluindo imagem enviada por upload
      queryText = `UPDATE produto SET nome = $1, descricao = $2, preco = $3, imagem = $4, imagem_binaria = $5, imagem_tipo = $6, estoque = $7 WHERE id = $8 
        RETURNING id, nome, descricao, preco, estoque, imagem_tipo,
          ${SQL_IMAGEM_URL}`;
      params = [nome, descricao, preco, referenciaImagem, imagemBuffer, imagemTipo, estoque, id];
    } else {
      // Atualizar sem mudar imagem
      queryText = `UPDATE produto SET nome = $1, descricao = $2, preco = $3, imagem = $4, estoque = $5 WHERE id = $6 
        RETURNING id, nome, descricao, preco, estoque, imagem_tipo,
          ${SQL_IMAGEM_URL}`;
      params = [nome, descricao, preco, referenciaImagem, estoque, id];
    }

    const result = await pool.query(queryText, params);
    if (imagemBuffer !== null) {
      console.log(`[editarProduto] Imagem atualizada para id=${id} (mime=${imagemTipo}, bytes=${imagemBuffer.length})`);
    } else {
      console.log(`[editarProduto] Imagem mantida para id=${id}`);
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao editar produto' });
  }
};

// Excluir produto
exports.excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM produto WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto excluído com sucesso' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao excluir produto' });
  }
};

// Cadastrar novo produto (com upload de imagem como BLOB)
exports.cadastrarProduto = async (req, res) => {
  try {
    const { id, nome, descricao, preco, estoque } = req.body;
    const referenciaImagem = gerarReferenciaImagem(id);

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Envie a imagem via upload no campo imagemArquivo' });
    }
    const imagemBuffer = req.file.buffer;
    const imagemTipo = req.file.mimetype || 'image/jpeg';

    // INSERT com BLOB
    const result = await pool.query(
      `INSERT INTO produto (id, nome, descricao, preco, imagem, imagem_binaria, imagem_tipo, estoque) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, nome, descricao, preco, estoque, imagem_tipo,
         ${SQL_IMAGEM_URL}`,
      [id, nome, descricao, preco, referenciaImagem, imagemBuffer, imagemTipo, estoque]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao cadastrar produto' });
  }
};

// Listar todos os produtos
exports.listarProdutos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, descricao, preco, estoque, imagem_tipo,
             ${SQL_IMAGEM_URL}
      FROM produto ORDER BY id
    `);
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erro ao listar produtos' });
  }
};

// Listar produtos públicos (loja) - sem BLOB, apenas metadados
exports.listarProdutosPublicos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, descricao, preco, estoque as quantidade,
             ${SQL_IMAGEM_URL},
             CASE 
               WHEN categoria IS NULL THEN 'Pelúcia' 
               ELSE categoria 
             END as categoria
      FROM produto 
      WHERE estoque > 0 
      ORDER BY nome
    `);
    
    res.json({
      sucesso: true,
      dados: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      sucesso: false,
      mensagem: 'Erro ao listar produtos públicos' 
    });
  }
};
