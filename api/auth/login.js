// API de login de usuários para Vercel Serverless
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Lidar com preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Respondendo a preflight request com 200 OK');
    return res.status(200).end();
  }

  // Apenas o método POST é permitido para esta rota
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido', 
      method: req.method,
      allowedMethods: ['POST']
    });
  }

  // Garantindo que req.body esteja corretamente parseado se for JSON
  if (req.body && typeof req.body === 'string' && req.headers['content-type']?.includes('application/json')) {
    try {
      req.body = JSON.parse(req.body);
      console.log('Body JSON parseado com sucesso');
    } catch (error) {
      console.error('Erro ao parsear JSON do body:', error);
    }
  }

  // Configurar cliente Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  console.log(`Configurando Supabase com URL: ${supabaseUrl ? 'disponível' : 'não disponível'}, 
           KEY: ${supabaseKey ? 'disponível' : 'não disponível'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Configuração do Supabase não encontrada no ambiente');
    return res.status(500).json({ 
      error: 'Configuração do Supabase não encontrada no ambiente' 
    });
  }

  try {
    // Extrair dados de login
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email e senha são obrigatórios" 
      });
    }

    console.log(`Processando login para o email: ${email}`);
    
    // Inicializar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fazer login com email e senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login:', error);
      return res.status(401).json({
        error: 'Credenciais inválidas',
        details: error.message
      });
    }

    // Buscar informações adicionais do usuário
    const { data: accountUser, error: accountError } = await supabase
      .from('account_user')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (accountError) {
      console.error('Erro ao buscar perfil do usuário:', accountError);
      // Continuar mesmo sem dados do perfil
    }

    console.log(`Login bem sucedido para: ${email}`);
    
    return res.status(200).json({
      user: data.user,
      session: data.session,
      accountUser: accountUser || null
    });
    
  } catch (error) {
    console.error('Erro ao processar login:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message || String(error)
    });
  }
}