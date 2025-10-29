'use server';
/**
 * @fileOverview Generates a summary from a WhatsApp conversation.
 *
 * - generateConversationSummary - A function that analyzes WhatsApp messages and provides a summary.
 * - GenerateConversationSummaryInput - The input type for the function.
 * - GenerateConversationSummaryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateConversationSummaryInputSchema = z.object({
  messages: z.array(z.string()).describe('An array of WhatsApp messages in the format "sender: content".'),
});
export type GenerateConversationSummaryInput = z.infer<typeof GenerateConversationSummaryInputSchema>;

const GenerateConversationSummaryOutputSchema = z.object({
  summary: z.string().describe('Un resumen conciso de la conversación, extrayendo información clave como el nombre del cliente, el servicio solicitado y los detalles de la cita, si están disponibles.'),
});
export type GenerateConversationSummaryOutput = z.infer<typeof GenerateConversationSummaryOutputSchema>;


export async function generateConversationSummary(
  input: GenerateConversationSummaryInput
): Promise<GenerateConversationSummaryOutput> {
  return generateConversationSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConversationSummaryPrompt',
  input: {
    schema: GenerateConversationSummaryInputSchema,
  },
  output: {
    schema: GenerateConversationSummaryOutputSchema,
  },
  prompt: `Eres un asistente experto para un salón de belleza. Tu tarea es resumir una conversación de WhatsApp en español.

Analiza los siguientes mensajes y proporciona un resumen conciso en español. Extrae información clave como:
- Nombre del Cliente
- Servicio(s) Solicitado(s)
- Fecha y hora de la cita, si se menciona
- Cualquier pregunta o confirmación importante.

Conversación:
{{#each messages}}
- {{{this}}}
{{/each}}
`,
});

const generateConversationSummaryFlow = ai.defineFlow(
  {
    name: 'generateConversationSummaryFlow',
    inputSchema: GenerateConversationSummaryInputSchema,
    outputSchema: GenerateConversationSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
