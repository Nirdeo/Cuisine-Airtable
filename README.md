## Exécution avec Docker

Ce projet inclut deux configurations Docker : une pour le développement et une pour la production.

### Configuration de Développement

#### Prérequis
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/) installés
- Docker Desktop 4.41+ (Windows) ou 4.40+ (MacOS) avec Docker Model Runner activé
- Node.js version utilisée : `22.13.1-slim`

#### Variables d'Environnement
Créez un fichier `.env.local` avec :
```env
AIRTABLE_KEY=votre_clé_api_airtable
AIRTABLE_BASE=votre_id_base_airtable
JWT_SECRET=votre_secret_jwt
MODEL_RUNNER_HOST=http://model-runner.docker.internal  # Pour Docker Model Runner
MODEL_RUNNER_PORT=12434
```

#### Configuration Docker Model Runner
Avant de lancer l'application, assurez-vous que Docker Model Runner est activé :

1. **Dans Docker Desktop** :
   - Ouvrir Docker Desktop
   - Aller dans Settings → Features in development → Beta tab
   - Cocher "Enable Docker Model Runner"
   - Si vous êtes sur Windows avec GPU NVIDIA, cocher aussi "Enable GPU-backed inference"
   - Appliquer et redémarrer

2. **Télécharger le modèle par défaut** (équivalent au modèle Ollama précédent) :
   ```bash
   docker model run ai/llama3.2
   ```

#### Lancement en Développement
1. Pour le premier lancement ou après des modifications du Dockerfile.dev/package.json :
   ```bash
   docker compose up --build
   ```
   ou avec npm:
   ```bash
   npm run docker:up:build
   ```

2. Pour les lancements suivants (développement quotidien) :
   ```bash
   docker compose up
   ```
   ou avec npm:
   ```bash
   npm run docker:up
   ```

3. Pour lancer en mode détaché (background) :
   ```bash
   docker compose up -d
   ```
   ou avec npm:
   ```bash
   npm run docker:up:detach
   ```

L'application sera disponible sur :
   - Next.js : [http://localhost:3000](http://localhost:3000)
   - Docker Model Runner API : [http://localhost:12434](http://localhost:12434)

#### Fonctionnalités de Développement
- Hot-reloading activé
- Volumes montés pour le code source
- Node modules persistants
- Intégration avec Docker Model Runner pour l'IA
- Mode développement de Next.js

#### Structure Docker
- **Dockerfile.dev** : Configuration de développement avec :
  - Installation complète des dépendances
  - Hot-reloading activé
  - Commande `npm run dev`

- **compose.yaml** : Configure l'environnement avec :
  - Service `nextjs-dev` pour l'application
  - Configuration pour Docker Model Runner
  - Volumes montés pour :
    - Code source : `.:/app`
    - Node modules : `/app/node_modules`
    - Build Next.js : `/app/.next`
  - Réseau `appnet` pour la communication inter-services

#### Ports Exposés
- Application Next.js : **3000** (mapping `3000:3000`)
- API Docker Model Runner : **12434** (géré par Docker Desktop)

#### Commandes Docker via npm

Nous avons ajouté des raccourcis npm pour faciliter l'utilisation de Docker :

```bash
# Démarrer les conteneurs
npm run docker:up                  # Mode foreground
npm run docker:up:detach           # Mode détaché/background
npm run docker:up:build            # Avec reconstruction des images

# Arrêter les conteneurs
npm run docker:down                # Arrêt standard
npm run docker:down:orphans        # Arrêt avec suppression des conteneurs orphelins

# Gestion et monitoring
npm run docker:logs                # Afficher les logs en temps réel
npm run docker:restart             # Redémarrer le service Next.js
```

#### Commandes Docker Natives
```bash
# Démarrer les services
docker compose up -d

# Voir les logs
docker compose logs -f

# Arrêter les services
docker compose down

# Nettoyer les conteneurs orphelins
docker compose down --remove-orphans

# Reconstruire les images
docker compose build

# Redémarrer un service spécifique
docker compose restart nextjs-dev
```

#### Commandes Docker Model Runner
```bash
# Lister les modèles disponibles
docker model ls

# Télécharger et exécuter le modèle par défaut
docker model run ai/llama3.2

# Supprimer un modèle
docker model rm ai/llama3.2

# Vérifier la version
docker model version
```

### Avantages de cette Configuration
- Environnement de développement isolé et reproductible
- Rechargement automatique des modifications
- Intégration native avec Docker Model Runner
- API OpenAI compatible
- Pas besoin d'installer Node.js localement
- Raccourcis npm pour faciliter l'utilisation de Docker
- Gestion optimisée des ressources (modèles chargés à la demande)

## Informations Supplémentaires

- Le projet utilise Turbopack pour un développement plus rapide
- La structure du projet suit l'architecture App Router de Next.js
- Les données sont stockées et gérées via Airtable

## Ressources Utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Airtable API](https://airtable.com/developers/web/api/introduction)
- [Documentation NextAuth.js](https://next-auth.js.org/)
