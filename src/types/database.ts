export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type AppointmentLocationType = 'home' | 'salon';
export type LoyaltyTransactionType = 'earned' | 'redeemed';
export type UserRole = 'client' | 'staff' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          address: string | null;
          avatar_url: string | null;
          loyalty_points: number;
          role: UserRole;
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          loyalty_points?: number;
          role?: UserRole;
          preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          loyalty_points?: number;
          role?: UserRole;
          preferences?: Record<string, any>;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          category: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price: number;
          category: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          category?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          specialty: string | null;
          bio: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          specialty?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          specialty?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          staff_id: string | null;
          service_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus;
          location_type: AppointmentLocationType;
          location_address: string | null;
          notes: string | null;
          confirmation_sent: boolean;
          reminder_sent: boolean;
          reminder_scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          staff_id?: string | null;
          service_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus;
          location_type?: AppointmentLocationType;
          location_address?: string | null;
          notes?: string | null;
          confirmation_sent?: boolean;
          reminder_sent?: boolean;
          reminder_scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          staff_id?: string | null;
          service_id?: string;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus;
          location_type?: AppointmentLocationType;
          location_address?: string | null;
          notes?: string | null;
          confirmation_sent?: boolean;
          reminder_sent?: boolean;
          reminder_scheduled_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      loyalty_transactions: {
        Row: {
          id: string;
          client_id: string;
          points: number;
          transaction_type: LoyaltyTransactionType;
          appointment_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          points: number;
          transaction_type: LoyaltyTransactionType;
          appointment_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          points?: number;
          description?: string | null;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          points_required: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          points_required: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          points_required?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      availability_settings: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
        };
        Update: {
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      blocked_dates: {
        Row: {
          id: string;
          date: string;
          reason: string | null;
          is_full_day: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          reason?: string | null;
          is_full_day?: boolean;
          created_at?: string;
        };
        Update: {
          reason?: string | null;
          is_full_day?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      appointment_location_type: AppointmentLocationType;
      loyalty_transaction_type: LoyaltyTransactionType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
