# 🚀 Guide de démarrage rapide

## Installation

```bash
# 1. Backend
cd backend
npm install
# Créer backend/.env avec GROQ_API_KEY=votre_cle

# 2. Frontend
cd ../frontend
npm install

# 3. Retour à la racine
cd ..
```

## Démarrage

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

## Utilisation

1. Ouvrez http://localhost:5173
2. Remplissez le formulaire de création
3. Cliquez sur "Générer l'API"
4. Testez votre fonction dans l'onglet "Tester"

## Structure

```
api-generator-fullstack/
├── backend/     # API Fastify (port 3000)
└── frontend/    # React + Vite (port 5173)
```
