export interface FunctionStats {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
  successRate: number;
  lastCalledAt?: string;
}

export interface DailyStat {
  date: string;
  calls: number;
  errors: number;
}

export interface AnalyticsData {
  stats: FunctionStats;
  dailyStats: DailyStat[];
}

export interface ExecutionLog {
  id: string;
  functionName: string;
  timestamp: string;
  duration: number;
  status: 'success' | 'error';
  inputs: Record<string, any>;
  output?: any;
  error?: string;
}
