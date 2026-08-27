import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { MOCK_CLIENTS } from '../lib/mockData';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (role: 'admin' | 'staff' | 'client') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Profils démo pour tests et démonstration
  const getDemoProfile = (role: 'admin' | 'staff' | 'client'): { user: User; profile: Profile } => {
    if (role === 'admin') {
      const p: Profile = {
        id: 'admin-cindy',
        full_name: 'Cindy Malorie (Admin)',
        email: 'cindytchamabekamaha@gmail.com',
        phone: '+39 351 269 7743',
        address: 'Via Francana 10, Pavia (Italie)',
        avatar_url: '/images/hairstyles/stitch-braid-cross.png',
        loyalty_points: 500,
        role: 'admin',
        preferences: { admin_notes: 'Administratrice principale & Styliste gérante' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      return {
        user: { id: p.id, email: p.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: p.created_at } as User,
        profile: p,
      };
    } else if (role === 'staff') {
      const p: Profile = {
        id: 'staff-cindy',
        full_name: 'Cindy Malorie (Staff)',
        email: 'staff@cindymalorie.com',
        phone: '+39 351 269 7743',
        address: 'Via Francana 10, Pavia (Italie)',
        avatar_url: '/images/hairstyles/stitch-braid-cross.png',
        loyalty_points: 0,
        role: 'staff',
        preferences: {},
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      return {
        user: { id: p.id, email: p.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: p.created_at } as User,
        profile: p,
      };
    } else {
      const p = MOCK_CLIENTS[1]; // Chiara Bellini (285 points)
      return {
        user: { id: p.id, email: p.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: p.created_at } as User,
        profile: p,
      };
    }
  };

  const loginAsDemo = (role: 'admin' | 'staff' | 'client') => {
    const { user: demoUser, profile: demoProf } = getDemoProfile(role);
    setUser(demoUser);
    setProfile(demoProf);
    try {
      localStorage.setItem('demo_user_role', role);
    } catch (e) {
      console.warn('LocalStorage inaccessible :', e);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du profil :', error);
        // Si utilisateur admin par email
        if (user?.email === 'cindytchamabekamaha@gmail.com') {
          setProfile(getDemoProfile('admin').profile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      if (user?.email === 'cindytchamabekamaha@gmail.com') {
        setProfile(getDemoProfile('admin').profile);
      }
    }
  };

  useEffect(() => {
    // Vérifier si un rôle démo est actif
    const storedDemoRole = localStorage.getItem('demo_user_role') as 'admin' | 'staff' | 'client' | null;
    if (storedDemoRole) {
      const { user: demoUser, profile: demoProf } = getDemoProfile(storedDemoRole);
      setUser(demoUser);
      setProfile(demoProf);
      setIsLoading(false);
      return;
    }

    // Initialisation session Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Écoute des changements d'état Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem('demo_user_role');
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = profile?.role === 'admin' || user?.email === 'cindytchamabekamaha@gmail.com';
  const isStaff = profile?.role === 'staff' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isStaff,
        isLoading,
        signOut,
        refreshProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return context;
};
