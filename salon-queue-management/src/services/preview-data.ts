import type { PreviewBarber, PreviewEntry, Service } from '../domain/types'

// Fictional, immutable design fixtures. Never used as auth, a live queue, or backend state.
export const services: readonly Service[] = [
  { id: 'haircut', name: 'haircut', description: 'haircutDescription', minutes: 30, paise: 15000 },
  { id: 'beard', name: 'beard', description: 'beardDescription', minutes: 15, paise: 8000 },
  { id: 'spa', name: 'spa', description: 'spaDescription', minutes: 45, paise: 40000 },
]
export const barbers: readonly PreviewBarber[] = [
  { name: 'Ravi', initials: 'RV', specialty: 'haircutSpecialist', state: 'inChair', token: 'S-012', customer: 'Kunal', remaining: 12 },
  { name: 'Amit', initials: 'AM', specialty: 'beardSpecialist', state: 'called', token: 'S-013', customer: 'Neel' },
  { name: 'Imran', initials: 'IM', specialty: 'stylingSpecialist', state: 'onBreak' },
]
export const waitingEntries: readonly PreviewEntry[] = [
  { token: 'S-014', name: 'Arjun', services: ['haircut', 'beard'], preference: null, waited: 68 },
  { token: 'S-015', name: 'Dhruv', services: ['haircut'], preference: 'Ravi', waited: 54 },
  { token: 'S-016', name: 'Mihir', services: ['beard'], preference: null, waited: 42 },
  { token: 'S-017', name: 'Jay', services: ['spa'], preference: 'Amit', waited: 31 },
  { token: 'S-018', name: 'Harsh', services: ['haircut'], preference: null, waited: 24 },
  { token: 'S-019', name: 'Dev', services: ['beard'], preference: 'Ravi', waited: 16 },
]
