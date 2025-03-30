# Diagnóstico de Implantação Vercel

## Visão Geral da Implantação
Este documento fornece um diagnóstico completo e orientações para implantação do aplicativo na Vercel. A aplicação é um projeto React que utiliza Supabase para backend/autenticação.

## Estrutura da Aplicação Atual
```
.
├── api/                          # Serverless functions para Vercel
│   ├── healthcheck.js            # Verificação básica de saúde da aplicação
│   ├── supabase-status.js        # Verificação do status da conexão Supabase
│   └── diagnostico.js            # Diagnóstico detalhado da aplicação
├── client/                       # Aplicação React frontend
│   ├── public/                   # Arquivos estáticos
│   ├── src/                      # Código fonte React
│   │   ├── components/           # Componentes React
│   │   ├── hooks/                # Custom hooks React
│   │   ├── lib/                  # Utilitários e serviços
│   │   │   ├── supabase.ts       # Cliente Supabase
│   │   │   └── vercel-env.ts     # Gestão de variáveis de ambiente
│   │   ├── pages/                # Páginas da aplicação
│   │   ├── App.tsx               # Componente principal
│   │   └── main.tsx              # Ponto de entrada da aplicação
│   └── index.html                # Template HTML base
├── server/                       # Código do servidor Express
├── shared/                       # Código compartilhado entre frontend e backend
│   └── schema.ts                 # Definições de esquema/tipos
├── vercel.json                   # Configuração da Vercel
└── vercel-build-simple.mjs       # Script de build para Vercel
```

## Variáveis de Ambiente Necessárias
| Variável | Descrição | Obrigatória |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | URL da sua instância Supabase | Sim |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | Sim |
| `STORAGE_TYPE` | Tipo de armazenamento (definido como "supabase") | Sim |

## Configuração de Implantação

### Configuração Vercel Atual 
A configuração atual do `vercel.json` inclui:

1. **buildCommand**: `node vercel-build-simple.mjs` - Executa o script personalizado de build
2. **outputDirectory**: `dist` - Diretório onde os arquivos de build são gerados
3. **Rotas**:
   - Configurações para API serverless
   - Rota para arquivos estáticos
   - Fallback para SPA (Single Page Application)
4. **Headers**: 
   - Headers CORS para acesso à API
   - Cache-Control para ativos estáticos

### Script de Build
O arquivo `vercel-build-simple.mjs` gerencia o processo de build personalizado:

1. Executa o build padrão com npm
2. Copia os arquivos necessários para o diretório dist
3. Configura corretamente as rotas para API serverless
4. Cria um arquivo de diagnóstico para debug

## Checklist de Implantação
- [x] Definir variáveis de ambiente na plataforma Vercel
- [x] Verificar se o script de build está configurado corretamente
- [x] Garantir que o diretório de saída (`dist`) esteja definido corretamente
- [x] Configurar rotas corretamente para um SPA React
- [x] Configurar endpoints de API serverless
- [x] Configurar gerenciamento de variáveis de ambiente no frontend

## Solução de Problemas Comuns

### Página em Branco / "Cannot GET /"
- **Causa**: Configuração incorreta de rotas no vercel.json
- **Solução**: Verificar se existe uma rota de fallback para SPA: `{ "src": "/(.*)", "dest": "/index.html" }`

### Variáveis de Ambiente não disponíveis no Frontend
- **Causa**: Configuração incorreta do cliente Vite/React
- **Solução**: Verificar o arquivo `client/src/lib/vercel-env.ts` e garantir que as variáveis estejam sendo acessadas corretamente

### API serverless não funciona
- **Causa**: Configuração incorreta de endpoints serverless
- **Solução**: Verificar configuração no vercel.json e certifique-se de que os arquivos na pasta /api/ têm a extensão .js

### Carregamento Incorreto de Ativos (CSS/JS)
- **Causa**: Caminhos de importação absolutos incorretos
- **Solução**: Todos os paths no HTML precisam ser relativos ou baseados em URL

## URLs de Diagnóstico
Após a implantação, você pode verificar o status da aplicação usando estas URLs:

- `/api/healthcheck` - Verificação básica do servidor
- `/api/supabase-status` - Verificação da conexão Supabase
- `/api/diagnostico` - Diagnóstico detalhado da aplicação

## Melhores Práticas para a Vercel
1. **Estrutura de Projeto**: Idealmente, mova a aplicação React para a raiz, use /public para assets estáticos e /api para funções serverless
2. **Variáveis de Ambiente**: Use o sistema de variáveis de ambiente da Vercel
3. **Deployments Preview**: Utilize previews para cada pull request
4. **Monitoramento**: Configure monitoramento e alertas
5. **Domínios Personalizados**: Configure domínios personalizados conforme necessário