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
  reservations: z.string().describe('Una cadena JSON que contiene los datos de las reservas a analizar. Debe incluir el canal de origen ("from").'),
});
export type GenerateCommunicationPerformanceAnalysisInput = z.infer<typeof GenerateCommunicationPerformanceAnalysisInputSchema>;

const GenerateCommunicationPerformanceAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Un análisis detallado del rendimiento de la comunicación y las reservas, incluyendo patrones identificados, tendencias y recomendaciones para mejorar.'),
});
export type GenerateCommunicationPerformanceAnalysisOutput = z.infer<typeof GenerateCommunicationPerformanceAnalysisOutputSchema>;

export async function generateCommunicationPerformanceAnalysis(input: GenerateCommunicationPerformanceAnalysisInput): Promise<GenerateCommunicationPerformanceAnalysisOutput> {
  return generateCommunicationPerformanceAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommunicationPerformanceAnalysisPrompt',
  input: {schema: GenerateCommunicationPerformanceAnalysisInputSchema},
  output: {schema: GenerateCommunicationPerformanceAnalysisOutputSchema},
  prompt: `Eres un analista de negocio experto para "Peluquería Abbaglia Nails & Beauty". Tu tarea es generar un informe de rendimiento CONCISO, profesional y fácil de leer que combine el análisis de comunicación (mensajes) y el de reservas. Responde siempre en español.

  La estructura de tu respuesta debe ser la siguiente:
  - Usa **TÍTULO** para los encabezados de sección (e.g., **RESUMEN EJECUTIVO**).
  - Usa saltos de línea simples para las listas y dobles para separar párrafos y secciones.
  - NO uses Markdown complejo (###, ---).

  **Análisis de Rendimiento de Negocio**

  **RESUMEN EJECUTIVO**
  [Un párrafo breve y directo que resuma los hallazgos clave combinando ambos conjuntos de datos: rendimiento general de comunicación, canales de reserva más efectivos, puntos fuertes y la oportunidad más importante.]

  **MÉTRICAS DE COMUNICACIÓN**
  - Volumen Total de Mensajes: [Número total de mensajes]
  - Balance (Entrantes/Salientes): [Describe la proporción]
  - Tendencia de Comunicación: [Describe brevemente si la comunicación aumenta o disminuye]

  **MÉTRICAS DE RESERVAS**
  - Canal Principal de Reservas: [WhatsApp o Teléfono]
  - Rendimiento de WhatsApp: [Número de reservas y porcentaje del total]
  - Rendimiento de Teléfono: [Número de reservas y porcentaje del total]

  **OPORTUNIDADES CLAVE**
  [Crea una lista corta con 2-3 recomendaciones muy concisas y accionables, basándote en la relación entre la comunicación y las reservas. Por ejemplo, si hay muchos mensajes pero pocas reservas por WhatsApp, sugiere una mejora en el proceso de cierre de citas.]
  - Recomendación 1: [Texto de la recomendación.]
  - Recomendación 2: [Texto de la recomendación.]

  **CONCLUSIÓN**
  [Un párrafo final muy breve que resuma la salud general del negocio (comunicación y reservas) y reitere la oportunidad más importante.]

  Si los datos de entrada son muy limitados (pocos mensajes o reservas), adapta tu análisis para que sea proactivo. Por ejemplo, en lugar de decir "no hay suficientes datos", di "este es un primer vistazo" y enfoca las recomendaciones en "cómo empezar a recopilar más datos" o "primeros pasos para aumentar la interacción y las reservas".

  Datos de los mensajes (cadena JSON):
  {{{messages}}}
  
  Datos de las reservas (cadena JSON):
  {{{reservations}}}
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
