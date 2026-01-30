# KidsWeek – Backend API

KidsWeek est une application destinée aux parents, pensée pour faciliter
l’organisation de la semaine familiale (routines, activités, responsabilités),
avec une approche simple et ludique.

Ce repository contient l’API backend du projet.

---

## 🚀 Fonctionnalités principales

- Authentification des utilisateurs
- Gestion des familles et des membres
- Création et suivi d’activités hebdomadaires
- Système de rôles (parent / enfant)
- Envoi d’emails transactionnels

---

## 🛠️ Stack technique

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT (authentification)
- Nodemailer (emails)
- Architecture REST

---

## 🧠 Ce que j’ai réalisé

- Conception et implémentation de l’API REST
- Structuration du projet (routes, controllers, middlewares)
- Mise en place de l’authentification et de la gestion des rôles
- Sécurisation des accès et gestion des variables d’environnement
- Nettoyage de l’historique Git et suppression des secrets sensibles

---

## ⚙️ Installation & configuration

### Prérequis
- Node.js
- MongoDB (local ou cloud)

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

SMTP_USER=
SMPT_PASS=
```
### lancer le serveur en développement
```bash
yarn dev
