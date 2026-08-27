import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

/**
 * Middleware Guard React Router : Protège les routes privées et admin
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireStaff = false,
}) => {
  const { user, isAdmin, isStaff, isLoading } = useAuth();
  const location = useLocation();

  // Applique les protections de sécurité de base côté client
  useEffect(() => {
    // Empêche le clickjacking en mode iframe
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.self.location.href;
      }
    } catch {
      // Ignorer si cross-origin iframe bloque l'accès
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-900 border-t-transparent" />
          <p className="text-sm text-stone-600 font-semibold">Vérification de la session sécurisée...</p>
        </div>
      </div>
    );
  }

  // 1. Utilisateur non authentifié tentant d'accéder à une route privée
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Utilisateur non admin tentant d'accéder à une route admin (/admin/*)
  if (requireAdmin && !isAdmin) {
    return (
      <Navigate
        to="/dashboard"
        state={{ error: 'Accès refusé : cette section nécessite le rôle administrateur.' }}
        replace
      />
    );
  }

  // 3. Utilisateur non staff/admin tentant d'accéder à une route staff
  if (requireStaff && !isStaff) {
    return (
      <Navigate
        to="/dashboard"
        state={{ error: 'Accès réservé aux membres de l’équipe.' }}
        replace
      />
    );
  }

  return <>{children}</>;
};

/**
 * Middleware Guard React Router : Redirige les utilisateurs déjà connectés vers /dashboard
 * (Pour les routes /login et /register)
 */
export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (user) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
