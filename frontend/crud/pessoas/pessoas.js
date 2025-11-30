// pessoas.js - CRUD de Pessoas
// Requer: utils.js carregado antes

const apiPessoas = `${API_ADMIN}/pessoas`;

// ========================================
// Funções CRUD
// ========================================

async function listarPessoas() {
    const resp = await fetchAuth(apiPessoas);
    if (!resp) return;
    
    const pessoas = await resp.json();
    const tbody = document.querySelector('#tabelaPessoas tbody');
    tbody.innerHTML = '';
    
    pessoas.forEach(pessoa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pessoa.cpf}</td>
            <td>${pessoa.nome}</td>
            <td>${pessoa.email}</td>
            <td>${pessoa.tipo}</td>
            <td>
                <button onclick="editarPessoa('${pessoa.cpf}')">Editar</button>
                <button onclick="deletarPessoa('${pessoa.cpf}')">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function cadastrarPessoa(pessoa) {
    if (!verificarPermissaoAdmin()) return;
    
    const resp = await fetchAuth(apiPessoas, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pessoa)
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Pessoa cadastrada com sucesso!', 'success');
    } else {
        mostrarMensagem('Erro ao cadastrar pessoa.', 'error');
    }
}

async function atualizarPessoa(pessoa) {
    if (!verificarPermissaoAdmin()) return;
    
    const resp = await fetchAuth(`${apiPessoas}/${pessoa.cpf}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pessoa)
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Pessoa atualizada com sucesso!', 'success');
    } else {
        mostrarMensagem('Erro ao atualizar pessoa.', 'error');
    }
}

async function deletarPessoa(cpf) {
    if (!verificarPermissaoAdmin()) return;
    
    if (!confirm('Tem certeza que deseja excluir esta pessoa?')) return;
    
    const resp = await fetchAuth(`${apiPessoas}/${cpf}`, {
        method: 'DELETE'
    });
    
    if (resp && resp.ok) {
        mostrarMensagem('Pessoa excluída com sucesso!', 'success');
        listarPessoas();
    } else {
        mostrarMensagem('Erro ao excluir pessoa.', 'error');
    }
}

async function editarPessoa(cpf) {
    const resp = await fetchAuth(`${apiPessoas}/${cpf}`);
    if (!resp) return;
    
    const pessoa = await resp.json();
    document.getElementById('cpf').value = pessoa.cpf;
    document.getElementById('nomePessoa').value = pessoa.nome;
    document.getElementById('email').value = pessoa.email;
    document.getElementById('tipo').value = pessoa.tipo;
    document.getElementById('senha').value = '';
    document.getElementById('formPessoa').dataset.editando = 'true';
    document.getElementById('msgCpfNaoExiste').style.display = 'none';
}

// Expor para uso global (onclick em tabela)
window.editarPessoa = editarPessoa;
window.deletarPessoa = deletarPessoa;

// ========================================
// Event Listeners
// ========================================

// Buscar pessoa por CPF
document.getElementById('btnBuscarCpf').onclick = async function() {
    const cpf = document.getElementById('cpf').value;
    if (!cpf) return alert('Digite um CPF para buscar!');
    
    try {
        const resp = await fetchAuth(`${apiPessoas}/${cpf}`);
        if (!resp) return;
        
        if (resp.ok) {
            const pessoa = await resp.json();
            document.getElementById('nomePessoa').value = pessoa.nome;
            document.getElementById('email').value = pessoa.email;
            document.getElementById('tipo').value = pessoa.tipo;
            document.getElementById('senha').value = '';
            document.getElementById('formPessoa').dataset.editando = 'true';
            document.getElementById('msgCpfNaoExiste').style.display = 'none';
        } else {
            document.getElementById('msgCpfNaoExiste').style.display = 'inline';
            // Limpar campos se não encontrou
            document.getElementById('nomePessoa').value = '';
            document.getElementById('email').value = '';
            document.getElementById('tipo').value = 'cliente';
            document.getElementById('senha').value = '';
            document.getElementById('formPessoa').dataset.editando = '';
        }
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        alert('Erro ao buscar pessoa');
    }
};

// Submit do formulário
document.getElementById('formPessoa').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const pessoa = {
        cpf: document.getElementById('cpf').value,
        nome: document.getElementById('nomePessoa').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        tipo: document.getElementById('tipo').value
    };
    
    if (this.dataset.editando === 'true') {
        await atualizarPessoa(pessoa);
    } else {
        await cadastrarPessoa(pessoa);
    }
    
    this.reset();
    this.dataset.editando = '';
    document.getElementById('msgCpfNaoExiste').style.display = 'none';
    listarPessoas();
});

// ========================================
// Inicialização
// ========================================

window.onload = function() {
    if (!ensureAdmin()) return;
    
    // Configurar navegação
    setupCrudSelector('pessoas');
    
    // Carregar pessoas
    setTimeout(() => {
        listarPessoas();
    }, 100);
};
