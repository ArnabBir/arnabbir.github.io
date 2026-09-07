import React, { useEffect, useReducer } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, RotateCcw } from 'lucide-react';
import { libraryContent } from '@/content';
import { labIds } from '@/content/whitepapers';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { initialLab, reduceLab, graphEdges, streamEvents, networkResult, capacityResult, budgetResult, reachableReplicas } from './models';
import './labs.css';

const lessons = {
  pregel: ['Synchronous messages, not shared memory', 'Predict when E first becomes reachable. Step once, fail worker C, and try to cross the next barrier. Recover C and continue until no active vertices remain.', 'A fixed directed, weighted graph runs single-source shortest paths. We block a failed barrier rather than implement Pregel checkpoint replay, partitioning, combiners, or distributed scheduling.'],
  colossus: ['Redundancy is a budget of information', 'Lose two coded fragments, then a third. Compare the storage overhead and recovery threshold with three full replicas.', 'Illustrative ideal (6,4) MDS coding, not a claim about Colossus production coding parameters. Failures are independent missing pieces; no correlated domains, bit corruption, placement, or repair bandwidth model.'],
  percolator: ['A primary record decides the transaction', 'Crash immediately after prewrite and recover. Reset, commit the primary, then crash and recover again. Explain why the outcomes differ.', 'Two rows and fixed timestamps, one client, no concurrent transactions. Recovery assumes the client timeout has expired. Locked secondary values shown here are physical state, not a mixed snapshot that readers may return.'],
  millwheel: ['Event time differs from arrival order', 'Deliver two records, finalize the window, then deliver a replay and a late event. Reset and delay finalization to compare the final sum.', 'One keyed tumbling window, explicit manual watermark, durable dedup IDs, and a late-data side output. This models selected ideas, not MillWheel low-watermark propagation or its full persistent processing protocol.'],
  tensorflow: ['Follow the derivative through a graph', 'Train with learning rate 0.1, then reset and try 0.5. Observe the loss and weight rather than assuming every gradient step improves the fit.', 'Scalar linear regression with two examples, full-batch gradient descent, no bias. No automatic differentiation engine, GPUs, distributed workers, or TensorFlow runtime executes here.'],
  'lambda-architecture': ['Two views need one coverage boundary', 'Publish a batch snapshot, then append new events. Compare the correct disjoint merge against naive batch-plus-speed addition.', 'An architecture companion, not a Google whitepaper. All events count as one; snapshots publish atomically. Real deployments need idempotent ingestion, versioned views, and serving coordination.'],
  'google-infrastructure-security': ['Trust is checked at multiple layers', 'Disable service authorization while leaving encryption on. Then switch to a stolen-disk threat and compare what at-rest encryption protects.', 'Boolean policy evaluation inspired by the official design overview. These gates do not simulate cryptography, secure boot, hardware roots of trust, key management, or a real security assessment.'],
  'photon-pubsub': ['Delivery and effects are different guarantees', 'Deliver query, deliver click, then replay the click. Reset with durable dedup disabled and repeat to see duplicate joined output.', 'Photon is a continuous stream join system; Pub/Sub is a separate messaging product. This one-key teaching model isolates durable deduplication and assumes atomic dedup-plus-output. It does not reproduce Photon coordination or imply that transport alone gives exactly-once external effects.'],
  'jupiter-rising': ['Path diversity does not create infinite bandwidth', 'Increase flow count until spines saturate, then remove one spine. Explain how rerouting preserves reachability but can reduce carried throughput.', 'Four illustrative equal-capacity spines, deterministic modulo hashing, equal-rate flows, instantaneous rehash. Not Jupiter hardware parameters, packet simulation, congestion control, or measured throughput.'],
  autopilot: ['Requests trade wasted resources for risk', 'Apply a recommendation with a small safety margin, then inject a CPU and memory spike. Increase the margin and compare reservation waste against throttling and OOM risk.', 'Illustrative history-based recommendation using CPU p95=2.8 cores and peak memory=5 GiB. Not the published Autopilot algorithm or an SLO guarantee; no learned model or automatic feedback loop.'],
  'inside-google-datacenters': ['Capacity is the smallest surviving bottleneck', 'Add racks while holding uplink capacity fixed. Does usable capacity grow? Fail racks, then reduce available power to discover a different bottleneck.', 'Thematic datacenter companion. Synthetic rack, server, power, and network units, not Google fleet specifications. No cooling, PUE, placement, redundancy topology, or real traffic model.'],
  'sre-workbook': ['An SLO becomes an operational decision', 'Raise the recent error rate while holding the monthly error count fixed. Compare remaining budget with burn rate and decide whether a release should proceed.', 'Request-based availability over a 30-day window. Projected consumption assumes uniform request volume; real multi-window burn alerts must use measured traffic and service-specific policies. The release rule below is an illustrative policy.'],
  dynamo: ['Availability can leave more than one valid version', 'Set W=1 and partition A from B/C before writing. Write on A, select B and write a different cart. Heal, read with R=2, then reconcile siblings using the observed vector context.', 'Three fixed home replicas, full reachable fan-out, vector clocks, and read repair. No ring, sloppy quorum, hinted handoff, Merkle trees, or deletes. R+W>N is an overlap condition here, not a promise of linearizability. Timed-out writes can still persist.'],
  'paxos-simple': ['A quorum carries history into the next ballot', 'Prepare and accept blue at ballot 1. Choose red at ballot 2 and prepare again: inspect the value actually proposed. Fail two acceptors to test the limit of progress.', 'Single-decree Paxos with unique integer ballots, durable acceptor state, atomic message phases, and one active proposer round. No Byzantine behavior, asynchronous network, learner recovery, or Multi-Paxos log. Safety does not imply progress without a reachable quorum.'],
};

function Action({ children, onClick, disabled = false, secondary = false }) {
  return <button className={`lab-button ${secondary ? 'secondary' : ''}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Range({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return <label className="lab-field"><span>{label}<output>{value}{unit}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Toggle({ label, checked, onChange }) {
  return <label className="lab-check"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>;
}
function Metric({ label, value, warning = false }) {
  return <div className={`lab-metric ${warning ? 'warning' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}
function Table({ headings, rows, caption }) {
  return <div className="lab-table"><table><caption>{caption}</caption><thead><tr>{headings.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
const vertex = i => String.fromCharCode(65 + i);
const distance = n => Number.isFinite(n) ? n : 'unreached';

function Experiment({ id, s, send }) {
  const set = (key, value) => send({ type: 'set', key, value });
  const action = type => () => send({ type });
  switch (id) {
    case 'pregel': return <>
      <div className="lab-toolbar"><Action onClick={action('step')} disabled={!s.frontier.length}>Next superstep</Action><Toggle label="Worker C unavailable" checked={s.failed} onChange={v => set('failed', v)} /></div>
      <div className="lab-metrics"><Metric label="Superstep" value={s.step} /><Metric label="Active vertices" value={s.frontier.length} /><Metric label="Barrier" value={s.failed ? 'Blocked' : s.frontier.length ? 'Ready' : 'Converged'} warning={s.failed} /></div>
      <div className="lab-vertices">{s.distances.map((d, i) => <div key={i} className={s.frontier.includes(i) ? 'active' : ''}><b>{vertex(i)}</b><span>{distance(d)}</span><small>{s.frontier.includes(i) ? 'will send' : 'halted'}</small></div>)}</div>
      <p className="lab-formula">Directed edges: {graphEdges.map(([a, b, w]) => `${vertex(a)} → ${vertex(b)} (${w})`).join(' · ')}</p>
      <Table caption="Messages sent in the last superstep" headings={['From', 'To', 'Candidate distance']} rows={s.messages.map(m => [vertex(m.from), vertex(m.to), m.distance])} />
    </>;
    case 'colossus': {
      const total = s.mode === 'coded' ? 6 : 3;
      const live = total - s.failed.length;
      const readable = live >= (s.mode === 'coded' ? 4 : 1);
      return <><div className="lab-toolbar"><label className="lab-select">Storage scheme<select value={s.mode} onChange={e => send({ type: 'mode', value: e.target.value })}><option value="coded">4 data + 2 parity fragments</option><option value="replicated">3 full replicas</option></select></label><Action onClick={action('repair')} disabled={!s.failed.length}>Attempt repair</Action></div>
        <div className="lab-metrics"><Metric label="Storage / logical data" value={s.mode === 'coded' ? '1.5×' : '3×'} /><Metric label="Surviving pieces" value={`${live} / ${total}`} /><Metric label="Read result" value={readable ? 'Recoverable' : 'Unavailable'} warning={!readable} /></div>
        <p>Toggle a piece to fail or restore its device.</p><div className="lab-pieces">{Array.from({ length: total }, (_, i) => <button key={i} aria-pressed={s.failed.includes(i)} onClick={() => send({ type: 'toggleFailure', index: i })} className={s.failed.includes(i) ? 'failed' : ''}><b>{s.mode === 'coded' ? (i < 4 ? `Data ${i + 1}` : `Parity ${i - 3}`) : `Replica ${i + 1}`}</b><span>{s.failed.includes(i) ? 'Missing' : 'Available'}</span></button>)}</div>
        <p className="lab-formula">Recovery needs {s.mode === 'coded' ? 'any 4 of 6 fragments' : 'any 1 complete replica'}. Repair cannot reconstruct information once that threshold is lost.</p></>;
    }
    case 'percolator': return <>
      <div className="lab-toolbar"><Action onClick={action('step')} disabled={s.crashed || ['done', 'aborted'].includes(s.phase)}>{s.phase === 'idle' ? 'Prewrite both rows' : s.phase === 'prewritten' ? 'Commit primary' : 'Commit secondary'}</Action><Action secondary onClick={action('crash')} disabled={s.crashed || ['done', 'aborted'].includes(s.phase)}>Crash client</Action><Action secondary onClick={action('recover')}>Recover / resolve locks</Action></div>
      <ol className="lab-phases">{['idle', 'prewritten', 'committed', 'done'].map(p => <li key={p} aria-current={s.phase === p ? 'step' : undefined} className={s.phase === p ? 'active' : ''}>{p}</li>)}</ol>
      <Table caption="Physical row state (not a readable mixed snapshot)" headings={['Row', 'Stored committed value', 'Pending value', 'Lock']} rows={[[ 'A · primary', s.primary, s.phase === 'prewritten' ? 90 : 'none', s.locks && s.phase === 'prewritten' ? 'start_ts=10' : 'none'], ['B · secondary', s.secondary, s.locks ? 110 : 'none', s.locks ? 'points to A' : 'none']]} />
      <div className="lab-metrics"><Metric label="Transaction outcome" value={s.phase === 'aborted' ? 'Rolled back' : ['committed', 'done'].includes(s.phase) ? 'Committed' : 'Not committed'} /><Metric label="Consistent reader" value={s.locks ? 'Resolve lock first' : `A+B = ${s.primary + s.secondary}`} /><Metric label="Client" value={s.crashed ? 'Crashed' : 'Running'} warning={s.crashed} /></div>
    </>;
    case 'millwheel': return <>
      <div className="lab-toolbar"><Action onClick={action('deliver')} disabled={s.cursor === streamEvents.length}>Deliver next event</Action><Action secondary onClick={action('watermark')} disabled={s.closed}>Advance watermark to 10</Action></div>
      <div className="lab-event-strip">{streamEvents.map((e, i) => <div key={i} className={i < s.cursor ? 'processed' : ''}><b>{e.id} · t={e.time}</b><span>value {e.value}</span><small>{i < s.cursor ? 'delivered' : i === s.cursor ? 'next arrival' : 'pending'}</small></div>)}</div>
      <div className="lab-metrics"><Metric label={`Window sum ${s.closed ? '(final)' : '(open)'}`} value={s.sum} /><Metric label="Watermark" value={s.watermark} /><Metric label="Duplicates / late" value={`${s.duplicates} / ${s.dropped}`} /></div>
      <p className="lab-formula">Arrival order is a, b, a, c, d. A replay is not a new contribution; event d belongs to the next window.</p>
    </>;
    case 'tensorflow': {
      const loss = 2.5 * (s.weight - 2) ** 2;
      const max = Math.max(1, ...s.history.map(v => Math.log10(1 + v)));
      return <><div className="lab-toolbar"><Range label="Learning rate" value={s.rate} min={0.01} max={0.6} step={0.01} onChange={v => set('rate', v)} /><Action onClick={action('train')}>Train one step</Action></div>
        <div className="lab-computation"><span>x = [1, 2]</span><b>× w</b><span>prediction = [{s.weight.toFixed(2)}, {(2 * s.weight).toFixed(2)}]</span><b>MSE</b><span>target = [2, 4]</span></div>
        <div className="lab-metrics"><Metric label="Training step" value={s.step} /><Metric label="Weight (target 2)" value={s.weight.toFixed(4)} /><Metric label="Mean squared error" value={loss.toPrecision(5)} warning={loss > 10} /></div>
        <div className="lab-chart" role="img" aria-label={`Loss history, logarithmic height: ${s.history.map(v => v.toPrecision(3)).join(', ')}`}>{s.history.map((v, i) => <div key={i} style={{ height: `${Math.max(2, Math.log10(1 + v) / max * 100)}%` }} title={`Step ${Math.max(0, s.step - 29) + i}: ${v}`} />)}</div><p className="lab-caption">Last 30 losses · height = log10(1 + loss), scaled to this history</p>
        <p className="lab-formula">L = 2.5(w − 2)² · dL/dw = 5(w − 2) · w_next = w − learning_rate × gradient</p></>;
    }
    case 'lambda-architecture': {
      const fresh = s.speed.filter(i => i > s.cutoff).length;
      return <><div className="lab-toolbar"><Action onClick={action('append')}>Append event</Action><Action secondary onClick={action('batch')}>Publish batch snapshot</Action></div>
        <div className="lab-metrics"><Metric label="Immutable log count" value={s.events.length} /><Metric label="Correct merged count" value={s.batch + fresh} /><Metric label="Naive sum (double counts)" value={s.batch + s.speed.length} warning={s.batch > 0} /></div>
        <Table caption="Serving view coverage" headings={['View', 'Coverage', 'Count used']} rows={[[ 'Batch', s.cutoff ? `IDs 1–${s.cutoff}` : 'No snapshot', s.batch], ['Speed (raw)', `IDs 1–${s.events.length}`, s.speed.length], ['Speed (disjoint)', `IDs > ${s.cutoff}`, fresh]]} />
        <p className="lab-formula">Serving = batch_count + count(speed events with ID &gt; published cutoff). A snapshot changes coverage, not the logical answer.</p></>;
    }
    case 'google-infrastructure-security': {
      const gates = s.stolenDisk ? [['Storage encryption', s.diskEncrypted, 'Encrypted bytes remain protected if keys are not stolen.']] : [['Service identity', s.identity, 'Authenticate the caller.'], ['Service authorization', s.authorized, 'Check permission for this operation.'], ['Transport protection', s.encrypted, 'Protect bytes in transit.']];
      const safe = s.stolenDisk ? s.diskEncrypted : s.identity && s.authorized && s.encrypted;
      return <><div className="lab-toolbar"><Toggle label="Threat: stolen storage device" checked={s.stolenDisk} onChange={v => set('stolenDisk', v)} /><Action onClick={action('evaluate')}>Evaluate threat</Action></div>
        <div className="lab-policy-controls"><Toggle label="Valid service identity" checked={s.identity} onChange={v => set('identity', v)} /><Toggle label="Operation authorized" checked={s.authorized} onChange={v => set('authorized', v)} /><Toggle label="Encrypted transport" checked={s.encrypted} onChange={v => set('encrypted', v)} /><Toggle label="Encrypted storage (keys not stolen)" checked={s.diskEncrypted} onChange={v => set('diskEncrypted', v)} /></div>
        <div className="lab-gates">{gates.map(([label, pass, explanation], i) => <div key={label} className={s.evaluated ? pass ? 'pass' : 'failed' : ''}><small>Layer {i + 1}</small><h3>{label}</h3><p>{explanation}</p><b>{s.evaluated ? pass ? 'Check satisfied' : 'Check failed' : 'Not evaluated'}</b></div>)}</div>
        <p className="lab-verdict" role="status">{!s.evaluated ? 'Change assumptions, then evaluate.' : s.stolenDisk ? safe ? 'Disk contents protected under the key-separation assumption.' : 'At-rest confidentiality is not provided in this model.' : safe ? 'Request allowed by all modeled gates.' : 'Request denied. Encryption alone is not authorization.'}</p></>;
    }
    case 'photon-pubsub': return <>
      <div className="lab-toolbar"><Toggle label="Durable event-ID deduplication" checked={s.dedup} onChange={v => { send({ type: 'reset' }); set('dedup', v); }} /><Action onClick={action('left')}>Deliver query K</Action><Action onClick={action('right')}>Deliver / replay click K</Action></div>
      <div className="lab-join"><div className={s.left ? 'active' : ''}>Query stream<br /><b>{s.left ? 'K buffered' : 'waiting'}</b></div><span>JOIN K</span><div className={s.right ? 'active' : ''}>Click stream<br /><b>{s.right ? 'K received' : 'waiting'}</b></div></div>
      <div className="lab-metrics"><Metric label="Transport deliveries" value={s.deliveries} /><Metric label="Joined outputs (expected 1)" value={s.outputs} warning={s.outputs > 1} /><Metric label="Durable IDs" value={s.dedup ? s.seen.length : 'Disabled'} /></div>
      <p className="lab-formula">Lost acknowledgement → replay of the same ID. Dedup and the output effect must commit atomically for this result to hold.</p>
    </>;
    case 'jupiter-rising': {
      const r = networkResult(s);
      return <><div className="lab-toolbar"><Range label="Equal-rate flows" value={s.flows} min={1} max={24} onChange={v => set('flows', v)} /><Range label="Capacity per spine" value={s.capacity} min={5} max={40} step={5} unit=" Gbit/s" onChange={v => set('capacity', v)} /></div>
        <div className="lab-spines">{r.loads.map((load, i) => <div key={i}><button className={s.failed.includes(i) ? 'failed' : ''} aria-pressed={s.failed.includes(i)} onClick={() => send({ type: 'toggleFailure', index: i })}>Spine {i + 1} · {s.failed.includes(i) ? 'down' : 'up'}</button><div className="lab-load"><div style={{ width: `${Math.min(100, load / s.capacity * 100)}%` }} /></div><span>{load} offered / {s.failed.includes(i) ? 0 : s.capacity} capacity</span></div>)}</div>
        <div className="lab-metrics"><Metric label="Offered" value={`${r.offered} Gbit/s`} /><Metric label="Carried (fluid model)" value={`${r.carried} Gbit/s`} /><Metric label="Unserved demand" value={`${r.offered - r.carried} Gbit/s`} warning={r.carried < r.offered} /></div>
        <p className="lab-formula">Per-spine throughput = min(assigned demand, link capacity). Failed spines get no flows; all-down means zero throughput.</p></>;
    }
    case 'autopilot': {
      const throttle = Math.max(0, s.demand - s.cpu);
      const oom = s.memoryDemand > s.memory;
      return <><div className="lab-toolbar"><Range label="Recommendation margin" value={s.margin} min={0} max={100} step={5} unit="%" onChange={v => set('margin', v)} /><Action onClick={action('recommend')}>Apply recommendation</Action></div>
        <div className="lab-two-columns"><div><h3>Observed workload</h3><Range label="Current CPU demand" value={s.demand} min={0.5} max={8} step={0.5} unit=" cores" onChange={v => set('demand', v)} /><Range label="Current memory demand" value={s.memoryDemand} min={1} max={12} step={0.5} unit=" GiB" onChange={v => set('memoryDemand', v)} /></div><div><h3>Applied reservation</h3><p className="lab-big-number">{s.cpu} <small>cores</small> / {s.memory} <small>GiB</small></p><p>{s.applied ? 'Recommendation applied. Changing the margin requires applying again.' : 'Static starting allocation. Apply a history-based recommendation to compare.'}</p></div></div>
        <div className="lab-metrics"><Metric label="Unserved CPU demand" value={`${throttle.toFixed(1)} cores`} warning={throttle > 0} /><Metric label="Unused reserved CPU" value={`${Math.max(0, s.cpu - s.demand).toFixed(1)} cores`} /><Metric label="Memory outcome" value={oom ? 'OOM risk' : 'Fits'} warning={oom} /></div>
        <p className="lab-formula">CPU recommendation = 2.8 × (1 + margin). Memory = 5 × (1 + margin). Rounded up to 0.1; historical demand is not a future bound.</p></>;
    }
    case 'inside-google-datacenters': {
      const r = capacityResult(s);
      return <><div className="lab-two-columns"><div><Range label="Installed racks" value={s.racks} min={1} max={8} onChange={v => { set('racks', v); set('failed', Math.min(v, s.failed)); }} /><Range label="Failed racks" value={s.failed} min={0} max={s.racks} onChange={v => set('failed', v)} /><Range label="Available IT power" value={s.power} min={0} max={40} unit=" kW" onChange={v => set('power', v)} /></div><div><Range label="Aggregate uplink" value={s.uplink} min={0} max={200} step={10} unit=" Gbit/s" onChange={v => set('uplink', v)} /><Range label="Requested work" value={s.demand} min={100} max={3000} step={100} unit=" units/s" onChange={v => set('demand', v)} /><p className="lab-formula">10 servers/rack · 50 units/s/server · 0.5 kW/server · 10 units/s per Gbit/s</p></div></div>
        <div className="lab-metrics"><Metric label="Power-limited compute" value={r.compute} /><Metric label="Network ceiling" value={r.network} /><Metric label="Usable units/s" value={r.usable} warning={r.usable < s.demand} /></div>
        <div className="lab-racks">{Array.from({ length: s.racks }, (_, i) => <div className={i < s.failed ? 'failed' : ''} key={i}>Rack {i + 1}<b>{i < s.failed ? 'offline' : '10 servers'}</b></div>)}</div>
        <p className="lab-verdict">{r.usable >= s.demand ? `Demand fits with ${r.usable - s.demand} units/s spare.` : `Shortfall: ${s.demand - r.usable} units/s. Adding racks alone cannot fix a network bottleneck.`}</p></>;
    }
    case 'sre-workbook': {
      const r = budgetResult(s);
      return <><div className="lab-two-columns"><div><Range label="Availability SLO" value={s.slo} min={99} max={99.99} step={0.01} unit="%" onChange={v => set('slo', v)} /><Range label="30-day requests" value={s.requests} min={100000} max={2000000} step={100000} onChange={v => set('requests', v)} /><Range label="30-day errors" value={s.errors} min={0} max={5000} step={50} onChange={v => set('errors', v)} /></div><div><Range label="Recent error rate" value={s.recentRate} min={0} max={5} step={0.05} unit="%" onChange={v => set('recentRate', v)} /><Range label="Recent window" value={s.minutes} min={5} max={360} step={5} unit=" min" onChange={v => set('minutes', v)} /><p className="lab-formula">Allowed errors = requests × (1 − SLO). Burn = recent error fraction / allowed error fraction.</p></div></div>
        <div className="lab-metrics"><Metric label="Remaining allowed errors" value={r.remaining.toFixed(0)} warning={r.remaining <= 0} /><Metric label="Recent burn rate" value={`${r.burn.toFixed(1)}×`} warning={r.burn > 1} /><Metric label="Projected budget spent in window" value={`${r.consumed.toFixed(2)}%`} /></div>
        <p className="lab-verdict">{r.remaining <= 0 ? 'Freeze releases: monthly budget exhausted.' : r.burn >= 14.4 ? 'Hold release and investigate: recent burn exceeds the illustrative 14.4× threshold.' : 'Release eligible under this illustrative budget policy; still check other release gates.'}</p></>;
    }
    case 'dynamo': return <>
      <div className="lab-toolbar"><label className="lab-select">Coordinator<select value={s.coordinator} onChange={e => set('coordinator', Number(e.target.value))}>{['A', 'B', 'C'].map((n, i) => <option value={i} key={n}>{n}</option>)}</select></label><label className="lab-select">Object value<input maxLength={60} value={s.value} onChange={e => set('value', e.target.value)} /></label><Toggle label="Partition A from B/C" checked={s.partition} onChange={v => set('partition', v)} /></div>
      <div className="lab-toolbar"><Range label="Read acknowledgements R" min={1} max={3} value={s.r} onChange={v => set('r', v)} /><Range label="Write acknowledgements W" min={1} max={3} value={s.w} onChange={v => set('w', v)} /><Action onClick={action('write')}>Write value</Action><Action secondary onClick={action('read')}>Read + repair</Action><Action secondary onClick={action('resolve')} disabled={s.observed.length < 2}>Reconcile observed siblings</Action></div>
      <div className="lab-replicas">{s.replicas.map((versions, i) => <section key={i}><button aria-pressed={!s.online[i]} className={!s.online[i] ? 'failed' : ''} onClick={() => send({ type: 'online', index: i })}>Replica {vertex(i)} · {s.online[i] ? 'online' : 'offline'}</button>{versions.length ? versions.map(v => <p key={JSON.stringify(v.clock)}><b>{v.value || '(empty value)'}</b><code>[{v.clock.join(', ')}]</code></p>) : <p>No object</p>}</section>)}</div>
      <div className="lab-metrics"><Metric label="Reachable from coordinator" value={reachableReplicas(s).length} /><Metric label="R + W > N" value={s.r + s.w > 3 ? 'Yes (overlap only)' : 'No'} /><Metric label="Last read versions" value={s.observed.length} warning={s.observed.length > 1} /></div>
      <p className="lab-formula">A vector dominates another only if every counter is ≥ and at least one is &gt;. Concurrent vectors survive as siblings. Reconcile uses the last successful read context.</p>
    </>;
    case 'paxos-simple': return <>
      <div className="lab-toolbar"><Range label="Proposal ballot" value={s.ballot} min={1} max={20} onChange={v => set('ballot', v)} /><label className="lab-select">Desired value<select value={s.value} onChange={e => set('value', e.target.value)}><option>blue</option><option>red</option></select></label><Action onClick={action('prepare')}>1. Prepare</Action><Action secondary onClick={action('accept')}>2. Accept prepared round</Action></div>
      <div className="lab-toolbar">{s.online.map((up, i) => <Toggle key={i} label={`Acceptor ${vertex(i)} online`} checked={up} onChange={() => send({ type: 'online', index: i })} />)}</div>
      <Table caption="Durable acceptor state (offline nodes retain promises)" headings={['Acceptor', 'Promised ballot', 'Accepted ballot', 'Accepted value']} rows={s.acceptors.map((a, i) => [vertex(i), a.promised, a.ballot || 'none', a.value ?? 'none'])} />
      <div className="lab-metrics"><Metric label="Prepared round" value={s.round ? `${s.round.ballot}: ${s.round.value}` : 'None'} /><Metric label="Prepare quorum" value={s.round?.quorum ? 'Obtained' : 'Not obtained'} /><Metric label="Chosen value" value={s.chosen ?? 'Not chosen'} /></div>
      <p className="lab-formula">2 of 3 is a majority. A successful prepare adopts the highest-ballot accepted value among its replies, even if the user requested a different value.</p>
    </>;
    default: return null;
  }
}

function Lab({ paper }) {
  const [s, send] = useReducer((state, action) => reduceLab(paper.id, state, action), paper.id, initialLab);
  useEffect(() => {
    const previous = document.title;
    document.title = `${paper.title} | Whitepaper Lab`;
    return () => { document.title = previous; };
  }, [paper.title]);
  const [headline, challenge, limitation] = lessons[paper.id];
  return <main id="content" tabIndex={-1} className="paper-lab">
    <nav className="lab-nav"><Link to="/library/rack/whitepapers"><ArrowLeft size={16} /> Whitepapers</Link><a href={paper.source} target="_blank" rel="noopener noreferrer">{paper.sourceLabel}<ExternalLink size={14} /><span className="sr-only"> (opens in new tab)</span></a><ThemeToggle /></nav>
    <header className="lab-hero"><p className="lab-eyebrow">{paper.category} / model laboratory</p><h1>{paper.title}</h1><p>{headline}</p></header>
    <section className="lab-challenge" aria-labelledby="challenge-heading"><span>01 / Predict</span><div><h2 id="challenge-heading">Try this experiment</h2><p>{challenge}</p></div></section>
    <section className="lab-workbench" aria-labelledby="workbench-heading"><div className="lab-section-heading"><div><p className="lab-eyebrow">02 / Experiment</p><h2 id="workbench-heading">Change the assumptions</h2></div><Action secondary onClick={() => send({ type: 'reset' })}><RotateCcw size={15} /> Reset lab</Action></div>
      <Experiment id={paper.id} s={s} send={send} />
      {s.note && <div className="lab-note" role="status"><strong>Observation</strong><p>{s.note}</p></div>}
    </section>
    <section className="lab-two-columns lab-reading"><div><p className="lab-eyebrow">03 / Explain</p><h2>What should you take away?</h2><p>{paper.objective}</p><p>Before resetting, explain which assumption changed the outcome. Which part would require coordination, persistence, or measurement in a real deployment?</p></div><aside><h2>Model boundaries</h2><p>{limitation}</p><a href={paper.source} target="_blank" rel="noopener noreferrer">Read the source <ExternalLink size={14} /></a></aside></section>
    <footer className="lab-footer"><Link to="/library/rack/whitepapers">Back to all 52 experiences</Link><span>Deterministic teaching model · not a production benchmark</span></footer>
  </main>;
}

export default function PaperLab({ paperId }) {
  const { slug } = useParams();
  const id = paperId || slug;
  const paper = libraryContent.find(item => item.id === 'whitepapers').chapters.find(p => p.id === id);
  if (!paper || !labIds.includes(id)) return <main className="paper-lab"><h1>Experience not found</h1><Link to="/library/rack/whitepapers">Browse whitepapers</Link></main>;
  return <Lab key={id} paper={paper} />;
}
