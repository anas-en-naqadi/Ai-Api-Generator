/**
 * Types pour les descriptions de fonctions et fonctions générées
 */

export interface FunctionInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  description?: string;
}

export interface FunctionOutput {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export interface FunctionDescription {
  name: string;
  inputs: FunctionInput[];
  logic: string;
  output: FunctionOutput;
  documentation?: string;
}

export interface GeneratedFunction {
  name: string;
  code: string;
  token: string;
  createdAt: string;
  description: FunctionDescription;
}

export interface StoredFunctions {
  [functionName: string]: GeneratedFunction;
}
