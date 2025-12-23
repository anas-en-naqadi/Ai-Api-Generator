import { useState } from 'react';
import type { FunctionInput, FunctionDescription, GeneratedFunction } from '../App';
import './FunctionCreator.css';

interface FunctionCreatorProps {
  onFunctionCreated: (func: GeneratedFunction) => void;
}

export default function FunctionCreator({ onFunctionCreated }: FunctionCreatorProps) {
  const [functionName, setFunctionName] = useState('');
  const [inputs, setInputs] = useState<FunctionInput[]>([
    { name: '', type: 'string', required: true },
  ]);
  const [logic, setLogic] = useState('');
  const [outputType, setOutputType] = useState<'string' | 'number' | 'boolean' | 'object' | 'array'>('string');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addInput = () => {
    setInputs([...inputs, { name: '', type: 'string', required: true }]);
  };

  const removeInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const updateInput = (index: number, field: keyof FunctionInput, value: string | boolean) => {
    const updated = [...inputs];
    updated[index] = { ...updated[index], [field]: value };
    setInputs(updated);
  };

  const validateForm = (): boolean => {
    if (!functionName.trim()) {
      setError('Le nom de la fonction est requis');
      return false;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(functionName)) {
      setError('Le nom doit commencer par une lettre et contenir uniquement lettres, chiffres et underscores');
      return false;
    }

    const validInputs = inputs.filter((input) => input.name.trim() !== '');
    if (validInputs.length === 0 && inputs.length > 0) {
      setError('Au moins un paramètre d\'entrée doit avoir un nom');
      return false;
    }

    const inputNames = validInputs.map((input) => input.name.trim());
    const duplicates = inputNames.filter((name, index) => inputNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      setError(`Les noms de paramètres doivent être uniques. Doublons: ${duplicates.join(', ')}`);
      return false;
    }

    if (!logic.trim()) {
      setError('La description de la logique métier est requise');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const validInputs = inputs
        .filter((input) => input.name.trim() !== '')
        .map((input) => ({
          name: input.name.trim(),
          type: input.type,
          required: input.required,
        }));

      const description: FunctionDescription = {
        name: functionName.trim(),
        inputs: validInputs,
        logic: logic.trim(),
        output: {
          type: outputType,
        },
      };

      const response = await fetch('/api/functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(description),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la fonction');
      }

      setSuccess(`Fonction ${data.functionName} créée avec succès !`);
      
      const newFunction: GeneratedFunction = {
        name: data.functionName,
        route: data.route,
        token: data.token || '',
        createdAt: new Date().toISOString(),
        description,
      };

      onFunctionCreated(newFunction);

      // Reset form
      setFunctionName('');
      setInputs([{ name: '', type: 'string', required: true }]);
      setLogic('');
      setOutputType('string');
      setDocumentation('');
    } catch (err) {
      setDocumentation('');
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="function-creator">
      <div className="card">
        <h2 className="card-title">Créer une nouvelle fonction API</h2>
        <p className="card-description">
          Décrivez votre fonction métier et l'IA générera automatiquement le code et l'API REST.
        </p>

        <form onSubmit={handleSubmit} className="function-form">
          {/* Nom de la fonction */}
          <div className="form-group">
            <label htmlFor="functionName" className="form-label">
              Nom de la fonction <span className="required">*</span>
            </label>
            <input
              id="functionName"
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              placeholder="ex: calculateDiscount"
              className="form-input"
              required
              disabled={isLoading}
              pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
            />
            <small className="form-hint">
              Commence par une lettre, lettres, chiffres et underscores uniquement
            </small>
          </div>

          {/* Inputs */}
          <div className="form-group">
            <div className="form-group-header">
              <label className="form-label">
                Paramètres d'entrée
              </label>
              <button
                type="button"
                onClick={addInput}
                className="button-secondary button-sm"
                disabled={isLoading}
              >
                + Ajouter
              </button>
            </div>

            <div className="inputs-list">
              {inputs.map((input, index) => (
                <div key={index} className="input-item">
                  <input
                    type="text"
                    value={input.name}
                    onChange={(e) => updateInput(index, 'name', e.target.value)}
                    placeholder="Nom du paramètre"
                    className="form-input form-input-sm"
                    disabled={isLoading}
                  />
                  <select
                    value={input.type}
                    onChange={(e) => updateInput(index, 'type', e.target.value as FunctionInput['type'])}
                    className="form-select form-select-sm"
                    disabled={isLoading}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                    <option value="array">Array</option>
                  </select>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={input.required}
                      onChange={(e) => updateInput(index, 'required', e.target.checked)}
                      disabled={isLoading}
                    />
                    Requis
                  </label>
                  {inputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInput(index)}
                      className="button-remove"
                      disabled={isLoading}
                      aria-label="Supprimer ce paramètre"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logique métier */}
          <div className="form-group">
            <label htmlFor="logic" className="form-label">
              Logique métier <span className="required">*</span>
            </label>
            <textarea
              id="logic"
              value={logic}
              onChange={(e) => setLogic(e.target.value)}
              placeholder="Décrivez ce que doit faire la fonction. Ex: Appliquer un pourcentage de réduction sur le prix et retourner le prix final."
              className="form-textarea"
              rows={4}
              required
              disabled={isLoading}
            />
            <small className="form-hint">
              Décrivez clairement la logique que la fonction doit implémenter
            </small>
          </div>

          {/* Output */}
          <div className="form-group">
            <label htmlFor="outputType" className="form-label">
              Type de sortie <span className="required">*</span>
            </label>
            <select
              id="outputType"
              value={outputType}
              onChange={(e) => setOutputType(e.target.value as FunctionDescription['output']['type'])}
              className="form-select"
              required
              disabled={isLoading}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>
          </div>

          {/* Messages */}
          {error && (
            <div className="alert alert-error" role="alert">
              <strong>Erreur :</strong> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <strong>Succès :</strong> {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="button-primary button-large"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Génération en cours...
              </>
            ) : (
              '🚀 Générer l\'API'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
