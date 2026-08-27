import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, startOfToday, addDays, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Scissors, 
  Check, 
  Calendar as CalendarIcon, 
  Sparkles, 
  AlertCircle, 
  User, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Home, 
  Building2, 
  CheckCircle2, 
  ShieldCheck,
  Lock,
  Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Service, Staff, AppointmentStatus, AppointmentLocationType, AvailabilitySetting, BlockedDate } from '../types';
import { formatCurrency } from '../utils/format';
import { appointmentBookingSchema } from '../lib/validations';

const STANDARD_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  // Workflow Steps : 1: Service, 2: Coiffeur, 3: Date & Heure, 4: Lieu, 5: Récapitulatif
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Données de base chargées depuis Supabase
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Choix utilisateur
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(startOfToday(), 1));
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [locationType, setLocationType] = useState<AppointmentLocationType>('home');
  const [address, setAddress] = useState<string>(profile?.address || '');
  const [notes, setNotes] = useState<string>('');

  // Filtres de service
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // Authentification inline si non-connecté à l'étape 5
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // État de soumission
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // 1. Charger les services, le staff et les paramètres d'ouverture
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingData(true);
      try {
        // Services
        const { data: srvData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (srvData && srvData.length > 0) {
          const typedServices = srvData as unknown as Service[];
          setServices(typedServices);
          const preselectedId = searchParams.get('serviceId');
          if (preselectedId) {
            const match = typedServices.find((s) => s.id === preselectedId);
            if (match) setSelectedService(match);
          } else {
            setSelectedService(typedServices[0]);
          }
        } else {
          // Fallback par défaut
          const mockServices: Service[] = [
            { id: '11111111-1111-1111-1111-111111111111', name: 'Coupe & Brushing Haute Tenue', description: 'Diagnostic personnalisé, shampoing traitant, coupe sur-mesure et brushing éclat.', duration_minutes: 60, price: 45, category: 'Femme', is_active: true, created_at: '' },
            { id: '22222222-2222-2222-2222-222222222222', name: 'Balayage Signature Cindy & Patine', description: 'Éclaircissement fondu sans démarcation, patine neutralisante et soin à la kératine.', duration_minutes: 120, price: 95, category: 'Technique', is_active: true, created_at: '' },
            { id: '33333333-3333-3333-3333-333333333333', name: 'Soin Botox Capillaire & Massage', description: 'Soin profond à la kératine et acide hyaluronique, brillance miroir.', duration_minutes: 60, price: 55, category: 'Soins', is_active: true, created_at: '' },
            { id: '44444444-4444-4444-4444-444444444444', name: 'Coupe Homme Moderne & Soin Barbe', description: 'Dégradé américain précis, taille de barbe et serviette chaude.', duration_minutes: 45, price: 30, category: 'Homme', is_active: true, created_at: '' }
          ];
          setServices(mockServices);
          setSelectedService(mockServices[0]);
        }

        // Staff / Coiffeurs
        const { data: stfData } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true);

        if (stfData && stfData.length > 0) {
          const typedStaff = stfData as unknown as Staff[];
          setStaffList(typedStaff);
          setSelectedStaff(typedStaff[0]);
        } else {
          // Fallback Cindy Malorie
          const mockStaff: Staff = {
            id: '55555555-5555-5555-5555-555555555555',
            user_id: null,
            full_name: 'Cindy Malorie',
            specialty: 'Experte Balayages, Coupes Sur-Mesure & Soins Profonds',
            bio: 'Diplômée d\'État, créatrice de contenu TikTok (@cindymalorie) avec +10 ans d\'expertise en coiffure privée à domicile.',
            avatar_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&auto=format&fit=crop&q=80',
            is_active: true,
            created_at: '',
          };
          setStaffList([mockStaff]);
          setSelectedStaff(mockStaff);
        }

        // Horaires d'ouverture (availability_settings)
        const { data: availData } = await supabase
          .from('availability_settings')
          .select('*')
          .eq('is_active', true);

        if (availData) {
          setAvailabilitySettings(availData as unknown as AvailabilitySetting[]);
        }

        // Dates bloquées (blocked_dates)
        const { data: blkData } = await supabase
          .from('blocked_dates')
          .select('*');

        if (blkData) {
          setBlockedDates(blkData as unknown as BlockedDate[]);
        }

      } catch (err) {
        console.error('Erreur chargement données réservation :', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchInitialData();
  }, [searchParams]);

  // Synchroniser l'adresse de profil si disponible
  useEffect(() => {
    if (profile?.address && !address) {
      setAddress(profile.address);
    }
  }, [profile, address]);

  // 2. Vérifier les disponibilités en temps réel pour la date sélectionnée
  useEffect(() => {
    const fetchBookedSlotsForDate = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('appointment_date', dateStr)
        .in('status', ['pending', 'confirmed']);

      if (selectedStaff?.id) {
        query = query.eq('staff_id', selectedStaff.id);
      }

      const { data } = await query;
      if (data) {
        setBookedSlots(data.map((d) => ({ start_time: d.start_time, end_time: d.end_time })));
      } else {
        setBookedSlots([]);
      }
    };

    fetchBookedSlotsForDate();
  }, [selectedDate, selectedStaff]);

  // Helper : vérifier si une date complète est bloquée
  const isDateBlocked = (date: Date): { blocked: boolean; reason?: string } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const match = blockedDates.find((b) => b.date === dateStr);
    if (match) return { blocked: true, reason: match.reason || 'Jour férié / Congés' };

    // Vérifier si le jour de la semaine est ouvert
    const dayOfWeek = getDay(date); // 0 = Dimanche, 1 = Lundi, etc.
    const daySetting = availabilitySettings.find((a) => a.day_of_week === dayOfWeek);
    if (availabilitySettings.length > 0 && (!daySetting || !daySetting.is_active)) {
      return { blocked: true, reason: 'Fermé ce jour' };
    }

    return { blocked: false };
  };

  // Helper : calculer si un créneau horaire est disponible
  const isSlotAvailable = (slot: string): { available: boolean; reason?: string } => {
    const dateCheck = isDateBlocked(selectedDate);
    if (dateCheck.blocked) return { available: false, reason: dateCheck.reason };

    if (!selectedService) return { available: true };

    const duration = selectedService.duration_minutes;
    const [h, m] = slot.split(':').map(Number);
    const endMinutes = h * 60 + m + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const slotStartTime = `${slot}:00`;
    const slotEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    // Vérification des horaires ouvrés
    const dayOfWeek = getDay(selectedDate);
    const daySetting = availabilitySettings.find((a) => a.day_of_week === dayOfWeek);
    if (daySetting) {
      if (slotStartTime < daySetting.start_time || slotEndTime > daySetting.end_time) {
        return { available: false, reason: 'Hors horaires ouvrés' };
      }
    }

    // Vérification des conflits avec les créneaux déjà réservés
    for (const booked of bookedSlots) {
      // Condition de collision : (start < booked.end ET end > booked.start)
      if (slotStartTime < booked.end_time && slotEndTime > booked.start_time) {
        return { available: false, reason: 'Créneau déjà réservé' };
      }
    }

    return { available: true };
  };

  // Gestion de l'authentification rapide sur l'étape de confirmation
  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) setAuthError(error.message || 'Email ou mot de passe incorrect.');
      } else {
        if (!authFullName || !authPhone || !authEmail || !authPassword) {
          setAuthError('Veuillez remplir tous les champs obligatoires.');
          setAuthLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authFullName,
              phone: authPhone,
              address: address,
              role: 'client',
            },
          },
        });
        if (error) setAuthError(error.message || 'Erreur lors de la création du compte.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Une erreur est survenue.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Soumission finale du rendez-vous
  const handleFinalSubmit = async () => {
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Veuillez vous connecter ou créer un compte pour valider votre réservation.');
      return;
    }

    if (!selectedService) {
      setErrorMsg('Veuillez sélectionner une prestation.');
      setCurrentStep(1);
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startTimeStr = `${selectedTime}:00`;

    // Validation Zod stricte
    const validationResult = appointmentBookingSchema.safeParse({
      service_id: selectedService.id,
      staff_id: selectedStaff?.id || null,
      appointment_date: dateStr,
      start_time: startTimeStr,
      location_type: locationType,
      location_address: locationType === 'home' ? address : 'Au salon / Studio',
      notes: notes || null,
    });

    if (!validationResult.success) {
      setErrorMsg(validationResult.error.errors[0]?.message || 'Données de formulaire invalides');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Appel de l'Edge Function Supabase create-appointment
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-appointment', {
        body: {
          service_id: validationResult.data.service_id,
          staff_id: validationResult.data.staff_id,
          date: dateStr,
          start_time: selectedTime,
          location_type: locationType,
          location_address: locationType === 'home' ? address : null,
          notes: notes || null,
        },
      });

      if (!edgeError && edgeData?.success) {
        setBookingSuccess(edgeData.appointment || true);
        return;
      }

      if (edgeData?.error) {
        setErrorMsg(edgeData.error);
        setSubmitting(false);
        return;
      }

      // 2. Fallback direct client si les Edge Functions locales ne sont pas actives
      const [h, m] = selectedTime.split(':').map(Number);
      const endMinutes = h * 60 + m + selectedService.duration_minutes;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

      const fallbackPayload: any = {
        client_id: user.id,
        service_id: validationResult.data.service_id,
        staff_id: validationResult.data.staff_id || null,
        appointment_date: dateStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: 'pending' as AppointmentStatus,
        location_type: locationType,
        location_address: locationType === 'home' ? address : null,
        notes: notes || null,
        confirmation_sent: false,
        reminder_sent: false,
      };

      const { data: insertedData, error: directError } = await supabase
        .from('appointments')
        .insert(fallbackPayload)
        .select('*, services (*)')
        .single();

      if (directError) {
        setErrorMsg('Erreur lors de la réservation : ' + directError.message);
      } else {
        setBookingSuccess(insertedData || true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['Tous', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices = services.filter((s) => selectedCategory === 'Tous' || s.category === selectedCategory);

  // Écran de succès
  if (bookingSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-8 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg border-2 border-emerald-300">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>

        <div className="space-y-3">
          <span className="text-xs uppercase font-bold text-amber-800 tracking-wider">Réservation Enregistrée</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
            Merci pour votre confiance !
          </h1>
          <p className="text-stone-700 text-base max-w-md mx-auto">
            Votre demande de rendez-vous a bien été transmise à <strong>Cindy Malorie</strong>. Un email de confirmation récapitulatif vous a été envoyé.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-sm text-left max-w-md mx-auto space-y-4 text-sm">
          <h3 className="font-bold text-stone-900 font-serif text-base pb-2 border-b border-stone-100">
            Détails de votre prestation
          </h3>
          <div className="flex justify-between">
            <span className="text-stone-500">Prestation :</span>
            <span className="font-bold text-stone-900">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Coiffeuse :</span>
            <span className="font-bold text-stone-900">{selectedStaff?.full_name || 'Cindy Malorie'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Date :</span>
            <span className="font-bold text-stone-900">
              {format(selectedDate, 'dd MMMM yyyy', { locale: fr })} à {selectedTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Lieu :</span>
            <span className="font-bold text-stone-900">
              {locationType === 'home' ? `🏠 Domicile (${address})` : '💈 Studio Privé'}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-stone-100 font-bold text-base text-stone-950">
            <span>Total :</span>
            <span className="text-amber-800">{formatCurrency(Number(selectedService?.price || 0))}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            to="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            Accéder à mon espace client
          </Link>
          <Link
            to="/"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-200 font-bold text-xs transition-all flex items-center justify-center"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* En-tête de page */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wider border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Réservation en Ligne
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
          Planifiez votre séance avec Cindy Malorie
        </h1>
        <p className="text-stone-600 text-sm max-w-xl mx-auto">
          Choisissez votre prestation sur-mesure, sélectionnez votre créneau idéal et profitez d'une expérience coiffure sans contrainte.
        </p>
      </div>

      {/* Barre de Progression (Stepper 5 étapes) */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-stone-200 shadow-sm">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
          {[
            { step: 1, label: 'Prestation', icon: Scissors },
            { step: 2, label: 'Styliste', icon: User },
            { step: 3, label: 'Créneau', icon: CalendarIcon },
            { step: 4, label: 'Lieu', icon: Home },
            { step: 5, label: 'Validation', icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => {
                  if (item.step < currentStep || (item.step === 2 && selectedService)) {
                    setCurrentStep(item.step);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 py-1 transition-all ${
                  isCurrent
                    ? 'text-stone-900 font-bold'
                    : isCompleted
                    ? 'text-amber-800 font-semibold'
                    : 'text-stone-400 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-stone-900 text-amber-400 shadow-md scale-105 ring-2 ring-stone-900 ring-offset-2'
                      : isCompleted
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-[11px] sm:text-xs tracking-tight hidden sm:inline">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages d'erreur */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs sm:text-sm font-medium flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Conteneur des Étapes */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-sm min-h-[420px]">
        
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-stone-700">Chargement des disponibilités...</p>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* ÉTAPE 1 : SÉLECTION DU SERVICE */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Scissors className="w-6 h-6 text-amber-700" />
                      1. Choisissez votre prestation
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Chaque prestation comprend le diagnostic sur-mesure, les soins et le matériel professionnel.
                    </p>
                  </div>

                  {/* Filtre de catégories */}
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          selectedCategory === cat
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {filteredServices.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'border-stone-900 bg-amber-50/50 shadow-md ring-2 ring-stone-900/10'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-stone-900 text-base">{service.name}</span>
                            <span className="text-base font-bold font-serif text-stone-900 ml-2">
                              {formatCurrency(Number(service.price))}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                            {service.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-semibold text-stone-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            {service.duration_minutes} minutes
                          </span>
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px]">
                            {service.category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-6 border-t border-stone-100">
                  <button
                    type="button"
                    disabled={!selectedService}
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>Étape suivante : Coiffeur</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ÉTAPE 2 : SÉLECTION DU COIFFEUR */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-amber-700" />
                    2. Choisissez votre styliste
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Découvrez le profil et les spécialités de votre coiffeuse dédiée à domicile.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {staffList.map((staff) => {
                    const isSelected = selectedStaff?.id === staff.id;
                    return (
                      <div
                        key={staff.id}
                        onClick={() => setSelectedStaff(staff)}
                        className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row items-center sm:items-start gap-5 ${
                          isSelected
                            ? 'border-stone-900 bg-amber-50/60 shadow-md ring-2 ring-stone-900/10'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={staff.avatar_url || 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&auto=format&fit=crop&q=80'}
                            alt={staff.full_name}
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-stone-200"
                          />
                          <span className="absolute -bottom-2 -right-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            TikTok
                          </span>
                        </div>

                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h3 className="text-lg font-bold text-stone-900">{staff.full_name}</h3>
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block">
                              Artisan Coiffeur
                            </span>
                          </div>
                          <p className="text-xs text-amber-900 font-semibold">{staff.specialty}</p>
                          <p className="text-xs text-stone-600 leading-relaxed font-normal">{staff.bio}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3.5 rounded-xl border-2 border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    disabled={!selectedStaff}
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>Étape suivante : Date & Heure</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ÉTAPE 3 : DATE & CRÉNEAU HORAIRE */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-amber-700" />
                    3. Choisissez la date et le créneau
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Les disponibilités sont calculées en temps réel selon la durée de la prestation ({selectedService?.duration_minutes} min).
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                  {/* Calendrier interactif */}
                  <div className="lg:col-span-6 bg-stone-50/50 rounded-2xl p-4 border-2 border-stone-200 flex justify-center">
                    <Calendar
                      value={selectedDate}
                      onChange={(date) => setSelectedDate(date as Date)}
                      minDate={startOfToday()}
                      maxDate={addDays(startOfToday(), 60)}
                      locale="fr-FR"
                      className="w-full border-none font-sans text-sm rounded-xl"
                    />
                  </div>

                  {/* Sélection du créneau horaire */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                        Créneaux pour le {format(selectedDate, 'dd MMMM yyyy', { locale: fr })} :
                      </span>
                    </div>

                    {isDateBlocked(selectedDate).blocked ? (
                      <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl text-center space-y-2">
                        <AlertCircle className="w-6 h-6 text-amber-800 mx-auto" />
                        <p className="text-sm font-bold text-amber-950">
                          Cette date est indisponible ({isDateBlocked(selectedDate).reason})
                        </p>
                        <p className="text-xs text-amber-800">
                          Veuillez choisir un autre jour sur le calendrier.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {STANDARD_TIME_SLOTS.map((slot) => {
                          const status = isSlotAvailable(slot);
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={!status.available}
                              onClick={() => setSelectedTime(slot)}
                              className={`py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                                !status.available
                                  ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-50 line-through'
                                  : isSelected
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-stone-900/20'
                                  : 'bg-white text-stone-800 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <span className="text-sm">{slot}</span>
                              <span className="text-[10px] font-normal opacity-80">
                                {!status.available ? status.reason : 'Disponible'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="p-4 bg-stone-100 rounded-xl text-xs text-stone-600 space-y-1">
                      <p>⏱️ <strong>Durée prévue :</strong> {selectedService?.duration_minutes} minutes</p>
                      <p>🏠 <strong>Heure d'arrivée à votre domicile :</strong> {selectedTime}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3.5 rounded-xl border-2 border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    disabled={isDateBlocked(selectedDate).blocked || !isSlotAvailable(selectedTime).available}
                    onClick={() => setCurrentStep(4)}
                    className="px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>Étape suivante : Lieu</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ÉTAPE 4 : CHOIX DU LIEU (3bis) */}
            {/* ========================================================================= */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Home className="w-6 h-6 text-amber-700" />
                    4. Choisissez le lieu de la prestation
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Cindy Malorie se déplace directement à votre domicile avec tout l'équipement professionnel.
                  </p>
                </div>

                {/* Choix des Radios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <label
                    onClick={() => setLocationType('home')}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                      locationType === 'home'
                        ? 'border-stone-900 bg-amber-50/50 shadow-md ring-2 ring-stone-900/10'
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="location_type"
                      value="home"
                      checked={locationType === 'home'}
                      onChange={() => setLocationType('home')}
                      className="mt-1 text-stone-900 focus:ring-stone-900"
                    />
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-amber-700" />
                        À mon domicile (Recommandé)
                      </span>
                      <p className="text-xs text-stone-600">
                        Cindy apporte bac à shampoing ergonomique, serviettes et matériel complet.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setLocationType('salon')}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                      locationType === 'salon'
                        ? 'border-stone-900 bg-amber-50/50 shadow-md ring-2 ring-stone-900/10'
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="location_type"
                      value="salon"
                      checked={locationType === 'salon'}
                      onChange={() => setLocationType('salon')}
                      className="mt-1 text-stone-900 focus:ring-stone-900"
                    />
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-700" />
                        Chez Cindy (Studio Privé)
                      </span>
                      <p className="text-xs text-stone-600">
                        Accueil dans notre espace privé : <strong>Via Francana 10, Pavia (Italie)</strong>.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Champ d'adresse si domicile */}
                {locationType === 'home' && (
                  <div className="space-y-2 p-5 bg-stone-50 rounded-2xl border-2 border-stone-200">
                    <label className="block text-xs font-bold text-stone-800">
                      Adresse complète de votre domicile (Italie) *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Via Roma 15, Milano (Palazzina B, Piano 3, Citofono 12)"
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-300 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900 bg-white"
                    />
                    <p className="text-[11px] text-stone-500">
                      Déplacement gratuit inclus sur Pavia et proximité. Déplacement sur tout Milan et la Lombardie.
                    </p>
                  </div>
                )}

                {/* Champ notes optionnelles */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Instructions particulières ou souhaits capillaires (Optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Cheveux très longs et épais, envie d'un balayage chaud, sonnette en panne..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900 bg-white"
                  />
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3.5 rounded-xl border-2 border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    disabled={locationType === 'home' && address.trim().length < 5}
                    onClick={() => setCurrentStep(5)}
                    className="px-8 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>Étape suivante : Récapitulatif</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ÉTAPE 5 : RÉCAPITULATIF ET CONFIRMATION FINALE */}
            {/* ========================================================================= */}
            {currentStep === 5 && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-amber-700" />
                    5. Récapitulatif et Validation
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Vérifiez les détails de votre réservation avant confirmation définitive.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Récapitulatif visuel (Gauche) */}
                  <div className="lg:col-span-7 bg-stone-50/70 rounded-3xl p-6 sm:p-8 border-2 border-stone-200 space-y-5">
                    <div className="flex justify-between items-start pb-4 border-b border-stone-200">
                      <div>
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                          Prestation sélectionnée
                        </span>
                        <h3 className="text-xl font-bold text-stone-900 mt-1">{selectedService?.name}</h3>
                        <p className="text-xs text-stone-600 mt-1">{selectedService?.description}</p>
                      </div>
                      <span className="text-2xl font-serif font-bold text-stone-900">
                        {formatCurrency(Number(selectedService?.price || 0))}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                        <span className="text-stone-500 font-semibold">Coiffeuse :</span>
                        <p className="font-bold text-stone-900">{selectedStaff?.full_name || 'Cindy Malorie'}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                        <span className="text-stone-500 font-semibold">Durée estimée :</span>
                        <p className="font-bold text-stone-900">{selectedService?.duration_minutes} minutes</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                        <span className="text-stone-500 font-semibold">Date & Heure :</span>
                        <p className="font-bold text-stone-900">
                          {format(selectedDate, 'dd MMMM yyyy', { locale: fr })} à {selectedTime}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1">
                        <span className="text-stone-500 font-semibold">Lieu :</span>
                        <p className="font-bold text-stone-900">
                          {locationType === 'home' ? '🏠 À votre domicile' : '💈 Studio Privé'}
                        </p>
                      </div>
                    </div>

                    {locationType === 'home' && (
                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-xs">
                        <span className="text-stone-500 font-semibold">Adresse d'intervention :</span>
                        <p className="font-bold text-stone-900 mt-0.5">{address}</p>
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs flex items-center gap-3">
                      <Award className="w-5 h-5 text-amber-800 flex-shrink-0" />
                      <span>
                        Cette réservation vous rapportera <strong>{Math.floor(Number(selectedService?.price || 0))} points de fidélité</strong> !
                      </span>
                    </div>
                  </div>

                  {/* Authentification ou Validation Finale (Droite) */}
                  <div className="lg:col-span-5 space-y-6">
                    {user ? (
                      /* Utilisateur déjà connecté */
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-5">
                        <div className="flex items-center space-x-3 pb-4 border-b border-stone-100">
                          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center font-serif font-bold text-lg">
                            {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-sm">{profile?.full_name || user.email}</p>
                            <p className="text-xs text-stone-500">{user.email}</p>
                          </div>
                        </div>

                        <div className="text-xs text-stone-600 space-y-2">
                          <p className="flex items-center gap-2 text-emerald-700 font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            Session sécurisée avec validation Zod & RLS
                          </p>
                          <p>
                            En cliquant sur confirmer, vous recevrez un récapitulatif par email avec lien d'annulation directe et rappel 24h avant.
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleFinalSubmit}
                          className="w-full py-4 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Réservation en cours...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 text-amber-400" />
                              <span>Confirmer mon rendez-vous</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Authentification Inline si non connecté */
                      <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm space-y-4">
                        <div className="flex rounded-xl bg-stone-100 p-1">
                          <button
                            type="button"
                            onClick={() => setAuthMode('login')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                              authMode === 'login' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
                            }`}
                          >
                            Se connecter
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthMode('register')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                              authMode === 'register' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
                            }`}
                          >
                            Créer un compte
                          </button>
                        </div>

                        {authError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                            {authError}
                          </div>
                        )}

                        <form onSubmit={handleInlineAuth} className="space-y-3">
                          {authMode === 'register' && (
                            <>
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">Nom complet *</label>
                                <input
                                  type="text"
                                  required
                                  value={authFullName}
                                  onChange={(e) => setAuthFullName(e.target.value)}
                                  placeholder="Ex: Céline Robert"
                                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">Téléphone *</label>
                                <input
                                  type="tel"
                                  required
                                  value={authPhone}
                                  onChange={(e) => setAuthPhone(e.target.value)}
                                  placeholder="Ex: 06 12 34 56 78"
                                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">Email *</label>
                            <input
                              type="email"
                              required
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="votre.email@exemple.com"
                              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">Mot de passe *</label>
                            <input
                              type="password"
                              required
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            {authLoading ? (
                              <span>Connexion...</span>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>{authMode === 'login' ? 'Connexion & Continuer' : 'Inscription & Continuer'}</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                </div>

                <div className="flex justify-start pt-6 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3.5 rounded-xl border-2 border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Modifier le lieu</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
