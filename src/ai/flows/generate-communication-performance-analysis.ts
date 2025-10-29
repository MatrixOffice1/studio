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
  prompt: `Eres un analista de datos experto en comunicación para "Peluquería Abbaglia Nails & Beauty". Tu tarea es generar un informe de rendimiento MUY CONCISO, profesional y fácil de leer. Responde siempre en español.

  La estructura de tu respuesta debe ser la siguiente, usando solo saltos de línea para separar secciones. NO uses Markdown (###, ---).

  Análisis de Rendimiento de Comunicación
  Peluquería Abbaglia Nails & Beauty - Últimos 7 Días

  RESUMEN EJECUTIVO
  [Un párrafo breve y directo que resuma los hallazgos clave: rendimiento general, puntos fuertes y áreas de oportunidad.]

  MÉTRICAS CLAVE
  - Volumen Total: [Número total de mensajes]
  - Promedio Diario: [Número promedio]
  - Balance (Entrantes/Salientes): [Describe la proporción]
  - Tendencia: [Describe brevemente la tendencia]

  OPORTUNIDADES CLAVE
  [Crea una lista corta con 2-3 recomendaciones muy concisas y accionables.]
  - Recomendación 1: [Texto de la recomendación.]
  - Recomendación 2: [Texto de la recomendación.]
  - Recomendación 3: [Texto de la recomendación.]

  CONCLUSIÓN
  [Un párrafo final muy breve que resuma la salud general de la comunicación y reitere la oportunidad más importante.]

  Si los datos de entrada son muy limitados, adapta tu análisis para que sea positivo y proactivo. Por ejemplo, en lugar de decir "no hay suficientes datos", di "este es un primer vistazo" y enfoca las recomendaciones en "cómo empezar a recopilar más datos" o "primeros pasos para aumentar la interacción".

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
