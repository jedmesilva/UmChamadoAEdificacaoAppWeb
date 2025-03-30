import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configura o ambiente
process.env.NODE_ENV = 'production';
process.env.STORAGE_TYPE = 'supabase';

console.log('🔨 Iniciando build para Vercel...');

// Verificar variáveis de ambiente críticas
console.log('Verificando variáveis de ambiente do Supabase...');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('⚠️ AVISO: Variável VITE_SUPABASE_URL não está definida!');
} else {
  console.log('✅ VITE_SUPABASE_URL está configurada corretamente.');
}

if (!supabaseAnonKey) {
  console.warn('⚠️ AVISO: Variável VITE_SUPABASE_ANON_KEY não está definida!');
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY está configurada corretamente.');
}

try {
  // Executa o build da aplicação
  console.log('📦 Construindo o frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verifica se o diretório dist/public existe
  if (!fs.existsSync('dist/public')) {
    console.log('⚠️ Diretório dist/public não encontrado, criando...');
    fs.mkdirSync('dist/public', { recursive: true });
  }

  // Verificar e criar diretórios necessários (from original code)
  var requiredDirs = [
    'dist',
    'dist/api',
    'dist/assets',
    'dist/static'
  ];

  for (var i = 0; i < requiredDirs.length; i++) {
    var dir = requiredDirs[i];
    if (!fs.existsSync(dir)) {
      console.log('Criando diretório ' + dir + '...');
      fs.mkdirSync(dir, { recursive: true });
    }
  }


  // Copiar arquivos .mjs para a pasta dist (from original code)
  console.log('Copiando arquivos .mjs para a pasta dist...');

  // Copiar index.mjs e package.json para a raiz de dist (from original code)
  if (fs.existsSync('index.mjs')) {
    console.log('Copiando index.mjs para dist...');
    fs.copyFileSync('index.mjs', path.join('dist', 'index.mjs'));

    // Copiar também como index.js para garantir compatibilidade total (from original code)
    console.log('Criando cópia como index.js para compatibilidade...');
    fs.copyFileSync('index.mjs', path.join('dist', 'index.js'));
  }

  // Copiar package.json para dist para referência de dependências (from original code)
  if (fs.existsSync('package.json')) {
    console.log('Copiando package.json para dist...');
    fs.copyFileSync('package.json', path.join('dist', 'package.json'));

    // Garantir que o tipo do módulo está definido como module (from original code)
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      packageJson.type = 'module';
      fs.writeFileSync(
        path.join('dist', 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      console.log('package.json atualizado com "type": "module"');
    } catch (err) {
      console.error('Erro ao atualizar package.json:', err);
    }
  }

  // Copiar todos os arquivos da pasta api para dist/api (from original code)
  if (fs.existsSync('api')) {
    console.log('Copiando arquivos da pasta api para dist/api...');
    const apiFiles = fs.readdirSync('api');

    for (const file of apiFiles) {
      const srcPath = path.join('api', file);
      const destPath = path.join('dist', 'api', file);

      if (fs.statSync(srcPath).isFile()) {
        console.log(`Copiando ${file} para dist/api...`);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

    //Copiar vercel.json (from original code)
    if (fs.existsSync('vercel.json')) {
        console.log('Copiando vercel.json para dist...');
        fs.copyFileSync('vercel.json', path.join('dist', 'vercel.json'));
    }

  // Verificar e copiar o index.html principal para a raiz do dist
  console.log('Copiando index.html para diretório raiz do dist...');
  if (fs.existsSync('index.html')) {
    console.log('Copiando index.html raiz para dist/');
    fs.copyFileSync('index.html', path.join('dist', 'index.html'));
  } else if (fs.existsSync('dist/public/index.html')) {
    console.log('Copiando dist/public/index.html para dist/');
    fs.copyFileSync('dist/public/index.html', path.join('dist', 'index.html'));
    
    // Corrigir os caminhos dos assets no index.html
    try {
      console.log('Corrigindo caminhos dos assets no index.html...');
      let indexHTML = fs.readFileSync(path.join('dist', 'index.html'), 'utf8');
      indexHTML = indexHTML.replace(/src="\/assets\//g, 'src="/public/assets/');
      indexHTML = indexHTML.replace(/href="\/assets\//g, 'href="/public/assets/');
      fs.writeFileSync(path.join('dist', 'index.html'), indexHTML);
      console.log('Caminhos corrigidos com sucesso.');
    } catch (err) {
      console.error('Erro ao corrigir caminhos dos assets:', err);
    }
  } else if (fs.existsSync('client/index.html')) {
    console.log('Copiando client/index.html para dist/');
    fs.copyFileSync('client/index.html', path.join('dist', 'index.html'));
  } else {
    console.warn('WARNING: Nenhum arquivo index.html encontrado. Criando fallback...');
    // Criar um arquivo de fallback simples
    const fallbackHTML = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Um Chamado à Edificação</title>
    <style>
      body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
      div { max-width: 500px; padding: 2rem; }
      h1 { margin-bottom: 1rem; }
    </style>
  </head>
  <body>
    <div>
      <h1>Um Chamado à Edificação</h1>
      <p>Carregando aplicação...</p>
      <button onclick="window.location.reload()">Recarregar</button>
    </div>
  </body>
</html>`;
    fs.writeFileSync(path.join('dist', 'index.html'), fallbackHTML);
    console.log('Arquivo de fallback criado.');
  }
  
  // Verificar e garantir que a pasta dist/assets existe (necessária para scripts)
  console.log('Verificando e preparando pasta de assets...');
  
  // Criar pasta dist/assets se não existir
  if (!fs.existsSync('dist/assets')) {
    console.log('Criando diretório dist/assets...');
    fs.mkdirSync('dist/assets', { recursive: true });
  }
  
  // Verificar possíveis localizações da pasta de assets
  const possibleAssetsPaths = [
    'dist/public/assets',
    'client/dist/assets',
    'public/assets',
    'dist/assets', // Verificar se já existe
    'client/assets',
    'client/public/assets'
  ];
  
  let assetsCopied = false;
  
  // Garantir que a pasta de destino existe
  if (!fs.existsSync('dist/assets')) {
    console.log('Criando diretório dist/assets...');
    fs.mkdirSync('dist/assets', { recursive: true });
  }
  
  // Garantir que dist/public/assets existe para uso pelo Vercel
  if (!fs.existsSync('dist/public/assets')) {
    console.log('Criando diretório dist/public/assets para garantir compatibilidade com Vercel...');
    fs.mkdirSync('dist/public/assets', { recursive: true });
  }
  
  console.log('Verificando todas as possíveis localizações de assets...');
  
  for (const assetPath of possibleAssetsPaths) {
    if (fs.existsSync(assetPath)) {
      console.log(`Encontrada pasta de assets em: ${assetPath}`);
      try {
        console.log(`Copiando assets de ${assetPath} para dist/assets...`);
        // Listar todos os arquivos na pasta de origem
        const files = fs.readdirSync(assetPath);
        console.log(`Encontrados ${files.length} arquivos em ${assetPath}`);
        
        // Copiar cada arquivo individualmente
        for (const file of files) {
          const srcFile = path.join(assetPath, file);
          const destFile = path.join('dist/assets', file);
          
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`Copiado: ${file}`);
          } else if (fs.statSync(srcFile).isDirectory()) {
            // Criar o diretório de destino se não existir
            if (!fs.existsSync(path.join('dist/assets', file))) {
              fs.mkdirSync(path.join('dist/assets', file), { recursive: true });
            }
            
            // Copiar todo o conteúdo do diretório recursivamente
            const nestedFiles = fs.readdirSync(srcFile);
            for (const nestedFile of nestedFiles) {
              const nestedSrcFile = path.join(srcFile, nestedFile);
              const nestedDestFile = path.join('dist/assets', file, nestedFile);
              
              if (fs.statSync(nestedSrcFile).isFile()) {
                fs.copyFileSync(nestedSrcFile, nestedDestFile);
                console.log(`Copiado: ${file}/${nestedFile}`);
              } else {
                fs.cpSync(nestedSrcFile, nestedDestFile, { recursive: true });
                console.log(`Copiado diretório: ${file}/${nestedFile}`);
              }
            }
          }
        }
        
        console.log(`Pasta de assets copiada com sucesso de ${assetPath} para dist/assets`);
        assetsCopied = true;
      } catch (err) {
        console.error(`Erro ao copiar pasta assets de ${assetPath}:`, err);
      }
    }
  }
  
  // Verificar também arquivos JS na raiz de dist/public
  if (fs.existsSync('dist/public')) {
    console.log('Verificando arquivos JS em dist/public...');
    try {
      const findJsFiles = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            findJsFiles(filePath, fileList);
          } else if (file.endsWith('.js')) {
            fileList.push(filePath);
          }
        });
        return fileList;
      };
      
      const jsFiles = findJsFiles('dist/public');
      console.log(`Encontrados ${jsFiles.length} arquivos JS em dist/public`);
      
      if (jsFiles.length > 0) {
        // Se não encontramos assets em nenhum lugar, mas temos JS files, vamos copiá-los para dist/assets
        if (!assetsCopied) {
          console.log('Copiando arquivos JS para dist/assets...');
          for (const jsFile of jsFiles) {
            const relativePath = path.relative('dist/public', jsFile);
            const destPath = path.join('dist/assets', path.basename(relativePath));
            
            fs.copyFileSync(jsFile, destPath);
            console.log(`Copiado JS para assets: ${path.basename(relativePath)}`);
          }
          assetsCopied = true;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar arquivos JS:', err);
    }
  }
  
  if (!assetsCopied) {
    console.warn('AVISO: Nenhuma pasta de assets encontrada para copiar!');
    
    // Verificar se há algum arquivo JavaScript em dist/public
    if (fs.existsSync('dist/public')) {
      console.log('Verificando arquivos JS em dist/public...');
      try {
        const findJsFiles = (dir, fileList = []) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              findJsFiles(filePath, fileList);
            } else if (file.endsWith('.js')) {
              fileList.push(filePath);
            }
          });
          return fileList;
        };
        
        const jsFiles = findJsFiles('dist/public');
        console.log(`Encontrados ${jsFiles.length} arquivos JS em dist/public`);
        
        if (jsFiles.length > 0) {
          for (const jsFile of jsFiles) {
            const relativePath = path.relative('dist/public', jsFile);
            const destDir = path.dirname(path.join('dist', relativePath));
            
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.copyFileSync(jsFile, path.join('dist', relativePath));
            console.log(`Copiado JS: ${relativePath}`);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar arquivos JS:', err);
      }
    }
  }
  
  // Garantir que os assets estão tanto em dist/assets quanto em dist/public/assets
  if (fs.existsSync('dist/assets') && fs.existsSync('dist/public/assets')) {
    console.log('Sincronizando assets entre dist/assets e dist/public/assets...');
    
    // Copiar de dist/assets para dist/public/assets
    if (fs.existsSync('dist/assets')) {
      const assetsFiles = fs.readdirSync('dist/assets');
      for (const file of assetsFiles) {
        const srcFile = path.join('dist/assets', file);
        const destFile = path.join('dist/public/assets', file);
        
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`Copiado para public: ${file}`);
        } else if (fs.statSync(srcFile).isDirectory()) {
          fs.cpSync(srcFile, destFile, { recursive: true });
          console.log(`Copiado diretório para public: ${file}`);
        }
      }
    }
    
    // Copiar de dist/public/assets para dist/assets
    if (fs.existsSync('dist/public/assets')) {
      const publicAssetsFiles = fs.readdirSync('dist/public/assets');
      for (const file of publicAssetsFiles) {
        const srcFile = path.join('dist/public/assets', file);
        const destFile = path.join('dist/assets', file);
        
        if (fs.statSync(srcFile).isFile() && !fs.existsSync(destFile)) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`Copiado de public: ${file}`);
        } else if (fs.statSync(srcFile).isDirectory() && !fs.existsSync(destFile)) {
          fs.cpSync(srcFile, destFile, { recursive: true });
          console.log(`Copiado diretório de public: ${file}`);
        }
      }
    }
  }
  
  // Listar conteúdo da pasta dist/assets para verificação
  console.log('Verificando conteúdo final de dist/assets:');
  if (fs.existsSync('dist/assets')) {
    try {
      const assetsFiles = fs.readdirSync('dist/assets');
      console.log(`Conteúdo de dist/assets (${assetsFiles.length} itens):`);
      assetsFiles.forEach(file => console.log(` - ${file}`));
    } catch (err) {
      console.error('Erro ao listar conteúdo da pasta dist/assets:', err);
    }
  } else {
    console.warn('AVISO: Pasta dist/assets não existe após tentativa de cópia!');
  }
  
  // Listar conteúdo da pasta dist/public/assets para verificação
  console.log('Verificando conteúdo final de dist/public/assets:');
  if (fs.existsSync('dist/public/assets')) {
    try {
      const assetsFiles = fs.readdirSync('dist/public/assets');
      console.log(`Conteúdo de dist/public/assets (${assetsFiles.length} itens):`);
      assetsFiles.forEach(file => console.log(` - ${file}`));
    } catch (err) {
      console.error('Erro ao listar conteúdo da pasta dist/public/assets:', err);
    }
  } else {
    console.warn('AVISO: Pasta dist/public/assets não existe após tentativa de cópia!');
  }


  console.log('✅ Build personalizado concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro durante o build personalizado:', error);
  process.exit(1);
}