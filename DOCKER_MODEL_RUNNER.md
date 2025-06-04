# Guide Docker Model Runner

Ce guide vous explique comment configurer et utiliser Docker Model Runner avec votre application CuisineAI.

## Prérequis

### Docker Desktop
- **Windows** : Docker Desktop 4.41+ avec GPU NVIDIA (optionnel mais recommandé)
- **MacOS** : Docker Desktop 4.40+ (Apple Silicon recommandé)

### Activation de Docker Model Runner

1. **Ouvrir Docker Desktop**
2. **Aller dans Settings**
3. **Naviguer vers "Features in development" → "Beta"**
4. **Cocher "Enable Docker Model Runner"**
5. **Sur Windows avec GPU NVIDIA** : Cocher aussi "Enable GPU-backed inference"
6. **Appliquer et redémarrer Docker Desktop**

## Modèles Disponibles

Les modèles sont hébergés dans l'espace Docker Hub `ai/`. Voici quelques modèles recommandés :

### Modèle Par Défaut
- `ai/llama3.2` - Modèle utilisé par défaut dans l'application, équivalent au modèle Ollama précédent

### Modèles Légers (Alternatives)
- `ai/smollm2` - Modèle léger, optimisé pour les tâches générales
- `ai/phi3.5` - Bon équilibre performance/qualité
- `ai/gemma2` - Efficace pour les textes courts

### Modèles Plus Puissants
- `ai/mistral` - Bon pour les tâches complexes
- `ai/codellama` - Spécialisé pour le code

## Commandes Essentielles

### Gestion des Modèles

```bash
# Lister tous les modèles disponibles localement
docker model ls

# Télécharger et exécuter le modèle par défaut
docker model run ai/llama3.2

# Télécharger un modèle alternatif
docker model run ai/smollm2

# Supprimer un modèle local
docker model rm ai/llama3.2

# Vérifier la version de Docker Model Runner
docker model version
```

### Test de l'API

```bash
# Test simple depuis l'hôte (Windows/Linux)
curl http://localhost:12434/engines/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ai/llama3.2",
    "messages": [
      {"role": "system", "content": "Tu es un assistant culinaire expert."},
      {"role": "user", "content": "Donne-moi une recette simple de pâtes."}
    ]
  }'

# Test depuis un conteneur Docker
curl http://model-runner.docker.internal/engines/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ai/llama3.2",
    "messages": [
      {"role": "system", "content": "Tu es un assistant culinaire expert."},
      {"role": "user", "content": "Donne-moi une recette simple de pâtes."}
    ]
  }'
```

## Configuration de l'Application

### Variables d'Environnement

Créez un fichier `.env.local` :

```env
# Configuration Airtable
AIRTABLE_KEY=votre_clé_api_airtable
AIRTABLE_BASE=votre_id_base_airtable

# Configuration JWT
JWT_SECRET=votre_secret_jwt_super_securisé

# Configuration Docker Model Runner
MODEL_RUNNER_HOST=http://model-runner.docker.internal
MODEL_RUNNER_PORT=12434
```

### Changement de Modèle

Pour changer le modèle utilisé par l'application :

1. **Télécharger le nouveau modèle** :
   ```bash
   docker model run ai/phi3.5
   ```

2. **Modifier le code** dans `src/utils/docker-model-runner.ts` :
   ```typescript
   model: string = 'ai/phi3.5'  // Changer ici le modèle par défaut
   ```

3. **Redémarrer l'application** :
   ```bash
   npm run docker:restart
   ```

## Endpoints API Disponibles

### Gestion des Modèles
- `GET /models` - Liste des modèles
- `POST /models/create` - Créer/télécharger un modèle
- `DELETE /models/{namespace}/{name}` - Supprimer un modèle

### API OpenAI Compatible
- `GET /engines/v1/models` - Liste des modèles OpenAI-style
- `POST /engines/v1/chat/completions` - Chat completions
- `POST /engines/v1/completions` - Text completions
- `POST /engines/v1/embeddings` - Embeddings

## Résolution des Problèmes

### Erreur "docker model not found"

Créer un lien symbolique :
```bash
ln -s /Applications/Docker.app/Contents/Resources/cli-plugins/docker-model ~/.docker/cli-plugins/docker-model
```

### Modèle trop gros pour le système

Les gros modèles peuvent ralentir le système. Utilisez des modèles plus légers comme `ai/smollm2` ou `ai/phi3.5`.

### API non accessible

1. Vérifier que Docker Model Runner est activé
2. Vérifier que Docker Desktop est en cours d'exécution
3. Tester la connexion :
   ```bash
   curl http://localhost:12434/engines/v1/models
   ```

### Pas de réponse du modèle

1. Vérifier que le modèle est téléchargé :
   ```bash
   docker model ls
   ```

2. Si absent, le télécharger :
   ```bash
   docker model run ai/llama3.2
   ```

## Optimisation des Performances

### Recommandations Matériel
- **RAM** : 8GB minimum, 16GB recommandé
- **GPU** : NVIDIA avec CUDA (Windows) ou Apple Silicon (MacOS)
- **Stockage** : SSD recommandé pour les modèles

### Gestion Mémoire
- Les modèles se chargent à la demande
- Ils se déchargent automatiquement quand inutilisés
- Cache local après le premier téléchargement

### Monitoring
```bash
# Voir les logs Docker Model Runner
docker model logs

# Monitorer l'utilisation des ressources
docker stats
```

## Migration depuis Ollama

Si vous migrez depuis Ollama, voici les principales différences :

| Ollama | Docker Model Runner |
|--------|-------------------|
| Port 11434 | Port 12434 |
| API propriétaire | API OpenAI compatible |
| `ollama run llama3.2` | `docker model run ai/llama3.2` |
| Gestion manuelle | Gestion automatique des ressources |

L'application a été mise à jour pour gérer automatiquement ces différences et utilise le même modèle `llama3.2` qu'auparavant. 