/**
 * Service de génération de code TypeScript via Groq AI
 */
import Groq from 'groq-sdk';
import type { FunctionDescription } from '../types/function';

/**
 * Initialise le client Groq de manière lazy pour éviter les erreurs au chargement du module
 */
function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY est requis dans les variables d\'environnement. Vérifiez votre fichier .env');
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

/**
 * Génère une fonction TypeScript pure à partir d'une description
 */
export async function generateFunction(description: FunctionDescription): Promise<string> {
  const prompt = buildPrompt(description);

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en TypeScript. Tu génères UNIQUEMENT des fonctions TypeScript pures, sans code HTTP, sans Fastify, sans imports externes.
La fonction doit être déclarée avec "export function" et prête à être exécutée.
Pas de console.log, pas de gestion HTTP, juste la logique métier pure.
Utilise uniquement les fonctions JavaScript natives (Math, Number, String, Array, Object, Date, JSON, RegExp).
IMPORTANT : N'utilise PAS Infinity ou NaN directement. Utilise Number.POSITIVE_INFINITY et Number.NaN à la place.
INTERDICTIONS STRICTES :
- Pas de require(), import, ou accès à des modules
- Pas d'accès à process, fs, ou autres APIs Node.js
- Pas d'utilisation de eval(), Function(), ou code dynamique dangereux
- Pas d'accès à global, globalThis, __dirname, __filename
- Pas d'utilisation directe de Infinity ou NaN (utilise Number.POSITIVE_INFINITY et Number.NaN)
Le code doit être auto-suffisant et ne pas dépendre de modules externes.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile', // Modèle optimisé pour le code
      temperature: 0.3, // Plus déterministe pour le code
      max_tokens: 16000,
    });

    const generatedCode = completion.choices[0]?.message?.content;

    if (!generatedCode) {
      throw new Error('Aucun code généré par l\'IA');
    }

    // Nettoyer le code (enlever les markdown code blocks si présents)
    return cleanGeneratedCode(generatedCode);
  } catch (error) {
    console.error('Erreur lors de la génération de code:', error);
    throw new Error(`Erreur lors de la génération de code: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Construit le prompt pour l'IA
 */
function buildPrompt(description: FunctionDescription): string {
  const inputsDescription = description.inputs
    .map((input) => {
      const required = input.required !== false ? 'requis' : 'optionnel';
      return `- ${input.name}: ${input.type} (${required})${input.description ? ` - ${input.description}` : ''}`;
    })
    .join('\n');

  return `Génère une fonction TypeScript pure avec ces spécifications :

Nom de la fonction : ${description.name}

Entrées :
${inputsDescription || 'Aucune entrée'}

Logique métier : ${description.logic}

Type de sortie : ${description.output.type}${description.output.description ? ` - ${description.output.description}` : ''}

Génère UNIQUEMENT la fonction TypeScript, sans wrapper, sans HTTP, sans Fastify.
La fonction doit être exportée et avoir cette signature :
export function ${description.name}(...): ${description.output.type}

Exemple de format attendu :
export function ${description.name}(${description.inputs.map(i => `${i.name}: ${i.type}`).join(', ')}): ${description.output.type} {
  // Logique métier ici
}`;
}

/**
 * Nettoie le code généré (enlève les markdown code blocks et normalise)
 */
function cleanGeneratedCode(code: string): string {
  // Enlever les markdown code blocks (tous formats)
  let cleaned = code
    .replace(/```typescript\n?/gi, '')
    .replace(/```ts\n?/gi, '')
    .replace(/```javascript\n?/gi, '')
    .replace(/```js\n?/gi, '')
    .replace(/```\n?/g, '');

  // Enlever les espaces en début/fin
  cleaned = cleaned.trim();

  // S'assurer qu'on a bien une fonction exportée
  if (!cleaned.includes('export function') && !cleaned.includes('function')) {
    throw new Error('Le code généré ne contient pas de fonction valide');
  }

  return cleaned;
}
