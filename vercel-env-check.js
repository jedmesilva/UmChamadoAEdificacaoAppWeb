/**
 * Este script verifica se todas as variáveis de ambiente necessárias
 * estão configuradas no ambiente da Vercel
 * 
 * Ele pode ser executado durante o build ou como um health check
 */

console.log('==================================================');
console.log('VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE PARA VERCEL');
console.log('==================================================');

// Lista de variáveis de ambiente necessárias para a aplicação funcionar
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Lista de variáveis de ambiente opcionais, mas recomendadas
const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY'
];

// Verificar as variáveis obrigatórias
console.log('\n1. Verificando variáveis de ambiente obrigatórias:');
let missingRequiredVars = false;

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    // Mostramos apenas parte da variável por segurança
    const value = process.env[envVar];
    const maskedValue = value.length > 6 
      ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` 
      : '***';
    
    console.log(`✅ ${envVar}: ${maskedValue}`);
  } else {
    missingRequiredVars = true;
    console.log(`❌ ${envVar} não encontrada!`);
  }
});

// Verificar as variáveis opcionais
console.log('\n2. Verificando variáveis de ambiente opcionais:');
let missingOptionalVars = false;

optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: configurada`);
  } else {
    missingOptionalVars = true;
    console.log(`⚠️ ${envVar} não encontrada (opcional)`);
  }
});

// Resumo
console.log('\n==================================================');
console.log('RESUMO:');

if (missingRequiredVars) {
  console.log('❌ Faltam variáveis de ambiente OBRIGATÓRIAS!');
  console.log('   A aplicação NÃO funcionará corretamente sem elas.');
  console.log('   Configure-as no painel da Vercel em Settings > Environment Variables.');
} else if (missingOptionalVars) {
  console.log('✅ Todas as variáveis obrigatórias estão configuradas.');
  console.log('⚠️ Algumas variáveis opcionais estão faltando.');
  console.log('   A aplicação funcionará, mas com algumas limitações.');
} else {
  console.log('✅ Todas as variáveis de ambiente estão configuradas corretamente!');
}

console.log('==================================================');

// Retornar código de erro se faltarem variáveis obrigatórias
// Isso pode interromper o processo de build na Vercel, se desejado
if (missingRequiredVars) {
  process.exit(1);
}