/**
 * Service de génération automatique de documentation pour les fonctions API
 */
import type { FunctionDescription } from '../types/function';

/**
 * Génère une documentation automatique pour une fonction API
 */
export function generateDocumentation(
  functionName: string,
  description: FunctionDescription,
  baseUrl: string = 'http://localhost:3000',
  token?: string
): string {
  const endpoint = `${baseUrl}/api/${functionName}`;
  const inputs = description.inputs || [];
  const hasInputs = inputs.length > 0;
  
  let doc = `# ${functionName}\n\n`;
  
  // Description de la fonction
  doc += `## Description\n\n`;
  doc += `${description.logic}\n\n`;
  
  // Endpoint
  doc += `## Endpoint\n\n`;
  doc += `\`POST ${endpoint}\`\n\n`;
  
  // Paramètres
  if (hasInputs) {
    doc += `## Paramètres\n\n`;
    doc += `| Nom | Type | Requis | Description |\n`;
    doc += `|-----|------|--------|-------------|\n`;
    
    inputs.forEach((input) => {
      const required = input.required !== false ? 'Oui' : 'Non';
      const desc = input.description || (input.type === 'array' ? 'Tableau de valeurs' : 
                                         input.type === 'object' ? 'Objet JSON' : 
                                         input.type === 'number' ? 'Nombre' :
                                         input.type === 'boolean' ? 'Booléen' : 'Chaîne de caractères');
      doc += `| \`${input.name}\` | \`${input.type}\` | ${required} | ${desc} |\n`;
    });
    doc += `\n`;
  } else {
    doc += `## Paramètres\n\n`;
    doc += `Cette fonction ne nécessite aucun paramètre.\n\n`;
  }
  
  // Exemple de requête
  doc += `## Exemple de requête\n\n`;
  if (token) {
    doc += `**Note:** Cette API nécessite un token d'authentification. Utilisez le header \`Authorization: Bearer <token>\`.\n\n`;
  }
  doc += `\`\`\`bash\n`;
  doc += `curl -X POST ${endpoint} \\\n`;
  doc += `  -H "Content-Type: application/json" \\\n`;
  if (token) {
    doc += `  -H "Authorization: Bearer ${token}" \\\n`;
  }
  
  if (hasInputs) {
    const examplePayload: Record<string, any> = {};
    inputs.forEach((input) => {
      switch (input.type) {
        case 'number':
          examplePayload[input.name] = 100;
          break;
        case 'boolean':
          examplePayload[input.name] = true;
          break;
        case 'array':
          examplePayload[input.name] = [1, 2, 3];
          break;
        case 'object':
          examplePayload[input.name] = { key: 'value' };
          break;
        default:
          examplePayload[input.name] = 'exemple';
      }
    });
    doc += `  -d '${JSON.stringify(examplePayload, null, 2)}'\n`;
  } else {
    doc += `  -d '{}'\n`;
  }
  doc += `\`\`\`\n\n`;
  
  // Exemple JavaScript
  doc += `### JavaScript (Fetch)\n\n`;
  doc += `\`\`\`javascript\n`;
  if (hasInputs) {
    const examplePayload: Record<string, any> = {};
    inputs.forEach((input) => {
      switch (input.type) {
        case 'number':
          examplePayload[input.name] = 100;
          break;
        case 'boolean':
          examplePayload[input.name] = true;
          break;
        case 'array':
          examplePayload[input.name] = [1, 2, 3];
          break;
        case 'object':
          examplePayload[input.name] = { key: 'value' };
          break;
        default:
          examplePayload[input.name] = 'exemple';
      }
    });
    doc += `const payload = ${JSON.stringify(examplePayload, null, 2)};\n\n`;
  } else {
    doc += `const payload = {};\n\n`;
  }
  if (token) {
    doc += `const token = '${token}';\n\n`;
  }
  doc += `const response = await fetch('${endpoint}', {\n`;
  doc += `  method: 'POST',\n`;
  doc += `  headers: {\n`;
  doc += `    'Content-Type': 'application/json',\n`;
  if (token) {
    doc += `    'Authorization': \`Bearer \${token}\`,\n`;
  }
  doc += `  },\n`;
  doc += `  body: JSON.stringify(payload),\n`;
  doc += `});\n\n`;
  doc += `const data = await response.json();\n`;
  doc += `console.log(data);\n`;
  doc += `\`\`\`\n\n`;
  
  // Exemple Python
  doc += `### Python (requests)\n\n`;
  doc += `\`\`\`python\n`;
  doc += `import requests\n\n`;
  if (hasInputs) {
    const examplePayload: Record<string, any> = {};
    inputs.forEach((input) => {
      switch (input.type) {
        case 'number':
          examplePayload[input.name] = 100;
          break;
        case 'boolean':
          examplePayload[input.name] = True;
          break;
        case 'array':
          examplePayload[input.name] = [1, 2, 3];
          break;
        case 'object':
          examplePayload[input.name] = {"key": "value"};
          break;
        default:
          examplePayload[input.name] = "exemple";
      }
    });
    doc += `payload = ${JSON.stringify(examplePayload, null, 2).replace(/true/g, 'True').replace(/false/g, 'False')}\n\n`;
  } else {
    doc += `payload = {}\n\n`;
  }
  if (token) {
    doc += `token = '${token}'\n\n`;
    doc += `headers = {\n`;
    doc += `    'Content-Type': 'application/json',\n`;
    doc += `    'Authorization': f'Bearer {token}'\n`;
    doc += `}\n\n`;
    doc += `response = requests.post('${endpoint}', json=payload, headers=headers)\n`;
  } else {
    doc += `response = requests.post('${endpoint}', json=payload)\n`;
  }
  doc += `data = response.json()\n`;
  doc += `print(data)\n`;
  doc += `\`\`\`\n\n`;
  
  // Réponse
  doc += `## Réponse\n\n`;
  doc += `### Succès (200)\n\n`;
  doc += `\`\`\`json\n`;
  doc += `{\n`;
  doc += `  "success": true,\n`;
  doc += `  "result": ${getExampleOutput(description.output.type)}\n`;
  doc += `}\n`;
  doc += `\`\`\`\n\n`;
  
  doc += `### Erreur (400)\n\n`;
  doc += `\`\`\`json\n`;
  doc += `{\n`;
  doc += `  "success": false,\n`;
  doc += `  "error": "Message d'erreur"\n`;
  doc += `}\n`;
  doc += `\`\`\`\n\n`;
  
  // Type de retour
  doc += `## Type de retour\n\n`;
  doc += `\`${description.output.type}\`\n\n`;
  if (description.output.description) {
    doc += `${description.output.description}\n\n`;
  }
  
  return doc;
}

/**
 * Génère un exemple de sortie selon le type
 */
function getExampleOutput(type: string): string {
  switch (type) {
    case 'number':
      return '42';
    case 'boolean':
      return 'true';
    case 'array':
      return '[1, 2, 3]';
    case 'object':
      return '{"key": "value"}';
    default:
      return '"résultat"';
  }
}



