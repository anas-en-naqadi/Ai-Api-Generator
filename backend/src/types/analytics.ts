/**
 * Types pour les analytics et les logs d'exécution
 */

export interface ExecutionLog {
  id: string;
  functionName: string;
  timestamp: string;
  duration: number; // en ms
  status: 'success' | 'error';
  inputs: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

export interface FunctionStats {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
  successRate: number;
  lastCalledAt?: string;
}

export interface AnalyticsData {
  stats: FunctionStats;
  dailyStats: {
    date: string;
    calls: number;
    errors: number;
  }[];
}
