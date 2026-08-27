import React from 'react';
import { Scissors, MapPin, Phone, ShieldCheck, Heart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-10 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1 : Marque & Cindy Malorie */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-lg">Cindy Malorie</span>
            </div>
            <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
              Coiffure Privée à Domicile
            </p>
            <p className="text-xs text-stone-400 leading-relaxed">
              L'excellence et la créativité du salon de coiffure directement dans le confort et la sérénité de votre intérieur.
            </p>
            
            <div className="flex flex-col gap-1 pt-2">
              <a
                href="https://www.instagram.com/cindy_maloriee?igsh=cnAyNThweDV2dmgy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>Instagram @cindy_maloriee</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                <span>TikTok @cindymalorie</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Col 2 : Navigation Rapide */}
          <div>
            <h4 className="text-white font-serif font-bold text-sm mb-4 uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Prestations & Tarifs</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition-colors">Galerie & Vidéos</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">À propos de Cindy</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact & Horaires</Link>
              </li>
              <li>
                <Link to="/booking" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                  Réserver un rendez-vous
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 : Déplacement & Contact */}
          <div>
            <h4 className="text-white font-serif font-bold text-sm mb-4 uppercase tracking-wider">Intervention & Contact</h4>
            <div className="space-y-3 text-xs text-stone-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Via Francana 10, Pavia (Italie)</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href="tel:+393512697743" className="hover:text-white font-semibold">+39 351 269 7743 (WhatsApp)</a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">@</span>
                <a href="mailto:cindytchamabekamaha@gmail.com" className="hover:text-white truncate">cindytchamabekamaha@gmail.com</a>
              </p>
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded bg-stone-800 text-[11px] font-semibold text-amber-300 border border-stone-700">
                  Déplacement à domicile inclus
                </span>
              </div>
            </div>
          </div>

          {/* Col 4 : Sécurité & Espace Client */}
          <div>
            <h4 className="text-white font-serif font-bold text-sm mb-4 uppercase tracking-wider">Espace & Sécurité</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center gap-2 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Données RLS & Sessions Chiffrées</span>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Mes Rendez-vous & Programme Fidélité
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Connexion Sécurisée
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Barre Copyright */}
        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} Cindy Malorie - Coiffure Privée à Domicile (Italie). Tous droits réservés.</p>
          <div className="flex items-center space-x-4">
            <a
              href="https://www.instagram.com/cindy_maloriee?igsh=cnAyNThweDV2dmgy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Instagram @cindy_maloriee
            </a>
            <span>•</span>
            <a
              href="https://www.tiktok.com/@cindymalorie?_r=1&_t=ZS-98EBwLZ9rCC"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 hover:text-rose-300 font-semibold"
            >
              TikTok @cindymalorie
            </a>
            <span>•</span>
            <span className="flex items-center gap-1 text-stone-300">
              Façonné avec <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> pour Cindy Malorie
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
