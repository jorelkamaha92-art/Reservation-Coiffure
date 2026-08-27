import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Staff } from '../types';
import { MOCK_STAFF } from '../lib/mockData';
import {
  User,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Check,
  Shield,
  Sparkles,
  Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Formulaire
  const [form, setForm] = useState({
    full_name: '',
    specialty: '',
    bio: '',
    avatar_url: '',
    is_active: true,
  });

  // Upload image
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Charger la liste du staff
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setStaffList(data as unknown as Staff[]);
      } else {
        setStaffList(MOCK_STAFF);
      }
    } catch (err) {
      console.error('Erreur chargement staff :', err);
      setStaffList(MOCK_STAFF);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Upload photo vers le bucket Supabase Storage "avatars"
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérification taille (< 5MB) et format image
    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `staff-${Date.now()}.${fileExt}`;
      const filePath = `staff/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Si le bucket n'est pas encore créé, fallback en DataURL local
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm((prev) => ({ ...prev, avatar_url: reader.result as string }));
        };
        reader.readAsDataURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      }
    } catch (err: any) {
      console.error('Erreur upload :', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Ouvrir modal en Création
  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setForm({
      full_name: '',
      specialty: '',
      bio: '',
      avatar_url: '',
      is_active: true,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Ouvrir modal en Édition
  const handleOpenEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setForm({
      full_name: staff.full_name,
      specialty: staff.specialty || '',
      bio: staff.bio || '',
      avatar_url: staff.avatar_url || '',
      is_active: staff.is_active,
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
      if (editingStaff) {
        // Update
        const { error } = await supabase
          .from('staff')
          .update({
            full_name: form.full_name,
            specialty: form.specialty || null,
            bio: form.bio || null,
            avatar_url: form.avatar_url || null,
            is_active: form.is_active,
          })
          .eq('id', editingStaff.id);

        if (error) throw error;
        setFeedback({ success: true, message: `Profil de "${form.full_name}" mis à jour avec succès.` });
      } else {
        // Insert
        const { error } = await supabase
          .from('staff')
          .insert({
            full_name: form.full_name,
            specialty: form.specialty || null,
            bio: form.bio || null,
            avatar_url: form.avatar_url || null,
            is_active: form.is_active,
          });

        if (error) throw error;
        setFeedback({ success: true, message: `Coiffeur "${form.full_name}" ajouté avec succès.` });
      }

      setIsModalOpen(false);
      await fetchStaff();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Une erreur est survenue.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Actif / Inactif
  const handleToggleActive = async (staff: Staff) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !staff.is_active })
        .eq('id', staff.id);

      if (error) throw error;
      await fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  // Suppression
  const handleDeleteStaff = async (staff: Staff) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le profil de "${staff.full_name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staff.id);

      if (error) throw error;
      setFeedback({ success: true, message: `Profil de "${staff.full_name}" supprimé.` });
      await fetchStaff();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Erreur lors de la suppression.' });
    }
  };

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
            Gestion de l'Équipe & Profils Stylistes
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Administrez les coiffeurs disponibles à la réservation, leurs spécialités, photos et biographies.
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
            to="/admin/services"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm"
          >
            ✂️ Services
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Ajouter un Coiffeur</span>
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

      {/* Grille des Coiffeurs */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border-2 border-stone-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-stone-700">Chargement des profils...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-stone-200 space-y-4">
          <User className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">Aucun coiffeur configuré</h3>
          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs shadow"
          >
            Ajouter un premier profil
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:border-stone-400 ${
                !staff.is_active ? 'opacity-60 bg-stone-50/70 border-dashed' : 'border-stone-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={staff.avatar_url || 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&auto=format&fit=crop&q=80'}
                      alt={staff.full_name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-stone-200 shadow-sm"
                    />
                    <span className="absolute -bottom-1.5 -right-1 bg-amber-500 text-stone-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      Artisan
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-stone-900 text-base">{staff.full_name}</h3>
                      {staff.full_name.includes('Cindy') && (
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-amber-800">
                      {staff.specialty || 'Styliste & Coloriste'}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${staff.is_active ? 'text-emerald-700' : 'text-stone-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                      {staff.is_active ? 'Actif sur le site' : 'Inactif'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-normal pt-2 border-t border-stone-100">
                  {staff.bio || 'Aucune biographie rédigée.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
                <button
                  onClick={() => handleToggleActive(staff)}
                  className={`font-bold underline transition-colors ${
                    staff.is_active ? 'text-stone-600 hover:text-stone-900' : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  {staff.is_active ? 'Désactiver' : 'Activer'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(staff)}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-800 transition-all"
                    title="Modifier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff)}
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
      {/* MODALE : CRÉATION / ÉDITION DE COIFFEUR */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {editingStaff ? 'Modification' : 'Ajout'}
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  {editingStaff ? `Modifier "${editingStaff.full_name}"` : 'Nouveau Styliste'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Ex: Cindy Malorie"
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Spécialité & Domaines d'expertise</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Ex: Balayage Signature, Coiffure Mariage, Soins Botox..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Photo de profil (Avatar)</label>
                <div className="flex items-center gap-4">
                  {form.avatar_url && (
                    <img
                      src={form.avatar_url}
                      alt="Aperçu"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-stone-300"
                    />
                  )}
                  <label className="px-4 py-2 rounded-xl border-2 border-stone-300 hover:border-stone-900 bg-stone-50 cursor-pointer font-bold flex items-center gap-2 transition-all">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>{uploadingImage ? 'Téléchargement...' : 'Téléverser une photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="Ou collez directement l'URL d'une image..."
                  className="w-full px-3 py-1.5 mt-2 rounded-xl border border-stone-200 focus:border-stone-900 bg-white text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Biographie & Expérience</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Présentez le parcours, les diplômes, la philosophie de coiffure..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveStaff"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900 cursor-pointer"
                />
                <label htmlFor="isActiveStaff" className="font-bold text-stone-800 cursor-pointer">
                  Coiffeur actif et sélectionnable lors de la réservation en ligne
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
                  <span>{submitting ? 'Enregistrement...' : editingStaff ? 'Mettre à jour' : 'Ajouter le coiffeur'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
