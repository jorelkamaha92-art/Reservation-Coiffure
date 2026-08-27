import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails, Service, Staff, Profile, AppointmentStatus, AppointmentLocationType } from '../types';
import { MOCK_APPOINTMENTS, MOCK_SERVICES, MOCK_STAFF, MOCK_CLIENTS } from '../lib/mockData';
import { formatDateFr } from '../utils/date';
import { formatCurrency, getStatusBadgeColor, getStatusLabel } from '../utils/format';
import {
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  Edit3,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  addMonths, 
  subMonths
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const AdminAppointmentsPage: React.FC = () => {
  // Données de base
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Type de Vue du Calendrier : 'month' | 'week' | 'day' | 'list'
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filtres
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Formulaire d'ajout manuel
  const [newForm, setNewForm] = useState({
    client_id: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    service_id: '',
    staff_id: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    location_type: 'home' as AppointmentLocationType,
    location_address: '',
    notes: '',
  });

  // Formulaire d'édition
  const [editForm, setEditForm] = useState({
    id: '',
    service_id: '',
    staff_id: '',
    appointment_date: '',
    start_time: '',
    location_type: 'home' as AppointmentLocationType,
    location_address: '',
    notes: '',
    status: 'pending' as AppointmentStatus,
  });

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Chargement des données
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Rendez-vous avec relations
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select(`
          *,
          services (*),
          staff (*),
          profiles (*)
        `)
        .order('appointment_date', { ascending: false });

      if (!appError && appData && appData.length > 0) {
        setAppointments(appData as unknown as AppointmentWithDetails[]);
      } else {
        setAppointments(MOCK_APPOINTMENTS);
      }

      // 2. Services
      const { data: srvData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (srvData && srvData.length > 0) {
        setServices(srvData as unknown as Service[]);
      } else {
        setServices(MOCK_SERVICES);
      }

      // 3. Staff
      const { data: stfData } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);
      if (stfData && stfData.length > 0) {
        setStaffList(stfData as unknown as Staff[]);
      } else {
        setStaffList(MOCK_STAFF);
      }

      // 4. Clients
      const { data: cltData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (cltData && cltData.length > 0) {
        setClients(cltData as unknown as Profile[]);
      } else {
        setClients(MOCK_CLIENTS);
      }

    } catch (err) {
      console.error('Erreur chargement planning admin :', err);
      setAppointments(MOCK_APPOINTMENTS);
      setServices(MOCK_SERVICES);
      setStaffList(MOCK_STAFF);
      setClients(MOCK_CLIENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 1. Mise à jour de statut (Confirmer, Terminer, Annuler)
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    let reason: string | null = null;
    if (newStatus === 'cancelled') {
      reason = prompt('Motif de l\'annulation (optionnel) :');
      if (reason === null) return;
    }

    setActionLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      if (newStatus === 'cancelled') {
        // Appel Edge Function cancel-appointment ou mise à jour directe
        await supabase.functions.invoke('cancel-appointment', {
          body: { appointment_id: appointmentId, reason },
        });
      }

      const updatePayload: any = { status: newStatus };
      if (reason) updatePayload.notes = `[Annulé : ${reason}]`;

      const { error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', appointmentId);

      if (error) throw error;

      // Si confirmé, déclencher notification client via Edge Function
      if (newStatus === 'confirmed') {
        const app = appointments.find((a) => a.id === appointmentId);
        if (app && app.profiles?.email) {
          try {
            await supabase.functions.invoke('send-confirmation-email', {
              body: {
                appointment_id: app.id,
                client_email: app.profiles.email,
                client_name: app.profiles.full_name || 'Client',
                service_name: app.services?.name || 'Prestation Coiffure',
                date: app.appointment_date,
                start_time: app.start_time,
                location_type: app.location_type,
                location_address: app.location_address,
              },
            });
          } catch (notifErr) {
            console.warn('Notification log:', notifErr);
          }
        }
      }

      setActionSuccess(`Le rendez-vous est maintenant "${getStatusLabel(newStatus)}".`);
      await fetchAllData();
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors du changement de statut');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Ajout manuel de rendez-vous (Réservation Téléphonique)
  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    try {
      if (!newForm.service_id) {
        throw new Error('Veuillez sélectionner une prestation.');
      }

      const chosenService = services.find((s) => s.id === newForm.service_id);
      const duration = chosenService?.duration_minutes || 60;

      // Calcul heure de fin
      const [h, m] = newForm.start_time.split(':').map(Number);
      const endMinutes = h * 60 + m + duration;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

      // Déterminer ou créer le client
      let finalClientId = newForm.client_id;

      if (!finalClientId) {
        // Prendre le premier client ou utilisateur admin par défaut
        const defaultProfile = clients[0];
        if (defaultProfile) {
          finalClientId = defaultProfile.id;
        }
      }

      const payload: any = {
        client_id: finalClientId,
        service_id: newForm.service_id,
        staff_id: newForm.staff_id || (staffList[0]?.id || null),
        appointment_date: newForm.appointment_date,
        start_time: `${newForm.start_time}:00`,
        end_time: endTimeStr,
        status: 'confirmed' as AppointmentStatus,
        location_type: newForm.location_type,
        location_address: newForm.location_type === 'home' ? (newForm.location_address || 'À domicile') : 'Au studio privé',
        notes: newForm.notes ? `[Réservation téléphonique] ${newForm.notes}` : '[Réservation téléphonique]',
        confirmation_sent: true,
        reminder_sent: false,
      };

      const { error } = await supabase
        .from('appointments')
        .insert(payload)
        .select('*, services (*), staff (*), profiles (*)')
        .single();

      if (error) throw error;

      setActionSuccess('Rendez-vous manuel créé avec succès !');
      setIsNewModalOpen(false);
      await fetchAllData();

      // Reset form
      setNewForm({
        client_id: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        service_id: services[0]?.id || '',
        staff_id: staffList[0]?.id || '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '10:00',
        location_type: 'home',
        location_address: '',
        notes: '',
      });
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la création manuelle');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Édition d'un rendez-vous existant
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    try {
      const chosenService = services.find((s) => s.id === editForm.service_id);
      const duration = chosenService?.duration_minutes || 60;

      const [h, m] = editForm.start_time.split(':').map(Number);
      const endMinutes = h * 60 + m + duration;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

      const { error } = await supabase
        .from('appointments')
        .update({
          service_id: editForm.service_id,
          staff_id: editForm.staff_id || null,
          appointment_date: editForm.appointment_date,
          start_time: editForm.start_time.includes(':00') ? editForm.start_time : `${editForm.start_time}:00`,
          end_time: endTimeStr,
          status: editForm.status,
          location_type: editForm.location_type,
          location_address: editForm.location_address || null,
          notes: editForm.notes || null,
        })
        .eq('id', editForm.id);

      if (error) throw error;

      setActionSuccess('Rendez-vous modifié avec succès !');
      setIsEditModalOpen(false);
      setIsDetailModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  // Ouvrir modal d'édition
  const openEditModal = (app: AppointmentWithDetails) => {
    setEditForm({
      id: app.id,
      service_id: app.service_id,
      staff_id: app.staff_id || '',
      appointment_date: app.appointment_date,
      start_time: app.start_time.substring(0, 5),
      location_type: app.location_type,
      location_address: app.location_address || '',
      notes: app.notes || '',
      status: app.status,
    });
    setIsEditModalOpen(true);
  };

  // Filtrage des rendez-vous
  const filteredAppointments = appointments.filter((app) => {
    // Filtre staff
    if (filterStaff !== 'all' && app.staff_id !== filterStaff) return false;
    // Filtre statut
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    // Filtre lieu
    if (filterLocation !== 'all' && app.location_type !== filterLocation) return false;
    // Recherche textuelle
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchClient = (app.profiles?.full_name || '').toLowerCase().includes(q);
      const matchPhone = (app.profiles?.phone || '').toLowerCase().includes(q);
      const matchService = (app.services?.name || '').toLowerCase().includes(q);
      const matchAddress = (app.location_address || '').toLowerCase().includes(q);
      if (!matchClient && !matchPhone && !matchService && !matchAddress) return false;
    }
    return true;
  });

  // Dates pour la vue Mois
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Dates pour la vue Semaine
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* En-tête avec Navigation vers Dashboard et Bouton Nouveau RDV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-700" />
            Portail Administration & Coiffeur
          </div>
          <h1 className="text-3xl font-bold font-serif text-stone-900 mt-1">
            Planning & Gestion des Rendez-vous
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Vue calendrier temps réel, confirmation, réaffectation et ajouts téléphoniques.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/availability"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Horaires & Congés</span>
          </Link>

          <Link
            to="/admin/dashboard"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span>Vue KPIs</span>
          </Link>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nouveau RDV Manuel</span>
          </button>
        </div>
      </div>

      {/* Notifications de succès/erreur */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-xs text-emerald-700 font-bold underline">
            Fermer
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs sm:text-sm font-semibold flex items-center justify-between animate-shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-700" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs text-rose-700 font-bold underline">
            Fermer
          </button>
        </div>
      )}

      {/* Barre d'outils, Sélecteur de vue & Filtres */}
      <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm space-y-4">
        
        {/* Ligne 1 : Navigation Date & Sélecteur de Vue */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          
          {/* Navigation Date */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200">
              <button
                onClick={() => {
                  if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
                  else if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
                  else setCurrentDate(subDays(currentDate, 1));
                }}
                className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition-all"
                title="Période précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 rounded-lg hover:bg-white text-stone-800 font-bold text-xs transition-all"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
                  else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
                  else setCurrentDate(addDays(currentDate, 1));
                }}
                className="p-1.5 rounded-lg hover:bg-white text-stone-700 transition-all"
                title="Période suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-lg font-serif font-bold text-stone-900 capitalize">
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
              {viewMode === 'week' && `Semaine du ${format(weekStart, 'dd MMMM', { locale: fr })} au ${format(weekEnd, 'dd MMMM yyyy', { locale: fr })}`}
              {viewMode === 'day' && format(currentDate, 'EEEE dd MMMM yyyy', { locale: fr })}
              {viewMode === 'list' && 'Tous les Rendez-vous'}
            </h2>
          </div>

          {/* Sélecteur de Mode de Vue */}
          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200">
            {[
              { id: 'month', label: 'Mois' },
              { id: 'week', label: 'Semaine' },
              { id: 'day', label: 'Jour' },
              { id: 'list', label: 'Liste' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === mode.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

        </div>

        {/* Ligne 2 : Filtres dynamiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher client, tél, prestation..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:border-stone-900 focus:outline-none bg-stone-50"
            />
          </div>

          {/* Filtre Statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 focus:border-stone-900 focus:outline-none bg-stone-50 font-medium text-stone-800"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">🟡 En attente (pending)</option>
            <option value="confirmed">🟢 Confirmés (confirmed)</option>
            <option value="completed">🔵 Terminés (completed)</option>
            <option value="cancelled">🔴 Annulés (cancelled)</option>
          </select>

          {/* Filtre Coiffeur */}
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 focus:border-stone-900 focus:outline-none bg-stone-50 font-medium text-stone-800"
          >
            <option value="all">Tous les coiffeurs</option>
            {staffList.map((stf) => (
              <option key={stf.id} value={stf.id}>{stf.full_name}</option>
            ))}
          </select>

          {/* Filtre Lieu */}
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 focus:border-stone-900 focus:outline-none bg-stone-50 font-medium text-stone-800"
          >
            <option value="all">Tous les lieux</option>
            <option value="home">🏠 À Domicile</option>
            <option value="salon">💈 Studio Privé</option>
          </select>

        </div>

      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-16 border-2 border-stone-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-stone-700">Chargement du planning en direct...</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. VUE MOIS (MONTH CALENDAR GRID) */}
      {/* ========================================================================= */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm animate-fadeIn">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-500 pb-3 uppercase tracking-wider border-b border-stone-200">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Jeu</span>
            <span>Ven</span>
            <span>Sam</span>
            <span>Dim</span>
          </div>

          {/* Grille des Jours */}
          <div className="grid grid-cols-7 gap-2 pt-3">
            {monthDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = filteredAppointments.filter((a) => a.appointment_date === dayStr);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewMode('day');
                  }}
                  className={`min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrentDay
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                      : isCurrentMonth
                      ? 'border-stone-200 bg-white hover:border-stone-400'
                      : 'border-stone-100 bg-stone-50/50 opacity-40'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                      isCurrentDay ? 'bg-stone-900 text-white' : 'text-stone-700'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-1.5 py-0.2 rounded-full">
                        {dayAppointments.length} RDV
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[70px]">
                    {dayAppointments.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(app);
                          setIsDetailModalOpen(true);
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold truncate flex items-center justify-between ${
                          app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          app.status === 'pending' ? 'bg-amber-100 text-amber-950 border border-amber-300' :
                          app.status === 'completed' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          'bg-rose-100 text-rose-900 border border-rose-300 line-through opacity-70'
                        }`}
                        title={`${app.start_time.substring(0, 5)} - ${app.profiles?.full_name || 'Client'} (${app.services?.name})`}
                      >
                        <span className="truncate">{app.start_time.substring(0, 5)} {app.profiles?.full_name?.split(' ')[0] || 'Client'}</span>
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <span className="text-[9px] font-bold text-stone-500 block text-center">
                        +{dayAppointments.length - 3} autres
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VUE SEMAINE (WEEK VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm animate-fadeIn">
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = filteredAppointments.filter((a) => a.appointment_date === dayStr);
              const isCurrentDay = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className="space-y-3">
                  <div className={`p-3 rounded-2xl text-center border-2 ${
                    isCurrentDay ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}>
                    <span className="block text-[11px] font-bold uppercase tracking-wider opacity-80">
                      {format(day, 'EEE', { locale: fr })}
                    </span>
                    <span className="text-xl font-bold font-serif">
                      {format(day, 'dd MMM')}
                    </span>
                  </div>

                  <div className="space-y-2 min-h-[300px]">
                    {dayAppointments.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-stone-200 text-center text-stone-400 text-[11px]">
                        Aucun RDV
                      </div>
                    ) : (
                      dayAppointments.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => {
                            setSelectedAppointment(app);
                            setIsDetailModalOpen(true);
                          }}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-sm space-y-1.5 ${
                            app.status === 'confirmed' ? 'border-emerald-300 bg-emerald-50/70' :
                            app.status === 'pending' ? 'border-amber-300 bg-amber-50/70' :
                            app.status === 'completed' ? 'border-blue-300 bg-blue-50/70' :
                            'border-rose-300 bg-rose-50/70 opacity-70'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-stone-900">{app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)}</span>
                            <span className={`px-1.5 py-0.2 rounded ${getStatusBadgeColor(app.status)}`}>
                              {getStatusLabel(app.status)}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-stone-900 truncate">
                            {app.profiles?.full_name || 'Client'}
                          </p>
                          <p className="text-[11px] text-stone-600 truncate">
                            {app.services?.name}
                          </p>
                          <div className="text-[10px] text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{app.location_type === 'home' ? 'Domicile' : 'Studio'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VUE JOUR (DAY TIMELINE) */}
      {/* ========================================================================= */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-4 border-b border-stone-200">
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Planning du {format(currentDate, 'EEEE dd MMMM yyyy', { locale: fr })}
              </h3>
              <p className="text-xs text-stone-500">
                {filteredAppointments.filter((a) => a.appointment_date === format(currentDate, 'yyyy-MM-dd')).length} rendez-vous programmés
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {filteredAppointments
              .filter((a) => a.appointment_date === format(currentDate, 'yyyy-MM-dd'))
              .length === 0 ? (
              <div className="py-16 text-center text-stone-500 text-sm">
                Aucun rendez-vous pour cette journée.
              </div>
            ) : (
              filteredAppointments
                .filter((a) => a.appointment_date === format(currentDate, 'yyyy-MM-dd'))
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border-2 border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-stone-400 transition-all bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-stone-900 text-amber-400 text-center font-bold text-xs min-w-[70px]">
                        <span>{app.start_time.substring(0, 5)}</span>
                        <span className="block text-[10px] text-stone-400 font-normal">à {app.end_time.substring(0, 5)}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                          <span className="font-bold text-sm text-stone-900">
                            {app.profiles?.full_name || 'Client'}
                          </span>
                          {app.profiles?.phone && (
                            <span className="text-xs text-stone-500">({app.profiles.phone})</span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-stone-700">
                          {app.services?.name} • <span className="text-amber-800 font-bold">{formatCurrency(Number(app.services?.price || 0))}</span>
                        </p>

                        <p className="text-xs text-stone-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          <span>{app.location_type === 'home' ? `🏠 Domicile : ${app.location_address}` : '💈 Studio Privé'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                      <button
                        onClick={() => {
                          setSelectedAppointment(app);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-800 transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Détails
                      </button>

                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(app.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          Confirmer
                        </button>
                      )}

                      {app.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(app.id, 'completed')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          Terminer
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(app)}
                        className="p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 transition-all"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VUE LISTE TABULAIRE */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Prestation</th>
                  <th className="py-3 px-3">Date & Heure</th>
                  <th className="py-3 px-3">Lieu</th>
                  <th className="py-3 px-3">Montant</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-stone-900">{app.profiles?.full_name || 'Client'}</div>
                      <div className="text-[11px] text-stone-500">{app.profiles?.phone || app.profiles?.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-stone-900">{app.services?.name}</span>
                      <span className="block text-[11px] text-stone-500">{app.services?.duration_minutes} min</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-stone-800">{formatDateFr(app.appointment_date)}</div>
                      <div className="text-[11px] text-stone-500">{app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-stone-800">{app.location_type === 'home' ? '🏠 Domicile' : '💈 Studio'}</span>
                      {app.location_address && (
                        <span className="block text-[11px] text-stone-500 line-clamp-1 max-w-[160px]">{app.location_address}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-serif font-bold text-stone-950">
                      {formatCurrency(Number(app.services?.price || 0))}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAppointment(app);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                          title="Détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(app)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* ========================================================================= */}
      {/* 5. POPUP MODALE : DÉTAILS DU RENDEZ-VOUS & PRÉFÉRENCES */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-4 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Fiche Rendez-vous</span>
                <h3 className="text-2xl font-serif font-bold text-stone-900 mt-0.5">
                  {selectedAppointment.services?.name}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Informations Client & Préférences Capillaires */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
              <span className="text-xs font-bold uppercase text-stone-500 tracking-wider">Client & Coordonnées</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-500">Nom complet :</span>
                  <p className="font-bold text-stone-900 text-sm">{selectedAppointment.profiles?.full_name || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-stone-500">Téléphone :</span>
                  <p className="font-bold text-stone-900">{selectedAppointment.profiles?.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-stone-500">Email :</span>
                  <p className="font-bold text-stone-900">{selectedAppointment.profiles?.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-stone-500">Adresse :</span>
                  <p className="font-bold text-stone-900">{selectedAppointment.location_address || selectedAppointment.profiles?.address || 'Non renseignée'}</p>
                </div>
              </div>

              {/* Préférences Capillaires (JSONB) */}
              {(selectedAppointment.profiles?.preferences as any) && (
                <div className="pt-3 border-t border-stone-200 mt-2">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Préférences Capillaires Client :
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-stone-700">
                    <div className="p-2 rounded bg-white border border-stone-200">
                      <span className="text-stone-500 block">Type :</span>
                      <strong>{(selectedAppointment.profiles?.preferences as any)?.hair_type || 'Standard'}</strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-stone-200">
                      <span className="text-stone-500 block">Coupe :</span>
                      <strong>{(selectedAppointment.profiles?.preferences as any)?.favorite_cut || 'Non précisé'}</strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-stone-200">
                      <span className="text-stone-500 block">Couleur :</span>
                      <strong>{(selectedAppointment.profiles?.preferences as any)?.favorite_color || 'Non précisé'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Détails Prestation & Horaires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-stone-500 font-semibold">Date & Créneau :</span>
                <p className="font-bold text-stone-900 text-sm">
                  {formatDateFr(selectedAppointment.appointment_date)} de {selectedAppointment.start_time.substring(0, 5)} à {selectedAppointment.end_time.substring(0, 5)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-stone-500 font-semibold">Tarif & Coiffeuse :</span>
                <p className="font-bold text-stone-900 text-sm">
                  {formatCurrency(Number(selectedAppointment.services?.price || 0))} • {selectedAppointment.staff?.full_name || 'Cindy Malorie'}
                </p>
              </div>
            </div>

            {/* Actions Rapides */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2">
                {selectedAppointment.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
                  >
                    ✓ Confirmer le RDV
                  </button>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
                  >
                    ✓ Marquer comme Terminé
                  </button>
                )}
                {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs"
                  >
                    Annuler le RDV
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  openEditModal(selectedAppointment);
                }}
                className="px-4 py-2 rounded-xl border-2 border-stone-200 hover:bg-stone-50 text-stone-800 font-bold text-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Modifier la fiche
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODALE : NOUVEAU RDV MANUEL (RÉSERVATION TÉLÉPHONIQUE) */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Réservation Téléphonique / Manuelle</span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">Nouveau Rendez-vous</h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleCreateManualAppointment} className="space-y-4 text-xs">
              
              {/* Choix Prestation */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Prestation *</label>
                <select
                  required
                  value={newForm.service_id}
                  onChange={(e) => setNewForm({ ...newForm, service_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                >
                  <option value="">Sélectionner une prestation...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min - {formatCurrency(Number(s.price))})
                    </option>
                  ))}
                </select>
              </div>

              {/* Choix Coiffeur */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Coiffeur assigné</label>
                <select
                  value={newForm.staff_id}
                  onChange={(e) => setNewForm({ ...newForm, staff_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                >
                  {staffList.map((stf) => (
                    <option key={stf.id} value={stf.id}>{stf.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Date et Heure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newForm.appointment_date}
                    onChange={(e) => setNewForm({ ...newForm, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Heure de début *</label>
                  <input
                    type="time"
                    required
                    value={newForm.start_time}
                    onChange={(e) => setNewForm({ ...newForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  />
                </div>
              </div>

              {/* Lieu et Adresse */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Lieu</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="loc_type"
                      checked={newForm.location_type === 'home'}
                      onChange={() => setNewForm({ ...newForm, location_type: 'home' })}
                    />
                    <span>À Domicile</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="loc_type"
                      checked={newForm.location_type === 'salon'}
                      onChange={() => setNewForm({ ...newForm, location_type: 'salon' })}
                    />
                    <span>Studio Privé</span>
                  </label>
                </div>
                {newForm.location_type === 'home' && (
                  <textarea
                    rows={2}
                    placeholder="Adresse complète du client..."
                    value={newForm.location_address}
                    onChange={(e) => setNewForm({ ...newForm, location_address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  />
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Notes particulières de la réservation téléphonique..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md"
                >
                  {actionLoading ? 'Création...' : 'Créer le rendez-vous'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODALE : MODIFICATION DU RENDEZ-VOUS */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border-2 border-stone-200 shadow-2xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Édition</span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">Modifier le Rendez-vous</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              
              {/* Prestation */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Prestation</label>
                <select
                  value={editForm.service_id}
                  onChange={(e) => setEditForm({ ...editForm, service_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
                  ))}
                </select>
              </div>

              {/* Date et Heure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.appointment_date}
                    onChange={(e) => setEditForm({ ...editForm, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Heure de début</label>
                  <input
                    type="time"
                    required
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Statut</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AppointmentStatus })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                >
                  <option value="pending">🟡 En attente (pending)</option>
                  <option value="confirmed">🟢 Confirmé (confirmed)</option>
                  <option value="completed">🔵 Terminé (completed)</option>
                  <option value="cancelled">🔴 Annulé (cancelled)</option>
                </select>
              </div>

              {/* Adresse */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Adresse</label>
                <textarea
                  rows={2}
                  value={editForm.location_address}
                  onChange={(e) => setEditForm({ ...editForm, location_address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-md"
                >
                  {actionLoading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
