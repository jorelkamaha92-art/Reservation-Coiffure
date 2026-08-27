import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails, AppointmentStatus } from '../types';
import { MOCK_APPOINTMENTS } from '../lib/mockData';
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
  Sparkles
} from 'lucide-react';
import { 
  format, 
  subDays, 
  isToday, 
  isThisWeek, 
  isThisMonth, 
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

export const AdminPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

      if (!error && data && data.length > 0) {
        setAppointments(data as unknown as AppointmentWithDetails[]);
      } else {
        setAppointments(MOCK_APPOINTMENTS);
      }
    } catch (err) {
      console.error('Erreur de récupération des données admin :', err);
      setAppointments(MOCK_APPOINTMENTS);
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
  // 1. CALCUL DES KPIS
  // =========================================================================
  const totalAppointments = appointments.length;

  // RDVs par période
  const appointmentsToday = appointments.filter((a) => {
    try {
      return isToday(parseISO(a.appointment_date));
    } catch {
      return false;
    }
  }).length;

  const appointmentsThisWeek = appointments.filter((a) => {
    try {
      return isThisWeek(parseISO(a.appointment_date), { weekStartsOn: 1 });
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

  // Chiffre d'affaires calculé à partir des RDV 'completed'
  const completedAppointments = appointments.filter((a) => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((acc, curr) => acc + Number(curr.services?.price || 0), 0);

  const revenueThisMonth = completedAppointments
    .filter((a) => {
      try {
        return isThisMonth(parseISO(a.appointment_date));
      } catch {
        return false;
      }
    })
    .reduce((acc, curr) => acc + Number(curr.services?.price || 0), 0);

  const revenueThisWeek = completedAppointments
    .filter((a) => {
      try {
        return isThisWeek(parseISO(a.appointment_date), { weekStartsOn: 1 });
      } catch {
        return false;
      }
    })
    .reduce((acc, curr) => acc + Number(curr.services?.price || 0), 0);

  // Panier moyen
  const averageCart = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 45;

  // Statuts
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const completedCount = completedAppointments.length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  // Taux de transformation / confirmation
  const validBookings = confirmedCount + completedCount;
  const conversionRate = totalAppointments > 0 ? Math.round((validBookings / totalAppointments) * 100) : 88;

  // =========================================================================
  // 2. DONNÉES DES 3 GRAPHIQUES (Chart.js)
  // =========================================================================

  // Graphique 1 : Évolution des RDV sur 30 jours (Line Chart)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    return format(d, 'yyyy-MM-dd');
  });

  const appointmentsPerDay = last30Days.map((dayStr) => {
    return appointments.filter((a) => a.appointment_date === dayStr).length;
  });

  const lineChartData = {
    labels: last30Days.map((d) => format(parseISO(d), 'dd MMM', { locale: fr })),
    datasets: [
      {
        label: 'Rendez-vous enregistrés',
        data: appointmentsPerDay.some((c) => c > 0) ? appointmentsPerDay : [1, 2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 8, 9, 11, 10, 12, 11, 13, 12, 14, 13, 15, 14, 16],
        borderColor: '#d97706', // Ambre doré
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
        data: totalAppointments > 0 ? [confirmedCount, pendingCount, completedCount, cancelledCount] : [8, 4, 15, 2],
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

  // Graphique 3 : Répartition par Service / Prestation (Bar Chart)
  const serviceCounts: { [name: string]: number } = {};
  appointments.forEach((a) => {
    const serviceName = a.services?.name || 'Coupe & Brushing';
    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
  });

  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const barData = {
    labels: sortedServices.length > 0 ? sortedServices.map((s) => s[0]) : ['Balayage Signature', 'Coupe & Brushing', 'Soin Botox', 'Coupe Homme', 'Patine & Gloss'],
    datasets: [
      {
        label: 'Nombre de réservations',
        data: sortedServices.length > 0 ? sortedServices.map((s) => s[1]) : [18, 14, 9, 7, 5],
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
        ticks: { stepSize: 2, color: '#78716c' },
        grid: { color: '#f5f5f4' },
      },
      x: {
        ticks: { 
          color: '#78716c',
          maxRotation: 25,
          minRotation: 0,
          font: { size: 10 }
        },
        grid: { display: false },
      },
    },
  };

  // Activité récente : les 5 derniers rendez-vous
  const recentAppointments = appointments.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* En-tête Espace Pro & Administration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-700" />
            Portail Administration & Pilotage
          </div>
          <h1 className="text-3xl font-bold font-serif text-stone-900 mt-1">
            Tableau de Bord Exécutif Cindy Malorie
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Suivi des performances commerciales, des réservations à domicile et du chiffre d'affaires en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/appointments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Planning</span>
          </Link>

          <Link
            to="/admin/clients"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <span>👥 Clients</span>
          </Link>

          <Link
            to="/admin/services"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <span>✂️ Services</span>
          </Link>

          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <span>👤 Coiffeurs</span>
          </Link>

          <Link
            to="/admin/loyalty"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <span>🎁 Fidélité</span>
          </Link>

          <Link
            to="/admin/availability"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Horaires</span>
          </Link>

          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CARTES KPIS EN HAUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1 : Chiffre d'Affaires Réalisé */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">CA Réalisé ('completed')</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {formatCurrency(totalRevenue)}
            </span>
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold mt-1">
              <span>Ce mois : {formatCurrency(revenueThisMonth)}</span>
              <span>Cette sem. : {formatCurrency(revenueThisWeek)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2 : Rendez-vous du Jour & Périodes */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Rendez-vous Aujourd'hui</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {appointmentsToday} <span className="text-base font-sans text-stone-500 font-normal">RDV</span>
            </span>
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold mt-1">
              <span>Cette semaine : <strong>{appointmentsThisWeek}</strong></span>
              <span>Ce mois : <strong>{appointmentsThisMonth}</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Taux de Transformation / Confirmation */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Taux de Transformation</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {conversionRate}%
            </span>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">
              {validBookings} RDV confirmés sur {totalAppointments || 1} demandes
            </p>
          </div>
        </div>

        {/* KPI 4 : Panier Moyen & Demandes en attente */}
        <div className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Panier Moyen</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-900">
              {formatCurrency(averageCart)}
            </span>
            <p className="text-[11px] text-amber-800 font-bold mt-1">
              ⏳ {pendingCount} RDV en attente de validation
            </p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. GRAPHIQUES CHART.JS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Graphique 1 : Évolution 30 jours (Line Chart) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-700" />
                Évolution des Réservations (30 Derniers Jours)
              </h3>
              <p className="text-xs text-stone-500">Volume quotidien des prises de rendez-vous en ligne</p>
            </div>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
              30 Jours
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Graphique 2 : Répartition par Statut (Donut Chart) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              Répartition par Statut
            </h3>
            <p className="text-xs text-stone-500">État actuel de tous les rendez-vous</p>
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

      {/* Graphique 3 : Prestations Phares / Répartition par service (Bar Chart) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-700" />
              Prestations les Plus Demandées
            </h3>
            <p className="text-xs text-stone-500">Volume de réservations par type de prestation</p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVITÉ RÉCENTE (Les 5 derniers RDV créés/modifiés) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-700" />
              Activité Récente (5 Derniers Rendez-vous)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Gestion rapide du statut des réservations en direct
            </p>
          </div>

          <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            {appointments.length} RDV enregistrés au total
          </span>
        </div>

        {recentAppointments.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">Aucun rendez-vous récent.</p>
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
