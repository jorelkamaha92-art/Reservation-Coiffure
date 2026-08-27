import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Clock, Search, Sparkles, ChevronRight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Service } from '../types';
import { formatCurrency } from '../utils/format';

interface ServiceWithImage extends Service {
  imageUrl?: string;
  badge?: string;
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceWithImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Les 4 coiffures signatures exclusives de Cindy Malorie avec photos réelles
  const signatureBraids: ServiceWithImage[] = [
    {
      id: 'braid-1',
      name: 'Stitch braid with cross',
      description: 'Tresses stitch haute précision avec motif géométrique en croix sur le dessus. Tracés nets et finitions soignées.',
      duration_minutes: 150, // 2h - 3h
      price: 50,
      category: 'Tresses & Braids',
      is_active: true,
      created_at: '',
      imageUrl: '/images/hairstyles/stitch-braid-cross.png',
      badge: '🔥 Tendance Homme',
    },
    {
      id: 'braid-2',
      name: 'Stitch braids',
      description: 'Tresses stitch droites et soignées avec séparations nettes et contours impeccables. Confort et tenue longue durée.',
      duration_minutes: 105, // 1h30 - 2h
      price: 60,
      category: 'Tresses & Braids',
      is_active: true,
      created_at: '',
      imageUrl: '/images/hairstyles/stitch-braids.png',
      badge: '✨ Incontournable',
    },
    {
      id: 'braid-3',
      name: 'Knotless braids',
      description: 'Longues tresses sans nœuds fluides et ultra-légères. Mèches rouge vif dégradées, aucune traction sur le cuir chevelu.',
      duration_minutes: 195, // 3h - 3h30
      price: 95,
      category: 'Tresses & Braids',
      is_active: true,
      created_at: '',
      imageUrl: '/images/hairstyles/knotless-braids.png',
      badge: '👑 Star Femme',
    },
    {
      id: 'braid-4',
      name: 'Cornrows',
      description: 'Tresses plaquées traditionnelles régulières avec finitions attachées en chignons élégants à l’arrière de la tête.',
      duration_minutes: 90, // 1h - 2h
      price: 45,
      category: 'Tresses & Braids',
      is_active: true,
      created_at: '',
      imageUrl: '/images/hairstyles/cornrows.png',
      badge: '💎 Classique Chic',
    },
  ];

  const defaultOtherServices: ServiceWithImage[] = [
    { id: '1', name: 'Coupe Femme & Brushing', description: 'Diagnostic personnalisé, shampoing, coupe sur-mesure et brushing haute tenue.', duration_minutes: 60, price: 45, category: 'Femme', is_active: true, created_at: '' },
    { id: '2', name: 'Coupe Homme & Soin Barbe', description: 'Coupe aux ciseaux et tondeuse, finitions rasoir, taille de barbe et serviette chaude.', duration_minutes: 45, price: 30, category: 'Homme', is_active: true, created_at: '' },
    { id: '3', name: 'Coupe Enfant (-12 ans)', description: 'Coupe douce et bienveillante directement à votre domicile.', duration_minutes: 30, price: 20, category: 'Enfant', is_active: true, created_at: '' },
    { id: '4', name: 'Coloration Racines & Éclat', description: 'Coloration sans ammoniaque, couverture 100% des cheveux blancs et soin nutritif.', duration_minutes: 90, price: 65, category: 'Technique', is_active: true, created_at: '' },
    { id: '5', name: 'Balayage Signature & Patine', description: 'Éclaircissement naturel sur-mesure avec patine brillance et masque réparateur.', duration_minutes: 120, price: 95, category: 'Technique', is_active: true, created_at: '' },
    { id: '6', name: 'Soin Botox Capillaire & Massage', description: 'Soin reconstructeur profond à la kératine et acide hyaluronique.', duration_minutes: 60, price: 55, category: 'Soin', is_active: true, created_at: '' },
    { id: '7', name: 'Coiffure Mariée & Essai inclus', description: 'Création du chignon ou coiffure de cérémonie avec essai préalable à domicile.', duration_minutes: 120, price: 130, category: 'Événement', is_active: true, created_at: '' },
    { id: '8', name: 'Brushing Événementiel Wavy', description: 'Mise en forme souple ou ondulations glamour avec produits fixants pro.', duration_minutes: 45, price: 35, category: 'Femme', is_active: true, created_at: '' },
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (!error && data && data.length > 0) {
          // Fusionner avec les images signatures
          const merged = (data as unknown as Service[]).map((s) => {
            const match = signatureBraids.find((b) => b.name.toLowerCase() === s.name.toLowerCase());
            return match ? { ...s, imageUrl: match.imageUrl, badge: match.badge } : s;
          });

          // S'assurer que les 4 braids sont présentes
          for (const b of signatureBraids) {
            if (!merged.some((m) => m.name.toLowerCase() === b.name.toLowerCase())) {
              merged.unshift(b);
            }
          }
          setServices(merged);
        } else {
          setServices([...signatureBraids, ...defaultOtherServices]);
        }
      } catch (err) {
        console.error(err);
        setServices([...signatureBraids, ...defaultOtherServices]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const categories = ['Tous', 'Tresses & Braids', ...Array.from(new Set(services.map((s) => s.category).filter((c) => c !== 'Tresses & Braids')))];

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'Tous' || service.category === selectedCategory;
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* En-tête de la page */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wider border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Atelier Cindy Malorie • Pavia & Lombardie</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900">
          Prestations de Coiffure & Braids d'Exception
        </h1>
        <p className="text-stone-700 text-base leading-relaxed">
          Au <strong>Studio Privé (Via Francana 10, Pavia)</strong> ou directement <strong>à votre domicile</strong> partout en Lombardie (Milan, Pavia et alentours).
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION VEDETTE : LES NOUVELLES CRÉATIONS TRESSES & BRAIDS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 rounded-3xl p-8 sm:p-12 text-white border-2 border-stone-800 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-800 pb-6">
          <div className="space-y-2">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400" />
              Spécialité Braids & Tresses Artistiques
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Nos Coiffures Tressées Phares
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              Réalisations exclusives par Cindy Malorie. Précision géométrique millimétrée, protection de la fibre capillaire et style affirmé.
            </p>
          </div>
          <Link
            to="/booking"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all self-start md:self-auto flex items-center gap-2"
          >
            <span>Réserver un créneau Braid</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {signatureBraids.map((braid) => (
            <div
              key={braid.id}
              className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden flex flex-col justify-between hover:border-amber-400/50 transition-all group"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-stone-950">
                <img
                  src={braid.imageUrl}
                  alt={braid.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
                <span className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  {braid.badge}
                </span>
                <span className="absolute bottom-3 right-3 text-2xl font-serif font-bold text-amber-300">
                  {formatCurrency(Number(braid.price))}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                    {braid.name}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2">
                    {braid.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-800">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {braid.duration_minutes === 150 ? '2h - 3h' :
                       braid.duration_minutes === 105 ? '1h30 - 2h' :
                       braid.duration_minutes === 195 ? '3h - 3h30' : '1h - 2h'}
                    </span>
                  </div>

                  <Link
                    to={`/booking?serviceName=${encodeURIComponent(braid.name)}`}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Choisir cette coiffure</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATALOGUE COMPLET AVEC RECHERCHE ET FILTRES */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (ex: Stitch, Cornrows, Brushing...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 bg-white"
            />
          </div>

          {/* Onglets de catégories */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des Services */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-900 border-t-transparent" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-stone-200 space-y-4 max-w-lg mx-auto">
            <Scissors className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="text-lg font-bold text-stone-900">Aucune prestation trouvée</h3>
            <p className="text-sm text-stone-600">
              Essayez de modifier votre recherche ou sélectionnez une autre catégorie.
            </p>
            <button
              onClick={() => { setSelectedCategory('Tous'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-3xl p-7 border-2 border-stone-200 shadow-sm hover:shadow-md hover:border-stone-400 transition-all flex flex-col justify-between group overflow-hidden"
              >
                <div className="space-y-4">
                  {service.imageUrl && (
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-2">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                      {service.category}
                    </span>
                    <span className="text-2xl font-bold font-serif text-stone-900">
                      {formatCurrency(Number(service.price))}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-stone-900 mb-2">{service.name}</h3>
                    <p className="text-sm text-stone-600 leading-relaxed">{service.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-600 font-semibold pt-2 border-t border-stone-100">
                    <Clock className="w-4 h-4 text-stone-500" />
                    <span>
                      Durée :{' '}
                      {service.duration_minutes === 150 ? '2h - 3h' :
                       service.duration_minutes === 105 ? '1h30 - 2h' :
                       service.duration_minutes === 195 ? '3h - 3h30' :
                       service.duration_minutes === 90 ? '1h - 2h' :
                       `${service.duration_minutes} min`}
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100">
                  <Link
                    to={`/booking?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}`}
                    className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:bg-amber-600"
                  >
                    <span>Réserver cette prestation</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
