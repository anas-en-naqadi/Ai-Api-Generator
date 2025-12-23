import { useEffect, useState } from 'react';
import type { GeneratedFunction } from '../App';
import FunctionEditModal from './FunctionEditModal';
import './FunctionList.css';

/**
 * Rend un aperçu Markdown pour les cartes (version simplifiée)
 */
function renderMarkdownPreview(markdown: string): string {
  const lines = markdown.split('\n').slice(0, 6); // Limiter à 6 lignes pour l'aperçu
  const result: string[] = [];
  
  for (const line of lines) {
    // Ignorer les blocs de code dans l'aperçu
    if (line.trim().startsWith('```')) {
      result.push('<p><em>[Code block]</em></p>');
      continue;
    }
    
    // Titres
    if (line.startsWith('### ')) {
      result.push(`<h3>${escapeHtml(line.substring(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      result.push(`<h2>${escapeHtml(line.substring(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      result.push(`<h1>${escapeHtml(line.substring(2))}</h1>`);
      continue;
    }
    
    // Bold, italic, inline code
    const html = escapeHtml(line)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
    
    if (html.trim()) {
      result.push(`<p>${html}</p>`);
    }
  }
  
  return result.join('');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

interface FunctionListProps {
  functions: GeneratedFunction[];
  onFunctionSelect: (func: GeneratedFunction) => void;
  onFunctionsLoaded: (functions: GeneratedFunction[]) => void;
  isVisible?: boolean;
  onFunctionDeleted?: (functionName: string) => void;
  onViewDocumentation?: (func: GeneratedFunction) => void;
  showSuccess?: (message: string) => void;
  showError?: (message: string) => void;
}

export default function FunctionList({
  functions,
  onFunctionSelect,
  onFunctionsLoaded,
  isVisible = true,
  onFunctionDeleted,
  onViewDocumentation,
  showSuccess,
  showError,
}: FunctionListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ name: string; show: boolean }>({ name: '', show: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingFunction, setEditingFunction] = useState<GeneratedFunction | null>(null);

  // Charger les fonctions au montage
  useEffect(() => {
    loadFunctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharger quand le composant devient visible (quand on change d'onglet)
  useEffect(() => {
    if (isVisible) {
      loadFunctions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const loadFunctions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/functions');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        onFunctionsLoaded([]);
        return;
      }
      
      const data = JSON.parse(text);

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des fonctions');
      }

      onFunctionsLoaded(data.functions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (functionName: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/functions/${functionName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setDeleteConfirm({ name: '', show: false });
      loadFunctions();
      
      if (onFunctionDeleted) {
        onFunctionDeleted(functionName);
      }

      // Show success toast
      if (showSuccess) {
        showSuccess(`Fonction "${functionName}" supprimée avec succès`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      
      // Show error toast
      if (showError) {
        showError(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="function-list">
        <div className="card">
          <div className="loading-state">
            <span className="spinner" aria-hidden="true"></span>
            <p>Chargement des fonctions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="function-list">
        <div className="card">
          <div className="error-state">
            <p><strong>Erreur :</strong> {error}</p>
            <button onClick={loadFunctions} className="button-primary">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (functions.length === 0) {
    return (
      <div className="function-list">
        <div className="card">
          <div className="empty-state">
            <p className="empty-icon">📝</p>
            <h3>Aucune fonction créée</h3>
            <p>Créez votre première fonction API pour commencer.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="function-list">
      <div className="card">
        <div className="list-header">
          <h2 className="card-title">Fonctions disponibles</h2>
          <button onClick={loadFunctions} className="button-secondary button-sm">
            🔄 Actualiser
          </button>
        </div>

        <div className="functions-grid">
          {functions.map((func) => {
            // Protection contre les données manquantes
            if (!func || !func.description) {
              return null;
            }
            
            return (
              <div
                key={func.name}
                className="function-card"
              >
                <div className="function-card-header">
                  <h3 className="function-name">{func.name || 'Fonction sans nom'}</h3>
                  <span className="function-badge">POST</span>
                </div>
                <p className="function-route">
                  <code>{func.route || `/api/${func.name || 'unknown'}`}</code>
                </p>
                {func.description.logic && (
                  <div className="function-description">
                    <p className="function-logic">{func.description.logic}</p>
                  </div>
                )}
                <div className="function-inputs-preview">
                  <strong>Paramètres :</strong>
                  {func.description.inputs && func.description.inputs.length > 0 ? (
                    <ul className="inputs-list">
                      {func.description.inputs.map((input, idx) => (
                        <li key={idx}>
                          <code>{input.name}</code>
                          <span className={`type-tag type-tag-${input.type}`}>{input.type}</span>
                          {input.required && <span className="required-tag">requis</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="no-inputs">Aucun paramètre</span>
                  )}
                </div>
                <div className="function-meta">
                  <span className="function-inputs">
                    {func.description.inputs ? func.description.inputs.length : 0} paramètre(s)
                  </span>
                  <span className="function-date">
                    {func.createdAt ? new Date(func.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'Date inconnue'}
                  </span>
                </div>
                <div className="function-card-actions">
                  <div className="function-card-actions-row">
                    <button
                      className="function-card-button function-card-button-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFunctionSelect(func);
                      }}
                    >
                      ▶️ Tester
                    </button>
                    {func.description.documentation && onViewDocumentation && (
                      <button
                        className="function-card-button function-card-button-docs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDocumentation(func);
                        }}
                        title="Voir la documentation API"
                      >
                        📚 Docs
                      </button>
                    )}
                    <div className="function-card-actions-secondary">
                      <button
                        className="function-card-button-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFunction(func);
                        }}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="function-card-button-icon function-card-button-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ name: func.name, show: true });
                        }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal d'édition */}
      {editingFunction && (
        <FunctionEditModal
          function={editingFunction}
          onClose={() => setEditingFunction(null)}
          onUpdate={(updated) => {
            setEditingFunction(null);
            onFunctionsLoaded(functions.map(f => f.name === updated.name ? updated : f));
            loadFunctions();
          }}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirm.show && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm({ name: '', show: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer la fonction <strong>{deleteConfirm.name}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button
                className="button-secondary"
                onClick={() => setDeleteConfirm({ name: '', show: false })}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                className="button-danger"
                onClick={() => handleDelete(deleteConfirm.name)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
