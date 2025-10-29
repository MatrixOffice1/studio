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
  prompt: `Eres un analista de datos experto en comunicación para negocios locales. Tu tarea es generar un informe de rendimiento muy conciso y profesional para "Peluquería Abbaglia Nails & Beauty" basado en los datos de mensajes de los últimos 7 días. Tu respuesta debe estar en español.

  La estructura del informe debe ser la siguiente, utilizando Markdown para el formato y siendo lo más breve y directo posible:

  # Análisis de Rendimiento de Comunicación
  ## Peluquería Abbaglia Nails & Beauty - Últimos 7 Días

  ---

  ### Resumen Ejecutivo
  Un párrafo breve y directo que resuma los hallazgos clave: rendimiento general, puntos fuertes (ej. buen balance de respuesta) y áreas de oportunidad (ej. variabilidad en el volumen).

  ---

  ### Métricas Clave
  - **Volumen Total:** [Número total de mensajes]
  - **Promedio Diario:** [Número promedio]
  - **Balance (Entrantes/Salientes):** [Describe la proporción, ej. "Balance casi perfecto 1:1"]
  - **Tendencia:** [Describe brevemente la tendencia, ej. "Actividad estable con picos notables"]

  ---

  ### Oportunidades Clave
  Crea una lista corta con 2-3 recomendaciones muy concisas y accionables.
  - **Recomendación 1:** [Ej: Investigar picos de actividad para replicar campañas exitosas.]
  - **Recomendación 2:** [Ej: Sugerir enviar promociones en días de baja actividad para estabilizar el volumen.]
  - **Recomendación 3:** [Ej: Analizar tipos de consulta para optimizar las respuestas.]

  ---

  ### Conclusión
  Un párrafo final muy breve que resuma la salud general de la comunicación y reitere la oportunidad más importante.

  Datos de los mensajes (cadena JSON):
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
