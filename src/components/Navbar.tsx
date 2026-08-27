import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Calendar, User as UserIcon, Shield, LogOut, Award, Sparkles, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, isStaff, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Prestations', path: '/services' },
    { name: 'Galerie', path: '/gallery' },
    { name: 'À propos', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          
          {/* 1. Logo & Identité visuelle */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-stone-900 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform duration-200">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6 rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold font-serif text-stone-900 tracking-tight flex items-center gap-1">
                Cindy Malorie
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-amber-800 font-semibold truncate">
                Coiffure Privée
              </span>
            </div>
          </Link>

          {/* 2. Navigation Desktop (Liens publics) */}
          <nav className="hidden xl:flex items-center space-x-6 shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-all py-1 ${
                  isActive(link.path)
                    ? 'text-amber-800 font-bold border-b-2 border-amber-600'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* 3. Section Utilisateur & Actions Desktop */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 shrink-0">
            
            {/* Espace Admin / Pro */}
            {isStaff && (
              <Link
                to="/admin"
                className={`text-xs font-bold transition-all flex items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  isActive('/admin')
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'text-purple-900 bg-purple-50 hover:bg-purple-100 border-purple-200'
                }`}
                title="Accéder au portail d'administration"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>{isAdmin ? 'Admin' : 'Espace Pro'}</span>
              </Link>
            )}

            {/* Espace Client (Mes RDV + Points) */}
            {user && (
              <Link
                to="/dashboard"
                className={`text-xs font-bold transition-all flex items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  isActive('/dashboard')
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'text-stone-800 bg-stone-50 hover:bg-stone-100 border-stone-200'
                }`}
                title="Consulter mes réservations"
              >
                <UserIcon className="w-3.5 h-3.5 text-stone-600" />
                <span>Mes RDV</span>
                {profile?.loyalty_points !== undefined && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 ml-0.5">
                    <Award className="w-3 h-3 mr-0.5 text-amber-600" />
                    {profile.loyalty_points}
                  </span>
                )}
              </Link>
            )}

            {/* Bouton Réserver Principal */}
            <Link
              to="/booking"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 border border-stone-900"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Réserver</span>
            </Link>

            {/* Profil & Déconnexion */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="text-right max-w-[120px]">
                  <p className="text-xs font-bold text-stone-900 truncate" title={profile?.full_name || user.email}>
                    {profile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-amber-700 font-semibold capitalize truncate">
                    {profile?.role || 'Client'}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-stone-500 hover:text-rose-700 hover:bg-rose-50 border border-stone-200 transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-stone-800 hover:text-stone-950 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* 4. Boutons d'action pour Mobile & Tablette (lg:hidden) */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/booking"
              className="px-3 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Réserver</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-stone-200 text-stone-800 hover:bg-stone-100 transition-colors"
              aria-label="Ouvrir le menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* 5. Menu Déroulant Mobile & Tablette */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b-2 border-stone-200 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          
          {/* Liens de navigation */}
          <div className="grid grid-cols-2 gap-1.5 pb-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  isActive(link.path)
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Cartes d'accès rapide utilisateur */}
          {user && (
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-stone-800 bg-stone-50 border border-stone-200 hover:bg-stone-100"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-stone-600" />
                  <span>Mes Rendez-vous</span>
                </div>
                {profile?.loyalty_points !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Award className="w-3 h-3 mr-1 text-amber-600" />
                    {profile.loyalty_points} pts
                  </span>
                )}
              </Link>

              {isStaff && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 hover:bg-purple-100"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-700" />
                    <span>{isAdmin ? 'Portail Administration' : 'Espace Pro'}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-purple-700 font-bold">Admin</span>
                </Link>
              )}
            </div>
          )}

          {/* Connexion / Déconnexion */}
          <div className="pt-3 border-t border-stone-100">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="truncate">
                  <p className="text-xs font-bold text-stone-900 truncate">{profile?.full_name || user.email}</p>
                  <p className="text-[10px] text-stone-500 font-medium capitalize">{profile?.role || 'Client'}</p>
                </div>
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 flex items-center gap-1.5 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl border-2 border-stone-900 bg-stone-900 text-white font-bold text-xs shadow-sm hover:bg-stone-800"
              >
                Se connecter / S'inscrire
              </Link>
            )}
          </div>

        </div>
      )}
    </header>
  );
};
