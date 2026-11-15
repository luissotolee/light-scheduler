import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  encodeWinAnsi,
  escapePdfText,
  pdfNumber,
  pdfColor,
  drawTextAt,
  assemblePdf,
} from '@/shared/utils/pdf'

afterEach(() => {
  vi.useRealTimers()
})

describe('encodeWinAnsi', () => {
  it('replaces non-WinAnsi characters with codes', () => {
    expect(encodeWinAnsi('€')).toBe(String.fromCharCode(0x80))
    expect(encodeWinAnsi('Š')).toBe(String.fromCharCode(0x8a))
  })

  it('replaces non-Breakable Space with space', () => {
    expect(encodeWinAnsi('\xa0')).toBe(' ')
  })
})

describe('escapePdfText', () => {
  it('escapes backslash and parentheses', () => {
    expect(escapePdfText('test')).toBe('test')
    expect(escapePdfText('test(2)')).toBe('test\\(2\\)')
  })
})

describe('pdfNumber', () => {
  it('formats with two decimal places', () => {
    expect(pdfNumber(1.5)).toBe('1.50')
    expect(pdfNumber(3)).toBe('3.00')
  })
})

describe('pdfColor', () => {
  it('converts color to rg/RG string', () => {
    expect(pdfColor([0.1, 0.2, 0.3], 'rg')).toBe('0.10 0.20 0.30 rg')
    expect(pdfColor([0.9, 0.8, 0.7], 'RG')).toBe('0.90 0.80 0.70 RG')
  })
})

describe('drawTextAt', () => {
  it('generates PDF text draw commands', () => {
    const result = drawTextAt(100, 200, 'Test', 12, false, 'center')
    expect(result).toEqual([
      'BT',
      '/F1 12.00 Tf',
      '0 0 0 rg',
      '1 0 0 1 87.52 195.80 Tm',
      '(Test) Tj',
      'ET',
    ])
  })
})

describe('assemblePdf', () => {
  it('builds a valid PDF structure with pages', () => {
    const pages = [['Page 1'], ['Page 2']]
    const bytes = assemblePdf(pages, 595.28, 841.89)

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.byteLength).toBeGreaterThan(0)
    // Convert to string to check PDF header
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('%PDF-1.4')
    expect(text).toContain('/Type /Catalog')
    expect(text).toContain('/Type /Page')
    expect(text).toContain('/Kids [')
    expect(text).toContain('/Resources << /Font <<')
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
  })

  it('generates correct PDF object references', () => {
    const pages = [['Page 1']]
    const bytes = assemblePdf(pages, 595.28, 841.89)
    const text = new TextDecoder().decode(bytes)

    // Check that object references are properly generated
    expect(text).toMatch(/1 0 obj/)
    expect(text).toMatch(/2 0 obj/)
    expect(text).toMatch(/3 0 obj/)
    expect(text).toMatch(/xref/)
    expect(text).toMatch(/startxref/)
  })
})
