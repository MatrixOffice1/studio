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
  prompt: `Eres un analista de negocio para la 'Peluquería Abbaglia Nails & Beauty'. Analiza la agenda de los próximos 7 días y proporciona un resumen ejecutivo. La zona horaria es 'Atlantic/Canary'. Enfócate en:

* **Días de Mayor y Menor Actividad:** ¿Qué días tienen más citas?
* **Distribución de Trabajo:** ¿Qué profesional tiene más carga de trabajo?
* **Servicios Populares:** ¿Cuáles son los servicios más solicitados?
* **Oportunidades:** ¿Hay huecos que se podrían llenar o alguna recomendación para optimizar la semana?

Formatea la respuesta en Markdown de forma clara y concisa. Responde siempre en español.

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
