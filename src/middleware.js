import { supabaseServer } from './lib/supabase.js';

/**
 * Configuration des catégories de routes
 */
export const ROUTE_CONFIG = {
  // Routes accessibles à tout le monde
  publicRoutes: [
    '/',
    '/services',
    '/gallery',
    '/about',
    '/contact',
    '/booking',
    '/reservation',
  ],
  // Routes réservées aux utilisateurs non-authentifiés
  authRoutes: [
    '/login',
    '/register',
  ],
  // Routes nécessitant une authentification client
  privateRoutes: [
    '/dashboard',
    '/profile',
    '/history',
  ],
  // Routes réservées aux administrateurs
  adminRoutes: [
    '/admin',
  ],
};

/**
 * En-têtes de sécurité de base conformes aux règles OWASP & Vercel
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Vérifie si un chemin donné correspond à un motif de route
 * @param {string} pathname Chemin URL actuel (ex: '/dashboard/stats' ou '/admin/users')
 * @param {string[]} patterns Liste de motifs (ex: ['/dashboard', '/admin'])
 * @returns {boolean}
 */
export const matchRoute = (pathname, patterns) => {
  return patterns.some((pattern) => {
    if (pattern === '/') return pathname === '/';
    return pathname === pattern || pathname.startsWith(`${pattern}/`);
  });
};

/**
 * Récupère l'utilisateur et son profil rôle depuis Supabase Server (via cookies HTTP-only)
 * @returns {Promise<{ user: any, profile: any, role: string | null }>}
 */
export const getAuthenticatedUserWithRole = async () => {
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser();
    if (error || !user) {
      return { user: null, profile: null, role: null };
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single();

    return {
      user,
      profile,
      role: profile?.role || 'client',
    };
  } catch (err) {
    console.error('Erreur Middleware getAuthenticatedUserWithRole :', err);
    return { user: null, profile: null, role: null };
  }
};

/**
 * Middleware Server / Edge (Compatible Vercel & Node / Express)
 * @param {Request} request Requête HTTP entrante
 * @returns {Promise<Response>}
 */
export async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Création des headers de réponse avec les en-têtes de sécurité
  const responseHeaders = new Headers(SECURITY_HEADERS);

  // 1. Vérification de la session et du rôle via le cookie HTTP-only
  const { user, role } = await getAuthenticatedUserWithRole();

  const isAuthRoute = matchRoute(pathname, ROUTE_CONFIG.authRoutes);
  const isPrivateRoute = matchRoute(pathname, ROUTE_CONFIG.privateRoutes);
  const isAdminRoute = matchRoute(pathname, ROUTE_CONFIG.adminRoutes);

  // 2. Redirection des utilisateurs déjà connectés accédant à /login ou /register
  if (user && isAuthRoute) {
    const redirectUrl = new URL('/dashboard', request.url);
    return Response.redirect(redirectUrl, 302);
  }

  // 3. Redirection des non-authentifiés tentant d'accéder aux routes privées ou admin
  if (!user && (isPrivateRoute || isAdminRoute)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return Response.redirect(redirectUrl, 302);
  }

  // 4. Protection stricte des routes admin (/admin/*)
  if (isAdminRoute) {
    if (role !== 'admin') {
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('error', 'access_denied_admin_only');
      return Response.redirect(redirectUrl, 302);
    }
  }

  // 5. Autoriser la requête avec les en-têtes de sécurité injectés
  return new Response(null, {
    status: 200,
    headers: responseHeaders,
  });
}

export default middleware;
