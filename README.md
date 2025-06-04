## Exécution avec Docker

Ce projet inclut deux configurations Docker : une pour le développement et une pour la production.

### Configuration de Développement

#### Prérequis
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/) installés
- [Docker Model Runner](https://docs.docker.com/guides/use-docker-model-runner/) activé dans Docker Desktop
- Node.js version utilisée : `22.13.1-slim`

#### Variables d'Environnement
Créez un fichier `.env.local` avec :
```env
AIRTABLE_KEY=votre_clé_api_airtable
AIRTABLE_BASE=votre_id_base_airtable
JWT_SECRET=votre_secret_jwt
DMR_HOST=http://model-runner.docker.internal  # Pour l'intégration avec Docker Model Runner
DMR_MODEL=ai/llama3.2:latest  # Modèle par défaut
```

#### Activation de Docker Model Runner
Avant de lancer l'application, assurez-vous d'avoir activé Docker Model Runner :

1. **Dans Docker Desktop** :
   - Ouvrez les paramètres de Docker Desktop
   - Allez dans "Features in development"
   - Activez "Enable Docker Model Runner"
   - Si vous êtes sur Windows avec GPU NVIDIA, activez aussi "Enable GPU-backed inference"
   - Redémarrez Docker Desktop

2. **Test de l'installation** :
   ```bash
   docker model version
   docker model pull ai/llama3.2:latest
   docker model run ai/llama3.2:latest "Bonjour"  # Tester le modèle
   ```

#### Lancement en Développement
1. Pour le premier lancement ou après des modifications du Dockerfile/package.json :
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
   - Docker Model Runner API : [http://localhost:12434](http://localhost:12434) (si TCP activé)

#### Fonctionnalités de Développement
- Hot-reloading activé
- Volumes montés pour le code source
- Node modules persistants
- Intégration avec Docker Model Runner pour l'IA
- Mode développement de Next.js
- Modèle Llama 3.2 automatiquement chargé

#### Structure Docker
- **Dockerfile** : Configuration de développement avec :
  - Installation complète des dépendances
  - Hot-reloading activé
  - Commande `npm run dev`

- **compose.yaml** : Configure l'environnement avec :
  - Service `nextjs-dev` pour l'application
  - Service `ai_runner` utilisant Docker Model Runner avec Llama 3.2
  - Volumes montés pour :
    - Code source : `.:/app`
    - Node modules : `/app/node_modules`
    - Build Next.js : `/app/.next`
  - Réseau `appnet` pour la communication inter-services
  - Modèle Llama 3.2 automatiquement disponible

#### Ports Exposés
- Application Next.js : **3000** (mapping `3000:3000`)
- API Docker Model Runner : **12434** (accessible via model-runner.docker.internal dans les conteneurs)

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

# Gestion des modèles Docker Model Runner
docker model list                              # Lister les modèles installés
docker model pull ai/llama3.2:latest          # Télécharger le modèle
docker model run ai/llama3.2:latest "Bonjour" # Tester le modèle avec un prompt
```

#### Dépannage Docker Model Runner

Si vous rencontrez des erreurs :

1. **Modèle non trouvé** :
   ```bash
   # Pré-charger le modèle manuellement
   docker model pull ai/llama3.2:latest
   ```

2. **Problème de connexion** :
   - Vérifiez que Docker Model Runner est activé dans Docker Desktop
   - Redémarrez Docker Desktop
   - Vérifiez que l'URL `http://model-runner.docker.internal` est accessible

3. **Performance lente** :
   - Sur Windows, activez "GPU-backed inference" si vous avez une GPU NVIDIA
   - Augmentez la mémoire allouée à Docker Desktop

### Avantages de cette Configuration
- Environnement de développement isolé et reproductible
- Rechargement automatique des modifications
- Intégration native avec Docker Model Runner et Llama 3.2
- Performance optimisée avec support GPU (Windows/NVIDIA)
- Modèles gérés automatiquement par Docker
- Pas besoin d'installer Node.js ou des modèles IA localement
- Raccourcis npm pour faciliter l'utilisation de Docker

## Informations Supplémentaires

- Le projet utilise Turbopack pour un développement plus rapide
- Docker Model Runner utilise une API compatible OpenAI
- Les modèles sont automatiquement téléchargés et mis en cache
- L'API est accessible via `/api/models` pour les appels au modèle
- Le composant de chat est disponible sous le nom `ModelRunnerChat`

## Ressources Utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Docker Model Runner](https://docs.docker.com/guides/use-docker-model-runner/)
- [Documentation Airtable API](https://airtable.com/developers/web/api/introduction)
- [Documentation NextAuth.js](https://next-auth.js.org/)
