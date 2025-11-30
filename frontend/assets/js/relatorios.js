(function(){
  const apiRelatorios = 'http://localhost:3001/admin-api/relatorios';

  // Helper para ler cookie
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
  }

  // Helper para fazer requisições autenticadas via cookie httpOnly
  async function fetchAuth(url, options = {}) {
    const response = await fetch(url, { 
      ...options, 
      credentials: 'include' // Envia cookie httpOnly automaticamente
    });
    
    if (response.status === 401) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = 'login.html';
      return null;
    }
    
    return response;
  }

  function ensureAdmin() {
    const isLoggedIn = getCookie('isLoggedIn') === 'true';
    const tipo = getCookie('userType') || localStorage.getItem('tipo');
    if (!isLoggedIn || tipo !== 'admin') {
      alert('Acesso restrito. Faça login como administrador.');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function formatarMoeda(valor) {
    return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const btnVendas = document.getElementById('btnRelatorioVendas');
  const btnClientes = document.getElementById('btnRelatorioClientes');
  const secVendas = document.getElementById('secaoRelatorioVendas');
  const secClientes = document.getElementById('secaoRelatorioClientes');
  const crudSelect = document.getElementById('crudSelect');
  const btnCarregarPeriodo = document.getElementById('btnCarregarPeriodo');
  const selectPeriodo = document.getElementById('selectPeriodo');

  let chartBarVendas, chartPieVendas, chartBarClientes, chartPieClientes, chartPeriodoLine;

  btnVendas.onclick = async function(){
    if (!ensureAdmin()) return;
    secClientes.style.display = 'none';
    secVendas.style.display = '';
    await carregarRelatorioVendas();
    await carregarVendasPeriodo();
  };

  btnClientes.onclick = async function(){
    if (!ensureAdmin()) return;
    secVendas.style.display = 'none';
    secClientes.style.display = '';
    await carregarRelatorioClientes();
  };

  if (btnCarregarPeriodo) {
    btnCarregarPeriodo.onclick = carregarVendasPeriodo;
  }

  // Navegação do seletor de CRUDs
  if (crudSelect) {
    crudSelect.onchange = function(){
      const v = crudSelect.value;
      if (v === 'produtos') window.location.href = 'crud/produtos/produtos.html';
      else if (v === 'pessoas') window.location.href = 'crud/pessoas/pessoas.html';
      else if (v === 'cargos') window.location.href = 'crud/cargos/cargos.html';
      else if (v === 'funcionarios') window.location.href = 'crud/funcionarios/funcionarios.html';
      else if (v === 'pedidos') window.location.href = 'crud/pedidos/pedidos.html';
      else if (v === 'relatorios') {/* já está aqui */}
    };
  }

  async function carregarRelatorioVendas(){
    const resp = await fetchAuth(`${apiRelatorios}/vendas`);
    if (!resp) return;
    const dados = await resp.json();

    // KPIs
    document.getElementById('kpiTotalQtd').textContent = dados.totais.totalQuantidade || 0;
    document.getElementById('kpiReceitaTotal').textContent = formatarMoeda(dados.totais.totalReceita);
    document.getElementById('kpiProdutosAtivos').textContent = dados.produtos.length || 0;

    // Tabela
    const tbody = document.getElementById('tbodyVendas');
    tbody.innerHTML = '';
    dados.produtos.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.produto}</td><td>${item.quantidadeVendida}</td><td>${formatarMoeda(item.receitaTotal)}</td>`;
      tbody.appendChild(tr);
    });

    // Gráficos
    const labels = dados.produtos.map(d => d.produto);
    const valuesQtd = dados.produtos.map(d => Number(d.quantidadeVendida));
    const valuesReceita = dados.produtos.map(d => Number(d.receitaTotal));

    if (chartBarVendas) chartBarVendas.destroy();
    if (chartPieVendas) chartPieVendas.destroy();

    chartBarVendas = new Chart(document.getElementById('chartVendasBar'), {
      type: 'bar',
      data: { labels, datasets: [
        { label: 'Quantidade', data: valuesQtd, backgroundColor: '#4e79a7', yAxisID: 'y' },
        { label: 'Receita (R$)', data: valuesReceita, backgroundColor: '#59a14f', yAxisID: 'y1' }
      ]},
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Quantidade' } },
          y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Receita (R$)' } }
        }
      }
    });

    chartPieVendas = new Chart(document.getElementById('chartVendasPie'), {
      type: 'pie',
      data: { labels, datasets: [{ data: valuesReceita, backgroundColor: gerarCores(valuesReceita.length) }] },
      options: { responsive: true, plugins: { title: { display: true, text: 'Receita por Produto' } } }
    });
  }

  async function carregarVendasPeriodo(){
    const periodo = selectPeriodo ? selectPeriodo.value : 'mes';
    const resp = await fetchAuth(`${apiRelatorios}/vendas/periodo?periodo=${periodo}`);
    if (!resp) return;
    const dados = await resp.json();

    // Tabela
    const tbody = document.getElementById('tbodyPeriodo');
    tbody.innerHTML = '';
    dados.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.periodo}</td><td>${item.totalPedidos}</td><td>${item.totalItens}</td><td>${formatarMoeda(item.receitaTotal)}</td>`;
      tbody.appendChild(tr);
    });

    // Gráfico de linha
    const labels = dados.map(d => d.periodo);
    const valuesReceita = dados.map(d => Number(d.receitaTotal));

    if (chartPeriodoLine) chartPeriodoLine.destroy();

    chartPeriodoLine = new Chart(document.getElementById('chartPeriodoLine'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Receita (R$)',
          data: valuesReceita,
          borderColor: '#4e79a7',
          backgroundColor: 'rgba(78,121,167,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Evolução da Receita' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  async function carregarRelatorioClientes(){
    const resp = await fetchAuth(`${apiRelatorios}/clientes`);
    if (!resp) return;
    const dados = await resp.json();

    // KPIs
    document.getElementById('kpiTotalClientes').textContent = dados.totais.totalClientes || 0;
    document.getElementById('kpiClientesAtivos').textContent = dados.totais.comCompra || 0;
    document.getElementById('kpiFaturamentoClientes').textContent = formatarMoeda(dados.totais.totalGastoGeral);
    document.getElementById('kpiTicketMedio').textContent = formatarMoeda(dados.totais.ticketMedio);

    // Tabelas
    const tbCom = document.getElementById('tbodyClientesCom');
    const tbSem = document.getElementById('tbodyClientesSem');
    tbCom.innerHTML = '';
    tbSem.innerHTML = '';

    dados.clientesComCompra.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.nome}</td><td>${c.email}</td><td>${c.totalPedidos}</td><td>${formatarMoeda(c.valorTotalGasto)}</td>`;
      tbCom.appendChild(tr);
    });

    dados.clientesSemCompra.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.nome}</td><td>${c.email}</td>`;
      tbSem.appendChild(tr);
    });

    // Gráficos
    const labels = ['Com compra', 'Sem compra'];
    const values = [Number(dados.totais.comCompra || 0), Number(dados.totais.semCompra || 0)];

    if (chartBarClientes) chartBarClientes.destroy();
    if (chartPieClientes) chartPieClientes.destroy();

    chartBarClientes = new Chart(document.getElementById('chartClientesBar'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Clientes', data: values, backgroundColor: ['#59a14f','#e15759'] }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    chartPieClientes = new Chart(document.getElementById('chartClientesPie'), {
      type: 'pie',
      data: { labels, datasets: [{ data: values, backgroundColor: ['#59a14f','#e15759'] }] },
      options: { responsive: true }
    });
  }

  function gerarCores(n){
    const base = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ab'];
    const arr = [];
    for (let i=0;i<n;i++) arr.push(base[i%base.length]);
    return arr;
  }
})();
