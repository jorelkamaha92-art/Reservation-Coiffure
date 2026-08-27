-- ==============================================================================
-- MIGRATION 05 : PLANIFICATION AUTOMATIQUE DES RAPPELS (PG_CRON & PG_NET)
-- ==============================================================================

-- 1. Extensions nécessaires pour le déclenchement périodique
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Suppression de l'ancienne tâche si existante
SELECT cron.unschedule('daily-appointment-reminders') 
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-appointment-reminders'
);

-- 3. Planification quotidienne à 08h00 UTC
-- Note : L'Edge Function est également déclenchée par Vercel Cron via /api/cron/send-reminders
SELECT cron.schedule(
    'daily-appointment-reminders',
    '0 8 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/send-reminder',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        ),
        body := jsonb_build_object(
            'scheduled_by', 'pg_cron',
            'timestamp', now()
        )
    );
    $$
);
