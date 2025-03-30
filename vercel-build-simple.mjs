/**
 * Script de construção mais simples para o ambiente Vercel
 * 
 * Este script simplifica o processo de build para Vercel, utilizando
 * o modo padrão de construção das ferramentas.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Iniciando processo de build simplificado para Vercel');

try {
  // 1. Executando build do projeto
  console.log('📦 Compilando o projeto...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build do projeto concluído com sucesso!');

  // 2. Verificando diretório dist
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('❌ Diretório "dist" não encontrado após o build!');
    process.exit(1);
  }

  // 3. Verificando arquivos importantes
  console.log('🔍 Verificando arquivos essenciais...');
  ['index.html', 'assets'].forEach(item => {
    const itemPath = path.join(distDir, item);
    if (!fs.existsSync(itemPath)) {
      console.error(`❌ Item "${item}" não encontrado em dist/!`);
      process.exit(1);
    }
  });

  console.log('✅ Verificação de arquivos concluída!');

  // 4. Exibindo resultado final
  console.log('🚀 Build simples concluído! Pronto para implantação no Vercel.');
  
} catch (error) {
  console.error('❌ Erro durante o processo de build:', error);
  process.exit(1);
}