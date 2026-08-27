import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[cancel-appointment] 🛑 Demande d’annulation de rendez-vous reçue');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incomplète' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Authentification JWT de l'utilisateur
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

    // 2. Récupération des données
    const body = await req.json();
    const { appointment_id, reason } = body;

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id est obligatoire' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // 3. Vérification de la propriété du rendez-vous
    const { data: appointment, error: fetchError } = await adminClient
      .from('appointments')
      .select('id, client_id, status, appointment_date, start_time')
      .eq('id', appointment_id)
      .single();

    if (fetchError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Rendez-vous introuvable.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si le client est bien le propriétaire (ou s'il est admin)
    if (appointment.client_id !== user.id) {
      // Vérifier si l'utilisateur a le rôle admin
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin' && profile?.role !== 'staff') {
        return new Response(
          JSON.stringify({ error: 'Action non autorisée. Vous n’êtes pas le propriétaire de ce rendez-vous.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (appointment.status === 'completed') {
      return new Response(
        JSON.stringify({ error: 'Impossible d’annuler un rendez-vous déjà réalisé.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (appointment.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Ce rendez-vous est déjà annulé.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Mise à jour du statut en 'cancelled'
    const { data: updatedAppointment, error: updateError } = await adminClient
      .from('appointments')
      .update({
        status: 'cancelled',
        notes: reason ? `[Annulé par le client : ${reason}]` : '[Annulé par le client]',
      })
      .eq('id', appointment_id)
      .select('*, services (*)')
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Erreur lors de l'annulation : ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[cancel-appointment] ✅ Rendez-vous ${appointment_id} annulé avec succès par l'utilisateur ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Le rendez-vous a bien été annulé.',
        appointment: updatedAppointment,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[cancel-appointment] ❌ Erreur :', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
