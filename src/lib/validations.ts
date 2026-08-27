import { z } from 'zod';

// Validation du profil utilisateur
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Le nom complet doit comporter au moins 2 caractères'),
  email: z.string().email('Format d’email invalide'),
  phone: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, 'Numéro de téléphone français invalide').optional().or(z.literal('')),
  address: z.string().min(5, 'L’adresse de domicile doit être complète (rue, code postal, ville)').optional().or(z.literal('')),
  preferences: z.object({
    favorite_cut: z.string().optional(),
    favorite_color: z.string().optional(),
    hair_type: z.string().optional(),
  }).optional(),
});

// Validation d'une réservation de rendez-vous
export const appointmentBookingSchema = z.object({
  service_id: z.string().uuid('Identifiant de service invalide'),
  staff_id: z.string().uuid('Identifiant de coiffeur invalide').optional().nullable(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}(?::\d{2})?$/, 'Format d’heure invalide (HH:MM)'),
  location_type: z.enum(['home', 'salon']),
  location_address: z.string().optional().nullable(),
  notes: z.string().max(500, 'Les notes ne doivent pas dépasser 500 caractères').optional().nullable(),
}).refine(
  (data) => {
    if (data.location_type === 'home') {
      return !!data.location_address && data.location_address.trim().length >= 5;
    }
    return true;
  },
  {
    message: "L'adresse complète du domicile est obligatoire pour les rendez-vous à domicile",
    path: ['location_address'],
  }
);

// Validation de connexion / inscription
export const authLoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
});

export const authRegisterSchema = z.object({
  full_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  phone: z.string().min(10, 'Numéro de téléphone requis'),
  address: z.string().min(5, 'Adresse complète de domicile requise'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type AppointmentBookingInput = z.infer<typeof appointmentBookingSchema>;
export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
