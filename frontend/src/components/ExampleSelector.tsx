import { useState } from 'react';
import type { FunctionDescription } from '../App';
import './ExampleSelector.css';

interface ExampleSelectorProps {
  onExampleSelect: (example: FunctionDescription) => void;
}

interface Example {
  name: string;
  description: string;
  category: string;
  level: number;
  data: FunctionDescription;
}

const examples: Example[] = [
  {
    name: 'Addition simple',
    description: 'Additionner deux nombres',
    category: 'Mathématiques',
    level: 1,
    data: {
      name: 'add',
      inputs: [
        { name: 'a', type: 'number', required: true },
        { name: 'b', type: 'number', required: true },
      ],
      logic: 'Additionner deux nombres et retourner le résultat',
      output: { type: 'number' },
    },
  },
  {
    name: 'Calcul de remise',
    description: 'Appliquer un pourcentage de réduction',
    category: 'E-commerce',
    level: 2,
    data: {
      name: 'calculateDiscount',
      inputs: [
        { name: 'price', type: 'number', required: true },
        { name: 'percentage', type: 'number', required: true },
      ],
      logic: 'Appliquer un pourcentage de réduction sur le prix. Retourner le prix après réduction. Si le pourcentage est négatif, retourner le prix tel quel.',
      output: { type: 'number' },
    },
  },
  {
    name: 'Somme d\'un tableau',
    description: 'Calculer la somme de tous les nombres',
    category: 'Tableaux',
    level: 3,
    data: {
      name: 'sumArray',
      inputs: [
        { name: 'numbers', type: 'array', required: true },
      ],
      logic: 'Calculer la somme de tous les nombres dans le tableau. Si le tableau est vide, retourner 0. Ignorer les valeurs non numériques.',
      output: { type: 'number' },
    },
  },
  {
    name: 'Validation de mot de passe',
    description: 'Vérifier la force d\'un mot de passe',
    category: 'Sécurité',
    level: 4,
    data: {
      name: 'validatePassword',
      inputs: [
        { name: 'password', type: 'string', required: true },
      ],
      logic: 'Valider un mot de passe. Il doit contenir au moins 8 caractères, au moins une majuscule, au moins une minuscule, et au moins un chiffre. Retourner true si valide, false sinon.',
      output: { type: 'boolean' },
    },
  },
  {
    name: 'Calcul de TVA',
    description: 'Calculer le prix TTC',
    category: 'Finance',
    level: 3,
    data: {
      name: 'calculateVAT',
      inputs: [
        { name: 'price', type: 'number', required: true },
        { name: 'vatRate', type: 'number', required: true },
      ],
      logic: 'Calculer le prix TTC (TVA incluse) à partir d\'un prix HT et d\'un taux de TVA en pourcentage. La formule est : prix HT * (1 + taux TVA / 100). Arrondir le résultat à 2 décimales.',
      output: { type: 'number' },
    },
  },
  {
    name: 'Trouver le maximum',
    description: 'Trouver le plus grand nombre dans un tableau',
    category: 'Tableaux',
    level: 3,
    data: {
      name: 'findMaxInArray',
      inputs: [
        { name: 'numbers', type: 'array', required: true },
      ],
      logic: 'Trouver le nombre maximum dans un tableau de nombres. Si le tableau est vide, retourner null. Si le tableau contient des valeurs non numériques, les ignorer.',
      output: { type: 'number' },
    },
  },
  {
    name: 'Compter les mots',
    description: 'Compter le nombre de mots dans un texte',
    category: 'Texte',
    level: 2,
    data: {
      name: 'countWords',
      inputs: [
        { name: 'text', type: 'string', required: true },
      ],
      logic: 'Compter le nombre de mots dans une chaîne. Les mots sont séparés par des espaces. Une chaîne vide retourne 0. Les espaces multiples sont traités comme un seul séparateur.',
      output: { type: 'number' },
    },
  },
  {
    name: 'Calcul de factorielle',
    description: 'Calculer n!',
    category: 'Mathématiques',
    level: 5,
    data: {
      name: 'factorial',
      inputs: [
        { name: 'n', type: 'number', required: true },
      ],
      logic: 'Calculer la factorielle d\'un nombre n. La factorielle de n est le produit de tous les entiers de 1 à n. Par exemple, factorielle(5) = 5*4*3*2*1 = 120. Si n est 0 ou 1, retourner 1. Si n est négatif, retourner 0.',
      output: { type: 'number' },
    },
  },
];

export default function ExampleSelector({ onExampleSelect }: ExampleSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<number>(0);

  const categories = ['all', ...Array.from(new Set(examples.map((e) => e.category)))];
  const levels = [0, ...Array.from(new Set(examples.map((e) => e.level)))];

  const filteredExamples = examples.filter((example) => {
    if (selectedCategory !== 'all' && example.category !== selectedCategory) return false;
    if (selectedLevel !== 0 && example.level !== selectedLevel) return false;
    return true;
  });

  return (
    <div className="example-selector">
      <div className="example-header">
        <h3 className="example-title">📚 Exemples prédéfinis</h3>
        <p className="example-subtitle">
          Sélectionnez un exemple pour tester rapidement les capacités de l'IA
        </p>
      </div>

      <div className="example-filters">
        <div className="filter-group">
          <label htmlFor="category-filter" className="filter-label">
            Catégorie
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Toutes' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="level-filter" className="filter-label">
            Niveau
          </label>
          <select
            id="level-filter"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(Number(e.target.value))}
            className="filter-select"
          >
            <option value={0}>Tous</option>
            {levels
              .filter((l) => l > 0)
              .map((level) => (
                <option key={level} value={level}>
                  Niveau {level}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="examples-grid">
        {filteredExamples.map((example, index) => (
          <div
            key={index}
            className="example-card"
            onClick={() => onExampleSelect(example.data)}
          >
            <div className="example-card-header">
              <h4 className="example-card-name">{example.name}</h4>
              <span className="example-badge level-{example.level}">
                Niveau {example.level}
              </span>
            </div>
            <p className="example-card-description">{example.description}</p>
            <div className="example-card-footer">
              <span className="example-category">{example.category}</span>
              <button className="example-use-button">Utiliser →</button>
            </div>
          </div>
        ))}
      </div>

      {filteredExamples.length === 0 && (
        <div className="example-empty">
          <p>Aucun exemple trouvé avec ces filtres.</p>
        </div>
      )}
    </div>
  );
}




