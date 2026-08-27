import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';
import { generateCancellationSignature } from '../_shared/token.ts';

interface ConfirmationEmailPayload {
  appointment_id: string;
  client_email: string;
  client_name: string;
  service_name: string;
  service_price: number | string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM ou HH:MM:SS
  location_type: 'home' | 'salon';
  location_address?: string | null;
}

// Générateur de fichier iCalendar (.ics)
function generateIcsContent(
  appointmentId: string,
  serviceName: string,
  dateStr: string,
  startTimeStr: string,
  address: string
): string {
  const cleanStartTime = startTimeStr.slice(0, 5).replace(':', '');
  const dateFormatted = dateStr.replace(/-/g, '');
  
  // Date de début et date de fin par défaut (+1h si non spécifié)
  const dtStart = `${dateFormatted}T${cleanStartTime}00`;
  const [h, m] = startTimeStr.slice(0, 5).split(':').map(Number);
  const endH = (h + 1).toString().padStart(2, '0');
  const dtEnd = `${dateFormatted}T${endH}${m.toString().padStart(2, '0')}00`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//L Atelier Nomade//Reservation Coiffure//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${appointmentId}@ateliernomade.fr`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dtStart}`,
    `DTEnd:${dtEnd}`,
    `SUMMARY:Coiffure à domicile - ${serviceName}`,
    `DESCRIPTION:Votre prestation "${serviceName}" avec L Atelier Nomade.`,
    `LOCATION:${address || 'À domicile'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[send-confirmation-email] 📩 Traitement de la requête d’envoi d’email');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const siteUrl = Deno.env.get('SITE_URL') || 'https://ateliernomade.fr';
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') || supabaseServiceRoleKey;

    const payload: ConfirmationEmailPayload = await req.json();
    const {
      appointment_id,
      client_email,
      client_name,
      service_name,
      service_price,
      appointment_date,
      start_time,
      location_type,
      location_address,
    } = payload;

    if (!appointment_id || !client_email) {
      return new Response(
        JSON.stringify({ error: 'appointment_id et client_email sont obligatoires' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Génération du token sécurisé pour le lien d'annulation directe (sans usurpation)
    const cancellationSignature = await generateCancellationSignature(
      appointment_id,
      client_email,
      jwtSecret
    );
    const cancelUrl = `${siteUrl}/cancel?id=${appointment_id}&email=${encodeURIComponent(client_email)}&sig=${cancellationSignature}`;

    // 2. Génération du contenu iCalendar (.ics)
    const icsContent = generateIcsContent(
      appointment_id,
      service_name,
      appointment_date,
      start_time,
      location_address || 'À Domicile'
    );
    const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

    // Lien rapide Google Calendar
    const googleCalStart = `${appointment_date.replace(/-/g, '')}T${start_time.slice(0, 5).replace(':', '')}00`;
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Coiffure : ${service_name}`)}&dates=${googleCalStart}/${googleCalStart}&details=${encodeURIComponent(`Prestation à domicile ${service_name}`)}&location=${encodeURIComponent(location_address || 'À domicile')}`;

    // 3. Modèle d'email HTML moderne et responsive
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
          .header { background: #1c1917; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; font-weight: bold; }
          .header p { margin: 6px 0 0 0; color: #e5a93b; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .details-card { background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0eeeb; font-size: 14px; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #78716c; }
          .detail-value { font-weight: bold; color: #1c1917; }
          .actions { text-align: center; margin: 30px 0 10px 0; }
          .btn-primary { display: inline-block; background-color: #1c1917; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 6px; }
          .btn-secondary { display: inline-block; background-color: #f5f5f4; color: #44403c !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; border: 1px solid #d6d3d1; margin: 6px; }
          .cancel-section { text-align: center; margin-top: 24px; font-size: 12px; color: #a8a29e; }
          .cancel-link { color: #e11d48; text-decoration: underline; }
          .footer { background-color: #fafaf9; padding: 20px; text-align: center; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>L'Atelier Nomade</h1>
            <p>Coiffure Privée à Domicile</p>
          </div>
          <div class="content">
            <p class="greeting">Bonjour <strong>${client_name}</strong>,</p>
            <p>Votre rendez-vous a bien été confirmé. Nous aurons le plaisir de prendre soin de vous à la date et à l'adresse convenues.</p>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Prestation :</span>
                <span class="detail-value">${service_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date :</span>
                <span class="detail-value">${appointment_date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Heure d'arrivée :</span>
                <span class="detail-value">${start_time.slice(0, 5)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Lieu :</span>
                <span class="detail-value">${location_type === 'home' ? `🏠 Domicile (${location_address || 'Adresse fournie'})` : '💈 Salon'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Montant estimé :</span>
                <span class="detail-value" style="color: #866456;">${service_price} €</span>
              </div>
            </div>

            <div class="actions">
              <a href="${googleCalUrl}" target="_blank" class="btn-primary">📅 Ajouter à Google Calendar</a>
            </div>

            <div class="cancel-section">
              Un empêchement ? Vous pouvez <a href="${cancelUrl}" class="cancel-link">annuler votre réservation en cliquant ici</a>.
            </div>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Un rappel vous sera envoyé 24h avant le rendez-vous.</p>
            <p>© ${new Date().getFullYear()} L'Atelier Nomade - Coiffure à Domicile</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 4. Envoi via l'API Resend
    let resendResult = null;
    if (resendApiKey) {
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'L\'Atelier Nomade <onboarding@resend.dev>';
      
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [client_email],
          subject: `✨ Confirmation de votre rendez-vous coiffure - ${appointment_date}`,
          html: emailHtml,
          attachments: [
            {
              filename: 'rendez-vous.ics',
              content: icsBase64,
            },
          ],
        }),
      });

      resendResult = await resendResponse.json();
      console.log('[send-confirmation-email] 📬 Réponse Resend :', resendResult);
    } else {
      console.warn('[send-confirmation-email] ⚠️ RESEND_API_KEY non définie - Email simulé avec succès en mode DEV');
    }

    // 5. Mise à jour de la table appointments pour marquer confirmation_sent = true
    if (supabaseUrl && supabaseServiceRoleKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      });
      await adminClient
        .from('appointments')
        .update({ confirmation_sent: true })
        .eq('id', appointment_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de confirmation envoyé avec succès',
        resend: resendResult,
        cancellation_link: cancelUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[send-confirmation-email] ❌ Erreur :', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
