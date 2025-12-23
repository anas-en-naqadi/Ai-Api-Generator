/**
 * Point d'entrée principal de l'application
 */
// Charger les variables d'environnement en premier
import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { registerAllFunctionRoutes, createInputSchema } from './services/route-register';
import { createFunctionRoute, listFunctionsRoute, generateExampleRoute, updateFunctionRoute, deleteFunctionRoute } from './routes/functions';
import { validateToken } from './utils/token-validator';

const PORT = Number(process.env.PORT) || 3000;

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // CORS pour permettre les requêtes depuis le frontend
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // En développement, accepter toutes les origines
      if (process.env.NODE_ENV !== 'production') {
        cb(null, true);
        return;
      }
      // En production, vérifier l'origine
      const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Enregistrer les routes de gestion des fonctions
  await createFunctionRoute(fastify);
  await listFunctionsRoute(fastify);
  await generateExampleRoute(fastify);
  await updateFunctionRoute(fastify);
  await deleteFunctionRoute(fastify);

  // Route catch-all pour les fonctions dynamiques (gère les routes créées après le démarrage)
  fastify.post('/api/:functionName', async (request, reply) => {
    const functionName = (request.params as { functionName: string }).functionName;
    
    // Ignorer les routes système
    if (functionName === 'functions') {
      return reply.code(404).send({ success: false, error: 'Route non trouvée' });
    }

    try {
      // Validate API token
      const tokenValidation = validateToken(functionName, {
        headers: request.headers as Record<string, string | undefined>,
      });

      if (!tokenValidation.valid) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: tokenValidation.error,
        });
      }

      const { getFunction } = await import('./services/function-storage');
      const { executeInSandbox, validateCodeSafety } = await import('./services/sandbox-executor');
      
      const storedFunction = getFunction(functionName);
      if (!storedFunction) {
        return reply.code(404).send({
          success: false,
          error: `Fonction ${functionName} non trouvée`,
        });
      }

      // Valider la sécurité
      const safetyCheck = validateCodeSafety(storedFunction.code);
      if (!safetyCheck.safe) {
        return reply.code(400).send({
          success: false,
          error: 'Code non sécurisé',
          details: safetyCheck.reason,
        });
      }

      // Créer le schéma de validation
      const inputSchema = createInputSchema(functionName);
      const validatedInputs = inputSchema.parse(request.body);

      // Exécuter la fonction
      const result = executeInSandbox(functionName, storedFunction.code, validatedInputs);
      const finalResult = result instanceof Promise ? await result : result;

      return {
        success: true,
        result: finalResult,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      console.error(`Erreur dans la route /api/${functionName}:`, error);
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  });

  // Enregistrer toutes les routes dynamiques existantes (pour compatibilité)
  registerAllFunctionRoutes(fastify);

  // Route de santé
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Route racine
  fastify.get('/', async () => {
    return {
      message: 'Backend API Generator with IA',
      version: '1.0.0',
      endpoints: {
        createFunction: 'POST /api/functions',
        listFunctions: 'GET /api/functions',
        executeFunction: 'POST /api/{functionName}',
        health: 'GET /health',
      },
    };
  });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    
    await app.listen({ port: PORT });
    
    console.log(`
🚀 Serveur démarré avec succès !
📍 URL: http://localhost:${PORT}
📚 Documentation disponible sur: http://localhost:${PORT}/
    `);
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on('SIGTERM', async () => {
  console.log('SIGTERM reçu, arrêt en cours...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT reçu, arrêt en cours...');
  process.exit(0);
});

start();
