// API principal para Vercel Serverless

import { createClient } from '@supabase/supabase-js';

/**
 * Handler principal para funções serverless da API no Vercel
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
export default async function handler(req, res) {
  // Configuração CORS 
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Lidar com preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      message: "OK"
    });
  }

  // Retirar o prefixo /api da URL para roteamento
  const url = req.url.replace(/^\/api/, '');
  console.log(`Processando requisição: ${req.method} ${url}`);

  // Configurar cliente Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  console.log(`Configurando Supabase com URL: ${supabaseUrl ? 'disponível' : 'não disponível'}, KEY: ${supabaseKey ? 'disponível' : 'não disponível'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Configuração do Supabase não encontrada no ambiente');
    return res.status(500).json({ 
      error: 'Configuração do Supabase não encontrada no ambiente' 
    });
  }

  try {
    // Inicializar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Rota para status da API
    if (url === '/status' && req.method === 'GET') {
      return res.status(200).json({
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }
    
    // Rota para verificar se o usuário está inscrito
    if (url.startsWith('/check-subscription') && req.method === 'GET') {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const email = params.get('email');
      
      if (!email) {
        return res.status(400).json({ 
          message: "Email é obrigatório",
          isSubscribed: false 
        });
      }
      
      try {
        // Verificar se o usuário já está inscrito
        const { data: subscription, error } = await supabase
          .from('subscription_um_chamado')
          .select('*')
          .eq('email_subscription', email)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Erro ao verificar subscrição:", error);
          return res.status(200).json({
            isSubscribed: false,
            error: error.message
          });
        }
        
        return res.status(200).json({
          isSubscribed: !!subscription,
          subscription: subscription || null
        });
      } catch (error) {
        console.error("Erro ao verificar subscrição:", error);
        return res.status(200).json({ 
          isSubscribed: false,
          error: error.message 
        });
      }
    }
    
    // Rota para obter todas as cartas
    if (url === '/cartas' && req.method === 'GET') {
      console.log('Buscando todas as cartas...');
      const { data, error } = await supabase
        .from('cartas_um_chamado_a_edificacao')
        .select('*');
      
      if (error) {
        console.error('Erro ao buscar cartas:', error);
        throw error;
      }
      
      console.log(`Encontradas ${data?.length || 0} cartas`);
      return res.status(200).json(data || []);
    }
    
    // Rota para obter carta por ID
    const cartaMatch = url.match(/^\/cartas\/(\d+)$/);
    if (cartaMatch && req.method === 'GET') {
      const id = cartaMatch[1];
      console.log(`Buscando carta com ID: ${id}`);
      
      const { data, error } = await supabase
        .from('cartas_um_chamado_a_edificacao')
        .select('*')
        .eq('id_sumary_carta', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ 
            error: 'Carta não encontrada' 
          });
        }
        console.error(`Erro ao buscar carta ${id}:`, error);
        throw error;
      }
      
      console.log(`Carta encontrada: ${data?.title || 'sem título'}`);
      return res.status(200).json(data);
    }
    
    // Rota para registrar leitura de uma carta
    if (url === '/cartas/registrar-leitura' && req.method === 'POST') {
      const { cartaId, userId } = req.body || {};
      
      if (!cartaId || !userId) {
        return res.status(400).json({ 
          error: 'ID da carta e ID do usuário são obrigatórios' 
        });
      }
      
      console.log(`Registrando leitura da carta ${cartaId} para o usuário ${userId}`);
      
      // Primeiro buscar a carta pelo id_sumary_carta
      const { data: carta, error: cartaError } = await supabase
        .from('cartas_um_chamado_a_edificacao')
        .select('id')
        .eq('id_sumary_carta', cartaId)
        .single();
      
      if (cartaError || !carta) {
        console.error(`Carta ${cartaId} não encontrada`, cartaError);
        return res.status(404).json({
          error: 'Carta não encontrada'
        });
      }
      
      // Inserir o registro de leitura
      const { error: leituraError } = await supabase
        .from('status_carta')
        .insert({
          carta_id: carta.id,
          account_user_id: userId,
          status: 'lido'
        });
      
      if (leituraError) {
        console.error('Erro ao registrar leitura:', leituraError);
        // Verificar se é erro de registro duplicado
        if (leituraError.code === '23505') {
          return res.status(200).json({
            message: 'Leitura já registrada anteriormente',
            cartaId
          });
        }
        throw leituraError;
      }
      
      return res.status(200).json({
        message: 'Leitura registrada com sucesso',
        cartaId
      });
    }
    
    // Rota para inscrição
    if (url === '/subscribe' && req.method === 'POST') {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email é obrigatório' 
        });
      }
      
      console.log(`Processando inscrição para o email: ${email}`);
      
      // Verificar se o usuário já existe
      const { data: user, error: userError } = await supabase
        .auth.admin.getUserByEmail(email);
      
      if (user) {
        console.log(`Usuário já existe: ${email}`);
        return res.status(200).json({
          message: 'Usuário já cadastrado',
          email,
          redirect: 'login'
        });
      }
      
      // Verificar se já existe uma inscrição
      const { data: subscription, error: subError } = await supabase
        .from('subscription_um_chamado')
        .select('*')
        .eq('email_subscription', email)
        .single();
      
      if (!subscription) {
        // Criar nova inscrição
        console.log(`Criando nova inscrição para: ${email}`);
        const { error: createError } = await supabase
          .from('subscription_um_chamado')
          .insert({
            email_subscription: email
          });
        
        if (createError) {
          console.error('Erro ao criar inscrição:', createError);
        }
      }
      
      return res.status(200).json({
        message: 'Email registrado com sucesso',
        email,
        redirect: 'register'
      });
    }
    
    // Rota para inscrição diretamente do dashboard
    if (url === '/dashboard-subscribe' && req.method === 'POST') {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email é obrigatório' 
        });
      }
      
      console.log(`Processando inscrição do dashboard para o email: ${email}`);
      
      // Verificar se já existe uma inscrição
      const { data: existingSubscription, error: checkError } = await supabase
        .from('subscription_um_chamado')
        .select('*')
        .eq('email_subscription', email)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar inscrição existente:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar inscrição',
          details: checkError.message
        });
      }
      
      if (existingSubscription) {
        // Se já estiver inscrito, retorna sucesso
        return res.status(200).json({
          success: true,
          message: 'Usuário já está inscrito',
          subscription: existingSubscription
        });
      }
      
      // Criar nova inscrição
      const { data: subscription, error: createError } = await supabase
        .from('subscription_um_chamado')
        .insert({
          email_subscription: email
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Erro ao criar inscrição do dashboard:', createError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar inscrição',
          details: createError.message
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Inscrição realizada com sucesso',
        subscription
      });
    }
    
    // Essa parte foi movida para o início da função, aqui está apenas para compatibilidade
    if (req.method === 'OPTIONS') {
      console.log(`Tratando requisição OPTIONS para: ${url} (já processada no início da handler)`);
      return res.status(200).end();
    }
    
    // Resposta padrão se nenhuma rota corresponder
    console.log(`Endpoint não encontrado: ${url}`);
    return res.status(404).json({ 
      error: 'Endpoint não encontrado',
      path: url
    });
    
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message || String(error)
    });
  }
}