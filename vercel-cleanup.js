/**
 * Este script remove arquivos conflitantes antes do build
 * para evitar erros de "conflicting paths or names"
 * 
 * Versão aprimorada que detecta e ignora certos tipos de conflitos que não causam problemas,
 * como entre .js e .html
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de pares de extensões que realmente causam conflitos
const conflictingExtensions = [
  ['.js', '.mjs'],
  ['.ts', '.mts']
];

// Lista de pares de arquivos que têm conflitos conhecidos específicos
const conflictingPairs = [
  ['api/healthcheck.js', 'api/healthcheck.mjs'],
  ['api/index.js', 'api/index.mjs'],
  ['api/diagnostico.js', 'api/diagnostico.mjs'],
  ['api/supabase-status.js', 'api/supabase-status.mjs'],
  ['dist/index.js', 'dist/index.mjs']
];

// Arquivos específicos a serem removidos (não são pares, mas podem causar conflitos)
const specificFilesToRemove = [
  'test-supabase.js'  // Não remover o .html porque é necessário para testes
];

// Nome de arquivos que não devem ser removidos mesmo se tiverem extensão conflitante
const exclusions = [
  'vercel-build.mjs',
  'vercel-build-simple.mjs'
];

console.log('Iniciando limpeza de arquivos conflitantes...');

// Remover arquivos específicos que podem causar problemas
specificFilesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`Removendo arquivo específico: ${file}`);
    fs.unlinkSync(file);
  }
});

// Remover arquivos .mjs conflitantes específicos
conflictingPairs.forEach(([jsFile, mjsFile]) => {
  if (fs.existsSync(mjsFile)) {
    console.log(`Removendo arquivo conflitante: ${mjsFile}`);
    fs.unlinkSync(mjsFile);
  }
});

// Função para verificar se duas extensões realmente causam conflito
function doExtensionsConflict(ext1, ext2) {
  // Verifica se o par de extensões está na lista de conflitos
  return conflictingExtensions.some(
    ([conflictExt1, conflictExt2]) => 
      (ext1 === conflictExt1 && ext2 === conflictExt2) || 
      (ext1 === conflictExt2 && ext2 === conflictExt1)
  );
}

// Função recursiva para encontrar e remover arquivos conflitantes em um diretório
function cleanConflictingFiles(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  const filesByBasename = {};
  
  // Primeiro passo: agrupar arquivos pelo nome base (sem extensão)
  for (const file of files) {
    if (file.isDirectory() && 
        file.name !== 'node_modules' && 
        file.name !== '.git') {
      cleanConflictingFiles(path.join(directory, file.name));
      continue;
    }
    
    if (file.isFile()) {
      const baseName = path.basename(file.name, path.extname(file.name));
      const extension = path.extname(file.name);
      const fullPath = path.join(directory, file.name);
      
      // Ignorar arquivos na lista de exclusões
      if (exclusions.some(exc => fullPath.includes(exc))) {
        continue;
      }
      
      if (!filesByBasename[baseName]) {
        filesByBasename[baseName] = [];
      }
      
      filesByBasename[baseName].push({
        path: fullPath,
        extension
      });
    }
  }
  
  // Segundo passo: verificar conflitos para cada grupo de arquivos com o mesmo nome base
  for (const [baseName, fileList] of Object.entries(filesByBasename)) {
    if (fileList.length > 1) {
      // Prioridade para manter arquivos: .js sobre .mjs, .ts sobre .mts
      const filesToKeep = [];
      const filesToRemove = [];
      
      // Organizar os arquivos em grupos por extensão
      for (let i = 0; i < fileList.length; i++) {
        const file1 = fileList[i];
        
        for (let j = i + 1; j < fileList.length; j++) {
          const file2 = fileList[j];
          
          if (doExtensionsConflict(file1.extension, file2.extension)) {
            // Determinar qual arquivo manter baseado na prioridade
            if (file1.extension === '.mjs' || file1.extension === '.mts') {
              filesToRemove.push(file1.path);
            } else if (file2.extension === '.mjs' || file2.extension === '.mts') {
              filesToRemove.push(file2.path);
            }
          }
        }
      }
      
      // Remover arquivos conflitantes
      filesToRemove.forEach(file => {
        if (fs.existsSync(file)) {
          console.log(`Removendo arquivo conflitante: ${file}`);
          fs.unlinkSync(file);
        }
      });
    }
  }
}

// Iniciar limpeza recursiva a partir da raiz do projeto
try {
  cleanConflictingFiles('.');
} catch (error) {
  console.error('Erro ao limpar arquivos conflitantes:', error.message);
}

console.log('Limpeza concluída.');