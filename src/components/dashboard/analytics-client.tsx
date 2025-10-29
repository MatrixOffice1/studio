"use client";

import { useState } from 'react';
import { generateCommunicationPerformanceAnalysis } from '@/ai/flows/generate-communication-performance-analysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function AnalyticsClient() {
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult('');
    try {
      const { data: messages, error } = await supabase.from('chats_v').select('*');

      if (error || !messages || messages.length === 0) {
        // Even with no messages, we can ask the AI for initial recommendations
         const result = await generateCommunicationPerformanceAnalysis({
          messages: JSON.stringify([]),
        });
        setAnalysisResult(result.analysis);
        setIsLoading(false);
        return;
      }

      const result = await generateCommunicationPerformanceAnalysis({
        messages: JSON.stringify(messages),
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-accent" />
          <span>Insights con IA</span>
        </CardTitle>
        <CardDescription>
          Genera un análisis detallado del rendimiento de la comunicación, incluyendo patrones, tendencias y recomendaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-4">
          <Button onClick={handleAnalysis} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              'Generar Análisis de Comunicación'
            )}
          </Button>
          {analysisResult && (
            <div className="w-full p-4 border rounded-lg bg-background mt-4">
              <h4 className="font-semibold mb-2 text-lg">Resultado del Análisis</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">{analysisResult}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
