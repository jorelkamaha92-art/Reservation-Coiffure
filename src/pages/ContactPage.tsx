import React, { useState } from 'react';
import { Phone, Mail, Clock, MapPin, MessageSquare, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    postalCode: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setError(null);
    setLoading(true);

    // Simulation d'envoi de message
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', postalCode: '', message: '' });
    }, 1000);
  };

  const coverageAreas = [
    { zone: 'Zone 1 (Pavia & Proximité)', cities: 'Pavia centre, San Martino Siccomario, Certosa di Pavia, Cava Manara, San Genesio ed Uniti', fee: 'Déplacement Inclus (0 €)' },
    { zone: 'Zone 2 (Grand Milan & Sud Lombardie)', cities: 'Milano (tous quartiers), Rozzano, Assago, San Donato Milanese, Voghera, Vigevano', fee: 'Déplacement Inclus dès 45 €' },
    { zone: 'Zone 3 (Lombardie & Événements)', cities: 'Monza, Bergamo, Brescia, Como et reste de la région sur demande (mariages, shootings, événements)', fee: 'Sur devis personnalisé' },
  ];

  const openingHours = [
    { day: 'Lundi', hours: '09:00 - 19:00' },
    { day: 'Mardi', hours: '09:00 - 19:00' },
    { day: 'Mercredi', hours: '09:00 - 19:00' },
    { day: 'Jeudi', hours: '09:00 - 20:00 (Nocturne)' },
    { day: 'Vendredi', hours: '09:00 - 20:00 (Nocturne)' },
    { day: 'Samedi', hours: '08:30 - 18:30' },
    { day: 'Dimanche', hours: 'Fermé (Sauf événements / mariages)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* En-tête */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wider border border-amber-300">
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          Nous Contacter
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900">
          Une Question ? Parlons de Vos Envies
        </h1>
        <p className="text-stone-700 text-base">
          Nous sommes à votre disposition pour tout renseignement sur nos prestations à domicile, les zones couvertes ou pour un devis mariage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Colonne Gauche : Formulaire de Contact */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-sm space-y-6">
          <h2 className="text-2xl font-serif font-bold text-stone-900">
            Envoyez-nous un message
          </h2>

          {submitted && (
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-sm font-medium flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span>Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 24h.</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Sophie Martin"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: sophie@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: 06 12 34 56 78"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Ville ou Code Postal</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="Ex: 75015 Paris"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Votre Message ou Projet *</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Décrivez votre besoin (type de coupe, couleur, date souhaitée, événement spécial...)"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Envoyer le message</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Colonne Droite : Coordonnées & Horaires */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Carte Coordonnées Rapides */}
          <div className="bg-stone-900 text-white rounded-3xl p-8 border border-stone-800 space-y-6">
            <h3 className="text-xl font-serif font-bold text-amber-400">Coordonnées Directes</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold">Téléphone / WhatsApp</p>
                  <a href="tel:+393512697743" className="font-bold text-white hover:text-amber-400 transition-colors">+39 351 269 7743</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold">Email direct</p>
                  <a href="mailto:cindytchamabekamaha@gmail.com" className="font-bold text-white hover:text-amber-400 transition-colors break-all">cindytchamabekamaha@gmail.com</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold">Adresse du Studio Privé</p>
                  <p className="font-bold text-white">Via Francana 10, Pavia (Italie)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold">Déplacements à Domicile</p>
                  <p className="font-bold text-white">Pavia, Milano & toute la Lombardie</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800 flex flex-col gap-2">
                <a
                  href="https://www.instagram.com/cindy_maloriee?igsh=cnAyNThweDV2dmgy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-between"
                >
                  <span>Instagram : @cindy_maloriee</span>
                  <span>↗</span>
                </a>
                <a
                  href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-between"
                >
                  <span>TikTok : @cindymalorie</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Horaires d'intervention */}
          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              Horaires d'Intervention
            </h3>

            <div className="space-y-2 text-xs">
              {openingHours.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-stone-100 last:border-b-0 font-medium">
                  <span className="text-stone-700">{item.day}</span>
                  <span className="font-bold text-stone-900">{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Zones Géographiques Couvertes */}
      <div className="bg-white rounded-3xl p-8 lg:p-10 border-2 border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">Périmètre d'Intervention & Frais de Déplacement</h2>
            <p className="text-xs text-stone-600">Intervention directe à votre domicile ou lieu de réception.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {coverageAreas.map((area, index) => (
            <div key={index} className="p-5 rounded-2xl bg-stone-50 border-2 border-stone-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900 text-sm">{area.zone}</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{area.cities}</p>
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                  {area.fee}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
