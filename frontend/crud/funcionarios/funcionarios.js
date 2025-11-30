// funcionarios.js - CRUD de Funcionários
// Requer: utils.js carregado antes

const apiFuncionarios = `${API_ADMIN}/funcionarios`;
const apiCargos = `${API_ADMIN}/cargo`;

let cargosCache = [];
let pessoasDisponiveisCache = [];
let editandoCpf = null; // CPF do funcionário sendo editado

// ========================================
// Funções de Carregamento
// ========================================

/**
 * Carrega a lista de cargos para o dropdown
 */
async function carregarCargos() {
    try {
        const resp = await fetchAuth(apiCargos);
        if (!resp) return;
        
        cargosCache = await resp.json();
        
        const select = document.getElementById('idCargo');
        select.innerHTML = '<option value="">Selecione um cargo...</option>';
        
        cargosCache.forEach(cargo => {
            const option = document.createElement('option');
            option.value = cargo.idcargo;
            option.textContent = cargo.nomecargo;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar cargos:', error);
        mostrarMensagem('Erro ao carregar lista de cargos', 'error');
    }
}

/**
 * Carrega a lista de pessoas disponíveis (não são funcionários ainda)
 */
async function carregarPessoasDisponiveis() {
    try {
        const resp = await fetchAuth(`${apiFuncionarios}/pessoas-disponiveis`);
        if (!resp) return;
        
        pessoasDisponiveisCache = await resp.json();
        atualizarSelectPessoas();
    } catch (error) {
        console.error('Erro ao carregar pessoas disponíveis:', error);
    }
}

/**
 * Atualiza o select de pessoas com as disponíveis
 */
function atualizarSelectPessoas() {
    const select = document.getElementById('cpfFuncionario');
    const cpfAtual = select.value;
    
    select.innerHTML = '<option value="">Selecione uma pessoa...</option>';
    
    pessoasDisponiveisCache.forEach(pessoa => {
        const option = document.createElement('option');
        option.value = pessoa.cpf;
        option.textContent = `${pessoa.cpf} - ${pessoa.nome}`;
        select.appendChild(option);
    });
    
    // Se estava editando, adicionar a opção do funcionário atual
    if (editandoCpf) {
        const optionEditando = document.createElement('option');
        optionEditando.value = editandoCpf;
        optionEditando.textContent = `${editandoCpf} (editando)`;
        optionEditando.selected = true;
        select.appendChild(optionEditando);
    }
}

// ========================================
// Funções CRUD
// ========================================

/**
 * Lista todos os funcionários na tabela
 */
async function listarFuncionarios() {
    try {
        const resp = await fetchAuth(apiFuncionarios);
        if (!resp) return;
        
        const funcionarios = await resp.json();
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
        tbody.innerHTML = '';
        
        if (funcionarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #666; padding: 2rem;">
                        Nenhum funcionário cadastrado
                    </td>
                </tr>
            `;
            return;
        }
        
        funcionarios.forEach(func => {
            const tr = document.createElement('tr');
            
            const cargoHtml = func.nomecargo 
                ? `<span class="cargo-badge">${func.nomecargo}</span>`
                : `<span class="cargo-badge sem-cargo">Sem cargo</span>`;
            
            tr.innerHTML = `
                <td>${func.cpf}</td>
                <td>${func.nome || '-'}</td>
                <td>${func.email || '-'}</td>
                <td class="valor-monetario">R$ ${parseFloat(func.salario || 0).toFixed(2)}</td>
                <td>${parseFloat(func.porcentagemcomissao || 0).toFixed(2)}%</td>
                <td>${cargoHtml}</td>
                <td>
                    <button onclick="editarFuncionario('${func.cpf}')">Editar</button>
                    <button onclick="deletarFuncionario('${func.cpf}')">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao listar funcionários:', error);
        mostrarMensagem('Erro ao carregar lista de funcionários', 'error');
    }
}

/**
 * Cadastra um novo funcionário
 */
async function cadastrarFuncionario(dados) {
    if (!verificarPermissaoAdmin()) return false;
    
    try {
        const resp = await fetchAuth(apiFuncionarios, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (!resp) return false;
        
        if (resp.ok) {
            mostrarMensagem('Funcionário cadastrado com sucesso!', 'success');
            return true;
        } else {
            const error = await resp.json();
            mostrarMensagem(error.error || 'Erro ao cadastrar funcionário', 'error');
            return false;
        }
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        mostrarMensagem('Erro ao cadastrar funcionário', 'error');
        return false;
    }
}

/**
 * Atualiza um funcionário existente
 */
async function atualizarFuncionario(cpf, dados) {
    if (!verificarPermissaoAdmin()) return false;
    
    try {
        const resp = await fetchAuth(`${apiFuncionarios}/${cpf}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (!resp) return false;
        
        if (resp.ok) {
            mostrarMensagem('Funcionário atualizado com sucesso!', 'success');
            return true;
        } else {
            const error = await resp.json();
            mostrarMensagem(error.error || 'Erro ao atualizar funcionário', 'error');
            return false;
        }
    } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        mostrarMensagem('Erro ao atualizar funcionário', 'error');
        return false;
    }
}

/**
 * Deleta um funcionário
 */
async function deletarFuncionario(cpf) {
    if (!verificarPermissaoAdmin()) return;
    
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    
    try {
        const resp = await fetchAuth(`${apiFuncionarios}/${cpf}`, {
            method: 'DELETE'
        });
        
        if (!resp) return;
        
        if (resp.ok) {
            mostrarMensagem('Funcionário excluído com sucesso!', 'success');
            listarFuncionarios();
            carregarPessoasDisponiveis();
        } else {
            const error = await resp.json();
            mostrarMensagem(error.error || 'Erro ao excluir funcionário', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        mostrarMensagem('Erro ao excluir funcionário', 'error');
    }
}

/**
 * Carrega dados de um funcionário para edição
 */
async function editarFuncionario(cpf) {
    try {
        const resp = await fetchAuth(`${apiFuncionarios}/${cpf}`);
        if (!resp) return;
        
        if (resp.ok) {
            const func = await resp.json();
            
            editandoCpf = cpf;
            
            // Atualizar select de pessoas para mostrar a pessoa sendo editada
            atualizarSelectPessoas();
            
            // Preencher formulário
            document.getElementById('cpfFuncionario').value = cpf;
            document.getElementById('cpfFuncionario').disabled = true;
            document.getElementById('salario').value = func.salario || 0;
            document.getElementById('porcentagemComissao').value = func.porcentagemcomissao || 0;
            document.getElementById('idCargo').value = func.idcargo || '';
            
            // Mostrar info da pessoa
            document.getElementById('cpfInfo').textContent = `Editando: ${func.nome} (${func.email})`;
            
            document.getElementById('msgCpfNaoExiste').style.display = 'none';
            
            // Scroll para o formulário
            document.getElementById('formFuncionario').scrollIntoView({ behavior: 'smooth' });
        } else {
            document.getElementById('msgCpfNaoExiste').style.display = 'inline';
        }
    } catch (error) {
        console.error('Erro ao buscar funcionário:', error);
        mostrarMensagem('Erro ao buscar funcionário', 'error');
    }
}

/**
 * Busca funcionário por CPF
 */
async function buscarFuncionarioPorCpf() {
    const cpf = document.getElementById('cpfFuncionario').value;
    if (!cpf) {
        alert('Selecione ou digite um CPF para buscar!');
        return;
    }
    
    try {
        const resp = await fetchAuth(`${apiFuncionarios}/${cpf}`);
        
        if (resp && resp.ok) {
            const func = await resp.json();
            editandoCpf = cpf;
            
            document.getElementById('cpfFuncionario').disabled = true;
            document.getElementById('salario').value = func.salario || 0;
            document.getElementById('porcentagemComissao').value = func.porcentagemcomissao || 0;
            document.getElementById('idCargo').value = func.idcargo || '';
            document.getElementById('cpfInfo').textContent = `Editando: ${func.nome} (${func.email})`;
            document.getElementById('msgCpfNaoExiste').style.display = 'none';
        } else {
            // Pessoa existe mas não é funcionário - permitir cadastrar
            document.getElementById('msgCpfNaoExiste').style.display = 'none';
            document.getElementById('cpfInfo').textContent = 'Nova pessoa - preencha os dados para cadastrar como funcionário';
            editandoCpf = null;
        }
    } catch (error) {
        console.error('Erro ao buscar:', error);
    }
}

/**
 * Limpa o formulário
 */
function limparFormulario() {
    document.getElementById('formFuncionario').reset();
    document.getElementById('cpfFuncionario').disabled = false;
    document.getElementById('cpfInfo').textContent = '';
    document.getElementById('msgCpfNaoExiste').style.display = 'none';
    editandoCpf = null;
    
    // Recarregar pessoas disponíveis
    carregarPessoasDisponiveis();
}

// Expor funções para uso global (onclick)
window.editarFuncionario = editarFuncionario;
window.deletarFuncionario = deletarFuncionario;

// ========================================
// Event Listeners
// ========================================

// Buscar funcionário por CPF
document.getElementById('btnBuscarCpf').onclick = buscarFuncionarioPorCpf;

// Limpar formulário
document.getElementById('btnLimpar').onclick = limparFormulario;

// Mudança no select de pessoa
document.getElementById('cpfFuncionario').onchange = function() {
    const cpf = this.value;
    if (!cpf) {
        document.getElementById('cpfInfo').textContent = '';
        return;
    }
    
    // Buscar na cache de pessoas disponíveis
    const pessoa = pessoasDisponiveisCache.find(p => p.cpf === cpf);
    if (pessoa) {
        document.getElementById('cpfInfo').textContent = `${pessoa.nome} - ${pessoa.email}`;
    }
};

// Submit do formulário
document.getElementById('formFuncionario').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const cpf = document.getElementById('cpfFuncionario').value;
    const dados = {
        cpf: cpf,
        salario: parseFloat(document.getElementById('salario').value) || 0,
        porcentagemComissao: parseFloat(document.getElementById('porcentagemComissao').value) || 0,
        idCargo: document.getElementById('idCargo').value || null
    };
    
    let sucesso = false;
    
    if (editandoCpf) {
        // Atualizar funcionário existente
        sucesso = await atualizarFuncionario(editandoCpf, dados);
    } else {
        // Cadastrar novo funcionário
        sucesso = await cadastrarFuncionario(dados);
    }
    
    if (sucesso) {
        limparFormulario();
        listarFuncionarios();
        carregarPessoasDisponiveis();
    }
});

// ========================================
// Inicialização
// ========================================

window.onload = function() {
    if (!ensureAdmin()) return;
    
    // Configurar navegação
    setupCrudSelector('funcionarios');
    
    // Carregar dados
    setTimeout(async () => {
        await carregarCargos();
        await carregarPessoasDisponiveis();
        await listarFuncionarios();
    }, 100);
};
