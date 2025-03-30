# Guia de Deploy para Vercel

Este guia contém instruções detalhadas para implantar este projeto na Vercel com sucesso, garantindo que problemas comuns sejam evitados.

## Verificação Pré-Deploy

Antes de fazer o deploy, execute os seguintes scripts de verificação para identificar possíveis problemas:

```bash
# Verificação geral de conflitos e configuração
node vercel-pre-deploy-check.js

# Verificação específica dos arquivos de API
node vercel-api-check.js

# Verificação de variáveis de ambiente (opcional)
node vercel-env-check.js
```

Estes scripts verificam:
- Arquivos conflitantes que podem causar falhas no build
- Configuração correta do vercel.json
- Presença do arquivo .vercelignore
- Scripts de build no package.json
- Estrutura e formato corretos dos arquivos de API
- Configuração de roteamento de API no vercel.json
- Variáveis de ambiente necessárias para o funcionamento da aplicação

## Passos para Deploy

1. **Verifique os arquivos de configuração da Vercel**:
   - `vercel.json` está configurado corretamente
   - `.vercelignore` contém as exclusões necessárias

2. **Resolva conflitos de arquivos**:
   - Execute `node vercel-cleanup.js` antes do build para remover arquivos conflitantes automaticamente
   - Este script é executado automaticamente como parte do `buildCommand` no vercel.json

3. **Estrutura do projeto**:
   - A aplicação React principal está em `client/`
   - APIs serverless estão em `api/` (usando extensão .js)
   - Componentes e hooks React alternativos estão em `src/`
   
4. **Implantação**:
   - Recomendamos usar o deploy automático via GitHub para garantir que o processo de build da Vercel seja executado corretamente
   - Você também pode usar o Vercel CLI para deploy, mas certifique-se de que todos os arquivos estão no repositório

## Solução de Problemas Comuns

### Erro: "Conflicting paths or names"
Este erro ocorre quando há arquivos com mesmo nome base, mas extensões diferentes (.js/.mjs ou .ts/.mts).
Solução: Execute `node vercel-cleanup.js` para remover automaticamente os arquivos conflitantes.

### Erro: "One or more of your API routes encountered an error"
Solução: Verifique se todas as rotas de API usam consistentemente a extensão .js (não .mjs).

### Erro: "Build optimization failed: found page without a React Component"
Este erro ocorre quando há problemas com as importações ou quando algum componente não está sendo exportado corretamente.
Solução: Verifique se todos os componentes estão sendo exportados corretamente e se as importações estão funcionando.

### Erro: "Error occurred prerendering page"
Este erro pode ocorrer quando há problemas com a geração estática das páginas.
Solução: Verifique se há erros durante o processo de build, principalmente no console de build da Vercel.

### Paths incorretos na aplicação implantada
Solução: Verifique se o `vercel.json` contém as regras de rewrite corretas para redirecionar rotas.

### Variáveis de ambiente não funcionando
Solução: Certifique-se de que todas as variáveis de ambiente estão configuradas corretamente no painel da Vercel.
Variáveis para o frontend devem começar com `VITE_` para serem expostas à aplicação.

## Configuração de Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis de ambiente no painel da Vercel:

- `VITE_SUPABASE_URL` - URL da instância do Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - (Opcional) Chave de serviço do Supabase para funções administrativas

## Estrutura Esperada do Build

Após o build, a estrutura dos arquivos deve ser:

```
dist/
├── public/       # Assets estáticos e arquivos do frontend buildados
│   ├── assets/   # JS/CSS/Imagens compilados
│   └── index.html
├── api/          # Funções serverless
│   ├── healthcheck.js
│   ├── index.js
│   └── ...outros
└── index.js      # Servidor Express para rotas dinâmicas
```

## Verificação Pós-Deploy

Após o deploy, verifique:

1. Se a página principal carrega corretamente
2. Se as APIs funcionam (teste `/api/healthcheck`)
3. Se as variáveis de ambiente estão configuradas corretamente
4. Se as rotas dinâmicas estão funcionando

---

Para mais informações, consulte a [documentação da Vercel](https://vercel.com/docs) ou [entre em contato com o suporte da Vercel](https://vercel.com/support).