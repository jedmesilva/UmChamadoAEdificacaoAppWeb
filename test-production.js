// Script para testar o comportamento em produção
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Função para exibir mensagem colorida
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Criar servidor express
const app = express();
const PORT = 5173;

// Injetar variáveis de ambiente no HTML
function injectEnvVars(htmlContent) {
  const envVars = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
  };
  
  // Criar script para injetar variáveis
  const envScript = `
    <script>
      window.ENV = ${JSON.stringify(envVars)};
      console.log('Variáveis de ambiente injetadas:', window.ENV);
    </script>
  `;
  
  // Injetar antes do fechamento da tag head
  return htmlContent.replace('</head>', `${envScript}</head>`);
}

// Simular as regras de rewrite do Vercel
app.use('/api/:path(*)', (req, res) => {
  const apiPath = req.params.path;
  res.send(`API simulada: ${apiPath}`);
});

// Servir assets estáticos
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
app.use('/public/assets', express.static(path.join(__dirname, 'dist/public/assets')));

// Simular o comportamento de fallback para index.html
app.get('*', (req, res) => {
  try {
    let htmlPath = path.join(__dirname, 'dist/index.html');
    
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.join(__dirname, 'index.html');
      log('Usando index.html na raiz como fallback', colors.yellow);
    }
    
    if (fs.existsSync(htmlPath)) {
      // Ler o HTML e injetar variáveis de ambiente
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      htmlContent = injectEnvVars(htmlContent);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } else {
      throw new Error('Arquivo index.html não encontrado');
    }
  } catch (error) {
    log(`Erro ao servir HTML: ${error.message}`, colors.red);
    res.status(500).send(`Erro: ${error.message}`);
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  log(`🚀 Servidor de teste iniciado em http://localhost:${PORT}`, colors.green);
  log(`🔑 Variáveis de ambiente carregadas:`, colors.cyan);
  log(`   VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ Definida' : '❌ Indefinida'}`, process.env.VITE_SUPABASE_URL ? colors.green : colors.red);
  log(`   VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Indefinida'}`, process.env.VITE_SUPABASE_ANON_KEY ? colors.green : colors.red);
  
  log('\n💻 Este ambiente simula:');
  log('   1. Injeção de variáveis de ambiente como window.ENV');
  log('   2. Regras de rewrite do Vercel');
  log('   3. Servir assets de múltiplos diretórios');
  log('   4. Fallback para index.html');
  
  log('\n📝 Para testar:');
  log('   1. Abra http://localhost:5173 no navegador');
  log('   2. Verifique o console do navegador para confirmar que as variáveis de ambiente foram carregadas');
  log('   3. Verifique se os assets estão sendo carregados corretamente');
});