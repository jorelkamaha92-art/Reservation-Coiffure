import { describe, it, expect } from 'vitest';
import {
  profileSchema,
  appointmentBookingSchema,
  authLoginSchema,
  authRegisterSchema,
} from '../lib/validations';

describe('Validation Schemas (Zod)', () => {
  describe('Login & Registration Schemas', () => {
    it('valide un email et un mot de passe valides pour la connexion', () => {
      const result = authLoginSchema.safeParse({
        email: 'cindytchamabekamaha@gmail.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejette un format d\'email invalide', () => {
      const result = authLoginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Email invalide');
      }
    });

    it('valide une inscription complète avec nom, email et téléphone', () => {
      const result = authRegisterSchema.safeParse({
        email: 'client@example.com',
        password: 'SuperPassword456!',
        full_name: 'Giulia Rossi',
        phone: '+393512697743',
        address: 'Via Roma 10, Milano',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Appointment Booking Schema', () => {
    it('valide une réservation à domicile avec adresse complète', () => {
      const validBooking = {
        service_id: '123e4567-e89b-12d3-a456-426614174000',
        staff_id: '123e4567-e89b-12d3-a456-426614174001',
        appointment_date: '2026-09-01',
        start_time: '10:00:00',
        location_type: 'home' as const,
        location_address: 'Via della Spiga 15, 20121 Milano',
        notes: 'Interphone 4B - 2ème étage',
      };

      const result = appointmentBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it('valide une réservation en salon / studio privé sans adresse obligatoire', () => {
      const studioBooking = {
        service_id: '123e4567-e89b-12d3-a456-426614174000',
        staff_id: '123e4567-e89b-12d3-a456-426614174001',
        appointment_date: '2026-09-02',
        start_time: '14:30',
        location_type: 'salon' as const,
      };

      const result = appointmentBookingSchema.safeParse(studioBooking);
      expect(result.success).toBe(true);
    });

    it('rejette une réservation à domicile sans adresse de localisation', () => {
      const missingAddressBooking = {
        service_id: '123e4567-e89b-12d3-a456-426614174000',
        appointment_date: '2026-09-01',
        start_time: '10:00',
        location_type: 'home' as const,
        location_address: '',
      };

      const result = appointmentBookingSchema.safeParse(missingAddressBooking);
      expect(result.success).toBe(false);
    });
  });

  describe('Profile Preferences Schema', () => {
    it('valide les préférences capillaires JSONB du profil client', () => {
      const profileData = {
        full_name: 'Chiara Bianchi',
        email: 'chiara@example.com',
        address: 'Corso Buenos Aires, Milano',
        preferences: {
          hair_type: 'Bouclés / Épais',
          favorite_cut: 'Dégradé léger & Brushing wavy',
          favorite_color: 'Balayage Caramel & Miel',
        },
      };

      const result = profileSchema.safeParse(profileData);
      expect(result.success).toBe(true);
    });
  });
});
