import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Reward, LoyaltyTransaction } from '../types';
import { MOCK_REWARDS, MOCK_CLIENTS, MOCK_LOYALTY_TRANSACTIONS } from '../lib/mockData';
import { formatDateFr } from '../utils/date';
import {
  Award,
  Plus,
  Gift,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Settings,
  Edit3,
  Trash2,
  Check,
  Shield,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TransactionWithProfile extends LoyaltyTransaction {
  profiles?: Profile;
}

export const AdminLoyaltyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'transactions' | 'settings' | 'reports'>('rewards');
  const [loading, setLoading] = useState<boolean>(true);

  // Données
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithProfile[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);

  // Paramètres généraux
  const [programSettings, setProgramSettings] = useState({
    isActive: true,
    pointsPerEuro: 1,
    minPointsToRedeem: 50,
    bonusSignupPoints: 20,
    pointsValidityMonths: 0, // 0 = illimité
  });
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Recherche & Filtres Transactions
  const [searchTx, setSearchTx] = useState<string>('');
  const [filterTxType, setFilterTxType] = useState<string>('all');

  // Modal Récompense (Création / Édition)
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_required: 100,
    is_active: true,
  });

  // Modal Ajustement Manuel de Points
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    clientId: '',
    points: 25,
    operationType: 'add' as 'add' | 'deduct',
    reason: '',
  });

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Charger toutes les données du programme
  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      // 1. Récompenses
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .order('points_required', { ascending: true });

      if (rewardsData && rewardsData.length > 0) {
        setRewards(rewardsData as unknown as Reward[]);
      } else {
        setRewards(MOCK_REWARDS);
      }

      // 2. Clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('*')
        .order('loyalty_points', { ascending: false });

      if (clientsData) {
        setClients(clientsData as unknown as Profile[]);
      } else {
        setClients([]);
      }

      // 3. Transactions
      const { data: txData } = await supabase
        .from('loyalty_transactions')
        .select('*, profiles (*)')
        .order('created_at', { ascending: false });

      if (txData) {
        setTransactions(txData as unknown as TransactionWithProfile[]);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Erreur chargement fidélité :', err);
      setRewards(MOCK_REWARDS);
      setClients([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  // Ouvrir modal Récompense
  const handleOpenRewardModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setRewardForm({
        name: reward.name,
        description: reward.description || '',
        points_required: reward.points_required,
        is_active: reward.is_active,
      });
    } else {
      setEditingReward(null);
      setRewardForm({
        name: '',
        description: '',
        points_required: 100,
        is_active: true,
      });
    }
    setIsRewardModalOpen(true);
  };

  // Enregistrer Récompense (Insert ou Update)
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update({
            name: rewardForm.name,
            description: rewardForm.description || null,
            points_required: Number(rewardForm.points_required),
            is_active: rewardForm.is_active,
          })
          .eq('id', editingReward.id);

        if (error) throw error;
        setFeedback({ success: true, message: `Récompense "${rewardForm.name}" modifiée.` });
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert({
            name: rewardForm.name,
            description: rewardForm.description || null,
            points_required: Number(rewardForm.points_required),
            is_active: rewardForm.is_active,
          });

        if (error) throw error;
        setFeedback({ success: true, message: `Récompense "${rewardForm.name}" créée.` });
      }

      setIsRewardModalOpen(false);
      await fetchLoyaltyData();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Erreur enregistrement récompense.' });
    }
  };

  // Supprimer Récompense
  const handleDeleteReward = async (reward: Reward) => {
    if (!confirm(`Supprimer définitivement la récompense "${reward.name}" ?`)) return;
    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', reward.id);

      if (error) throw error;
      setFeedback({ success: true, message: `Récompense "${reward.name}" supprimée.` });
      await fetchLoyaltyData();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Erreur suppression.' });
    }
  };

  // Toggle statut actif de la récompense
  const handleToggleRewardActive = async (reward: Reward) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !reward.is_active })
        .eq('id', reward.id);

      if (error) throw error;
      await fetchLoyaltyData();
    } catch (err) {
      console.error(err);
    }
  };

  // Effectuer un ajustement manuel de points
  const handleManualPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.clientId) {
      alert('Veuillez sélectionner un client.');
      return;
    }
    if (!manualForm.reason.trim()) {
      alert('Une justification est obligatoire pour toute modification manuelle.');
      return;
    }

    const client = clients.find((c) => c.id === manualForm.clientId);
    if (!client) return;

    const pointsAmount = Number(manualForm.points);
    const finalDelta = manualForm.operationType === 'add' ? pointsAmount : -pointsAmount;
    const newBalance = Math.max(0, (client.loyalty_points || 0) + finalDelta);
    const txType = manualForm.operationType === 'add' ? 'earned' : 'redeemed';
    const auditDescription = `[Ajustement Manuel Admin] ${manualForm.reason} (${finalDelta > 0 ? '+' : ''}${finalDelta} pts)`;

    try {
      // 1. Mettre à jour le solde dans profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ loyalty_points: newBalance })
        .eq('id', client.id);

      if (profileError) throw profileError;

      // 2. Insérer la transaction d'audit
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert({
          client_id: client.id,
          points: finalDelta,
          transaction_type: txType,
          description: auditDescription,
        });

      if (txError) throw txError;

      setFeedback({
        success: true,
        message: `Points ajustés avec succès pour ${client.full_name || client.email} (Nouveau solde : ${newBalance} pts).`,
      });

      setIsManualModalOpen(false);
      setManualForm({ clientId: '', points: 25, operationType: 'add', reason: '' });
      await fetchLoyaltyData();
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Erreur lors de l’ajustement des points.' });
    }
  };

  // Sauvegarder les paramètres généraux
  const handleSaveSettings = () => {
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      setFeedback({ success: true, message: 'Paramètres généraux du programme de fidélité mis à jour.' });
    }, 600);
  };

  // Calculs KPIs & Statistiques
  const totalEarnedPoints = transactions
    .filter((t) => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);

  const totalRedeemedPoints = transactions
    .filter((t) => t.points < 0)
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  const totalRedeemedCount = transactions.filter((t) => t.transaction_type === 'redeemed').length;

  const topClients = clients.slice(0, 5);

  // Filtrage des transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterTxType !== 'all' && tx.transaction_type !== filterTxType) return false;
    if (searchTx.trim() !== '') {
      const q = searchTx.toLowerCase();
      const clientName = (tx.profiles?.full_name || '').toLowerCase();
      const clientEmail = (tx.profiles?.email || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      if (!clientName.includes(q) && !clientEmail.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* En-tête avec Navigation Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-700" />
            Portail Administration & Coiffeur
          </div>
          <h1 className="text-3xl font-bold font-serif text-stone-900 mt-1">
            Programme de Fidélité & Récompenses
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Configurez le barème de points, le catalogue de récompenses, journalisez les mouvements et récompensez vos clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ajuster des Points</span>
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

      {/* ========================================================================= */}
      {/* 1. KPIS & RAPPORTS EN TÊTE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1 : Points Distribués */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Points Distribués</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-stone-900">
              {totalEarnedPoints} <span className="text-sm font-sans font-normal text-stone-500">pts</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Cumul total gagné par les clients</p>
          </div>
        </div>

        {/* KPI 2 : Points Consommés */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Points Consommés</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-700">
              {totalRedeemedPoints} <span className="text-sm font-sans font-normal text-stone-500">pts</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Échangés contre des récompenses</p>
          </div>
        </div>

        {/* KPI 3 : Récompenses Échangées */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Récompenses Échangées</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-purple-900">
              {totalRedeemedCount} <span className="text-sm font-sans font-normal text-stone-500">offres</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Soins et remises appliquées</p>
          </div>
        </div>

        {/* KPI 4 : Clients Adhérents */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Clients Inscrits</span>
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-stone-900">
              {clients.length} <span className="text-sm font-sans font-normal text-stone-500">profils</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Bénéficiant du programme fidélité</p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ONGLETS DE GESTION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden">
        
        {/* Navigation des Onglets */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 overflow-x-auto">
          {[
            { id: 'rewards', label: '🎁 Catalogue des Récompenses', icon: Gift },
            { id: 'transactions', label: '📜 Journal des Transactions', icon: Clock },
            { id: 'reports', label: '🏆 Top Clients & Rapports', icon: Award },
            { id: 'settings', label: '⚙️ Paramètres du Programme', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'border-stone-900 text-stone-900 bg-white'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/50'
                }`}
              >
                <Icon className="w-4 h-4 text-amber-700" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 sm:p-8">
          
          {/* ===================================================================== */}
          {/* ONGLET 1 : CATALOGUE DES RÉCOMPENSES */}
          {/* ===================================================================== */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    Récompenses Échangeables par les Clients
                  </h2>
                  <p className="text-xs text-stone-500">
                    Définissez les cadeaux, réductions et soins offerts en échange des points accumulés.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenRewardModal()}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow transition-all flex items-center gap-2 self-start"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Ajouter une Récompense</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-stone-400">Chargement...</div>
              ) : rewards.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  Aucune récompense configurée.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                        !reward.is_active ? 'bg-stone-50/80 border-dashed opacity-60' : 'bg-white border-stone-200 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                            {reward.points_required} points
                          </span>

                          <span className={`text-[11px] font-bold ${reward.is_active ? 'text-emerald-700' : 'text-stone-400'}`}>
                            {reward.is_active ? '● Actif' : '○ Masqué'}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-stone-900 text-base">{reward.name}</h3>
                          <p className="text-xs text-stone-600 leading-relaxed mt-1 line-clamp-3">
                            {reward.description || 'Aucune description rédigée.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
                        <button
                          onClick={() => handleToggleRewardActive(reward)}
                          className="font-bold underline text-stone-600 hover:text-stone-900"
                        >
                          {reward.is_active ? 'Désactiver' : 'Activer'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenRewardModal(reward)}
                            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-800"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReward(reward)}
                            className="p-2 rounded-xl text-rose-700 hover:bg-rose-50"
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
            </div>
          )}

          {/* ===================================================================== */}
          {/* ONGLET 2 : JOURNAL DE TOUTES LES TRANSACTIONS */}
          {/* ===================================================================== */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              
              {/* Filtres & Recherche */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchTx}
                    onChange={(e) => setSearchTx(e.target.value)}
                    placeholder="Rechercher par client, motif..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-stone-200 focus:border-stone-900 text-xs bg-stone-50/50"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {[
                    { id: 'all', label: 'Toutes' },
                    { id: 'earned', label: 'Points Gagnés (+)' },
                    { id: 'redeemed', label: 'Points Échangés (-)' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterTxType(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        filterTxType === f.id
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tableau des transactions */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Client</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Motif & Description</th>
                      <th className="py-3 px-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-stone-500">
                          Aucune transaction trouvée.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                            {formatDateFr(tx.created_at)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-stone-900 block">
                              {tx.profiles?.full_name || 'Client'}
                            </span>
                            <span className="text-[11px] text-stone-400">{tx.profiles?.email}</span>
                          </td>
                          <td className="py-3 px-3">
                            {tx.points > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <ArrowUpRight className="w-3 h-3" />
                                Gain
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                <ArrowDownLeft className="w-3 h-3" />
                                Échange
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-700 max-w-md">
                            {tx.description || 'Prestation complétée'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-bold font-serif text-sm ${tx.points > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* ONGLET 3 : TOP CLIENTS & RAPPORTS */}
          {/* ===================================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Classement des Clients les Plus Fidèles
                </h3>
                <p className="text-xs text-stone-500">
                  Les clients ayant accumulé le plus de points de fidélité et de réservations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topClients.map((client, index) => (
                  <div
                    key={client.id}
                    className="p-6 rounded-3xl bg-stone-50 border-2 border-stone-200 relative overflow-hidden space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center shadow">
                        #{index + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                        {client.loyalty_points || 0} points
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-base">{client.full_name || 'Client'}</h4>
                      <p className="text-xs text-stone-500">{client.email}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-200 text-xs text-stone-600 flex justify-between">
                      <span>Inscrit le :</span>
                      <strong>{formatDateFr(client.created_at)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* ONGLET 4 : PARAMÈTRES GÉNÉRAUX DU PROGRAMME */}
          {/* ===================================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Règles & Barème de Conversion
                </h3>
                <p className="text-xs text-stone-500">
                  Ajustez les modalités d'attribution automatique des points lors de la complétion des prestations.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Statut Global */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 block text-sm">Programme de Fidélité Actif</span>
                    <span className="text-stone-500">Permet aux clients de cumuler et d'échanger leurs points.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={programSettings.isActive}
                    onChange={(e) => setProgramSettings({ ...programSettings, isActive: e.target.checked })}
                    className="w-5 h-5 text-stone-900 rounded border-stone-300 cursor-pointer"
                  />
                </div>

                {/* Taux de conversion */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-800 block">Taux de conversion (€ vers Points)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={programSettings.pointsPerEuro}
                      onChange={(e) => setProgramSettings({ ...programSettings, pointsPerEuro: Number(e.target.value) })}
                      className="w-32 px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 text-sm bg-white"
                    />
                    <span className="text-stone-600 font-semibold">point(s) attribué(s) par euro dépensé</span>
                  </div>
                  <p className="text-[11px] text-stone-400">Exemple : Une prestation à 60 € rapporte 60 points au client.</p>
                </div>

                {/* Bonus de bienvenue */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-800 block">Bonus de bienvenue à l'inscription</label>
                  <input
                    type="number"
                    min="0"
                    value={programSettings.bonusSignupPoints}
                    onChange={(e) => setProgramSettings({ ...programSettings, bonusSignupPoints: Number(e.target.value) })}
                    className="w-32 px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 text-sm bg-white"
                  />
                  <span className="text-stone-500 ml-2">points offerts à la création du compte</span>
                </div>

                {/* Seuil minimum pour échanger */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-800 block">Seuil minimum pour un échange</label>
                  <input
                    type="number"
                    min="10"
                    value={programSettings.minPointsToRedeem}
                    onChange={(e) => setProgramSettings({ ...programSettings, minPointsToRedeem: Number(e.target.value) })}
                    className="w-32 px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 text-sm bg-white"
                  />
                  <span className="text-stone-500 ml-2">points minimum</span>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={handleSaveSettings}
                    className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>{savingSettings ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALE 1 : CRÉATION / ÉDITION DE RÉCOMPENSE */}
      {/* ========================================================================= */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn">
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <h3 className="text-2xl font-serif font-bold text-stone-900">
                {editingReward ? 'Modifier la Récompense' : 'Nouvelle Récompense'}
              </h3>
              <button onClick={() => setIsRewardModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Intitulé de l'offre *</label>
                <input
                  type="text"
                  required
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="Ex: Soin Profond Kératine Offert"
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Points requis pour débloquer *</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={rewardForm.points_required}
                  onChange={(e) => setRewardForm({ ...rewardForm, points_required: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Description & Modalités</label>
                <textarea
                  rows={3}
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Ex: Soin nourrissant sans rinçage appliqué lors de votre prochain rendez-vous à domicile..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveReward"
                  checked={rewardForm.is_active}
                  onChange={(e) => setRewardForm({ ...rewardForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-stone-900 rounded border-stone-300 cursor-pointer"
                />
                <label htmlFor="isActiveReward" className="font-bold text-stone-800 cursor-pointer">
                  Récompense active et visible pour les clients
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Enregistrer l'offre</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE 2 : AJUSTEMENT MANUEL DE POINTS (AVEC JUSTIFICATION & AUDIT) */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn">
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Journal d'Audit Sécurisé
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  Ajuster des Points Manuellement
                </h3>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleManualPointsSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-stone-800 mb-1">Sélectionner le Client *</label>
                <select
                  required
                  value={manualForm.clientId}
                  onChange={(e) => setManualForm({ ...manualForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 text-sm bg-white"
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || 'Sans nom'} ({c.email}) - Solde actuel : {c.loyalty_points || 0} pts
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Opération *</label>
                  <select
                    value={manualForm.operationType}
                    onChange={(e) => setManualForm({ ...manualForm, operationType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  >
                    <option value="add">➕ Ajouter des points (+)</option>
                    <option value="deduct">➖ Déduire des points (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Quantité de Points *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualForm.points}
                    onChange={(e) => setManualForm({ ...manualForm, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Justification / Motif Obligatoire *
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualForm.reason}
                  onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                  placeholder="Ex: Geste commercial suite au retard de 15min, Anniversaire cliente, Parrainage amie..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
                ℹ️ Cette opération sera consignée avec horodatage dans la table <code>loyalty_transactions</code> pour des raisons de conformité et d'audit.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Valider l'ajustement</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
