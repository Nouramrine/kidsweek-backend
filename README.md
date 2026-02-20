# KidsWeek – Backend API

KidsWeek est une application destinée aux parents, pensée pour faciliter
l’organisation de la semaine familiale (routines, activités, responsabilités),
avec une approche simple, ludique et collaborative.

Ce repository contient l’API backend du projet, développée en Node.js / Express.

---

## 📌 Origine du projet

KidsWeek est initialement né comme projet de fin de formation,
réalisé en collaboration avec deux autres développeurs.

À l’issue de la formation, j’ai repris le projet en main de manière individuelle :

- sécurisation des accès et des secrets
- nettoyage de l’historique Git
- amélioration de l’architecture et de la documentation
- poursuite du développement dans une logique produit

Le projet est aujourd’hui maintenu et développé exclusivement par moi,
dans une démarche professionnelle et orientée bonnes pratiques.

---

## 🚀 Objectif de l’API

- Fournir une API REST sécurisée pour l’application mobile KidsWeek
- Centraliser la gestion des utilisateurs, familles et activités
- Gérer l’authentification et les rôles (parent / enfant)
- Assurer la persistance et l’intégrité des données

---

## 🧩 Fonctionnalités principales

- Authentification des utilisateurs (JWT)
- Gestion des familles et des membres
- Gestion des rôles (parent / enfant)
- Création, modification et suivi des activités hebdomadaires
- Envoi d’emails transactionnels
- Sécurisation des routes et des accès

---

## 🛠️ Stack technique

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT (authentification)
- Nodemailer (emails)
- Nodemon (développement)
- Architecture REST

---

## 🧱 Architecture & bonnes pratiques

- Séparation claire des responsabilités:
  - routes
  - controllers
  - middlewares
  - models
- Gestion centralisée des variables d’environnement
- Sécurisation des endpoints sensibles
- Utilisation de middlewares (auth, sécurité, logs)
- Secrets exclus du versioning (.env, .gitignore)
- Historique Git nettoyé

---

## 🧠 Ce que j’ai réalisé

- Conception et implémentation de l’API REST
- Structuration complète du projet backend
- Mise en place de l’authentification JWT
- Gestion des rôles et des droits d’accès
- Intégration de l’envoi d’emails transactionnels
- Sécurisation des données et des accès

---

## ⚙️ Installation & configuration

### Prérequis

- Node.js
- MongoDB (local ou cloud)
- Yarn

### Installation

```bash
yarn install
```

### Variable d'environnement

Crée un fichier .env à la racine du projet
(un fichier .env.example est fourni à titre d'exemple):

```
env

PORT=
MONGO_URI=


BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=ton-email-verifie@domaine.com
BREVO_SENDER_NAME=KidsWeek
```

### lancer le serveur en développement

```bash
yarn dev
```

Le serveur démarre par défaut sur le port défini dans .env.

## 🔗 Frontend

Cette API est consommée par une application mobile développée en React Native / Expo.

👉 Repository frontend :
https://github.com/Nouramrine/kidsweek-frontend.git

---

## 📌 Statut du projet

### 🛠️ En cours de développement (MVP fonctionnel)

Améliorations continues, nouvelles fonctionnalités en cours d’implémentation.

---

## 👤 Auteur

Nour El Islam AMRINE
Concepteur développeur d'application web & mobile - Full-stack JavaScript (MERN)

Projet personnel full-stack, repris et maintenu après une phase initiale de travail en équipe.
