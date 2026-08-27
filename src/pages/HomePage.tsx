import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  ChevronDown, 
  Heart,
  ShieldCheck,
  HelpCircle,
  Video,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { TikTokFeed } from '../components/TikTokFeed';

export const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 4 Coiffures Phares Signatures
  const featuredServices = [
    {
      id: 'braid-1',
      title: 'Stitch braid with cross',
      description: 'Tresses stitch haute précision avec motif géométrique en croix sur le dessus. Tracés nets et finitions soignées.',
      duration: '2h - 3h',
      price: 50,
      tag: '🔥 Tendance Homme',
      imageUrl: '/images/hairstyles/stitch-braid-cross.png',
    },
    {
      id: 'braid-2',
      title: 'Stitch braids',
      description: 'Tresses stitch droites et soignées avec séparations nettes et contours impeccables. Confort et tenue longue durée.',
      duration: '1h30 - 2h',
      price: 60,
      tag: '✨ Incontournable',
      imageUrl: '/images/hairstyles/stitch-braids.png',
    },
    {
      id: 'braid-3',
      title: 'Knotless braids',
      description: 'Longues tresses sans nœuds fluides et ultra-légères avec mèches rouge feu. Aucune traction sur le cuir chevelu.',
      duration: '3h - 3h30',
      price: 95,
      tag: '👑 Star Femme',
      imageUrl: '/images/hairstyles/knotless-braids.png',
    },
    {
      id: 'braid-4',
      title: 'Cornrows',
      description: 'Tresses plaquées traditionnelles régulières avec finitions attachées en chignons élégants à l’arrière de la tête.',
      duration: '1h - 2h',
      price: 45,
      tag: '💎 Classique Chic',
      imageUrl: '/images/hairstyles/cornrows.png',
    },
  ];

  // Témoignages clients (Italie / Lombardie)
  const testimonials = [
    {
      name: 'Matteo G.',
      location: 'Pavia',
      service: 'Stitch braid with cross',
      comment: 'Cindy est ultra précise ! Les tracés de mes stitch braids avec la croix sont parfaits, nets et sans douleur. Le meilleur service à Pavia !',
      rating: 5,
      date: 'Il y a 2 jours',
    },
    {
      name: 'Chiara B.',
      location: 'Milano',
      service: 'Knotless braids',
      comment: 'Mes knotless braids rouges sont magnifiques, légères et sans aucune tension sur le cuir chevelu. Cindy est venue directement chez moi à Milan.',
      rating: 5,
      date: 'La semaine dernière',
    },
    {
      name: 'Lorenzo P.',
      location: 'Certosa di Pavia',
      service: 'Cornrows',
      comment: 'Ponctuelle, rapide et très pro. Les cornrows tiennent super bien, finitions au top.',
      rating: 5,
      date: 'Il y a 2 semaines',
    },
  ];

  // FAQ Logistique Coiffure à Domicile & Studio (Italie)
  const faqs = [
    {
      q: 'Où se situe le Studio Privé de Cindy Malorie ?',
      a: 'Le studio privé est situé au Via Francana 10, Pavia (Italie). Vous pouvez également réserver une prestation 100% à votre domicile partout à Pavia, Milan et en Lombardie.',
    },
    {
      q: 'Comment se passe une prestation coiffure à mon domicile ?',
      a: 'Cindy apporte tout le matériel nécessaire : matériel de tressage pro, coiffants de qualité, protections et serviettes. Vous n\'avez qu\'à vous installer confortablement.',
    },
    {
      q: 'Quelles sont les zones couvertes pour le déplacement à domicile ?',
      a: 'Le déplacement est inclus sur Pavia et sa proximité immédiate. Cindy se déplace également sur tout le Grand Milan et la région Lombardie (sur devis/forfait kilométrique adapté).',
    },
    {
      q: 'Comment fonctionne le programme de fidélité ?',
      a: 'Chaque euro dépensé vous rapporte 1 point de fidélité. Vous pouvez ensuite convertir vos points en réductions ou soins gratuits sur vos prochaines réservations.',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. SECTION HÉRO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/60 via-stone-50 to-white pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Colonne Texte & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 text-amber-950 text-xs font-bold uppercase tracking-wider border border-amber-300">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>Via Francana 10, Pavia & Domicile (Italie)</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-900 leading-tight">
                L’Art de la Coiffure & des <span className="text-amber-800 italic underline decoration-amber-300">Braids</span> chez Vous
              </h1>

              <p className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Sublimez votre style avec <strong>Cindy Malorie</strong>. Spécialiste des tresses artistiques (*Stitch braids, Knotless, Cornrows*) et soins capillaires, au studio privé à <strong>Pavia</strong> ou directement <strong>à votre domicile</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/booking"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 border border-stone-900"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Réserver en ligne
                </Link>

                <a
                  href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <Video className="w-4 h-4 text-white" />
                  Voir sur TikTok (@cindymalorie)
                </a>
              </div>

              {/* Badges de Réassurance */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t-2 border-stone-200 text-stone-800 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Studio & Domicile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Zéro traction douleur</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Tracés ultra-précis</span>
                </div>
              </div>
            </div>

            {/* Colonne Photo Réelle */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden border-2 border-stone-200 shadow-2xl bg-white p-3">
                  <img
                    src="/images/hairstyles/stitch-braid-cross.png"
                    alt="Cindy Malorie - Création Stitch Braid with Cross à Pavia"
                    className="w-full h-[480px] object-cover object-top rounded-2xl"
                  />
                </div>

                {/* Badge Flottant Note Client */}
                <div className="absolute -bottom-6 -right-4 sm:right-6 bg-white p-4 rounded-2xl border-2 border-stone-200 shadow-xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-serif font-bold text-lg">
                    5.0
                  </div>
                  <div>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-stone-900 mt-0.5">+150 clientes satisfaites</p>
                    <p className="text-[10px] text-stone-500 font-medium">@cindymalorie • Pavia (Italie)</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PRÉSENTATION & PHILOSOPHIE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-stone-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Studio Privé & Domicile</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
                L'Excellence du Tressage & du Soin Capillaire
              </h2>
              <p className="text-stone-700 text-sm leading-relaxed">
                Installée à <strong>Pavia (Via Francana 10)</strong>, <strong>Cindy Malorie</strong> vous accueille dans son espace privé ou se déplace directement à votre domicile à Milan et dans toute la région.
              </p>
              <p className="text-stone-700 text-sm leading-relaxed">
                Chaque coiffure est réalisée avec passion, patience et un respect rigoureux de la fibre capillaire pour allier esthétique spectaculaire et confort absolu.
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900 hover:text-amber-800 underline"
                >
                  Découvrir l'histoire et le savoir-faire de Cindy
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <Clock className="w-6 h-6 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-sm">Gain de Temps & Confort</h3>
                <p className="text-xs text-stone-600">
                  Prestation sans stress, à votre domicile ou au studio privé calme et dédié.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <Heart className="w-6 h-6 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-sm">Zéro Douleur & Douceur</h3>
                <p className="text-xs text-stone-600">
                  Technique sans traction excessive, idéale pour protéger vos longueurs et racines.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <ShieldCheck className="w-6 h-6 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-sm">Précision Géométrique</h3>
                <p className="text-xs text-stone-600">
                  Séparations parfaites, tracés nets et tenue irréprochable pendant plusieurs semaines.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <Sparkles className="w-6 h-6 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-sm">Conseils Personnalisés</h3>
                <p className="text-xs text-stone-600">
                  Recommandations d'entretien et d'hydratation adaptées à votre type de cheveu.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. PRESTATIONS PHARES (LES 4 COIFFURES RÉELLES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Créations Phares</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
            Nos Coiffures Tressées Signatures
          </h2>
          <p className="text-stone-600 text-sm">
            Réalisations exclusives avec photos réelles, durées estimées et tarifs transparents.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-stone-950">
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
                <span className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  {service.tag}
                </span>
                <span className="absolute bottom-3 right-3 text-2xl font-serif font-bold text-amber-300">
                  {formatCurrency(service.price)}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">{service.title}</h3>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Durée : {service.duration}</span>
                  </div>

                  <Link
                    to={`/booking?serviceName=${encodeURIComponent(service.title)}`}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm group-hover:bg-amber-600"
                  >
                    <span>Réserver ce modèle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all"
          >
            <span>Voir toute la carte des prestations & tarifs</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </section>

      {/* 4. SECTION VIDÉOS TIKTOK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">TikTok Spotlight</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
            Vidéos & Transformations Réelles
          </h2>
          <p className="text-stone-600 text-sm">
            Retrouvez les vidéos en direct de nos prestations partagées sur le compte officiel <strong>@cindymalorie</strong>.
          </p>
        </div>

        <TikTokFeed />
      </section>

      {/* 5. AVIS CLIENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Témoignages</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
            Ce que disent nos clients en Italie
          </h2>
          <p className="text-stone-600 text-sm">
            Retours d'expérience authentiques de clients à Pavia, Milan et en Lombardie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-7 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium">{t.date}</span>
                </div>

                <p className="text-stone-700 text-xs sm:text-sm italic leading-relaxed">
                  « {t.comment} »
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{t.name}</h4>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-700" />
                    {t.location}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-700">
                  {t.service}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-amber-700 mx-auto" />
          <h2 className="text-3xl font-serif font-bold text-stone-900">Questions Fréquentes</h2>
          <p className="text-stone-600 text-sm">Tout savoir sur le studio à Pavia et les prestations à domicile.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-stone-50 transition-colors"
                >
                  <span className="font-bold text-stone-900 text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-stone-600 flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-amber-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-700 leading-relaxed border-t border-stone-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CTA FINAL DE RÉSERVATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 rounded-3xl p-8 sm:p-14 border-2 border-amber-300 text-center space-y-6 shadow-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-950 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            Studio à Pavia & Déplacements
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 max-w-2xl mx-auto">
            Envie d’une coiffure tressée parfaite ?
          </h2>
          <p className="text-stone-700 text-sm sm:text-base max-w-xl mx-auto">
            Prenez rendez-vous directement en ligne en quelques clics pour un créneau au studio (Via Francana 10, Pavia) ou chez vous.
          </p>
          <div className="pt-2">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md hover:shadow-xl transition-all"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Réserver mon rendez-vous</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
