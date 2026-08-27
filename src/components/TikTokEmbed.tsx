import React, { useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

interface TikTokEmbedProps {
  videoId?: string;
  type?: 'creator' | 'video';
  maxWidth?: string;
}

declare global {
  interface Window {
    tiktokEmbed?: {
      reload: () => void;
    };
  }
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({
  videoId,
  type = 'creator',
  maxWidth = '780px',
}) => {
  useEffect(() => {
    // 1. Charger dynamiquement le script officiel d'intégration TikTok s'il n'est pas déjà présent
    const existingScript = document.getElementById('tiktok-embed-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'tiktok-embed-script';
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Recharger les embeds si le script est déjà en mémoire
      if (window.tiktokEmbed && typeof window.tiktokEmbed.reload === 'function') {
        window.tiktokEmbed.reload();
      }
    }
  }, [videoId, type]);

  if (type === 'video' && videoId) {
    return (
      <div className="w-full flex justify-center my-6">
        <blockquote
          className="tiktok-embed rounded-3xl shadow-xl border border-stone-200 overflow-hidden"
          cite={`https://www.tiktok.com/@cindymalorie/video/${videoId}`}
          data-video-id={videoId}
          style={{ maxWidth, minWidth: '325px', width: '100%' }}
        >
          <section>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.tiktok.com/@cindymalorie/video/${videoId}?refer=embed`}
              className="text-stone-800 font-bold"
            >
              @cindymalorie sur TikTok
            </a>
          </section>
        </blockquote>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center my-6 space-y-4">
      <div className="w-full flex justify-center">
        <blockquote
          className="tiktok-embed rounded-3xl shadow-xl border-2 border-stone-200 overflow-hidden bg-white p-4"
          cite="https://www.tiktok.com/@cindymalorie"
          data-unique-id="cindymalorie"
          data-embed-from="oembed"
          data-embed-type="creator"
          style={{ maxWidth, minWidth: '288px', width: '100%' }}
        >
          <section className="text-center p-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              Compte Officiel TikTok
            </div>
            <h3 className="text-xl font-bold font-serif text-stone-900">Cindy Malorie</h3>
            <p className="text-sm text-stone-600">
              Chargement des vidéos et réalisations en direct depuis TikTok...
            </p>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
            >
              <span>Accéder aux vidéos @cindymalorie sur TikTok</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </section>
        </blockquote>
      </div>
    </div>
  );
};
