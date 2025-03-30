/**
 * Este script verifica a estrutura dos arquivos de API 
 * e garante que eles estejam no formato correto para deploy na Vercel
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('==================================================');
console.log('VERIFICAÇÃO DE ARQUIVOS API PARA VERCEL');
console.log('==================================================');

// Lista de arquivos essenciais da API que devem existir
const essentialApiFiles = [
  'api/index.js',
  'api/healthcheck.js'
];

// Lista de extensões de arquivos que a Vercel suporta para serverless functions
const supportedApiExtensions = ['.js', '.ts'];

// Lista de arquivos especiais que são permitidos mesmo com extensões não suportadas para functions
const allowedSpecialFiles = ['package.json', 'tsconfig.json', 'README.md'];

console.log('\n1. Verificando arquivos essenciais da API...');
let missingEssentialFiles = false;

essentialApiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} encontrado.`);
  } else {
    missingEssentialFiles = true;
    console.log(`❌ ${file} não encontrado!`);
  }
});

if (missingEssentialFiles) {
  console.log(`\n⚠️ Alguns arquivos essenciais estão faltando. É recomendado criar estes`);
  console.log(`   arquivos para garantir o funcionamento básico da API na Vercel.`);
} else {
  console.log(`\n✅ Todos os arquivos essenciais da API foram encontrados.`);
}

// Verificar formatos de arquivo na pasta api/
console.log('\n2. Verificando formatos de arquivo em /api...');

if (!fs.existsSync('api')) {
  console.log(`❌ Pasta api/ não encontrada!`);
} else {
  const apiFiles = fs.readdirSync('api', { withFileTypes: true })
    .filter(file => file.isFile())
    .map(file => file.name);
  
  console.log(`Encontrados ${apiFiles.length} arquivos na pasta api/.`);
  
  let unsupportedFiles = 0;
  apiFiles.forEach(file => {
    // Ignorar arquivos especiais permitidos
    if (allowedSpecialFiles.includes(file)) {
      return;
    }
    
    const ext = path.extname(file);
    if (!supportedApiExtensions.includes(ext)) {
      unsupportedFiles++;
      console.log(`⚠️ ${file} usa a extensão ${ext} que pode não ser bem suportada pela Vercel.`);
    }
  });
  
  if (unsupportedFiles === 0) {
    console.log(`✅ Todos os arquivos usam extensões suportadas.`);
  } else {
    console.log(`\n⚠️ Encontrados ${unsupportedFiles} arquivos com extensões potencialmente não suportadas.`);
    console.log(`   Considere converter estes arquivos para .js ou .ts.`);
  }
  
  // Verificar arquivos index duplicados
  const indexFiles = apiFiles.filter(file => {
    const baseName = path.basename(file, path.extname(file));
    return baseName === 'index';
  });
  
  if (indexFiles.length > 1) {
    console.log(`\n⚠️ Vários arquivos 'index' encontrados em api/: ${indexFiles.join(', ')}`);
    console.log(`   Isso pode causar conflitos. Mantenha apenas um arquivo index.js.`);
  }
}

// Verificar configuração das API routes no vercel.json
console.log('\n3. Verificando configuração das API routes no vercel.json...');

try {
  if (!fs.existsSync('vercel.json')) {
    console.log('❌ vercel.json não encontrado!');
  } else {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    if (!vercelConfig.rewrites || vercelConfig.rewrites.length === 0) {
      console.log('⚠️ Nenhuma regra de rewrite configurada no vercel.json.');
      console.log('   Isso pode afetar o roteamento de API na Vercel.');
    } else {
      const apiRewrites = vercelConfig.rewrites.filter(rewrite => 
        rewrite.source && rewrite.source.startsWith('/api')
      );
      
      if (apiRewrites.length === 0) {
        console.log('⚠️ Nenhuma regra de rewrite específica para /api encontrada.');
      } else {
        console.log(`✅ ${apiRewrites.length} regras de rewrite para API configuradas.`);
      }
    }
  }
} catch (error) {
  console.error('❌ Erro ao verificar vercel.json:', error.message);
}

console.log('\n==================================================');
console.log('RESUMO:');
if (missingEssentialFiles) {
  console.log('⚠️ Alguns arquivos essenciais da API estão faltando.');
  console.log('   Verifique a lista acima e crie os arquivos necessários.');
} else {
  console.log('✅ Estrutura básica da API parece correta para deploy na Vercel.');
}
console.log('==================================================');