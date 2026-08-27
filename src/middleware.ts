import { supabaseServer } from './lib/supabase';

export interface RouteConfig {
  publicRoutes: string[];
  authRoutes: string[];
  privateRoutes: string[];
  adminRoutes: string[];
}

export const ROUTE_CONFIG: RouteConfig = {
  publicRoutes: [
    '/',
    '/services',
    '/gallery',
    '/about',
    '/contact',
    '/booking',
    '/reservation',
  ],
  authRoutes: [
    '/login',
    '/register',
  ],
  privateRoutes: [
    '/dashboard',
    '/profile',
    '/history',
  ],
  adminRoutes: [
    '/admin',
  ],
};

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

export const matchRoute = (pathname: string, patterns: string[]): boolean => {
  return patterns.some((pattern) => {
    if (pattern === '/') return pathname === '/';
    return pathname === pattern || pathname.startsWith(`${pattern}/`);
  });
};

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
      role: (profile as any)?.role || 'client',
    };
  } catch (err) {
    console.error('Erreur Middleware getAuthenticatedUserWithRole :', err);
    return { user: null, profile: null, role: null };
  }
};

export async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const responseHeaders = new Headers(SECURITY_HEADERS);

  const { user, role } = await getAuthenticatedUserWithRole();

  const isAuthRoute = matchRoute(pathname, ROUTE_CONFIG.authRoutes);
  const isPrivateRoute = matchRoute(pathname, ROUTE_CONFIG.privateRoutes);
  const isAdminRoute = matchRoute(pathname, ROUTE_CONFIG.adminRoutes);

  if (user && isAuthRoute) {
    const redirectUrl = new URL('/dashboard', request.url);
    return Response.redirect(redirectUrl, 302);
  }

  if (!user && (isPrivateRoute || isAdminRoute)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return Response.redirect(redirectUrl, 302);
  }

  if (isAdminRoute) {
    if (role !== 'admin') {
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('error', 'access_denied_admin_only');
      return Response.redirect(redirectUrl, 302);
    }
  }

  return new Response(null, {
    status: 200,
    headers: responseHeaders,
  });
}

export default middleware;
