-- ==============================================================================
-- PLANIFICATION CRON SUPABASE : ENVOI AUTOMATIQUE DES RAPPELS QUOTIDIENS (J-1)
-- Exécution quotidienne à 08h00 UTC via pg_cron & pg_net
-- ==============================================================================

-- 1. Activation des extensions nécessaires dans Supabase
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Configuration du Job Cron Quotidien à 08h00 (0 8 * * *)
-- Appel sécurisé de l'Edge Function Supabase 'send-reminder' avec le secret partagé
SELECT cron.schedule(
    'daily-appointment-reminders-8am',
    '0 8 * * *', -- Tous les jours à 08:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/send-reminder',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer [VOTRE_CRON_SECRET_OU_SERVICE_ROLE_KEY]',
                'x-cron-secret', '[VOTRE_CRON_SECRET]'
            ),
            body := jsonb_build_object(
                'source', 'supabase_pg_cron',
                'executed_at', NOW()
            )
        ) AS request_id;
    $$
);

-- ==============================================================================
-- REQUÊTES UTILES POUR CONTRÔLER LE CRON SUPABASE :
-- ==============================================================================

-- Pour voir les jobs programmés :
-- SELECT * FROM cron.job;

-- Pour voir l'historique d'exécution des crons :
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Pour supprimer ou reprogrammer le job :
-- SELECT cron.unschedule('daily-appointment-reminders-8am');
