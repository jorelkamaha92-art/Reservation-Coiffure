import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Reservation from '../pages/Reservation';

// Mock du hook useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
    profile: { address: 'Via Roma 10, Milano' },
    session: { access_token: 'mock-token' },
  }),
}));

// Mock des services Supabase
vi.mock('../lib/supabase', () => {
  const mockFrom = vi.fn((table: string) => {
    if (table === 'services') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: '11111111-1111-1111-1111-111111111111',
                  name: 'Coupe & Brushing Haute Tenue',
                  description: 'Diagnostic personnalisé',
                  duration_minutes: 45,
                  price: 45,
                  category: 'Femme',
                  is_active: true,
                },
                {
                  id: '22222222-2222-2222-2222-222222222222',
                  name: 'Coloration & Balayage Signature',
                  description: 'Éclaircissement fondu',
                  duration_minutes: 120,
                  price: 95,
                  category: 'Technique',
                  is_active: true,
                },
              ],
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === 'staff') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: '55555555-5555-5555-5555-555555555555',
                full_name: 'Cindy Malorie',
                specialty: 'Experte Coiffure',
                is_active: true,
              },
            ],
            error: null,
          }),
        }),
      };
    }
    if (table === 'availability_settings') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { day_of_week: 0, is_active: true, start_time: '09:00', end_time: '19:00' },
              { day_of_week: 1, is_active: true, start_time: '09:00', end_time: '19:00' },
              { day_of_week: 2, is_active: true, start_time: '09:00', end_time: '19:00' },
              { day_of_week: 3, is_active: true, start_time: '09:00', end_time: '19:00' },
              { day_of_week: 4, is_active: true, start_time: '09:00', end_time: '19:00' },
              { day_of_week: 5, is_active: true, start_time: '09:00', end_time: '19:00' },
              { day_of_week: 6, is_active: true, start_time: '09:00', end_time: '19:00' },
            ],
            error: null,
          }),
        }),
      };
    }
    if (table === 'blocked_dates') {
      return {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
    }
    if (table === 'appointments') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
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
        invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
      },
    },
  };
});

describe('Reservation Page', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <Reservation />
      </BrowserRouter>
    );
  });

  it('affiche les services disponibles', async () => {
    await waitFor(() => {
      expect(screen.getByText(/Coupe/i)).toBeInTheDocument();
      expect(screen.getByText(/Coloration/i)).toBeInTheDocument();
    });
  });

  it('permet de sélectionner un service et affiche sa durée', async () => {
    const serviceCard = await screen.findByText(/Coupe & Brushing/i);
    await userEvent.click(serviceCard);
    expect(screen.getByText(/45 minutes/i)).toBeInTheDocument();
  });

  it('affiche le workflow étape par étape jusqu’au choix du lieu', async () => {
    // 1. Sélectionner service et passer à l'étape suivante
    const serviceCard = await screen.findByText(/Coupe & Brushing/i);
    await userEvent.click(serviceCard);

    const nextStep1Button = screen.getByRole('button', { name: /Étape suivante : Coiffeur/i });
    await userEvent.click(nextStep1Button);

    // 2. Étape coiffeur : valider et passer à la date
    await waitFor(() => {
      expect(screen.getByText(/Choisissez votre styliste/i)).toBeInTheDocument();
    });
    const nextStep2Button = screen.getByRole('button', { name: /Étape suivante : Date & Heure/i });
    await userEvent.click(nextStep2Button);

    // 3. Étape Date & Heure : passer au lieu
    await waitFor(() => {
      expect(screen.getByText(/Choisissez la date et le créneau/i)).toBeInTheDocument();
    });
    const nextStep3Button = screen.getByRole('button', { name: /Étape suivante : Lieu/i });
    await userEvent.click(nextStep3Button);

    // 4. Vérifier que les options de lieu apparaissent
    await waitFor(() => {
      expect(screen.getByText(/À mon domicile/i)).toBeInTheDocument();
      expect(screen.getByText(/Chez Cindy/i)).toBeInTheDocument();
    });
  });

  it('affiche les détails et le récapitulatif avant confirmation finale', async () => {
    // Étape 1
    const serviceCard = await screen.findByText(/Coupe & Brushing/i);
    await userEvent.click(serviceCard);
    await userEvent.click(screen.getByRole('button', { name: /Étape suivante : Coiffeur/i }));

    // Étape 2
    await waitFor(() => expect(screen.getByText(/Choisissez votre styliste/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Étape suivante : Date & Heure/i }));

    // Étape 3
    await waitFor(() => expect(screen.getByText(/Choisissez la date et le créneau/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Étape suivante : Lieu/i }));

    // Étape 4 (Remplir l'adresse puis avancer)
    await waitFor(() => expect(screen.getByText(/Choisissez le lieu de la prestation/i)).toBeInTheDocument());
    const addressInput = screen.getByPlaceholderText(/Ex: Via Roma 15/i);
    await userEvent.clear(addressInput);
    await userEvent.type(addressInput, 'Via Montenapoleone 8, Milano');

    await userEvent.click(screen.getByRole('button', { name: /Étape suivante : Récapitulatif/i }));

    // Étape 5 (Récapitulatif & Validation)
    await waitFor(() => {
      expect(screen.getByText(/5. Récapitulatif et Validation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirmer mon rendez-vous/i })).toBeInTheDocument();
    });
  });
});
