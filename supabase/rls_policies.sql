-- ==============================================================================
-- SUPABASE : ACTIVATION ET POLITIQUES RLS DÉTAILLÉES (Row Level Security)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ACTIVATION DE RLS SUR TOUTES LES TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. FONCTION HELPER ADMIN (SECURITY DEFINER pour éviter la récursion RLS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (role = 'admin')
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 3. POLITIQUES RLS PAR TABLE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 3.1 TABLE : profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles: select own profile or admin" ON public.profiles;
CREATE POLICY "Profiles: select own profile or admin"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Profiles: update own profile or admin" ON public.profiles;
CREATE POLICY "Profiles: update own profile or admin"
    ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        auth.uid() = id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Profiles: insert own profile or admin" ON public.profiles;
CREATE POLICY "Profiles: insert own profile or admin"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Profiles: delete admin only" ON public.profiles;
CREATE POLICY "Profiles: delete admin only"
    ON public.profiles
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ------------------------------------------------------------------------------
-- 3.2 TABLE : services
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Services: select public" ON public.services;
CREATE POLICY "Services: select public"
    ON public.services
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Services: insert admin only" ON public.services;
CREATE POLICY "Services: insert admin only"
    ON public.services
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Services: update admin only" ON public.services;
CREATE POLICY "Services: update admin only"
    ON public.services
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Services: delete admin only" ON public.services;
CREATE POLICY "Services: delete admin only"
    ON public.services
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ------------------------------------------------------------------------------
-- 3.3 TABLE : staff
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff: select public" ON public.staff;
CREATE POLICY "Staff: select public"
    ON public.staff
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Staff: insert admin only" ON public.staff;
CREATE POLICY "Staff: insert admin only"
    ON public.staff
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Staff: update admin only" ON public.staff;
CREATE POLICY "Staff: update admin only"
    ON public.staff
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Staff: delete admin only" ON public.staff;
CREATE POLICY "Staff: delete admin only"
    ON public.staff
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ------------------------------------------------------------------------------
-- 3.4 TABLE : appointments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Appointments: select client, assigned staff or admin" ON public.appointments;
CREATE POLICY "Appointments: select client, assigned staff or admin"
    ON public.appointments
    FOR SELECT
    USING (
        auth.uid() = client_id
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Appointments: insert authenticated clients or admin" ON public.appointments;
CREATE POLICY "Appointments: insert authenticated clients or admin"
    ON public.appointments
    FOR INSERT
    WITH CHECK (
        auth.uid() = client_id
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Appointments: update client cancellation, staff or admin" ON public.appointments;
CREATE POLICY "Appointments: update client cancellation, staff or admin"
    ON public.appointments
    FOR UPDATE
    USING (
        auth.uid() = client_id
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (
            auth.uid() = client_id 
            AND status = 'cancelled'
        )
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Appointments: delete admin only" ON public.appointments;
CREATE POLICY "Appointments: delete admin only"
    ON public.appointments
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ------------------------------------------------------------------------------
-- 3.5 TABLE : loyalty_transactions
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Loyalty: select client own transactions or admin" ON public.loyalty_transactions;
CREATE POLICY "Loyalty: select client own transactions or admin"
    ON public.loyalty_transactions
    FOR SELECT
    USING (
        auth.uid() = client_id
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Loyalty: insert admin only" ON public.loyalty_transactions;
CREATE POLICY "Loyalty: insert admin only"
    ON public.loyalty_transactions
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Loyalty: update admin only" ON public.loyalty_transactions;
CREATE POLICY "Loyalty: update admin only"
    ON public.loyalty_transactions
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Loyalty: delete admin only" ON public.loyalty_transactions;
CREATE POLICY "Loyalty: delete admin only"
    ON public.loyalty_transactions
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ------------------------------------------------------------------------------
-- 3.6 TABLE : rewards
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Rewards: select public" ON public.rewards;
CREATE POLICY "Rewards: select public"
    ON public.rewards
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Rewards: insert admin only" ON public.rewards;
CREATE POLICY "Rewards: insert admin only"
    ON public.rewards
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Rewards: update admin only" ON public.rewards;
CREATE POLICY "Rewards: update admin only"
    ON public.rewards
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Rewards: delete admin only" ON public.rewards;
CREATE POLICY "Rewards: delete admin only"
    ON public.rewards
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ------------------------------------------------------------------------------
-- 3.7 TABLE : availability_settings
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Availability: select public" ON public.availability_settings;
CREATE POLICY "Availability: select public"
    ON public.availability_settings
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Availability: insert admin only" ON public.availability_settings;
CREATE POLICY "Availability: insert admin only"
    ON public.availability_settings
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Availability: update admin only" ON public.availability_settings;
CREATE POLICY "Availability: update admin only"
    ON public.availability_settings
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Availability: delete admin only" ON public.availability_settings;
CREATE POLICY "Availability: delete admin only"
    ON public.availability_settings
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- ------------------------------------------------------------------------------
-- 3.8 TABLE : blocked_dates
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Blocked dates: select public" ON public.blocked_dates;
CREATE POLICY "Blocked dates: select public"
    ON public.blocked_dates
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Blocked dates: insert admin only" ON public.blocked_dates;
CREATE POLICY "Blocked dates: insert admin only"
    ON public.blocked_dates
    FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Blocked dates: update admin only" ON public.blocked_dates;
CREATE POLICY "Blocked dates: update admin only"
    ON public.blocked_dates
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Blocked dates: delete admin only" ON public.blocked_dates;
CREATE POLICY "Blocked dates: delete admin only"
    ON public.blocked_dates
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
