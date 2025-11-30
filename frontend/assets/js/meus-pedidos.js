// Meus Pedidos - Script para exibir histórico de pedidos do cliente
// API_BASE já definido em auth.js

document.addEventListener('DOMContentLoaded', async function() {
    // Aguardar o authManager carregar
    await waitForAuth();
    
    // Verificar se está logado
    if (!window.authManager || !window.authManager.isLoggedIn()) {
        alert('Você precisa estar logado para ver seus pedidos.');
        window.location.href = 'login.html';
        return;
    }
    
    await carregarMeusPedidos();
});

// Aguarda o authManager estar disponível
function waitForAuth() {
    return new Promise((resolve) => {
        if (window.authManager) {
            resolve();
        } else {
            const interval = setInterval(() => {
                if (window.authManager) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        }
    });
}

// Carrega os pedidos do cliente logado
async function carregarMeusPedidos() {
    const loading = document.getElementById('loading');
    const erro = document.getElementById('erro');
    const semPedidos = document.getElementById('sem-pedidos');
    const pedidosLista = document.getElementById('pedidos-lista');
    
    try {
        const response = await fetch(`${API_BASE}/pedidos/meus-pedidos`, {
            method: 'GET',
            credentials: 'include'
        });
        
        loading.style.display = 'none';
        
        if (response.status === 401) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Erro ao carregar pedidos');
        }
        
        const data = await response.json();
        const pedidos = data.pedidos || [];
        
        if (pedidos.length === 0) {
            semPedidos.style.display = 'block';
            return;
        }
        
        pedidosLista.style.display = 'flex';
        renderizarPedidos(pedidos);
        
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        loading.style.display = 'none';
        erro.style.display = 'block';
    }
}

// Renderiza os pedidos na tela
function renderizarPedidos(pedidos) {
    const container = document.getElementById('pedidos-lista');
    
    container.innerHTML = pedidos.map(pedido => {
        const dataPedido = pedido.datadopedido ? 
            new Date(pedido.datadopedido).toLocaleDateString('pt-BR') : 'Data não informada';
        
        const dataPagamento = pedido.datapagamento ? 
            new Date(pedido.datapagamento).toLocaleString('pt-BR') : null;
        
        const statusClass = dataPagamento ? 'status-pago' : 'status-pendente';
        const statusText = dataPagamento ? 'Pago' : 'Pendente';
        
        const valorTotal = pedido.valortotal ? 
            parseFloat(pedido.valortotal).toFixed(2) : '0.00';
        
        // Produtos do pedido
        const produtosHtml = pedido.produtos && pedido.produtos.length > 0 ?
            pedido.produtos.map(p => `
                <div class="produto-item-pedido">
                    <span>${p.nomeproduto || 'Produto'} (x${p.quantidade})</span>
                    <span>R$ ${(parseFloat(p.precounitario || 0) * parseInt(p.quantidade || 1)).toFixed(2)}</span>
                </div>
            `).join('') : '<p style="color: #666; font-style: italic;">Detalhes não disponíveis</p>';
        
        // Forma de pagamento
        const formaPagamento = pedido.formaspagamento && pedido.formaspagamento.length > 0 ?
            pedido.formaspagamento.map(f => f.nomeformapagamento).join(', ') : 'Não informada';
        
        return `
            <div class="pedido-card">
                <div class="pedido-header">
                    <div>
                        <span class="pedido-numero">Pedido #${pedido.idpedido}</span>
                        <span class="pedido-data"> • ${dataPedido}</span>
                    </div>
                    <span class="pedido-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="pedido-produtos">
                    <h4>Itens do Pedido:</h4>
                    ${produtosHtml}
                </div>
                
                <div class="pedido-footer">
                    <div>
                        <span class="pedido-forma-pagamento">Pagamento: ${formaPagamento}</span>
                        ${dataPagamento ? `<br><small style="color:#888;">Pago em: ${dataPagamento}</small>` : ''}
                    </div>
                    <span class="pedido-total">Total: R$ ${valorTotal}</span>
                </div>
            </div>
        `;
    }).join('');
}
