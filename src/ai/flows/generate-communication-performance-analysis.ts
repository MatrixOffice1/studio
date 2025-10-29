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
  messages: z.string().describe('A JSON string containing the messages data to analyze. Should include timestamps, sender/receiver information, and message content.'),
  relevantCustomerInfo: z.string().optional().describe('Highly relevant customer information to include in the analysis.'),
});
export type GenerateCommunicationPerformanceAnalysisInput = z.infer<typeof GenerateCommunicationPerformanceAnalysisInputSchema>;

const GenerateCommunicationPerformanceAnalysisOutputSchema = z.object({
  analysis: z.string().describe('A detailed analysis of communication performance, including identified patterns, trends, and recommendations for improvement.'),
});
export type GenerateCommunicationPerformanceAnalysisOutput = z.infer<typeof GenerateCommunicationPerformanceAnalysisOutputSchema>;

export async function generateCommunicationPerformanceAnalysis(input: GenerateCommunicationPerformanceAnalysisInput): Promise<GenerateCommunicationPerformanceAnalysisOutput> {
  return generateCommunicationPerformanceAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommunicationPerformanceAnalysisPrompt',
  input: {schema: GenerateCommunicationPerformanceAnalysisInputSchema},
  output: {schema: GenerateCommunicationPerformanceAnalysisOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing communication performance.

  Analyze the provided message data to identify key patterns, trends, and areas for improvement in communication strategy.

  Consider the following:
  - Overall communication volume and frequency.
  - Response times and patterns.
  - Incoming vs. outgoing message ratios.
  - Sentiment trends in communication.
  - Key topics and themes emerging from the messages.
  - Any relevant customer information: {{{relevantCustomerInfo}}}

  Based on your analysis, provide actionable recommendations for optimizing communication strategies.

  Here is the message data (JSON string):
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
