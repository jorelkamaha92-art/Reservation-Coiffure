import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Scissors, AlertCircle, Check, Shield, User, KeyRound } from 'lucide-react';
import { authLoginSchema, authRegisterSchema } from '../lib/validations';

export const LoginPage: React.FC = () => {
  const { loginAsDemo } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('cindytchamabekamaha@gmail.com');
  const [password, setPassword] = useState<string>('Admin1234!');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleQuickDemoLogin = (role: 'admin' | 'staff' | 'client') => {
    loginAsDemo(role);
    setSuccessMsg(`Connexion réussie en tant que ${role === 'admin' ? 'Administrateur' : role === 'staff' ? 'Membre Staff' : 'Client'} !`);
    setTimeout(() => {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Validation Zod pour inscription
        const parseResult = authRegisterSchema.safeParse({
          full_name: fullName,
          email,
          password,
          phone,
          address,
        });

        if (!parseResult.success) {
          setErrorMsg(parseResult.error.errors[0]?.message || 'Informations invalides');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
              address,
              role: 'client',
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Compte créé avec succès ! Redirection vers votre espace client...');
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1000);
        }
      } else {
        // Validation Zod pour connexion
        const parseResult = authLoginSchema.safeParse({ email, password });
        if (!parseResult.success) {
          setErrorMsg(parseResult.error.errors[0]?.message || 'Identifiants invalides');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' 
            ? 'Email ou mot de passe incorrect. Vous pouvez créer un compte ou utiliser le bouton Test 1-Clic ci-dessous.' 
            : error.message);
        } else {
          try {
            localStorage.removeItem('demo_user_role');
          } catch {}
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Scissors className="w-6 h-6 rotate-45" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            {isRegister ? 'Créer un compte client' : 'Espace Membre & Administration'}
          </h1>
          <p className="text-xs text-stone-600 font-medium">
            {isRegister
              ? 'Renseignez vos coordonnées pour faciliter vos rendez-vous'
              : 'Connectez-vous pour accéder au tableau de bord ou à vos rendez-vous'}
          </p>
        </div>

        {/* Onglets Connexion / Inscription */}
        <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isRegister ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isRegister ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Nouveau client
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Chiara Bellini"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Téléphone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 351 269 7743"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Adresse complète</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Via Roma 12, Pavia"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-stone-800 mb-1">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cindytchamabekamaha@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 border border-stone-900"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegister ? (
              'Créer mon compte'
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* ========================================================================= */}
        {/* ENCART IDENTIFIANTS DE TEST & CONNEXION RAPIDE 1-CLIC */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t-2 border-stone-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              Accès Rapide Test & Démo
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded-full border border-amber-300">
              1-Clic
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="p-3 rounded-xl border-2 border-stone-900 bg-stone-900 text-white hover:bg-stone-800 transition-all text-left flex flex-col justify-between shadow-sm group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-amber-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
                <span className="text-[10px] bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-bold">
                  Cindy
                </span>
              </div>
              <span className="text-[10px] text-stone-300 mt-1 truncate">
                cindytchamabekamaha@gmail.com
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('client')}
              className="p-3 rounded-xl border-2 border-stone-200 bg-stone-50 hover:bg-stone-100 transition-all text-left flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  Client
                </span>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-bold">
                  Chiara
                </span>
              </div>
              <span className="text-[10px] text-stone-500 mt-1 truncate">
                chiara.bellini@yahoo.it
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
