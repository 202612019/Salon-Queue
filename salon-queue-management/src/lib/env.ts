// Only public browser configuration; private permissions remain server-authoritative.
export const publicEnvironment = Object.freeze({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '',
  phase: 'staff-integration' as const,
  backendOperationsEnabled: true as const,
})
