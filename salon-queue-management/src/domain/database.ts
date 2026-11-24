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
export type StaffProfile = { user_id: string; role: 'owner' | 'receptionist' | 'barber'; barber_id: string | null; barber_slug?: string | null }
export type ServiceSelection = { id: string; version: number; price_paise: number; duration_minutes: number }
export type AdmissionRequest = {
  request_key: string; capability: string; name: string; phone: string
  services: ServiceSelection[]; preferred_barber_id: string | null; source: 'remote' | 'walk_in'
}
export type AdmissionReceipt = { locator: string; token: string }
export type Estimate = { state: 'ready' | 'approximate' | 'uncertain' | 'unavailable'; minutes: number | null; position: number; position_kind: 'global' | 'barber' }
export type QueueState = 'waiting' | 'called' | 'in_chair' | 'done' | 'cancelled' | 'no_show'
export type CatalogService = ServiceSelection & { name_en: string; name_gu: string; enabled: boolean }
export type PublicBarber = { id: string; slug: string; display_name: string; on_duty: boolean; on_break: boolean; token: string | null; status: QueueState | null; called_at: string | null; estimate?: Estimate }
export type PublicSalon = {
  server_time: string; salon_name: string; timezone: string; opening_time: string; closing_time: string; online_enabled: boolean
  admission: { online: boolean; walk_in: boolean; reason: string }; waiting_count: number; estimate: Estimate
  services: CatalogService[]; barbers: PublicBarber[]; next_tokens: { token: string; estimate: Estimate }[]
}
export type CustomerEntry = {
  token: string; customer_name: string; status: QueueState; source: 'remote' | 'walk_in'; version: number
  created_at: string; called_at: string | null; started_at: string | null; terminal_at: string | null
  total_paise: number; total_minutes: number; estimate: Estimate | null
  preferred_barber: { id: string; name: string; on_duty: boolean; on_break: boolean } | null
  assigned_barber: { id: string; name: string } | null
  services: { id: string; name_en: string; name_gu: string; price_paise: number; duration_minutes: number }[]
}
export type StaffBarber = { id: string; slug: string; display_name: string; on_duty: boolean; on_break: boolean; version: number }
export type StaffEntry = CustomerEntry & { entry_id: string }
export type ReceptionSnapshot = { server_time: string; barbers: StaffBarber[]; entries: StaffEntry[] }
export type BarberSnapshot = { server_time: string; barber: StaffBarber; current: StaffEntry | null; next: Pick<CustomerEntry, 'token' | 'customer_name' | 'services'> | null }
