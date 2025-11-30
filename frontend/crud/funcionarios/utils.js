// utils.js - Funções compartilhadas para todos os CRUDs
// Este arquivo deve ser carregado antes dos arquivos específicos de cada CRUD

// Configuração base da API
const API_BASE_URL = 'http://localhost:3001';
const API_ADMIN = `${API_BASE_URL}/admin-api`;
const API_PEDIDOS = `${API_BASE_URL}/pedidos`;

// ========================================
// Funções de Cookie
// ========================================

/**
 * Lê o valor de um cookie pelo nome
 * @param {string} name - Nome do cookie
 * @returns {string|null} - Valor do cookie ou null
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
}

// ========================================
// Funções de Autenticação
// ========================================

/**
 * Faz requisição autenticada usando cookie httpOnly
 * @param {string} url - URL da requisição
 * @param {Object} options - Opções do fetch
 * @returns {Promise<Response|null>} - Response ou null se não autenticado
 */
async function fetchAuth(url, options = {}) {
    const response = await fetch(url, { 
        ...options, 
        credentials: 'include' // Envia cookie httpOnly automaticamente
    });
    
    if (response.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = '../../login.html';
        return null;
    }
    
    return response;
}

/**
 * Verifica se o usuário é admin
 * @returns {boolean} - true se é admin
 */
function verificarPermissaoAdmin() {
    const isLoggedIn = getCookie('isLoggedIn') === 'true';
    const tipo = getCookie('userType') || localStorage.getItem('tipo');
    if (!isLoggedIn || tipo !== 'admin') {
        alert('Sessão expirada ou sem permissão. Redirecionando para login...');
        window.location.href = '../../login.html';
        return false;
    }
    return true;
}

/**
 * Garante que apenas admins acessem a página
 * @returns {boolean} - true se é admin
 */
function ensureAdmin() {
    const isLoggedIn = getCookie('isLoggedIn') === 'true';
    const tipo = getCookie('userType') || localStorage.getItem('tipo');
    if (!isLoggedIn || tipo !== 'admin') {
        alert('Acesso restrito. Faça login como administrador.');
        window.location.href = '../../login.html';
        return false;
    }
    return true;
}

// ========================================
// Funções de Navegação
// ========================================

/**
 * Configura o seletor de CRUD para navegação entre páginas
 * @param {string} currentCrud - Nome do CRUD atual (produtos, pessoas, cargos, funcionarios, pedidos, relatorios)
 */
function setupCrudSelector(currentCrud) {
    const crudSelect = document.getElementById('crudSelect');
    if (!crudSelect) return;
    
    // Definir o valor atual selecionado
    crudSelect.value = currentCrud;
    
    // Evento de mudança para navegar
    crudSelect.onchange = function() {
        const selectedValue = crudSelect.value;
        
        switch (selectedValue) {
            case 'produtos':
                window.location.href = '../produtos/produtos.html';
                break;
            case 'pessoas':
                window.location.href = '../pessoas/pessoas.html';
                break;
            case 'cargos':
                window.location.href = '../cargos/cargos.html';
                break;
            case 'funcionarios':
                window.location.href = '../funcionarios/funcionarios.html';
                break;
            case 'pedidos':
                window.location.href = '../pedidos/pedidos.html';
                break;
            case 'relatorios':
                window.location.href = '../../relatorios.html';
                break;
            default:
                break;
        }
    };
}

// ========================================
// Funções de Mensagens
// ========================================

/**
 * Mostra uma mensagem temporária para o usuário
 * @param {string} texto - Texto da mensagem
 * @param {string} tipo - Tipo: success, error, warning, info
 */
function mostrarMensagem(texto, tipo = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        alert(texto);
        return;
    }
    
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

// ========================================
// Funções Utilitárias
// ========================================

/**
 * Formata data para exibição no padrão brasileiro
 * @param {string} dataString - Data em string
 * @returns {string} - Data formatada
 */
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

/**
 * Formata valor monetário
 * @param {number} valor - Valor numérico
 * @returns {string} - Valor formatado como moeda
 */
function formatarMoeda(valor) {
    return `R$ ${(Number(valor) || 0).toFixed(2)}`;
}

// Exportar para uso global (window)
window.getCookie = getCookie;
window.fetchAuth = fetchAuth;
window.verificarPermissaoAdmin = verificarPermissaoAdmin;
window.ensureAdmin = ensureAdmin;
window.setupCrudSelector = setupCrudSelector;
window.mostrarMensagem = mostrarMensagem;
window.formatarData = formatarData;
window.formatarMoeda = formatarMoeda;
window.API_BASE_URL = API_BASE_URL;
window.API_ADMIN = API_ADMIN;
window.API_PEDIDOS = API_PEDIDOS;
