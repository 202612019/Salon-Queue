import type { TranslationKey } from '../i18n/dictionaries'

export type BarberState = 'inChair' | 'called' | 'onBreak'
export type Service = { id: string; name: TranslationKey; description: TranslationKey; minutes: number; paise: number }
export type PreviewBarber = { name: string; initials: string; specialty: TranslationKey; state: BarberState; token?: string; customer?: string; remaining?: number }
export type PreviewEntry = { token: string; name: string; services: TranslationKey[]; preference: string | null; waited: number }
