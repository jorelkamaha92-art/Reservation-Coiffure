-- ==============================================================================
-- MIGRATION 02 : POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS) ANTI-RÉCURSION
-- ==============================================================================

-- 1. Helper functions SECURITY DEFINER avec search_path fixé
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('staff', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- 2. Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- 3. Profiles Policies
DROP POLICY IF EXISTS "Profiles: select own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insert own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: delete admin only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or staff view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or staff view all"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id OR public.is_staff());

CREATE POLICY "Users can update own profile or admin update all"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can delete profiles"
    ON public.profiles
    FOR DELETE
    USING (public.is_admin());

-- 4. Services Policies
DROP POLICY IF EXISTS "Services: select public" ON public.services;
DROP POLICY IF EXISTS "Services: insert admin only" ON public.services;
DROP POLICY IF EXISTS "Services: update admin only" ON public.services;
DROP POLICY IF EXISTS "Services: delete admin only" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Only admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "Anyone can view active services"
    ON public.services
    FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert services"
    ON public.services
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update services"
    ON public.services
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete services"
    ON public.services
    FOR DELETE
    USING (public.is_admin());

-- 5. Staff Policies
DROP POLICY IF EXISTS "Staff: select public" ON public.staff;
DROP POLICY IF EXISTS "Staff: insert admin only" ON public.staff;
DROP POLICY IF EXISTS "Staff: update admin only" ON public.staff;
DROP POLICY IF EXISTS "Staff: delete admin only" ON public.staff;
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;

CREATE POLICY "Anyone can view active staff"
    ON public.staff
    FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage staff"
    ON public.staff
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Appointments Policies
DROP POLICY IF EXISTS "Appointments: client select own or staff/admin" ON public.appointments;
DROP POLICY IF EXISTS "Appointments: client insert own" ON public.appointments;
DROP POLICY IF EXISTS "Appointments: update own or staff/admin" ON public.appointments;
DROP POLICY IF EXISTS "Appointments: delete admin only" ON public.appointments;
DROP POLICY IF EXISTS "Clients and staff can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can create appointments for themselves" ON public.appointments;
DROP POLICY IF EXISTS "Clients can cancel their appointments, staff/admins can update" ON public.appointments;
DROP POLICY IF EXISTS "Clients and staff can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Only admins can delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

CREATE POLICY "Clients and staff can view their appointments"
    ON public.appointments
    FOR SELECT
    USING (
        auth.uid() = client_id 
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Authenticated users can create appointments for themselves"
    ON public.appointments
    FOR INSERT
    WITH CHECK (
        auth.uid() = client_id OR public.is_admin()
    );

CREATE POLICY "Clients and staff can update appointments"
    ON public.appointments
    FOR UPDATE
    USING (
        auth.uid() = client_id 
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR public.is_admin()
    )
    WITH CHECK (
        auth.uid() = client_id 
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Admins can delete appointments"
    ON public.appointments
    FOR DELETE
    USING (public.is_admin());

-- 7. Loyalty Transactions Policies
DROP POLICY IF EXISTS "Loyalty: client select own" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Loyalty: insert system or admin" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Clients can view own loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Only admins can insert loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Admins can insert loyalty transactions" ON public.loyalty_transactions;

CREATE POLICY "Clients can view own loyalty transactions"
    ON public.loyalty_transactions
    FOR SELECT
    USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Admins can insert loyalty transactions"
    ON public.loyalty_transactions
    FOR INSERT
    WITH CHECK (public.is_admin());

-- 8. Rewards Policies
DROP POLICY IF EXISTS "Rewards: select public" ON public.rewards;
DROP POLICY IF EXISTS "Rewards: admin manage" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Only admins can manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;

CREATE POLICY "Anyone can view active rewards"
    ON public.rewards
    FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage rewards"
    ON public.rewards
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. Availability Settings Policies
DROP POLICY IF EXISTS "Availability: select public" ON public.availability_settings;
DROP POLICY IF EXISTS "Availability: admin manage" ON public.availability_settings;
DROP POLICY IF EXISTS "Anyone can view active availability settings" ON public.availability_settings;
DROP POLICY IF EXISTS "Only admins can manage availability settings" ON public.availability_settings;
DROP POLICY IF EXISTS "Admins can manage availability settings" ON public.availability_settings;

CREATE POLICY "Anyone can view active availability settings"
    ON public.availability_settings
    FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage availability settings"
    ON public.availability_settings
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. Blocked Dates Policies
DROP POLICY IF EXISTS "BlockedDates: select public" ON public.blocked_dates;
DROP POLICY IF EXISTS "BlockedDates: admin manage" ON public.blocked_dates;
DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Only admins can manage blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON public.blocked_dates;

CREATE POLICY "Anyone can view blocked dates"
    ON public.blocked_dates
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage blocked dates"
    ON public.blocked_dates
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
