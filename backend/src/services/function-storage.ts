/**
 * Service de stockage des fonctions générées dans un fichier JSON
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { GeneratedFunction, StoredFunctions } from '../types/function';
import { generateApiToken } from '../utils/token-generator';

const STORAGE_DIR = join(process.cwd(), 'storage');
const STORAGE_FILE = join(STORAGE_DIR, 'functions.json');

/**
 * Initialise le répertoire de stockage s'il n'existe pas
 */
function ensureStorageExists(): void {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!existsSync(STORAGE_FILE)) {
    writeFileSync(STORAGE_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

/**
 * Charge toutes les fonctions depuis le fichier JSON
 * Migre automatiquement les anciennes fonctions sans token
 */
export function loadFunctions(): StoredFunctions {
  ensureStorageExists();
  
  try {
    const content = readFileSync(STORAGE_FILE, 'utf-8');
    const functions = JSON.parse(content) as StoredFunctions;
    
    // Migration: générer des tokens pour les fonctions qui n'en ont pas
    let needsSave = false;
    for (const [name, func] of Object.entries(functions)) {
      if (!func.token) {
        func.token = generateApiToken();
        needsSave = true;
        console.log(`Token généré pour la fonction ${name}`);
      }
    }
    
    // Sauvegarder si des migrations ont été effectuées
    if (needsSave) {
      writeFileSync(STORAGE_FILE, JSON.stringify(functions, null, 2), 'utf-8');
    }
    
    return functions;
  } catch (error) {
    console.error('Erreur lors du chargement des fonctions:', error);
    return {};
  }
}

/**
 * Sauvegarde une fonction dans le fichier JSON
 */
export function saveFunction(functionData: GeneratedFunction): void {
  ensureStorageExists();
  
  const functions = loadFunctions();
  functions[functionData.name] = functionData;
  
  writeFileSync(STORAGE_FILE, JSON.stringify(functions, null, 2), 'utf-8');
}

/**
 * Récupère une fonction par son nom
 */
export function getFunction(functionName: string): GeneratedFunction | null {
  const functions = loadFunctions();
  return functions[functionName] || null;
}

/**
 * Vérifie si une fonction existe
 */
export function functionExists(functionName: string): boolean {
  const functions = loadFunctions();
  return functionName in functions;
}

/**
 * Liste toutes les fonctions
 */
export function listFunctions(): GeneratedFunction[] {
  const functions = loadFunctions();
  return Object.values(functions);
}

/**
 * Supprime une fonction
 */
export function deleteFunction(functionName: string): void {
  ensureStorageExists();
  
  const functions = loadFunctions();
  if (!(functionName in functions)) {
    throw new Error(`La fonction ${functionName} n'existe pas`);
  }
  
  delete functions[functionName];
  writeFileSync(STORAGE_FILE, JSON.stringify(functions, null, 2), 'utf-8');
}
