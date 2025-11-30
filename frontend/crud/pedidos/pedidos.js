// pedidos.js - CRUD de Pedidos
// Requer: utils.js carregado antes

const apiPedidos = API_PEDIDOS;

// Variáveis globais para pedidos
let clientesPedidos = [];
let funcionariosPedidos = [];
let produtosPedidos = [];
let formasPagamentoPedidos = [];

// ========================================
// Funções Auxiliares para Dropdowns
// ========================================

async function carregarDadosAuxiliaresPedidos() {
    try {
        // Carregar clientes
        const respClientes = await fetchAuth(`${apiPedidos}/auxiliar/clientes`);
        if (!respClientes) return;
        clientesPedidos = await respClientes.json();

        // Carregar funcionários
        const respFuncionarios = await fetchAuth(`${apiPedidos}/auxiliar/funcionarios`);
        if (!respFuncionarios) return;
        funcionariosPedidos = await respFuncionarios.json();

        // Carregar produtos
        const respProdutos = await fetchAuth(`${apiPedidos}/auxiliar/produtos`);
        if (!respProdutos) return;
        produtosPedidos = await respProdutos.json();

        // Carregar formas de pagamento
        const respFormas = await fetchAuth(`${apiPedidos}/auxiliar/formas-pagamento`);
        if (!respFormas) return;
        formasPagamentoPedidos = await respFormas.json();

        // Preencher dropdowns
        preencherDropdownClientes();
        preencherDropdownFuncionarios();
        preencherDropdownProdutos();
        preencherDropdownFormasPagamento();

    } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
    }
}

function preencherDropdownClientes() {
    const select = document.getElementById('clientePedido');
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clientesPedidos.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.cpf;
        option.textContent = `${cliente.nome} (${cliente.email})`;
        select.appendChild(option);
    });
}

function preencherDropdownFuncionarios() {
    const select = document.getElementById('funcionarioPedido');
    select.innerHTML = '<option value="">Selecione um funcionário</option>';
    funcionariosPedidos.forEach(funcionario => {
        const option = document.createElement('option');
        option.value = funcionario.cpf;
        option.textContent = `${funcionario.nome} (${funcionario.email})`;
        select.appendChild(option);
    });
}

function preencherDropdownProdutos() {
    const selects = document.querySelectorAll('.produto-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Selecione um produto</option>';
        produtosPedidos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.textContent = `${produto.nome} - R$ ${parseFloat(produto.preco).toFixed(2)} (Estoque: ${produto.estoque})`;
            option.dataset.preco = produto.preco;
            select.appendChild(option);
        });
    });
}

function preencherDropdownFormasPagamento() {
    const selects = document.querySelectorAll('.forma-pagamento-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Selecione uma forma de pagamento</option>';
        formasPagamentoPedidos.forEach(forma => {
            const option = document.createElement('option');
            option.value = forma.idformapagamento;
            option.textContent = forma.nomeformapagamento;
            select.appendChild(option);
        });
    });
}

// ========================================
// Funções de Cálculo
// ========================================

function calcularValorTotalPedido() {
    const produtosItems = document.querySelectorAll('#produtosPedido .produto-item');
    let valorTotal = 0;
    
    produtosItems.forEach(item => {
        const quantidadeInput = item.querySelector('.quantidade-input');
        const precoInput = item.querySelector('.preco-input');
        const subtotalInput = item.querySelector('.subtotal-input');
        
        const quantidade = parseFloat(quantidadeInput.value) || 0;
        const precoUnitario = parseFloat(precoInput.value) || 0;
        const subtotal = quantidade * precoUnitario;
        
        // Atualizar subtotal individual
        if (subtotalInput) {
            subtotalInput.value = subtotal.toFixed(2);
        }
        
        valorTotal += subtotal;
    });
    
    // Atualizar campo de valor total
    const valorTotalInput = document.getElementById('valorTotalPagamento');
    if (valorTotalInput) {
        valorTotalInput.value = valorTotal.toFixed(2);
    }
    
    // Distribuir valor total automaticamente se houver apenas uma forma de pagamento
    distribuirValorFormasPagamento();
    
    return valorTotal;
}

function distribuirValorFormasPagamento() {
    const valorTotal = parseFloat(document.getElementById('valorTotalPagamento').value) || 0;
    const formasItems = document.querySelectorAll('#formasPagamento .forma-pagamento-item');
    
    // Se houver apenas uma forma de pagamento, coloca o valor total nela
    if (formasItems.length === 1 && valorTotal > 0) {
        const valorPagoInput = formasItems[0].querySelector('.valor-pago-input');
        if (valorPagoInput && !valorPagoInput.value) {
            valorPagoInput.value = valorTotal.toFixed(2);
        }
    }
}

// ========================================
// Funções CRUD
// ========================================

async function listarPedidos() {
    try {
        console.log('=== CARREGANDO PEDIDOS ===');
        
        const resp = await fetchAuth(apiPedidos);
        if (!resp) return;
        
        console.log('Status da resposta:', resp.status);
        
        if (!resp.ok) {
            throw new Error(`Erro HTTP: ${resp.status}`);
        }
        
        const pedidos = await resp.json();
        console.log('Pedidos recebidos:', pedidos.length);
        
        const tbody = document.querySelector('#tabelaPedidos tbody');
        if (!tbody) {
            console.error('Elemento tbody não encontrado!');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (pedidos.length === 0) {
            console.log('Nenhum pedido encontrado');
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="7">Nenhum pedido encontrado</td>';
            tbody.appendChild(tr);
            return;
        }
        
        pedidos.forEach(pedido => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pedido.idpedido}</td>
                <td>${formatarData(pedido.datadopedido)}</td>
                <td>${pedido.nomecliente || 'N/A'}</td>
                <td>${pedido.nomefuncionario || 'N/A'}</td>
                <td>${formatarMoeda(pedido.valortotal)}</td>
                <td>${pedido.datapagamento ? formatarData(pedido.datapagamento) : 'Não pago'}</td>
                <td>
                    <button onclick="editarPedido(${pedido.idpedido})">Editar</button>
                    <button onclick="deletarPedido(${pedido.idpedido})">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        const tbody = document.querySelector('#tabelaPedidos tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar pedidos</td></tr>';
        }
    }
}

async function cadastrarPedido(pedido) {
    if (!verificarPermissaoAdmin()) return;
    
    const resp = await fetchAuth(apiPedidos, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Pedido cadastrado com sucesso!', 'success');
    } else {
        mostrarMensagem('Erro ao cadastrar pedido.', 'error');
    }
}

async function atualizarPedido(pedido) {
    if (!verificarPermissaoAdmin()) return;
    
    const resp = await fetchAuth(`${apiPedidos}/${pedido.idPedido}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Pedido atualizado com sucesso!', 'success');
    } else {
        mostrarMensagem('Erro ao atualizar pedido.', 'error');
    }
}

async function deletarPedido(id) {
    if (!verificarPermissaoAdmin()) return;
    
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    
    try {
        const resp = await fetchAuth(`${apiPedidos}/${id}`, {
            method: 'DELETE'
        });
        
        if (resp && resp.ok) {
            mostrarMensagem('Pedido excluído com sucesso!', 'success');
            listarPedidos();
        } else {
            mostrarMensagem('Erro ao excluir pedido', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao excluir pedido', 'error');
    }
}

async function editarPedido(id) {
    document.getElementById('idPedido').value = id;
    document.getElementById('btnBuscarPedido').click();
}

// Expor para uso global (onclick em tabela)
window.editarPedido = editarPedido;
window.deletarPedido = deletarPedido;

// ========================================
// Event Listeners
// ========================================

// Adicionar produto ao pedido
document.getElementById('btnAdicionarProduto').onclick = function() {
    const container = document.getElementById('produtosPedido');
    const div = document.createElement('div');
    div.className = 'produto-item';
    div.innerHTML = `
        <select class="produto-select" name="produto">
            <option value="">Selecione um produto</option>
        </select>
        <input type="number" class="quantidade-input" placeholder="Qtd" min="1" value="1">
        <input type="number" class="preco-input" placeholder="Preço Unit." step="0.01" min="0">
        <input type="number" class="subtotal-input" placeholder="Subtotal" step="0.01" readonly>
        <button type="button" class="btn-remover-produto">Remover</button>
    `;
    container.appendChild(div);
    
    // Preencher dropdown do novo produto
    const novoSelect = div.querySelector('.produto-select');
    produtosPedidos.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = `${produto.nome} - R$ ${parseFloat(produto.preco).toFixed(2)} (Estoque: ${produto.estoque})`;
        option.dataset.preco = produto.preco;
        novoSelect.appendChild(option);
    });

    // Evento para preencher preço automaticamente
    novoSelect.onchange = function() {
        const precoInput = div.querySelector('.preco-input');
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.preco) {
            precoInput.value = parseFloat(selectedOption.dataset.preco).toFixed(2);
        }
        calcularValorTotalPedido();
    };

    // Eventos para calcular total quando quantidade ou preço mudarem
    div.querySelector('.quantidade-input').oninput = calcularValorTotalPedido;
    div.querySelector('.preco-input').oninput = calcularValorTotalPedido;

    // Evento para remover produto
    div.querySelector('.btn-remover-produto').onclick = function() {
        div.remove();
        calcularValorTotalPedido();
    };
};

// Adicionar forma de pagamento
document.getElementById('btnAdicionarFormaPagamento').onclick = function() {
    const container = document.getElementById('formasPagamento');
    const div = document.createElement('div');
    div.className = 'forma-pagamento-item';
    div.innerHTML = `
        <select class="forma-pagamento-select" name="formaPagamento">
            <option value="">Selecione uma forma de pagamento</option>
        </select>
        <input type="number" class="valor-pago-input" placeholder="Valor Pago" step="0.01" min="0">
        <button type="button" class="btn-remover-forma">Remover</button>
    `;
    container.appendChild(div);
    
    // Preencher dropdown da nova forma de pagamento
    const novoSelect = div.querySelector('.forma-pagamento-select');
    formasPagamentoPedidos.forEach(forma => {
        const option = document.createElement('option');
        option.value = forma.idformapagamento;
        option.textContent = forma.nomeformapagamento;
        novoSelect.appendChild(option);
    });

    // Evento para remover forma de pagamento
    div.querySelector('.btn-remover-forma').onclick = function() {
        div.remove();
        distribuirValorFormasPagamento();
    };
    
    // Distribuir valor total se for a primeira forma de pagamento
    distribuirValorFormasPagamento();
};

// Eventos de produto - preencher preço automaticamente e calcular total
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('produto-select')) {
        const precoInput = e.target.parentElement.querySelector('.preco-input');
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption.dataset.preco) {
            precoInput.value = parseFloat(selectedOption.dataset.preco).toFixed(2);
        }
        calcularValorTotalPedido();
    }
    
    if (e.target.classList.contains('quantidade-input') || e.target.classList.contains('preco-input')) {
        calcularValorTotalPedido();
    }
});

// Remover produtos e formas de pagamento
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-remover-produto')) {
        e.target.parentElement.remove();
        calcularValorTotalPedido();
    }
    if (e.target.classList.contains('btn-remover-forma')) {
        e.target.parentElement.remove();
    }
});

// Buscar pedido por ID
document.getElementById('btnBuscarPedido').onclick = async function() {
    const id = document.getElementById('idPedido').value;
    if (!id) return alert('Digite um ID para buscar!');
    
    try {
        const resp = await fetchAuth(`${apiPedidos}/${id}`);
        if (!resp) return;
        
        if (resp.ok) {
            const pedido = await resp.json();
            
            // Preencher campos básicos
            document.getElementById('dataDoPedido').value = pedido.datadopedido;
            document.getElementById('clientePedido').value = pedido.clientepessoacpfpessoa;
            document.getElementById('funcionarioPedido').value = pedido.funcionariopessoacpfpessoa;
            document.getElementById('valorTotalPagamento').value = pedido.valortotal || '';
            
            // Limpar produtos e formas de pagamento
            document.getElementById('produtosPedido').innerHTML = '';
            document.getElementById('formasPagamento').innerHTML = '';
            
            // Preencher produtos
            if (pedido.produtos && pedido.produtos.length > 0) {
                pedido.produtos.forEach(produto => {
                    document.getElementById('btnAdicionarProduto').click();
                    const ultimoItem = document.querySelector('#produtosPedido .produto-item:last-child');
                    ultimoItem.querySelector('.produto-select').value = produto.produtoidproduto;
                    ultimoItem.querySelector('.quantidade-input').value = produto.quantidade;
                    ultimoItem.querySelector('.preco-input').value = parseFloat(produto.precounitario).toFixed(2);
                });
            }
            
            // Preencher formas de pagamento
            if (pedido.formaspagamento && pedido.formaspagamento.length > 0) {
                pedido.formaspagamento.forEach(forma => {
                    document.getElementById('btnAdicionarFormaPagamento').click();
                    const ultimoItem = document.querySelector('#formasPagamento .forma-pagamento-item:last-child');
                    ultimoItem.querySelector('.forma-pagamento-select').value = forma.idformapagamento;
                    ultimoItem.querySelector('.valor-pago-input').value = parseFloat(forma.valorpago).toFixed(2);
                });
            }
            
            document.getElementById('formPedido').dataset.editando = 'true';
            document.getElementById('msgPedidoNaoExiste').style.display = 'none';
        } else {
            // Não existe, limpa campos para cadastro
            resetarFormPedido();
            document.getElementById('idPedido').value = id;
            document.getElementById('formPedido').dataset.editando = '';
            document.getElementById('msgPedidoNaoExiste').style.display = 'inline';
        }
    } catch (e) {
        alert('Erro ao buscar pedido!');
    }
};

function resetarFormPedido() {
    document.getElementById('formPedido').reset();
    document.getElementById('produtosPedido').innerHTML = `
        <div class="produto-item">
            <select class="produto-select" name="produto">
                <option value="">Selecione um produto</option>
            </select>
            <input type="number" class="quantidade-input" placeholder="Qtd" min="1" value="1">
            <input type="number" class="preco-input" placeholder="Preço Unit." step="0.01" min="0">
            <input type="number" class="subtotal-input" placeholder="Subtotal" step="0.01" readonly>
            <button type="button" class="btn-remover-produto">Remover</button>
        </div>
    `;
    document.getElementById('formasPagamento').innerHTML = `
        <div class="forma-pagamento-item">
            <select class="forma-pagamento-select" name="formaPagamento">
                <option value="">Selecione uma forma de pagamento</option>
            </select>
            <input type="number" class="valor-pago-input" placeholder="Valor Pago" step="0.01" min="0">
            <button type="button" class="btn-remover-forma">Remover</button>
        </div>
    `;
    preencherDropdownProdutos();
    preencherDropdownFormasPagamento();
}

// Form de pedido
document.getElementById('formPedido').onsubmit = async function(e) {
    e.preventDefault();
    
    // Coletar produtos
    const produtosItems = document.querySelectorAll('#produtosPedido .produto-item');
    const produtos = [];
    produtosItems.forEach(item => {
        const produtoId = item.querySelector('.produto-select').value;
        const quantidade = item.querySelector('.quantidade-input').value;
        const precoUnitario = item.querySelector('.preco-input').value;
        
        if (produtoId && quantidade && precoUnitario) {
            produtos.push({
                ProdutoIdProduto: parseInt(produtoId),
                quantidade: parseInt(quantidade),
                precoUnitario: parseFloat(precoUnitario)
            });
        }
    });
    
    // Coletar formas de pagamento
    const formasItems = document.querySelectorAll('#formasPagamento .forma-pagamento-item');
    const formasPagamento = [];
    formasItems.forEach(item => {
        const formaId = item.querySelector('.forma-pagamento-select').value;
        const valorPago = item.querySelector('.valor-pago-input').value;
        
        if (formaId && valorPago) {
            formasPagamento.push({
                FormaPagamentoIdFormaPagamento: parseInt(formaId),
                valorPago: parseFloat(valorPago)
            });
        }
    });
    
    const pedido = {
        dataDoPedido: document.getElementById('dataDoPedido').value,
        ClientePessoaCpfPessoa: document.getElementById('clientePedido').value,
        FuncionarioPessoaCpfPessoa: document.getElementById('funcionarioPedido').value,
        produtos: produtos,
        valorTotalPagamento: parseFloat(document.getElementById('valorTotalPagamento').value) || 0,
        formasPagamento: formasPagamento
    };
    
    if (this.dataset.editando === 'true') {
        pedido.idPedido = parseInt(document.getElementById('idPedido').value);
        await atualizarPedido(pedido);
    } else {
        await cadastrarPedido(pedido);
    }
    
    this.reset();
    this.dataset.editando = '';
    document.getElementById('msgPedidoNaoExiste').style.display = 'none';
    resetarFormPedido();
    listarPedidos();
};

// ========================================
// Inicialização
// ========================================

window.onload = function() {
    if (!ensureAdmin()) return;
    
    // Configurar navegação
    setupCrudSelector('pedidos');
    
    // Carregar dados
    setTimeout(() => {
        carregarDadosAuxiliaresPedidos();
        listarPedidos();
    }, 100);
};
