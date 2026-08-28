-- ==============================================================================
-- MIGRATION : PAIEMENTS (ACOMPTE 15% / TOTALITÉ 100%) ET MULTI-ADMINISTRATEURS
-- ==============================================================================

-- 1. Mise à jour de la fonction is_admin() pour inclure Cindy et Yvan
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR email IN ('cindytchamabekamaha@gmail.com', 'kamahayvan@gmail.com'))
  );
$$;

-- 2. Promotion des profils existants pour Cindy et Yvan
UPDATE public.profiles
SET role = 'admin'
WHERE email IN ('cindytchamabekamaha@gmail.com', 'kamahayvan@gmail.com');

-- 3. Ajout des colonnes de paiement sur la table appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'deposit_15',
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
