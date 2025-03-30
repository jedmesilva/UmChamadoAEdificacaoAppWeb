/**
 * Script para verificar preparação para deploy
 * Este script verifica se há arquivos que podem causar conflitos
 * e recomenda ações para resolver problemas comuns
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(50));
console.log('VERIFICAÇÃO PRÉ-DEPLOY PARA VERCEL');
console.log('='.repeat(50));

// 1. Verificar arquivos conflitantes
console.log('\n1. Verificando arquivos conflitantes...');

const conflictingExtensions = [
  ['.js', '.mjs'],
  ['.ts', '.mts'],
  // Não considerar conflitos entre estes tipos de arquivos
  // ['.js', '.html']  // .js e .html não conflitam
];

let conflictingFiles = [];

function checkForConflicts(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory() && 
        file.name !== 'node_modules' && 
        file.name !== '.git') {
      checkForConflicts(fullPath);
    }
    
    if (file.isFile()) {
      const baseName = path.basename(file.name, path.extname(file.name));
      const extension = path.extname(file.name);
      
      for (const [ext1, ext2] of conflictingExtensions) {
        const alternativeFile = path.join(directory, `${baseName}${extension === ext1 ? ext2 : ext1}`);
        
        if (fs.existsSync(alternativeFile)) {
          conflictingFiles.push({
            file1: fullPath,
            file2: alternativeFile
          });
        }
      }
    }
  }
}

// Verificar na raiz e na pasta api/
try {
  checkForConflicts('.');
  
  // Filtra conflitos entre .js e .html que não causam problemas
  const relevantConflicts = conflictingFiles.filter(({ file1, file2 }) => {
    const ext1 = path.extname(file1);
    const ext2 = path.extname(file2);
    
    // Ignora conflitos entre .js e .html
    if ((ext1 === '.js' && ext2 === '.html') || (ext1 === '.html' && ext2 === '.js')) {
      return false;
    }
    
    return true;
  });
  
  if (relevantConflicts.length === 0) {
    console.log('✅ Nenhum arquivo conflitante encontrado.');
  } else {
    console.log('⚠️ Arquivos conflitantes encontrados:');
    relevantConflicts.forEach(({ file1, file2 }) => {
      console.log(`   - Conflito entre ${file1} e ${file2}`);
    });
    console.log('\nRecomendação: Remova um dos arquivos em cada par conflitante ou');
    console.log('utilize o script vercel-cleanup.js para remover automaticamente.');
  }
  
  // Usamos apenas conflitos relevantes para determinar se há problemas
  conflictingFiles = relevantConflicts;
} catch (error) {
  console.error('❌ Erro ao verificar arquivos conflitantes:', error.message);
}

// 2. Verificar se vercel.json está configurado corretamente
console.log('\n2. Verificando configuração no vercel.json...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (!vercelConfig.buildCommand) {
    console.log('⚠️ Aviso: buildCommand não está definido no vercel.json');
  } else {
    console.log(`✅ buildCommand: ${vercelConfig.buildCommand}`);
  }
  
  if (!vercelConfig.outputDirectory) {
    console.log('⚠️ Aviso: outputDirectory não está definido no vercel.json');
  } else {
    console.log(`✅ outputDirectory: ${vercelConfig.outputDirectory}`);
  }
  
  if (!vercelConfig.rewrites || vercelConfig.rewrites.length === 0) {
    console.log('⚠️ Aviso: rewrites não está configurado no vercel.json');
  } else {
    console.log(`✅ ${vercelConfig.rewrites.length} regras de rewrite configuradas`);
  }
} catch (error) {
  console.error('❌ Erro ao verificar vercel.json:', error.message);
}

// 3. Verificar se .vercelignore está configurado
console.log('\n3. Verificando arquivo .vercelignore...');
try {
  if (fs.existsSync('.vercelignore')) {
    const vercelIgnore = fs.readFileSync('.vercelignore', 'utf8');
    const lines = vercelIgnore.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );
    console.log(`✅ .vercelignore encontrado com ${lines.length} regras.`);
  } else {
    console.log('⚠️ Arquivo .vercelignore não encontrado');
  }
} catch (error) {
  console.error('❌ Erro ao verificar .vercelignore:', error.message);
}

// 4. Verificar se build local funciona
console.log('\n4. Verificando status do projeto para build...');
try {
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log(`✅ Script de build encontrado: "${packageJson.scripts.build}"`);
    } else {
      console.log('⚠️ Nenhum script de build encontrado no package.json');
    }
  } else {
    console.log('❌ package.json não encontrado');
  }
} catch (error) {
  console.error('❌ Erro ao verificar package.json:', error.message);
}

console.log('\n='.repeat(50));
console.log('RESUMO:');
if (conflictingFiles.length > 0) {
  console.log('⚠️ Foram encontrados arquivos conflitantes que podem causar falha no deploy.');
  console.log('   Recomendamos corrigi-los antes de continuar.');
} else {
  console.log('✅ Nenhum problema crítico encontrado. Seu projeto parece estar pronto para deploy.');
}
console.log('='.repeat(50));