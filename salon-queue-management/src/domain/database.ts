// RPC-only browser contract. Private tables are deliberately absent from the Data API.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Database = {
  public: {
    Tables: {
      salonq_changes: {
        Row: { id: boolean; version: number; changed_at: string }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      salonq_staff_profile: { Args: Record<string, never>; Returns: Json }
      salonq_staff_command: { Args: { action: string; payload?: Json }; Returns: Json }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
export type StaffProfile = { user_id: string; role: 'owner' | 'receptionist' | 'barber'; barber_id: string | null }
export type ServiceSelection = { id: string; version: number; price_paise: number; duration_minutes: number }
export type AdmissionRequest = {
  request_key: string; capability: string; name: string; phone: string
  services: ServiceSelection[]; preferred_barber_id: string | null; source: 'remote' | 'walk_in'
}
export type AdmissionReceipt = { locator: string; token: string }
export type Estimate = { state: 'ready' | 'approximate' | 'uncertain' | 'unavailable'; minutes: number | null; position: number; position_kind: 'global' | 'barber' }
