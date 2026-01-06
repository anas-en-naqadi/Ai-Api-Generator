/**
 * Routes pour les analytics et les logs
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getFunctionAnalytics, getLogs } from '../services/analytics-service';
import { functionExists } from '../services/function-storage';

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/analytics/:functionName - Récupère les stats d'une fonction
   */
  fastify.get(
    '/api/analytics/:functionName',
    {
      schema: {
        description: 'Récupère les analytics pour une fonction spécifique',
        tags: ['analytics'],
        params: {
          type: 'object',
          properties: {
            functionName: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { functionName: string } }>, reply: FastifyReply) => {
      const { functionName } = request.params;

      if (!functionExists(functionName)) {
        return reply.code(404).send({
          success: false,
          error: `La fonction ${functionName} n'existe pas`,
        });
      }

      const analytics = getFunctionAnalytics(functionName);
      return reply.send({
        success: true,
        analytics,
      });
    }
  );

  /**
   * GET /api/logs/:functionName - Récupère les logs d'une fonction
   */
  fastify.get(
    '/api/logs/:functionName',
    {
      schema: {
        description: 'Récupère les logs d\'exécution pour une fonction spécifique',
        tags: ['analytics'],
        params: {
          type: 'object',
          properties: {
            functionName: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ 
        Params: { functionName: string };
        Querystring: { limit?: number };
      }>, 
      reply: FastifyReply
    ) => {
      const { functionName } = request.params;
      const { limit } = request.query;

      if (!functionExists(functionName)) {
        return reply.code(404).send({
          success: false,
          error: `La fonction ${functionName} n'existe pas`,
        });
      }

      const logs = getLogs(functionName, limit);
      return reply.send({
        success: true,
        logs,
      });
    }
  );
}
