import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[redeem-loyalty-points] 🎁 Demande d’échange de points reçue');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration serveur manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Authentification JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentification requise.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Session invalide ou expirée.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Récupération du corps de requête
    const body = await req.json();
    const { reward_id } = body;

    if (!reward_id) {
      return new Response(
        JSON.stringify({ error: 'reward_id est obligatoire' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // 3. Récupérer la récompense demandée
    const { data: reward, error: rewardError } = await adminClient
      .from('rewards')
      .select('id, name, description, points_required, is_active')
      .eq('id', reward_id)
      .single();

    if (rewardError || !reward) {
      return new Response(
        JSON.stringify({ error: 'Récompense introuvable.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reward.is_active) {
      return new Response(
        JSON.stringify({ error: 'Cette récompense n’est plus active.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Récupérer le solde de points actuel du client
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, full_name, email, loyalty_points')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profil client introuvable.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentPoints = profile.loyalty_points || 0;

    if (currentPoints < reward.points_required) {
      return new Response(
        JSON.stringify({
          error: `Solde insuffisant. Vous avez ${currentPoints} points, mais cette récompense en nécessite ${reward.points_required}.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Débiter les points du profil
    const newBalance = currentPoints - reward.points_required;
    const { error: updateProfileError } = await adminClient
      .from('profiles')
      .update({ loyalty_points: newBalance })
      .eq('id', user.id);

    if (updateProfileError) {
      return new Response(
        JSON.stringify({ error: 'Échec de mise à jour du solde de points.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Enregistrer la transaction dans loyalty_transactions
    const { error: txError } = await adminClient
      .from('loyalty_transactions')
      .insert({
        client_id: user.id,
        points: -reward.points_required,
        transaction_type: 'redeemed',
        description: `Échange récompense : ${reward.name}`,
      });

    if (txError) {
      console.warn('[redeem-loyalty-points] ⚠️ Transaction log failed:', txError.message);
    }

    console.log(`[redeem-loyalty-points] ✅ ${reward.points_required} points échangés par ${user.id} pour "${reward.name}"`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Félicitations ! Vous avez échangé la récompense "${reward.name}".`,
        new_balance: newBalance,
        reward_name: reward.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[redeem-loyalty-points] ❌ Erreur :', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
