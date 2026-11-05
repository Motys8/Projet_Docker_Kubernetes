# TaskBoard — Docker & Kubernetes
 
> **Projet scolaire en groupe** : module Docker & Kubernetes, ESILV
 
## Le projet
 
**TaskBoard** est une petite application de gestion de tâches : on peut créer, lister, terminer et supprimer une tâche.
 
Au départ, l'application tourne « à la main » sur un seul serveur. Chaque mise en production est risquée, une panne fait perdre des données et le mot de passe de la base est écrit en clair dans le code.
 
Notre rôle, en tant qu'équipe DevOps, est de la **conteneuriser avec Docker** puis de la **déployer sur un cluster Kubernetes**. Le déploiement doit être reproductible, configurable, sécurisé et résilient : on clone le dépôt et on lance tout en quelques commandes.
 
## Ce qu'on a mis en place
 
- **Une application web** (Node.js) avec son API REST, conteneurisée dans une image Docker légère qui ne tourne pas en root.
- **Une base de données PostgreSQL** dont les données sont conservées même si son conteneur redémarre.
- **Un déploiement Kubernetes** : l'application web tourne sur 2 réplicas, et un Pod supprimé est recréé automatiquement.
- **Une configuration séparée du code** : les réglages sont dans des ConfigMaps et le mot de passe dans un Secret, jamais en clair dans le dépôt.
- **Une base isolée** : elle n'est accessible que depuis l'intérieur du cluster.
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
