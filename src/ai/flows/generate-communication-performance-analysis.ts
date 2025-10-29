'use server';

/**
 * @fileOverview Generates an analysis of communication performance, identifying patterns, trends, and recommendations for improvement.
 *
 * - generateCommunicationPerformanceAnalysis - A function that generates the communication performance analysis.
 * - GenerateCommunicationPerformanceAnalysisInput - The input type for the generateCommunicationPerformanceAnalysis function.
 * - GenerateCommunicationPerformanceAnalysisOutput - The return type for the generateCommunicationPerformanceAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCommunicationPerformanceAnalysisInputSchema = z.object({
  messages: z.string().describe('Una cadena JSON que contiene los datos de los mensajes a analizar. Debe incluir marcas de tiempo, información del remitente/receptor y contenido del mensaje.'),
  relevantCustomerInfo: z.string().optional().describe('Información muy relevante del cliente para incluir en el análisis.'),
});
export type GenerateCommunicationPerformanceAnalysisInput = z.infer<typeof GenerateCommunicationPerformanceAnalysisInputSchema>;

const GenerateCommunicationPerformanceAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Un análisis detallado del rendimiento de la comunicación, incluyendo patrones identificados, tendencias y recomendaciones para mejorar.'),
});
export type GenerateCommunicationPerformanceAnalysisOutput = z.infer<typeof GenerateCommunicationPerformanceAnalysisOutputSchema>;

export async function generateCommunicationPerformanceAnalysis(input: GenerateCommunicationPerformanceAnalysisInput): Promise<GenerateCommunicationPerformanceAnalysisOutput> {
  return generateCommunicationPerformanceAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommunicationPerformanceAnalysisPrompt',
  input: {schema: GenerateCommunicationPerformanceAnalysisInputSchema},
  output: {schema: GenerateCommunicationPerformanceAnalysisOutputSchema},
  prompt: `Eres un asistente de IA especializado en analizar el rendimiento de la comunicación. Tu respuesta debe estar en español.

  Analiza los datos de mensajes proporcionados para identificar patrones clave, tendencias y áreas de mejora en la estrategia de comunicación.

  Considera lo siguiente:
  - Volumen y frecuencia general de la comunicación.
  - Tiempos y patrones de respuesta.
  - Proporción de mensajes entrantes vs. salientes.
  - Tendencias de sentimiento en la comunicación.
  - Temas y asuntos clave que surgen de los mensajes.
  - Cualquier información relevante del cliente: {{{relevantCustomerInfo}}}

  Basado en tu análisis, proporciona recomendaciones accionables en español para optimizar las estrategias de comunicación.

  Aquí están los datos de los mensajes (cadena JSON):
  {{{messages}}}
  `,
});

const generateCommunicationPerformanceAnalysisFlow = ai.defineFlow(
  {
    name: 'generateCommunicationPerformanceAnalysisFlow',
    inputSchema: GenerateCommunicationPerformanceAnalysisInputSchema,
    outputSchema: GenerateCommunicationPerformanceAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
