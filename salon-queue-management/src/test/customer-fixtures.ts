// Fictional, non-live unit-test records. No hosted credentials or capabilities.
import type { CustomerEntry, PublicSalon } from '../domain/database'
export const salonFixture: PublicSalon = {
  server_time: '2026-11-24T10:00:00+05:30', salon_name: 'Fictional Connected Salon', timezone: 'Asia/Kolkata', opening_time: '10:00:00', closing_time: '21:00:00', online_enabled: true,
  admission: { online: true, walk_in: true, reason: 'OPEN' }, waiting_count: 2, estimate: { state: 'approximate', minutes: 20, position: 3, position_kind: 'global' },
  services: [
    { id: '10000000-0000-4000-8000-000000000001', name_en: 'Fictional haircut', name_gu: 'કાલ્પનિક હેરકટ', price_paise: 15000, duration_minutes: 30, version: 1, enabled: true },
    { id: '10000000-0000-4000-8000-000000000002', name_en: 'Fictional beard', name_gu: 'કાલ્પનિક દાઢી', price_paise: 8000, duration_minutes: 15, version: 1, enabled: true },
    { id: '10000000-0000-4000-8000-000000000003', name_en: 'Fictional spa', name_gu: 'કાલ્પનિક સ્પા', price_paise: 40000, duration_minutes: 45, version: 1, enabled: true },
  ],
  barbers: ['Ravi', 'Amit', 'Imran'].map((name, index) => ({ id: `20000000-0000-4000-8000-00000000000${index + 1}`, slug: name.toLowerCase(), display_name: name, on_duty: true, on_break: false, token: null, status: null, called_at: null, estimate: { state: 'approximate', minutes: 35, position: 2, position_kind: 'barber' } })), next_tokens: [],
}
export const entryFixture: CustomerEntry = {
  token: 'S-9001', customer_name: 'Fictional Test', status: 'waiting', source: 'remote', version: 1, created_at: '2026-11-24T10:00:00+05:30', called_at: null, started_at: null, terminal_at: null,
  total_paise: 15000, total_minutes: 30, estimate: { state: 'approximate', minutes: 20, position: 2, position_kind: 'global' }, preferred_barber: null, assigned_barber: null,
  services: [{ id: salonFixture.services[0].id, name_en: 'Fictional haircut', name_gu: 'કાલ્પનિક હેરકટ', price_paise: 15000, duration_minutes: 30 }],
}
