import { useState, useEffect, useRef } from 'react';
import type { GeneratedFunction } from '../App';
import Prism from 'prismjs';
import './DocumentationPage.css';

// Import Prism components (side effects)
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';

interface DocumentationPageProps {
  function: GeneratedFunction;
  onBack: () => void;
}

/**
 * Rend du Markdown en HTML avec support complet
 */
function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLanguage = '';
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Fin du bloc de code
        const lang = codeBlockLanguage || 'text';
        const code = codeBlockContent.join('\n');
        // Mapper les langages
        const prismLang = lang === 'bash' ? 'bash' : 
                         lang === 'javascript' || lang === 'js' ? 'javascript' :
                         lang === 'python' || lang === 'py' ? 'python' :
                         lang === 'json' ? 'json' : 'text';
        // Utiliser Prism pour le highlighting (si disponible)
        if (Prism && Prism.highlight) {
          try {
            const highlighted = Prism.highlight(code, Prism.languages[prismLang] || Prism.languages.text, prismLang);
            result.push(`<pre class="code-block" data-lang="${lang}"><code class="language-${prismLang}">${highlighted}</code></pre>`);
          } catch (err) {
            // Fallback si Prism échoue
            result.push(`<pre class="code-block" data-lang="${lang}"><code class="language-${prismLang}">${escapeHtml(code)}</code></pre>`);
          }
        } else {
          // Fallback sans Prism
          result.push(`<pre class="code-block" data-lang="${lang}"><code class="language-${prismLang}">${escapeHtml(code)}</code></pre>`);
        }
        codeBlockContent = [];
        codeBlockLanguage = '';
        inCodeBlock = false;
      } else {
        // Début du bloc de code
        codeBlockLanguage = line.substring(3).trim();
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Tableaux
    if (line.includes('|') && line.trim().startsWith('|')) {
      // Vérifier si c'est une ligne de séparation
      // Une ligne de séparation a toutes ses cellules contenant uniquement des tirets, espaces ou colons
      const testCells = line.split('|').map(c => c.trim()).filter(c => c);
      const isSeparatorRow = testCells.length > 0 && testCells.every(cell => /^[\s\-:]+$/.test(cell));
      
      if (isSeparatorRow) {
        // C'est une ligne de séparation, on l'ignore mais on continue le tableau
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        // Ne pas ajouter la ligne de séparation
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      // Fin du tableau
      result.push(renderTable(tableRows));
      tableRows = [];
      inTable = false;
    }
    
    // Titres avec coloration pour succès/erreur
    if (line.startsWith('### ')) {
      const title = line.substring(4);
      const className = title.includes('Succès') || title.includes('200') 
        ? 'doc-success-title' 
        : title.includes('Erreur') || title.includes('400') || title.includes('500')
        ? 'doc-error-title'
        : '';
      result.push(`<h3${className ? ` class="${className}"` : ''}>${escapeHtml(title)}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      const title = line.substring(3);
      const className = title.includes('Succès') || title.includes('200')
        ? 'doc-success-title'
        : title.includes('Erreur') || title.includes('400') || title.includes('500')
        ? 'doc-error-title'
        : '';
      result.push(`<h2${className ? ` class="${className}"` : ''}>${escapeHtml(title)}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      result.push(`<h1>${escapeHtml(line.substring(2))}</h1>`);
      continue;
    }
    
    // Ligne vide
    if (line.trim() === '') {
      result.push('<br>');
      continue;
    }
    
    // Bold, italic, inline code, liens
    let html = escapeHtml(line)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    result.push(`<p>${html}</p>`);
  }
  
  // Fermer le tableau si on est encore dedans
  if (inTable && tableRows.length > 0) {
    result.push(renderTable(tableRows));
  }
  
  return result.join('');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTable(rows: string[]): string {
  if (rows.length === 0) return '';
  
  let html = '<table class="doc-table"><tbody>';
  let isHeader = true;
  
  for (const row of rows) {
    // Split the row into cells (remove empty first/last from | at start/end)
    const rawCells = row.split('|');
    const cells = rawCells
      .map(c => c.trim())
      .filter(c => c.length > 0); // Filter out empty strings
    
    // Skip empty rows
    if (cells.length === 0) continue;
    
    // Vérifier si c'est une ligne de séparation: toutes les cellules contiennent UNIQUEMENT des tirets, espaces ou colons
    // Exemple: |-----|------|--------|-------------| devient ['-----', '------', '--------', '-------------']
    // Chaque cellule doit matcher: uniquement des tirets (-), espaces, ou colons (:), pas de lettres/chiffres
    const isSeparator = cells.length > 0 && cells.every(cell => {
      // Vérifier que la cellule ne contient QUE des tirets, espaces ou colons
      // et qu'elle a au moins un caractère (pour éviter les cellules vides)
      const onlySeparatorChars = /^[\s\-:]+$/.test(cell);
      const hasContent = cell.length > 0;
      // Une cellule de séparation ne doit contenir AUCUNE lettre ou chiffre
      const noLettersOrNumbers = !/[a-zA-Z0-9]/.test(cell);
      return onlySeparatorChars && hasContent && noLettersOrNumbers;
    });
    
    if (isSeparator) {
      // Après la ligne de séparation, les lignes suivantes sont des données
      if (isHeader) {
        isHeader = false;
      }
      continue; // Skip separator row completely - DO NOT RENDER IT
    }
    
    html += '<tr>';
    
    cells.forEach((cell) => {
      const tag = isHeader ? 'th' : 'td';
      const content = cell
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      html += `<${tag}>${content}</${tag}>`;
    });
    
    html += '</tr>';
    if (isHeader) {
      isHeader = false;
    }
  }
  
  html += '</tbody></table>';
  return html;
}

export default function DocumentationPage({ function: func, onBack }: DocumentationPageProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Re-highlight code blocks after render
  useEffect(() => {
    if (!Prism || !Prism.highlightAll || !func?.description?.documentation) return;
    
    // Use setTimeout to ensure DOM is updated
    const timer = setTimeout(() => {
      try {
        if (contentRef.current) {
          const codeBlocks = contentRef.current.querySelectorAll('pre code[class*="language-"]');
          codeBlocks.forEach((block) => {
            if (block instanceof HTMLElement && !block.classList.contains('prism-highlighted')) {
              try {
                Prism.highlightElement(block);
                block.classList.add('prism-highlighted');
              } catch (err) {
                // Silently fail - code will still display
              }
            }
          });
        } else if (Prism.highlightAll) {
          Prism.highlightAll();
        }
      } catch (err) {
        // Silently fail - page should still render
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [func?.description?.documentation]);

  // Safety check
  if (!func) {
    return (
      <div className="documentation-page">
        <div className="documentation-empty">
          <p>Fonction non trouvée</p>
          <button className="button-primary" onClick={onBack}>Retour</button>
        </div>
      </div>
    );
  }

  if (!func.description.documentation) {
    return (
      <div className="documentation-page">
        <div className="documentation-header">
          <button className="back-button" onClick={onBack}>
            ← Retour
          </button>
          <h1>Documentation - {func.name}</h1>
        </div>
        <div className="documentation-empty">
          <p>Cette fonction n'a pas de documentation.</p>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      // Copier uniquement l'URL de l'API
      const apiUrl = func.route || `/api/${func.name}`;
      const origin = typeof globalThis !== 'undefined' && globalThis.window ? globalThis.window.location.origin : 'http://localhost:3000';
      const fullUrl = origin + apiUrl;
      await navigator.clipboard.writeText(fullUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  return (
    <div className="documentation-page">
      <div className="documentation-header">
        <div className="documentation-header-left">
          <button className="back-button" onClick={onBack}>
            ← Retour
          </button>
          <div>
            <h1>📚 Documentation API</h1>
            <p className="documentation-subtitle">{func.name}</p>
          </div>
        </div>
        <div className="documentation-header-actions">
          <div className="endpoint-info-header">
            <span className="method-badge">POST</span>
            <code className="endpoint-url">{func.route}</code>
          </div>
          <button
            className="button-secondary button-sm"
            onClick={handleCopy}
            title="Copier l'URL de l'API"
          >
            {copySuccess ? '✓ URL copiée!' : '📋 Copier URL'}
          </button>
        </div>
      </div>

      {func.token && (
        <section className="doc-auth-section">
          <h2 className="doc-section-title">Authentification & usage externe</h2>
          <p className="doc-auth-intro">
            Cette API est protégée par un token. Pour l&apos;utiliser depuis une application externe
            (Postman, curl, front-end, backend, etc.), ajoutez ce token dans l&apos;en-tête&nbsp;
            <code>Authorization: Bearer &lt;VOTRE_TOKEN&gt;</code>.
          </p>
          <div className="doc-auth-grid">
            <div className="doc-token-card">
              <div className="doc-token-header">
                <span className="doc-token-label">Token API</span>
                <button
                  className="button-secondary button-sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(func.token!);
                    } catch (err) {
                      console.error('Erreur lors de la copie du token:', err);
                    }
                  }}
                  title="Copier le token"
                >
                  📋 Copier le token
                </button>
              </div>
              <code className="doc-token-value">{func.token}</code>
            </div>
            <div className="doc-example-card">
              <span className="doc-token-label">Exemple de requête</span>
              <pre className="doc-example-code">
{`curl \\
  --request POST \\
  --header "Content-Type: application/json" \\
  --header "Authorization: Bearer VOTRE_TOKEN" \\
  --data '{ "example": "payload" }' \\
  "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${func.route}"`}
              </pre>
            </div>
          </div>
        </section>
      )}

      <div className="documentation-content-wrapper">
        <div 
          ref={contentRef}
          className="documentation-content-full"
          dangerouslySetInnerHTML={{
            __html: (() => {
              try {
                return renderMarkdown(func.description.documentation || '');
              } catch (err) {
                console.error('Error rendering markdown:', err);
                return `<p>Erreur lors du rendu de la documentation: ${err instanceof Error ? err.message : 'Erreur inconnue'}</p>`;
              }
            })()
          }}
        />
      </div>
    </div>
  );
}



