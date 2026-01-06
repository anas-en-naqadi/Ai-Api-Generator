/**
 * Service de gestion des logs et des statistiques d'exécution
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ExecutionLog, AnalyticsData } from '../types/analytics';

const STORAGE_DIR = join(process.cwd(), 'storage');
const LOGS_DIR = join(STORAGE_DIR, 'logs');

/**
 * Initialise les répertoires de stockage
 */
function ensureStorageExists(): void {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
  }
}

/**
 * Enregistre un log d'exécution
 */
export async function logExecution(
  logData: Omit<ExecutionLog, 'id' | 'timestamp'>
): Promise<void> {
  ensureStorageExists();

  const log: ExecutionLog = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...logData,
  };

  const logFile = join(LOGS_DIR, `${log.functionName}.json`);
  
  let logs: ExecutionLog[] = [];
  if (existsSync(logFile)) {
    try {
      logs = JSON.parse(readFileSync(logFile, 'utf-8'));
    } catch (e) {
      console.error(`Erreur lors de la lecture des logs pour ${log.functionName}:`, e);
    }
  }

  // Ajouter le nouveau log au début (plus récent d'abord)
  logs.unshift(log);

  // Limiter à 100 logs par fonction pour ne pas saturer le stockage
  if (logs.length > 100) {
    logs = logs.slice(0, 100);
  }

  writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
}

/**
 * Récupère les logs pour une fonction
 */
export function getLogs(functionName: string, limit: number = 20): ExecutionLog[] {
  const logFile = join(LOGS_DIR, `${functionName}.json`);
  
  if (!existsSync(logFile)) {
    return [];
  }

  try {
    const logs = JSON.parse(readFileSync(logFile, 'utf-8')) as ExecutionLog[];
    return logs.slice(0, limit);
  } catch (e) {
    console.error(`Erreur lors de la récupération des logs pour ${functionName}:`, e);
    return [];
  }
}

/**
 * Récupère les analytics pour une fonction
 */
export function getFunctionAnalytics(functionName: string): AnalyticsData {
  const logFile = join(LOGS_DIR, `${functionName}.json`);
  
  if (!existsSync(logFile)) {
    return {
      stats: {
        totalCalls: 0,
        successCount: 0,
        errorCount: 0,
        avgDuration: 0,
        successRate: 0,
      },
      dailyStats: [],
    };
  }

  try {
    const logs = JSON.parse(readFileSync(logFile, 'utf-8')) as ExecutionLog[];
    
    const totalCalls = logs.length;
    const successCount = logs.filter(l => l.status === 'success').length;
    const errorCount = totalCalls - successCount;
    const avgDuration = totalCalls > 0 
      ? logs.reduce((acc, l) => acc + l.duration, 0) / totalCalls 
      : 0;
    
    const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;
    const lastCalledAt = logs.length > 0 ? logs[0].timestamp : undefined;

    // Calculer les stats par jour (sur les 7 derniers jours)
    const dailyMap = new Map<string, { calls: number, errors: number }>();
    
    // Initialiser les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { calls: 0, errors: 0 });
    }

    logs.forEach(log => {
      const dateStr = log.timestamp.split('T')[0];
      if (dailyMap.has(dateStr)) {
        const current = dailyMap.get(dateStr)!;
        current.calls++;
        if (log.status === 'error') current.errors++;
        dailyMap.set(dateStr, current);
      }
    });

    const dailyStats = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      calls: data.calls,
      errors: data.errors,
    }));

    return {
      stats: {
        totalCalls,
        successCount,
        errorCount,
        avgDuration,
        successRate,
        lastCalledAt,
      },
      dailyStats,
    };
  } catch (e) {
    console.error(`Erreur lors du calcul des analytics pour ${functionName}:`, e);
    return {
      stats: {
        totalCalls: 0,
        successCount: 0,
        errorCount: 0,
        avgDuration: 0,
        successRate: 0,
      },
      dailyStats: [],
    };
  }
}
