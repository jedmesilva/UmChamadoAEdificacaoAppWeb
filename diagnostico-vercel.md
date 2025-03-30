# Diagnóstico de Implantação no Vercel

Este documento contém informações para diagnóstico e solução de problemas comuns na implantação do projeto no Vercel.

## Pontos de Verificação

### 1. Estrutura de Diretórios
- ✅ Código fonte principal em `/src`
- ✅ Arquivos estáticos em `/public`
- ✅ Funções serverless em `/api`
- ✅ Arquivo `index.html` na raiz
- ✅ Configuração do Vercel em `vercel.json`

### 2. Configuração do Vercel (vercel.json)
```json
{
  "version": 2,
  "buildCommand": "node vercel-build-simple.mjs",
  "outputDirectory": "dist",
  "github": {
    "enabled": false,
    "silent": true
  },
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3. Variáveis de Ambiente
Certifique-se de configurar as seguintes variáveis no painel do Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. Endpoints para Diagnóstico
- `/api/healthcheck` - Verifica a saúde básica da API
- `/api/supabase-status` - Verifica a conectividade com o Supabase
- `/api/diagnostico` - Informações completas de diagnóstico do ambiente

## Solução de Problemas Comuns

### Problema: Variáveis de ambiente do Supabase não estão disponíveis
**Solução**: Verifique se adicionou as variáveis no painel do Vercel e se as chaves estão corretas.

### Problema: Rotas não funcionam após navegação ou refresh
**Solução**: Verifique se os rewrites no `vercel.json` estão corretos. Todas as rotas devem redirecionar para `index.html`.

### Problema: Endpoints da API não funcionam
**Solução**: Verifique se os arquivos na pasta `/api` têm a extensão `.js` correta e se exportam uma função `handler` padrão.

### Problema: Erro 404 em arquivos estáticos
**Solução**: Certifique-se de que todos os arquivos estáticos estão na pasta `/public` e são referenciados corretamente.

## Como verificar o diagnóstico

1. Após a implantação, acesse `https://seu-dominio.vercel.app/api/diagnostico`
2. Verifique as informações retornadas, especialmente:
   - Status das variáveis de ambiente
   - Conectividade com o Supabase
   - Informações do ambiente Vercel

## Processo de implantação manual

Se necessário, você pode implantar manualmente via CLI do Vercel:

```bash
# Instalar CLI do Vercel (se necessário)
npm i -g vercel

# Login na conta
vercel login

# Implantar o projeto (a partir da raiz)
vercel
```