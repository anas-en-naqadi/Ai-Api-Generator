import { useState, useEffect } from 'react';
import { 
  History, CheckCircle, XCircle, Clock, 
  ChevronDown, ChevronUp, RefreshCw, AlertTriangle, ArrowLeft
} from 'lucide-react';
import type { ExecutionLog } from '../types/analytics';
import './ExecutionLogs.css';

interface Props {
  functionName: string;
  onBack?: () => void;
}

const ExecutionLogs = ({ functionName, onBack }: Props) => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logs/${functionName}?limit=50`);
      if (!response.ok) throw new Error('Erreur lors du chargement des logs');
      const result = await response.json();
      setLogs(result.logs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [functionName]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="logs-loading">
        <RefreshCw className="spin" />
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <header className="logs-header">
        <div className="header-left">
          {onBack && (
            <button onClick={onBack} className="icon-btn" title="Retour">
              <ArrowLeft size={20} />
            </button>
          )}
          <h2>📜 Historique: {functionName}</h2>
        </div>
        <button onClick={fetchLogs} className="refresh-btn" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualiser
        </button>
      </header>

      {error ? (
        <div className="logs-error">
          <AlertTriangle color="#ef4444" />
          <p>{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="logs-empty">
          <History size={48} opacity={0.3} />
          <p>Aucun historique d'exécution pour le moment.</p>
        </div>
      ) : (
        <div className="logs-list">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className={`log-item ${expandedLogId === log.id ? 'expanded' : ''} ${log.status}`}
            >
              <div className="log-summary" onClick={() => toggleExpand(log.id)}>
                <div className="log-status-icon">
                  {log.status === 'success' ? (
                    <CheckCircle size={18} color="#10b981" />
                  ) : (
                    <XCircle size={18} color="#ef4444" />
                  )}
                </div>
                
                <div className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                  <span className="log-date">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>

                <div className="log-duration">
                  <Clock size={14} /> {log.duration}ms
                </div>

                <div className="log-expand-icon">
                  {expandedLogId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedLogId === log.id && (
                <div className="log-details">
                  <div className="detail-section">
                    <h4>📥 Inputs</h4>
                    <pre>{JSON.stringify(log.inputs, null, 2)}</pre>
                  </div>

                  <div className="detail-section">
                    <h4>📤 Output</h4>
                    {log.status === 'success' ? (
                      <pre>{JSON.stringify(log.output, null, 2)}</pre>
                    ) : (
                      <div className="error-box">
                        <span className="error-label">Erreur:</span>
                        <p>{log.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutionLogs;
