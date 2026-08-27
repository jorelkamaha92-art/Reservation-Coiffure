# 🛡️ Politique de Sécurité & Architecture de Protection

Ce document détaille l'ensemble des mesures de sécurité, protocoles cryptographiques et contrôles d'accès mis en œuvre sur la plateforme **Cindy Malorie - Coiffure Privée à Domicile**.

---

## 1. Vue d'Ensemble des Mesures de Sécurité

| Domaine | Implémentation & Mécanisme |
| :--- | :--- |
| **Authentification & Sessions** | Tokens JWT stockés dans des **Cookies HTTP-Only, Secure et SameSite=Strict** via `@supabase/ssr`. Protection totale contre le vol de token via JavaScript (XSS). |
| **Isolation des Données (RLS)** | **Row Level Security (RLS)** active et obligatoire sur toutes les 8 tables PostgreSQL de la base de données. |
| **Contrôle d'Accès (RBAC)** | Middleware serveur et client (`ProtectedRoute requireAdmin={true}`) vérifiant le rôle (`client`, `staff`, `admin`) avant tout accès aux données. |
| **En-têtes HTTP de Sécurité** | Configuration Vercel (`vercel.json`) avec CSP stricte, HSTS (2 ans + preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`. |
| **Validation des Entrées** | Validation stricte des schémas de données via **Zod** côté client et serveur (Edge Functions) pour prévenir les injections. |
| **Secrets & Clés d'API** | Séparation stricte : aucune clé privée préfixée par `VITE_` ou `NEXT_PUBLIC_`. Secrets réservés aux fonctions d'arrière-plan. |
| **Audit des Dépendances** | Vérification automatisée via `npm audit --audit-level=high` et règles de linting sécurisées avec `eslint-plugin-security`. |

---

## 2. Gestion des Sessions par Cookies HTTP-Only (`@supabase/ssr`)

L'application n'utilise **aucun stockage non sécurisé** (`localStorage` ou `sessionStorage`) pour les tokens de session utilisateur. 
- Les cookies de session sont émis avec les drapeaux :
  - `HttpOnly = true` (inaccessible depuis `document.cookie` pour contrer les failles XSS)
  - `Secure = true` (transmission chiffrée uniquement via HTTPS)
  - `SameSite = Strict` (protection contre les attaques CSRF / Cross-Site Request Forgery)

---

## 3. Politiques Row Level Security (RLS) dans Supabase

Chaque table dispose de politiques granulaires pour isoler strictement les données :
- `profiles` : Un client ne peut lire et modifier que son propre profil (`auth.uid() = id`). Les administrateurs disposent des droits de lecture globale.
- `appointments` : Les clients ne voient que leurs propres réservations (`client_id = auth.uid()`).
- `loyalty_transactions` : Lecture restreinte au client propriétaire des points. L'insertion est réservée aux triggers SQL `SECURITY DEFINER` et aux administrateurs.
- `rewards` & `services` : Lecture publique pour l'affichage du catalogue, modification réservée aux administrateurs.
- `availability_settings` & `blocked_dates` : Lecture publique pour le calcul des créneaux, écriture protégée pour les administrateurs.

---

## 4. Politique de Sécurité du Contenu (CSP)

Définie dans [vercel.json](file:///c:/Users/Lenovo/Desktop/Reservation%20coiffure/vercel.json) :
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.tiktok.com https://*.tiktokcdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tiktokcdn.com https://*.instagram.com https://*.cdninstagram.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com; frame-src 'self' https://www.tiktok.com https://www.instagram.com;
```

---

## 5. Signalement d'une Vulnérabilité (Vulnerability Reporting)

Si vous découvrez une faille de sécurité potentielle, merci de **ne pas créer d'issue publique**. Contactez directement l'équipe de sécurité à l'adresse suivante :

- 📧 **Email de Sécurité :** [cindytchamabekamaha@gmail.com](mailto:cindytchamabekamaha@gmail.com)
- 📱 **Téléphone / Urgence WhatsApp :** [+39 351 269 7743](tel:+393512697743)

Toute notification sera traitée sous 24h avec un correctif prioritaire.
