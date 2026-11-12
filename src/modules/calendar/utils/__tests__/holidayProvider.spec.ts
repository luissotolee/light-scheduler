import { describe, expect, it, vi } from 'vitest'
import {
  createHolidayProvider,
  type HolidayConstructor,
} from '@/modules/calendar/utils/holidayProvider'
import { countryLabel } from '@/modules/calendar/utils/countries'

class FakeHolidays {
  getCountries(): Record<string, string> {
    return { US: 'United States', ES: 'Spain' }
  }

  getStates(country: string): Record<string, string> {
    if (country !== 'ES') return {}
    return { CT: 'Cataluña', AN: 'Andalucía' }
  }

  getHolidays(year: number): Array<{ date: string; name: string; type: string }> {
    return [
      { date: `${year}-01-01 00:00:00`, name: 'New Year', type: 'public' },
      { date: `${year}-01-06`, name: 'Epiphany', type: 'public' },
      { date: `${year}-01-06`, name: 'Epiphany', type: 'public' },
      { date: `${year}-03-01`, name: 'Bank day', type: 'bank' },
      { date: `${year + 1}-01-01`, name: 'Next year', type: 'public' },
      { date: `${year}-12-25`, name: '   ', type: 'public' },
      { date: 'not-a-date', name: 'Bad date', type: 'public' },
    ]
  }
}

function fakeProvider() {
  const load = vi.fn(async () => FakeHolidays as unknown as HolidayConstructor)
  return { provider: createHolidayProvider(load), load }
}

describe('holidayProvider', () => {
  it('lists countries sorted by code', async () => {
    const { provider } = fakeProvider()

    await expect(provider.countryCodes('en')).resolves.toEqual(['ES', 'US'])
  })

  it('lists sorted regions for a country', async () => {
    const { provider } = fakeProvider()

    await expect(provider.regions('ES', 'en')).resolves.toEqual([
      { code: 'AN', name: 'Andalucía' },
      { code: 'CT', name: 'Cataluña' },
    ])
    await expect(provider.regions('', 'en')).resolves.toEqual([])
    await expect(provider.regions('US', 'en')).resolves.toEqual([])
  })

  it('keeps only public holidays for the requested year, deduped and sorted', async () => {
    const { provider } = fakeProvider()

    await expect(
      provider.holidays({ country: 'ES', region: 'AN', year: 2026, locale: 'en' }),
    ).resolves.toEqual([
      { date: '2026-01-01', name: 'New Year' },
      { date: '2026-01-06', name: 'Epiphany' },
    ])
  })

  it('retries after a failed module load', async () => {
    const load = vi
      .fn<() => Promise<HolidayConstructor>>()
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValue(FakeHolidays as unknown as HolidayConstructor)
    const provider = createHolidayProvider(load)

    await expect(provider.countryCodes('en')).rejects.toThrow('failed')
    await expect(provider.countryCodes('en')).resolves.toEqual(['ES', 'US'])
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('loads the constructor once and reuses it', async () => {
    const { provider, load } = fakeProvider()

    await provider.countryCodes('en')
    await provider.regions('ES', 'en')
    await provider.holidays({ country: 'ES', region: null, year: 2026, locale: 'en' })

    expect(load).toHaveBeenCalledTimes(1)
  })
})

describe('countryLabel', () => {
  it('localizes known country codes and falls back to the code', () => {
    expect(countryLabel('ES', 'en')).toBe('Spain')
    expect(countryLabel('ES', 'es')).toBe('España')
    expect(countryLabel('not-a-code', 'en')).toBe('not-a-code')
  })
})
