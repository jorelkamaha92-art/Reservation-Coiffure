/**
 * Endpoint Vercel Cron Job : /api/cron/send-reminders
 * 
 * Exécuté quotidiennement à 08h00 UTC par Vercel Cron.
 * Sécurisé par le header d'autorisation 'Authorization: Bearer <CRON_SECRET>'.
 */
export default async function handler(req: any, res: any) {
  // 1. Uniquement requêtes GET ou POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez GET ou POST.' });
  }

  // 2. Sécurité : Vérification du secret partagé CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (cronSecret) {
    const expectedHeader = `Bearer ${cronSecret}`;
    if (authHeader !== expectedHeader) {
      console.warn('[Vercel Cron] 🚫 Requête rejetée : Header d\'autorisation CRON_SECRET invalide.');
      return res.status(401).json({
        error: 'Non autorisé : Secret Cron invalide ou manquant.',
      });
    }
  }

  console.log('[Vercel Cron] ⏰ Déclenchement automatique du rappel des rendez-vous (J+1)...');

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[Vercel Cron] ❌ Variables Supabase manquantes.');
      return res.status(500).json({ error: 'Configuration Supabase incomplète côté serveur' });
    }

    // 3. Appel de l'Edge Function Supabase 'send-reminder'
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-reminder`;
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'x-cron-secret': cronSecret || '',
      },
      body: JSON.stringify({
        triggered_by: 'vercel-cron',
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Vercel Cron] ❌ Échec de l\'Edge Function :', data);
      return res.status(response.status).json({
        error: 'Erreur lors de l\'exécution du rappel',
        details: data,
      });
    }

    console.log('[Vercel Cron] ✅ Rappels envoyés avec succès :', data);

    return res.status(200).json({
      success: true,
      execution_time: new Date().toISOString(),
      result: data,
    });

  } catch (error: any) {
    console.error('[Vercel Cron] 💥 Erreur serveur inattendue :', error);
    return res.status(500).json({
      error: 'Erreur interne lors de l\'exécution du cron',
      message: error.message,
    });
  }
}
