import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Award, Home, Clock, ArrowRight, Star, MapPin } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* En-tête / Histoire */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wider border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            L'Histoire de Cindy Malorie
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 leading-tight">
            L'Art des Braids & du Soin Privé à Pavia & Lombardie
          </h1>
          <p className="text-stone-700 text-base leading-relaxed">
            Passionnée par l'art du cheveu, le tressage haute précision et la création de contenu sur les réseaux sociaux, <strong>Cindy Malorie</strong> vous accueille dans son <strong>Studio Privé au Via Francana 10, Pavia (Italie)</strong> ou se déplace directement <strong>à votre domicile</strong> à Milan et dans toute la région.
          </p>
          <p className="text-stone-700 text-base leading-relaxed">
            Suivie par une communauté engagée sur TikTok (<strong>@cindymalorie</strong>) et Instagram (<strong>@cindy_maloriee</strong>), Cindy s'est imposée comme une référence incontournable des <em>Stitch braids</em>, <em>Knotless braids</em>, <em>Cornrows</em> et des soins restructurants.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <Award className="w-5 h-5 text-amber-700" />
              <span>Experte Braids & Tresses Sculptées</span>
            </div>
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <MapPin className="w-5 h-5 text-amber-700" />
              <span>Studio à Pavia (Via Francana 10) & Domicile</span>
            </div>
          </div>
        </div>

        {/* Visuel du Coiffeur / Portrait avec photo réelle */}
        <div className="lg:col-span-6">
          <div className="relative">
            <div className="rounded-3xl overflow-hidden border-2 border-stone-200 shadow-xl bg-white p-3">
              <img
                src="/images/hairstyles/stitch-braid-cross.png"
                alt="Cindy Malorie - Coiffure Braids & Tresses à Pavia"
                className="w-full h-[450px] object-cover object-top rounded-2xl"
              />
            </div>
            
            {/* Badge Flottant */}
            <div className="absolute -bottom-6 -left-6 bg-stone-900 text-white p-5 rounded-2xl border-2 border-stone-800 shadow-xl max-w-xs space-y-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm font-bold">100% de clientes conquises</p>
              <p className="text-xs text-stone-400">Pavia, Milan et toute la Lombardie</p>
            </div>
          </div>
        </div>
      </div>

      {/* Les Valeurs & Engagements */}
      <div className="bg-white rounded-3xl p-8 lg:p-12 border-2 border-stone-200 shadow-sm space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-serif font-bold text-stone-900">
            Nos Engagements & Notre Savoir-Faire
          </h2>
          <p className="text-stone-600 text-sm">
            Ce qui rend chaque rendez-vous avec Cindy Malorie unique et mémorable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Studio Privé & Domicile</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Choisissez selon vos préférences : profitez du calme de notre studio dédié à Pavia ou du confort absolu de votre domicile sans aucun déplacement.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Zéro Douleur & Douceur</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Des techniques de tressage sans tension agressive sur le cuir chevelu. Préservez la santé de vos racines et de vos longueurs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Précision Géométrique</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Séparations impeccables, tracés au millimètre et coiffures haute tenue pendant plusieurs semaines.
            </p>
          </div>
        </div>
      </div>

      {/* Coordonnées & CTA */}
      <div className="bg-stone-900 text-white p-8 sm:p-12 rounded-3xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Prenez rendez-vous</span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold">Envie de tresses parfaites ?</h3>
          <p className="text-stone-300 text-sm max-w-xl">
            Retrouvez Cindy au <strong>Via Francana 10, Pavia</strong> ou réservez votre créneau à domicile à Milan et en Lombardie.
          </p>
        </div>

        <Link
          to="/booking"
          className="px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 flex-shrink-0"
        >
          <span>Réserver une séance</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};
