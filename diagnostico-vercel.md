# Diagnóstico e Solução para Problemas de Deploy no Vercel

## Problemas Identificados

Após análise detalhada, identificamos os seguintes problemas que afetam o funcionamento da aplicação no ambiente Vercel:

1. **Configuração de Variáveis de Ambiente**:
   - As variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não estavam sendo corretamente injetadas no cliente
   - O código não estava preparado para acessar variáveis de ambiente através do objeto `window.ENV`
   - Inconsistência na forma de acesso às variáveis entre desenvolvimento e produção

2. **Caminhos de Assets**:
   - Os assets estavam sendo referenciados como `/assets/...` mas na Vercel estavam em `/public/assets/...`
   - As regras de rewrite no `vercel.json` não estavam redirecionando corretamente esses caminhos
   - A estrutura de pastas no build final era inconsistente

3. **Ponto de Entrada da Aplicação**:
   - O arquivo `index.html` não estava sendo corretamente posicionado na raiz do diretório `dist`
   - A regra de rewrite no Vercel estava apontando para `/public/index.html` em vez de `/index.html`

4. **Dependências e Bibliotecas**:
   - Faltava garantir que a biblioteca Supabase estivesse corretamente instalada e disponível
   - Problemas de consistência entre as dependências declaradas e as efetivamente usadas

5. **Falta de Diagnóstico**:
   - Ausência de endpoints e páginas de diagnóstico para ajudar a identificar problemas
   - Dificuldade em capturar erros específicos da Vercel por falta de logs acessíveis

## Soluções Implementadas

### 1. Melhoria na Detecção de Variáveis de Ambiente

Implementamos uma solução robusta no arquivo `client/src/lib/supabase.ts` para detectar variáveis de ambiente de múltiplas fontes:

```typescript
// Adicionar tipagem para o objeto ENV global na window
declare global {
  interface Window {
    ENV?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    };
  }
}

// Obter as variáveis de ambiente de múltiplas fontes possíveis
function getEnvVariable(key: string): string {
  // Tentar obter da janela primeiro (fallback para produção)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    const value = window.ENV[key] || '';
    // Substituir os placeholders se necessário
    return value.startsWith('%') && value.endsWith('%') ? '' : value;
  }
  
  // Tentar obter das variáveis de ambiente do Vite
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  
  // Fallback
  return '';
}
```

### 2. Correção do Ponto de Entrada na Vercel

Atualizamos o `vercel.json` para apontar diretamente para o arquivo `index.html` na raiz:

```json
{
  "rewrites": [
    { "source": "/api/healthcheck", "destination": "/api/healthcheck.mjs" },
    { "source": "/api/:path*", "destination": "/api/:path*.mjs" },
    { "source": "/assets/:path*", "destination": "/public/assets/:path*" },
    { "source": "/client/assets/:path*", "destination": "/public/client/assets/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3. Script de Build Aprimorado

Reformulamos completamente o script `vercel-build.mjs` para:

1. Verificar e reportar o status das variáveis de ambiente
2. Buscar o arquivo `index.html` em múltiplas localizações possíveis
3. Injetar automaticamente as variáveis de ambiente no HTML como um script de inicialização
4. Corrigir os caminhos dos assets no HTML gerado
5. Sincronizar assets entre múltiplos diretórios para garantir compatibilidade
6. Criar um arquivo de diagnóstico como fallback caso nenhum `index.html` seja encontrado
7. Gerar um arquivo `healthcheck.json` para diagnóstico rápido

### 4. Endpoint de Diagnóstico

Criamos um endpoint `/api/healthcheck` que pode ser acessado mesmo se o frontend falhar:

```javascript
// api/healthcheck.mjs
export default function handler(req, res) {
  // Retorna informações detalhadas sobre o ambiente
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
    env: {
      supabase_url_set: !!process.env.VITE_SUPABASE_URL,
      supabase_anon_key_set: !!process.env.VITE_SUPABASE_ANON_KEY,
      storage_type: process.env.STORAGE_TYPE || 'não definido'
    },
    vercel: {
      is_vercel: !!process.env.VERCEL,
      vercel_env: process.env.VERCEL_ENV || 'não definido',
      region: process.env.VERCEL_REGION || 'não definido'
    }
  };
  
  res.status(200).json(health);
}
```

### 5. Página de Diagnóstico Estática

Criamos um arquivo `static-index.html` que serve como página de diagnóstico independente:

- Verifica se as variáveis de ambiente estão disponíveis
- Testa a conexão com o Supabase usando CDN
- Verifica os caminhos de assets
- Não depende do build da aplicação

## Como Testar o Deploy

1. **Verificar API de Diagnóstico**:
   - Acesse `https://seu-dominio.vercel.app/api/healthcheck`
   - Verifique se o JSON retornado mostra `"supabase_url_set": true` e `"supabase_anon_key_set": true`

2. **Verificar Página de Diagnóstico**:
   - Se a aplicação principal não carregar, acesse `https://seu-dominio.vercel.app/static-index.html`
   - Use os botões para testar variáveis de ambiente, conexão Supabase e caminhos

3. **Verificar Console do Navegador**:
   - Abra o console do navegador (F12) ao acessar a aplicação
   - Verifique se há mensagens "ENV carregado: Object" no início
   - Procure por erros relacionados ao Supabase ou carregamento de assets

4. **Verificar Arquivo de Saúde**:
   - Acesse `https://seu-dominio.vercel.app/healthcheck.json`
   - Confirme que o status é "ok" e as variáveis de ambiente estão definidas

## Próximos Passos se os Problemas Persistirem

1. **Verificar Logs da Vercel**:
   - Acesse o painel da Vercel e verifique os logs de build e função serverless
   - Procure por erros específicos no processo de build

2. **Testar Rotas Específicas**:
   - Acesse diretamente `https://seu-dominio.vercel.app/assets/index.js` 
   - Verifique se os arquivos JS e CSS principais estão acessíveis

3. **Configuração Manual**:
   - Tente adicionar manualmente um arquivo `.env.production` com as variáveis de ambiente
   - Refaça o deploy e verifique se há alterações no comportamento

4. **Usar Injeção no HTML**:
   - Modifique diretamente o HTML inicial para injetar as variáveis como constantes:
   ```html
   <script>
     window.ENV = {
       VITE_SUPABASE_URL: "https://mizihlfmbcfgomlutiss.supabase.co",
       VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pemlobGZtYmNmZ29tbHV0aXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MDA0MjYsImV4cCI6MjA1ODQ3NjQyNn0.4AkfkgtPzFwvAIfZFCT8LxxK2mIk9hgXiwbfvBthzRQ"
     };
   </script>
   ```

## Arquivos Importantes a Verificar

1. `vercel.json` - Controla redirecionamentos e configurações do deploy
2. `vercel-build.mjs` - Script de build personalizado
3. `client/src/lib/supabase.ts` - Configuração do cliente Supabase
4. `api/healthcheck.mjs` - Endpoint de diagnóstico
5. `static-index.html` - Página de diagnóstico estática