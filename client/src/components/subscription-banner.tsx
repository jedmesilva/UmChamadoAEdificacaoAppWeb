import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionBannerProps {
  email: string;
  onSubscriptionComplete: () => void;
}

const SubscriptionBanner = ({ email, onSubscriptionComplete }: SubscriptionBannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao processar inscrição');
      }
      
      // Mostra toast de sucesso
      toast({
        title: "Sucesso!",
        description: "Você agora receberá as cartas por email.",
        variant: "default",
      });
      
      // Marca como bem-sucedido
      setIsSuccess(true);
      
      // Notifica o componente pai que a subscrição foi concluída
      onSubscriptionComplete();
      
    } catch (error) {
      console.error('Erro ao fazer subscrição:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Ocorreu um erro ao processar sua inscrição'
      );
      
      toast({
        title: "Erro na inscrição",
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar sua inscrição',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Alert className="mb-6 bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800">
        <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-500" />
        <AlertTitle>Inscrição confirmada!</AlertTitle>
        <AlertDescription>
          Você agora receberá as cartas diretamente no seu email.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6 border-teal-100 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Receba as cartas por email</CardTitle>
        <CardDescription>
          Além de acessar as cartas aqui no portal, você pode recebê-las diretamente no seu email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground mb-2">
          Seu email de cadastro: <span className="font-medium text-foreground">{email}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubscribe} 
          disabled={isLoading}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Processando...' : 'Quero receber as cartas por email'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionBanner;