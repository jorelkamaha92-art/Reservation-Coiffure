-- ==============================================================================
-- MIGRATION 03 : PROGRAMME DE FIDÉLITÉ AUTOMATIQUE
-- ==============================================================================

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
