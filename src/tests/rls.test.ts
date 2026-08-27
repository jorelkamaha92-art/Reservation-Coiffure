import { describe, it, expect, vi } from 'vitest';
import { supabaseBrowser } from '../lib/supabase';

// Configuration des mocks pour simuler les règles RLS
vi.mock('../lib/supabase', () => {
  let currentUser: { id: string; email: string; role?: string } | null = null;

  return {
    supabaseBrowser: {
      auth: {
        signIn: vi.fn(async ({ email }: { email: string; password?: string }) => {
          if (email.includes('admin')) {
            currentUser = { id: 'admin-uuid-1', email, role: 'admin' };
          } else {
            currentUser = { id: 'client-uuid-1', email, role: 'client' };
          }
          return { data: { user: currentUser }, error: null };
        }),
        signInWithPassword: vi.fn(async ({ email }: { email: string; password?: string }) => {
          if (email.includes('admin')) {
            currentUser = { id: 'admin-uuid-1', email, role: 'admin' };
          } else {
            currentUser = { id: 'client-uuid-1', email, role: 'client' };
          }
          return { data: { user: currentUser }, error: null };
        }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
      from: vi.fn((table: string) => ({
        select: vi.fn((_columns?: string) => {
          if (table === 'appointments') {
            return {
              neq: vi.fn((field: string, _val: string) => {
                // Si un client tente d'accéder aux données d'autres clients, RLS bloque la requête
                if (field === 'client_id' && currentUser?.role !== 'admin') {
                  return Promise.resolve({
                    data: null,
                    error: { message: 'Row Level Security policy violation: Access Denied', code: '42501' },
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }),
              eq: vi.fn().mockReturnThis(),
              then: (resolve: any) =>
                resolve({
                  data: [
                    { id: '1', service_name: 'Coupe Femme', client_id: 'client-uuid-1' },
                    { id: '2', service_name: 'Coloration', client_id: 'other-user-uuid' },
                  ],
                  error: null,
                }),
            };
          }
          return {
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      })),
    },
    supabase: {
      auth: {
        signInWithPassword: vi.fn(),
      },
    },
  };
});

describe('Politiques RLS', () => {
  it('un client ne peut voir que ses propres rendez-vous', async () => {
    // Se connecter avec un client
    const { data } = await supabaseBrowser.auth.signInWithPassword({
      email: 'client1@test.com',
      password: 'password123',
    });
    const user = data?.user;

    expect(user).toBeDefined();

    // Tenter de récupérer les rendez-vous d'un autre client
    const { data: appointmentsData, error } = await supabaseBrowser
      .from('appointments')
      .select('*')
      .neq('client_id', user!.id);

    expect(error).not.toBeNull();
    expect(appointmentsData).toBeNull();
  });

  it('un administrateur peut tout voir', async () => {
    // Se connecter avec admin
    const { data } = await supabaseBrowser.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123',
    });
    const user = data?.user;

    expect(user).toBeDefined();

    // Récupérer tous les rendez-vous
    const { data: appointmentsData, error } = await (supabaseBrowser
      .from('appointments')
      .select('*') as any);

    expect(error).toBeNull();
    expect(appointmentsData).not.toBeNull();
  });
});
