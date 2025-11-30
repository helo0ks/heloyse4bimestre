// produtos.js - CRUD de Produtos
// Requer: utils.js carregado antes

const apiProdutos = `${API_ADMIN}/produtos`;
const imagemAtualInfo = document.getElementById('imagemAtualInfo');

// ========================================
// Funções Auxiliares de Imagem
// ========================================

function atualizarImagemAtualInfo(path) {
    if (!imagemAtualInfo) return;
    if (path) {
        const baseUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
        const urlAbsoluta = `${baseUrl}?t=${Date.now()}`; // cache-buster
        imagemAtualInfo.innerHTML = `Imagem atual: <a href="${urlAbsoluta}" target="_blank" rel="noopener">abrir em nova aba</a>`;
    } else {
        imagemAtualInfo.textContent = 'Sem imagem carregada';
    }
}

// ========================================
// Funções CRUD
// ========================================

async function listarProdutos() {
    const resp = await fetchAuth(apiProdutos);
    if (!resp) return;
    
    const produtos = await resp.json();
    const tbody = document.querySelector('#tabelaProdutos tbody');
    tbody.innerHTML = '';
    
    produtos.forEach(produto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>${produto.descricao || ''}</td>
            <td>${formatarMoeda(produto.preco)}</td>
            <td>${produto.imagem ? `<img src="${API_BASE_URL}${produto.imagem}?t=${Date.now()}" alt="img" width="50" onerror="this.style.display='none'">` : '<span class="sem-imagem">Sem imagem</span>'}</td>
            <td>${produto.estoque}</td>
            <td>
                <button onclick="editarProduto(${produto.id})">Editar</button>
                <button onclick="deletarProduto(${produto.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function cadastrarProduto(formData) {
    if (!verificarPermissaoAdmin()) return;
    
    const resp = await fetchAuth(apiProdutos, {
        method: 'POST',
        body: formData
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Produto cadastrado com sucesso!', 'success');
    } else {
        mostrarMensagem('Erro ao cadastrar produto.', 'error');
    }
}

async function atualizarProduto(formData) {
    if (!verificarPermissaoAdmin()) return;
    
    const id = formData.get('id');
    const resp = await fetchAuth(`${apiProdutos}/${id}`, {
        method: 'PUT',
        body: formData
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Produto atualizado com sucesso!', 'success');
    } else {
        mostrarMensagem('Erro ao atualizar produto.', 'error');
    }
}

async function deletarProduto(id) {
    if (!verificarPermissaoAdmin()) return;
    
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const resp = await fetchAuth(`${apiProdutos}/${id}`, {
        method: 'DELETE'
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Produto excluído com sucesso!', 'success');
        listarProdutos();
    } else {
        mostrarMensagem('Erro ao excluir produto.', 'error');
    }
}

async function editarProduto(id) {
    const resp = await fetchAuth(`${apiProdutos}/${id}`);
    if (!resp) return;
    
    const produto = await resp.json();
    document.getElementById('id').value = produto.id;
    document.getElementById('nome').value = produto.nome;
    document.getElementById('descricao').value = produto.descricao;
    document.getElementById('preco').value = produto.preco;
    atualizarImagemAtualInfo(produto.imagem);
    document.getElementById('estoque').value = produto.estoque;
    document.getElementById('formProduto').dataset.editando = 'true';
    document.getElementById('msgIdNaoExiste').style.display = 'none';
}

// Expor para uso global (onclick em tabela)
window.editarProduto = editarProduto;
window.deletarProduto = deletarProduto;

// ========================================
// Event Listeners
// ========================================

// Buscar produto por ID
document.getElementById('btnBuscarId').onclick = async function() {
    const id = document.getElementById('id').value;
    if (!id) return alert('Digite um ID para buscar!');
    
    try {
        const resp = await fetchAuth(`${apiProdutos}/${id}`);
        if (!resp) return;
        
        if (resp.ok) {
            const produto = await resp.json();
            document.getElementById('nome').value = produto.nome;
            document.getElementById('descricao').value = produto.descricao;
            document.getElementById('preco').value = produto.preco;
            atualizarImagemAtualInfo(produto.imagem);
            document.getElementById('estoque').value = produto.estoque;
            document.getElementById('formProduto').dataset.editando = 'true';
            document.getElementById('msgIdNaoExiste').style.display = 'none';
        } else {
            // Não existe, limpa campos para cadastro
            document.getElementById('formProduto').reset();
            document.getElementById('id').value = id;
            document.getElementById('formProduto').dataset.editando = '';
            document.getElementById('msgIdNaoExiste').style.display = 'inline';
            atualizarImagemAtualInfo(null);
        }
    } catch (e) {
        alert('Erro ao buscar produto!');
    }
};

// Submit do formulário
document.getElementById('formProduto').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const arquivo = document.getElementById('imagemArquivo').files[0] || null;
    const form = new FormData();
    form.append('id', parseInt(document.getElementById('id').value));
    form.append('nome', document.getElementById('nome').value);
    form.append('descricao', document.getElementById('descricao').value);
    form.append('preco', parseFloat(document.getElementById('preco').value));
    form.append('estoque', parseInt(document.getElementById('estoque').value));
    if (arquivo) form.append('imagemArquivo', arquivo);
    
    if (this.dataset.editando === 'true') {
        await atualizarProduto(form);
    } else {
        await cadastrarProduto(form);
    }
    
    this.reset();
    this.dataset.editando = '';
    document.getElementById('msgIdNaoExiste').style.display = 'none';
    atualizarImagemAtualInfo(null);
    listarProdutos();
});

// ========================================
// Inicialização
// ========================================

window.onload = function() {
    if (!ensureAdmin()) return;
    
    // Configurar navegação
    setupCrudSelector('produtos');
    
    // Inicializar imagem info
    atualizarImagemAtualInfo(null);
    
    // Carregar produtos
    setTimeout(() => {
        listarProdutos();
    }, 100);
};
