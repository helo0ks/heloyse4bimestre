const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const produtoRoutes = require('./routes/produto');
const pessoaRoutes = require('./routes/pessoa');
const cargoRoutes = require('./routes/cargoRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const pedidoRoutes = require('./routes/pedido');
const relatoriosRoutes = require('./routes/relatorios');
const { verifyToken, isAdmin } = require('./middleware/authMiddleware');

const app = express();
// Configurar CORS com origens permitidas via variáveis de ambiente
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || 'http://localhost:3002';
const allowedOrigins = [CLIENT_ORIGIN];
if (ADMIN_ORIGIN && !allowedOrigins.includes(ADMIN_ORIGIN)) allowedOrigins.push(ADMIN_ORIGIN);

// Segurança HTTP: cabeçalhos básicos (relaxado em dev, rigoroso em prod)
app.use(helmet({
  crossOriginResourcePolicy: process.env.NODE_ENV === 'production' ? { policy: 'cross-origin' } : false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? true : false
}));

// Rate limiting básico para impedir abusos (ajuste conforme tráfego)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // limite de requests por IP por janela (ajustar conforme necessário)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors({
  origin: function(origin, callback) {
    // Em desenvolvimento, permitir todas as origens para facilitar testes locais
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // permitir requests sem origin (ex.: curl, ferramentas server-side)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`CORS: origem rejeitada -> ${origin}. Permitidas: ${allowedOrigins.join(', ')}`);
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos da pasta frontend (HTML, CSS, JS, img)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Rotas públicas / auth
app.use('/auth', authRoutes);
app.use('/produtos', produtoRoutes);  // mantém rota pública para listagem (/produtos/publicos)

// Montar rotas administrativas sob /admin-api e proteger com middleware
app.use('/admin-api/produtos', verifyToken, isAdmin, produtoRoutes);
app.use('/admin-api/pessoas', verifyToken, isAdmin, pessoaRoutes);
app.use('/admin-api/cargo', verifyToken, isAdmin, cargoRoutes);
app.use('/admin-api/funcionarios', verifyToken, isAdmin, funcionarioRoutes);
app.use('/admin-api/relatorios', verifyToken, isAdmin, relatoriosRoutes);

// Removidas montagens públicas de rotas administrativas para aumentar segurança.
// Agora as rotas administrativas só estão disponíveis sob o prefixo `/admin-api/*`.
// Se precisar restaurar acesso público para endpoints específicos, exponha apenas rotas públicas necessárias.
app.use('/pedidos', pedidoRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
