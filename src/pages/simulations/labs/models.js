// Deterministic teaching models: no clocks, randomness, timers, or network I/O.
export const graphEdges = [[0, 1, 2], [0, 2, 7], [1, 2, 1], [1, 3, 5], [2, 3, 1], [3, 4, 3]];
export const streamEvents = [{ id: 'a', time: 2, value: 4 }, { id: 'b', time: 7, value: 6 }, { id: 'a', time: 2, value: 4 }, { id: 'c', time: 4, value: 3 }, { id: 'd', time: 12, value: 8 }];

export function initialLab(id) {
  switch (id) {
    case 'pregel': return { distances: [0, Infinity, Infinity, Infinity, Infinity], frontier: [0], step: 0, failed: false, messages: [], note: 'Vertex A starts at distance 0. Other vertices have not been reached.' };
    case 'colossus': return { mode: 'coded', failed: [], note: 'Six fragments encode four data units. Try losing two, then three fragments.' };
    case 'percolator': return { phase: 'idle', primary: 100, secondary: 100, locks: false, crashed: false, note: 'Transfer 10 from row A to row B. A is the primary lock.' };
    case 'millwheel': return { cursor: 0, watermark: 0, seen: [], sum: 0, dropped: 0, duplicates: 0, closed: false, note: 'Window [0,10) is open. Deliver events, then advance the watermark.' };
    case 'tensorflow': return { weight: 0, rate: 0.1, step: 0, history: [10], note: 'Fit y = 2x on x = [1,2]. Loss is mean squared error.' };
    case 'lambda-architecture': return { events: [1, 2, 3], cutoff: 0, batch: 0, speed: [1, 2, 3], note: 'The speed view initially holds three events, each worth one count.' };
    case 'google-infrastructure-security': return { identity: true, authorized: true, encrypted: true, diskEncrypted: true, stolenDisk: false, evaluated: false };
    case 'photon-pubsub': return { dedup: true, left: false, right: false, outputs: 0, seen: [], deliveries: 0, note: 'Deliver the query and click records for join key K. Then replay the click after a lost ACK.' };
    case 'jupiter-rising': return { flows: 8, capacity: 10, failed: [], note: 'Each flow offers 5 Gbit/s. Hash flow IDs onto live spines.' };
    case 'autopilot': return { cpu: 4, memory: 8, margin: 20, demand: 2, memoryDemand: 5, applied: false };
    case 'inside-google-datacenters': return { racks: 4, failed: 0, power: 24, uplink: 80, demand: 1000 };
    case 'sre-workbook': return { slo: 99.9, requests: 1000000, errors: 200, recentRate: 1, minutes: 60 };
    case 'dynamo': return { replicas: [[], [], []], online: [true, true, true], partition: false, coordinator: 0, r: 2, w: 2, value: 'cart:book', observed: [], serial: 0, note: 'All replicas are empty. Write, partition A from B/C, then write on both sides.' };
    case 'paxos-simple': return { acceptors: Array.from({ length: 3 }, () => ({ promised: 0, ballot: 0, value: null })), online: [true, true, true], ballot: 1, value: 'blue', round: null, chosen: null, note: 'Prepare ballot 1, then accept. A quorum is two of three acceptors.' };
    default: throw new Error(`Unknown lab: ${id}`);
  }
}

export function maximalVersions(versions) {
  const unique = [...new Map(versions.map(v => [JSON.stringify(v.clock), v])).values()];
  return unique.filter(v => !unique.some(other => other.clock.every((n, i) => n >= v.clock[i]) && other.clock.some((n, i) => n > v.clock[i])));
}

export function reachableReplicas(s) {
  return s.online.flatMap((up, i) => up && (!s.partition || (s.coordinator === 0) === (i === 0)) ? [i] : []);
}

export function networkResult(s) {
  const live = [0, 1, 2, 3].filter(i => !s.failed.includes(i));
  const loads = [0, 0, 0, 0];
  if (live.length) for (let i = 0; i < s.flows; i++) loads[live[i % live.length]] += 5;
  return { loads, offered: s.flows * 5, carried: loads.reduce((sum, load) => sum + Math.min(load, s.capacity), 0) };
}

export function capacityResult(s) {
  // 10 servers/rack, 50 units/server, 0.5 kW/server, 10 units/Gbit.
  const servers = (s.racks - s.failed) * 10;
  const powerServers = Math.min(servers, Math.floor(s.power / 0.5));
  return { servers, compute: powerServers * 50, network: s.uplink * 10, usable: Math.min(powerServers * 50, s.uplink * 10) };
}

export function budgetResult(s) {
  const fraction = 1 - s.slo / 100;
  // Decimal SLO inputs must not flip a release decision at an exact threshold.
  const allowed = Number((s.requests * fraction).toFixed(6));
  const burn = Number(((s.recentRate / 100) / fraction).toFixed(6));
  return { allowed, remaining: allowed - s.errors, burn, consumed: burn * s.minutes / (30 * 24 * 60) * 100 };
}

export function reduceLab(id, s, action) {
  if (action.type === 'reset') return initialLab(id);
  if (action.type === 'set') return { ...s, [action.key]: action.value, evaluated: false };
  if (action.type === 'toggleFailure') return { ...s, failed: s.failed.includes(action.index) ? s.failed.filter(i => i !== action.index) : [...s.failed, action.index] };
  if (action.type === 'online') return { ...s, online: s.online.map((v, i) => i === action.index ? !v : v) };
  switch (id) {
    case 'pregel': {
      if (s.failed) return { ...s, note: 'Barrier blocked: worker C is unavailable. No vertex advances until recovery.' };
      if (!s.frontier.length) return { ...s, note: 'Converged: no improved distances and no messages remain.' };
      const messages = graphEdges.filter(([from]) => s.frontier.includes(from)).map(([from, to, weight]) => ({ from, to, distance: s.distances[from] + weight }));
      const distances = [...s.distances];
      messages.forEach(m => { distances[m.to] = Math.min(distances[m.to], m.distance); });
      const frontier = distances.flatMap((d, i) => d < s.distances[i] ? [i] : []);
      return { ...s, distances, frontier, messages, step: s.step + 1, note: `${messages.length} messages crossed the barrier; ${frontier.length} vertices improved. Updates become inputs to the next superstep.` };
    }
    case 'colossus': {
      const total = s.mode === 'coded' ? 6 : 3;
      const minimum = s.mode === 'coded' ? 4 : 1;
      if (action.type === 'mode') return { ...initialLab(id), mode: action.value };
      const live = total - s.failed.length;
      return live >= minimum ? { ...s, failed: [], note: `Repair succeeded using ${minimum} surviving ${s.mode === 'coded' ? 'fragments' : 'replica'}. Rebuilt ${s.failed.length} missing pieces.` } : { ...s, note: 'Repair impossible in this model: not enough surviving information. Restore a failed device or recover from an external backup.' };
    }
    case 'percolator': {
      if (action.type === 'crash') return { ...s, crashed: true, note: 'Client crashed. Locks remain until a recovery reader resolves the primary status.' };
      if (action.type === 'recover') {
        const committed = s.phase === 'committed' || s.phase === 'done';
        return { ...s, crashed: false, locks: false, phase: committed ? 'done' : 'aborted', primary: committed ? 90 : 100, secondary: committed ? 110 : 100, note: committed ? 'Primary commit record exists: roll forward the secondary. Both rows are visible at the commit timestamp.' : 'No primary commit record after the modeled timeout: roll back both prewrites.' };
      }
      if (s.crashed) return { ...s, note: 'The client is down. Use recovery to resolve its locks.' };
      if (s.phase === 'idle') return { ...s, phase: 'prewritten', locks: true, note: 'Both rows prewritten at start timestamp 10; new values are buffered behind locks, not yet committed.' };
      if (s.phase === 'prewritten') return { ...s, phase: 'committed', primary: 90, note: 'Primary committed at timestamp 20. Secondary is still locked; readers must consult the primary, not return a mixed snapshot.' };
      if (s.phase === 'committed') return { ...s, phase: 'done', secondary: 110, locks: false, note: 'Secondary committed at timestamp 20. Transfer complete; total balance remains 200.' };
      return s;
    }
    case 'millwheel': {
      if (action.type === 'watermark') return { ...s, watermark: 10, closed: true, note: `Watermark reached 10: window [0,10) finalized at ${s.sum}. Older unseen records now go to the late-data side output.` };
      const event = streamEvents[s.cursor];
      if (!event) return s;
      const next = { ...s, cursor: s.cursor + 1 };
      if (s.seen.includes(event.id)) return { ...next, duplicates: s.duplicates + 1, note: `Duplicate ${event.id} suppressed; sum unchanged.` };
      next.seen = [...s.seen, event.id];
      if (event.time < s.watermark) return { ...next, dropped: s.dropped + 1, note: `Late event ${event.id} (t=${event.time}) routed aside after finalization.` };
      return { ...next, sum: s.sum + (event.time < 10 ? event.value : 0), note: event.time < 10 ? `Applied ${event.id}: +${event.value} to window [0,10).` : `${event.id} belongs to the next window [10,20), not this sum.` };
    }
    case 'tensorflow': {
      const gradient = 5 * (s.weight - 2);
      const weight = s.weight - s.rate * gradient;
      const loss = 2.5 * (weight - 2) ** 2;
      if (!Number.isFinite(loss) || loss > 1e12) return { ...s, note: 'Numerical safety stop: loss exceeded 10^12. Reset and lower the learning rate.' };
      return { ...s, weight, step: s.step + 1, history: [...s.history, loss].slice(-30), note: `Gradient ${gradient.toFixed(4)}; w := w - ${s.rate} × gradient. ${loss < s.history.at(-1) ? 'Loss decreased.' : 'Loss did not decrease: compare a smaller learning rate.'}` };
    }
    case 'lambda-architecture': {
      if (action.type === 'batch') return { ...s, cutoff: s.events.length, batch: s.events.length, note: `Batch snapshot now covers event IDs 1 through ${s.events.length}. Correct serving excludes these IDs from the speed view.` };
      const next = s.events.length + 1;
      return { ...s, events: [...s.events, next], speed: [...s.speed, next], note: `Event ${next} appended to the immutable log and speed view; the batch snapshot has not changed.` };
    }
    case 'google-infrastructure-security': return { ...s, evaluated: true };
    case 'photon-pubsub': {
      const event = action.type === 'left' ? 'query-K' : 'click-K';
      const deliveries = s.deliveries + 1;
      if (s.dedup && s.seen.includes(event)) return { ...s, deliveries, note: `Replay ${event} recognized by durable ID. No extra joined output.` };
      const left = s.left || event === 'query-K';
      const right = s.right || event === 'click-K';
      return { ...s, deliveries, left, right, seen: [...new Set([...s.seen, event])], outputs: s.outputs + (left && right ? 1 : 0), note: left && right ? 'Both sides present: emitted a joined result. Replay the click to compare duplicate handling.' : 'Record buffered until its matching side arrives.' };
    }
    case 'autopilot': return { ...s, cpu: Math.ceil(2.8 * (1 + s.margin / 100) * 10) / 10, memory: Math.ceil(5 * (1 + s.margin / 100) * 10) / 10, applied: true };
    case 'dynamo': {
      const reachable = reachableReplicas(s);
      if (!s.online[s.coordinator]) return { ...s, note: 'Coordinator is offline. Choose a live coordinator.' };
      const versions = maximalVersions(reachable.flatMap(i => s.replicas[i]));
      if (action.type === 'read') {
        if (reachable.length < s.r) return { ...s, observed: [], note: `Read unavailable: ${reachable.length} reachable, R=${s.r}.` };
        return { ...s, observed: versions, replicas: s.replicas.map((v, i) => reachable.includes(i) ? versions : v), note: `Read returned ${versions.length} version(s); repaired reachable replicas. Concurrent siblings require application reconciliation.` };
      }
      const context = action.type === 'resolve' ? s.observed : s.replicas[s.coordinator];
      const clock = [0, 1, 2].map(i => Math.max(0, ...context.map(v => v.clock[i])));
      // A coordinator's counter survives writes, including failed quorum acknowledgements.
      clock[s.coordinator] = Math.max(clock[s.coordinator], ...s.replicas[s.coordinator].map(v => v.clock[s.coordinator]), 0) + 1;
      const version = { value: s.value, clock };
      return { ...s, serial: s.serial + 1, replicas: s.replicas.map((v, i) => reachable.includes(i) ? maximalVersions([...v, version]) : v), note: reachable.length >= s.w ? `Write acknowledged by ${reachable.length} replicas (W=${s.w}). Vector [${clock}].` : `Only ${reachable.length} acknowledgements (W=${s.w}): timeout, NOT rollback. Reachable replicas may retain this write.` };
    }
    case 'paxos-simple': {
      if (action.type === 'prepare') {
        const responders = s.acceptors.flatMap((a, i) => s.online[i] && s.ballot > a.promised ? [i] : []);
        const accepted = responders.map(i => s.acceptors[i]).filter(a => a.value !== null).sort((a, b) => b.ballot - a.ballot);
        const value = accepted[0]?.value ?? s.value;
        return { ...s, acceptors: s.acceptors.map((a, i) => responders.includes(i) ? { ...a, promised: s.ballot } : a), round: { ballot: s.ballot, value, quorum: responders.length >= 2 }, note: responders.length >= 2 ? `Prepare quorum: ballot ${s.ballot} must propose ${value}${accepted.length ? ' (highest previously accepted value)' : ' (no prior accepted value)'}.` : 'Prepare failed: fewer than two promises. Use a higher ballot or restore acceptors.' };
      }
      if (!s.round?.quorum) return { ...s, note: 'No prepare quorum. Do not send accept without a successful prepare.' };
      const { ballot, value } = s.round;
      const responders = s.acceptors.flatMap((a, i) => s.online[i] && ballot >= a.promised ? [i] : []);
      const acceptors = s.acceptors.map((a, i) => responders.includes(i) ? { promised: ballot, ballot, value } : a);
      const chosen = responders.length >= 2 ? value : s.chosen;
      return { ...s, acceptors, chosen, note: responders.length >= 2 ? `Value ${value} chosen by a majority. Try a higher ballot with a different candidate: it must retain ${value}.` : `Only ${responders.length} accepts. No new value chosen; accepted values persist across retries.` };
    }
    default: return s;
  }
}
