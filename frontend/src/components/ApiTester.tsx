import { useState, useEffect } from 'react';
import type { GeneratedFunction } from '../App';
import './ApiTester.css';


interface ApiTesterProps {
  function: GeneratedFunction;
}

export default function ApiTester({ function: func }: ApiTesterProps) {
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [examplePayload, setExamplePayload] = useState<Record<string, any> | null>(null);
  const [isLoadingExample, setIsLoadingExample] = useState(false);

  const formatJSON = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const updateInput = (name: string, value: any) => {
    setInputValues((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setResult(null);
  };

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Préparer le payload
      const payload: Record<string, any> = {};
      
      // Si la fonction a des inputs, les utiliser
      if (func.description?.inputs && func.description.inputs.length > 0) {
        func.description.inputs.forEach((input) => {
          const value = inputValues[input.name];
          
          // Convertir les valeurs selon le type
          if (input.type === 'number') {
            payload[input.name] = Number(value);
          } else if (input.type === 'boolean') {
            payload[input.name] = value === true || value === 'true';
          } else if (input.type === 'array' || input.type === 'object') {
            try {
              payload[input.name] = typeof value === 'string' ? JSON.parse(value) : value;
            } catch {
              payload[input.name] = value;
            }
          } else {
            payload[input.name] = value;
          }
        });
      }
      // Sinon, envoyer un payload vide

      // Include API token in request
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add token via Authorization header with Bearer format (required for API access)
      if (func.token) {
        headers['Authorization'] = `Bearer ${func.token}`;
      } else {
        // If no token, show error
        setError('API token is missing. Please recreate this function to generate a token.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(func.route, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erreur ${response.status}`);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier que la fonction a une description valide
  if (!func || !func.description) {
    return (
      <div className="api-tester">
        <div className="card">
          <div className="error-state">
            <p><strong>Erreur :</strong> La fonction n'a pas de description valide.</p>
          </div>
        </div>
      </div>
    );
  }

  // Générer un exemple intelligent via l'IA
  useEffect(() => {
    const generateExample = async () => {
      if (!func.description || !func.description.inputs || func.description.inputs.length === 0) {
        setExamplePayload({});
        setIsLoadingExample(false);
        return;
      }

      // Reset and show loader immediately
      setExamplePayload(null);
      setIsLoadingExample(true);
      try {
        const response = await fetch('/api/generate-example', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            functionName: func.name,
            logic: func.description.logic,
            inputs: func.description.inputs,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setExamplePayload(data.example || {});
        } else {
          // Fallback vers des exemples statiques si l'IA échoue
          const fallback: Record<string, any> = {};
          func.description.inputs.forEach((input) => {
            switch (input.type) {
              case 'number':
                fallback[input.name] = 100;
                break;
              case 'boolean':
                fallback[input.name] = true;
                break;
              case 'array':
                fallback[input.name] = [1, 2, 3];
                break;
              case 'object':
                fallback[input.name] = { key: 'value' };
                break;
              default:
                fallback[input.name] = 'exemple';
            }
          });
          setExamplePayload(fallback);
        }
      } catch (err) {
        // Fallback vers des exemples statiques en cas d'erreur
        const fallback: Record<string, any> = {};
        func.description.inputs.forEach((input) => {
          switch (input.type) {
            case 'number':
              fallback[input.name] = 100;
              break;
            case 'boolean':
              fallback[input.name] = true;
              break;
            case 'array':
              fallback[input.name] = [1, 2, 3];
              break;
            case 'object':
              fallback[input.name] = { key: 'value' };
              break;
            default:
              fallback[input.name] = 'exemple';
          }
        });
        setExamplePayload(fallback);
      } finally {
        setIsLoadingExample(false);
      }
    };

    generateExample();
  }, [func]);

  // Initialiser les valeurs par défaut
  useEffect(() => {
    if (!func.description || !func.description.inputs) {
      return;
    }
    
    const defaults: Record<string, any> = {};
    func.description.inputs.forEach((input) => {
      switch (input.type) {
        case 'number':
          defaults[input.name] = 0;
          break;
        case 'boolean':
          defaults[input.name] = false;
          break;
        case 'array':
          defaults[input.name] = [];
          break;
        case 'object':
          defaults[input.name] = {};
          break;
        default:
          defaults[input.name] = '';
      }
    });
    setInputValues(defaults);
  }, [func]);
  
  // Vérifier que les inputs existent
  if (!func.description.inputs || func.description.inputs.length === 0) {
    return (
      <div className="api-tester">
        <div className="card">
          <div className="tester-header">
            <div>
              <h2 className="card-title">Tester l'API</h2>
              <p className="card-description">
                Testez la fonction <code>{func.name}</code>
              </p>
            </div>
            <div className="endpoint-info">
              <span className="method-badge">POST</span>
              <code className="endpoint-url">{func.route}</code>
            </div>
          </div>
          <div className="tester-section">
            <p>Cette fonction n'a pas de paramètres d'entrée.</p>
            <div className="tester-actions">
              <button
                onClick={handleTest}
                className="button-primary button-large"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Exécution en cours...
                  </>
                ) : (
                  '▶️ Exécuter la fonction'
                )}
              </button>
            </div>
            {(result || error) && (
              <div className="tester-section">
                <h3 className="section-title">
                  {error ? 'Erreur' : 'Résultat'}
                </h3>
                {error ? (
                  <div className="result-container result-error">
                    <pre className="result-json">{error}</pre>
                  </div>
                ) : (
                  <div className="result-container result-success">
                    <div className="result-header">
                      <span className="result-status">✓ Succès</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(formatJSON(result))}
                        className="button-secondary button-sm"
                        title="Copier le résultat"
                      >
                        📋 Copier
                      </button>
                    </div>
                    <pre className="result-json">{formatJSON(result)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="api-tester">
      <div className="card">
        <div className="tester-header">
          <div>
            <h2 className="card-title">Tester l'API</h2>
            <p className="card-description">
              Testez la fonction <code>{func.name}</code> avec vos propres valeurs
            </p>
          </div>
          <div className="endpoint-info">
            <span className="method-badge">POST</span>
            <code className="endpoint-url">{func.route}</code>
          </div>
        </div>

        {/* Formulaire d'entrée */}
        <div className="tester-section">
          <h3 className="section-title">Paramètres d'entrée</h3>
          <div className="inputs-form">
            {func.description.inputs.map((input) => (
              <div key={input.name} className="form-group">
                <label htmlFor={input.name} className="form-label">
                  {input.name}
                  {input.required && <span className="required">*</span>}
                  <span className="type-badge">{input.type}</span>
                </label>
                
                {input.type === 'boolean' ? (
                  <label className="checkbox-label-large">
                    <input
                      type="checkbox"
                      id={input.name}
                      checked={inputValues[input.name] === true}
                      onChange={(e) => updateInput(input.name, e.target.checked)}
                      disabled={isLoading}
                    />
                    <span>{inputValues[input.name] ? 'true' : 'false'}</span>
                  </label>
                ) : input.type === 'array' || input.type === 'object' ? (
                  <textarea
                    id={input.name}
                    value={
                      typeof inputValues[input.name] === 'string'
                        ? inputValues[input.name]
                        : JSON.stringify(inputValues[input.name] || (input.type === 'array' ? [] : {}), null, 2)
                    }
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateInput(input.name, parsed);
                      } catch {
                        updateInput(input.name, e.target.value);
                      }
                    }}
                    placeholder={`Exemple: ${input.type === 'array' ? '[1, 2, 3]' : '{"key": "value"}'}`}
                    className="form-textarea form-textarea-code"
                    rows={4}
                    disabled={isLoading}
                  />
                ) : (
                  <input
                    id={input.name}
                    type={input.type === 'number' ? 'number' : 'text'}
                    value={inputValues[input.name] || ''}
                    onChange={(e) =>
                      updateInput(
                        input.name,
                        input.type === 'number' ? Number(e.target.value) : e.target.value
                      )
                    }
                    placeholder={`Entrez une valeur de type ${input.type}`}
                    className="form-input"
                    required={input.required}
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bouton de test */}
        <div className="tester-actions">
          <button
            onClick={handleTest}
            className="button-primary button-large"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Exécution en cours...
              </>
            ) : (
              '▶️ Exécuter la fonction'
            )}
          </button>
        </div>

        {/* Résultat */}
        {(result || error) && (
          <div className="tester-section">
            <h3 className="section-title">
              {error ? 'Erreur' : 'Résultat'}
            </h3>
            
            {error ? (
              <div className="result-container result-error">
                <pre className="result-json">{error}</pre>
              </div>
            ) : (
              <div className="result-container result-success">
                <div className="result-header">
                  <span className="result-status">✓ Succès</span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(formatJSON(result));
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      } catch (err) {
                        console.error('Erreur lors de la copie:', err);
                      }
                    }}
                    className="button-secondary button-sm"
                    title="Copier le résultat"
                  >
                    {copySuccess ? '✓ Copié!' : '📋 Copier'}
                  </button>
                </div>
                <pre className="result-json">{formatJSON(result)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Exemple de payload */}
        <div className="tester-section">
          <h3 className="section-title">
            Exemple de requête
            {isLoadingExample && <span className="loading-badge">Génération...</span>}
          </h3>
          <div className="example-container">
            <div className="example-header">
              <span className="method-badge">POST</span>
              <code className="endpoint-url">{func.route}</code>
              {examplePayload && !isLoadingExample && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(formatJSON(examplePayload));
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    } catch (err) {
                      console.error('Erreur lors de la copie:', err);
                    }
                  }}
                  className="button-secondary button-sm"
                  title="Copier l'exemple"
                >
                  {copySuccess ? '✓ Copié!' : '📋 Copier'}
                </button>
              )}
            </div>
           <div className="example-div"> 
             {isLoadingExample || !examplePayload ? (
              <div className="example-loading-state">
                <p>Génération d'un exemple intelligent...</p>
              </div>
            ) : (
              <pre className="example-json">
                {formatJSON(examplePayload)}
              </pre>
            )}
           </div>
          </div>
        </div>
      </div>
    </div>
  );
}
