import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { Database } from '../types/database';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

// Récupération sécurisée des clés publiques uniquement (AUCUNE clé service_role)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Configuration Supabase manquante : vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env.'
  );
}

/**
 * Client Supabase pour le navigateur (Client-side)
 * Utilise les cookies gérés par @supabase/ssr pour sécuriser les tokens de session contre les attaques XSS
 */
export const supabaseBrowser: SupabaseClient<Database> = createBrowserClient<Database>(
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

// Alias pour compatibilité ascendante avec l'ensemble du projet
export const supabase = supabaseBrowser;

/**
 * Créateur de Client Supabase pour l'environnement Serveur / Middleware
 * Permet d'injecter des adaptateurs de cookies spécifiques (ex: Vercel Edge / Node Server)
 */
export interface ServerCookieAdapter {
  getAll: () => Array<{ name: string; value: string }> | Promise<Array<{ name: string; value: string }>>;
  setAll?: (cookiesToSet: Array<{ name: string; value: string; options: any }>) => void;
}

export const createServerSupabaseClient = (cookieAdapter?: ServerCookieAdapter): SupabaseClient<Database> => {
  return createServerClient<Database>(
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
 * Fonction utilitaire pour récupérer la session actuelle de manière sécurisée
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabaseBrowser.auth.getSession();
    if (error) {
      console.error('Erreur lors de la récupération de la session Supabase :', error.message);
      return null;
    }
    return session;
  } catch (err) {
    console.error('Exception getSession :', err);
    return null;
  }
};

// Re-exports des primitives @supabase/ssr
export { createBrowserClient, createServerClient };
export default supabaseBrowser;
