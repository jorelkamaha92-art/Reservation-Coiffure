import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[send-reminder] ⏰ Démarrage de l\'exécution du Cron de rappel (J+1)...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const cronSecret = Deno.env.get('CRON_SECRET');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

    // 1. Vérification de sécurité (CRON_SECRET ou Service Role Bearer Token)
    const authHeader = req.headers.get('Authorization') || '';
    const customSecretHeader = req.headers.get('x-cron-secret') || '';
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret') || '';

    const providedToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    const isServiceRole = providedToken === supabaseServiceRoleKey;
    const isCronSecretValid = cronSecret && (providedToken === cronSecret || customSecretHeader === cronSecret || querySecret === cronSecret);

    if (cronSecret && !isServiceRole && !isCronSecretValid) {
      console.warn('[send-reminder] 🚫 Tentative d\'accès non autorisée au Cron de rappel.');
      return new Response(
        JSON.stringify({ error: 'Non autorisé : secret cron invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration Supabase incomplète' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // 2. Calcul de la date cible : Jour actuel + 1 jour (J+1)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDateStr = tomorrow.toISOString().split('T')[0]; // Format 'YYYY-MM-DD'
    const nowIso = new Date().toISOString();

    console.log(`[send-reminder] 📅 Recherche des rendez-vous du ${targetDateStr} (rappel J-1)`);

    // 3. Récupération des RDVs confirmés ou en attente non encore notifiés pour demain
    const { data: appointmentsToRemind, error: fetchError } = await adminClient
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        location_type,
        location_address,
        status,
        reminder_sent,
        services (id, name, price, duration_minutes),
        staff (full_name, specialty),
        profiles (id, full_name, email, phone)
      `)
      .in('status', ['confirmed', 'pending'])
      .eq('reminder_sent', false)
      .eq('appointment_date', targetDateStr);

    if (fetchError) {
      console.error('[send-reminder] ❌ Erreur Supabase lors de la recherche des RDVs :', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointmentsToRemind || appointmentsToRemind.length === 0) {
      console.log(`[send-reminder] ℹ️ Aucun rendez-vous nécessitant un rappel pour le ${targetDateStr}.`);
      return new Response(
        JSON.stringify({
          success: true,
          target_date: targetDateStr,
          processed_count: 0,
          message: 'Aucun rappel en attente pour demain',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-reminder] 📋 ${appointmentsToRemind.length} rendez-vous trouvés pour le ${targetDateStr}.`);

    const results = [];

    // 4. Envoi des notifications de rappel pour chaque rendez-vous
    for (const app of appointmentsToRemind) {
      const clientProfile = app.profiles as any;
      const service = app.services as any;
      const staff = app.staff as any;

      const clientEmail = clientProfile?.email;
      const clientName = clientProfile?.full_name || 'Chère Cliente';
      const clientPhone = clientProfile?.phone;
      const serviceName = service?.name || 'Prestation de Coiffure';
      const servicePrice = service?.price || 0;
      const startTime = app.start_time.slice(0, 5);
      const staffName = staff?.full_name || 'Cindy Malorie';
      const isHome = app.location_type === 'home';
      const locationText = isHome
        ? `À votre domicile (${app.location_address || 'Adresse renseignée'})`
        : 'Au Studio Privé';

      let emailSent = false;
      let smsSent = false;

      // 4.1 Envoi par Email HTML (Resend)
      if (clientEmail && resendApiKey) {
        try {
          const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Cindy Malorie Coiffure <notifications@cindymalorie.com>';
          const reminderHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f5; margin: 0; padding: 24px; color: #1c1917; }
                .container { max-width: 580px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .header { background: #1c1917; color: #ffffff; padding: 28px; text-align: center; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #f59e0b; color: #000000; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                .content { padding: 28px; font-size: 14px; line-height: 1.6; }
                .card { background: #fafaf9; border-radius: 12px; border: 1px solid #e7e5e4; padding: 20px; margin: 20px 0; }
                .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0eeeb; font-size: 13px; }
                .row:last-child { border-bottom: none; }
                .btn { display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background: #1c1917; color: #ffffff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 13px; margin-top: 15px; }
                .footer { background: #fafaf9; border-top: 1px solid #e7e5e4; padding: 18px; text-align: center; font-size: 11px; color: #78716c; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <span class="badge">⏰ Rappel Rendez-vous J-1</span>
                  <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #f59e0b;">Cindy Malorie</h1>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #a8a29e;">Coiffure Privée & à Domicile (Italie)</p>
                </div>

                <div class="content">
                  <p>Bonjour <strong>${clientName}</strong>,</p>
                  <p>Nous vous rappelons avec plaisir votre rendez-vous de coiffure prévu <strong>demain, le ${targetDateStr}</strong>.</p>

                  <div class="card">
                    <div class="row">
                      <span style="color: #78716c;">Prestation</span>
                      <strong>${serviceName}</strong>
                    </div>
                    <div class="row">
                      <span style="color: #78716c;">Date</span>
                      <strong>${targetDateStr}</strong>
                    </div>
                    <div class="row">
                      <span style="color: #78716c;">Heure de début</span>
                      <strong style="color: #d97706;">${startTime}</strong>
                    </div>
                    <div class="row">
                      <span style="color: #78716c;">Lieu</span>
                      <span>${locationText}</span>
                    </div>
                    <div class="row">
                      <span style="color: #78716c;">Artisan Styliste</span>
                      <strong>${staffName}</strong>
                    </div>
                    <div class="row">
                      <span style="color: #78716c;">Montant</span>
                      <strong>${servicePrice} €</strong>
                    </div>
                  </div>

                  <p style="font-size: 13px; color: #57534e;">
                    💡 <em>Pour les prestations à domicile : Cindy arrive avec l'ensemble du matériel professionnel requis (bacs, serviettes, coiffants et protections).</em>
                  </p>

                  <p style="font-size: 12px; color: #78716c;">
                    Une question ou un empêchement de dernière minute ? Contactez Cindy directement au <strong>+39 351 269 7743</strong> (WhatsApp).
                  </p>
                </div>

                <div class="footer">
                  <p style="margin: 0;">Cindy Malorie • Coiffure Privée & Déplacements en Italie</p>
                  <p style="margin: 4px 0 0 0;">Email : cindytchamabekamaha@gmail.com • Tél : +39 351 269 7743</p>
                </div>
              </div>
            </body>
            </html>
          `;

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [clientEmail],
              subject: `⏰ Rappel : Votre rendez-vous coiffure avec Cindy Malorie demain à ${startTime}`,
              html: reminderHtml,
            }),
          });

          if (emailRes.ok) emailSent = true;
        } catch (emailErr: any) {
          console.error(`[send-reminder] ❌ Erreur envoi email RDV ${app.id} :`, emailErr.message);
        }
      }

      // 4.2 Envoi par SMS (Twilio optionnel)
      if (clientPhone && twilioAccountSid && twilioAuthToken && twilioFromNumber) {
        try {
          const smsText = `Bonjour ${clientName}, rappel de votre RDV de coiffure avec Cindy Malorie demain (${targetDateStr}) à ${startTime}. Lieu : ${locationText}. Contact WhatsApp : +39 351 269 7743.`;
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const authString = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

          const formBody = new URLSearchParams();
          formBody.append('From', twilioFromNumber);
          formBody.append('To', clientPhone);
          formBody.append('Body', smsText);

          const smsRes = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString(),
          });

          if (smsRes.ok) smsSent = true;
        } catch (smsErr: any) {
          console.warn(`[send-reminder] ⚠️ Erreur SMS RDV ${app.id} :`, smsErr.message);
        }
      }

      // 4.3 Mise à jour du statut dans la table appointments : reminder_sent = true
      const { error: updateError } = await adminClient
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', app.id);

      if (updateError) {
        console.error(`[send-reminder] ❌ Erreur update reminder_sent pour RDV ${app.id} :`, updateError);
      }

      results.push({
        appointment_id: app.id,
        client: clientName,
        email: clientEmail,
        date: app.appointment_date,
        time: startTime,
        email_sent: emailSent,
        sms_sent: smsSent,
        reminder_sent_updated: !updateError,
      });

      console.log(`[send-reminder] ✅ Rappel validé pour ${clientName} (${app.id})`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        target_date: targetDateStr,
        processed_count: results.length,
        appointments: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[send-reminder] 💥 Erreur inattendue :', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
