import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, normalizeBytes } from '../text-normalization.mjs';
const dash = String.fromCodePoint(0x2014);

test('normalizes representations, labels and parenthetical prose deterministically', () => {
  const forms = [dash, '&' + 'mdash;', '&#' + '8212;', '&#x' + '2014;', '\\u' + '2014', '\\' + '2014 '];
  for (const form of forms) assert.equal(normalizeText(`Title ${form} Subtitle`), 'Title: Subtitle');
  assert.equal(normalizeText(`"${dash}"`), '"N/A"');
  assert.equal(normalizeText(`Read ${dash} at your pace ${dash} today.`), 'Read, at your pace, today.');
  const source = `Title ${dash} Subtitle\nRead ${dash} at your pace ${dash} today.`;
  assert.equal(normalizeText(normalizeText(source)), normalizeText(source));
});

test('preserves meaningful operators, en dashes and binary downloads', () => {
  const source = 'i--; --count; a - b; "--"; "=>"; "–";';
  assert.equal(normalizeText(source), source);
  const zip = Buffer.from([0, 255, 226, 128, 148]);
  assert.deepEqual(normalizeBytes(zip, 'reference.zip'), zip);
});
