# TaskBoard — Docker & Kubernetes
 
> **Projet scolaire en groupe** : module Docker & Kubernetes, ESILV
 
## Le projet
 
**TaskBoard** est une petite application de gestion de tâches : on peut créer, lister, terminer et supprimer une tâche.
 
Au départ, l'application tourne « à la main » sur un seul serveur. Chaque mise en production est risquée, une panne fait perdre des données et le mot de passe de la base est écrit en clair dans le code.
 
Notre rôle, en tant qu'équipe DevOps, est de la **conteneuriser avec Docker** puis de la **déployer sur un cluster Kubernetes**. Le déploiement doit être reproductible, configurable, sécurisé et résilient : on clone le dépôt et on lance tout en quelques commandes.
 

## Membres du groupe
 
- Hugo CHI
- Timothée CUNY
- Justin DAUB
- Dorian PERROT
## Outils utilisés
 
- Docker et Docker Compose
- Kubernetes (minikube) et kubectl
- Node.js / Express
- PostgreSQL
- Git / GitHub

k

##  Créer le Secret PostgreSQL

1-  Démarrez votre Minikube, vérifiez que kubectl cible ce cluster et créez le namespace taskboard s’il n’existe pas

Chacun choisit son mot de passe pour son Minikube local. Le fichier k8s/11-secret.example.yaml sert de modèle avec la valeur fictive A_REMPLACER

2- Enregistrer le mot de passe de développement dans un fichier texte hors du dépôt, sans retour à la ligne final. Remplacer CHEMIN_VERS_LE_FICHIER par le chemin de ce fichier. Avec --from-file, kubectl lit le contenu du fichier et le range sous la clé DB_PASSWORD. Le mot de passe reste ainsi hors de la commande : 

```bash
kubectl create secret generic db-credentials --namespace taskboard --from-file="DB_PASSWORD=CHEMIN_VERS_LE_FICHIER"
```

3- Vérifier que le Secret contient la bonne clé sans afficher sa valeur : 

```bash
kubectl describe secret db-credentials --namespace taskboard
```

Le Secret est de type Opaque. La section Data affiche DB_PASSWORD et sa taille en octets.