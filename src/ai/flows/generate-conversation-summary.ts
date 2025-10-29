'use server';
/**
 * @fileOverview Generates a summary from a WhatsApp conversation.
 *
 * - generateConversationSummary - A function that analyzes WhatsApp messages and provides a summary.
 * - GenerateConversationSummaryInput - The input type for the function.
 * - GenerateConversationSummaryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateConversationSummaryInputSchema = z.object({
  messages: z.array(z.string()).describe('An array of WhatsApp messages in the format "sender: content".'),
});
export type GenerateConversationSummaryInput = z.infer<typeof GenerateConversationSummaryInputSchema>;

const GenerateConversationSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the conversation, extracting key information like customer name, requested service, and appointment details if available.'),
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
  prompt: `You are an expert assistant for a salon. Your task is to summarize a WhatsApp conversation.

Analyze the following messages and provide a concise summary. Extract key information such as:
- Customer Name
- Requested Service(s)
- Appointment date and time, if mentioned
- Any important questions or confirmations.

Conversation:
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
