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
  prompt: `Eres un analista de datos experto en comunicación para negocios locales. Tu tarea es generar un informe de rendimiento conciso y profesional para "Peluquería Abbaglia Nails & Beauty" basado en los datos de mensajes de los últimos 7 días. Tu respuesta debe estar en español.

  La estructura del informe debe ser la siguiente, utilizando Markdown para el formato:

  # Análisis de Rendimiento de Comunicación
  ## Peluquería Abbaglia Nails & Beauty - Últimos 7 Días

  ---

  ### Resumen Ejecutivo
  Un párrafo breve que resuma los hallazgos clave: rendimiento general, puntos fuertes (ej. buen balance de respuesta) y áreas de oportunidad (ej. variabilidad en el volumen).

  ---

  ### 1. Volumen y Tendencias
  - **Total de Mensajes:** [Número total]
  - **Promedio Diario:** [Número promedio]
  - **Tendencia General:** Describe brevemente si la actividad es estable, volátil, creciente o decreciente. Menciona los días de mayor y menor actividad como picos y valles.

  ---

  ### 2. Balance y Eficiencia
  - **Mensajes Entrantes vs. Salientes:** Analiza la proporción. Un balance 1:1 es ideal y sugiere que cada consulta es atendida.
  - **Análisis de Eficiencia:** Elogia la eficiencia si el balance es bueno, sugiriendo un buen protocolo de respuesta.

  ---

  ### 3. Oportunidades Clave de Mejora
  Crea una lista corta con 2-3 recomendaciones accionables y concisas. Por ejemplo:
  - **Investigar Picos de Actividad:** Para replicar campañas exitosas.
  - **Gestión Proactiva:** Sugerir enviar promociones en días de baja actividad.
  - **Analizar Contenido:** Recomendar clasificar los tipos de consulta para entender mejor las necesidades del cliente.

  ---

  ### Conclusión
  Un párrafo final que resuma la salud general de la comunicación y reitere la oportunidad más importante para el crecimiento.

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
