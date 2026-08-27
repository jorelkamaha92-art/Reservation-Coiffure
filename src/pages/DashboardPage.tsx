import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails, Reward, LoyaltyTransaction } from '../types';
import { MOCK_APPOINTMENTS, MOCK_REWARDS, MOCK_LOYALTY_TRANSACTIONS } from '../lib/mockData';
import { formatDateFr, formatTimeFr } from '../utils/date';
import { formatCurrency, getStatusBadgeColor, getStatusLabel } from '../utils/format';
import { 
  Calendar, 
  MapPin, 
  Award, 
  Clock, 
  Gift,
  AlertTriangle,
  User as UserIcon,
  History,
  CheckCircle2,
  Bell,
  Check,
  Sparkles,
  Send
} from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { profileSchema } from '../lib/validations';

export const DashboardPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Navigation par onglets synchronisée avec l'URL
  const getInitialTab = (): 'overview' | 'profile' | 'history' | 'loyalty' => {
    const path = location.pathname;
    if (path.includes('profile')) return 'profile';
    if (path.includes('history')) return 'history';
    if (path.includes('loyalty')) return 'loyalty';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'history' | 'loyalty'>(getInitialTab());

  // Données
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // État d'annulation
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filtre d'historique
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Formulaire de profil
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    favorite_cut: (profile?.preferences as any)?.favorite_cut || '',
    favorite_color: (profile?.preferences as any)?.favorite_color || '',
    hair_type: (profile?.preferences as any)?.hair_type || '',
  });
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Échange de récompenses
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [loyaltyFeedback, setLoyaltyFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Message d'erreur de redirection de permission
  const errorMessage = 
    (location.state as any)?.error || 
    (searchParams.get('error') === 'access_denied_admin_only' 
      ? 'Accès refusé : cette section est réservée aux administrateurs.' 
      : null);

  // Synchronisation avec le profil
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        favorite_cut: (profile.preferences as any)?.favorite_cut || '',
        favorite_color: (profile.preferences as any)?.favorite_color || '',
        hair_type: (profile.preferences as any)?.hair_type || '',
      });
    }
  }, [profile]);

  // Synchronisation onglet lors du changement d'URL
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const fetchClientData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Récupérer les rendez-vous
      const { data: appData } = await supabase
        .from('appointments')
        .select(`
          *,
          services (*),
          staff (*)
        `)
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: false });

      if (appData && appData.length > 0) {
        setAppointments(appData as unknown as AppointmentWithDetails[]);
      } else {
        setAppointments(MOCK_APPOINTMENTS.slice(0, 3));
      }

      // 2. Récupérer les récompenses
      const { data: rewData } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (rewData && rewData.length > 0) {
        setRewards(rewData as unknown as Reward[]);
      } else {
        setRewards(MOCK_REWARDS);
      }

      // 3. Récupérer l'historique des transactions de fidélité
      const { data: txData } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (txData && txData.length > 0) {
        setLoyaltyTransactions(txData as unknown as LoyaltyTransaction[]);
      } else {
        setLoyaltyTransactions(MOCK_LOYALTY_TRANSACTIONS);
      }
    } catch (err) {
      console.error(err);
      setAppointments(MOCK_APPOINTMENTS.slice(0, 3));
      setRewards(MOCK_REWARDS);
      setLoyaltyTransactions(MOCK_LOYALTY_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [user]);

  // Annulation de rendez-vous via Edge Function cancel-appointment
  const handleCancelAppointment = async (appointmentId: string) => {
    const reason = prompt('Motif de l\'annulation (optionnel) :');
    if (reason === null) return; // Annulé par l'utilisateur

    setCancellingId(appointmentId);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-appointment', {
        body: { appointment_id: appointmentId, reason },
      });

      if (!error && data?.success) {
        await fetchClientData();
      } else {
        // Fallback direct RLS
        await supabase
          .from('appointments')
          .update({ status: 'cancelled', notes: reason ? `[Annulé : ${reason}]` : '[Annulé]' })
          .eq('id', appointmentId)
          .eq('client_id', user!.id);

        await fetchClientData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  // Mise à jour du profil client
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    // Validation Zod
    const validation = profileSchema.safeParse({
      full_name: profileForm.full_name,
      email: user.email || '',
      phone: profileForm.phone || undefined,
      address: profileForm.address || undefined,
      preferences: {
        favorite_cut: profileForm.favorite_cut,
        favorite_color: profileForm.favorite_color,
        hair_type: profileForm.hair_type,
      },
    });

    if (!validation.success) {
      setProfileErrorMsg(validation.error.errors[0]?.message || 'Données invalides');
      setSavingProfile(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone || null,
          address: profileForm.address || null,
          preferences: {
            favorite_cut: profileForm.favorite_cut,
            favorite_color: profileForm.favorite_color,
            hair_type: profileForm.hair_type,
          },
        })
        .eq('id', user.id);

      if (error) {
        setProfileErrorMsg(`Erreur : ${error.message}`);
      } else {
        setProfileSuccessMsg('Profil et préférences mis à jour avec succès !');
        await refreshProfile();
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Échange de points contre une récompense via Edge Function
  const handleRedeemReward = async (rewardId: string, rewardName: string, pointsRequired: number) => {
    if ((profile?.loyalty_points || 0) < pointsRequired) {
      alert(`Solde insuffisant. Vous avez besoin de ${pointsRequired} points pour obtenir cette récompense.`);
      return;
    }

    if (!confirm(`Souhaitez-vous échanger ${pointsRequired} points contre "${rewardName}" ?`)) {
      return;
    }

    setRedeemingId(rewardId);
    setLoyaltyFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('redeem-loyalty-points', {
        body: { reward_id: rewardId },
      });

      if (!error && data?.success) {
        setLoyaltyFeedback({ success: true, message: data.message });
        await refreshProfile();
        await fetchClientData();
      } else {
        const errorMsg = data?.error || error?.message || 'Échec lors de l\'échange des points.';
        setLoyaltyFeedback({ success: false, message: errorMsg });
      }
    } catch (err: any) {
      setLoyaltyFeedback({ success: false, message: err.message });
    } finally {
      setRedeemingId(null);
    }
  };

  // Calcul des statistiques de fidélité
  const userPoints = profile?.loyalty_points || 0;
  const nextReward = rewards.find((r) => r.points_required > userPoints) || rewards[rewards.length - 1];
  const progressPercent = nextReward ? Math.min(100, Math.round((userPoints / nextReward.points_required) * 100)) : 100;

  // Filtrage des rendez-vous
  const upcomingAppointments = appointments.filter(
    (app) => app.status === 'confirmed' || app.status === 'pending'
  );

  const filteredHistory = appointments.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedAppointments = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Alerte d'erreur de permission */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-sm font-semibold flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* En-tête Client & Programme Fidélité */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center text-2xl font-serif font-bold shadow-md flex-shrink-0">
            {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-serif text-stone-900">
                Bonjour, {profile?.full_name || user?.email}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Client Privilège
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span className="line-clamp-1">{profile?.address || 'Adresse de domicile non renseignée'}</span>
            </p>
          </div>
        </div>

        {/* Carte Solde Points & Jauge */}
        <div className="w-full md:w-80 bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-700" />
              <span className="text-xs uppercase font-bold text-amber-900">Solde Fidélité</span>
            </div>
            <span className="text-xl font-serif font-bold text-amber-950">
              {userPoints} <span className="text-xs font-sans text-amber-800">pts</span>
            </span>
          </div>

          {/* Barre de progression vers la prochaine récompense */}
          <div className="space-y-1">
            <div className="w-full bg-amber-200/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {nextReward && (
              <p className="text-[11px] text-amber-900 text-right">
                {userPoints >= nextReward.points_required
                  ? '🎉 Récompense débloquée !'
                  : `Plus que ${nextReward.points_required - userPoints} pts pour : ${nextReward.name}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barre de Navigation des 4 Vues Client */}
      <div className="flex flex-wrap gap-2 border-b-2 border-stone-200 pb-4">
        {[
          { id: 'overview', label: 'Tableau de bord', icon: Calendar, path: '/dashboard' },
          { id: 'profile', label: 'Mon Profil & Préférences', icon: UserIcon, path: '/dashboard/profile' },
          { id: 'history', label: 'Historique des Rendez-vous', icon: History, path: '/dashboard/history' },
          { id: 'loyalty', label: 'Programme Fidélité & Récompenses', icon: Gift, path: '/dashboard/loyalty' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-2 ${
                isActive
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. VUE TABLEAU DE BORD (OVERVIEW) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Section Prochains Rendez-vous */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-700" />
                Vos Prochains Rendez-vous à Domicile
              </h2>
              <Link
                to="/reservation"
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                + Nouvelle réservation
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-900 border-t-transparent mx-auto" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border-2 border-stone-200 space-y-4">
                <Calendar className="w-10 h-10 text-stone-400 mx-auto" />
                <h3 className="text-lg font-bold text-stone-900">Aucun rendez-vous à venir</h3>
                <p className="text-sm text-stone-600 max-w-sm mx-auto">
                  Prenez rendez-vous en quelques clics avec Cindy Malorie pour une prestation à votre domicile.
                </p>
                <Link
                  to="/reservation"
                  className="inline-block px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow"
                >
                  Réserver une prestation
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingAppointments.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm hover:border-stone-400 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeColor(app.status)}`}>
                          {getStatusLabel(app.status)}
                        </span>
                        <span className="text-base font-bold font-serif text-stone-900">
                          {formatCurrency(Number(app.services?.price || 0))}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-stone-900">{app.services?.name}</h3>

                      <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 font-semibold pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-amber-700" />
                          <span>{formatDateFr(app.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span>{formatTimeFr(app.start_time)} - {formatTimeFr(app.end_time)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-stone-600 font-medium flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0" />
                        <span className="line-clamp-1">{app.location_address || 'À votre domicile'}</span>
                      </div>
                    </div>

                    {/* Statut Notifications & Annulation */}
                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1" title="Email de confirmation">
                          <Send className={`w-3.5 h-3.5 ${app.confirmation_sent ? 'text-emerald-600' : 'text-stone-400'}`} />
                          {app.confirmation_sent ? 'Email envoyé' : 'Email en cours'}
                        </span>
                        <span className="flex items-center gap-1" title="Rappel 24h avant">
                          <Bell className={`w-3.5 h-3.5 ${app.reminder_sent ? 'text-emerald-600' : 'text-stone-400'}`} />
                          {app.reminder_sent ? 'Rappel envoyé' : 'Rappel programmé'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        disabled={cancellingId === app.id}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 underline transition-colors disabled:opacity-50"
                      >
                        {cancellingId === app.id ? 'Annulation...' : 'Annuler'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raccourcis Rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div
              onClick={() => setActiveTab('loyalty')}
              className="p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-200 hover:border-amber-400 transition-all cursor-pointer space-y-2"
            >
              <Gift className="w-6 h-6 text-amber-700" />
              <h3 className="font-bold text-stone-900 text-sm">Catalogue Récompenses</h3>
              <p className="text-xs text-stone-600">
                Vous avez {userPoints} points disponibles à échanger contre des réductions et soins offerts.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('profile')}
              className="p-6 rounded-3xl bg-stone-50 border-2 border-stone-200 hover:border-stone-400 transition-all cursor-pointer space-y-2"
            >
              <UserIcon className="w-6 h-6 text-stone-700" />
              <h3 className="font-bold text-stone-900 text-sm">Préférences Capillaires</h3>
              <p className="text-xs text-stone-600">
                Renseignez votre type de cheveux et couleur favorite pour un accueil sur-mesure.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('history')}
              className="p-6 rounded-3xl bg-stone-50 border-2 border-stone-200 hover:border-stone-400 transition-all cursor-pointer space-y-2"
            >
              <History className="w-6 h-6 text-stone-700" />
              <h3 className="font-bold text-stone-900 text-sm">Historique Complet</h3>
              <p className="text-xs text-stone-600">
                Retrouvez toutes vos prestations passées et suivez vos rendez-vous coiffure.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VUE MON PROFIL & PRÉFÉRENCES */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-sm space-y-6 animate-fadeIn max-w-3xl">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-amber-700" />
              Mon Profil & Préférences Capillaires
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Gérez vos informations personnelles et vos préférences pour vos prochains rendez-vous à domicile.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs sm:text-sm font-medium flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs sm:text-sm font-medium flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-700 flex-shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
                Coordonnées Personnelles
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Email de connexion</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 bg-stone-100 text-xs sm:text-sm text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Téléphone de contact</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Ex: 06 12 34 56 78"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Adresse complète de domicile</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Ex: 14 Rue de la Paix, 75002 Paris (Bâtiment B, Étage 3, Code 1234A)"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900"
                />
              </div>
            </div>

            {/* Préférences Capillaires (JSONB) */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Préférences Personnalisées
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Type de cheveux</label>
                  <input
                    type="text"
                    value={profileForm.hair_type}
                    onChange={(e) => setProfileForm({ ...profileForm, hair_type: e.target.value })}
                    placeholder="Ex: Épais, ondulés, fins..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Coupe préférée</label>
                  <input
                    type="text"
                    value={profileForm.favorite_cut}
                    onChange={(e) => setProfileForm({ ...profileForm, favorite_cut: e.target.value })}
                    placeholder="Ex: Carré plongeant, dégradé..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Couleur / Teinte favorite</label>
                  <input
                    type="text"
                    value={profileForm.favorite_color}
                    onChange={(e) => setProfileForm({ ...profileForm, favorite_color: e.target.value })}
                    placeholder="Ex: Blond beige, cuivré..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingProfile ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Enregistrer mes modifications</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VUE HISTORIQUE DES RENDEZ-VOUS */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <History className="w-6 h-6 text-amber-700" />
                Historique Complet des Rendez-vous
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Consultez l'état de l'ensemble de vos rendez-vous passés et à venir.
              </p>
            </div>

            {/* Filtre par statut */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'confirmed', label: 'Confirmés' },
                { id: 'pending', label: 'En attente' },
                { id: 'completed', label: 'Terminés' },
                { id: 'cancelled', label: 'Annulés' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setStatusFilter(f.id); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    statusFilter === f.id
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {paginatedAppointments.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              Aucun rendez-vous ne correspond à ce filtre.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl border-2 border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-stone-400 transition-all bg-white"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                      <span className="text-xs text-stone-600 font-semibold">
                        {app.location_type === 'home' ? '🏠 À Domicile' : '💈 Studio Privé'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900">{app.services?.name}</h3>

                    <div className="flex flex-wrap gap-4 text-xs text-stone-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-800" />
                        {formatDateFr(app.appointment_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-800" />
                        {formatTimeFr(app.start_time)} - {formatTimeFr(app.end_time)}
                      </span>
                      {app.location_address && (
                        <span className="flex items-center gap-1 text-stone-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {app.location_address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                    <span className="text-lg font-bold font-serif text-stone-900">
                      {formatCurrency(Number(app.services?.price || 0))}
                    </span>

                    {(app.status === 'pending' || app.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        disabled={cancellingId === app.id}
                        className="text-xs text-rose-700 hover:text-rose-900 font-bold mt-1 underline transition-colors disabled:opacity-50"
                      >
                        {cancellingId === app.id ? 'Annulation...' : 'Annuler'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4 border-t border-stone-100">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                    currentPage === page
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VUE PROGRAMME FIDÉLITÉ & RÉCOMPENSES */}
      {/* ========================================================================= */}
      {activeTab === 'loyalty' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Bannière Solde & Avantages */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                <Award className="w-3.5 h-3.5" />
                Programme Fidélité Privilège
              </span>
              <h2 className="text-3xl font-serif font-bold">Vos Points de Récompense</h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-lg leading-relaxed">
                Chaque euro dépensé vous rapporte 1 point. Échangez vos points contre des prestations offertes ou des réductions exclusives.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[200px]">
              <span className="text-xs uppercase text-amber-300 font-bold tracking-wider">Solde Disponible</span>
              <div className="text-4xl font-bold font-serif text-amber-400 mt-1">
                {userPoints}
              </div>
              <span className="text-xs text-stone-300">points fidélité</span>
            </div>
          </div>

          {loyaltyFeedback && (
            <div
              className={`p-4 rounded-2xl border-2 text-xs sm:text-sm font-semibold flex items-center gap-3 ${
                loyaltyFeedback.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              {loyaltyFeedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-700 flex-shrink-0" />
              )}
              <span>{loyaltyFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Catalogue des Récompenses Disponibles (Gauche) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-700" />
                  Catalogue des Récompenses
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Cliquez sur "Échanger" pour utiliser vos points cumulés.
                </p>
              </div>

              <div className="space-y-4">
                {rewards.map((reward) => {
                  const canRedeem = userPoints >= reward.points_required;
                  return (
                    <div
                      key={reward.id}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        canRedeem
                          ? 'border-amber-400 bg-amber-50/60 shadow-sm'
                          : 'border-stone-200 bg-stone-50/50 opacity-80'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-sm">{reward.name}</h4>
                          <span className="text-xs font-bold text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                            {reward.points_required} pts
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">{reward.description}</p>
                      </div>

                      <button
                        type="button"
                        disabled={!canRedeem || redeemingId === reward.id}
                        onClick={() => handleRedeemReward(reward.id, reward.name, reward.points_required)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex-shrink-0 ${
                          canRedeem
                            ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-sm'
                            : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {redeemingId === reward.id ? 'Échange en cours...' : canRedeem ? 'Échanger' : 'Points insuffisants'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historique des Transactions (Droite) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-700" />
                  Historique des Points
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">Derniers mouvements de votre solde</p>
              </div>

              {loyaltyTransactions.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">Aucune transaction pour le moment.</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {loyaltyTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-stone-900">{tx.description}</p>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {formatDateFr(tx.created_at)}
                        </span>
                      </div>
                      <span
                        className={`font-bold font-serif text-sm ${
                          tx.points > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
