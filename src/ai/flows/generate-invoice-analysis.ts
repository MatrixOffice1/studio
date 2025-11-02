'use server';
/**
 * @fileOverview Generates a financial analysis based on invoice data.
 *
 * - generateInvoiceAnalysis - A function that analyzes invoices and provides insights.
 * - GenerateInvoiceAnalysisInput - The input type for the function.
 * - GenerateInvoiceAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateInvoiceAnalysisInputSchema = z.object({
  invoicesJson: z.string().describe('A JSON string representing an array of all invoices.'),
});
export type GenerateInvoiceAnalysisInput = z.infer<typeof GenerateInvoiceAnalysisInputSchema>;

const GenerateInvoiceAnalysisOutputSchema = z.object({
  analysis: z.string().describe('A markdown-formatted analysis of the invoice data.'),
});
export type GenerateInvoiceAnalysisOutput = z.infer<typeof GenerateInvoiceAnalysisOutputSchema>;


export async function generateInvoiceAnalysis(
  input: GenerateInvoiceAnalysisInput
): Promise<GenerateInvoiceAnalysisOutput> {
  return generateInvoiceAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInvoiceAnalysisPrompt',
  input: {
    schema: GenerateInvoiceAnalysisInputSchema,
  },
  output: {
    schema: GenerateInvoiceAnalysisOutputSchema,
  },
  prompt: `Eres un analista de negocio experto para 'AirmateAI'. Tu tarea es generar un informe financiero CONCISO, profesional y fácil de leer basado en los datos de facturación. Responde siempre en español. La zona horaria es 'Europe/Madrid'.

  La estructura de tu respuesta debe ser la siguiente:
  - Usa **TÍTULO** para los encabezados de sección (e.g., **RESUMEN EJECUTIVO**).
  - Usa saltos de línea simples para las listas y dobles para separar párrafos y secciones.
  - NO uses Markdown complejo (###, ---, etc.), solo los títulos en negrita.
  - Los importes monetarios deben estar en euros (€).

  **ANÁLISIS FINANCIERO**

  **RESUMEN EJECUTIVO**
  [Un párrafo breve que resuma los hallazgos clave: rendimiento de ingresos (general, mensual, semanal), estado de los pagos y la oportunidad más importante.]

  **MÉTRICAS CLAVE**
  - Ingresos Totales (Periodo): [Suma total facturada]
  - Ingresos (Últimos 30 días): [Suma total del último mes]
  - Ingresos (Últimos 7 días): [Suma total de la última semana]
  - Ticket Promedio: [Valor promedio por factura]
  - Tasa de Pago: [Porcentaje de facturas pagadas]

  **TENDENCIAS Y PATRONES**
  [Describe 1-2 tendencias clave. Por ejemplo: qué profesional genera más ingresos, qué servicios son más rentables, si hay un día de la semana con mayor facturación, etc.]

  **OPORTUNIDADES DE CRECIMIENTO**
  [Crea una lista corta con 2-3 recomendaciones muy concisas y accionables para aumentar ingresos o mejorar la gestión.]
  - Oportunidad 1: [Texto de la recomendación.]
  - Oportunidad 2: [Texto de la recomendación.]

  **CONCLUSIÓN**
  [Un párrafo final muy breve resumiendo la salud financiera y la principal recomendación.]

  Si los datos de entrada son muy limitados, adapta tu análisis. Por ejemplo: "Aún no hay suficientes datos de facturación para un análisis profundo. Una recomendación inicial es asegurar que todas las citas se facturen correctamente para empezar a construir un historial financiero sólido."

Datos de Facturas (JSON):
{{{invoicesJson}}}
`,
});

const generateInvoiceAnalysisFlow = ai.defineFlow(
  {
    name: 'generateInvoiceAnalysisFlow',
    inputSchema: GenerateInvoiceAnalysisInputSchema,
    outputSchema: GenerateInvoiceAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
