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
  
  // 3.1 Arquivos do frontend
  const publicDir = path.join(distDir, 'public');
  if (!fs.existsSync(publicDir)) {
    console.log('⚠️ Diretório "dist/public" não encontrado!');
  } else {
    ['index.html', 'assets'].forEach(item => {
      const itemPath = path.join(publicDir, item);
      if (!fs.existsSync(itemPath)) {
        console.warn(`⚠️ Item "${item}" não encontrado em dist/public/!`);
      } else {
        console.log(`✅ ${item} verificado com sucesso`);
      }
    });
  }
  
  // 3.2 Verificar arquivos do servidor
  const serverFile = path.join(distDir, 'index.js');
  if (!fs.existsSync(serverFile)) {
    console.warn('⚠️ Arquivo do servidor "dist/index.js" não encontrado!');
  } else {
    console.log('✅ Servidor compilado encontrado');
  }
  
  // 3.3 Verificar arquivos de API (vercel serverless functions)
  console.log('🔍 Verificando funções da API...');
  
  // Verificar se pasta dist/api existe (para funções serverless)
  const apiDir = path.join(distDir, 'api');
  if (!fs.existsSync(apiDir)) {
    // Se não existir, verificar se as APIs originais estão na raiz
    if (fs.existsSync('api')) {
      console.log('⚠️ Diretório "api" encontrado na raiz, mas não em "dist/api".');
      console.log('   Isto pode ser esperado se as APIs forem copiadas depois pelo Vercel.');
    } else {
      console.warn('⚠️ Nenhum diretório de API encontrado!');
    }
  } else {
    const apiFiles = fs.readdirSync(apiDir);
    console.log(`✅ ${apiFiles.length} arquivos de API encontrados em dist/api/`);
  }

  console.log('✅ Verificação de arquivos concluída!');

  // 4. Exibindo resultado final
  console.log('🚀 Build simples concluído! Pronto para implantação no Vercel.');
  
} catch (error) {
  console.error('❌ Erro durante o processo de build:', error);
  process.exit(1);
}