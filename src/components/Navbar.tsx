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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-stone-900 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform duration-200">
              <Scissors className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="text-xl font-bold font-serif text-stone-900 tracking-tight flex items-center gap-1.5">
                Cindy Malorie
                <Sparkles className="w-4 h-4 text-amber-500" />
              </span>
              <span className="text-xs uppercase tracking-widest text-amber-800 block font-semibold">
                Coiffure Privée à Domicile
              </span>
            </div>
          </Link>

          {/* Navigation Links Desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors ${
                  isActive(link.path)
                    ? 'text-stone-950 font-bold border-b-2 border-amber-600 pb-0.5'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user && (
              <Link
                to="/dashboard"
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard')
                    ? 'text-stone-950 font-bold border-b-2 border-amber-600 pb-0.5'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <UserIcon className="w-4 h-4 text-stone-700" />
                Mes RDV
                {profile?.loyalty_points !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Award className="w-3 h-3 mr-1 text-amber-600" />
                    {profile.loyalty_points}
                  </span>
                )}
              </Link>
            )}

            {isStaff && (
              <Link
                to="/admin"
                className="text-xs font-bold text-purple-900 hover:text-purple-950 transition-colors flex items-center gap-1.5 bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-300"
              >
                <Shield className="w-3.5 h-3.5 text-purple-700" />
                {isAdmin ? 'Admin' : 'Espace Pro'}
              </Link>
            )}
          </nav>

          {/* Actions & Bouton Réserver */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/booking"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 border border-stone-900 transition-all hover:scale-105"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              Réserver
            </Link>

            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-stone-200">
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-900 line-clamp-1">{profile?.full_name || user.email}</p>
                  <p className="text-[10px] text-stone-500 font-semibold capitalize">{profile?.role || 'Client'}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-stone-600 hover:text-rose-700 hover:bg-rose-50 border border-stone-200 transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-stone-800 hover:text-stone-950 px-3.5 py-2 rounded-xl border-2 border-stone-200 hover:bg-stone-50 transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/booking"
              className="px-3.5 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Réserver
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border-2 border-stone-200 text-stone-700 hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b-2 border-stone-200 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                isActive(link.path)
                  ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Mes Rendez-vous ({profile?.loyalty_points || 0} pts)
            </Link>
          )}

          {isStaff && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-purple-900 bg-purple-50"
            >
              {isAdmin ? 'Administration' : 'Espace Pro'}
            </Link>
          )}

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            {user ? (
              <button
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50"
              >
                Se déconnecter
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border-2 border-stone-300 text-stone-800 font-bold text-xs"
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
