import { useState, useEffect } from 'react';
import FunctionCreator from './components/FunctionCreator';
import FunctionList from './components/FunctionList';
import ApiTester from './components/ApiTester';
import DocumentationPage from './components/DocumentationPage';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import './App.css';

export interface FunctionInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

export interface FunctionDescription {
  name: string;
  inputs: FunctionInput[];
  logic: string;
  output: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
  };
  documentation?: string;
}

export interface GeneratedFunction {
  name: string;
  route: string;
  token: string;
  createdAt: string;
  description: FunctionDescription;
}

function App() {
  const [selectedFunction, setSelectedFunction] = useState<GeneratedFunction | null>(null);
  const [functions, setFunctions] = useState<GeneratedFunction[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'test' | 'docs'>('create');
  const [docsFunction, setDocsFunction] = useState<GeneratedFunction | null>(null);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleFunctionCreated = async (newFunction: GeneratedFunction) => {
    // Ajouter à la liste locale
    setFunctions((prev) => [newFunction, ...prev]);

    try {
      // 🔄 Recharger depuis le backend pour avoir les vraies données
      const response = await fetch('/api/functions');
      if (response.ok) {
        const data = await response.json();
        const refreshedFunction = data.functions.find(
          (f: GeneratedFunction) => f.name === newFunction.name
        );

        if (refreshedFunction) {
          setSelectedFunction(refreshedFunction); // ✅ Vraies données avec bon token
          setFunctions(data.functions); // Sync complète
        } else {
          setSelectedFunction(newFunction); // Fallback
        }
      }
    } catch (err) {
      console.error('Erreur lors du rechargement:', err);
      setSelectedFunction(newFunction); // Fallback
    }

    setActiveTab('test');
  };

  const handleFunctionSelected = (func: GeneratedFunction) => {
    setSelectedFunction(func);
    setActiveTab('test');
  };

  const handleFunctionsLoaded = (loadedFunctions: GeneratedFunction[]) => {
    setFunctions(loadedFunctions);
    // Si une fonction était sélectionnée, mettre à jour ses données
    if (selectedFunction) {
      const updated = loadedFunctions.find((f) => f.name === selectedFunction.name);
      if (updated) {
        setSelectedFunction(updated);
      } else {
        // Si la fonction sélectionnée a été supprimée, désélectionner
        setSelectedFunction(null);
        setActiveTab('list');
      }
    }
    // Si une fonction de documentation était affichée, mettre à jour ses données
    if (docsFunction) {
      const updated = loadedFunctions.find((f) => f.name === docsFunction.name);
      if (updated) {
        setDocsFunction(updated);
      } else {
        // Si la fonction de documentation a été supprimée, retourner à la liste
        setDocsFunction(null);
        setActiveTab('list');
      }
    }
  };

  const handleFunctionDeleted = (functionName: string) => {
    if (selectedFunction?.name === functionName) {
      setSelectedFunction(null);
      setActiveTab('list');
    }
  };

  // Charger les fonctions au démarrage pour mettre à jour le compteur
  useEffect(() => {
    const loadInitialFunctions = async () => {
      try {
        const response = await fetch('/api/functions');
        if (!response.ok) {
          console.warn('Erreur HTTP lors du chargement des fonctions:', response.status);
          return;
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
          console.warn('Réponse vide du serveur');
          return;
        }

        const data = JSON.parse(text);
        if (data.functions) {
          setFunctions(data.functions);
        }
      } catch (err) {
        console.error('Erreur lors du chargement initial des fonctions:', err);
        // Ne pas bloquer l'application si le chargement échoue
      }
    };
    loadInitialFunctions();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">🚀 API Generator</h1>
          <p className="app-subtitle">
            Générez automatiquement des APIs REST à partir de descriptions fonctionnelles
          </p>
        </div>
      </header>

      <nav className="app-nav">
        <div className="container">
          <button
            className={`nav-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            aria-label="Créer une fonction"
          >
            Créer
          </button>
          <button
            className={`nav-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
            aria-label="Liste des fonctions"
          >
            Fonctions ({functions.length})
          </button>
          {selectedFunction && (
            <button
              className={`nav-button ${activeTab === 'test' ? 'active' : ''}`}
              onClick={() => setActiveTab('test')}
              aria-label="Tester l'API"
            >
              Tester: {selectedFunction.name}
            </button>
          )}
          {docsFunction && (
            <button
              className={`nav-button ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
              aria-label="Documentation"
            >
              📚 Docs: {docsFunction.name}
            </button>
          )}
        </div>
      </nav>

      <main className="app-main">
        <div className="container">
          {activeTab === 'create' && (
            <FunctionCreator onFunctionCreated={handleFunctionCreated} />
          )}
          {activeTab === 'list' && (
            <FunctionList
              functions={functions}
              onFunctionSelect={handleFunctionSelected}
              onFunctionsLoaded={handleFunctionsLoaded}
              isVisible={activeTab === 'list'}
              onFunctionDeleted={handleFunctionDeleted}
              onViewDocumentation={(func) => {
                setDocsFunction(func);
                setActiveTab('docs');
              }}
              showSuccess={showSuccess}
              showError={showError}
            />
          )}
          {activeTab === 'test' && selectedFunction && (
            <ApiTester function={selectedFunction} />
          )}
          {activeTab === 'docs' && docsFunction && (
            <DocumentationPage
              function={docsFunction}
              onBack={() => {
                setActiveTab('list');
                setDocsFunction(null);
              }}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>API Generator - POC Technique</p>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
