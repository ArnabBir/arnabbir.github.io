// Deterministic teaching experiments, not production Bloom or Gorilla implementations.
export function bloomPositions(key, size, hashes) {
  if (!Number.isInteger(size) || size < 1 || !Number.isInteger(hashes) || hashes < 1 || hashes > 16) throw new RangeError('Invalid Bloom dimensions');
  return Array.from({ length: hashes }, (_, i) => {
    let h = (2166136261 ^ Math.imul(i + 1, 0x9e3779b9)) >>> 0;
    for (const char of String(key)) h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    return (h >>> 0) % size;
  });
}
export function bloomExperiment({ size = 128, hashes = 3, hitRate = 0.1, probeCost = 0.2 } = {}) {
  if (!Number.isFinite(hitRate) || hitRate < 0 || hitRate > 1 || !Number.isFinite(probeCost) || probeCost < 0) throw new RangeError('Invalid cost assumptions');
  const inserted = Array.from({ length: 24 }, (_, i) => `present:${i}`);
  const absent = Array.from({ length: 512 }, (_, i) => `absent:${i}`);
  const bits = Array(size).fill(0);
  inserted.forEach(key => bloomPositions(key, size, hashes).forEach(i => { bits[i] = 1; }));
  const contains = key => bloomPositions(key, size, hashes).every(i => bits[i]);
  const falsePositives = absent.filter(contains);
  const rate = falsePositives.length / absent.length;
  return { bits, inserted, absentCount: absent.length, falsePositives, falseNegatives: inserted.filter(key => !contains(key)), rate,
    approximateRate: (1 - Math.exp(-hashes * inserted.length / size)) ** hashes,
    exactLookups: hitRate + (1 - hitRate) * rate,
    cost: probeCost + hitRate + (1 - hitRate) * rate };
}

export function gorillaResidualCost(value) {
  if (!Number.isSafeInteger(value) || value < -2147483648 || value > 2147483647) throw new RangeError('Residual must fit a signed 32-bit integer');
  if (value === 0) return { prefix: '0', payload: 0, bits: 1 };
  if (value >= -63 && value <= 64) return { prefix: '10', payload: 7, bits: 9 };
  if (value >= -255 && value <= 256) return { prefix: '110', payload: 9, bits: 12 };
  if (value >= -2047 && value <= 2048) return { prefix: '1110', payload: 12, bits: 16 };
  return { prefix: '1111', payload: 32, bits: 36 };
}
export function gorillaExperiment(timestamps) {
  if (timestamps.length < 2 || timestamps.some((t, i) => !Number.isSafeInteger(t) || (i > 0 && t <= timestamps[i - 1]))) throw new RangeError('Use at least two increasing integer timestamps');
  const first = timestamps[0], initialDelta = timestamps[1] - first;
  let previousDelta = initialDelta;
  const rows = timestamps.slice(2).map((time, i) => {
    const delta = time - timestamps[i + 1], residual = delta - previousDelta;
    previousDelta = delta;
    return { time, delta, residual, ...gorillaResidualCost(residual) };
  });
  let time = first + initialDelta, delta = initialDelta;
  const reconstructed = [first, time];
  for (const row of rows) { delta += row.residual; time += delta; reconstructed.push(time); }
  return { rows, reconstructed, residualBits: rows.reduce((sum, row) => sum + row.bits, 0), rawResidualBits: rows.length * 64 };
}
export const timestampPresets = {
  regular: [100, 110, 120, 130, 140, 150, 160, 170],
  gap: [100, 110, 120, 140, 150, 160, 170, 180],
  jitter: [100, 110, 121, 130, 142, 149, 163, 170],
};
