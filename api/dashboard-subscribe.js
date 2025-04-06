// Endpoint específico para inscrição a partir do dashboard
import { createClient } from '@supabase/supabase-js';

/**
 * Handler específico para endpoint de inscrição a partir do dashboard
 * - Tratamento de erro otimizado e logs detalhados
 */
export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] Iniciando processamento da inscrição do dashboard`);
  
  // Configuração CORS otimizada
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Responder imediatamente a OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    console.log('Respondendo a preflight request do dashboard-subscribe com 200 OK');
    return res.status(200).end();
  }

  // Verificação de método
  if (req.method !== 'POST') {
    console.error(`Método inválido: ${req.method}. Apenas POST é permitido.`);
    return res.status(405).json({ 
      error: 'Método não permitido', 
      message: 'Esta rota aceita apenas o método POST' 
    });
  }

  // Parsing de body melhorado
  let body = req.body;
  
  // Verificar se precisamos fazer parse (quando chega como string)
  if (body && typeof body === 'string' && req.headers['content-type']?.includes('application/json')) {
    try {
      body = JSON.parse(body);
      console.log('Body JSON parseado com sucesso');
    } catch (error) {
      console.error('Erro ao parsear JSON do body:', error);
      return res.status(400).json({ 
        error: 'Erro ao processar dados da requisição',
        details: error.message
      });
    }
  }

  // Validação básica do payload
  const email = body?.email;
  if (!email) {
    console.error('Requisição sem email válido');
    return res.status(400).json({ 
      error: 'Dados insuficientes', 
      message: 'Email é obrigatório' 
    });
  }

  // Inicialização do Supabase com fallbacks e melhor detecção de configuração
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  // Escolha a chave apropriada (preferencialmente a chave de serviço)
  const supabaseKey = supabaseServiceKey || supabaseAnonKey;

  console.log(`Configurando Supabase para inscrição do dashboard: 
    URL: ${supabaseUrl ? 'disponível' : 'não disponível'}, 
    ROLE KEY: ${supabaseServiceKey ? 'disponível' : 'não disponível'},
    ANON KEY: ${supabaseAnonKey ? 'disponível' : 'não disponível'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Configuração do Supabase não encontrada no ambiente');
    return res.status(500).json({ 
      error: 'Erro de configuração', 
      message: 'Não foi possível conectar ao banco de dados' 
    });
  }

  try {
    // Inicialização do cliente Supabase - com service key para operações de admin
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`Cliente Supabase inicializado para inscrição do dashboard: ${email}`);
    
    // Verificar se já existe uma inscrição
    let existingSubscription = null;
    let checkError = null;
    try {
      const subscriptionResult = await supabase
        .from('subscription_um_chamado')
        .select('*')
        .eq('email_subscription', email)
        .single();
      
      existingSubscription = subscriptionResult.data;
      checkError = subscriptionResult.error;
      
      // Ignora erro PGRST116 (not found) pois é esperado quando não há inscrição
      if (checkError && checkError.code === 'PGRST116') {
        checkError = null;
      }
    } catch (err) {
      console.error('Erro ao verificar inscrição existente:', err);
      checkError = err;
    }
    
    // Verificação de erro (exceto not found que já foi tratado acima)
    if (checkError) {
      console.error('Erro ao verificar inscrição existente:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar sua inscrição',
        details: checkError.message
      });
    }
    
    // Se já estiver inscrito, verifica o status
    if (existingSubscription) {
      // Se já tiver o status correto, retorna sucesso
      if (existingSubscription.status_subscription === 'is_subscription_um_chamado') {
        console.log(`Usuário já está inscrito com status confirmado: ${email}`);
        return res.status(200).json({
          success: true,
          message: 'Você já está inscrito para receber as cartas por email',
          subscription: existingSubscription
        });
      }
      
      // Se não tiver o status correto, atualiza o registro
      console.log(`Atualizando status da inscrição para: ${email}`);
      let updateError = null;
      let updatedSubscription = null;
      
      try {
        const updateResult = await supabase
          .from('subscription_um_chamado')
          .update({
            status_subscription: 'is_subscription_um_chamado'
          })
          .eq('email_subscription', email)
          .select()
          .single();
        
        updatedSubscription = updateResult.data;
        updateError = updateResult.error;
      } catch (err) {
        console.error('Erro ao atualizar status da inscrição:', err);
        updateError = err;
      }
      
      if (updateError) {
        console.error('Erro ao atualizar status da inscrição:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar sua inscrição',
          details: updateError.message
        });
      }
      
      console.log(`Status da inscrição atualizado com sucesso para: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Sua inscrição foi atualizada com sucesso!',
        subscription: updatedSubscription
      });
    }
    
    // Criar nova inscrição
    console.log(`Criando nova inscrição do dashboard para: ${email}`);
    let subscription = null;
    let createError = null;
    try {
      const createResult = await supabase
        .from('subscription_um_chamado')
        .insert({
          email_subscription: email,
          created_at: new Date().toISOString(),
          status_subscription: 'is_subscription_um_chamado'
        })
        .select()
        .single();
      
      subscription = createResult.data;
      createError = createResult.error;
    } catch (err) {
      console.error('Erro crítico ao criar inscrição do dashboard:', err);
      createError = err;
    }
    
    if (createError) {
      console.error('Erro ao criar inscrição do dashboard:', createError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar sua inscrição',
        details: createError.message
      });
    }
    
    console.log(`Inscrição do dashboard criada com sucesso: ${email}`);
    return res.status(201).json({
      success: true,
      message: 'Inscrição realizada com sucesso! Você agora receberá as cartas por email',
      subscription
    });
    
  } catch (error) {
    console.error('Erro crítico no processamento da inscrição do dashboard:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: 'Não foi possível processar sua inscrição',
      details: error.message || String(error)
    });
  }
}