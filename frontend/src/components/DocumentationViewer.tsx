import { useState } from 'react';
import type { GeneratedFunction } from '../App';
import './DocumentationViewer.css';

interface DocumentationViewerProps {
  function: GeneratedFunction;
  onClose: () => void;
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
    const nextLine = lines[i + 1];
    
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Fin du bloc de code
        const lang = codeBlockLanguage || 'text';
        result.push(`<pre class="code-block" data-lang="${lang}"><code class="language-${lang}">${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
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
    if (line.includes('|') && line.trim().startsWith('|') && !line.match(/^\|[\s-:]+\|$/)) {
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
  
  let html = '<table class="doc-table">';
  let isHeader = true;
  
  for (const row of rows) {
    if (row.match(/^\|[\s-:]+\|$/)) {
      isHeader = false;
      continue; // Skip separator row
    }
    
    const cells = row.split('|').map(c => c.trim()).filter(c => c);
    html += '<tr>';
    
    cells.forEach((cell, idx) => {
      const tag = isHeader && idx === 0 ? 'th' : 'td';
      const content = cell
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      html += `<${tag}>${content}</${tag}>`;
    });
    
    html += '</tr>';
    isHeader = false;
  }
  
  html += '</table>';
  return html;
}

export default function DocumentationViewer({ function: func, onClose }: DocumentationViewerProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!func.description.documentation) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Documentation - {func.name}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="documentation-empty">
            <p>Cette fonction n'a pas de documentation.</p>
            <button className="button-primary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(func.description.documentation || '');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-documentation" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>📚 Documentation API</h2>
            <p className="modal-subtitle">{func.name}</p>
          </div>
          <div className="modal-header-actions">
            <button
              className="button-secondary button-sm"
              onClick={handleCopy}
              title="Copier la documentation"
            >
              {copySuccess ? '✓ Copié!' : '📋 Copier'}
            </button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="documentation-viewer">
          {func.token && (
            <section className="doc-auth-section">
              <h3 className="doc-section-title">Authentification & usage externe</h3>
              <p className="doc-auth-intro">
                Pour appeler cette API depuis une application externe, utilisez le token avec l&apos;en-tête&nbsp;
                <code>Authorization: Bearer &lt;VOTRE_TOKEN&gt;</code>.
              </p>
              <div className="doc-auth-grid">
                <div className="doc-token-card">
                  <div className="doc-token-header">
                    <span className="doc-token-label">Token API</span>
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

          <div 
            className="documentation-content-full"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(func.description.documentation)
            }}
          />
        </div>

        <div className="modal-footer">
          <div className="endpoint-info-footer">
            <span className="method-badge">POST</span>
            <code className="endpoint-url">{func.route}</code>
          </div>
          <button className="button-primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}



