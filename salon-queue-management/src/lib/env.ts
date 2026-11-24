// Only public browser configuration. Staff screens remain previews in Phase 3.
export const publicEnvironment = Object.freeze({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '',
  phase: 'customer-integration' as const,
  backendOperationsEnabled: true as const,
})
