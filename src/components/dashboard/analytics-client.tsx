"use client";

import { useState } from 'react';
import { generateCommunicationPerformanceAnalysis } from '@/ai/flows/generate-communication-performance-analysis';
import { messages } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AnalyticsClient() {
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult('');
    try {
      const result = await generateCommunicationPerformanceAnalysis({
        messages: JSON.stringify(messages),
      });
      setAnalysisResult(result.analysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not generate AI analysis. Please try again.",
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
          <span>AI-Powered Insights</span>
        </CardTitle>
        <CardDescription>
          Generate a detailed analysis of communication performance, including patterns, trends, and recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-4">
          <Button onClick={handleAnalysis} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Communication Analysis'
            )}
          </Button>
          {analysisResult && (
            <div className="w-full p-4 border rounded-lg bg-background mt-4">
              <h4 className="font-semibold mb-2">Analysis Result:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
