-- ==============================================================================
-- MIGRATION 02 : POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Helper functions
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

-- 4. Services Policies
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage services" ON public.services;
CREATE POLICY "Only admins can manage services" ON public.services
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Staff Policies
DROP POLICY IF EXISTS "Anyone can view active staff" ON public.staff;
CREATE POLICY "Anyone can view active staff" ON public.staff
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
CREATE POLICY "Admins can manage staff" ON public.staff
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Appointments Policies
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

-- 7. Loyalty Transactions Policies
DROP POLICY IF EXISTS "Clients can view own loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Clients can view own loyalty transactions" ON public.loyalty_transactions
    FOR SELECT USING (auth.uid() = client_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Only admins can insert loyalty transactions" ON public.loyalty_transactions
    FOR INSERT WITH CHECK (public.is_admin());

-- 8. Rewards Policies
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
CREATE POLICY "Anyone can view active rewards" ON public.rewards
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage rewards" ON public.rewards;
CREATE POLICY "Only admins can manage rewards" ON public.rewards
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. Availability Settings Policies
DROP POLICY IF EXISTS "Anyone can view active availability settings" ON public.availability_settings;
CREATE POLICY "Anyone can view active availability settings" ON public.availability_settings
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage availability settings" ON public.availability_settings;
CREATE POLICY "Only admins can manage availability settings" ON public.availability_settings
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. Blocked Dates Policies
DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Only admins can manage blocked dates" ON public.blocked_dates
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());
