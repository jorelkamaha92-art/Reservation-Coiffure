import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { AppointmentWithDetails, Service } from '../types';
import { formatDateFr, formatTimeFr } from '../utils/date';
import { formatCurrency } from '../utils/format';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Scissors, 
  Sparkles, 
  Lock, 
  ChevronRight,
  Download,
  ArrowRight,
  AlertCircle,
  Smartphone,
  Wallet
} from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(
    (location.state as any)?.appointment || null
  );
  const [loading, setLoading] = useState<boolean>(!appointment);
  const [paymentType, setPaymentType] = useState<'deposit_15' | 'full'>('deposit_15');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'paypal' | 'on_site'>('card');
  
  // Champs formulaire carte
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>(profile?.full_name || '');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Charger le rendez-vous si non passé via location.state
  useEffect(() => {
    if (!appointment && appointmentId) {
      const fetchAppointment = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('appointments')
            .select('*, services (*), staff (*), profiles (*)')
            .eq('id', appointmentId)
            .single();

          if (error || !data) {
            console.error('Erreur récupération rendez-vous :', error);
            setErrorMsg('Rendez-vous introuvable ou déjà traité.');
          } else {
            setAppointment(data as unknown as AppointmentWithDetails);
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Erreur lors du chargement du rendez-vous');
        } finally {
          setLoading(false);
        }
      };

      fetchAppointment();
    }
  }, [appointmentId, appointment]);

  const service: Service | undefined = appointment?.services;
  const totalPrice: number = service?.price || 60;
  
  // Calcul précis des montants : Acompte 15% et Solde restant 85%
  const deposit15: number = Math.round(totalPrice * 0.15 * 100) / 100;
  const remaining85: number = Math.round((totalPrice - deposit15) * 100) / 100;
  
  const amountToPayNow: number = paymentType === 'deposit_15' ? deposit15 : totalPrice;
  const remainingAtSalon: number = paymentType === 'deposit_15' ? remaining85 : 0;
  const loyaltyPointsEarned: number = Math.round(totalPrice * 0.5);

  // Formatage du numéro de carte bancaire (espaces tous les 4 chiffres)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(val);
  };

  // Formatage Expiration MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // Simulation du délai bancaire sécurisé 3D Secure
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newPaymentStatus = paymentMethod === 'on_site' 
        ? 'pending' 
        : paymentType === 'deposit_15' 
          ? 'deposit_paid' 
          : 'paid';

      if (appointment?.id) {
        // Mise à jour de la réservation dans Supabase
        await supabase
          .from('appointments')
          .update({
            status: 'confirmed',
            payment_status: newPaymentStatus,
            payment_type: paymentType,
            amount_paid: paymentMethod === 'on_site' ? 0 : amountToPayNow,
            deposit_amount: deposit15,
            remaining_balance: remainingAtSalon,
            stripe_payment_id: 'ch_' + Math.random().toString(36).substring(2, 12),
          } as any)
          .eq('id', appointment.id);

        // Attribution des points fidélité si utilisateur connecté
        if (user?.id) {
          await supabase.from('loyalty_transactions').insert({
            client_id: user.id,
            points: loyaltyPointsEarned,
            transaction_type: 'earned',
            appointment_id: appointment.id,
            description: `Points fidélité réservation : ${service?.name || 'Prestation'} (${paymentType === 'deposit_15' ? 'Acompte 15%' : 'Totalité'})`,
          } as any);

          await refreshProfile();
        }
      }

      setPaymentSuccess(true);
    } catch (err: any) {
      console.error('Erreur paiement :', err);
      setErrorMsg(err.message || 'Le paiement a échoué. Veuillez vérifier vos coordonnées bancaires.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-stone-600">Chargement de votre session de paiement sécurisé...</p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-[85vh] py-12 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-300">
          
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Paiement & Réservation Confirmés
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              Merci pour votre confiance !
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Votre créneau est définitivement réservé auprès de Cindy Malorie. Un email de confirmation détaillé vous a été envoyé.
            </p>
          </div>

          {/* Récapitulatif du paiement */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="text-xs text-stone-600">Prestation</span>
              <span className="text-xs font-bold text-stone-900">{service?.name}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="text-xs text-stone-600">Date & Heure</span>
              <span className="text-xs font-bold text-stone-900">
                {appointment?.appointment_date ? formatDateFr(appointment.appointment_date) : 'À venir'} à {appointment?.start_time ? formatTimeFr(appointment.start_time) : ''}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="text-xs text-stone-600">Montant réglé maintenant</span>
              <span className="text-sm font-bold text-emerald-700">
                {paymentMethod === 'on_site' ? 'Paiement sur place' : formatCurrency(amountToPayNow)}
              </span>
            </div>

            {paymentType === 'deposit_15' && paymentMethod !== 'on_site' && (
              <div className="flex justify-between items-center text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                <span className="text-xs font-semibold">Solde restant à régler au salon</span>
                <span className="text-xs font-bold">{formatCurrency(remainingAtSalon)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 text-stone-600 text-[11px]">
              <span>Points de fidélité accordés</span>
              <span className="font-bold text-amber-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                +{loyaltyPointsEarned} points Cindy Privilège
              </span>
            </div>
          </div>

          {/* Boutons d'actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="py-3 px-4 rounded-xl border-2 border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Imprimer le reçu
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              Voir mon espace client
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-10 px-4 max-w-5xl mx-auto space-y-8">
      
      {/* En-tête */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          Paiement Sécurisé SSL 256-Bit
        </div>
        <h1 className="text-3xl font-bold font-serif text-stone-900">
          Finalisation de votre réservation
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
          Choisissez de régler un acompte de 15% pour bloquer votre rendez-vous, ou réglez la totalité à l'avance.
        </p>
      </div>

      {errorMsg && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* COLONNE GAUCHE : OPTIONS DE PAIEMENT & FORMULAIRE */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ÉTAPE 1 : CHOIX DU TYPE DE PAIEMENT (ACOMPTE 15% vs TOTALITÉ 100%) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
              Choisissez votre formule de règlement
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option Acompte 15% */}
              <div 
                onClick={() => setPaymentType('deposit_15')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                  paymentType === 'deposit_15'
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                    Recommandé
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'deposit_15' ? 'border-amber-700 bg-amber-700' : 'border-stone-300'
                  }`}>
                    {paymentType === 'deposit_15' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Acompte de 15%</h3>
                  <p className="text-[11px] text-stone-600 mt-1">
                    Bloque instantanément votre créneau.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-baseline justify-between">
                  <span className="text-xs text-stone-500">À payer :</span>
                  <span className="text-base font-bold text-amber-800">{formatCurrency(deposit15)}</span>
                </div>
              </div>

              {/* Option Totalité 100% */}
              <div 
                onClick={() => setPaymentType('full')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paymentType === 'full'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                    : 'border-stone-200 hover:border-stone-300 bg-white text-stone-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    paymentType === 'full' ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-700'
                  }`}>
                    100% Sérénité
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'full' ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                  }`}>
                    {paymentType === 'full' && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Paiement Intégral</h3>
                  <p className={`text-[11px] mt-1 ${paymentType === 'full' ? 'text-stone-300' : 'text-stone-600'}`}>
                    Tout est réglé à l'avance en 1 fois.
                  </p>
                </div>
                <div className={`mt-4 pt-3 border-t flex items-baseline justify-between ${
                  paymentType === 'full' ? 'border-stone-800' : 'border-stone-200/60'
                }`}>
                  <span className={`text-xs ${paymentType === 'full' ? 'text-stone-300' : 'text-stone-500'}`}>À payer :</span>
                  <span className={`text-base font-bold ${paymentType === 'full' ? 'text-amber-300' : 'text-stone-900'}`}>
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ÉTAPE 2 : MOYEN DE PAIEMENT & FORMULAIRE */}
          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
              Mode de règlement
            </h2>

            {/* Onglets Moyens de paiement */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Carte Bancaire
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('apple_pay')}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'apple_pay'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Apple / Google
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('on_site')}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'on_site'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                Sur place
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 pt-2">
              
              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Nom sur la carte
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Ex: Céline Robert"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Numéro de carte bancaire
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 •••• •••• 8910"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50 font-mono"
                      />
                      <CreditCard className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Date d'expiration
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/AA"
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50 font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Code CVC / CVV
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50 font-mono text-center"
                        />
                        <Lock className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'apple_pay' && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-stone-800 mx-auto" />
                  <p className="text-xs font-bold text-stone-900">Paiement instantané 1-Clic</p>
                  <p className="text-[11px] text-stone-600">
                    Votre empreinte digitale Touch ID ou Face ID sera demandée pour valider le montant de {formatCurrency(amountToPayNow)}.
                  </p>
                </div>
              )}

              {paymentMethod === 'on_site' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-stone-900 space-y-1.5 text-left text-xs">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" />
                    Règlement sur place au salon
                  </span>
                  <p className="text-stone-700 text-[11px] leading-relaxed">
                    Votre créneau sera réservé avec statut en attente de paiement. Vous réglerez l'intégralité ({formatCurrency(totalPrice)}) à votre arrivée au salon (Carte bancaire ou Espèces).
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 border border-stone-900"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span>Sécurisation de la transaction...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>
                      {paymentMethod === 'on_site'
                        ? 'Confirmer la réservation sans acompte'
                        : `Régler ${formatCurrency(amountToPayNow)} en toute sécurité`}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-600 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Chiffrement bancaire 256-bit
                </span>
                <span>•</span>
                <span>3D Secure V2</span>
                <span>•</span>
                <span>Stripe Certified</span>
              </div>

            </form>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* COLONNE DROITE : RÉCAPITULATIF DU RENDEZ-VOUS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm space-y-5 sticky top-24">
            
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm font-serif">
                Détails de la réservation
              </h3>
              <span className="text-[10px] bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded-full">
                Réf: {appointment?.id ? appointment.id.substring(0, 8) : 'RDV'}
              </span>
            </div>

            {/* Service */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Scissors className="w-5 h-5 rotate-45" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                  {service?.name || 'Prestation Coiffure'}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-stone-600 mt-0.5">
                  <span className="bg-amber-100 text-amber-950 font-bold px-1.5 py-0.2 rounded text-[10px]">
                    {service?.category || 'Coiffure'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-500" />
                    {service?.duration_minutes || 60} min
                  </span>
                </div>
              </div>
            </div>

            {/* Date & Heure & Lieu */}
            <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-xs">
              <div className="flex items-center gap-2.5 text-stone-800 font-medium">
                <CalendarIcon className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  {appointment?.appointment_date 
                    ? formatDateFr(appointment.appointment_date) 
                    : 'Date sélectionnée'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-stone-800 font-medium">
                <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  {appointment?.start_time ? formatTimeFr(appointment.start_time) : '09:00'} -{' '}
                  {appointment?.end_time ? formatTimeFr(appointment.end_time) : '10:30'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-stone-800 font-medium">
                <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  {appointment?.location_type === 'home'
                    ? `À domicile : ${appointment.location_address || 'Adresse fournie'}`
                    : 'Au salon : Via Francana 10, Pavia (Italie)'}
                </span>
              </div>
            </div>

            {/* Décomposition Financière */}
            <div className="space-y-2 pt-2 border-t border-stone-200 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span>Prix total prestation</span>
                <span className="font-bold text-stone-900">{formatCurrency(totalPrice)}</span>
              </div>

              {paymentType === 'deposit_15' ? (
                <>
                  <div className="flex justify-between items-center text-amber-800 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <span>Acompte à payer en ligne (15%)</span>
                    <span>{formatCurrency(deposit15)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600 text-[11px] px-1">
                    <span>Solde à régler le jour J au salon</span>
                    <span className="font-semibold">{formatCurrency(remaining85)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-stone-900 font-bold bg-stone-100 p-2.5 rounded-xl border border-stone-300">
                  <span>Montant total réglé (100%)</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              )}
            </div>

            {/* Privilège Fidélité */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between text-xs shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-stone-200">
                  Crédit de points fidélité
                </span>
              </div>
              <span className="font-bold text-amber-300 text-xs">
                +{loyaltyPointsEarned} pts
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default PaymentPage;
