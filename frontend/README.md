# Frontend - API Generator

Interface React moderne pour générer et tester des APIs REST automatiquement.

## 🚀 Démarrage

```bash
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`

## 📁 Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── FunctionCreator.tsx    # Formulaire de création
│   │   ├── FunctionList.tsx       # Liste des fonctions
│   │   └── ApiTester.tsx          # Testeur d'API
│   ├── App.tsx                    # Composant principal
│   ├── main.tsx                   # Point d'entrée
│   └── index.css                  # Styles globaux
├── public/
└── package.json
```

## 🎨 Design System

- **Variables CSS** : Couleurs, espacements, bordures centralisés
- **Composants réutilisables** : Cards, boutons, formulaires
- **Responsive** : Mobile-first avec breakpoints
- **Accessibilité** : Labels, ARIA, navigation clavier

## 🔧 Technologies

- React 18.2.0
- Vite 5.0.8
- TypeScript 5.2.2

## 📝 Fonctionnalités

1. **Création de fonction** : Formulaire intuitif avec validation
2. **Liste des fonctions** : Vue en grille avec recherche
3. **Test d'API** : Interface de test avec résultats JSON formatés
