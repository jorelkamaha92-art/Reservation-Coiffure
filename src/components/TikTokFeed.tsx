import React, { useState } from 'react';
import { Play, Heart, MessageCircle, ExternalLink, Volume2, CheckCircle2 } from 'lucide-react';

export interface TikTokVideo {
  id: string;
  title: string;
  category: string;
  views: string;
  likes: string;
  comments: string;
  thumbnail: string;
  videoUrl?: string;
  caption: string;
  sound: string;
  tag: string;
}

export const TIKTOK_VIDEOS: TikTokVideo[] = [
  {
    id: '1',
    title: 'Transformation Balayage Éclat & Wavy',
    category: 'Balayage & Couleur',
    views: '45.2K',
    likes: '3.8K',
    comments: '142',
    thumbnail: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-getting-her-hair-done-in-a-salon-41584-large.mp4',
    caption: 'De brune à ce blond beige lumineux chez ma cliente à domicile ✨ Vous validez le fondu ? #cindymalorie #balayage #coiffureadomicile',
    sound: 'Son original - Cindy Malorie',
    tag: 'Tendance',
  },
  {
    id: '2',
    title: 'Carré Plongeant & Brushing Souple',
    category: 'Coupe Transformation',
    views: '32.1K',
    likes: '2.4K',
    comments: '89',
    thumbnail: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stylist-combing-hair-of-a-woman-in-a-hair-salon-41586-large.mp4',
    caption: 'On coupe 20 cm aujourd’hui ! Regardez le volume et le mouvement final 💇‍♀️ #haircut #cindyhair #transformation',
    sound: 'Cindy Malorie - Hair Vibes',
    tag: 'Avant / Après',
  },
  {
    id: '3',
    title: 'Chignon Bohème Chic Cérémonie',
    category: 'Coiffure Mariage',
    views: '88.9K',
    likes: '7.6K',
    comments: '310',
    thumbnail: 'https://images.unsplash.com/photo-1522337094346-290f26a0b58a?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hairdresser-curling-a-womans-hair-41587-large.mp4',
    caption: 'Préparation mariée à domicile. Tressage texturé et fixation 24h 👰‍♀️💍 #weddinghair #chignon #coiffuremariage',
    sound: 'Son mariage féerique - Cindy Malorie',
    tag: 'Viral',
  },
  {
    id: '4',
    title: 'Soin Botox Capillaire Brillance Miroir',
    category: 'Soins Profonds',
    views: '28.4K',
    likes: '2.1K',
    comments: '64',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-in-a-hairdressing-salon-washing-her-hair-41588-large.mp4',
    caption: 'Cheveux secs et abîmés ? Le soin botox redonne vie et brillance dès la 1ère séance ✨ #haircare #botoxcapillaire',
    sound: 'Soins Relax - Cindy Malorie',
    tag: 'Soin Magique',
  },
  {
    id: '5',
    title: 'Dégradé Homme & Soin Barbe Complet',
    category: 'Homme & Barbe',
    views: '19.8K',
    likes: '1.5K',
    comments: '43',
    thumbnail: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
    caption: 'Prestation barbier à domicile avec serviette chaude et finitions rasoir 💈 #barber #menhair #cindymalorie',
    sound: 'Barber Style - Cindy Malorie',
    tag: 'Barber Grooming',
  },
  {
    id: '6',
    title: 'Glossing & Patine Neutralisante',
    category: 'Technique Couleur',
    views: '54.0K',
    likes: '4.9K',
    comments: '180',
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
    caption: 'Élimination des reflets jaunes pour un blond beige polaire impeccable ❄️ #blondehair #glosshair #cindymalorie',
    sound: 'Trendy Sound - TikTok',
    tag: 'Brillance',
  },
];

export const TikTokFeed: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<TikTokVideo | null>(null);

  return (
    <div className="space-y-8">
      {/* En-tête TikTok Creator */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-300 p-1">
              <img
                src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&auto=format&fit=crop&q=80"
                alt="Cindy Malorie TikTok"
                className="w-full h-full object-cover rounded-full border-2 border-stone-900"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-stone-900">
              TikTok
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-serif">Cindy Malorie</h3>
              <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400" />
            </div>
            <p className="text-xs text-amber-400 font-semibold tracking-wide">@cindymalorie</p>
            <p className="text-xs text-stone-400 mt-1 font-medium">
              Vidéos de transformations réelles & tutoriels coiffure à domicile
            </p>
          </div>
        </div>

        <a
          href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
        >
          <span>Rejoindre Cindy sur TikTok</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Grille Vidéos TikTok */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {TIKTOK_VIDEOS.map((video) => (
          <div
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="group relative bg-stone-900 rounded-3xl overflow-hidden shadow-lg border-2 border-stone-800 hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col h-[400px]"
          >
            {/* Thumbnail avec overlay */}
            <div className="relative flex-1 overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-black/20" />

              {/* Tag Badge */}
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow">
                {video.tag}
              </span>

              {/* Bouton Play animé */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 group-hover:scale-110 group-hover:bg-amber-500 group-hover:border-amber-400 group-hover:text-stone-950 transition-all shadow-xl">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </div>

              {/* Métriques TikTok */}
              <div className="absolute bottom-3 right-3 flex flex-col items-center gap-2 text-white text-xs font-bold">
                <div className="flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>{video.likes}</span>
                </div>
                <div className="flex items-center gap-1 bg-stone-900/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                  <MessageCircle className="w-3.5 h-3.5 text-stone-300" />
                  <span>{video.comments}</span>
                </div>
              </div>

              {/* Vues */}
              <div className="absolute top-3 right-3 text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                👁️ {video.views}
              </div>
            </div>

            {/* Description & Son */}
            <div className="p-4 bg-stone-950 text-white space-y-2 border-t border-stone-800">
              <h4 className="text-sm font-bold line-clamp-1 group-hover:text-amber-400 transition-colors">
                {video.title}
              </h4>
              <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed font-normal">
                {video.caption}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-semibold pt-1">
                <Volume2 className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">{video.sound}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Vidéo TikTok Plein Écran */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white rounded-3xl max-w-md w-full overflow-hidden border-2 border-stone-700 shadow-2xl relative animate-fadeIn">
            
            {/* Header Modal */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
                  CM
                </div>
                <div>
                  <p className="text-xs font-bold">@cindymalorie</p>
                  <p className="text-[10px] text-stone-400">{selectedVideo.category}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Lecteur Vidéo */}
            <div className="relative h-[380px] bg-black">
              {selectedVideo.videoUrl ? (
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={selectedVideo.thumbnail}
                    alt={selectedVideo.title}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xl flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Regarder la vidéo originale sur TikTok
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Détails & Lien TikTok */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-base">{selectedVideo.title}</h3>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">{selectedVideo.caption}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800">
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Heart className="w-4 h-4 fill-rose-500" /> {selectedVideo.likes} likes
                </span>
                <span className="flex items-center gap-1 text-stone-300">
                  <MessageCircle className="w-4 h-4" /> {selectedVideo.comments} avis
                </span>
              </div>

              <a
                href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
              >
                <span>Voir le profil TikTok @cindymalorie</span>
                <ExternalLink className="w-4 h-4 text-stone-800" />
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
