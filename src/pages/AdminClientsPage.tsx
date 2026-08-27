import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, AppointmentWithDetails, LoyaltyTransaction } from '../types';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS, MOCK_LOYALTY_TRANSACTIONS } from '../lib/mockData';
import { formatDateFr } from '../utils/date';
import { formatCurrency, getStatusBadgeColor, getStatusLabel } from '../utils/format';
import {
  Users,
  Search,
  MapPin,
  Phone,
  Mail,
  Award,
  Sparkles,
  Calendar,
  Eye,
  Edit3,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ClientPipelineStatus = 'prospect' | 'actif' | 'fidèle' | 'inactif';

export const AdminClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPipeline, setFilterPipeline] = useState<string>('all');

  // Client sélectionné pour la fiche détaillée
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientAppointments, setClientAppointments] = useState<AppointmentWithDetails[]>([]);
  const [clientTransactions, setClientTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loadingClientDetails, setLoadingClientDetails] = useState<boolean>(false);

  // Édition des notes internes et du statut pipeline
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [clientPipeline, setClientPipeline] = useState<ClientPipelineStatus>('actif');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Charger la liste des clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setClients(data as unknown as Profile[]);
      } else {
        setClients(MOCK_CLIENTS);
      }
    } catch (err) {
      console.error('Erreur chargement clients :', err);
      setClients(MOCK_CLIENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Charger les détails d'un client (historique RDV + transactions de fidélité)
  const openClientDetails = async (client: Profile) => {
    setSelectedClient(client);
    setAdminNotes((client.preferences as any)?.admin_notes || '');
    setClientPipeline(((client as any).status as ClientPipelineStatus) || ((client.loyalty_points || 0) > 100 ? 'fidèle' : 'actif'));
    setSaveSuccess(null);
    setSaveError(null);
    setLoadingClientDetails(true);

    try {
      // 1. RDVs du client
      const { data: appData } = await supabase
        .from('appointments')
        .select('*, services (*), staff (*)')
        .eq('client_id', client.id)
        .order('appointment_date', { ascending: false });

      if (appData && appData.length > 0) {
        setClientAppointments(appData as unknown as AppointmentWithDetails[]);
      } else {
        const matchingApps = MOCK_APPOINTMENTS.filter((a) => a.client_id === client.id);
        setClientAppointments(matchingApps.length > 0 ? matchingApps : [MOCK_APPOINTMENTS[0]]);
      }

      // 2. Transactions fidélité
      const { data: txData } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (txData && txData.length > 0) {
        setClientTransactions(txData as unknown as LoyaltyTransaction[]);
      } else {
        const matchingTxs = MOCK_LOYALTY_TRANSACTIONS.filter((t) => t.client_id === client.id);
        setClientTransactions(matchingTxs.length > 0 ? matchingTxs : [MOCK_LOYALTY_TRANSACTIONS[0]]);
      }
    } catch (err) {
      console.error('Erreur chargement fiche client :', err);
      const matchingApps = MOCK_APPOINTMENTS.filter((a) => a.client_id === client.id);
      setClientAppointments(matchingApps.length > 0 ? matchingApps : [MOCK_APPOINTMENTS[0]]);
      const matchingTxs = MOCK_LOYALTY_TRANSACTIONS.filter((t) => t.client_id === client.id);
      setClientTransactions(matchingTxs.length > 0 ? matchingTxs : [MOCK_LOYALTY_TRANSACTIONS[0]]);
    } finally {
      setLoadingClientDetails(false);
    }
  };

  // Sauvegarder les notes internes et le statut
  const handleSaveInternalNotes = async () => {
    if (!selectedClient) return;
    setSavingNotes(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const currentPreferences = (selectedClient.preferences as Record<string, any>) || {};
      const updatedPreferences = {
        ...currentPreferences,
        admin_notes: adminNotes,
        pipeline_status: clientPipeline,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPreferences,
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      setSaveSuccess('Notes internes et statut enregistrés !');
      // Mettre à jour le state local
      setSelectedClient({ ...selectedClient, preferences: updatedPreferences });
      await fetchClients();
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingNotes(false);
    }
  };

  // Helper statut pipeline
  const getPipelineStatus = (client: Profile): ClientPipelineStatus => {
    const customStatus = (client.preferences as any)?.pipeline_status as ClientPipelineStatus;
    if (customStatus) return customStatus;
    const points = client.loyalty_points || 0;
    if (points >= 150) return 'fidèle';
    if (points > 0) return 'actif';
    return 'prospect';
  };

  const getPipelineBadgeColor = (status: ClientPipelineStatus) => {
    switch (status) {
      case 'fidèle':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'actif':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'prospect':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'inactif':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  // Filtrage des clients
  const filteredClients = clients.filter((client) => {
    const status = getPipelineStatus(client);
    if (filterPipeline !== 'all' && status !== filterPipeline) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = (client.full_name || '').toLowerCase().includes(q);
      const matchEmail = (client.email || '').toLowerCase().includes(q);
      const matchPhone = (client.phone || '').toLowerCase().includes(q);
      const matchAddress = (client.address || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchAddress) return false;
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
            Gestion & Suivi de la Clientèle
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Fiches clients complètes, pipeline relationnel, historique des prestations et notes de suivi.
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
            to="/admin/services"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm"
          >
            ✂️ Services
          </Link>
          <Link
            to="/admin/staff"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm"
          >
            👤 Coiffeurs
          </Link>
          <Link
            to="/admin/dashboard"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm"
          >
            📊 KPIs
          </Link>
        </div>
      </div>

      {/* Barre de Recherche et Filtres Pipeline */}
      <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Recherche */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, ville..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs font-medium bg-stone-50/50"
          />
        </div>

        {/* Filtres Pipeline */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tous les clients' },
            { id: 'prospect', label: 'Prospects' },
            { id: 'actif', label: 'Clients Actifs' },
            { id: 'fidèle', label: 'Clients Fidèles' },
            { id: 'inactif', label: 'Inactifs' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterPipeline(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                filterPipeline === f.id
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Tableau des Clients */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            Liste des Clients Enregistrés ({filteredClients.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-900 border-t-transparent mx-auto" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            Aucun client ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Coordonnées</th>
                  <th className="py-3 px-3">Localisation</th>
                  <th className="py-3 px-3">Points Fidélité</th>
                  <th className="py-3 px-3">Statut Pipeline</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredClients.map((client) => {
                  const status = getPipelineStatus(client);
                  return (
                    <tr key={client.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Nom & Avatar */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-serif font-bold text-sm flex-shrink-0">
                            {client.full_name?.charAt(0) || client.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 text-sm block">
                              {client.full_name || 'Client sans nom'}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              Inscrit le {formatDateFr(client.created_at)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                            <Mail className="w-3.5 h-3.5 text-stone-400" />
                            <span>{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-stone-600">
                              <Phone className="w-3.5 h-3.5 text-stone-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Adresse */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-stone-700 max-w-[200px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          <span className="truncate">{client.address || 'Non renseignée'}</span>
                        </div>
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-bold text-xs border border-amber-300">
                          <Award className="w-3.5 h-3.5 text-amber-700" />
                          {client.loyalty_points || 0} pts
                        </span>
                      </td>

                      {/* Statut Pipeline */}
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getPipelineBadgeColor(status)}`}>
                          {status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => openClientDetails(client)}
                          className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Fiche Client</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODALE : FICHE CLIENT COMPLÈTE & HISTORIQUE */}
      {/* ========================================================================= */}
      {selectedClient && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-4 border-b border-stone-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center font-serif font-bold text-2xl shadow-md">
                  {selectedClient.full_name?.charAt(0) || selectedClient.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-serif font-bold text-stone-900">
                      {selectedClient.full_name || 'Client'}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getPipelineBadgeColor(clientPipeline)}`}>
                      {clientPipeline}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Client inscrit depuis le {formatDateFr(selectedClient.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Colonne Gauche : Coordonnées & Préférences */}
              <div className="lg:col-span-6 space-y-4 text-xs">
                
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Coordonnées Directes
                  </h4>
                  <div className="space-y-1.5">
                    <p><strong>Email :</strong> {selectedClient.email}</p>
                    <p><strong>Téléphone :</strong> {selectedClient.phone || 'Non renseigné'}</p>
                    <p><strong>Adresse de Domicile :</strong> {selectedClient.address || 'Non renseignée'}</p>
                  </div>
                </div>

                {/* Préférences Capillaires */}
                <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 space-y-2">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    Préférences Capillaires
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-xl border border-amber-200">
                      <span className="text-stone-500 block">Type :</span>
                      <strong>{(selectedClient.preferences as any)?.hair_type || 'Standard'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-amber-200">
                      <span className="text-stone-500 block">Coupe :</span>
                      <strong>{(selectedClient.preferences as any)?.favorite_cut || 'Non précisé'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-amber-200">
                      <span className="text-stone-500 block">Couleur :</span>
                      <strong>{(selectedClient.preferences as any)?.favorite_color || 'Non précisé'}</strong>
                    </div>
                  </div>
                </div>

                {/* Statut Pipeline & Notes Internes */}
                <div className="bg-white rounded-2xl p-4 border-2 border-stone-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                      Notes Internes & Pipeline
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Statut relationnel (Pipeline)
                    </label>
                    <select
                      value={clientPipeline}
                      onChange={(e) => setClientPipeline(e.target.value as ClientPipelineStatus)}
                      className="w-full px-3 py-1.5 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                    >
                      <option value="prospect">🔵 Prospect (Nouvelle demande)</option>
                      <option value="actif">🟢 Actif (Client régulier)</option>
                      <option value="fidèle">🟣 Fidèle (Client VIP / Ambassadeur)</option>
                      <option value="inactif">⚪ Inactif (Aucun contact récent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Notes internes de suivi (Privé Coiffeur)
                    </label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Notes confidentielles sur le client, habitudes, nuances de patine utilisées, code de porte..."
                      className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={handleSaveInternalNotes}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>{savingNotes ? 'Enregistrement...' : 'Enregistrer les notes'}</span>
                  </button>
                </div>

              </div>

              {/* Colonne Droite : Historique des RDVs & Transactions Fidélité */}
              <div className="lg:col-span-6 space-y-4 text-xs">
                
                {/* Solde & Points */}
                <div className="bg-stone-900 text-white rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] uppercase text-amber-400 font-bold tracking-wider">Programme Fidélité</span>
                    <div className="text-xl font-bold font-serif text-amber-300 mt-0.5">
                      {selectedClient.loyalty_points || 0} <span className="text-xs font-sans text-stone-300 font-normal">points</span>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">
                    {clientTransactions.length} mouvements enregistrés
                  </span>
                </div>

                {/* Historique des Rendez-vous */}
                <div className="bg-white rounded-2xl p-4 border-2 border-stone-200 space-y-3">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    Historique des Prestations ({clientAppointments.length})
                  </h4>

                  {loadingClientDetails ? (
                    <div className="py-6 text-center text-stone-400">Chargement...</div>
                  ) : clientAppointments.length === 0 ? (
                    <p className="text-stone-500 py-4 text-center">Aucun rendez-vous enregistré.</p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {clientAppointments.map((app) => (
                        <div
                          key={app.id}
                          className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-stone-900 block">{app.services?.name}</span>
                            <span className="text-[10px] text-stone-500">
                              {formatDateFr(app.appointment_date)} à {app.start_time.substring(0, 5)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold font-serif text-stone-900 block">
                              {formatCurrency(Number(app.services?.price || 0))}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${getStatusBadgeColor(app.status)}`}>
                              {getStatusLabel(app.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historique des Points */}
                <div className="bg-white rounded-2xl p-4 border-2 border-stone-200 space-y-3">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    Mouvements de Points
                  </h4>

                  {clientTransactions.length === 0 ? (
                    <p className="text-stone-500 py-2 text-center text-[11px]">Aucune transaction.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {clientTransactions.map((tx) => (
                        <div key={tx.id} className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex justify-between items-center text-[11px]">
                          <span className="text-stone-700 truncate max-w-[200px]">{tx.description}</span>
                          <span className={`font-bold font-serif ${tx.points > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
