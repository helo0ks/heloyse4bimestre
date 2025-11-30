
-- =============================================
-- BANCO DE DADOS SNOOPY - LOJA DE PELÚCIAS
-- =============================================
-- 
-- Este arquivo contém a estrutura completa do banco de dados
-- para a Loja Snoopy de pelúcias.
--
-- INSTRUÇÕES DE USO:
-- 1. Crie um banco de dados chamado 'snoopy' no PostgreSQL
-- 2. Execute este script completo no banco criado
-- 3. Configure o backend para usar database: 'snoopy'
--
-- USUÁRIOS PADRÃO CRIADOS:
-- Admin: bruno.costa@email.com (senha: 123456)
-- Admin: eduardo.pereira@email.com (senha: 123456)
-- Admin: julia.ferreira@email.com (senha: 123456)
-- Clientes: diversos (senha: 123456)
--
-- NOTA: Todos os usuários têm senha "123456" - altere após o primeiro login!
-- =============================================

DROP TABLE IF EXISTS pessoa CASCADE;
-- Script para criar a tabela pessoa (usuários) no PostgreSQL
CREATE TABLE IF NOT EXISTS pessoa (
    cpf VARCHAR(14) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'cliente',
    reset_token VARCHAR(100),
    reset_token_expires TIMESTAMP
);

CREATE TABLE Cargo (
    idCargo SERIAL PRIMARY KEY,
    nomeCargo VARCHAR(45)
);

CREATE TABLE Funcionario (
    PessoaCpfPessoa VARCHAR(20) PRIMARY KEY REFERENCES pessoa(cpf),
    salario DOUBLE PRECISION,
    CargosIdCargo INT REFERENCES Cargo(idCargo),
    porcentagemComissao DOUBLE PRECISION
);

CREATE TABLE Cliente (
    PessoaCpfPessoa VARCHAR(20) PRIMARY KEY REFERENCES pessoa(cpf),
    rendaCliente DOUBLE PRECISION,
    dataDeCadastroCliente DATE
);

DROP TABLE IF EXISTS produto CASCADE;
-- Script para criar a tabela produto (pelúcias) no PostgreSQL
CREATE TABLE IF NOT EXISTS produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL,
    imagem VARCHAR(255),
    estoque INT NOT NULL DEFAULT 0
);


CREATE TABLE Pedido (
    idPedido SERIAL PRIMARY KEY,
    dataDoPedido DATE,
    ClientePessoaCpfPessoa VARCHAR(20) REFERENCES Cliente(PessoaCpfPessoa),
    FuncionarioPessoaCpfPessoa VARCHAR(20) REFERENCES Funcionario(PessoaCpfPessoa)
);

CREATE TABLE Pagamento (
    idPagamento SERIAL PRIMARY KEY,
    PedidoIdPedido INT REFERENCES Pedido(idPedido),
    dataPagamento TIMESTAMP,
    valorTotalPagamento DOUBLE PRECISION
);

CREATE TABLE FormaDePagamento (
    idFormaPagamento SERIAL PRIMARY KEY,
    nomeFormaPagamento VARCHAR(100)
);

-- =====================
-- Tabelas relacionais
-- =====================

CREATE TABLE PedidoHasProduto (
    ProdutoIdProduto INT REFERENCES produto(id),
    PedidoIdPedido INT REFERENCES Pedido(idPedido),
    quantidade INT,
    precoUnitario DOUBLE PRECISION,
    PRIMARY KEY (ProdutoIdProduto, PedidoIdPedido)
);

CREATE TABLE PagamentoHasFormaPagamento (
    PagamentoIdPedido INT REFERENCES Pagamento(idPagamento),
    FormaPagamentoIdFormaPagamento INT REFERENCES FormaDePagamento(idFormaPagamento),
    valorPago DOUBLE PRECISION,
    PRIMARY KEY (PagamentoIdPedido, FormaPagamentoIdFormaPagamento)
);

-- =====================
-- Inserts
-- =====================

-- Endereco (10 registros)


-- Pessoa (10 registros)
-- NOTA: A senha para todos os usuários é "123456"
INSERT INTO pessoa (cpf, nome, email, senha, tipo) VALUES
('111.111.111-11','Ana Silva','ana.silva@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cliente'),
('222.222.222-22','Bruno Costa','bruno.costa@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin'),
('333.333.333-33','Carlos Souza','carlos.souza@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cliente'),
('444.444.444-44','Daniela Lima','daniela.lima@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cliente'),
('555.555.555-55','Eduardo Pereira','eduardo.pereira@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin'),
('666.666.666-66','Fernanda Alves','fernanda.alves@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cliente'),
('777.777.777-77','Gabriel Rocha','gabriel.rocha@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cliente'),
('888.888.888-88','Helena Martins','helena.martins@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cliente'),
('999.999.999-99','Igor Santos','igor.santos@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','cliente'),
('101.010.101-01','Julia Ferreira','julia.ferreira@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin');

-- Cargo (10 registros)
INSERT INTO Cargo (nomeCargo) VALUES
('Gerente'),('Vendedor'),('Caixa'),('Supervisor'),('Auxiliar'),
('Atendente'),('Estoquista'),('RH'),('TI'),('Financeiro');

-- Funcionario (10 registros)
INSERT INTO Funcionario VALUES
('111.111.111-11',3000,1,0.1),
('222.222.222-22',2000,2,0.05),
('333.333.333-33',1800,3,0.02),
('444.444.444-44',2500,4,0.07),
('555.555.555-55',1600,5,0.03),
('666.666.666-66',1700,6,0.02),
('777.777.777-77',1900,7,0.05),
('888.888.888-88',2100,8,0.04),
('999.999.999-99',2300,9,0.06),
('101.010.101-01',2800,10,0.08);

-- Cliente (10 registros)
INSERT INTO Cliente VALUES
('111.111.111-11',5000,'2023-01-01'),
('222.222.222-22',4000,'2023-02-01'),
('333.333.333-33',4500,'2023-03-01'),
('444.444.444-44',6000,'2023-04-01'),
('555.555.555-55',5500,'2023-05-01'),
('666.666.666-66',4700,'2023-06-01'),
('777.777.777-77',5300,'2023-07-01'),
('888.888.888-88',6200,'2023-08-01'),
('999.999.999-99',4100,'2023-09-01'),
('101.010.101-01',5800,'2023-10-01');

-- Produto (10 registros) - Pelúcias Snoopy
INSERT INTO produto (nome, descricao, preco, imagem, estoque) VALUES
('Snoopy Clássico','Pelúcia do Snoopy tradicional com 30cm de altura',89.90,'https://example.com/snoopy-classico.jpg',50),
('Woodstock','Pequena pelúcia do Woodstock, amigo do Snoopy',45.90,'https://example.com/woodstock.jpg',100),
('Snoopy Joe Cool','Snoopy usando óculos escuros no estilo Joe Cool',95.90,'https://example.com/snoopy-joe-cool.jpg',20),
('Charlie Brown','Pelúcia do Charlie Brown com 25cm',79.90,'https://example.com/charlie-brown.jpg',35),
('Snoopy Gigante','Pelúcia grande do Snoopy com 60cm de altura',199.90,'https://example.com/snoopy-gigante.jpg',15),
('Lucy van Pelt','Pelúcia da Lucy com vestido azul',85.90,'https://example.com/lucy.jpg',25),
('Linus van Pelt','Pelúcia do Linus com seu cobertor',89.90,'https://example.com/linus.jpg',30),
('Snoopy Natal','Snoopy com roupa natalina especial',109.90,'https://example.com/snoopy-natal.jpg',40),
('Snoopy Aviador','Snoopy fantasiado de aviador da Primeira Guerra',125.90,'https://example.com/snoopy-aviador.jpg',20),
('Sally Brown','Pelúcia da Sally, irmã do Charlie Brown',75.90,'https://example.com/sally.jpg',35);

-- Pedido (10 registros)
INSERT INTO Pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa) VALUES
('2023-01-10','111.111.111-11','222.222.222-22'),
('2023-01-15','333.333.333-33','444.444.444-44'),
('2023-02-05','555.555.555-55','666.666.666-66'),
('2023-02-20','777.777.777-77','888.888.888-88'),
('2023-03-01','999.999.999-99','101.010.101-01'),
('2023-03-12','111.111.111-11','333.333.333-33'),
('2023-04-01','222.222.222-22','444.444.444-44'),
('2023-04-18','333.333.333-33','555.555.555-55'),
('2023-05-10','444.444.444-44','666.666.666-66'),
('2023-05-22','555.555.555-55','777.777.777-77');

-- Pagamento (10 registros)
INSERT INTO Pagamento (PedidoIdPedido, dataPagamento, valorTotalPagamento) VALUES
(1,'2023-01-11 10:00',500),
(2,'2023-01-16 14:00',1200),
(3,'2023-02-06 09:30',350),
(4,'2023-02-21 15:00',4500),
(5,'2023-03-02 11:20',320),
(6,'2023-03-13 13:00',2500),
(7,'2023-04-02 16:40',150),
(8,'2023-04-19 12:15',2200),
(9,'2023-05-11 18:00',1750),
(10,'2023-05-23 08:45',950);

-- FormaDePagamento (10 registros)
INSERT INTO FormaDePagamento (nomeFormaPagamento) VALUES
('Dinheiro'),
('Cartão Crédito'),
('Cartão Débito'),
('PIX'),
('Boleto'),
('Cheque'),
('Transferência'),
('Vale Alimentação'),
('Crédito Loja'),
('Outro');

-- PedidoHasProduto (5 registros)
INSERT INTO PedidoHasProduto VALUES
(1,1,2,100),
(2,1,1,50),
(3,2,1,800),
(4,4,1,3500),
(5,5,2,1200);

-- PagamentoHasFormaPagamento (5 registros)
INSERT INTO PagamentoHasFormaPagamento VALUES
(1,1,200),
(2,2,1200),
(3,3,350),
(4,4,4500),
(5,5,320);