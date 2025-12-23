import { useState, useMemo } from 'react';
import type { GeneratedFunction, FunctionDescription } from '../App';
import './FunctionEditModal.css';

interface FunctionEditModalProps {
  function: GeneratedFunction;
  onClose: () => void;
  onUpdate: (updatedFunction: GeneratedFunction) => void;
  showSuccess?: (message: string) => void;
  showError?: (message: string) => void;
}

export default function FunctionEditModal({ 
  function: func, 
  onClose, 
  onUpdate,
  showSuccess,
  showError,
}: FunctionEditModalProps) {
  // Store initial form data for comparison
  const initialFormData = useMemo<FunctionDescription>(() => ({
    name: func.description.name,
    inputs: func.description.inputs || [],
    logic: func.description.logic || '',
    output: func.description.output || { type: 'string' },
    documentation: func.description.documentation || '',
  }), [func]);

  const [formData, setFormData] = useState<FunctionDescription>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    return (
      formData.name !== initialFormData.name ||
      formData.logic !== initialFormData.logic ||
      formData.output.type !== initialFormData.output.type ||
      JSON.stringify(formData.inputs) !== JSON.stringify(initialFormData.inputs)
    );
  }, [formData, initialFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/functions/${func.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Recharger les fonctions pour obtenir la version mise à jour
      const listResponse = await fetch('/api/functions');
      const listData = await listResponse.json();
      
      if (listResponse.ok && listData.functions) {
        const updated = listData.functions.find((f: GeneratedFunction) => f.name === formData.name);
        if (updated) {
          onUpdate(updated);
        }
      }

      // Show success toast
      if (showSuccess) {
        showSuccess(`Fonction "${formData.name}" mise à jour avec succès`);
      }

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      
      // Show error toast
      if (showError) {
        showError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addInput = () => {
    setFormData({
      ...formData,
      inputs: [...formData.inputs, { name: '', type: 'string', required: true }],
    });
  };

  const removeInput = (index: number) => {
    setFormData({
      ...formData,
      inputs: formData.inputs.filter((_, i) => i !== index),
    });
  };

  const updateInput = (index: number, field: string, value: string | boolean) => {
    const newInputs = [...formData.inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setFormData({ ...formData, inputs: newInputs });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier la fonction</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          {error && (
            <div className="form-error">
              <strong>Erreur :</strong> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nom de la fonction *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
              title="Doit commencer par une lettre et contenir uniquement lettres, chiffres et underscores"
            />
          </div>

          <div className="form-group">
            <label htmlFor="logic">Logique métier *</label>
            <textarea
              id="logic"
              value={formData.logic}
              onChange={(e) => setFormData({ ...formData, logic: e.target.value })}
              required
              rows={4}
              placeholder="Décrivez ce que la fonction doit faire..."
            />
          </div>

          <div className="form-group">
            <label>Paramètres d'entrée</label>
            {formData.inputs.map((input, index) => (
              <div key={index} className="input-row">
                <input
                  type="text"
                  placeholder="Nom"
                  value={input.name}
                  onChange={(e) => updateInput(index, 'name', e.target.value)}
                  required
                />
                <select
                  value={input.type}
                  onChange={(e) => updateInput(index, 'type', e.target.value)}
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                </select>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={input.required !== false}
                    onChange={(e) => updateInput(index, 'required', e.target.checked)}
                  />
                  Requis
                </label>
                <button
                  type="button"
                  className="button-danger button-sm"
                  onClick={() => removeInput(index)}
                >
                  Supprimer
                </button>
              </div>
            ))}
            <button type="button" className="button-secondary" onClick={addInput}>
              + Ajouter un paramètre
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="output-type">Type de sortie *</label>
            <select
              id="output-type"
              value={formData.output.type}
              onChange={(e) => setFormData({
                ...formData,
                output: { 
                  ...formData.output, 
                  type: e.target.value as 'string' | 'number' | 'boolean' | 'object' | 'array' 
                },
              })}
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="array">array</option>
              <option value="object">object</option>
            </select>
          </div>

          <div className="form-group">
          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose} disabled={isSaving}>
              Annuler
            </button>
            <button 
              type="submit" 
              className="button-primary width-full" 
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}



