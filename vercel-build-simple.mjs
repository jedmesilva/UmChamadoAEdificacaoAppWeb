#!/usr/bin/env node
/**
 * Script de build simplificado para implantação na Vercel.
 * Este script prepara o ambiente de produção com configurações otimizadas.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  try {
    console.log('🚀 Iniciando build para Vercel...');
    
    // 1. Build padrão com npm
    console.log('📦 Executando build padrão...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 2. Verificar se a pasta dist existe
    const distExists = await fs.access('dist').then(() => true).catch(() => false);
    
    if (!distExists) {
      console.error('❌ Pasta dist não foi criada durante o build.');
      process.exit(1);
    }
    
    // 3. Copiar os arquivos necessários para a pasta dist
    console.log('📋 Copiando arquivos para dist...');
    
    // 3.1 Criar arquivos API específicos para Vercel
    const apiDir = path.join('dist', 'api');
    await fs.mkdir(apiDir, { recursive: true });
    
    // Verificar se há arquivos API disponíveis
    if (await fs.access('api').then(() => true).catch(() => false)) {
      const apiFiles = await fs.readdir('api');
      
      for (const file of apiFiles) {
        if (file.endsWith('.js') || file.endsWith('.mjs')) {
          const source = path.join('api', file);
          const dest = path.join(apiDir, file.replace('.mjs', '.js'));
          
          await fs.copyFile(source, dest);
          console.log(`  - Copiado ${source} para ${dest}`);
        }
      }
    }
    
    // 3.2 Garantir que o index.html esteja na raiz da dist
    if (await fs.access('index.html').then(() => true).catch(() => false)) {
      await fs.copyFile('index.html', path.join('dist', 'index.html'));
      console.log('  - Copiado index.html para dist/index.html');
    }
    
    // 4. Criar o arquivo healthcheck.json para diagnóstico
    const healthcheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      build: {
        env: {
          node_env: process.env.NODE_ENV,
          supabase_url_set: !!process.env.VITE_SUPABASE_URL,
          supabase_anon_key_set: !!process.env.VITE_SUPABASE_ANON_KEY,
          storage_type: process.env.STORAGE_TYPE
        }
      },
      vercel: {
        is_vercel: !!process.env.VERCEL,
        vercel_env: process.env.VERCEL_ENV || 'não definido',
        region: process.env.VERCEL_REGION || 'não definido'
      }
    };
    
    await fs.writeFile(
      path.join('dist', 'healthcheck.json'), 
      JSON.stringify(healthcheck, null, 2)
    );
    console.log('  - Criado healthcheck.json para diagnóstico');
    
    console.log('✅ Build concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o build:', error);
    process.exit(1);
  }
}

main();