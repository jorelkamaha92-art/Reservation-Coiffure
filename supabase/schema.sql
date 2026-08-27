-- ==============================================================================
-- SCHEMA SUPABASE : APPLICATION DE RÉSERVATION DE COIFFEUR À DOMICILE
-- Règles de sécurité : RLS strict sur toutes les tables + principe du moindre privilège
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TYPES ÉNUMÉRÉS (ENUMS)
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_location_type AS ENUM ('home', 'salon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loyalty_transaction_type AS ENUM ('earned', 'redeemed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CRÉATION DES TABLES

-- ------------------------------------------------------------------------------
-- 3.1 TABLE : profiles (liée à auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT, -- Adresse par défaut du domicile client
    avatar_url TEXT,
    loyalty_points INT DEFAULT 0 NOT NULL CHECK (loyalty_points >= 0),
    role TEXT DEFAULT 'client' NOT NULL CHECK (role IN ('client', 'staff', 'admin')),
    preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3.2 TABLE : services
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3.3 TABLE : staff
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    specialty TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3.4 TABLE : appointments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status DEFAULT 'pending' NOT NULL,
    location_type appointment_location_type DEFAULT 'home' NOT NULL,
    location_address TEXT,
    notes TEXT,
    confirmation_sent BOOLEAN DEFAULT false NOT NULL,
    reminder_sent BOOLEAN DEFAULT false NOT NULL,
    reminder_scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contrainte : adresse obligatoire si prestation à domicile
    CONSTRAINT check_home_address CHECK (
        location_type != 'home' OR (location_address IS NOT NULL AND length(trim(location_address)) > 0)
    ),
    -- Contrainte : heure de fin postérieure à l'heure de début
    CONSTRAINT check_appointment_times CHECK (end_time > start_time)
);

-- ------------------------------------------------------------------------------
-- 3.5 TABLE : loyalty_transactions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points INT NOT NULL,
    transaction_type loyalty_transaction_type NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3.6 TABLE : rewards
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INT NOT NULL CHECK (points_required > 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3.7 TABLE : availability_settings (Créneaux réguliers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.availability_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Dimanche, 1 = Lundi, ...
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    CONSTRAINT check_availability_times CHECK (end_time > start_time)
);

-- ------------------------------------------------------------------------------
-- 3.8 TABLE : blocked_dates (Jours fériés, congés, indisponibilités)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    reason TEXT,
    is_full_day BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. INDEXES DE PERFORMANCE & RECHERCHE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client ON public.loyalty_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_day ON public.availability_settings(day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON public.blocked_dates(date);

-- ==============================================================================
-- 5. FONCTIONS & TRIGGERS SYSTÈME
-- ==============================================================================

-- 5.1 Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2 Création automatique du profil lors de l'inscription dans auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role, preferences)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        COALESCE((NEW.raw_user_meta_data->'preferences')::jsonb, '{}'::jsonb)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.3 Helper de vérification du rôle Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.4 Helper de vérification du rôle Staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('staff', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.5 Attribution automatique des points de fidélité lors de la complétion d'un RDV
CREATE OR REPLACE FUNCTION public.handle_appointment_completion_loyalty()
RETURNS TRIGGER AS $$
DECLARE
    v_service_price NUMERIC;
    v_service_name TEXT;
    v_points_earned INT;
    v_already_credited BOOLEAN;
BEGIN
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
        
        -- Vérification anti-doublon
        SELECT EXISTS (
            SELECT 1 
            FROM public.loyalty_transactions 
            WHERE appointment_id = NEW.id AND transaction_type = 'earned'
        ) INTO v_already_credited;

        IF v_already_credited THEN
            RETURN NEW;
        END IF;

        -- Récupération du tarif et du nom de la prestation
        SELECT price, name 
        INTO v_service_price, v_service_name
        FROM public.services
        WHERE id = NEW.service_id;

        IF v_service_price IS NOT NULL AND v_service_price > 0 THEN
            v_points_earned := FLOOR(v_service_price)::INT;

            IF v_points_earned > 0 THEN
                -- Insérer dans loyalty_transactions
                INSERT INTO public.loyalty_transactions (
                    id,
                    client_id,
                    points,
                    transaction_type,
                    appointment_id,
                    description,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    NEW.client_id,
                    v_points_earned,
                    'earned',
                    NEW.id,
                    'Points gagnés pour la prestation : ' || COALESCE(v_service_name, 'Coiffure'),
                    timezone('utc'::text, now())
                );

                -- Incrémenter le solde du client
                UPDATE public.profiles
                SET loyalty_points = loyalty_points + v_points_earned
                WHERE id = NEW.client_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_completed_loyalty ON public.appointments;
CREATE TRIGGER on_appointment_completed_loyalty
    AFTER UPDATE OR INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_appointment_completion_loyalty();

-- ==============================================================================
-- 6. ACTIVATION DU ROW LEVEL SECURITY (RLS) SUR TOUTES LES TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 7. POLITIQUES DE SÉCURITÉ RLS STRICTES
-- ==============================================================================

-- 7.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_staff());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- 7.2 SERVICES POLICIES
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage services" ON public.services;
CREATE POLICY "Only admins can manage services" ON public.services
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7.3 STAFF POLICIES
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;
CREATE POLICY "Anyone can view active staff" ON public.staff
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
CREATE POLICY "Admins can manage staff" ON public.staff
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7.4 APPOINTMENTS POLICIES
DROP POLICY IF EXISTS "Clients and staff can view their appointments" ON public.appointments;
CREATE POLICY "Clients and staff can view their appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = client_id 
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Authenticated users can create appointments for themselves" ON public.appointments;
CREATE POLICY "Authenticated users can create appointments for themselves" ON public.appointments
    FOR INSERT WITH CHECK (
        auth.uid() = client_id OR public.is_admin()
    );

DROP POLICY IF EXISTS "Clients can cancel their appointments, staff/admins can update" ON public.appointments;
CREATE POLICY "Clients can cancel their appointments, staff/admins can update" ON public.appointments
    FOR UPDATE USING (
        auth.uid() = client_id 
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR public.is_admin()
    )
    WITH CHECK (
        auth.uid() = client_id 
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Only admins can delete appointments" ON public.appointments;
CREATE POLICY "Only admins can delete appointments" ON public.appointments
    FOR DELETE USING (public.is_admin());

-- 7.5 LOYALTY TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Clients can view own loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Clients can view own loyalty transactions" ON public.loyalty_transactions
    FOR SELECT USING (auth.uid() = client_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Only admins can insert loyalty transactions" ON public.loyalty_transactions
    FOR INSERT WITH CHECK (public.is_admin());

-- 7.6 REWARDS POLICIES
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
CREATE POLICY "Anyone can view active rewards" ON public.rewards
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage rewards" ON public.rewards;
CREATE POLICY "Only admins can manage rewards" ON public.rewards
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7.7 AVAILABILITY SETTINGS POLICIES
DROP POLICY IF EXISTS "Anyone can view active availability settings" ON public.availability_settings;
CREATE POLICY "Anyone can view active availability settings" ON public.availability_settings
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage availability settings" ON public.availability_settings;
CREATE POLICY "Only admins can manage availability settings" ON public.availability_settings
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7.8 BLOCKED DATES POLICIES
DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Only admins can manage blocked dates" ON public.blocked_dates
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());
