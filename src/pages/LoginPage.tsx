import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Scissors, AlertCircle, Check } from 'lucide-react';
import { authLoginSchema, authRegisterSchema } from '../lib/validations';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

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
          setSuccessMsg('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
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
          setErrorMsg(
            error.message === 'Invalid login credentials'
              ? 'Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte.'
              : error.message
          );
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
            {isRegister ? 'Créer un compte' : 'Espace Client & Gestion'}
          </h1>
          <p className="text-xs text-stone-600 font-medium">
            {isRegister
              ? 'Renseignez vos coordonnées pour gérer et suivre vos réservations'
              : 'Connectez-vous pour accéder à vos rendez-vous et vos privilèges'}
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
                <label className="block font-bold text-stone-800 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Céline Robert"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Téléphone *</label>
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
                <label className="block font-bold text-stone-800 mb-1">Adresse (pour prestation à domicile)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Via Francana 10, Pavia"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-stone-800 mb-1">Adresse Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none text-sm text-stone-900 bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">Mot de passe *</label>
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

      </div>
    </div>
  );
};
