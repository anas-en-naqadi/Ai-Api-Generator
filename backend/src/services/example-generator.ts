/**
 * Service de génération d'exemples intelligents pour les fonctions API
 */
import Groq from 'groq-sdk';
import type { FunctionDescription } from '../types/function';

/**
 * Initialise le client Groq de manière lazy
 */
function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY est requis dans les variables d\'environnement');
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

/**
 * Génère un exemple de payload intelligent basé sur la logique de la fonction
 */
export async function generateExample(
  functionName: string,
  logic: string,
  inputs: FunctionDescription['inputs']
): Promise<Record<string, any>> {
  const prompt = buildExamplePrompt(functionName, logic, inputs);
  
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en génération d'exemples de données pour APIs. 
Génère UNIQUEMENT un objet JSON valide représentant un exemple de payload pour tester une fonction API.
L'exemple doit être réaliste et correspondre à la logique de la fonction.
Réponds UNIQUEMENT avec le JSON, sans explications, sans markdown, sans code blocks.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7, // Un peu plus créatif pour des exemples variés
      max_tokens: 1000,
    });

    const generatedText = completion.choices[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('Aucun exemple généré par l\'IA');
    }

    // Nettoyer et parser le JSON
    const cleaned = cleanGeneratedExample(generatedText);
    const example = JSON.parse(cleaned);
    
    return example;
  } catch (error) {
    console.error('Erreur lors de la génération d\'exemple:', error);
    // Retourner un exemple par défaut en cas d'erreur
    return generateFallbackExample(inputs);
  }
}

/**
 * Construit le prompt pour générer un exemple
 */
function buildExamplePrompt(
  functionName: string,
  logic: string,
  inputs: FunctionDescription['inputs']
): string {
  const inputsDescription = inputs
    .map((input) => {
      const required = input.required !== false ? 'requis' : 'optionnel';
      return `- ${input.name}: ${input.type} (${required})${input.description ? ` - ${input.description}` : ''}`;
    })
    .join('\n');

  return `Génère un exemple de payload JSON pour tester cette fonction API :

Nom de la fonction : ${functionName}

Logique : ${logic}

Paramètres attendus :
${inputsDescription}

IMPORTANT : Génère un objet JSON avec des valeurs réalistes et pertinentes pour tester cette fonction.
- Pour les nombres : utilise des valeurs cohérentes avec la logique (ex: si c'est un mois, utilise 1-12; si c'est un prix, utilise 10-1000)
- Pour les chaînes de caractères : utilise des valeurs significatives et réalistes, PAS juste "1" ou "exemple". Analyse la logique pour comprendre quel type de chaîne est attendu
- Pour les booléens : utilise true ou false selon le contexte
- Pour les tableaux : utilise 2-3 éléments avec des valeurs réalistes
- Pour les objets : utilise 2-3 propriétés avec des valeurs réalistes

Les valeurs doivent être cohérentes avec la logique de la fonction. Si la fonction traite des saisons, utilise des mois (1-12). Si elle traite des noms, utilise des prénoms réalistes. Si elle traite des emails, utilise des formats d'email valides.

Réponds UNIQUEMENT avec le JSON, sans explications, sans markdown, sans code blocks.`;
}

/**
 * Nettoie le texte généré pour extraire le JSON
 */
function cleanGeneratedExample(text: string): string {
  // Enlever les markdown code blocks
  let cleaned = text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
  
  // Chercher le premier { et dernier }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

/**
 * Génère un exemple par défaut si l'IA échoue
 */
function generateFallbackExample(inputs: FunctionDescription['inputs']): Record<string, any> {
  const example: Record<string, any> = {};
  
  inputs.forEach((input) => {
    switch (input.type) {
      case 'number':
        example[input.name] = 100;
        break;
      case 'boolean':
        example[input.name] = true;
        break;
      case 'array':
        example[input.name] = [1, 2, 3];
        break;
      case 'object':
        example[input.name] = { key: 'value' };
        break;
      default:
        example[input.name] = 'exemple';
    }
  });
  
  return example;
}



