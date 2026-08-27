# ✂️ Cindy Malorie — Coiffure Privée & à Domicile (Italie)

Plateforme web haut de gamme de réservation de prestations de coiffure privée à domicile et en studio privé, développée pour **Cindy Malorie**.

---

## 🌟 Fonctionnalités Principales

### 📱 **Espace Public & Vitrine de Marque**
- **Accueil & Présentation :** Philosophie du service nomade et privé, prestations vedettes, avis clients, intégration TikTok & Instagram officiel ([@cindy_maloriee](https://www.instagram.com/cindy_maloriee?igsh=cnAyNThweDV2dmgy)).
- **Catalogue des Prestations (`/services`) :** Filtrage dynamique par catégorie (*Femme, Homme, Enfant, Technique, Soins, Mariage*), durées et tarifs en temps réel depuis Supabase.
- **Galerie & Réalisations (`/gallery`) :** Vidéos TikTok officielles de Cindy Malorie et photos Avant / Après.
- **Contact & Zones d'Intervention (`/contact`) :** Coordonnées directes (+39 351 269 7743 / WhatsApp), formulaire de contact et périmètres de déplacement en Italie.

### 📅 **Module de Réservation en 5 Étapes (`/reservation` ou `/booking`)**
1. **Étape 1 :** Sélection de la prestation avec durées et tarifs dynamiques.
2. **Étape 2 :** Choix du coiffeur / styliste (*Profil vérifié de Cindy Malorie*).
3. **Étape 3 :** Calendrier interactif (`react-calendar`) avec calcul en temps réel des créneaux disponibles, vérification des congés (`blocked_dates`), des horaires ouvrés (`availability_settings`) et des collisions de planning.
4. **Étape 4 :** Choix du lieu d'intervention (*À mon domicile avec adresse validée* vs *Au Studio Privé*) et notes personnalisées.
5. **Étape 5 :** Récapitulatif, création de compte ou connexion instantanée, et confirmation de rendez-vous.

### 👤 **Espace Client Connecté (`/dashboard`)**
- **Vue d'ensemble :** Prochains rendez-vous, suivi des emails et rappels.
- **Mon Profil & Préférences :** Coordonnées et préférences capillaires enregistrées en JSONB (*type de cheveux, coupe préférée, couleur favorite*).
- **Historique & Annulation :** Liste des rendez-vous passés et futurs avec annulation en 1 clic via Edge Function `cancel-appointment`.
- **Programme de Fidélité & Récompenses (`/dashboard/loyalty`) :** Solde de points en temps réel, catalogue de récompenses et échange direct contre des soins offerts via Edge Function `redeem-loyalty-points`.

### 🛡️ **Portail Administrateur & Gestionnaire**
- **KPIs & Tableaux de Bord (`/admin/dashboard`) :** Chiffre d'affaires réalisé, nombre de rendez-vous (jour/semaine/mois), taux de transformation et graphiques interactifs Chart.js.
- **Planning & Calendrier des RDV (`/admin/appointments`) :** 4 modes d'affichage (*Mois, Semaine, Jour, Liste*), confirmation/annulation, ajout de réservation téléphonique et modification.
- **Gestion des Horaires & Congés (`/admin/availability`) :** Configuration des plages horaires récurrentes (Lundi à Dimanche) et blocage de dates exceptionnelles.
- **Gestion de la Clientèle (`/admin/clients`) :** Fiches clients détaillées, pipeline relationnel (*Prospect, Actif, Fidèle, Inactif*), historique et notes internes confidentielles.
- **Catalogue des Prestations (`/admin/services`) :** CRUD complet des services et bascule actif/inactif.
- **Gestion de l'Équipe (`/admin/staff`) :** Profils stylistes, spécialités et téléversement de photos vers Supabase Storage.
- **Programme de Fidélité Pro (`/admin/loyalty`) :** Barème de conversion, ajout de récompenses, journal des transactions et ajustement manuel audité de points.

### ⏰ **Automatisation des Rappels & Cron Jobs**
- **Rappels automatiques (J-1) :** Cron quotidien à 08h00 UTC via Vercel Cron (`/api/cron/send-reminders`) ou Supabase `pg_cron` appelant l'Edge Function `send-reminder`.

---

## 🛠️ Stack Technique

- **Frontend :** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Date-fns, React Calendar, Chart.js.
- **Backend & Base de Données :** Supabase PostgreSQL, Row Level Security (RLS), Triggers SQL (`SECURITY DEFINER`), Supabase Storage (`avatars`), Supabase Edge Functions (Deno).
- **Authentification & Sécurité :** Sessions gérées par **Cookies HTTP-Only, Secure et SameSite=Strict** via `@supabase/ssr`, validation Zod.
- **Déploiement :** Vercel avec en-têtes de sécurité stricts (CSP, HSTS, X-Frame-Options: DENY).

---

## 🚀 Installation & Lancement Local

```bash
# 1. Cloner le dépôt et installer les dépendances
git clone <votre-repo>
cd "Reservation coiffure"
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Renseigner vos clés VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Lancer le serveur de développement Vite
npm run dev

# 4. Exécuter les tests unitaires
npm test

# 5. Exécuter l'audit de sécurité
npm run audit

# 6. Compiler pour la production
npm run build
```

---

## 🌐 Déploiement en Production sur Vercel

1. Connectez votre dépôt Git à votre compte **Vercel**.
2. Renseignez les variables d'environnement listées dans [.env.example](file:///c:/Users/Lenovo/Desktop/Reservation%20coiffure/.env.example) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` *(Privé)*
   - `RESEND_API_KEY` *(Privé)*
   - `CRON_SECRET` *(Privé)*
3. Suivez la checklist complète de mise en production : [DEPLOYMENT_CHECKLIST.md](file:///c:/Users/Lenovo/Desktop/Reservation%20coiffure/DEPLOYMENT_CHECKLIST.md).

---

## 📞 Coordonnées & Support

- **Artisan Coiffeuse :** Cindy Malorie
- **Secteur d'Activité :** Italie (Prestations à domicile & privées)
- **Téléphone / WhatsApp :** [+39 351 269 7743](tel:+393512697743)
- **Email :** [cindytchamabekamaha@gmail.com](mailto:cindytchamabekamaha@gmail.com)
- **Instagram :** [@cindy_maloriee](https://www.instagram.com/cindy_maloriee?igsh=cnAyNThweDV2dmgy)
- **TikTok :** [@cindymalorie](https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC)
