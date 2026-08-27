import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nettoyage automatique du DOM après chaque test
afterEach(() => {
  cleanup();
});

// Mock de l'environnement Supabase pour les tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  })),
}));

// Mock de Resend
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  })),
}));
