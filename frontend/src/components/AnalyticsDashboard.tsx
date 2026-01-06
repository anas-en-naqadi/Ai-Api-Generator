import { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { 
  Activity, CheckCircle, AlertTriangle, Clock, 
  Calendar, ArrowLeft, RefreshCw 
} from 'lucide-react';
import type { AnalyticsData } from '../types/analytics';
import './AnalyticsDashboard.css';

interface Props {
  functionName: string;
  onBack?: () => void;
}

const AnalyticsDashboard = ({ functionName, onBack }: Props) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/${functionName}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des analytics');
      const result = await response.json();
      setData(result.analytics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [functionName]);

  if (loading && !data) {
    return (
      <div className="analytics-loading">
        <RefreshCw className="spin" />
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <AlertTriangle size={48} />
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="btn-retry">Réessayer</button>
      </div>
    );
  }

  if (!data || data.stats.totalCalls === 0) {
    return (
      <div className="analytics-empty">
        <Activity size={48} />
        <h3>Aucune donnée disponible</h3>
        <p>Exécutez cette fonction au moins une fois pour voir les statistiques apparaître.</p>
        {onBack && (
          <button onClick={onBack} className="btn-back">
            <ArrowLeft size={16} /> Retour
          </button>
        )}
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444'];
  const pieData = [
    { name: 'Succès', value: data.stats.successCount },
    { name: 'Erreurs', value: data.stats.errorCount },
  ];

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div className="header-left">
          {onBack && (
            <button onClick={onBack} className="icon-btn" title="Retour">
              <ArrowLeft size={20} />
            </button>
          )}
          <h2>📊 Analytics: {functionName}</h2>
        </div>
        <button onClick={fetchAnalytics} className="refresh-btn" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualiser
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon calls"><Activity size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Appels Totaux</span>
            <span className="stat-value">{data.stats.totalCalls}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Taux de Succès</span>
            <span className="stat-value">{data.stats.successRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon duration"><Clock size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Latence Moyenne</span>
            <span className="stat-value">{data.stats.avgDuration.toFixed(0)} ms</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon last"><Calendar size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Dernier Appel</span>
            <span className="stat-value">
              {data.stats.lastCalledAt ? new Date(data.stats.lastCalledAt).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-item full-width">
          <h3>📈 Activité (7 derniers jours)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyStats}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="calls" name="Appels" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCalls)" />
                <Area type="monotone" dataKey="errors" name="Erreurs" stroke="#ef4444" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-item">
          <h3>🎯 Répartition Succès/Erreur</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              <div className="legend-item"><span className="dot success"></span> Succès</div>
              <div className="legend-item"><span className="dot error"></span> Erreurs</div>
            </div>
          </div>
        </div>

        <div className="chart-item">
          <h3>⏱️ Temps de Réponse</h3>
          <div className="latency-summary">
            <div className="latency-value">{data.stats.avgDuration.toFixed(1)}<span>ms</span></div>
            <p>Latence moyenne sur l'ensemble des requêtes.</p>
            <div className="latency-bar-bg">
              <div 
                className={`latency-bar-fg ${data.stats.avgDuration > 1000 ? 'slow' : 'fast'}`} 
                style={{ width: `${Math.min(100, (data.stats.avgDuration / 2000) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
