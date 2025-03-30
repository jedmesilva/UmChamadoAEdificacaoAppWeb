# Diagnóstico e Solução para Problemas de Deploy no Vercel

## Problemas Identificados

Após análise detalhada, identificamos os seguintes problemas que afetam o funcionamento da aplicação no ambiente Vercel:

1. **Configuração de Variáveis de Ambiente**:
   - As variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não estavam sendo corretamente injetadas no cliente
   - O código não estava preparado para acessar variáveis de ambiente através do objeto `window.ENV`

2. **Caminhos de Assets**:
   - Os assets estavam sendo referenciados como `/assets/...` mas na Vercel estavam em `/public/assets/...`
   - As regras de rewrite no `vercel.json` não estavam redirecionando corretamente esses caminhos

3. **Estrutura de Diretórios no Build**:
   - O Vercel estava procurando arquivos em localizações diferentes das que estavam sendo geradas pelo build
   - Faltava sincronização entre as pastas `dist/assets` e `dist/public/assets`

4. **Tipagem TypeScript para Ambiente Global**:
   - A aplicação não tinha definições de tipo para o objeto global `window.ENV`
   - Isso causava erros de compilação TypeScript

## Soluções Implementadas

### 1. Melhoria na Detecção de Variáveis de Ambiente

No arquivo `client/src/lib/supabase.ts`, implementamos uma solução robusta que:

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

### 2. Aprimoramento do Script de Build para Vercel

No arquivo `vercel-build.mjs`, implementamos:

- Verificação detalhada das variáveis de ambiente
- Cópia dos assets para múltiplos diretórios para garantir compatibilidade
- Correção dos caminhos dos assets no HTML
- Garantia de que o arquivo `index.html` está na raiz do diretório `dist`

### 3. Atualização das Regras de Rewrite no Vercel.json

Configuramos o `vercel.json` para redirecionar corretamente os caminhos:

```json
{
  "rewrites": [
    { "source": "/api/healthcheck", "destination": "/api/healthcheck.mjs" },
    { "source": "/api/:path*", "destination": "/api/:path*.mjs" },
    { "source": "/assets/:path*", "destination": "/public/assets/:path*" },
    { "source": "/client/assets/:path*", "destination": "/public/client/assets/:path*" },
    { "source": "/(.*)", "destination": "/public/index.html" }
  ]
}
```

### 4. Ferramentas de Diagnóstico Criadas

Criamos ferramentas para verificar e diagnosticar problemas:

1. **test-supabase.js**: Verifica a conectividade com o Supabase
2. **test-build-paths.js**: Verifica a estrutura de diretórios e caminhos após o build
3. **test-production.js**: Simula um ambiente de produção similar ao Vercel
4. **index-test.html**: Página de teste para validar carregamento de assets e conexão com o Supabase

## Recomendações para Deploy

1. Configurar corretamente as variáveis de ambiente no Vercel:
   - `VITE_SUPABASE_URL`: https://mizihlfmbcfgomlutiss.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pemlobGZtYmNmZ29tbHV0aXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MDA0MjYsImV4cCI6MjA1ODQ3NjQyNn0.4AkfkgtPzFwvAIfZFCT8LxxK2mIk9hgXiwbfvBthzRQ

2. Usar o comando personalizado para build:
   ```
   node vercel-build.mjs
   ```

3. Após o deploy, verificar no console do navegador se as variáveis de ambiente estão sendo carregadas corretamente através do objeto `window.ENV`

4. Se persistirem problemas com caminhos de assets, verificar o HTML gerado e ajustar as regras de rewrite no `vercel.json`