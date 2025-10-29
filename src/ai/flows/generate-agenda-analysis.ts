'use server';
/**
 * @fileOverview Generates an analysis of the upcoming week's agenda.
 *
 * - generateAgendaAnalysis - A function that analyzes the agenda and provides insights.
 * - GenerateAgendaAnalysisInput - The input type for the function.
 * - GenerateAgendaAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateAgendaAnalysisInputSchema = z.object({
  dataSummary: z.string().describe('A summary of appointment data for the next 7 days.'),
});
export type GenerateAgendaAnalysisInput = z.infer<typeof GenerateAgendaAnalysisInputSchema>;

const GenerateAgendaAnalysisOutputSchema = z.object({
  analysis: z.string().describe('A markdown-formatted analysis of the agenda.'),
});
export type GenerateAgendaAnalysisOutput = z.infer<typeof GenerateAgendaAnalysisOutputSchema>;


export async function generateAgendaAnalysis(
  input: GenerateAgendaAnalysisInput
): Promise<GenerateAgendaAnalysisOutput> {
  return generateAgendaAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAgendaAnalysisPrompt',
  input: {
    schema: GenerateAgendaAnalysisInputSchema,
  },
  output: {
    schema: GenerateAgendaAnalysisOutputSchema,
  },
  prompt: `Eres un analista de negocio experto para 'Peluquería Abbaglia Nails & Beauty'. Tu tarea es generar un informe de la agenda CONCISO, profesional y fácil de leer. Responde siempre en español. La zona horaria es 'Europe/Madrid'.

  La estructura de tu respuesta debe ser la siguiente:
  - Usa **TÍTULO** para los encabezados de sección (e.g., **RESUMEN EJECUTIVO**).
  - Usa saltos de línea simples para las listas y dobles para separar párrafos y secciones.
  - NO uses Markdown complejo (###, ---, etc.), solo los títulos en negrita.

  **ANÁLISIS DE AGENDA - PRÓXIMOS 7 DÍAS**

  **RESUMEN EJECUTIVO**
  [Un párrafo breve que resuma los hallazgos clave: días más y menos ocupados, distribución de trabajo y la oportunidad más importante.]

  **MÉTRICAS CLAVE**
  - Días de Mayor Actividad: [Lista los 1-2 días con más citas]
  - Días de Menor Actividad: [Lista los 1-2 días con menos citas o huecos]
  - Profesional con Más Carga: [Nombre del profesional]
  - Servicio Más Solicitado: [Nombre del servicio]

  **OPORTUNIDADES**
  [Crea una lista corta con 2-3 recomendaciones muy concisas y accionables.]
  - Oportunidad 1: [Texto de la recomendación.]
  - Oportunidad 2: [Texto de la recomendación.]

  **CONCLUSIÓN**
  [Un párrafo final muy breve resumiendo la salud de la agenda para la próxima semana.]

  Si los datos de entrada son muy limitados o no hay citas, adapta tu análisis para que sea proactivo. Por ejemplo: "Actualmente no hay citas registradas para los próximos 7 días. Esta es una oportunidad ideal para lanzar una campaña de 'última hora' y llenar la agenda."

Datos de Citas:
{{{dataSummary}}}
`,
});

const generateAgendaAnalysisFlow = ai.defineFlow(
  {
    name: 'generateAgendaAnalysisFlow',
    inputSchema: GenerateAgendaAnalysisInputSchema,
    outputSchema: GenerateAgendaAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
