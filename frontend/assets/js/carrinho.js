// Carrinho - Gerenciamento do carrinho de compras
let carrinho = [];
let isAdmin = false; // Flag para identificar se o usuário é admin

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarCarrinho();
    configurarEventos();
    exibirCarrinho();
    carregarFormasPagamento();
    verificarTipoUsuario(); // Verificar se é admin
    
    // Escutar mudanças no localStorage (para quando o carrinho for limpo em outras abas)
    window.addEventListener('storage', function(e) {
        if (e.key === 'carrinho') {
            carregarCarrinho();
            exibirCarrinho();
        }
    });
});

// Verificar se o usuário é admin
async function verificarTipoUsuario() {
    try {
        const response = await fetch('http://localhost:3001/auth/check-session', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.usuario && data.usuario.tipo === 'admin') {
                isAdmin = true;
                aplicarRestricaoAdmin();
            }
        }
    } catch (error) {
        console.log('Erro ao verificar tipo de usuário:', error);
    }
}

// Aplicar restrições visuais para admin
function aplicarRestricaoAdmin() {
    // Adicionar atributo data-role ao container
    const container = document.querySelector('.carrinho-container');
    if (container) {
        container.setAttribute('data-role', 'admin');
    }
    
    // Mostrar mensagem de admin
    const mensagemAdmin = document.getElementById('admin-warning');
    if (mensagemAdmin) {
        mensagemAdmin.style.display = 'block';
    }
    
    // Desabilitar botão de finalizar compra
    const btnFinalizar = document.getElementById('finalizar-compra');
    if (btnFinalizar) {
        btnFinalizar.disabled = true;
        btnFinalizar.textContent = 'Compras desabilitadas';
        btnFinalizar.title = 'Administradores não podem realizar compras';
        btnFinalizar.style.backgroundColor = '#ccc';
        btnFinalizar.style.cursor = 'not-allowed';
    }
    
    // Desabilitar seleção de forma de pagamento
    const formaPagamento = document.getElementById('forma-pagamento');
    if (formaPagamento) {
        formaPagamento.disabled = true;
    }
}

// Carregar carrinho do localStorage
function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
}

// Salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Configurar eventos
function configurarEventos() {
    const btnLimparCarrinho = document.getElementById('limpar-carrinho');
    const btnFinalizarCompra = document.getElementById('finalizar-compra');
    
    if (btnLimparCarrinho) {
        btnLimparCarrinho.addEventListener('click', limparCarrinho);
    }
    
    if (btnFinalizarCompra) {
        btnFinalizarCompra.addEventListener('click', finalizarCompra);
    }
}

// Exibir carrinho na tela
function exibirCarrinho() {
    const carrinhoVazio = document.getElementById('carrinho-vazio');
    const carrinhoConteudo = document.getElementById('carrinho-conteudo');
    const carrinhoItens = document.getElementById('carrinho-itens');
    
    if (carrinho.length === 0) {
        carrinhoVazio.style.display = 'block';
        carrinhoConteudo.style.display = 'none';
        return;
    }
    
    carrinhoVazio.style.display = 'none';
    carrinhoConteudo.style.display = 'block';
    
    // Exibir itens
    carrinhoItens.innerHTML = carrinho.map(item => `
        <div class="carrinho-item" data-id="${item.id}">
            <div class="item-imagem">
                <img src="${item.imagem || 'img/snoopy-bg.png'}" alt="${item.nome}" onerror="this.src='img/snoopy-bg.png'">
            </div>
            <div class="item-detalhes">
                <h4 class="item-nome">${item.nome}</h4>
                <p class="item-preco-unitario">R$ ${parseFloat(item.preco).toFixed(2)} cada</p>
            </div>
            <div class="item-quantidade">
                <button class="btn-quantidade" onclick="alterarQuantidade(${item.id}, -1)">-</button>
                <span class="quantidade">${item.quantidade}</span>
                <button class="btn-quantidade" onclick="alterarQuantidade(${item.id}, 1)" 
                        ${item.quantidade >= item.estoqueDisponivel ? 'disabled' : ''}>+</button>
            </div>
            <div class="item-preco-total">
                <span>R$ ${(parseFloat(item.preco) * item.quantidade).toFixed(2)}</span>
            </div>
            <div class="item-remover">
                <button class="btn-remover" onclick="removerItem(${item.id})" title="Remover item">×</button>
            </div>
        </div>
    `).join('');
    
    // Atualizar valores
    atualizarValores();
}

// Alterar quantidade de um item
function alterarQuantidade(itemId, delta) {
    const item = carrinho.find(i => i.id === itemId);
    if (!item) return;
    
    const novaQuantidade = item.quantidade + delta;
    
    if (novaQuantidade <= 0) {
        removerItem(itemId);
        return;
    }
    
    if (novaQuantidade > item.estoqueDisponivel) {
        mostrarMensagem('Quantidade máxima atingida para este produto!', 'erro');
        return;
    }
    
    item.quantidade = novaQuantidade;
    salvarCarrinho();
    exibirCarrinho();
}

// Remover item do carrinho
function removerItem(itemId) {
    carrinho = carrinho.filter(item => item.id !== itemId);
    salvarCarrinho();
    exibirCarrinho();
    mostrarMensagem('Item removido do carrinho', 'sucesso');
}

// Limpar carrinho
function limparCarrinho() {
    if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
        carrinho = [];
        salvarCarrinho();
        exibirCarrinho();
        mostrarMensagem('Carrinho limpo com sucesso!', 'sucesso');
    }
}

// Limpar carrinho programaticamente (para logout)
function limparCarrinhoSilencioso() {
    carrinho = [];
    salvarCarrinho();
    if (typeof exibirCarrinho === 'function') {
        exibirCarrinho();
    }
}

// Função global para compatibilidade
window.limparCarrinhoSilencioso = limparCarrinhoSilencioso;

// Atualizar valores do resumo
function atualizarValores() {
    const subtotal = carrinho.reduce((total, item) => {
        return total + (parseFloat(item.preco) * item.quantidade);
    }, 0);
    
    const frete = 0; // Frete grátis por enquanto
    const total = subtotal + frete;
    
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
}

// Carregar formas de pagamento
async function carregarFormasPagamento() {
    try {
        const response = await fetch('http://localhost:3001/pedidos/formas-pagamento-publicas');
        if (response.ok) {
            const formasPagamento = await response.json();
            const select = document.getElementById('forma-pagamento');
            
            // Limpar opções existentes (exceto a primeira)
            select.innerHTML = '<option value="">Selecione a forma de pagamento</option>';
            
            // Adicionar formas de pagamento
            formasPagamento.forEach(forma => {
                const option = document.createElement('option');
                option.value = forma.idformapagamento;
                option.textContent = forma.nomeformapagamento;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
    }
}

// Finalizar compra
async function finalizarCompra() {
    // Verificar se é admin antes de permitir compra
    if (isAdmin) {
        mostrarMensagem('Administradores não podem realizar compras. Use uma conta de cliente.', 'erro');
        return;
    }

    if (carrinho.length === 0) {
        mostrarMensagem('Seu carrinho está vazio!', 'erro');
        return;
    }
    
    // Verificar se o usuário está logado via cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
        }
        return null;
    }
    
    const isLoggedIn = getCookie('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        if (confirm('Você precisa estar logado para finalizar a compra. Deseja fazer login agora?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Verificar se uma forma de pagamento foi selecionada
    const formaPagamento = document.getElementById('forma-pagamento').value;
    if (!formaPagamento) {
        mostrarMensagem('Por favor, selecione uma forma de pagamento!', 'erro');
        return;
    }
    
    try {
        const loading = document.getElementById('loading-carrinho');
        loading.style.display = 'block';
        
        // Obter informações do usuário logado
        const userInfo = window.authManager ? window.authManager.getUserInfo() : null;
        if (!userInfo || !userInfo.cpf) {
            throw new Error('Informações do usuário não encontradas');
        }
        
        // Calcular valor total
        const valorTotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        
        // Preparar dados do pedido
        const dadosPedido = {
            clienteCpf: userInfo.cpf,
            itensCarrinho: carrinho.map(item => ({
                id: item.id,
                nome: item.nome,
                preco: item.preco,
                quantidade: item.quantidade
            })),
            formaPagamento: parseInt(formaPagamento),
            valorTotal: valorTotal
        };
        
        // Enviar pedido para o backend (usa cookie httpOnly automaticamente)
        const response = await fetch('http://localhost:3001/pedidos/finalizar-carrinho', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosPedido)
        });
        
        loading.style.display = 'none';
        
        if (response.ok) {
            const resultado = await response.json();
            
            // Limpar carrinho após compra bem-sucedida
            carrinho = [];
            salvarCarrinho();
            exibirCarrinho();
            
            mostrarMensagem(`Pedido #${resultado.pedido.idpedido} realizado com sucesso! Obrigado pela sua compra!`, 'sucesso');
            
            // Mostrar detalhes do pedido
            setTimeout(() => {
                alert(`Pedido confirmado!\n\nPedido: #${resultado.pedido.idpedido}\nCliente: ${resultado.pedido.nomecliente}\nValor: R$ ${parseFloat(resultado.pedido.valortotalpagamento).toFixed(2)}\nForma de Pagamento: ${resultado.pedido.nomeformapagamento}\nData: ${new Date(resultado.pedido.datapagamento).toLocaleString('pt-BR')}\n\nItens comprados: ${resultado.itensComprados}`);
            }, 1000);
            
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao processar pedido');
        }
        
    } catch (error) {
        console.error('Erro ao finalizar compra:', error);
        document.getElementById('loading-carrinho').style.display = 'none';
        mostrarMensagem(error.message || 'Erro ao processar pedido. Tente novamente.', 'erro');
    }
}

// Mostrar mensagem
function mostrarMensagem(texto, tipo = 'info') {
    const mensagem = document.getElementById('mensagem-carrinho');
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.style.display = 'block';
    
    // Esconder após 5 segundos
    setTimeout(() => {
        mensagem.style.display = 'none';
    }, 5000);
}

// Utilitário para formatar preço
function formatarPreco(preco) {
    return `R$ ${parseFloat(preco).toFixed(2)}`;
}