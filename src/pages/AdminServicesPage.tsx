import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Service } from '../types';
import { MOCK_SERVICES } from '../lib/mockData';
import { formatCurrency } from '../utils/format';
import {
  Scissors,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Check,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_CATEGORIES = ['Femme', 'Homme', 'Enfant', 'Technique', 'Soins', 'Mariage & Événements'];

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal d'ajout / modification
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Formulaire
  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 45,
    category: 'Femme',
    is_active: true,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Charger les prestations
  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category')
        .order('price', { ascending: true });

      if (!error && data && data.length > 0) {
        setServices(data as unknown as Service[]);
      } else {
        setServices(MOCK_SERVICES);
      }
    } catch (err) {
      console.error('Erreur chargement services :', err);
      setServices(MOCK_SERVICES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Ouvrir modal en mode Création
  const handleOpenCreateModal = () => {
    setEditingService(null);
    setForm({
      name: '',
      description: '',
      duration_minutes: 60,
      price: 45,
      category: 'Femme',
      is_active: true,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Ouvrir modal en mode Édition
  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      category: service.category,
      is_active: service.is_active,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Soumission (Création ou Mise à jour)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingService) {
        // Update
        const { error } = await supabase
          .from('services')
          .update({
            name: form.name,
            description: form.description || null,
            duration_minutes: Number(form.duration_minutes),
            price: Number(form.price),
            category: form.category,
            is_active: form.is_active,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        setFeedback({ success: true, message: `Prestation "${form.name}" modifiée avec succès.` });
      } else {
        // Insert
        const { error } = await supabase
          .from('services')
          .insert({
            name: form.name,
            description: form.description || null,
            duration_minutes: Number(form.duration_minutes),
            price: Number(form.price),
            category: form.category,
            is_active: form.is_active,
          });

        if (error) throw error;
        setFeedback({ success: true, message: `Prestation "${form.name}" créée avec succès.` });
      }

      setIsModalOpen(false);
      await fetchServices();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Une erreur est survenue.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Actif / Inactif rapide
  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      await fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  // Suppression d'un service
  const handleDeleteService = async (service: Service) => {
    if (!confirm(`Confirmez-vous la suppression définitive du service "${service.name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;
      setFeedback({ success: true, message: `Service "${service.name}" supprimé.` });
      await fetchServices();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Erreur lors de la suppression.' });
    }
  };

  // Catégories existantes
  const allCategories = ['all', ...Array.from(new Set([...DEFAULT_CATEGORIES, ...services.map((s) => s.category)]))];

  // Filtrage
  const filteredServices = services.filter((service) => {
    if (selectedCategory !== 'all' && service.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = service.name.toLowerCase().includes(q);
      const matchDesc = (service.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* En-tête avec Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-700" />
            Portail Administration & Coiffeur
          </div>
          <h1 className="text-3xl font-bold font-serif text-stone-900 mt-1">
            Gestion du Catalogue des Prestations
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Créez, modifiez les tarifs, durées et activez/désactivez les prestations proposées en ligne.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/appointments"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm"
          >
            📅 Planning
          </Link>
          <Link
            to="/admin/clients"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm"
          >
            👥 Clients
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nouvelle Prestation</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-between animate-fadeIn ${
            feedback.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-700" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline">
            Fermer
          </button>
        </div>
      )}

      {/* Barre de Recherche et Filtres de Catégories */}
      <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une prestation..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs bg-stone-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              {cat === 'all' ? 'Toutes les catégories' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Grille des Services */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border-2 border-stone-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-stone-700">Chargement des prestations...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-stone-200 space-y-4">
          <Scissors className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">Aucune prestation trouvée</h3>
          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs shadow"
          >
            Créer la première prestation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:border-stone-400 ${
                !service.is_active ? 'opacity-60 bg-stone-50/70 border-dashed' : 'border-stone-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                    {service.category}
                  </span>
                  <span className="text-xl font-bold font-serif text-stone-900">
                    {formatCurrency(Number(service.price))}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-stone-900 text-base">{service.name}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed mt-1 line-clamp-3">
                    {service.description || 'Aucune description rédigée.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-stone-700 pt-2 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    {service.duration_minutes} minutes
                  </span>
                  <span className={`inline-flex items-center gap-1 font-bold ${service.is_active ? 'text-emerald-700' : 'text-stone-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${service.is_active ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                    {service.is_active ? 'En ligne' : 'Désactivé'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
                <button
                  onClick={() => handleToggleActive(service)}
                  className={`font-bold underline transition-colors ${
                    service.is_active ? 'text-stone-600 hover:text-stone-900' : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  {service.is_active ? 'Désactiver' : 'Activer'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(service)}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-800 transition-all"
                    title="Modifier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service)}
                    className="p-2 rounded-xl text-rose-700 hover:bg-rose-50 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE : CRÉATION / ÉDITION DE PRESTATION */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {editingService ? 'Modification' : 'Création'}
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  {editingService ? `Modifier "${editingService.name}"` : 'Nouvelle Prestation'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-stone-800 mb-1">Intitulé de la prestation *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Balayage Signature Cindy & Soin Kératine"
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Durée (en minutes) *</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    required
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Tarif (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Description détaillée</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez les étapes du soin, les produits utilisés et les bénéfices pour le cheveu..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveService"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900 cursor-pointer"
                />
                <label htmlFor="isActiveService" className="font-bold text-stone-800 cursor-pointer">
                  Prestation active et visible pour la réservation en ligne
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>{submitting ? 'Enregistrement...' : editingService ? 'Mettre à jour' : 'Créer la prestation'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
