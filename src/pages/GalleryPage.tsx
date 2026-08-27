import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Video, ExternalLink, CheckCircle2, Clock, Eye, ChevronRight } from 'lucide-react';
import { TikTokEmbed } from '../components/TikTokEmbed';
import { formatCurrency } from '../utils/format';

interface HairstylePhoto {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  imageUrl: string;
  description: string;
  badge: string;
}

export const GalleryPage: React.FC = () => {
  const [activeModalPhoto, setActiveModalPhoto] = useState<HairstylePhoto | null>(null);

  // Les 4 coiffures réelles ajoutées avec photos officielles
  const realHairstyles: HairstylePhoto[] = [
    {
      id: 'hs-1',
      name: 'Stitch braid with cross',
      category: 'Tresses Homme',
      price: 50,
      duration: '2h - 3h',
      imageUrl: '/images/hairstyles/stitch-braid-cross.png',
      description: 'Tresses stitch haute précision avec séparations géométriques en croix sur le sommet du crâne. Traçage ultra-net et tenue longue durée.',
      badge: '🔥 Tendance Forte',
    },
    {
      id: 'hs-2',
      name: 'Stitch braids',
      category: 'Tresses Homme',
      price: 60,
      duration: '1h30 - 2h',
      imageUrl: '/images/hairstyles/stitch-braids.png',
      description: 'Lignes de tresses stitch parallèles parfaitement sculptées avec finitions soignées des tempes et de la nuque.',
      badge: '✨ Incontournable',
    },
    {
      id: 'hs-3',
      name: 'Knotless braids',
      category: 'Tresses Femme',
      price: 95,
      duration: '3h - 3h30',
      imageUrl: '/images/hairstyles/knotless-braids.png',
      description: 'Superbes tresses sans nœuds extra-longues avec mèches rouge feu dégradées. Ultra légères, souples et protectrices.',
      badge: '👑 Modèle Star',
    },
    {
      id: 'hs-4',
      name: 'Cornrows',
      category: 'Tresses Homme',
      price: 45,
      duration: '1h - 2h',
      imageUrl: '/images/hairstyles/cornrows.png',
      description: 'Tresses plaquées traditionnelles régulières avec finitions élégantes enroulées en chignon bas à l’arrière de la tête.',
      badge: '💎 Élégance Pure',
    },
  ];



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* En-tête de la Galerie */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-bold uppercase tracking-wider border border-rose-300">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          Portfolio Réalisations & TikTok @cindymalorie
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900">
          Galerie & Coiffures Phares
        </h1>
        <p className="text-stone-700 text-base leading-relaxed">
          Découvrez en images les coiffures tressées, transformations et coupes réalisées par <strong>Cindy Malorie</strong> à Pavia (Via Francana 10) et à domicile en Lombardie.
        </p>

        {/* Boutons Réseaux Officiels */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href="https://www.instagram.com/cindy_maloriee?igsh=cnAyNThweDV2dmgy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs shadow transition-all"
          >
            <span>Instagram @cindy_maloriee</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow transition-all"
          >
            <Video className="w-4 h-4" />
            <span>TikTok @cindymalorie</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SECTION VEDETTE : LES 4 COIFFURES TRESSÉES OFFICIELLES */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-stone-200 pb-4">
          <div>
            <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">Créations Artisanales</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
              Portfolio Braids & Tresses Sculptées
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Cliquez sur une coiffure pour l'agrandir et voir les détails des tarifs et durées.
            </p>
          </div>
          <Link
            to="/booking"
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow transition-all self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Réserver une prestation</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {realHairstyles.map((hair) => (
            <div
              key={hair.id}
              onClick={() => setActiveModalPhoto(hair)}
              className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-stone-950">
                <img
                  src={hair.imageUrl}
                  alt={hair.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
                <span className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  {hair.badge}
                </span>
                <span className="absolute bottom-3 right-3 text-2xl font-serif font-bold text-amber-300">
                  {formatCurrency(hair.price)}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors">
                    {hair.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                    {hair.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-stone-100 font-semibold text-stone-700">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    {hair.duration}
                  </span>
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Voir détails
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTÉGRATEUR DU PROFIL TIKTOK OFFICIEL */}
      {/* ========================================================================= */}
      <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-10 border border-stone-800 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-1 flex items-center justify-center">
              <div className="w-full h-full bg-stone-900 rounded-full flex items-center justify-center font-serif font-bold text-xl text-amber-400">
                CM
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold font-serif">Cindy Malorie</h3>
                <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400" />
              </div>
              <p className="text-xs text-rose-400 font-semibold">@cindymalorie sur TikTok</p>
              <p className="text-xs text-stone-400 mt-0.5">Coiffure Privée • Via Francana 10, Pavia & Domicile</p>
            </div>
          </div>

          <a
            href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs shadow transition-all flex items-center gap-2"
          >
            <span>S'abonner au compte</span>
            <ExternalLink className="w-4 h-4 text-stone-800" />
          </a>
        </div>

        {/* Widget Embed TikTok interactif officiel */}
        <TikTokEmbed type="creator" />
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALE D'AGRANDISSEMENT DE COIFFURE */}
      {/* ========================================================================= */}
      {activeModalPhoto && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border-2 border-stone-200 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="relative aspect-[4/3] bg-stone-950">
              <img
                src={activeModalPhoto.imageUrl}
                alt={activeModalPhoto.name}
                className="w-full h-full object-cover object-top"
              />
              <button
                onClick={() => setActiveModalPhoto(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-900/80 text-white flex items-center justify-center font-bold hover:bg-stone-900"
              >
                ✕
              </button>
              <span className="absolute bottom-4 left-4 bg-amber-500 text-stone-950 text-xs font-bold px-3 py-1 rounded-full shadow">
                {activeModalPhoto.badge}
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-stone-900">
                    {activeModalPhoto.name}
                  </h3>
                  <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                    {activeModalPhoto.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-serif font-bold text-stone-900 block">
                    {formatCurrency(activeModalPhoto.price)}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold flex items-center gap-1 justify-end mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeModalPhoto.duration}
                  </span>
                </div>
              </div>

              <p className="text-sm text-stone-600 leading-relaxed">
                {activeModalPhoto.description}
              </p>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex justify-between items-center">
                <span>📍 Disponible à <strong>Pavia (Studio)</strong> ou <strong>à domicile</strong></span>
                <span className="text-emerald-700 font-bold">● Déplacement inclus</span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalPhoto(null)}
                  className="px-5 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs flex-1"
                >
                  Fermer
                </button>
                <Link
                  to={`/booking?serviceName=${encodeURIComponent(activeModalPhoto.name)}`}
                  className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex-[2] flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Réserver cette coiffure</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
