/**
 * API endpoint para verificação de saúde da aplicação
 * Esta função apenas retorna status 200 para confirmar que a API está funcionando.
 */

export default function handler(req, res) {
  // Cabeçalhos CORS para permitir acesso de diferentes origens
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Para requisições OPTIONS (pre-flight), apenas retorna status 200
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Para requisições GET, retorna uma mensagem de status simples
  res.status(200).json({
    status: 'OK',
    message: 'API está funcionando corretamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}