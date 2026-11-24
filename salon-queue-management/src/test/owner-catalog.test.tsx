import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { en } from '../i18n/dictionaries'
import { ServiceModal } from '../features/admin/ServiceModal'

async function form(price = '12.34', duration = '1', name = 'Haircut') {
  const save = vi.fn(), user = userEvent.setup()
  const view = render(<LocaleProvider><ServiceModal service={null} busy={false} onSave={save} onClose={() => {}} /></LocaleProvider>)
  await user.type(screen.getByLabelText(en.englishName), name)
  await user.type(screen.getByLabelText(en.gujaratiName), 'હેરકટ')
  await user.clear(screen.getByLabelText(en.price))
  await user.type(screen.getByLabelText(en.price), price)
  await user.clear(screen.getByLabelText(en.duration))
  await user.type(screen.getByLabelText(en.duration), duration)
  return { save, user, view, submit: () => user.click(screen.getByRole('button', { name: en.saveService })) }
}

describe('Owner catalog matches the approved server bounds', () => {
  it.each([['0', '1', 0, 1], ['100000', '480', 10000000, 480], ['12.34', '17', 1234, 17]])('accepts ₹%s and %s minutes exactly', async (price, duration, paise, minutes) => {
    const f = await form(price, duration)
    await f.submit()
    expect(f.save).toHaveBeenCalledWith(expect.objectContaining({ price_paise: paise, duration_minutes: minutes }))
  })
  it.each([['12.345', '1'], ['100000.01', '1'], ['1', '481'], ['1', '0'], ['1', '1.5']])('rejects price %s / duration %s without silently rounding', async (price, duration) => {
    const f = await form(price, duration)
    await f.submit()
    expect(f.save).not.toHaveBeenCalled()
    expect(screen.getByText(price === '12.345' || price === '100000.01' ? en.invalidServicePrice : en.invalidServiceDuration)).toBeVisible()
  })
  it('rejects a one-character service name', async () => {
    const f = await form('0', '1', 'X')
    await f.submit()
    expect(f.save).not.toHaveBeenCalled()
    expect(screen.getByText(en.invalidServiceName)).toBeVisible()
  })
  it('blocks an open form when connectivity is lost', () => {
    render(<LocaleProvider><ServiceModal service={null} busy={false} disabled onSave={vi.fn()} onClose={() => {}} /></LocaleProvider>)
    expect(screen.getByRole('button', { name: en.saveService })).toBeDisabled()
  })
})
