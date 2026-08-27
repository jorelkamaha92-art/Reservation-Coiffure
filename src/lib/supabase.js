import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Récupération sécurisée des clés publiques (AUCUNE clé service_role)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Configuration Supabase manquante : vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env.'
  );
}

/**
 * Client Supabase pour le navigateur (Client-side)
 * Utilise les cookies HTTP pour protéger les tokens contre les failles XSS
 */
export const supabaseBrowser = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    cookieOptions: {
      name: 'sb-auth-token',
      path: '/',
      sameSite: 'lax',
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    },
  }
);

// Alias pour compatibilité ascendante
export const supabase = supabaseBrowser;

/**
 * Créateur de Client Supabase pour le serveur / middleware
 * @param {Object} [cookieAdapter] Adaptateur optionnel pour les cookies côté serveur
 */
export const createServerSupabaseClient = (cookieAdapter) => {
  return createServerClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          if (cookieAdapter?.getAll) return cookieAdapter.getAll();
          if (typeof document === 'undefined') return [];
          return document.cookie.split('; ').filter(Boolean).map((cookie) => {
            const [name, ...rest] = cookie.split('=');
            return { name, value: rest.join('=') };
          });
        },
        setAll(cookiesToSet) {
          if (cookieAdapter?.setAll) {
            cookieAdapter.setAll(cookiesToSet);
            return;
          }
          if (typeof document === 'undefined') return;
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieStr = `${name}=${value}; path=${options.path || '/'}; SameSite=${options.sameSite || 'Lax'}`;
            if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
            if (options.secure) cookieStr += '; Secure';
            document.cookie = cookieStr;
          });
        },
      },
    }
  );
};

export const supabaseServer = createServerSupabaseClient();

/**
 * Fonction utilitaire pour récupérer la session courante
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabaseBrowser.auth.getSession();
    if (error) {
      console.error('Erreur getSession :', error.message);
      return null;
    }
    return session;
  } catch (err) {
    console.error('Exception getSession :', err);
    return null;
  }
};

// Re-exports
export { createBrowserClient, createServerClient };
export default supabaseBrowser;
