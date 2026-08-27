# 🚀 Checklist de Déploiement en Production

Cette checklist doit être validée avant chaque mise en production sur **Vercel** et **Supabase**.

---

## 1. Sécurité de la Base de Données (Supabase)
- [ ] **RLS activée sur toutes les tables :** Vérifier que `profiles`, `services`, `staff`, `appointments`, `loyalty_transactions`, `rewards`, `availability_settings`, `blocked_dates` ont toutes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- [ ] **Politiques RLS auditées :** Exécuter [supabase/rls_policies.sql](file:///c:/Users/Lenovo/Desktop/Reservation%20coiffure/supabase/rls_policies.sql) pour s'assurer qu'aucun client ne peut accéder aux données d'un autre utilisateur.
- [ ] **Trigger Fidélité actif :** Vérifier que la fonction `trg_award_loyalty_points` ([supabase/loyalty_trigger.sql](file:///c:/Users/Lenovo/Desktop/Reservation%20coiffure/supabase/loyalty_trigger.sql)) s'exécute avec `SECURITY DEFINER` lors du passage d'un rendez-vous à `completed`.
- [ ] **Storage Bucket Avatars :** S'assurer que le bucket Supabase Storage `avatars` est créé avec les politiques de lecture publique et d'écriture authentifiée (`role = 'admin'`).

---

## 2. Authentification & Sessions
- [ ] **Cookies HTTP-Only :** Vérifier que `@supabase/ssr` utilise les cookies chiffrés (`HttpOnly`, `Secure`, `SameSite=Strict`).
- [ ] **Redirections OAuth & Auth :** Configurer les Redirect URLs dans le tableau de bord Supabase (`https://votre-domaine.vercel.app/**`).

---

## 3. Configuration Vercel & En-têtes HTTP
- [ ] **Fichier `vercel.json` présent :** Contient la politique CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` et le rewrite SPA.
- [ ] **Variables d'environnement Vercel :**
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_APP_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` *(Sans préfixe VITE_)*
  - [ ] `RESEND_API_KEY` *(Sans préfixe VITE_)*
  - [ ] `CRON_SECRET` *(Sans préfixe VITE_)*

---

## 4. Tests & Audit Automatisés
- [ ] **Audit de dépendances :** Exécuter `npm run audit` (0 vulnérabilité haute/critique).
- [ ] **Tests unitaires :** Exécuter `npm test` (Validation Zod, Calculs fidélité, Réservation).
- [ ] **Compilation TypeScript & Vite :** Exécuter `npm run build` avec 0 erreur.

---

## 5. Automatisation & Cron Jobs
- [ ] **Cron Quotidien (08h00 UTC) :** Vérifier le bon déclenchement de `/api/cron/send-reminders` avec le secret partagé `CRON_SECRET`.
- [ ] **Templates d'Emails Transactionnels :** Tester l'envoi d'un email de confirmation de réservation et d'un email de rappel J-1.
