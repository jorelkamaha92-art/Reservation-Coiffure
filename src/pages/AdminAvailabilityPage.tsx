import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AvailabilitySetting, BlockedDate } from '../types';
import { MOCK_BLOCKED_DATES } from '../lib/mockData';
import { formatDateFr } from '../utils/date';
import {
  Clock,
  Calendar as CalendarIcon,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Ban,
  Check,
  CalendarCheck
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  getDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const DAYS_OF_WEEK = [
  { dayNumber: 1, name: 'Lundi' },
  { dayNumber: 2, name: 'Mardi' },
  { dayNumber: 3, name: 'Mercredi' },
  { dayNumber: 4, name: 'Jeudi' },
  { dayNumber: 5, name: 'Vendredi' },
  { dayNumber: 6, name: 'Samedi' },
  { dayNumber: 0, name: 'Dimanche' },
];

export const AdminAvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // État de sauvegarde des horaires
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Formulaire d'ajout de jour bloqué
  const [newBlockedDate, setNewBlockedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newBlockedReason, setNewBlockedReason] = useState<string>('Congés exceptionnels');
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [addingBlocked, setAddingBlocked] = useState<boolean>(false);
  const [blockedFeedback, setBlockedFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Calendrier d'aperçu
  const [previewDate, setPreviewDate] = useState<Date>(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: string; status: string; details?: string } | null>(null);

  // 1. Charger les horaires et les dates bloquées depuis Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // Horaires d'ouverture
      const { data: availData, error: availError } = await supabase
        .from('availability_settings')
        .select('*')
        .order('day_of_week');

      if (!availError && availData && availData.length > 0) {
        setAvailability(availData as unknown as AvailabilitySetting[]);
      } else {
        // Initialiser avec les valeurs par défaut si vide
        const defaultSettings: AvailabilitySetting[] = DAYS_OF_WEEK.map((d) => ({
          id: `default-${d.dayNumber}`,
          day_of_week: d.dayNumber,
          start_time: '09:00:00',
          end_time: '19:00:00',
          is_active: d.dayNumber !== 0, // Ouvert du lundi au samedi, fermé le dimanche
        }));
        setAvailability(defaultSettings);
      }

      // Dates bloquées
      const { data: blockData, error: blockError } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('date', { ascending: true });

      if (!blockError && blockData) {
        setBlockedDates(blockData as unknown as BlockedDate[]);
      } else {
        setBlockedDates([]);
      }
    } catch (err) {
      console.error('Erreur chargement planning :', err);
      setBlockedDates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modification locale des horaires pour un jour
  const handleScheduleChange = (dayNumber: number, field: keyof AvailabilitySetting, value: any) => {
    setAvailability((prev) =>
      prev.map((item) => {
        if (item.day_of_week === dayNumber) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // 2. Sauvegarder les horaires ouvrés dans Supabase
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setScheduleSuccess(null);
    setScheduleError(null);

    try {
      for (const item of availability) {
        const startTimeStr = item.start_time.length === 5 ? `${item.start_time}:00` : item.start_time;
        const endTimeStr = item.end_time.length === 5 ? `${item.end_time}:00` : item.end_time;

        const { error } = await supabase
          .from('availability_settings')
          .upsert(
            {
              day_of_week: item.day_of_week,
              start_time: startTimeStr,
              end_time: endTimeStr,
              is_active: item.is_active,
            },
            { onConflict: 'day_of_week' }
          );

        if (error) throw error;
      }

      setScheduleSuccess('Horaires d’ouverture mis à jour avec succès !');
      await fetchData();
    } catch (err: any) {
      setScheduleError(err.message || 'Erreur lors de la sauvegarde des horaires.');
    } finally {
      setSavingSchedule(false);
    }
  };

  // 3. Ajouter une date bloquée (congé / férié)
  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingBlocked(true);
    setBlockedFeedback(null);

    try {
      const fullReason = isHalfDay ? `${newBlockedReason} (Après-midi)` : newBlockedReason;

      const { error } = await supabase
        .from('blocked_dates')
        .insert({
          date: newBlockedDate,
          reason: fullReason,
        });

      if (error) throw error;

      setBlockedFeedback({
        success: true,
        message: `La date du ${formatDateFr(newBlockedDate)} a bien été bloquée.`,
      });

      await fetchData();
    } catch (err: any) {
      setBlockedFeedback({
        success: false,
        message: err.message || 'Erreur lors de l’ajout du blocage.',
      });
    } finally {
      setAddingBlocked(false);
    }
  };

  // 4. Supprimer un blocage (débloquer un jour)
  const handleDeleteBlockedDate = async (id: string, dateStr: string) => {
    if (!confirm(`Souhaitez-vous débloquer la date du ${formatDateFr(dateStr)} ?`)) return;

    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlockedFeedback({
        success: true,
        message: `La date du ${formatDateFr(dateStr)} est de nouveau disponible.`,
      });

      await fetchData();
    } catch (err: any) {
      setBlockedFeedback({
        success: false,
        message: err.message || 'Erreur lors du déblocage.',
      });
    }
  };

  // Helper : Analyser le statut d'un jour pour l'aperçu
  const getDayStatus = (date: Date): { isBlocked: boolean; isOpen: boolean; reason?: string; hours?: string } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const blocked = blockedDates.find((b) => b.date === dateStr);
    if (blocked) {
      return { isBlocked: true, isOpen: false, reason: blocked.reason || 'Jour bloqué / Congés' };
    }

    const dayNum = getDay(date);
    const daySetting = availability.find((a) => a.day_of_week === dayNum);

    if (!daySetting || !daySetting.is_active) {
      return { isBlocked: false, isOpen: false, reason: 'Fermé (Jour non ouvré)' };
    }

    const start = daySetting.start_time.substring(0, 5);
    const end = daySetting.end_time.substring(0, 5);
    return { isBlocked: false, isOpen: true, hours: `${start} - ${end}` };
  };

  // Grille du mois pour l'aperçu
  const monthStart = startOfMonth(previewDate);
  const monthEnd = endOfMonth(previewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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
            Gestion des Horaires & Congés
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Configurez les horaires hebdomadaires récurrents et bloquez les dates de congés ou jours fériés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/appointments"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4 text-amber-700" />
            Planning & RDV
          </Link>
          <Link
            to="/admin/dashboard"
            className="px-4 py-2.5 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            Vue KPIs
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-16 border-2 border-stone-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-stone-700">Chargement des disponibilités...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ========================================================================= */}
          {/* 1. HORAIRES OUVRÉS RÉCURRENTS (Lundi à Dimanche) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-700" />
                  Horaires d'Ouverture Récurrents
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ces plages horaires définissent les créneaux disponibles à la réservation.
                </p>
              </div>
            </div>

            {scheduleSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{scheduleSuccess}</span>
              </div>
            )}

            {scheduleError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const setting = availability.find((a) => a.day_of_week === day.dayNumber) || {
                  day_of_week: day.dayNumber,
                  start_time: '09:00:00',
                  end_time: '19:00:00',
                  is_active: false,
                };

                return (
                  <div
                    key={day.dayNumber}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      setting.is_active
                        ? 'border-stone-200 bg-white shadow-xs'
                        : 'border-stone-100 bg-stone-50/60 opacity-60'
                    }`}
                  >
                    {/* Nom du jour et Toggle */}
                    <div className="flex items-center gap-3 min-w-[130px]">
                      <input
                        type="checkbox"
                        checked={setting.is_active}
                        onChange={(e) => handleScheduleChange(day.dayNumber, 'is_active', e.target.checked)}
                        className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900 cursor-pointer"
                        id={`toggle-${day.dayNumber}`}
                      />
                      <label htmlFor={`toggle-${day.dayNumber}`} className="font-bold text-sm text-stone-900 cursor-pointer">
                        {day.name}
                      </label>
                    </div>

                    {/* Plage horaire si actif */}
                    {setting.is_active ? (
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="time"
                          value={setting.start_time.substring(0, 5)}
                          onChange={(e) => handleScheduleChange(day.dayNumber, 'start_time', `${e.target.value}:00`)}
                          className="px-2.5 py-1.5 rounded-lg border-2 border-stone-200 focus:border-stone-900 focus:outline-none bg-white text-stone-900"
                        />
                        <span className="text-stone-400">à</span>
                        <input
                          type="time"
                          value={setting.end_time.substring(0, 5)}
                          onChange={(e) => handleScheduleChange(day.dayNumber, 'end_time', `${e.target.value}:00`)}
                          className="px-2.5 py-1.5 rounded-lg border-2 border-stone-200 focus:border-stone-900 focus:outline-none bg-white text-stone-900"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-lg">
                        Fermé ce jour
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingSchedule ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Enregistrer tous les horaires</span>
                </>
              )}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. DATES BLOQUÉES & CONGÉS */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* Formulaire d'ajout de blocage */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-5">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-700" />
                  Bloquer une Date Exceptionnelle
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Empêche toute réservation en ligne pour cette journée (congés, fériés, événements).
                </p>
              </div>

              {blockedFeedback && (
                <div
                  className={`p-3.5 rounded-xl border-2 text-xs font-semibold flex items-center gap-2 ${
                    blockedFeedback.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  {blockedFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  )}
                  <span>{blockedFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleAddBlockedDate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Date à bloquer *</label>
                  <input
                    type="date"
                    required
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Motif du blocage</label>
                  <input
                    type="text"
                    required
                    value={newBlockedReason}
                    onChange={(e) => setNewBlockedReason(e.target.value)}
                    placeholder="Ex: Congés annuels, Formation balayage, Jour férié..."
                    className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 focus:border-stone-900 bg-white"
                  />
                </div>

                {/* Suggestions rapides */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Congés d’été', 'Formation', 'Jour Férié', 'Mariage privé', 'Déplacement pro'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewBlockedReason(sug)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition-all"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="halfDay"
                    checked={isHalfDay}
                    onChange={(e) => setIsHalfDay(e.target.checked)}
                    className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900 cursor-pointer"
                  />
                  <label htmlFor="halfDay" className="text-xs text-stone-700 font-semibold cursor-pointer">
                    Bloquer seulement l'après-midi
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={addingBlocked}
                  className="w-full py-3 px-5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingBlocked ? 'Enregistrement...' : 'Ajouter cette date bloquée'}</span>
                </button>
              </form>
            </div>

            {/* Liste des dates bloquées existantes */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  Dates Bloquées Actives ({blockedDates.length})
                </h3>
              </div>

              {blockedDates.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">Aucune date bloquée pour le moment.</p>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {blockedDates.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900">
                          {formatDateFr(b.date)}
                        </div>
                        <span className="text-rose-900 text-[11px] font-semibold">
                          {b.reason || 'Congés'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteBlockedDate(b.id, b.date)}
                        className="p-2 rounded-xl text-rose-700 hover:bg-rose-100 transition-all"
                        title="Débloquer cette date"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 3. APERÇU CALENDRIER VISUEL COMPLET */}
          {/* ========================================================================= */}
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-700" />
                  Aperçu Global du Planning Client
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Visualisez en un clin d'œil les jours ouverts, fermés et les congés tels qu'affichés aux clients.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDate(subMonths(previewDate, 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-800"
                >
                  ← Mois précédent
                </button>
                <span className="font-serif font-bold text-stone-900 capitalize px-2 text-sm">
                  {format(previewDate, 'MMMM yyyy', { locale: fr })}
                </span>
                <button
                  onClick={() => setPreviewDate(addMonths(previewDate, 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-800"
                >
                  Mois suivant →
                </button>
              </div>
            </div>

            {/* Légende */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-2 border-t border-stone-100">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                Jour Ouvert (Réservable)
              </span>
              <span className="flex items-center gap-1.5 text-rose-800">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                Date Bloquée (Congé / Férié)
              </span>
              <span className="flex items-center gap-1.5 text-stone-400">
                <span className="w-3 h-3 rounded-full bg-stone-300 inline-block" />
                Fermeture Hebdomadaire
              </span>
            </div>

            {/* Grille Calendrier */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <div key={d} className="text-center font-bold text-xs text-stone-500 pb-2">
                  {d}
                </div>
              ))}

              {calendarDays.map((day) => {
                const dayStatus = getDayStatus(day);
                const isCurrentMonth = isSameMonth(day, previewDate);
                const isTodayDate = isSameDay(day, new Date());
                const dateString = format(day, 'yyyy-MM-dd');

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDayInfo({
                        date: format(day, 'dd MMMM yyyy', { locale: fr }),
                        status: dayStatus.isBlocked ? 'Bloqué (Congés)' : dayStatus.isOpen ? 'Ouvert' : 'Fermé',
                        details: dayStatus.reason || dayStatus.hours,
                      });
                      if (!dayStatus.isBlocked && isCurrentMonth) {
                        setNewBlockedDate(dateString);
                      }
                    }}
                    className={`min-h-[90px] p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      dayStatus.isBlocked
                        ? 'border-rose-400 bg-rose-50 text-rose-950'
                        : dayStatus.isOpen
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950 hover:border-emerald-400'
                        : 'border-stone-200 bg-stone-100/60 text-stone-400'
                    } ${!isCurrentMonth ? 'opacity-30' : ''} ${isTodayDate ? 'ring-2 ring-stone-900 ring-offset-1' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        isTodayDate ? 'bg-stone-900 text-white' : ''
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayStatus.isBlocked && (
                        <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full">
                          Bloqué
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-semibold truncate mt-1">
                      {dayStatus.isOpen && (
                        <span className="text-emerald-700 font-bold block">{dayStatus.hours}</span>
                      )}
                      {dayStatus.isBlocked && (
                        <span className="text-rose-700 font-bold block truncate">{dayStatus.reason}</span>
                      )}
                      {!dayStatus.isOpen && !dayStatus.isBlocked && (
                        <span className="text-stone-400 block">Fermé</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info sur le jour sélectionné */}
            {selectedDayInfo && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 flex items-center justify-between animate-fadeIn">
                <div>
                  <strong>{selectedDayInfo.date} :</strong> {selectedDayInfo.status} {selectedDayInfo.details ? `(${selectedDayInfo.details})` : ''}
                </div>
                <button
                  onClick={() => setSelectedDayInfo(null)}
                  className="font-bold underline text-amber-800"
                >
                  Fermer
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
