const WIN_ANSI_SPECIAL: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f,
}

export function encodeWinAnsi(text: string): string {
  let encoded = ''
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 63
    if (codePoint === 0xa0) {
      encoded += ' '
    } else if (codePoint > 0x1f && codePoint < 0x100) {
      encoded += String.fromCharCode(codePoint)
    } else {
      encoded += String.fromCharCode(WIN_ANSI_SPECIAL[char] ?? 63)
    }
  }
  return encoded
}

export function escapePdfText(text: string): string {
  return text.replace(/[\\()]/g, (match) => `\\${match}`)
}

export function charWidth(char: string): number {
  if (char === ' ') return 0.28
  if ('iljtfr'.includes(char)) return 0.3
  if ('mwMW'.includes(char)) return 0.85
  if (char >= 'A' && char <= 'Z') return 0.68
  if (char >= '0' && char <= '9') return 0.56
  return 0.55
}

export function textWidth(text: string, size: number, bold = false): number {
  let units = 0
  for (const char of text) units += charWidth(char)
  return units * size * (bold ? 1.06 : 1)
}

export function fitText(text: string, maxWidth: number, size: number, bold = false): string {
  if (textWidth(text, size, bold) <= maxWidth) return text

  let result = ''
  for (const char of text) {
    if (textWidth(`${result}${char}…`, size, bold) > maxWidth) break
    result += char
  }
  return result ? `${result}…` : ''
}

export function pdfNumber(value: number): string {
  return value.toFixed(2)
}

export function pdfColor(values: readonly number[], operator: 'rg' | 'RG'): string {
  return `${values.map((value) => pdfNumber(value)).join(' ')} ${operator}`
}

export function drawTextAt(
  x: number,
  centerY: number,
  text: string,
  size: number,
  bold: boolean,
  align: 'left' | 'center',
): string[] {
  const font = bold ? 'F2' : 'F1'
  const baseline = centerY - size * 0.35
  const startX = align === 'center' ? x - textWidth(text, size, bold) / 2 : x
  return [
    'BT',
    `/${font} ${pdfNumber(size)} Tf`,
    '0 0 0 rg',
    `1 0 0 1 ${pdfNumber(startX)} ${pdfNumber(baseline)} Tm`,
    `(${escapePdfText(encodeWinAnsi(text))}) Tj`,
    'ET',
  ]
}

export function assemblePdf(pages: readonly string[][], width: number, height: number): Uint8Array<ArrayBuffer> {
  const objects: string[] = []
  const pageObjectStart = 5
  const kids = pages.map((_, index) => `${pageObjectStart + index * 2} 0 R`).join(' ')

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')

  pages.forEach((ops, index) => {
    const pageObjectId = pageObjectStart + index * 2
    const contentObjectId = pageObjectId + 1
    const content = ops.join('\n')
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(width)} ${pdfNumber(height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    )
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  })

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []

  objects.forEach((body, index) => {
    const id = index + 1
    offsets[id] = pdf.length
    pdf += `${id} 0 obj\n${body}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let id = 1; id <= objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  const bytes = new Uint8Array(new ArrayBuffer(pdf.length))
  for (let index = 0; index < pdf.length; index += 1) {
    bytes[index] = pdf.charCodeAt(index) & 0xff
  }
  return bytes
}

