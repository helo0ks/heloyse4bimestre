// Variáveis globais
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let isAdminUser = false; // Flag para identificar se o usuário é admin

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarProdutos();
    configurarEventos();
    atualizarContadorCarrinho();
    verificarTipoUsuarioIndex(); // Verificar se é admin
    
    // Atualiza contador do carrinho no authManager também
    if (window.authManager) {
        window.authManager.updateCartCounter();
    }
});

// Verificar se o usuário é admin
async function verificarTipoUsuarioIndex() {
    try {
        const response = await fetch('http://localhost:3001/auth/check-session', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.usuario && data.usuario.tipo === 'admin') {
                isAdminUser = true;
                // Re-exibir produtos para atualizar os botões
                if (produtos.length > 0) {
                    exibirProdutos(produtos);
                }
            }
        }
    } catch (error) {
        console.log('Erro ao verificar tipo de usuário:', error);
    }
}

// Carregar produtos do backend
async function carregarProdutos() {
    try {
        const loading = document.getElementById('loading');
        const produtosContainer = document.getElementById('produtos-container');
        const erroDiv = document.getElementById('erro-produtos');
        
        loading.style.display = 'block';
        erroDiv.style.display = 'none';
        
        // Fazer requisição para o backend sem token (produtos públicos)
        const response = await fetch('http://localhost:3001/produtos/publicos');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }
        
        const data = await response.json();
        produtos = data.dados || [];
        
        loading.style.display = 'none';
        
        if (produtos.length === 0) {
            produtosContainer.innerHTML = '<p class="sem-produtos">Nenhum produto disponível no momento.</p>';
        } else {
            exibirProdutos(produtos);
            carregarCategorias();
        }
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('erro-produtos').style.display = 'block';
    }
}

// Exibir produtos na tela
function exibirProdutos(produtosParaExibir) {
    const container = document.getElementById('produtos-container');
    
    if (produtosParaExibir.length === 0) {
        container.innerHTML = '<p class="sem-produtos">Nenhum produto encontrado.</p>';
        return;
    }
    
    container.innerHTML = produtosParaExibir.map(produto => {
        const imagemUrl = resolverUrlImagemPublica(produto.imagem);
        
        // Determinar texto e estado do botão baseado no tipo de usuário
        let botaoTexto, botaoDisabled, botaoClass;
        if (isAdminUser) {
            botaoTexto = 'Apenas Visualização';
            botaoDisabled = true;
            botaoClass = 'btn-admin-disabled';
        } else if ((produto.quantidade || 0) <= 0) {
            botaoTexto = 'Sem Estoque';
            botaoDisabled = true;
            botaoClass = '';
        } else {
            botaoTexto = getBotaoCarrinhoTexto();
            botaoDisabled = false;
            botaoClass = '';
        }
        
        return `
        <div class="produto-card" data-id="${produto.id}">
            <div class="produto-imagem">
                <img src="${imagemUrl}" alt="${produto.nome}" onerror="this.src='img/snoopy-bg.png'">
            </div>
            <div class="produto-info">
                <h4 class="produto-nome">${produto.nome}</h4>
                <p class="produto-descricao">${produto.descricao || 'Produto incrível da nossa loja!'}</p>
                <div class="produto-detalhes">
                    <span class="produto-categoria">${produto.categoria || 'Pelúcia'}</span>
                    <span class="produto-estoque">Estoque: ${produto.quantidade || 0}</span>
                </div>
                <div class="produto-preco-container">
                    <span class="produto-preco">R$ ${parseFloat(produto.preco || 0).toFixed(2)}</span>
                    <button class="btn-adicionar-carrinho ${botaoClass}" onclick="adicionarAoCarrinho(${produto.id})" 
                            ${botaoDisabled ? 'disabled' : ''}
                            ${isAdminUser ? 'title="Administradores não podem realizar compras"' : ''}>
                        ${botaoTexto}
                    </button>
                </div>
            </div>
        </div>
    `;}).join('');
}

function resolverUrlImagemPublica(pathImagem) {
    if (!pathImagem) return 'img/snoopy-bg.png';
    const trimmed = pathImagem.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    if (trimmed.startsWith('img/')) {
        return `http://localhost:3001/${trimmed}`;
    }
    // Assume caminhos relativos fornecidos pela API (/admin-api/...)
    return `http://localhost:3001${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

// Carregar categorias para o filtro
function carregarCategorias() {
    const select = document.getElementById('filtro-categoria');
    const categorias = [...new Set(produtos.map(p => p.categoria).filter(c => c))];
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        select.appendChild(option);
    });
}

// Configurar eventos
function configurarEventos() {
    // Busca de produtos
    const inputBusca = document.getElementById('busca-produto');
    inputBusca.addEventListener('input', filtrarProdutos);
    
    // Filtro por categoria
    const selectCategoria = document.getElementById('filtro-categoria');
    selectCategoria.addEventListener('change', filtrarProdutos);
    
    // Modal do carrinho
    const modal = document.getElementById('modal-carrinho');
    const closeModal = modal.querySelector('.close');
    closeModal.addEventListener('click', fecharModal);
    
    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            fecharModal();
        }
    });
}

// Filtrar produtos
function filtrarProdutos() {
    const termoBusca = document.getElementById('busca-produto').value.toLowerCase();
    const categoriaFiltro = document.getElementById('filtro-categoria').value;
    
    let produtosFiltrados = produtos.filter(produto => {
        const nomeMatch = produto.nome.toLowerCase().includes(termoBusca);
        const descricaoMatch = (produto.descricao || '').toLowerCase().includes(termoBusca);
        const categoriaMatch = !categoriaFiltro || produto.categoria === categoriaFiltro;
        
        return (nomeMatch || descricaoMatch) && categoriaMatch;
    });
    
    exibirProdutos(produtosFiltrados);
}

// Adicionar produto ao carrinho
function adicionarAoCarrinho(produtoId) {
    // Verificar se é admin
    if (isAdminUser) {
        alert('Administradores não podem realizar compras. Por favor, use uma conta de cliente.');
        return;
    }

    // Verificar se o usuário está logado
    if (!window.authManager || !window.authManager.isLoggedIn()) {
        if (confirm('Você precisa fazer login para adicionar produtos ao carrinho.\n\nDeseja fazer login agora?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    
    if (!produto) {
        alert('Produto não encontrado!');
        return;
    }
    
    if ((produto.quantidade || 0) <= 0) {
        alert('Produto sem estoque!');
        return;
    }
    
    // Verificar se o produto já está no carrinho
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        if (itemExistente.quantidade >= produto.quantidade) {
            alert('Quantidade máxima atingida para este produto!');
            return;
        }
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            imagem: produto.imagem,
            quantidade: 1,
            estoqueDisponivel: produto.quantidade
        });
    }
    
    // Salvar no localStorage
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    // Atualizar contador do carrinho
    atualizarContadorCarrinho();
    
    // Mostrar modal de confirmação
    mostrarModalCarrinho(produto);
}

// Mostrar modal de confirmação
function mostrarModalCarrinho(produto) {
    const modal = document.getElementById('modal-carrinho');
    const produtoAdicionado = document.getElementById('produto-adicionado');
    
    produtoAdicionado.textContent = `${produto.nome} foi adicionado ao seu carrinho!`;
    modal.style.display = 'block';
}

// Fechar modal
function fecharModal() {
    document.getElementById('modal-carrinho').style.display = 'none';
}

// Continuar comprando
function continuarComprando() {
    fecharModal();
}

// Ir para o carrinho
function irParaCarrinho() {
    window.location.href = 'carrinho.html';
}

// Atualizar contador do carrinho
function atualizarContadorCarrinho() {
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    // Atualizar link do carrinho no header
    const linkCarrinho = document.querySelector('nav a[href="carrinho.html"]');
    if (linkCarrinho) {
        if (totalItens > 0) {
            linkCarrinho.textContent = `Carrinho (${totalItens})`;
        } else {
            linkCarrinho.textContent = 'Carrinho';
        }
    }
    
    // Sincronizar com authManager se disponível
    if (window.authManager) {
        window.authManager.updateCartCounter();
    }
}

// Função para determinar o texto do botão baseado no login
function getBotaoCarrinhoTexto() {
    if (window.authManager && window.authManager.isLoggedIn()) {
        return 'Adicionar ao Carrinho';
    } else {
        return 'Faça Login para Comprar';
    }
}

// Função para criar endpoint público de produtos no backend (será chamada automaticamente)
async function verificarEndpointPublico() {
    try {
        const response = await fetch('http://localhost:3001/produtos/publicos');
        if (response.status === 404) {
            console.log('Endpoint público não existe, produtos serão carregados via endpoint protegido');
            return false;
        }
        return true;
    } catch (error) {
        console.log('Erro ao verificar endpoint público:', error);
        return false;
    }
}