const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando o build especializado para a Vercel');

try {
  console.log('📦 Construindo o frontend React com Vite');
  execSync('npx vite build', { stdio: 'inherit' });

  const distDir = path.resolve('./dist');

  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('❌ Erro: index.html não encontrado na pasta dist');
    process.exit(1);
  }

  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro durante o build:', error);
  process.exit(1);
}