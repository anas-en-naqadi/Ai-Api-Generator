/**
 * Service pour enregistrer dynamiquement les routes Fastify
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { getFunction, loadFunctions } from './function-storage';
import { executeInSandbox, validateCodeSafety } from './sandbox-executor';
import { validateToken } from '../utils/token-validator';
import { z } from 'zod';

/**
 * Exécute une fonction générée avec validation des entrées dans un sandbox sécurisé
 */
async function executeGeneratedFunction(
  functionName: string,
  inputs: Record<string, unknown>
): Promise<unknown> {
  const storedFunction = getFunction(functionName);
  
  if (!storedFunction) {
    throw new Error(`Fonction ${functionName} non trouvée`);
  }

  try {
    // Valider la sécurité du code avant exécution
    const safetyCheck = validateCodeSafety(storedFunction.code);
    if (!safetyCheck.safe) {
      throw new Error(`Code non sécurisé détecté: ${safetyCheck.reason}`);
    }

    // Exécuter dans le sandbox sécurisé
    const result = executeInSandbox(
      functionName,
      storedFunction.code,
      inputs
    );

    // Gérer les promesses si nécessaire
    if (result instanceof Promise) {
      return await result;
    }
    
    return result;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de ${functionName}:`, error);
    throw new Error(`Erreur d'exécution: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Crée un schéma Zod de validation basé sur les inputs de la fonction
 */
export function createInputSchema(functionName: string): z.ZodObject<any> {
  const storedFunction = getFunction(functionName);
  
  if (!storedFunction) {
    throw new Error(`Fonction ${functionName} non trouvée`);
  }

  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const input of storedFunction.description.inputs) {
    let zodType: z.ZodTypeAny;
    
    switch (input.type) {
      case 'string':
        zodType = z.string();
        break;
      case 'number':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'object':
        zodType = z.record(z.unknown());
        break;
      case 'array':
        zodType = z.array(z.unknown());
        break;
      default:
        zodType = z.unknown();
    }
    
    if (input.required !== false) {
      shape[input.name] = zodType;
    } else {
      shape[input.name] = zodType.optional();
    }
  }
  
  return z.object(shape);
}

/**
 * Enregistre une route dynamique pour une fonction
 */
export function registerFunctionRoute(fastify: FastifyInstance, functionName: string): void {
  const storedFunction = getFunction(functionName);
  
  if (!storedFunction) {
    throw new Error(`Fonction ${functionName} non trouvée`);
  }

  // Créer le schéma de validation
  const inputSchema = createInputSchema(functionName);

  // Handler pour la route
  // Handler pour la route
  const routeHandler = async (request: FastifyRequest, reply: any) => {
    const startTime = Date.now();
    let status: 'success' | 'error' = 'success';
    let result: unknown;
    let errorMsg: string | undefined;

    try {
      // Validate API token
      const tokenValidation = validateToken(functionName, {
        headers: request.headers as Record<string, string | undefined>,
      });

      if (!tokenValidation.valid) {
        status = 'error';
        errorMsg = 'Unauthorized';
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: tokenValidation.error,
        });
      }

      // Valider les entrées avec Zod
      const validatedInputs = inputSchema.parse(request.body);
      
      // Exécuter la fonction
      result = await executeGeneratedFunction(functionName, validatedInputs);
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      status = 'error';
      if (error instanceof z.ZodError) {
        errorMsg = 'Validation error';
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`Erreur dans la route /api/${functionName}:`, error);
      return reply.code(500).send({
        success: false,
        error: errorMsg,
      });
    } finally {
      // Log execution after response
      const duration = Date.now() - startTime;
      import('./analytics-service').then(m => {
        m.logExecution({
          functionName,
          duration,
          status,
          inputs: request.body as Record<string, unknown>,
          output: status === 'success' ? result : undefined,
          error: errorMsg,
        }).catch(err => console.error('Erreur lors du log analytics:', err));
      });
    }
  };

  // Fastify ne permet pas d'ajouter des routes après le démarrage du serveur
  // On enregistre la route seulement si le serveur n'a pas encore démarré
  if (!fastify.server.listening) {
    // Don't use Fastify schema validation - rely on Zod validation in the handler
    // This allows more flexibility for complex types like arrays and objects
    // Zod will handle all validation with proper type checking
    fastify.post(
      `/api/${functionName}`,
      routeHandler
    );
    console.log(`Route POST /api/${functionName} enregistrée`);
  } else {
    // Si le serveur est déjà démarré, on ne peut pas ajouter de route
    // La route sera disponible au prochain redémarrage
    console.warn(`⚠️  Le serveur est déjà démarré. La route /api/${functionName} sera disponible au prochain redémarrage.`);
    // Ne pas retourner d'erreur, juste un warning
  }

  console.log(`Route POST /api/${functionName} enregistrée`);
}

/**
 * Enregistre toutes les fonctions stockées comme routes
 */
export function registerAllFunctionRoutes(fastify: FastifyInstance): void {
  const functions = loadFunctions();
  
  for (const functionName of Object.keys(functions)) {
    try {
      registerFunctionRoute(fastify, functionName);
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de la route pour ${functionName}:`, error);
    }
  }
  
  console.log(`${Object.keys(functions).length} route(s) enregistrée(s)`);
}
