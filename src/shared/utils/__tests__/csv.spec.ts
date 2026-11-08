import { describe, expect, it } from 'vitest'
import { inferDelimiter, parseCsv, toCsv } from '@/shared/utils/csv'

describe('inferDelimiter', () => {
  it('prefers a comma', () => {
    expect(inferDelimiter('name,email')).toBe(',')
  })

  it('falls back to a semicolon or tab', () => {
    expect(inferDelimiter('name;email')).toBe(';')
    expect(inferDelimiter('name\temail')).toBe('\t')
  })

  it('defaults to a comma when no delimiter is present', () => {
    expect(inferDelimiter('name')).toBe(',')
  })
})

describe('parseCsv', () => {
  it('parses headers and rows', () => {
    expect(parseCsv('name,email\r\nAda,ada@example.com\nBo,bo@example.com')).toEqual({
      ok: true,
      headers: ['name', 'email'],
      rows: [
        ['Ada', 'ada@example.com'],
        ['Bo', 'bo@example.com'],
      ],
    })
  })

  it('strips a UTF-8 BOM', () => {
    const result = parseCsv('\uFEFFname,email\nAda,ada@example.com')

    expect(result).toEqual({
      ok: true,
      headers: ['name', 'email'],
      rows: [['Ada', 'ada@example.com']],
    })
  })

  it('preserves quoted commas and newlines', () => {
    const result = parseCsv('name,note\nAda,"morning, then night"\nBo,"line one\nline two"')

    expect(result).toEqual({
      ok: true,
      headers: ['name', 'note'],
      rows: [
        ['Ada', 'morning, then night'],
        ['Bo', 'line one\nline two'],
      ],
    })
  })

  it('unescapes doubled quotes', () => {
    expect(parseCsv('name\n"Ada ""A"""')).toEqual({
      ok: true,
      headers: ['name'],
      rows: [['Ada "A"']],
    })
  })

  it('infers a semicolon delimiter', () => {
    expect(parseCsv('name;email\nAda;ada@example.com')).toEqual({
      ok: true,
      headers: ['name', 'email'],
      rows: [['Ada', 'ada@example.com']],
    })
  })

  it('preserves an empty trailing field', () => {
    expect(parseCsv('name,email\nAda,')).toEqual({
      ok: true,
      headers: ['name', 'email'],
      rows: [['Ada', '']],
    })
  })

  it('parses single-column files', () => {
    expect(parseCsv('name\nAda\nBo')).toEqual({
      ok: true,
      headers: ['name'],
      rows: [['Ada'], ['Bo']],
    })
  })

  it('skips blank lines', () => {
    expect(parseCsv('name\n\nAda\n\n')).toEqual({
      ok: true,
      headers: ['name'],
      rows: [['Ada']],
    })
  })

  it('returns an error for empty input', () => {
    expect(parseCsv('')).toEqual({ ok: false, error: 'CSV file is empty' })
    expect(parseCsv('   \n')).toEqual({ ok: false, error: 'CSV file is empty' })
  })

  it('returns an error for an unterminated quoted field', () => {
    expect(parseCsv('name\n"Ada')).toEqual({ ok: false, error: 'Unterminated quoted field' })
  })
})

describe('toCsv', () => {
  it('quotes cells only when needed', () => {
    expect(toCsv(['name', 'note'], [['Ada', 'plain'], ['Bo', 'a,b'], ['Cy', 'say "hi"'], ['Di', 'x\ny']])).toBe(
      'name,note\r\nAda,plain\r\nBo,"a,b"\r\nCy,"say ""hi"""\r\nDi,"x\ny"',
    )
  })

  it('round-trips with parseCsv', () => {
    const text = toCsv(
      ['member', 'weekday', 'start', 'end'],
      [['Ada', 'monday', '09:00', '17:00']],
    )

    expect(parseCsv(text)).toEqual({
      ok: true,
      headers: ['member', 'weekday', 'start', 'end'],
      rows: [['Ada', 'monday', '09:00', '17:00']],
    })
  })
})
