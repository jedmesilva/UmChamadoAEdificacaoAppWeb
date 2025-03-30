# Guia de Deploy no Vercel

Este guia oferece instruções passo a passo para implantar a aplicação no Vercel.

## Pré-requisitos

1. Você precisa ter uma conta no [Vercel](https://vercel.com/).
2. Você precisa ter uma conta no [Supabase](https://supabase.io/) e um projeto criado com as tabelas necessárias.
3. O repositório precisa estar configurado em um provedor Git suportado (GitHub, GitLab ou Bitbucket).

## Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel do Vercel:

**Variáveis Obrigatórias:**
- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do seu projeto Supabase

**Variáveis Opcionais:**
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase (para funções admin)
- `STORAGE_TYPE`: Defina como "supabase" para usar o Supabase como banco de dados

## Estrutura do Projeto

Este projeto foi estruturado para ser compatível com o Vercel:

1. **Pasta `/api`** 
   - Contém os endpoints de API serverless que serão executados no Vercel
   - Estes arquivos são JavaScript puro e não TypeScript para facilitar a execução

2. **Pasta `/src`**
   - Contém o código frontend da aplicação

3. **Configuração `vercel.json`**
   - Define regras de roteamento e reescrita para o Vercel
   - Configura headers CORS e outras configurações

## Passos para Implantação

1. **Vincule seu repositório ao Vercel**
   - Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
   - Clique em "Add New" > "Project"
   - Selecione o repositório contendo este projeto

2. **Configure o projeto**
   - Framework Preset: Defina como "Other"
   - Root Directory: Mantenha o valor padrão (/)
   - Build Command: Já está configurado no `vercel.json` como `node vercel-cleanup.js && npm run build`
   - Output Directory: Já está configurado como `dist`
   - Node.js Version: Defina como 18.x (este projeto foi configurado para Node.js 18)

3. **Configure as variáveis de ambiente**
   - Adicione as variáveis listadas acima na seção "Environment Variables"

4. **Deploy**
   - Clique em "Deploy" e aguarde a conclusão do processo

## Verificando o Deploy

Após o deploy, você pode verificar o status da aplicação usando os seguintes endpoints:

- `/api/healthcheck` - Informações básicas sobre o ambiente
- `/api/supabase-status` - Verifica a conexão com o Supabase

## Solução de Problemas

Se encontrar problemas ao fazer o deploy, verifique:

1. **Logs de Build**
   - Revise os logs de build no painel do Vercel para identificar erros

2. **Conflitos de Arquivos**
   - Execute `node vercel-pre-deploy-check.js` localmente antes de enviar para identificar conflitos
   - Execute `node vercel-cleanup.js` para resolver conflitos automaticamente

3. **Variáveis de Ambiente**
   - Verifique se todas as variáveis obrigatórias estão configuradas
   - Execute `node vercel-env-check.js` localmente para verificar (com as variáveis configuradas no ambiente local)

4. **API Endpoints**
   - Verifique os logs de Function no painel do Vercel para identificar erros em endpoints específicos

5. **Versão do Node.js**
   - Este projeto foi configurado para Node.js 18.x
   - Verifique se a versão do Node.js está correta no painel do Vercel em Project Settings > General > Node.js Version
   - Se necessário, execute `node vercel-node-version-check.js` para verificar compatibilidade

## Melhorias Futuras

Recomendações para desenvolvedores que desejam melhorar o processo de deploy:

1. Configurar GitHub Actions para testes automáticos antes do deploy
2. Implementar preview deploys para branches de desenvolvimento
3. Configurar monitoramento e alertas para falhas nos endpoints de API

---

Versão: 1.0.0  
Última atualização: Março 2025