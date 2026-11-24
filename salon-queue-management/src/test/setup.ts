import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear()
  if (typeof document !== 'undefined') document.documentElement.lang = 'en'
  if (typeof window !== 'undefined') vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => { cleanup() })
