import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';

const { mockAppointments, mockInvoke, mockUser, mockProfile } = vi.hoisted(() => {
  return {
    mockInvoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    mockUser: { id: 'test-user-id', email: 'test@test.com' },
    mockProfile: {
      id: 'test-user-id',
      full_name: 'Giulia Rossi',
      loyalty_points: 120,
      phone: '+393512697743',
      address: '12 rue de Paris',
      preferences: {
        favorite_cut: 'Coupe Carré',
        favorite_color: 'Balayage Miel',
        hair_type: 'Ondulés',
      },
    },
    mockAppointments: [
      {
        id: '1',
        client_id: 'test-user-id',
        service_id: 'srv-1',
        appointment_date: '2026-09-01',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location_type: 'home',
        location_address: '12 rue de Paris',
        status: 'confirmed',
        confirmation_sent: true,
        reminder_sent: false,
        services: {
          id: 'srv-1',
          name: 'Coupe',
          price: 45,
          duration_minutes: 60,
        },
        staff: {
          id: 'stf-1',
          full_name: 'Cindy Malorie',
        },
      },
      {
        id: '2',
        client_id: 'test-user-id',
        service_id: 'srv-2',
        appointment_date: '2026-08-20',
        start_time: '14:00:00',
        end_time: '16:00:00',
        location_type: 'salon',
        status: 'completed',
        services: {
          id: 'srv-2',
          name: 'Coloration',
          price: 95,
        },
        staff: {
          id: 'stf-1',
          full_name: 'Cindy Malorie',
        },
      },
    ],
  };
});

// Mock du hook useAuth avec références stables
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    refreshProfile: vi.fn(),
  }),
}));

// Mock de Supabase
vi.mock('../lib/supabase', () => {
  const mockFrom = vi.fn((table: string) => {
    if (table === 'appointments') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockAppointments,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    }
    if (table === 'rewards') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'rew-1', name: 'Soin Kératine', points_required: 100, is_active: true },
              ],
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === 'loyalty_transactions') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
  });

  return {
    supabaseBrowser: {
      from: mockFrom,
      auth: { getSession: vi.fn() },
    },
    supabase: {
      from: mockFrom,
      auth: { getSession: vi.fn() },
      functions: {
        invoke: mockInvoke,
      },
    },
  };
});

describe('Dashboard Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les prochains rendez-vous', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vos Prochains Rendez-vous/i)).toBeInTheDocument();
      expect(screen.getByText(/Coupe/i)).toBeInTheDocument();
    });
  });

  it('affiche le lieu du rendez-vous à domicile', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/12 rue de Paris/i)).toBeInTheDocument();
    });
  });

  it('permet d\'annuler un rendez-vous avec motif', async () => {
    // Mock de window.prompt
    vi.spyOn(window, 'prompt').mockReturnValue('Imprévu professionnel');

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const cancelButton = await screen.findByRole('button', { name: /^Annuler$/i });
    await userEvent.click(cancelButton);

    expect(window.prompt).toHaveBeenCalledWith("Motif de l'annulation (optionnel) :");
    expect(mockInvoke).toHaveBeenCalledWith('cancel-appointment', {
      body: { appointment_id: '1', reason: 'Imprévu professionnel' },
    });
  });
});
