export * from './database';

import type { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Staff = Database['public']['Tables']['staff']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];
export type Reward = Database['public']['Tables']['rewards']['Row'];
export type AvailabilitySetting = Database['public']['Tables']['availability_settings']['Row'];
export type BlockedDate = Database['public']['Tables']['blocked_dates']['Row'];

export interface AppointmentWithDetails extends Appointment {
  services?: Service;
  staff?: Staff | null;
  profiles?: Profile;
}
