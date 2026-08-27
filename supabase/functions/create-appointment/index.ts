import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { z } from 'https://esm.sh/zod@3.22.4';
import { corsHeaders } from '../_shared/cors.ts';

// 1. Schéma de validation Zod strict
const appointmentInputSchema = z.object({
  service_id: z.string().uuid("L'identifiant du service doit être un UUID valide"),
  staff_id: z.string().uuid("L'identifiant du coiffeur doit être un UUID valide").optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (attendu: YYYY-MM-DD)"),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Format d'heure invalide (attendu: HH:MM ou HH:MM:SS)"),
  location_type: z.enum(['home', 'salon'], {
    errorMap: () => ({ message: "Le type de lieu doit être 'home' ou 'salon'" }),
  }),
  location_address: z.string().optional().nullable(),
  notes: z.string().max(500, "Les notes ne doivent pas dépasser 500 caractères").optional().nullable(),
}).refine(
  (data) => {
    if (data.location_type === 'home') {
      return typeof data.location_address === 'string' && data.location_address.trim().length >= 5;
    }
    return true;
  },
  {
    message: "L'adresse complète du domicile est obligatoire pour une prestation à domicile (min. 5 caractères)",
    path: ['location_address'],
  }
);

serve(async (req: Request) => {
  // Gestion de la pré-requête CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTimeExecution = Date.now();
  console.log(`[create-appointment] 🚀 Nouvelle requête reçue - Méthode: ${req.method}`);

  try {
    // --------------------------------------------------------------------------
    // ÉTAPE 1 : Récupération des variables d'environnement sécurisées
    // --------------------------------------------------------------------------
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[create-appointment] ❌ Variables d’environnement manquantes sur le serveur');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incomplète' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // ÉTAPE 2 : Vérification de l'authentification JWT (Client)
    // --------------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('[create-appointment] ⚠️ En-tête Authorization manquant');
      return new Response(
        JSON.stringify({ error: 'Authentification requise. Jeton JWT manquant.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client authentifié pour valider le token utilisateur
    const userClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      console.warn(`[create-appointment] ⚠️ Jeton JWT invalide ou expiré : ${userError?.message}`);
      return new Response(
        JSON.stringify({ error: 'Session invalide ou expirée. Veuillez vous reconnecter.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-appointment] 👤 Utilisateur authentifié : ${user.id} (${user.email})`);

    // --------------------------------------------------------------------------
    // ÉTAPE 3 : Validation du corps de la requête avec Zod
    // --------------------------------------------------------------------------
    let bodyJson: any;
    try {
      bodyJson = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Format JSON invalide dans le corps de la requête' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = appointmentInputSchema.safeParse(bodyJson);
    if (!validation.success) {
      const errorFormatted = validation.error.errors.map((e) => ({
        champ: e.path.join('.'),
        message: e.message,
      }));
      console.warn('[create-appointment] ⚠️ Erreur de validation Zod :', errorFormatted);
      return new Response(
        JSON.stringify({ error: 'Données invalides', details: errorFormatted }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const input = validation.data;

    // Formatage des heures (ex: "09:30" -> "09:30:00")
    const formattedStartTime = input.start_time.length === 5 ? `${input.start_time}:00` : input.start_time;

    // Client Supabase Administrateur avec la clé service_role (côté serveur uniquement)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // --------------------------------------------------------------------------
    // ÉTAPE 4 : Récupération du service et calcul de l'heure de fin (end_time)
    // --------------------------------------------------------------------------
    const { data: service, error: serviceError } = await adminClient
      .from('services')
      .select('id, name, duration_minutes, price, is_active')
      .eq('id', input.service_id)
      .single();

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({ error: 'La prestation demandée est introuvable.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!service.is_active) {
      return new Response(
        JSON.stringify({ error: 'Cette prestation n’est plus disponible à la réservation.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcul de l'heure de fin
    const [startH, startM] = formattedStartTime.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + service.duration_minutes;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const formattedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    // --------------------------------------------------------------------------
    // ÉTAPE 5 : Vérification des dates bloquées (blocked_dates)
    // --------------------------------------------------------------------------
    const { data: blockedDate } = await adminClient
      .from('blocked_dates')
      .select('id, date, reason, is_full_day')
      .eq('date', input.date)
      .maybeSingle();

    if (blockedDate) {
      console.warn(`[create-appointment] ⛔ Date bloquée (${input.date}) : ${blockedDate.reason}`);
      return new Response(
        JSON.stringify({
          error: `Cette date est indisponible (${blockedDate.reason || 'Jour non ouvré/congés'}). Veuillez choisir une autre date.`,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // ÉTAPE 6 : Vérification des horaires ouvrés (availability_settings)
    // --------------------------------------------------------------------------
    // En JS/Deno : 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
    const targetDateObj = new Date(`${input.date}T00:00:00Z`);
    const dayOfWeek = targetDateObj.getUTCDay();

    const { data: availability, error: availError } = await adminClient
      .from('availability_settings')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (availError || !availability || !availability.is_active) {
      return new Response(
        JSON.stringify({ error: 'Aucun horaire d’ouverture n’est disponible pour ce jour de la semaine.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérification que le créneau complet [start_time, end_time] rentre dans les heures ouvrées
    if (formattedStartTime < availability.start_time || formattedEndTime > availability.end_time) {
      return new Response(
        JSON.stringify({
          error: `Le créneau (${formattedStartTime.slice(0, 5)} - ${formattedEndTime.slice(0, 5)}) dépasse les horaires ouvrés (${availability.start_time.slice(0, 5)} - ${availability.end_time.slice(0, 5)}).`,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // ÉTAPE 7 : Vérification anti-double réservation (Conflits de créneaux)
    // --------------------------------------------------------------------------
    // Condition de chevauchement : (start_time < new_end_time ET end_time > new_start_time)
    let overlapQuery = adminClient
      .from('appointments')
      .select('id, start_time, end_time, status')
      .eq('appointment_date', input.date)
      .in('status', ['pending', 'confirmed'])
      .lt('start_time', formattedEndTime)
      .gt('end_time', formattedStartTime);

    if (input.staff_id) {
      overlapQuery = overlapQuery.eq('staff_id', input.staff_id);
    }

    const { data: conflictingAppointments, error: overlapError } = await overlapQuery;

    if (overlapError) {
      console.error('[create-appointment] ❌ Erreur vérification conflits :', overlapError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification des disponibilités.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      console.warn(`[create-appointment] ⛔ Conflit détecté avec le RDV ${conflictingAppointments[0].id}`);
      return new Response(
        JSON.stringify({ error: 'Ce créneau horaire est déjà réservé. Veuillez en choisir un autre.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // ÉTAPE 8 : Calcul de la planification du rappel (24 heures avant)
    // --------------------------------------------------------------------------
    const appointmentDateTime = new Date(`${input.date}T${formattedStartTime}Z`);
    const reminderScheduledDate = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    const reminderScheduledAt = reminderScheduledDate.toISOString();

    // --------------------------------------------------------------------------
    // ÉTAPE 9 : Insertion du rendez-vous dans la table appointments
    // --------------------------------------------------------------------------
    const newAppointmentPayload = {
      client_id: user.id,
      service_id: input.service_id,
      staff_id: input.staff_id || null,
      appointment_date: input.date,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      status: 'pending',
      location_type: input.location_type,
      location_address: input.location_address || null,
      notes: input.notes || null,
      confirmation_sent: false,
      reminder_sent: false,
      reminder_scheduled_at: reminderScheduledAt,
    };

    const { data: createdAppointment, error: insertError } = await adminClient
      .from('appointments')
      .insert(newAppointmentPayload)
      .select(`
        *,
        services (id, name, price, duration_minutes, category),
        profiles (id, full_name, email, phone)
      `)
      .single();

    if (insertError || !createdAppointment) {
      console.error('[create-appointment] ❌ Erreur insertion rendez-vous :', insertError);
      return new Response(
        JSON.stringify({ error: `Échec lors de la création du rendez-vous : ${insertError?.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-appointment] ✅ Rendez-vous créé avec succès - ID: ${createdAppointment.id}`);

    // --------------------------------------------------------------------------
    // ÉTAPE 10 : Déclenchement de l'Edge Function d'envoi d'email de confirmation
    // --------------------------------------------------------------------------
    try {
      const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-confirmation-email`;
      fetch(emailFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({
          appointment_id: createdAppointment.id,
          client_email: user.email,
          client_name: createdAppointment.profiles?.full_name || user.email,
          service_name: service.name,
          service_price: service.price,
          appointment_date: input.date,
          start_time: formattedStartTime,
          location_type: input.location_type,
          location_address: input.location_address,
        }),
      }).catch((err) => {
        console.error('[create-appointment] ⚠️ Erreur asynchrone appel send-confirmation-email :', err.message);
      });
    } catch (emailErr: any) {
      console.warn('[create-appointment] ⚠️ Notification email non bloquante :', emailErr.message);
    }

    // --------------------------------------------------------------------------
    // SORTIE : Détails du rendez-vous créé
    // --------------------------------------------------------------------------
    const executionDuration = Date.now() - startTimeExecution;
    console.log(`[create-appointment] ⏱️ Requête traitée en ${executionDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Rendez-vous créé avec succès. Un email de confirmation vous a été envoyé.',
        appointment: createdAppointment,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (globalError: any) {
    console.error('[create-appointment] 💥 Erreur inattendue serveur :', globalError);
    return new Response(
      JSON.stringify({
        error: 'Une erreur interne est survenue lors de la réservation.',
        details: globalError.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
