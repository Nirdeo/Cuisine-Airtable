## Exécution avec Docker

Ce projet inclut deux configurations Docker : une pour le développement et une pour la production.

### Configuration de Développement

#### Prérequis
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/) installés
- Node.js version utilisée : `22.13.1-slim`

#### Variables d'Environnement
Créez un fichier `.env.local` avec :
```env
AIRTABLE_KEY=votre_clé_api_airtable
AIRTABLE_BASE=votre_id_base_airtable
JWT_SECRET=votre_secret_jwt
OLLAMA_HOST=http://ollama:11434  # Pour l'intégration avec Ollama
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
   - Ollama : [http://localhost:11434](http://localhost:11434)

#### Fonctionnalités de Développement
- Hot-reloading activé
- Volumes montés pour le code source
- Node modules persistants
- Intégration avec Ollama pour l'IA
- Mode développement de Next.js

#### Structure Docker
- **Dockerfile.dev** : Configuration de développement avec :
  - Installation complète des dépendances
  - Hot-reloading activé
  - Commande `npm run dev`

- **compose.yaml** : Configure l'environnement avec :
  - Service `nextjs-dev` pour l'application
  - Service `ollama` pour l'IA
  - Volumes montés pour :
    - Code source : `.:/app`
    - Node modules : `/app/node_modules`
    - Build Next.js : `/app/.next`
  - Réseau `appnet` pour la communication inter-services
  - Volume persistant pour les modèles Ollama

#### Ports Exposés
- Application Next.js : **3000** (mapping `3000:3000`)
- API Ollama : **11434** (mapping `11434:11434`)

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

### Avantages de cette Configuration
- Environnement de développement isolé et reproductible
- Rechargement automatique des modifications
- Intégration native avec Ollama
- Persistance des données et des modèles
- Pas besoin d'installer Node.js localement
- Raccourcis npm pour faciliter l'utilisation de Docker

## Informations Supplémentaires

- Le projet utilise Turbopack pour un développement plus rapide
- La structure du projet suit l'architecture App Router de Next.js
- Les données sont stockées et gérées via Airtable

## Ressources Utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Airtable API](https://airtable.com/developers/web/api/introduction)
- [Documentation NextAuth.js](https://next-auth.js.org/)
