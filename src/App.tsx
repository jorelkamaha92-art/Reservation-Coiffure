import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { GalleryPage } from './pages/GalleryPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BookingPage } from './pages/BookingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { AdminAppointmentsPage } from './pages/AdminAppointmentsPage';
import { AdminAvailabilityPage } from './pages/AdminAvailabilityPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AdminServicesPage } from './pages/AdminServicesPage';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { AdminLoyaltyPage } from './pages/AdminLoyaltyPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute, GuestRoute } from './middleware/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* 1. Routes Publiques Complètes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/reservation" element={<BookingPage />} />

              {/* 2. Routes d'authentification (réservées aux non-connectés) */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />

              {/* 3. Routes Privées Client */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/loyalty"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* 4. Routes Administrateur & Pro */}
              <Route
                path="/admin/clients"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/services"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminStaffPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/loyalty"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLoyaltyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/availability"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminAvailabilityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/appointments"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* 5. Fallback 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
