import React, { useState } from 'react';
import { bloomExperiment, gorillaExperiment, timestampPresets } from './paperExperiments';

const control = 'border rounded p-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100';
export default function PaperExperiment({ id }) {
  const [size, setSize] = useState(128), [hashes, setHashes] = useState(3);
  const [hitRate, setHitRate] = useState(10), [preset, setPreset] = useState('regular');
  const reset = () => { setSize(128); setHashes(3); setHitRate(10); setPreset('regular'); };
  const bloom = id === 'bloom-paradox';
  const result = bloom ? bloomExperiment({ size, hashes, hitRate: hitRate / 100 }) : gorillaExperiment(timestampPresets[preset]);
  return <section aria-label="Deterministic experiment" className="border rounded-xl p-5 mb-6 space-y-4">
    <div className="flex justify-between gap-4 flex-wrap"><h2 className="text-xl font-semibold">{bloom ? 'Computed experiment: filter break-even' : 'Computed experiment: timestamp residuals'}</h2><button className={control} onClick={reset}>Reset experiment</button></div>
    <p className="text-sm">{bloom ? '24 inserted keys and 512 disjoint absent probes, with fixed seeded toy hashes. Counts are computed, not random. Cost assumes each filter check costs 0.2 exact lookups.' : 'Gorilla section 4.1.1 residual-width rules applied to increasing integer timestamps. The first two timestamps are warm-up state; block headers, first-point encoding, value XOR compression, and byte packing are excluded.'}</p>
    {bloom ? <>
      <div className="flex gap-4 flex-wrap">
        <label>Filter bits <select aria-label="Filter bits" className={control} value={size} onChange={e => setSize(Number(e.target.value))}>{[32, 64, 128, 256, 512].map(n => <option key={n}>{n}</option>)}</select></label>
        <label>Hash functions <select aria-label="Hash functions" className={control} value={hashes} onChange={e => setHashes(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n}>{n}</option>)}</select></label>
        <label>True-hit queries <select aria-label="True-hit queries" className={control} value={hitRate} onChange={e => setHitRate(Number(e.target.value))}>{[0, 10, 50, 90, 100].map(n => <option key={n} value={n}>{n}%</option>)}</select></label>
      </div>
      <p role="status">False positives: {result.falsePositives.length}/{result.absentCount} ({(result.rate * 100).toFixed(2)}%). False negatives: {result.falseNegatives.length}. Expected lookup cost: {result.cost.toFixed(3)} versus 1.000 without a filter. {result.cost < 1 ? 'Filter helps.' : 'Filter costs more.'}</p>
      <p className="text-sm">Uniform-independent-hash approximation: {(result.approximateRate * 100).toFixed(2)}%. This differs from the finite deterministic probe set. Exact lookup fraction: {(result.exactLookups * 100).toFixed(2)}%.</p>
      <div className="grid grid-cols-16 gap-1" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }} aria-label="Filter bit array">{result.bits.map((bit, i) => <span title={`Bit ${i}: ${bit}`} key={i} className={`text-center text-xs rounded ${bit ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-900'}`}>{bit}</span>)}</div>
      <p className="text-sm">First false-positive witness: {result.falsePositives[0] || 'None in this probe set'}. A positive still requires verification in the exact store.</p>
    </> : <>
      <label>Sampling pattern <select aria-label="Sampling pattern" className={control} value={preset} onChange={e => setPreset(e.target.value)}><option value="regular">Regular intervals</option><option value="gap">One missing sample</option><option value="jitter">Timing jitter</option></select></label>
      <p className="break-words">Input seconds: {timestampPresets[preset].join(', ')}</p>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="text-left mb-2">Residual encoding cost after warm-up</caption><thead><tr>{['Time', 'Delta', 'Residual', 'Prefix', 'Payload', 'Bits'].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{result.rows.map(r => <tr key={r.time}>{[r.time, r.delta, r.residual, r.prefix, r.payload, r.bits].map((v, i) => <td className="p-2" key={i}>{v}</td>)}</tr>)}</tbody></table></div>
      <p role="status">Residual cost: {result.residualBits} bits versus {result.rawResidualBits} bits for the same subsequent timestamps stored as raw 64-bit integers. Reconstructed: {result.reconstructed.join(', ')}.</p>
      <p className="text-sm">This is a residual cost and reconstruction model, not a binary-compatible Gorilla encoder. The displayed ratio is not a complete-series compression ratio.</p>
    </>}
    <a className="underline" href={`/library/whitepapers/${id}/research`}>Read assumptions, citation, and research exercise</a>
  </section>;
}
