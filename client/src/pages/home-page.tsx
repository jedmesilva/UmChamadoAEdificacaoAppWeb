import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import LetterCard from "@/components/letters/letter-card";
import SubscriptionBanner from "@/components/subscription-banner";
import { Letter, SupabaseCarta } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { cartaService } from "@/lib/carta-service";
// import { subscriptionService } from "@/lib/supabase-service"; // Problemas de importação
import { useEffect, useState } from "react";

const HomePage = () => {
  const { user } = useSupabaseAuth();
  const [cartasSupabase, setCartasSupabase] = useState<SupabaseCarta[]>([]);
  const [isCartasLoading, setIsCartasLoading] = useState(true);
  const [cartasError, setCartasError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  
  // Query para buscar cartas pela API REST (fallback)
  const { data: letters, isLoading: isLettersLoading, error: lettersError } = useQuery<Letter[]>({
    queryKey: ["/api/letters"],
    // Desabilitamos esta query se tivermos cartas do Supabase
    enabled: cartasSupabase.length === 0 && !isCartasLoading,
  });

  // Efeito para buscar as cartas diretamente do Supabase
  useEffect(() => {
    const fetchCartas = async () => {
      try {
        setIsCartasLoading(true);
        const cartas = await cartaService.getAllCartas();
        setCartasSupabase(cartas);
        console.log("Cartas carregadas do Supabase:", cartas.length);
      } catch (error) {
        console.error("Erro ao buscar cartas do Supabase:", error);
        setCartasError(error instanceof Error ? error : new Error('Erro desconhecido'));
      } finally {
        setIsCartasLoading(false);
      }
    };

    fetchCartas();
  }, []);
  
  // Efeito para verificar se o usuário já está inscrito
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || !user.email) return;
      
      try {
        setCheckingSubscription(true);
        
        // Verificar se estamos em ambiente de produção (Vercel)
        const isProduction = window.location.hostname.includes('.vercel.app') || 
                           window.location.hostname.includes('.replit.app');
        
        // Verificamos a subscrição usando a API apropriada para o ambiente
        const apiUrl = `/api/check-subscription?email=${encodeURIComponent(user.email)}`;
        console.log(`Verificando subscrição via: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na resposta de verificação (${response.status}):`, errorText);
          throw new Error(`Erro ao verificar subscrição (${response.status}): ${errorText || 'Sem detalhes'}`);
        }
        
        // Tratativa para resposta vazia
        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '') {
          console.log('Resposta de verificação vazia, assumindo não inscrito');
          setIsSubscribed(false);
          return;
        }
        
        // Tenta parsear o JSON da resposta com tratativa de erro
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error('Erro ao parsear resposta JSON de verificação:', error, 'Texto recebido:', responseText);
          throw new Error(`Erro ao processar dados da verificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        
        // Se a API retornar isSubscribed como true, o usuário já está inscrito
        setIsSubscribed(data.isSubscribed);
        console.log("Status de subscrição:", data.isSubscribed ? "Inscrito" : "Não inscrito");
      } catch (error) {
        console.error("Erro ao verificar status de subscrição:", error);
        // Em caso de erro, assumimos que não está inscrito para mostrar o banner
        setIsSubscribed(false);
      } finally {
        setCheckingSubscription(false);
      }
    };
    
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  // Determina o estado de carregamento geral
  const isLoading = isCartasLoading || isLettersLoading;
  
  // Determina se há algum erro
  const error = cartasError || lettersError;

  // Função para renderizar as cartas
  const renderCartas = () => {
    // Preferência para cartas do Supabase
    if (cartasSupabase.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cartasSupabase.map((carta) => (
            <LetterCard key={carta.id_sumary_carta} letter={carta} />
          ))}
        </div>
      );
    }
    
    // Fallback para cartas da API
    if (letters && letters.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {letters.map((letter) => (
            <LetterCard key={letter.id} letter={letter} />
          ))}
        </div>
      );
    }
    
    // Sem cartas
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhuma carta disponível no momento.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-heading">
            Bem-vindo, {user?.user_metadata?.name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-gray-600">Aqui você encontra todas as cartas do Chamado à Edificação.</p>
        </div>
        
        {/* Banner de inscrição - exibe apenas se o usuário não está inscrito e não está carregando */}
        {!checkingSubscription && isSubscribed === false && user?.email && (
          <SubscriptionBanner 
            email={user.email} 
            onSubscriptionComplete={() => setIsSubscribed(true)} 
          />
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Erro ao carregar as cartas. Por favor, tente novamente.</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        ) : (
          renderCartas()
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
