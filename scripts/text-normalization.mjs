// Keep input provenance separate from the normalized, published bytes.
export const NORMALIZATION = 'editorial-punctuation-v1';
const dash = String.fromCodePoint(0x2014);
const hex = (0x2014).toString(16);
const representations = new RegExp(`${dash}|&${'mdash'};|&#0*${8212};|&#x0*${hex};|\\\\u${hex}|\\\\u\\{${hex}\\}|\\\\(?:00${hex}|${hex})(?:[ \\t]|(?=[^0-9a-f]|$))`, 'gi');

export function normalizeText(text) {
  return text.replace(representations, dash).split('\n').map(line => {
    if (!line.includes(dash)) return line;
    // A standalone missing-value label is not sentence punctuation.
    line = line.replace(new RegExp(`(["'\x60>])${dash}(?=["'\x60<])`, 'g'), '$1N/A');
    // Rule/diagram strokes use ASCII; never rewrite existing JS -- operators.
    line = line.replace(new RegExp(`${dash}{2,}`, 'g'), match => '-'.repeat(match.length));
    // Paired parenthetical clauses read naturally with commas.
    line = line.replace(new RegExp(`[ \\t]*${dash}[ \\t]*([^${dash}<>"\x60;.!?]+?)[ \\t]*${dash}[ \\t]*`, 'g'), ', $1, ');
    return line.replace(new RegExp(`[ \\t]*${dash}[ \\t]*`, 'g'), ': ').trimEnd();
  }).join('\n');
}

export function normalizeBytes(bytes, filename) {
  return /\.(?:html?|txt|md|js|jsx|mjs|css|json|svg|xml|ya?ml)$/i.test(filename)
    ? Buffer.from(normalizeText(bytes.toString('utf8')))
    : bytes;
}
