// cargos.js - CRUD de Cargos
// Requer: utils.js carregado antes

const apiCargos = `${API_ADMIN}/cargo`;

// ========================================
// Funções CRUD
// ========================================

async function listarCargos() {
    try {
        const resp = await fetch(apiCargos);
        if (!resp.ok) throw new Error('Erro ao carregar cargos');
        
        const cargos = await resp.json();
        const tbody = document.querySelector('#tabelaCargos tbody');
        tbody.innerHTML = '';
        
        cargos.forEach(cargo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cargo.idcargo}</td>
                <td>${cargo.nomecargo}</td>
                <td>
                    <button onclick="editarCargo(${cargo.idcargo})">Editar</button>
                    <button class="btn-danger" onclick="deletarCargo(${cargo.idcargo})">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao listar cargos:', error);
        mostrarMensagem('Erro ao carregar cargos', 'error');
    }
}

async function cadastrarCargo(cargo) {
    if (!verificarPermissaoAdmin()) return;
    
    try {
        const resp = await fetch(apiCargos, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cargo)
        });
        
        if (resp.ok) {
            mostrarMensagem('Cargo cadastrado com sucesso!', 'success');
            return true;
        } else {
            const error = await resp.json();
            mostrarMensagem('Erro: ' + error.error, 'error');
            return false;
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao cadastrar cargo', 'error');
        return false;
    }
}

async function atualizarCargo(cargo) {
    if (!verificarPermissaoAdmin()) return;
    
    try {
        const resp = await fetch(`${apiCargos}/${cargo.idCargo}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cargo)
        });
        
        if (resp.ok) {
            mostrarMensagem('Cargo atualizado com sucesso!', 'success');
            return true;
        } else {
            const error = await resp.json();
            mostrarMensagem('Erro: ' + error.error, 'error');
            return false;
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao atualizar cargo', 'error');
        return false;
    }
}

async function deletarCargo(id) {
    if (!verificarPermissaoAdmin()) return;
    
    if (!confirm('Deseja deletar este cargo?')) return;
    
    try {
        const resp = await fetch(`${apiCargos}/${id}`, { method: 'DELETE' });
        
        if (resp.ok) {
            mostrarMensagem('Cargo deletado com sucesso!', 'success');
            listarCargos();
        } else {
            const error = await resp.json();
            mostrarMensagem('Erro: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao deletar cargo', 'error');
    }
}

async function editarCargo(id) {
    try {
        const resp = await fetch(`${apiCargos}/${id}`);
        if (!resp.ok) {
            mostrarMensagem('Cargo não encontrado', 'error');
            return;
        }
        
        const cargo = await resp.json();
        document.getElementById('idCargo').value = cargo.idcargo;
        document.getElementById('nomeCargo').value = cargo.nomecargo;
        document.getElementById('formCargo').dataset.editando = 'true';
        document.getElementById('msgIdCargoNaoExiste').style.display = 'none';
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar cargo para edição', 'error');
    }
}

// Expor para uso global (onclick em tabela)
window.editarCargo = editarCargo;
window.deletarCargo = deletarCargo;

// ========================================
// Event Listeners
// ========================================

// Buscar cargo por ID
document.getElementById('btnBuscarIdCargo').onclick = async function() {
    const id = document.getElementById('idCargo').value;
    if (!id) return alert('Digite um ID para buscar!');
    
    try {
        const resp = await fetch(`${apiCargos}/${id}`);
        
        if (resp.ok) {
            const cargo = await resp.json();
            document.getElementById('nomeCargo').value = cargo.nomecargo;
            document.getElementById('formCargo').dataset.editando = 'true';
            document.getElementById('msgIdCargoNaoExiste').style.display = 'none';
        } else {
            document.getElementById('msgIdCargoNaoExiste').style.display = 'inline';
            // Limpar campo se não encontrou
            document.getElementById('nomeCargo').value = '';
            document.getElementById('formCargo').dataset.editando = '';
        }
    } catch (error) {
        console.error('Erro ao buscar cargo:', error);
        alert('Erro ao buscar cargo');
    }
};

// Submit do formulário
document.getElementById('formCargo').onsubmit = async function(e) {
    e.preventDefault();
    
    if (!verificarPermissaoAdmin()) return;
    
    const idCargo = document.getElementById('idCargo').value;
    const nomeCargo = document.getElementById('nomeCargo').value;
    
    const data = { idCargo: parseInt(idCargo), nomeCargo };
    
    let success;
    if (this.dataset.editando === 'true') {
        success = await atualizarCargo(data);
    } else {
        success = await cadastrarCargo(data);
    }
    
    if (success) {
        this.reset();
        this.dataset.editando = '';
        document.getElementById('msgIdCargoNaoExiste').style.display = 'none';
        listarCargos();
    }
};

// ========================================
// Inicialização
// ========================================

window.onload = function() {
    if (!ensureAdmin()) return;
    
    // Configurar navegação
    setupCrudSelector('cargos');
    
    // Carregar cargos
    setTimeout(() => {
        listarCargos();
    }, 100);
};
