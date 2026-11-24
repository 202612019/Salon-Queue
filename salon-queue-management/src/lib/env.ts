// Public placeholders only. Configuration does not activate authentication or queue writes.
export const publicEnvironment = Object.freeze({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '',
  phase: 'frontend-foundation' as const,
  backendOperationsEnabled: false as const,
})
