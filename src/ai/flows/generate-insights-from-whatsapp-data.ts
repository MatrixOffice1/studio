'use server';
/**
 * @fileOverview Generates insights from WhatsApp conversation data using AI.
 *
 * - generateInsightsFromWhatsAppData - A function that analyzes WhatsApp data and provides summaries and trend identification.
 * - GenerateInsightsFromWhatsAppDataInput - The input type for the generateInsightsFromWhatsAppData function.
 * - GenerateInsightsFromWhatsAppDataOutput - The return type for the generateInsightsFromWhatsAppData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerInfoSchema = z.object({
  customerId: z.string().describe('Unique identifier for the customer.'),
  name: z.string().describe('Name of the customer.'),
  contactDetails: z.string().describe('Contact information of the customer (e.g., phone number, email).'),
  relevantHistory: z.string().describe('Relevant history or notes about the customer.'),
});

export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;

const WhatsAppDataSchema = z.object({
  messages: z.array(z.string()).describe('An array of WhatsApp messages.'),
  customerInfo: CustomerInfoSchema.optional().describe('Relevant information about the customer, if available.'),
});

const GenerateInsightsFromWhatsAppDataInputSchema = z.object({
  whatsAppData: WhatsAppDataSchema.describe('WhatsApp conversation data to analyze.'),
});

export type GenerateInsightsFromWhatsAppDataInput = z.infer<typeof GenerateInsightsFromWhatsAppDataInputSchema>;

const GenerateInsightsFromWhatsAppDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the WhatsApp conversation data.'),
  keyTrends: z.string().describe('Identified key trends and patterns in the communication.'),
  recommendations: z.string().describe('Recommendations for improving service based on the analysis.'),
});

export type GenerateInsightsFromWhatsAppDataOutput = z.infer<typeof GenerateInsightsFromWhatsAppDataOutputSchema>;

const relevantCustomerDataTool = ai.defineTool({
  name: 'getRelevantCustomerData',
  description: 'Retrieves highly relevant customer information for generating reports and analysis, disregarding irrelevant data.',
  inputSchema: z.object({
    customerId: z.string().describe('The ID of the customer to retrieve information for.'),
  }),
  outputSchema: CustomerInfoSchema.nullable(),
},
async (input) => {
  // TODO: Replace with actual implementation to fetch customer data
  console.log('getRelevantCustomerData tool called with input:', input);
  return null; // Return null if no relevant customer data is found
});

export async function generateInsightsFromWhatsAppData(
  input: GenerateInsightsFromWhatsAppDataInput
): Promise<GenerateInsightsFromWhatsAppDataOutput> {
  return generateInsightsFromWhatsAppDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInsightsFromWhatsAppDataPrompt',
  input: {
    schema: GenerateInsightsFromWhatsAppDataInputSchema,
  },
  output: {
    schema: GenerateInsightsFromWhatsAppDataOutputSchema,
  },
  tools: [relevantCustomerDataTool],
  prompt: `You are an AI assistant specialized in analyzing WhatsApp conversation data to provide summaries, identify key trends, and offer recommendations for service improvement. You have access to a tool to retrieve relevant customer information.

Analyze the following WhatsApp conversation data:

Messages:
{{#each whatsAppData.messages}}
- {{{this}}}
{{/each}}

{{#if whatsAppData.customerInfo}}
Customer Information:
- Name: {{{whatsAppData.customerInfo.name}}}
- Contact Details: {{{whatsAppData.customerInfo.contactDetails}}}
- Relevant History: {{{whatsAppData.customerInfo.relevantHistory}}}
{{/if}}

Provide a concise summary of the conversation, identify key trends and patterns in the communication, and offer recommendations for improving the service. Consider using the getRelevantCustomerData tool if customer-specific information is needed to provide a more tailored analysis.

Summary: {{summary}}
Key Trends: {{keyTrends}}
Recommendations: {{recommendations}}`,
});

const generateInsightsFromWhatsAppDataFlow = ai.defineFlow(
  {
    name: 'generateInsightsFromWhatsAppDataFlow',
    inputSchema: GenerateInsightsFromWhatsAppDataInputSchema,
    outputSchema: GenerateInsightsFromWhatsAppDataOutputSchema,
  },
  async input => {
    // Optionally call the tool here before passing the data to the prompt
    // const customerData = await relevantCustomerDataTool({ customerId: input.customerId });
    // Include the tool output in the prompt input if needed

    const {output} = await prompt(input);
    return output!;
  }
);
