# Partie rapport — Application TaskBoard, sondes de santé et validation K8s

## 1. Application TaskBoard et sondes de santé

L'application **TaskBoard** repose sur un backend Node.js / Express (`app/`) exposé sur le port `3000`, connecté à une base de données PostgreSQL déployée en `StatefulSet` (`db-0`) avec stockage persistant (`PersistentVolumeClaim` de `1Gi`).

- **Sonde de vivacité (`/healthz` — *livenessProbe*)** : vérifie uniquement que le processus HTTP répond (`200 OK`). Elle ne teste pas PostgreSQL afin d'éviter de redémarrer inutilement les Pods `web` si la base est momentanément indisponible.
- **Sonde de disponibilité (`/readyz` — *readinessProbe*)** : vérifie la connexion à PostgreSQL (`200 OK` si la base répond, `503 Service Unavailable` sinon). Quand `/readyz` échoue, Kubernetes retire le Pod des endpoints du Service `web` sans le tuer.

Lors du **test T6** (réduction du `StatefulSet db` à `0` réplica), les deux Pods `web` sont passés de `1/1 Running` à `0/1 Running` avec **`RESTARTS: 0`**, puis sont revenus automatiquement en `1/1 Running` dès la remise à `1` réplica de `db-0`.

## 2. Répartition du travail

| Membre | Périmètre principal |
| :--- | :--- |
| Timothée | Application TaskBoard, sondes `/healthz` et `/readyz`, tests/validation K8s (T3, T6, T9), `README.md` et captures |
| Justin | Dockerisation, manifestes Kubernetes et suivi des PRs |
| Coéquipiers (ex. Dorian / Hugo) | Base de données PostgreSQL, secrets et déploiement/architecture |

## 3. Difficultés rencontrées et solutions

- **Alignement du port et des sondes sur les manifestes `web`** : correction des manifestes `k8s/30-web-deployment.yaml` et `k8s/31-web-service.yaml` (port `3000` et sondes) sur la branche `fix/k8s-s3-web-v1`.
- **Gestion du mot de passe PostgreSQL (`DB_PASSWORD`)** : création du Secret `db-credentials` via `--from-file` à partir d'un fichier texte hors du dépôt (`1234` en local) afin de ne jamais écrire de secret dans Git.
- **Mise à jour et retour arrière (`v1.0.0` → `v1.1.0` → rollback)** : validation du *rolling update* avec `kubectl set image` et retour immédiat à la version stable via `kubectl rollout undo`.