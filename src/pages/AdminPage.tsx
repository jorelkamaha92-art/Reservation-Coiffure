import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails, AppointmentStatus } from '../types';
import { formatDateFr, formatTimeFr } from '../utils/date';
import { formatCurrency, getStatusBadgeColor, getStatusLabel } from '../utils/format';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  Calendar,
  DollarSign,
  Percent,
  Scissors,
  Check,
  XCircle,
  Sparkles,
  CalendarRange,
  Filter
} from 'lucide-react';
import { 
  format, 
  subDays, 
  isToday, 
  isThisWeek, 
  isThisMonth, 
  isThisYear,
  isAfter,
  parseISO 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type DatePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export const AdminPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // État du filtre de période pour les KPIs
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (*),
          profiles (*)
        `)
        .order('appointment_date', { ascending: false });

      if (!error && data) {
        setAppointments(data as unknown as AppointmentWithDetails[]);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Erreur de récupération des données admin :', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Modification du statut en 1 clic
  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setUpdatingId(appointmentId);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus } as any)
        .eq('id', appointmentId);

      if (!error) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================================================
  // 1. FILTRAGE DYNAMIQUE SELON LA PÉRIODE CHOISIE
  // =========================================================================
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.appointment_date) return false;
      try {
        const d = parseISO(a.appointment_date);
        if (datePreset === 'today') {
          return isToday(d);
        }
        if (datePreset === 'week') {
          return isThisWeek(d, { weekStartsOn: 1 }) || isAfter(d, subDays(new Date(), 7));
        }
        if (datePreset === 'month') {
          return isThisMonth(d) || isAfter(d, subDays(new Date(), 30));
        }
        if (datePreset === 'year') {
          return isThisYear(d);
        }
        if (datePreset === 'custom') {
          return a.appointment_date >= customStartDate && a.appointment_date <= customEndDate;
        }
        return true; // 'all'
      } catch {
        return true;
      }
    });
  }, [appointments, datePreset, customStartDate, customEndDate]);

  // =========================================================================
  // 2. CALCUL DES KPIS SUR LA PÉRIODE FILTRÉE
  // =========================================================================
  const totalAppointments = filteredAppointments.length;

  // RDVs Aujourd'hui (indicateur absolu)
  const appointmentsToday = appointments.filter((a) => {
    try {
      return isToday(parseISO(a.appointment_date));
    } catch {
      return false;
    }
  }).length;

  const appointmentsThisMonth = appointments.filter((a) => {
    try {
      return isThisMonth(parseISO(a.appointment_date));
    } catch {
      return false;
    }
  }).length;

  // Chiffre d'affaires calculé sur les RDV 'completed' de la période sélectionnée
  const completedAppointments = filteredAppointments.filter((a) => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((acc, curr) => acc + Number(curr.services?.price || 0), 0);

  // Panier moyen sur la sélection
  const averageCart = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

  // Statuts sur la sélection
  const confirmedCount = filteredAppointments.filter((a) => a.status === 'confirmed').length;
  const pendingCount = filteredAppointments.filter((a) => a.status === 'pending').length;
  const completedCount = completedAppointments.length;
  const cancelledCount = filteredAppointments.filter((a) => a.status === 'cancelled').length;

  // Taux de transformation / confirmation
  const validBookings = confirmedCount + completedCount;
  const conversionRate = totalAppointments > 0 ? Math.round((validBookings / totalAppointments) * 100) : 0;

  // Libellé de la période active pour les cartes
  const getPeriodLabel = () => {
    switch (datePreset) {
      case 'today': return "Aujourd'hui";
      case 'week': return '7 derniers jours';
      case 'month': return '30 derniers jours';
      case 'year': return 'Cette année';
      case 'custom': return `Du ${formatDateFr(customStartDate)} au ${formatDateFr(customEndDate)}`;
      default: return 'Historique complet';
    }
  };

  // =========================================================================
  // 3. DONNÉES DES 3 GRAPHIQUES (Chart.js)
  // =========================================================================

  // Graphique 1 : Évolution temporelle (Line Chart)
  const timelineDays = useMemo(() => {
    const numDays = datePreset === 'today' ? 1 : datePreset === 'week' ? 7 : 30;
    return Array.from({ length: numDays }, (_, i) => {
      const d = subDays(new Date(), numDays - 1 - i);
      return format(d, 'yyyy-MM-dd');
    });
  }, [datePreset]);

  const appointmentsPerDay = timelineDays.map((dayStr) => {
    return filteredAppointments.filter((a) => a.appointment_date === dayStr).length;
  });

  const lineChartData = {
    labels: timelineDays.map((d) => format(parseISO(d), 'dd MMM', { locale: fr })),
    datasets: [
      {
        label: 'Rendez-vous enregistrés',
        data: appointmentsPerDay,
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#1c1917',
        pointBorderColor: '#d97706',
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1917',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#78716c' },
        grid: { color: '#f5f5f4' },
      },
      x: {
        ticks: { maxTicksLimit: 8, color: '#78716c' },
        grid: { display: false },
      },
    },
  };

  // Graphique 2 : Répartition par Statut (Donut / Doughnut Chart)
  const doughnutData = {
    labels: ['Confirmés', 'En attente', 'Terminés', 'Annulés'],
    datasets: [
      {
        data: totalAppointments > 0 ? [confirmedCount, pendingCount, completedCount, cancelledCount] : [0, 0, 0, 0],
        backgroundColor: ['#059669', '#d97706', '#2563eb', '#e11d48'],
        hoverBackgroundColor: ['#047857', '#b45309', '#1d4ed8', '#be123c'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 11, weight: 'bold' as const },
          padding: 14,
        },
      },
    },
  };

  // Graphique 3 : Répartition par Prestation (Bar Chart)
  const serviceCounts: { [name: string]: number } = {};
  filteredAppointments.forEach((a) => {
    const serviceName = a.services?.name || 'Prestation';
    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
  });

  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const barData = {
    labels: sortedServices.length > 0 ? sortedServices.map((s) => s[0]) : ['Aucune prestation sur cette période'],
    datasets: [
      {
        label: 'Réservations',
        data: sortedServices.length > 0 ? sortedServices.map((s) => s[1]) : [0],
        backgroundColor: '#1c1917',
        hoverBackgroundColor: '#d97706',
        borderRadius: 8,
        barThickness: 24,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1917',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#78716c' },
        grid: { color: '#f5f5f4' },
      },
      x: {
        ticks: { 
          color: '#78716c',
          maxRotation: 20,
          minRotation: 0,
          font: { size: 10 }
        },
        grid: { display: false },
      },
    },
  };

  // Activité récente : les 5 derniers rendez-vous de la sélection
  const recentAppointments = filteredAppointments.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* En-tête Espace Pro & Administration */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Portail Direction & Pilotage</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight text-white">
            Bonjour Cindy TCHAMABE
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Suivi en direct de votre activité, de vos prestations à domicile et du chiffre d'affaires réalisé.
          </p>
        </div>

        {/* Liens de gestion rapide */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
          <Link
            to="/admin/appointments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Planning</span>
          </Link>

          <Link
            to="/admin/clients"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
          >
            <span>👥 Clients</span>
          </Link>

          <Link
            to="/admin/services"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
          >
            <span>✂️ Services</span>
          </Link>

          <Link
            to="/admin/loyalty"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
          >
            <span>🎁 Fidélité</span>
          </Link>

          <Link
            to="/admin/availability"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Horaires</span>
          </Link>

          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-all"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SÉLECTEUR DE DATE & PÉRIODE POUR LES KPIS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Titre & Filtres rapides */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mr-2">
            <Filter className="w-4 h-4 text-amber-600" />
            <span>Période des KPI :</span>
          </div>

          {[
            { key: 'all', label: 'Tous' },
            { key: 'today', label: "Aujourd'hui" },
            { key: 'week', label: '7 Jours' },
            { key: 'month', label: '30 Jours' },
            { key: 'year', label: 'Année' },
            { key: 'custom', label: 'Personnalisée' },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => setDatePreset(preset.key as DatePreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === preset.key
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Pickers pour Période Personnalisée */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 pt-2 md:pt-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-300">
              <CalendarRange className="w-3.5 h-3.5 text-stone-500" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs bg-transparent text-stone-800 font-semibold focus:outline-none"
              />
              <span className="text-xs text-stone-400 font-bold">au</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs bg-transparent text-stone-800 font-semibold focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Badge indicateur du résultat filtré */}
        <div className="text-right md:text-left text-xs font-semibold text-stone-500">
          Affichage : <span className="font-bold text-stone-800">{getPeriodLabel()}</span> ({totalAppointments} RDV)
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. CARTES KPIS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        
        {/* KPI 1 : Chiffre d'Affaires Réalisé */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">CA Réalisé (Terminé)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {formatCurrency(totalRevenue)}
            </span>
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold mt-1">
              <span>Période : {getPeriodLabel()}</span>
            </div>
          </div>
        </div>

        {/* KPI 2 : Rendez-vous du Jour & Total Période */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Réservations sur Période</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {totalAppointments} <span className="text-base font-sans text-stone-500 font-normal">RDV</span>
            </span>
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold mt-1">
              <span>Aujourd'hui : <strong>{appointmentsToday}</strong></span>
              <span>Ce mois : <strong>{appointmentsThisMonth}</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Taux de Transformation / Confirmation */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Taux de Conversion</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {conversionRate}%
            </span>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">
              {validBookings} RDV validés sur {totalAppointments || 1} demandes
            </p>
          </div>
        </div>

        {/* KPI 4 : Panier Moyen */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Panier Moyen</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {formatCurrency(averageCart)}
            </span>
            <p className="text-[11px] text-amber-800 font-bold mt-1">
              ⏳ {pendingCount} en attente de confirmation
            </p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. GRAPHIQUES CHART.JS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Graphique 1 : Évolution temporelle (Line Chart) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Évolution des Réservations
              </h3>
              <p className="text-xs text-stone-500">Volume quotidien des réservations sur la période sélectionnée</p>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {getPeriodLabel()}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Graphique 2 : Répartition par Statut (Donut Chart) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Répartition par Statut
            </h3>
            <p className="text-xs text-stone-500">État des rendez-vous de la période</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-2xl font-serif font-bold text-stone-900">{totalAppointments}</span>
              <span className="text-[10px] uppercase font-bold text-stone-400">Total RDV</span>
            </div>
          </div>
        </div>

      </div>

      {/* Graphique 3 : Prestations les plus demandées (Bar Chart) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-600" />
              Prestations les Plus Demandées
            </h3>
            <p className="text-xs text-stone-500">Volume de réservations par type de prestation ({getPeriodLabel()})</p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVITÉ RÉCENTE SUR LA PÉRIODE SÉLECTIONNÉE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Rendez-vous de la Période ({recentAppointments.length} affichés)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Gestion rapide et validation des statuts en temps réel
            </p>
          </div>

          <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 self-start sm:self-auto">
            {totalAppointments} RDV trouvés
          </span>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-semibold text-stone-700">Aucun rendez-vous sur cette période sélectionnée.</p>
            <p className="text-xs text-stone-400">Sélectionnez une autre période ou "Tous" pour voir l'ensemble des réservations.</p>
          </div>
        ) : (
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
                  <th className="py-3 px-3 text-right">Actions Rapides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-stone-50/70 transition-colors">
                    
                    {/* Client */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-stone-900">
                        {app.profiles?.full_name || 'Client Invité'}
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {app.profiles?.phone || app.profiles?.email || 'Sans numéro'}
                      </div>
                    </td>

                    {/* Prestation */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-stone-900">{app.services?.name}</span>
                      <span className="block text-[11px] text-stone-500">{app.services?.duration_minutes} min</span>
                    </td>

                    {/* Date & Heure */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-stone-800">
                        {formatDateFr(app.appointment_date)}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {formatTimeFr(app.start_time)} - {formatTimeFr(app.end_time)}
                      </div>
                    </td>

                    {/* Lieu */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-stone-800">
                        {app.location_type === 'home' ? '🏠 Domicile' : '💈 Studio'}
                      </span>
                      {app.location_address && (
                        <span className="block text-[11px] text-stone-500 line-clamp-1 max-w-[180px]">
                          {app.location_address}
                        </span>
                      )}
                    </td>

                    {/* Montant */}
                    <td className="py-3.5 px-3 font-serif font-bold text-sm text-stone-950">
                      {formatCurrency(Number(app.services?.price || 0))}
                    </td>

                    {/* Statut Badge */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>

                    {/* Actions de changement de statut */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                            disabled={updatingId === app.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition-all flex items-center gap-1"
                            title="Confirmer ce RDV"
                          >
                            <Check className="w-3 h-3" />
                            Confirmer
                          </button>
                        )}

                        {app.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'completed')}
                            disabled={updatingId === app.id}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm transition-all flex items-center gap-1"
                            title="Marquer comme terminé et créditer les points fidélité"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Terminer
                          </button>
                        )}

                        {app.status !== 'cancelled' && app.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                            disabled={updatingId === app.id}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-all"
                            title="Annuler ce RDV"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
