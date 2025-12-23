/**
 * Schémas de validation Zod pour les entrées API
 */
import { z } from 'zod';

export const functionInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  required: z.boolean().optional().default(true),
  description: z.string().optional(),
});

export const functionOutputSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
});

export const functionDescriptionSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Le nom doit commencer par une lettre et contenir uniquement lettres, chiffres et underscores'),
  inputs: z.array(functionInputSchema).min(0),
  logic: z.string().min(1, 'La logique métier est requise'),
  output: functionOutputSchema,
  documentation: z.string().optional(),
});

export type FunctionDescriptionInput = z.infer<typeof functionDescriptionSchema>;
