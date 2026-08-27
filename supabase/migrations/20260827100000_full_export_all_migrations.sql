-- ==============================================================================
-- EXPORT COMPLET SUPABASE : TOUTES LES MIGRATIONS EN UN SEUL FICHIER
-- Projet : Cindy Malorie Coiffure Privée
-- Compatible SQL Editor Supabase
-- ==============================================================================

-- ==============================================================================
-- SECTION 1 : EXTENSIONS & TYPES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- ==============================================================================
-- SECTION 2 : TABLES & CONTRAINTES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    loyalty_points INT DEFAULT 0 NOT NULL CHECK (loyalty_points >= 0),
    role TEXT DEFAULT 'client' NOT NULL CHECK (role IN ('client', 'staff', 'admin')),
    preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    
    CONSTRAINT check_home_address CHECK (
        location_type != 'home' OR (location_address IS NOT NULL AND length(trim(location_address)) > 0)
    ),
    CONSTRAINT check_appointment_times CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points INT NOT NULL,
    transaction_type loyalty_transaction_type NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INT NOT NULL CHECK (points_required > 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.availability_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    CONSTRAINT check_availability_times CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    reason TEXT,
    is_full_day BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- SECTION 3 : INDEXES DE PERFORMANCE
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
-- SECTION 4 : TRIGGERS SYSTÈME & FIDÉLITÉ
-- ==============================================================================

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

CREATE OR REPLACE FUNCTION public.handle_appointment_completion_loyalty()
RETURNS TRIGGER AS $$
DECLARE
    v_service_price NUMERIC;
    v_service_name TEXT;
    v_points_earned INT;
    v_already_credited BOOLEAN;
BEGIN
    IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
        
        SELECT EXISTS (
            SELECT 1 
            FROM public.loyalty_transactions 
            WHERE appointment_id = NEW.id AND transaction_type = 'earned'
        ) INTO v_already_credited;

        IF v_already_credited THEN
            RETURN NEW;
        END IF;

        SELECT price, name 
        INTO v_service_price, v_service_name
        FROM public.services
        WHERE id = NEW.service_id;

        IF v_service_price IS NOT NULL AND v_service_price > 0 THEN
            v_points_earned := FLOOR(v_service_price)::INT;

            IF v_points_earned > 0 THEN
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
-- SECTION 5 : SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('staff', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage services" ON public.services;
CREATE POLICY "Only admins can manage services" ON public.services
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;
CREATE POLICY "Anyone can view active staff" ON public.staff
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
CREATE POLICY "Admins can manage staff" ON public.staff
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

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

DROP POLICY IF EXISTS "Clients can view own loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Clients can view own loyalty transactions" ON public.loyalty_transactions
    FOR SELECT USING (auth.uid() = client_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Only admins can insert loyalty transactions" ON public.loyalty_transactions
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
CREATE POLICY "Anyone can view active rewards" ON public.rewards
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage rewards" ON public.rewards;
CREATE POLICY "Only admins can manage rewards" ON public.rewards
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active availability settings" ON public.availability_settings;
CREATE POLICY "Anyone can view active availability settings" ON public.availability_settings
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage availability settings" ON public.availability_settings;
CREATE POLICY "Only admins can manage availability settings" ON public.availability_settings
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Only admins can manage blocked dates" ON public.blocked_dates
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- SECTION 6 : DONNÉES INITIALES (SEED DATA)
-- ==============================================================================

INSERT INTO public.services (id, name, description, duration_minutes, price, category, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Stitch braid with cross', 'Tresses stitch haute précision avec motif géométrique en croix sur le dessus. Tracés nets et finitions soignées.', 150, 50.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000002', 'Stitch braids', 'Tresses stitch droites et soignées avec séparations nettes et contours impeccables. Confort et tenue longue durée.', 105, 60.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000003', 'Knotless braids', 'Longues tresses sans nœuds fluides et ultra-légères. Mèches rouge vif dégradées, aucune traction sur le cuir chevelu.', 195, 95.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000004', 'Cornrows', 'Tresses plaquées traditionnelles régulières avec finitions attachées en chignons élégants à l’arrière de la tête.', 90, 45.00, 'Tresses & Braids', true),
('a0000000-0000-0000-0000-000000000005', 'Coupe Femme & Brushing', 'Diagnostic personnalisé, shampoing traitant, coupe sur-mesure et brushing éclat haute tenue.', 60, 45.00, 'Femme', true),
('a0000000-0000-0000-0000-000000000006', 'Coupe Homme & Soin Barbe', 'Coupe aux ciseaux et tondeuse, finitions rasoir, taille de barbe et serviette chaude.', 45, 30.00, 'Homme', true),
('a0000000-0000-0000-0000-000000000007', 'Balayage Signature & Patine', 'Éclaircissement naturel sur-mesure avec patine neutralisante et masque reconstructeur.', 120, 95.00, 'Technique', true),
('a0000000-0000-0000-0000-000000000008', 'Soin Botox Capillaire & Massage', 'Soin reconstructeur profond à la kératine et acide hyaluronique pour un effet miroir.', 60, 55.00, 'Soin', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price,
  category = EXCLUDED.category;

INSERT INTO public.staff (id, full_name, specialty, bio, avatar_url, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'Cindy Malorie', 'Spécialiste Braids, Tresses Artistiques & Soins Capillaires', 'Artisan coiffeuse styliste à Pavia (Via Francana 10) et à domicile en Lombardie. Plus de 100K abonnés sur TikTok (@cindymalorie).', '/images/hairstyles/stitch-braid-cross.png', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  specialty = EXCLUDED.specialty,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url;

INSERT INTO public.rewards (id, name, description, points_required, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'Soin hydratant express offert', 'Un soin réparateur express aux huiles végétales offert lors de votre prochain rendez-vous.', 50, true),
('c0000000-0000-0000-0000-000000000002', 'Remise immédiate de 10 €', 'Bénéficiez de 10 € de déduction sur la prestation ou le modèle de tresse de votre choix.', 100, true),
('c0000000-0000-0000-0000-000000000003', 'Shampoing traitant & Brushing Offert', 'Un rituel de lavage et brushing éclat offert en studio ou à domicile.', 150, true),
('c0000000-0000-0000-0000-000000000004', 'Prestation complète offerte', 'Votre coupe, coiffure tressée ou soin botox entièrement offert.', 250, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  points_required = EXCLUDED.points_required;

INSERT INTO public.availability_settings (day_of_week, start_time, end_time, is_active) VALUES
(1, '09:00:00', '19:00:00', true),
(2, '09:00:00', '19:00:00', true),
(3, '09:00:00', '19:00:00', true),
(4, '09:00:00', '19:00:00', true),
(5, '09:00:00', '19:00:00', true),
(6, '09:00:00', '18:00:00', true),
(0, '10:00:00', '14:00:00', false);

INSERT INTO public.blocked_dates (id, date, reason, is_full_day) VALUES
('d0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '14 days', 'Formation Masterclass Braids & Tresses Artistiques', true),
('d0000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '21 days', 'Jour férié (Festa Nazionale)', true)
ON CONFLICT (id) DO NOTHING;
