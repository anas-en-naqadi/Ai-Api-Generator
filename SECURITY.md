# Sécurité - Sandbox d'exécution

## 🔒 Implémentation du Sandbox

Le système utilise **vm2** pour exécuter les fonctions générées dans un environnement isolé et sécurisé.

### Mesures de sécurité implémentées

1. **Isolation complète** : Le code exécuté n'a pas accès à :
   - Le système de fichiers (`fs`)
   - Le processus Node.js (`process`)
   - Les modules Node.js (`require`)
   - Les variables globales (`global`, `globalThis`)
   - Les chemins système (`__dirname`, `__filename`)

2. **Timeout d'exécution** : Chaque fonction a un délai maximum de **5 secondes** pour s'exécuter.

3. **Validation pré-exécution** : Le code généré est analysé pour détecter des patterns dangereux :
   - `require()`, `import`
   - `process.`, `fs.`
   - `eval()`, `Function()`
   - `exec()`, `child_process`
   - Accès aux variables globales

4. **Objets autorisés uniquement** : Seuls les objets JavaScript natifs sont disponibles :
   - `Math`, `Number`, `String`, `Boolean`, `Array`, `Object`
   - `Date`, `JSON`, `RegExp`
   - `Error`, `TypeError`, `RangeError`, etc.
   - Fonctions utilitaires : `parseInt`, `parseFloat`, `isNaN`, etc.

### Limitations

- **Pas d'accès réseau** : Les fonctions ne peuvent pas faire d'appels HTTP
- **Pas d'accès fichiers** : Impossible de lire/écrire des fichiers
- **Pas d'accès système** : Impossible d'exécuter des commandes système
- **Pas de modules externes** : Seul le JavaScript natif est disponible

### Exemple de code sécurisé

```typescript
export function calculateDiscount(price: number, percentage: number): number {
  return price * (1 - percentage / 100);
}
```

### Exemple de code rejeté

```typescript
// ❌ REJETÉ - Accès au système de fichiers
export function badFunction() {
  const fs = require('fs');
  return fs.readFileSync('/etc/passwd');
}

// ❌ REJETÉ - Accès au processus
export function badFunction2() {
  return process.env.SECRET_KEY;
}

// ❌ REJETÉ - Code dynamique dangereux
export function badFunction3() {
  return eval('process.exit()');
}
```

## 🛡️ Recommandations pour la production

Pour un environnement de production, considérez :

1. **Worker Threads isolés** : Utiliser des worker threads Node.js pour une isolation encore plus forte
2. **Rate limiting** : Limiter le nombre d'exécutions par utilisateur/IP
3. **Monitoring** : Logger toutes les tentatives d'exécution et erreurs
4. **Quotas de ressources** : Limiter la mémoire et le CPU utilisés
5. **Whitelist de fonctions** : Autoriser uniquement certaines opérations
6. **Audit de code** : Analyser le code généré avant exécution avec des outils spécialisés

## 📝 Notes

- Le sandbox `vm2` est une solution robuste mais n'est pas infaillible
- Pour des cas d'usage critiques, considérez des solutions plus avancées comme :
  - Docker containers isolés
  - Services serverless (AWS Lambda, etc.)
  - Machines virtuelles dédiées
