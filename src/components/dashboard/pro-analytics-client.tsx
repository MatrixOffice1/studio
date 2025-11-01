"use client";

import { useState } from 'react';
import { generateCommunicationPerformanceAnalysis } from '@/ai/flows/generate-communication-performance-analysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { AnalysisParser } from './analysis-parser';

type RawReservation = {
  "from": "whatsapp" | "telefono" | string;
};

const SHEET_WEBHOOK_URL = 'https://n8n.srv1002935.hstgr.cloud/webhook/sheet';

export function ProAnalyticsClient() {
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult('');
    setIsAnalysisVisible(true);
    try {
      // Fetch messages
      const { data: messages, error: messagesError } = await supabase.from('chats_v').select('*');
      if (messagesError) throw messagesError;

      // Fetch reservations
      const reservationResponse = await fetch(SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cb: Date.now() }),
      });
      if (!reservationResponse.ok) throw new Error('Failed to fetch reservation data');
      const reservations: RawReservation[] = await reservationResponse.json();
      
      const result = await generateCommunicationPerformanceAnalysis({
        messages: JSON.stringify(messages || []),
        reservations: JSON.stringify(reservations || []),
      });

      setAnalysisResult(result.analysis);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo generar el análisis de IA. Por favor, inténtalo de nuevo.";
      console.error('Error generating analysis:', error);
      toast({
        variant: "destructive",
        title: "Falló el Análisis",
        description: errorMessage,
      });
      setIsAnalysisVisible(false); // Hide on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-accent" />
          <span>Análisis de Rendimiento con IA</span>
        </CardTitle>
        <CardDescription>
          Genera un análisis de tus datos de comunicación y reservas para identificar tendencias y oportunidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-4">
          {!isAnalysisVisible && (
            <Button onClick={handleAnalysis} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar Análisis de Rendimiento'
              )}
            </Button>
          )}

          {isAnalysisVisible && (
            <div className="w-full p-4 border rounded-lg bg-background mt-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">Resultado del Análisis</h4>
                    <Button variant="ghost" size="sm" onClick={() => setIsAnalysisVisible(false)}>
                        <EyeOff className="mr-2 h-4 w-4"/>
                        Ocultar Análisis
                    </Button>
                </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-24"><Loader2 className="animate-spin text-primary"/></div>
              ) : (
                <AnalysisParser content={analysisResult} />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
