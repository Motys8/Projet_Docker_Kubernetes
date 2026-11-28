# Chapitre — Conteneurisation, Orchestration Locale et Sécurité de l'Image (Docker)

## 1. Architecture de l'image Docker (`app/Dockerfile`)

L'application web **TaskBoard** (Node.js / Express) a été conteneurisée à l'aide d'un `Dockerfile` **multi-stage** basé sur l'image officielle `node:22-alpine` (version figée, sans tag `latest`) afin de minimiser la surface d'attaque et la taille finale de l'image.

### Découpage des étapes de construction
1. **Stage `build` :** Installation stricte des dépendances de production via `npm ci --omit=dev` à partir de `package.json` et `package-lock.json`, puis copie du code source (`server.js` et `public/`).
2. **Stage final (production) :**
   * Définition de `NODE_ENV=production`.
   * Suppression explicite des gestionnaires de paquets (`npm`, `npx`, `yarn`, `corepack`), inutiles à l'exécution du serveur Node.js et sources de vulnérabilités.
   * Copie des artefacts depuis le stage `build` avec attribution directe des droits à l'utilisateur non-root (`--chown=1000:1000`).
   * Bascule sur l'utilisateur non-privilégié `USER 1000:1000` (`node`), exposition du port `3000` et démarrage via `CMD ["node", "server.js"]`.

### Exclusion des fichiers sensibles (`.dockerignore`)
Un fichier `app/.dockerignore` empêche l'inclusion de fichiers locaux, de dépendances non contrôlées ou de secrets dans le contexte de build :
* `node_modules`
* `.env` et `.env.*`
* `.git` et `.gitignore`

### Commandes de construction et vérification
```bash
# Construction de l'image de référence 1.0.0 depuis la racine du dépôt
docker build -t taskboard-web:1.0.0 ./app

# Vérification de la taille de l'image finale (62.2 Mo de contenu)
docker images taskboard-web:1.0.0
```

---

## 2. Orchestration locale avec Docker Compose (`compose.yaml`)

Pour permettre le développement et les tests d'intégration en local avant le déploiement sur Kubernetes, un fichier `compose.yaml` a été mis en place à la racine du projet pour orchestrer deux services sur un réseau interne dédié :

* **Service `db` (`postgres:16-alpine`) :**
  * Utilise les variables d'environnement injectées depuis le fichier `.env` local (modèle fourni dans `.env.example`, `.env` ignoré par Git).
  * Initialise automatiquement le schéma de la base de données et les données d'exemple au premier démarrage via le montage en lecture seule du script `./db/init.sql` dans `/docker-entrypoint-initdb.d/init.sql`.
  * Persiste les données dans un volume nommé (`pgdata`).
  * Intègre un `healthcheck` (`pg_isready -U taskboard -d taskboard`) vérifiant la disponibilité réelle de PostgreSQL.
* **Service `web` (`taskboard-web:1.0.0`) :**
  * Dépend du service `db` avec la condition `service_healthy`, garantissant que le serveur Node.js ne démarre qu'une fois la base prête à accepter des connexions.
  * Expose le port `3000:3000` sur l'hôte local.

### Commandes d'exploitation en local
```bash
# 1. Préparer la configuration locale
cp .env.example .env

# 2. Construire et démarrer l'ensemble de la stack en arrière-plan
docker compose up -d --build

# 3. Vérifier l'état des conteneurs et des sondes de santé
docker compose ps

# 4. Arrêter la stack (ajouter -v pour purger le volume de données)
docker compose down
```

---

## 3. Intégration Kubernetes et gestion du cycle de vie (Minikube)

### Manifestes de base du cluster (`k8s/`)
Les fondations réseau et d'isolation du cluster ont été définies dans les manifestes suivants :
* `k8s/00-namespace.yaml` : Création du namespace dédié `taskboard` isolant toutes les ressources du projet.
* `k8s/21-db-service.yaml` : Création du `Service` interne `db` de type `ClusterIP` exposant le port `5432` vers les Pods portant les labels `app: taskboard` et `tier: db`.

### Chargement des images dans le registre interne Minikube
Minikube disposant de son propre registre Docker isolé, les images construites localement sont injectées explicitement dans le cluster à l'aide de `minikube image load` (avec `imagePullPolicy: IfNotPresent` dans le `Deployment`) :

```bash
# Chargement de l'image de production initiale (1.0.0)
minikube image load taskboard-web:1.0.0

# Chargement de l'image de mise à jour (1.1.0) préparée pour la démonstration T9
docker build -t taskboard-web:1.1.0 ./app
minikube image load taskboard-web:1.1.0

# Vérification de la présence des deux versions dans le cache Minikube
minikube image ls | grep taskboard
```

### Déploiement et test de mise à jour / retour arrière (Test T9)
Pour valider le déploiement continu sans coupure de service (`RollingUpdate`) et la capacité de retour arrière (`Rollback`) exigés par le scénario **T9**, la procédure suivante a été exécutée et validée :

```bash
# 1. Déploiement des ressources sur Minikube
kubectl apply -k k8s/

# 2. Ouverture du tunnel vers le service web (NodePort 30080)
minikube service web -n taskboard --url

# 3. Déclenchement de la mise à jour progressive vers la version 1.1.0
kubectl set image deployment/web web=taskboard-web:1.1.0 -n taskboard
kubectl rollout status deployment/web -n taskboard

# 4. Annulation de la mise à jour et retour instantané à la version 1.0.0
kubectl rollout undo deployment/web -n taskboard
kubectl rollout status deployment/web -n taskboard
```

Le remplacement progressif des réplicas (`replicas: 2`) a permis de basculer de la version `1.0.0` à la `1.1.0`, de constater la mise à jour visuelle dans le navigateur tout en conservant les tâches stockées dans PostgreSQL, puis de revenir immédiatement à l'état initial via `rollout undo`.

---

## 4. Audit de sécurité et analyse de vulnérabilités (Tests T8 et DOC-7)

### Vérification des bonnes pratiques de conteneurisation (Test T8)
Plusieurs contrôles ont été menés sur l'image `taskboard-web:1.0.0` pour garantir l'absence de secrets et le respect du principe de moindre privilège :

```bash
# Contrôle de l'historique des couches (aucune variable ou secret en clair)
docker history --no-trunc taskboard-web:1.0.0

# Vérification de l'absence de fichier .env dans le répertoire de travail du conteneur
docker run --rm taskboard-web:1.0.0 ls -la /app

# Vérification de l'identité d'exécution non-root (retourne uid=1000(node) gid=1000(node))
docker run --rm taskboard-web:1.0.0 id
```

### Analyse des vulnérabilités avec Trivy et remédiation (Bonus DOC-7)
L'image finale a été soumise à un scan de vulnérabilités statique via **Trivy** en ciblant les failles de sévérité `HIGH` et `CRITICAL` :

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --severity HIGH,CRITICAL taskboard-web:1.0.0
```

* **Diagnostic initial :** Le premier audit a révélé `0` vulnérabilité `CRITICAL` et `10` vulnérabilités `HIGH`. L'analyse détaillée du rapport Trivy a montré que l'OS Alpine (`3.24.4`) ainsi que toutes les dépendances applicatives (`app/node_modules`) présentaient `0` faille, mais que les 10 CVE provenaient exclusivement de l'outillage `npm` inclus par défaut dans l'image `node:22-alpine` (`brace-expansion`, `pacote`, `picomatch`, `sigstore`, `ip-address`).
* **Action corrective :** Ajout d'une instruction `RUN rm -rf` dans le stage final du `Dockerfile` pour supprimer `npm`, `npx`, `yarn` et `corepack`, ces binaires étant superflus en production.
* **Résultat après remédiation :** Après reconstruction de l'image, le nouveau scan Trivy confirme **`0` vulnérabilité `CRITICAL` et `0` vulnérabilité `HIGH`**.