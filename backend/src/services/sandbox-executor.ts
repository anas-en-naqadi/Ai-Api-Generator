/**
 * Service d'exécution sécurisée des fonctions générées dans un sandbox
 */
import { VM } from 'vm2';

/**
 * Configuration du sandbox - objets autorisés uniquement
 */
const SANDBOX_TIMEOUT = 5000; // 5 secondes max par exécution

/**
 * Exécute une fonction générée de manière sécurisée dans un sandbox isolé
 */
export function executeInSandbox(
  functionName: string,
  functionCode: string,
  inputs: Record<string, unknown>
): unknown {
  try {
    // Nettoyer le code : enlever les exports et les annotations TypeScript
    let cleanedCode = functionCode.trim();

    // Enlever les exports
    cleanedCode = cleanedCode.replaceAll(/(\w+)\s*\?\s*:/g, '$1:');
    cleanedCode = cleanedCode.replaceAll(/^export\s+(function|const|let|var)\s+/gm, '$1 ');
    cleanedCode = cleanedCode.replaceAll(/^export\s*\{/gm, '{');

    // Enlever les annotations de type TypeScript pour convertir en JavaScript pur
    // L'ordre est important : d'abord les types de retour, puis les paramètres

    // 1. Enlever les types de retour : function name(): type { -> function name() {
    cleanedCode = cleanedCode.replaceAll(/\)\s*:\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\],\s|&]*\s*\{/g, ') {');

    // 2. Enlever les types de paramètres dans les fonctions : (param: type, param2: type) -> (param, param2)
    cleanedCode = cleanedCode.replaceAll(/function\s+\w+\s*\(([^)]+)\)/g, (match, params) => {
      const paramNames = params.split(',').map((p: string) => {
        const trimmed = p.trim();
        const colonIndex = trimmed.indexOf(':');
        return colonIndex > 0 ? trimmed.substring(0, colonIndex).trim() : trimmed;
      });
      return match.replace(`(${params})`, `(${paramNames.join(', ')})`);
    });

    // 3. Enlever les types de paramètres dans les fonctions anonymes/arrow : (param: type) => -> (param) =>
    cleanedCode = cleanedCode.replaceAll(/\(([^)]+)\)\s*:/g, (match, params) => {
      const paramNames = params.split(',').map((p: string) => {
        const trimmed = p.trim();
        const colonIndex = trimmed.indexOf(':');
        return colonIndex > 0 ? trimmed.substring(0, colonIndex).trim() : trimmed;
      });
      return `(${paramNames.join(', ')})`;
    });

    // 4. Enlever les annotations de type sur les variables : const x: type = -> const x =
    cleanedCode = cleanedCode.replaceAll(/(const|let|var)\s+(\w+)\s*:\s*[^=]+=/g, '$1 $2 =');

    // Créer le code wrapper pour exécuter la fonction
    const inputNames = Object.keys(inputs);

    // Construire le code d'exécution avec des constantes locales pour Infinity et NaN
    const executionCode = `
      (function() {
        // Définir Infinity et NaN localement pour éviter les problèmes de proxy
        const Infinity = Number.POSITIVE_INFINITY;
        const NaN = Number.NaN;

        ${cleanedCode}

        // Vérifier que la fonction existe
        if (typeof ${functionName} !== 'function') {
          throw new Error('Fonction ${functionName} non trouvée dans le code généré');
        }

        // Exécuter la fonction avec les arguments du sandbox
        return ${functionName}(${inputNames.map((name) => `args.${name}`).join(', ')});
      })()
    `;

    // Créer le sandbox avec accès limité aux objets JavaScript natifs
    // Les arguments sont passés via le sandbox pour éviter l'injection de code
    const vm = new VM({
      timeout: SANDBOX_TIMEOUT,
      sandbox: {
        // Arguments de la fonction (passés de manière sécurisée)
        args: inputs,
        // Objets JavaScript natifs autorisés
        Math,
        Number,
        String,
        Boolean,
        Array,
        Object,
        Date,
        JSON,
        RegExp,
        Error,
        TypeError,
        RangeError,
        ReferenceError,
        SyntaxError,
        // Méthodes utiles (pas de constantes globales Infinity/NaN pour éviter les problèmes de proxy)
        parseInt: Number.parseInt,
        parseFloat: Number.parseFloat,
        isNaN: Number.isNaN,
        isFinite: Number.isFinite,
        encodeURIComponent,
        decodeURIComponent,
      },
    });

    // Exécuter le code dans le sandbox
    const result = vm.run(executionCode);

    return result;
  } catch (error) {
    // Gérer les erreurs spécifiques de vm2
    if (error instanceof Error) {
      if (error.message.includes('Script execution timed out')) {
        throw new Error(`L'exécution de ${functionName} a dépassé le temps limite de ${SANDBOX_TIMEOUT}ms`);
      }
      if (error.message.includes('is not defined')) {
        throw new Error(`Accès non autorisé dans ${functionName}: ${error.message}`);
      }
      throw new Error(`Erreur d'exécution dans ${functionName}: ${error.message}`);
    }
    throw new Error(`Erreur inconnue lors de l'exécution de ${functionName}`);
  }
}

/**
 * Valide que le code ne contient pas de patterns dangereux
 */
export function validateCodeSafety(code: string): { safe: boolean; reason?: string } {
  const dangerousPatterns = [
    /require\s*\(/gi,
    /import\s+/gi,
    /process\./gi,
    /fs\./gi,
    /child_process/gi,
    /exec\s*\(/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /__dirname/gi,
    /__filename/gi,
    /global\./gi,
    /globalThis\./gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        safe: false,
        reason: `Pattern dangereux détecté: ${pattern.source}`,
      };
    }
  }

  return { safe: true };
}
