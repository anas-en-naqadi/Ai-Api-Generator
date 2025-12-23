/**
 * Route pour créer et gérer les fonctions
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { functionDescriptionSchema } from '../utils/validation';
import { generateFunction } from '../services/ai-generator';
import { saveFunction, functionExists, deleteFunction, getFunction } from '../services/function-storage';
import { registerFunctionRoute } from '../services/route-register';
import { generateExample } from '../services/example-generator';
import { generateDocumentation } from '../services/documentation-generator';
import { generateApiToken } from '../utils/token-generator';
import type { FunctionDescription } from '../types/function';

interface CreateFunctionBody {
  name: string;
  inputs: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    description?: string;
  }>;
  logic: string;
  output: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
  };
}

/**
 * Route POST /api/functions - Crée une nouvelle fonction
 */
export async function createFunctionRoute(
  fastify: FastifyInstance
): Promise<void> {
  fastify.post<{ Body: CreateFunctionBody }>(
    '/api/functions',
    {
      schema: {
        description: 'Crée une nouvelle fonction API à partir d\'une description',
        tags: ['functions'],
        body: {
          type: 'object',
          required: ['name', 'inputs', 'logic', 'output'],
          properties: {
            name: { type: 'string' },
            inputs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['string', 'number', 'boolean', 'object', 'array'] },
                  required: { type: 'boolean' },
                  description: { type: 'string' },
                },
              },
            },
            logic: { type: 'string' },
            output: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['string', 'number', 'boolean', 'object', 'array'] },
                description: { type: 'string' },
              },
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              functionName: { type: 'string' },
              route: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              details: { type: 'array' },
            },
          },
          409: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateFunctionBody }>, reply: FastifyReply) => {
      try {
        // Valider les entrées
        const validatedData = functionDescriptionSchema.parse(request.body);
        
        // Vérifier si la fonction existe déjà
        if (functionExists(validatedData.name)) {
          return reply.code(409).send({
            success: false,
            error: `La fonction ${validatedData.name} existe déjà`,
          });
        }

        // Générer le code via l'IA
        const generatedCode = await generateFunction(validatedData);
        
        // Valider la sécurité du code généré avant sauvegarde
        const { validateCodeSafety } = await import('../services/sandbox-executor');
        const safetyCheck = validateCodeSafety(generatedCode);
        if (!safetyCheck.safe) {
          return reply.code(400).send({
            success: false,
            error: 'Code généré non sécurisé',
            details: safetyCheck.reason,
          });
        }

        // Générer un token unique pour cette fonction
        const apiToken = generateApiToken();

        // Générer la documentation automatiquement si elle n'existe pas
        // La documentation est générée UNIQUEMENT lors de la création
        // Utiliser l'URL de la requête pour déterminer le base URL
        const host = request.headers.host || `localhost:${process.env.PORT || 3000}`;
        const protocol = (request.headers['x-forwarded-proto'] as string) || 'http';
        const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
        const finalDocumentation = validatedData.documentation 
          ? validatedData.documentation 
          : generateDocumentation(validatedData.name, validatedData, baseUrl, apiToken);

        // Créer l'objet fonction
        const functionData = {
          name: validatedData.name,
          code: generatedCode,
          token: apiToken,
          createdAt: new Date().toISOString(),
          description: {
            ...validatedData,
            documentation: finalDocumentation,
          },
        };

        // Sauvegarder la fonction
        saveFunction(functionData);

        // Enregistrer la route dynamique
        registerFunctionRoute(fastify, validatedData.name);

        return reply.code(201).send({
          success: true,
          message: `Fonction ${validatedData.name} créée avec succès`,
          functionName: validatedData.name,
          route: `/api/${validatedData.name}`,
          token: apiToken,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return reply.code(400).send({
            success: false,
            error: 'Erreur de validation',
            details: (error as any).errors,
          });
        }

        console.error('Erreur lors de la création de la fonction:', error);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue lors de la génération',
        });
      }
    }
  );
}

/**
 * Route GET /api/functions - Liste toutes les fonctions
 */
export async function listFunctionsRoute(
  fastify: FastifyInstance
): Promise<void> {
  fastify.get(
    '/api/functions',
    {
      schema: {
        description: 'Liste toutes les fonctions créées',
        tags: ['functions'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              functions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    route: { type: 'string' },
                    token:{type: 'string'},
                    createdAt: { type: 'string' },
                    description: {
                      type: 'object',
                      properties: {  // ✅ Define the properties!
                        name: { type: 'string' },
                        inputs: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              type: { type: 'string' },
                              required: { type: 'boolean' }
                            }
                          }
                        },
                        documentation: { type: 'string' },
                        logic: { type: 'string' },
                        output: {
                          type: 'object',
                          properties: {
                            type: { type: 'string' }
                          }
                        }
                      }
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { listFunctions } = await import('../services/function-storage');
        const functions = listFunctions();

        return reply.send({
          success: true,
          functions: functions.map((func) => {
            const description = func.description;
            
            return {
              name: func.name,
              route: `/api/${func.name}`,
              token: func.token,
              createdAt: func.createdAt,
              description: {
                name: description?.name || func.name,
                inputs: Array.isArray(description?.inputs) ? description.inputs : [],
                logic: description?.logic || '',
                output: description?.output || { type: 'string' },
                documentation: description?.documentation || '',
              },
            };
          }),
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des fonctions:', error);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }
  );
}

/**
 * Route POST /api/generate-example - Génère un exemple intelligent de payload
 */
export async function generateExampleRoute(
  fastify: FastifyInstance
): Promise<void> {
  fastify.post<{
    Body: {
      functionName: string;
      logic: string;
      inputs: FunctionDescription['inputs'];
    };
  }>(
    '/api/generate-example',
    {
      schema: {
        description: 'Génère un exemple intelligent de payload pour une fonction',
        tags: ['functions'],
        body: {
          type: 'object',
          required: ['functionName', 'logic', 'inputs'],
          properties: {
            functionName: { type: 'string' },
            logic: { type: 'string' },
            inputs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { functionName, logic, inputs } = request.body;
        const example = await generateExample(functionName, logic, inputs);
        
        return reply.send({
          success: true,
          example,
        });
      } catch (error) {
        console.error('Erreur lors de la génération d\'exemple:', error);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }
  );
}

/**
 * Route PUT /api/functions/:functionName - Met à jour une fonction
 */
export async function updateFunctionRoute(
  fastify: FastifyInstance
): Promise<void> {
  fastify.put<{
    Params: { functionName: string };
    Body: CreateFunctionBody & { documentation?: string };
  }>(
    '/api/functions/:functionName',
    {
      schema: {
        description: 'Met à jour une fonction existante',
        tags: ['functions'],
        params: {
          type: 'object',
          properties: {
            functionName: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['name', 'inputs', 'logic', 'output'],
          properties: {
            name: { type: 'string' },
            inputs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['string', 'number', 'boolean', 'object', 'array'] },
                  required: { type: 'boolean' },
                  description: { type: 'string' },
                },
              },
            },
            logic: { type: 'string' },
            output: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['string', 'number', 'boolean', 'object', 'array'] },
                description: { type: 'string' },
              },
            },
            documentation: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { functionName } = request.params;
        const validatedData = functionDescriptionSchema.parse(request.body);
        
        // Vérifier si la fonction existe
        const existingFunction = getFunction(functionName);
        if (!existingFunction) {
          return reply.code(404).send({
            success: false,
            error: `La fonction ${functionName} n'existe pas`,
          });
        }

        // Si le nom change, vérifier qu'il n'existe pas déjà
        if (validatedData.name !== functionName && functionExists(validatedData.name)) {
          return reply.code(409).send({
            success: false,
            error: `Une fonction avec le nom ${validatedData.name} existe déjà`,
          });
        }

        // Si le nom ou la logique change, régénérer le code
        let newCode = existingFunction.code;
        if (validatedData.name !== functionName || validatedData.logic !== existingFunction.description.logic) {
          newCode = await generateFunction(validatedData);
          
          // Valider la sécurité du code généré
          const { validateCodeSafety } = await import('../services/sandbox-executor');
          const safetyCheck = validateCodeSafety(newCode);
          if (!safetyCheck.safe) {
            return reply.code(400).send({
              success: false,
              error: 'Code généré non sécurisé',
              details: safetyCheck.reason,
            });
          }
        }

        // Si le nom change, supprimer l'ancienne fonction et créer la nouvelle
        if (validatedData.name !== functionName) {
          deleteFunction(functionName);
        }

        // Détecter si des changements ont été apportés qui nécessitent une régénération de la documentation
        const oldDesc = existingFunction.description;
        const hasChanges = 
          validatedData.name !== oldDesc.name ||
          validatedData.logic !== oldDesc.logic ||
          JSON.stringify(validatedData.inputs) !== JSON.stringify(oldDesc.inputs || []) ||
          JSON.stringify(validatedData.output) !== JSON.stringify(oldDesc.output || { type: 'string' });

        // Régénérer la documentation si des changements ont été détectés
        let finalDocumentation: string;
        if (hasChanges) {
          // Utiliser l'URL de la requête pour déterminer le base URL
          const host = request.headers.host || `localhost:${process.env.PORT || 3000}`;
          const protocol = (request.headers['x-forwarded-proto'] as string) || 'http';
          const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
          // Use existing token for documentation
          finalDocumentation = generateDocumentation(validatedData.name, validatedData, baseUrl, existingFunction.token);
        } else {
          // Aucun changement détecté, garder la documentation existante ou utiliser celle fournie
          finalDocumentation = validatedData.documentation || existingFunction.description.documentation || '';
        }

        // Créer l'objet fonction mis à jour
        // Conserver le token existant (ne pas le régénérer)
        const functionData = {
          name: validatedData.name,
          code: newCode,
          token: existingFunction.token, // Conserver le token existant
          createdAt: existingFunction.createdAt, // Conserver la date de création originale
          description: {
            ...validatedData,
            documentation: finalDocumentation,
          },
        };

        // Sauvegarder la fonction
        saveFunction(functionData);

        // Si le nom a changé, enregistrer la nouvelle route
        if (validatedData.name !== functionName) {
          registerFunctionRoute(fastify, validatedData.name);
        }

        return reply.send({
          success: true,
          message: `Fonction ${validatedData.name} mise à jour avec succès`,
          functionName: validatedData.name,
          route: `/api/${validatedData.name}`,
          token: functionData.token,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return reply.code(400).send({
            success: false,
            error: 'Erreur de validation',
            details: (error as any).errors,
          });
        }

        console.error('Erreur lors de la mise à jour de la fonction:', error);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour',
        });
      }
    }
  );
}

/**
 * Route DELETE /api/functions/:functionName - Supprime une fonction
 */
export async function deleteFunctionRoute(
  fastify: FastifyInstance
): Promise<void> {
  fastify.delete<{
    Params: { functionName: string };
  }>(
    '/api/functions/:functionName',
    {
      schema: {
        description: 'Supprime une fonction',
        tags: ['functions'],
        params: {
          type: 'object',
          properties: {
            functionName: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { functionName } = request.params;
        
        if (!functionExists(functionName)) {
          return reply.code(404).send({
            success: false,
            error: `La fonction ${functionName} n'existe pas`,
          });
        }
        
        deleteFunction(functionName);
        
        return reply.send({
          success: true,
          message: `Fonction ${functionName} supprimée avec succès`,
        });
      } catch (error) {
        console.error('Erreur lors de la suppression de la fonction:', error);
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }
  );
}