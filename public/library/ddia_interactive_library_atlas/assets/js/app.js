
/* =========================================================
   DDIA Interactive Library — app.js
   Offline-first, no external libraries.
   ========================================================= */

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---------- Theme ----------
  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ddia_theme', theme);
    const btn = $('#themeToggle');
    if(btn){
      btn.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
      btn.setAttribute('aria-pressed', theme === 'light' ? 'false' : 'true');
    }
  }
  function initTheme(){
    const saved = localStorage.getItem('ddia_theme');
    if(saved){ applyTheme(saved); return; }
    // default: dark unless OS prefers light
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
  }

  // ---------- Active TOC ----------
  function initActiveToc(){
    const toc = $('.toc');
    if(!toc) return;
    const links = $$('.toc a', toc);
    const targets = links
      .map(a => ({ a, id: a.getAttribute('href') }))
      .filter(x => x.id && x.id.startsWith('#'))
      .map(x => ({ a: x.a, el: $(x.id) }))
      .filter(x => x.el);

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          links.forEach(a=>a.classList.remove('active'));
          const found = targets.find(t=>t.el === e.target);
          if(found) found.a.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.2, 0.6] });

    targets.forEach(t=>io.observe(t.el));
  }

  // ---------- Index search ----------
  function initFilterSearch(inputSel, cardSel, emptySel){
    const input = $(inputSel);
    if(!input) return;
    const cards = $$(cardSel);
    const empty = emptySel ? $(emptySel) : null;

    function norm(s){ return (s||'').toLowerCase().trim(); }
    function update(){
      const q = norm(input.value);
      let shown = 0;
      cards.forEach(card=>{
        const hay = norm(card.getAttribute('data-search') || card.textContent);
        const ok = q === '' || hay.includes(q);
        card.style.display = ok ? '' : 'none';
        if(ok) shown++;
      });
      if(empty) empty.style.display = (shown===0) ? '' : 'none';
    }

    input.addEventListener('input', update);
    document.addEventListener('keydown', (e)=>{
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k' && inputSel === '#chapterSearch'){
        e.preventDefault();
        input.focus();
      }
    });
    update();
  }

  function initIndexSearch(){
    initFilterSearch('#chapterSearch', '.card[data-chapter]', '#searchEmpty');
    initFilterSearch('#glossarySearch', '.card[data-term]', '#glossaryEmpty');
  }

  // ---------- Tiny canvas helpers ----------
  function getCanvas2D(canvas){
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w; canvas.height = h;
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,rect.width,rect.height);
    return {ctx, w:rect.width, h:rect.height};
  }

  function colorVar(name){
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || '#fff';
  }

  function drawAxes(ctx, w, h){
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = colorVar('--stroke2');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 10);
    ctx.lineTo(28, h-20);
    ctx.lineTo(w-10, h-20);
    ctx.stroke();
    ctx.restore();
  }

  function drawBars(canvas, values, labels){
    const {ctx, w, h} = getCanvas2D(canvas);
    const padL=28, padB=20, padT=10, padR=10;
    const cw = w - padL - padR;
    const ch = h - padT - padB;
    drawAxes(ctx,w,h);
    const maxV = Math.max(...values, 1);
    const n = values.length;
    const gap = 10;
    const bw = (cw - gap*(n-1)) / n;
    values.forEach((v,i)=>{
      const x = padL + i*(bw+gap);
      const bh = (v/maxV)*ch;
      const y = padT + (ch - bh);
      const grad = ctx.createLinearGradient(0,y,0,y+bh);
      grad.addColorStop(0, colorVar('--accent2'));
      grad.addColorStop(1, colorVar('--accent'));
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, bw, bh, 10);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = colorVar('--text');
      ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText(String(labels[i] || ''), x, h-6);
      ctx.globalAlpha = 1;
    });
  }

  function roundRect(ctx, x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  function drawLine(canvas, points){
    const {ctx, w, h} = getCanvas2D(canvas);
    const padL=28, padB=20, padT=10, padR=10;
    const cw = w - padL - padR;
    const ch = h - padT - padB;
    drawAxes(ctx,w,h);

    const xs = points.map(p=>p[0]);
    const ys = points.map(p=>p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const fx = x => padL + ( (x - minX) / Math.max(1e-9, (maxX-minX)) ) * cw;
    const fy = y => padT + (1 - ( (y - minY) / Math.max(1e-9, (maxY-minY)) )) * ch;

    // area fill
    ctx.save();
    ctx.globalAlpha = 0.22;
    const grad = ctx.createLinearGradient(0,padT,0,padT+ch);
    grad.addColorStop(0, colorVar('--accent2'));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(fx(points[0][0]), fy(points[0][1]));
    for(let i=1;i<points.length;i++) ctx.lineTo(fx(points[i][0]), fy(points[i][1]));
    ctx.lineTo(fx(points[points.length-1][0]), padT+ch);
    ctx.lineTo(fx(points[0][0]), padT+ch);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // line stroke
    ctx.strokeStyle = colorVar('--accent2');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx(points[0][0]), fy(points[0][1]));
    for(let i=1;i<points.length;i++) ctx.lineTo(fx(points[i][0]), fy(points[i][1]));
    ctx.stroke();

    // markers
    ctx.fillStyle = colorVar('--accent');
    for(const p of points){
      ctx.beginPath();
      ctx.arc(fx(p[0]), fy(p[1]), 3.2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function drawRing(canvas, segments){
    // segments: [{label, value, colorVar}] value sum ~ 1
    const {ctx, w, h} = getCanvas2D(canvas);
    const cx = w/2, cy = h/2;
    const r = Math.min(w,h)*0.34;
    const thick = Math.max(12, Math.min(20, r*0.22));
    let a0 = -Math.PI/2;

    // base ring
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = colorVar('--stroke2');
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

    segments.forEach(seg=>{
      const a1 = a0 + (seg.value * Math.PI*2);
      ctx.strokeStyle = seg.color || colorVar(seg.colorVar || '--accent2');
      ctx.lineWidth = thick;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.stroke();
      a0 = a1;
    });

    // legend
    ctx.fillStyle = colorVar('--text');
    ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
    let lx = 12, ly = 14;
    segments.forEach(seg=>{
      ctx.globalAlpha = 1;
      ctx.fillStyle = seg.color || colorVar(seg.colorVar || '--accent2');
      ctx.fillRect(lx, ly-9, 10, 10);
      ctx.fillStyle = colorVar('--muted');
      ctx.fillText(`${seg.label}`, lx+14, ly);
      ly += 16;
    });
  }

  function drawHashRing(canvas, nodes, keys){
    // nodes: [{name, pos:0..1}] sorted
    // keys: array pos 0..1
    const {ctx, w, h} = getCanvas2D(canvas);
    const cx = w/2, cy = h/2;
    const r = Math.min(w,h)*0.34;

    // ring
    ctx.save();
    ctx.strokeStyle = colorVar('--stroke2');
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

    // arcs per node region
    if(nodes.length){
      for(let i=0;i<nodes.length;i++){
        const cur = nodes[i];
        const next = nodes[(i+1)%nodes.length];
        const a0 = -Math.PI/2 + cur.pos*2*Math.PI;
        let a1 = -Math.PI/2 + next.pos*2*Math.PI;
        if(a1 < a0) a1 += 2*Math.PI;
        ctx.save();
        ctx.strokeStyle = (i%2===0) ? colorVar('--accent') : colorVar('--accent2');
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx,cy,r,a0,a1);
        ctx.stroke();
        ctx.restore();
      }
    }

    // nodes
    nodes.forEach((n,i)=>{
      const a = -Math.PI/2 + n.pos*2*Math.PI;
      const x = cx + Math.cos(a)*r;
      const y = cy + Math.sin(a)*r;
      ctx.save();
      ctx.fillStyle = (i%2===0) ? colorVar('--accent') : colorVar('--accent2');
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(x,y,6,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = colorVar('--muted');
      ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText(n.name, x+8, y+4);
      ctx.restore();
    });

    // keys
    keys.forEach((p)=>{
      const a = -Math.PI/2 + p*2*Math.PI;
      const x = cx + Math.cos(a)*r*0.86;
      const y = cy + Math.sin(a)*r*0.86;
      ctx.save();
      ctx.fillStyle = colorVar('--accent3');
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x,y,3.5,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = colorVar('--muted');
    ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillText('Consistent hash ring (nodes + sampled keys)', 12, h-8);
    ctx.restore();
  }

  // ---------- Math helpers ----------
  const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
  const fmtMs = (ms)=> ms < 1 ? (ms*1000).toFixed(0)+'µs' : ms < 1000 ? ms.toFixed(1)+'ms' : ms < 60000 ? (ms/1000).toFixed(2)+'s' : (ms/60000).toFixed(2)+'m';
  const fmtDur = (sec)=> sec < 60 ? sec.toFixed(1)+'s' : sec < 3600 ? (sec/60).toFixed(1)+'m' : sec < 86400 ? (sec/3600).toFixed(2)+'h' : (sec/86400).toFixed(2)+'d';
  const fmtPct = (p)=> (p*100).toFixed(2)+'%';

  // ---------- Labs ----------
  function mountSloLab(root){
    const qps = root.querySelector('[data-k="qps"]');
    const err = root.querySelector('[data-k="err"]');
    const latency = root.querySelector('[data-k="lat"]');

    const outAvail = root.querySelector('[data-out="avail"]');
    const outBudget = root.querySelector('[data-out="budget"]');
    const outBad = root.querySelector('[data-out="bad"]');
    const outP99 = root.querySelector('[data-out="p99"]');
    const outSlo = root.querySelector('[data-out="slo"]');
    const canvas = root.querySelector('canvas');

    // For intuition only (not a full SRE model):
    // - availability ≈ 1 - error_rate
    // - error budget measured over 30 days
    // - latency SLO: p99 <= target_ms
    const TARGET_P99 = 200;

    function recalc(){
      const Q = Number(qps.value);        // requests/sec
      const e = Number(err.value)/100;    // error probability
      const p99 = Number(latency.value);  // ms

      const availability = 1 - e;
      const budgetSeconds = (1-availability) * 30*24*3600;

      const badPerHour = Q * 3600 * e;

      // A soft “risk” score: once p99 exceeds target, treat it as SLO breach pressure.
      const sloRisk = clamp((p99 - TARGET_P99) / 400, 0, 1);

      outAvail.textContent = fmtPct(availability);
      outBudget.textContent = fmtDur(budgetSeconds);
      outBad.textContent = badPerHour.toFixed(0) + ' req/h';
      if(outP99) outP99.textContent = fmtMs(p99);
      if(outSlo) outSlo.textContent = (sloRisk*100).toFixed(0) + '%';

      outAvail.className = 'v ' + (availability >= 0.999 ? 'good':'bad');
      outBad.className = 'v ' + (badPerHour <= 100 ? 'good':'bad');
      if(outSlo) outSlo.className = 'v ' + (sloRisk < 0.25 ? 'good' : sloRisk < 0.6 ? '' : 'bad');

      // draw burn-down fraction over a day vs budget (very simplified)
      const pts = [];
      const budgetReq = Q*30*24*3600 * e;
      const burnPerHour = badPerHour;

      for(let h=0; h<=24; h++){
        const burned = burnPerHour*h;
        const frac = budgetReq>0 ? clamp(burned/(budgetReq),0,1):0;
        // include latency risk as a small additional penalty term
        const frac2 = clamp(frac + sloRisk*0.15, 0, 1);
        pts.push([h, frac2]);
      }
      drawLine(canvas, pts);
    }
    [qps, err, latency].forEach(i=>i.addEventListener('input', recalc));
    recalc();
  }

  function mountDataModelLab(root){
    const model = root.querySelector('[data-k="model"]');
    const access = root.querySelector('[data-k="access"]');
    const out = root.querySelector('[data-out="advice"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const m = model.value;
      const a = access.value;
      // heuristic scores: [flexibility, joins, locality, evolution]
      const scores = { flex:0, joins:0, local:0, evol:0 };
      if(m==='relational'){ scores.flex=6; scores.joins=9; scores.local=6; scores.evol=7; }
      if(m==='document'){ scores.flex=8; scores.joins=4; scores.local=9; scores.evol=8; }
      if(m==='graph'){ scores.flex=9; scores.joins=8; scores.local=5; scores.evol=7; }

      // access adjustments
      if(a==='oltp'){ scores.local += 1; scores.joins += 1; }
      if(a==='analytics'){ scores.flex += 1; scores.evol += 1; }
      if(a==='traversal'){ scores.flex += 1; scores.joins += 1; scores.local -= 1; }
      if(a==='search'){ scores.flex += 1; scores.local += 0; scores.joins -= 1; }

      // advice text
      let advice = '';
      if(m==='relational'){
        advice = 'Best when you need strong constraints, mature tooling, and complex joins. Use indexes for selective predicates; consider denormalization for hot read paths.';
      }else if(m==='document'){
        advice = 'Best when your access patterns are aggregate‑oriented and you can co-locate data you read together. Beware cross‑document invariants; enforce them at the application or via transactions if supported.';
      }else{
        advice = 'Best when relationships are the product: traversals, recommendations, authorization graphs. Model edges as first‑class entities; watch out for fan‑out and hot vertices.';
      }
      out.textContent = advice;

      drawBars(canvas, [scores.flex, scores.joins, scores.local, scores.evol], ['Flex', 'Joins', 'Local', 'Evol']);
    }
    [model, access].forEach(i=>i.addEventListener('change', recalc));
    recalc();
  }

  function mountStorageLab(root){
    const engine = root.querySelector('[data-k="engine"]');
    const writes = root.querySelector('[data-k="writes"]');
    const mem = root.querySelector('[data-k="mem"]');
    const outWA = root.querySelector('[data-out="wa"]');
    const outRead = root.querySelector('[data-out="read"]');
    const outWrite = root.querySelector('[data-out="write"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const e = engine.value; // lsm or btree
      const W = Number(writes.value); // write intensity 0..100
      const M = Number(mem.value); // memory 0..100
      // toy model:
      // LSM: better writes, worse reads; write amp depends on compaction and level count; improved with more memory.
      // B-tree: steady reads, writes cost random IO; improved with cache.
      let writeAmp = 1.0, readCost = 1.0, writeCost = 1.0;
      if(e==='lsm'){
        writeAmp = 1.2 + (W/100)*2.2 + (1 - M/100)*1.5;
        readCost = 1.3 + (W/100)*0.8 + (1 - M/100)*1.0;
        writeCost = 0.9 + (1 - M/100)*0.8;
      }else{
        writeAmp = 1.1 + (W/100)*1.0 + (1 - M/100)*0.7;
        readCost = 0.95 + (1 - M/100)*0.8;
        writeCost = 1.2 + (W/100)*0.9 + (1 - M/100)*1.0;
      }
      outWA.textContent = writeAmp.toFixed(2) + '×';
      outRead.textContent = readCost.toFixed(2) + ' (rel)';
      outWrite.textContent = writeCost.toFixed(2) + ' (rel)';
      outWA.className = 'v ' + (writeAmp<=2.5 ? 'good':'bad');

      // chart: costs bars
      drawBars(canvas, [writeCost*10, readCost*10, writeAmp*10], ['Write', 'Read', 'W‑Amp']);
    }
    [engine, writes, mem].forEach(i=>i.addEventListener('input', recalc));
    engine.addEventListener('change', recalc);
    recalc();
  }

  function mountSchemaLab(root){
    const writer = root.querySelector('[data-k="writer"]');
    const reader = root.querySelector('[data-k="reader"]');
    const out = root.querySelector('[data-out="compat"]');
    const canvas = root.querySelector('canvas');

    const compat = (w,r)=>{
      // very simplified: adding optional field is backward compatible.
      // removing field breaks forward.
      // changing type breaks both.
      if(w===r) return {ok:true, msg:'Exact match: safest.'};
      if(w===1 && r===2) return {ok:true, msg:'Reader knows more than writer: backward compatible if new fields have defaults.'};
      if(w===2 && r===1) return {ok:true, msg:'Writer knows more than reader: forward compatible if unknown fields are ignored (depends on encoding).' };
      if(w===2 && r===3) return {ok:true, msg:'Gradual evolution works if you avoid type changes and keep field numbers stable.'};
      if(w===3 && r===2) return {ok:true, msg:'Still compatible if changes were additive and you preserved field identity.'};
      return {ok:false, msg:'Potential break: check defaults, field ids, and union types.'};
    };

    function recalc(){
      const w = Number(writer.value);
      const r = Number(reader.value);
      const c = compat(w,r);
      out.textContent = c.msg;
      out.className = 'v ' + (c.ok?'good':'bad');
      drawRing(canvas, [
        {label:'Backward', value: (w<=r?0.42:0.22), colorVar:'--good'},
        {label:'Forward', value: (w>=r?0.42:0.22), colorVar:'--accent2'},
        {label:'Break risk', value: 0.16, colorVar:'--bad'},
      ]);
    }
    [writer, reader].forEach(i=>i.addEventListener('change', recalc));
    recalc();
  }

  function mountReplicationLab(root){
    const mode = root.querySelector('[data-k="mode"]');
    const lag = root.querySelector('[data-k="lag"]');
    const quorum = root.querySelector('[data-k="quorum"]');
    const outLat = root.querySelector('[data-out="lat"]');
    const outStale = root.querySelector('[data-out="stale"]');
    const outAvail = root.querySelector('[data-out="avail"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const m = mode.value; // sync or async
      const L = Number(lag.value); // ms
      const q = Number(quorum.value); // 1..3
      // toy: base latency 20ms + quorum penalty + sync penalty ~ max lag
      let writeLat = 20 + (q-1)*12 + (m==='sync'? Math.min(300, L*0.6): 0);
      let staleness = (m==='async' ? L : Math.max(0, L*0.15));
      let availability = 0.999 - (q-1)*0.0004; // more quorum => slightly less availability
      outLat.textContent = fmtMs(writeLat);
      outStale.textContent = fmtMs(staleness);
      outAvail.textContent = fmtPct(availability);
      outStale.className = 'v ' + (staleness <= 100 ? 'good':'bad');

      drawBars(canvas, [writeLat/10, staleness/10, availability*100], ['WriteLat', 'Stale', 'Avail']);
    }
    [mode, lag, quorum].forEach(i=>i.addEventListener('input', recalc));
    mode.addEventListener('change', recalc);
    recalc();
  }

  function mountPartitionLab(root){
    const nodes = root.querySelector('[data-k="nodes"]');
    const keys = root.querySelector('[data-k="keys"]');
    const skew = root.querySelector('[data-k="skew"]');
    const outHot = root.querySelector('[data-out="hot"]');
    const outSpread = root.querySelector('[data-out="spread"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const N = Number(nodes.value);
      const K = Number(keys.value);
      const S = Number(skew.value)/100; // 0 uniform, 1 skewed
      // create nodes evenly on ring with jitter
      const ns = [];
      for(let i=0;i<N;i++){
        const pos = (i/N + (Math.random()-0.5)*0.015 + 1)%1;
        ns.push({name:'n'+(i+1), pos});
      }
      ns.sort((a,b)=>a.pos-b.pos);
      // sample keys with skew using Zipf-ish: concentrate near 0.15
      const ks = [];
      for(let i=0;i<K;i++){
        let p = Math.random();
        if(S>0){
          // pull towards hotspot
          const hot = 0.15;
          p = (1-S)*p + S*(hot + (Math.random()-0.5)*0.08);
          p = (p%1+1)%1;
        }
        ks.push(p);
      }
      // assign each key to next node clockwise
      const counts = new Array(N).fill(0);
      ks.forEach(p=>{
        let idx = ns.findIndex(n=>n.pos>=p);
        if(idx===-1) idx=0;
        counts[idx]++;
      });
      const maxC = Math.max(...counts);
      const minC = Math.min(...counts);
      const spread = (maxC / Math.max(1,minC));
      outHot.textContent = 'x' + spread.toFixed(2);
      outSpread.textContent = `${minC}..${maxC} keys/node`;
      outHot.className = 'v ' + (spread<=1.8?'good':'bad');

      // draw ring
      drawHashRing(canvas, ns, ks.slice(0, Math.min(120, ks.length)));
    }
    [nodes, keys, skew].forEach(i=>i.addEventListener('input', recalc));
    recalc();
  }

  function mountTxnLab(root){
    const iso = root.querySelector('[data-k="iso"]');
    const out = root.querySelector('[data-out="anoms"]');
    const canvas = root.querySelector('canvas');

    // anomalies: dirty read, non-repeatable read, phantom, write skew
    const matrix = {
      'read_committed': ['Prevents dirty reads', 'Allows non-repeatable reads', 'Allows phantoms', 'Allows write skew'],
      'repeatable_read': ['Prevents dirty reads', 'Prevents non-repeatable reads', 'May allow phantoms (engine-specific)', 'Allows write skew in snapshot isolation'],
      'serializable': ['Prevents dirty reads', 'Prevents non-repeatable reads', 'Prevents phantoms', 'Prevents write skew (via SSI/2PL)'],
      'snapshot': ['Prevents dirty reads', 'Prevents non-repeatable reads', 'Allows phantoms (as observed sets)', 'Allows write skew unless checked']
    };

    function recalc(){
      const v = iso.value;
      const items = matrix[v] || [];
      out.innerHTML = items.map(s=>`• ${s}`).join('<br>');
      // risk score bars (toy)
      const risk = {
        'read_committed':[9,7,7,8],
        'repeatable_read':[3,4,5,7],
        'snapshot':[2,3,4,7],
        'serializable':[1,1,1,1],
      }[v] || [5,5,5,5];
      drawBars(canvas, risk, ['Dirty','NRR','Phant','W‑Skew']);
    }
    iso.addEventListener('change', recalc);
    recalc();
  }

  function mountTimeLab(root){
    const skew = root.querySelector('[data-k="skew"]');
    const delay = root.querySelector('[data-k="delay"]');
    const out = root.querySelector('[data-out="risk"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const S = Number(skew.value); // ms
      const D = Number(delay.value); // ms
      // risk: if skew comparable to delay, ordering assumptions break
      const ratio = S / Math.max(1, D);
      const risk = clamp(ratio/3, 0, 1); // 0..1
      out.textContent = (risk*100).toFixed(0)+'% ordering-risk';
      out.className = 'v ' + (risk<0.25?'good': risk<0.6?'':'bad');

      const pts = [];
      for(let t=0;t<=60;t+=2){
        const drift = (t/60)*S;
        const uncertainty = drift + D;
        pts.push([t, uncertainty]);
      }
      drawLine(canvas, pts);
    }
    [skew, delay].forEach(i=>i.addEventListener('input', recalc));
    recalc();
  }

  function mountConsensusLab(root){
    const n = root.querySelector('[data-k="n"]');
    const jitter = root.querySelector('[data-k="jitter"]');
    const outLeader = root.querySelector('[data-out="leader"]');
    const outTerm = root.querySelector('[data-out="term"]');
    const outSplit = root.querySelector('[data-out="split"]');
    const canvas = root.querySelector('canvas');
    const btn = root.querySelector('[data-action="tick"]');

    let term = 1;
    let leader = 1;

    function simulate(){
      const N = Number(n.value);
      const J = Number(jitter.value)/100; // 0..1
      // each node timeout random: base 150..300ms with jitter
      const timeouts = [];
      for(let i=0;i<N;i++){
        const base = 180 + Math.random()*120;
        const tmo = base * (1 + (Math.random()-0.5)*J);
        timeouts.push({id:i+1, tmo});
      }
      timeouts.sort((a,b)=>a.tmo-b.tmo);
      const cand = timeouts[0].id;

      // split vote probability rises with jitter low (timeouts close)
      const closeness = (timeouts[1].tmo - timeouts[0].tmo) / Math.max(1, timeouts[0].tmo);
      const splitRisk = clamp((0.22 - closeness) * 3.5, 0, 1);

      const split = Math.random() < splitRisk;
      if(split){
        term += 1;
        outSplit.textContent = 'Yes';
        outSplit.className = 'v bad';
        // leader unchanged (no majority)
      }else{
        leader = cand;
        term += 1;
        outSplit.textContent = 'No';
        outSplit.className = 'v good';
      }
      outLeader.textContent = 'node-' + leader;
      outTerm.textContent = 'term ' + term;

      // chart timeouts bars
      const vals = timeouts.map(x=>x.tmo);
      const labs = timeouts.map(x=>'n'+x.id);
      drawBars(canvas, vals.map(v=>v/10), labs);
    }

    function recalc(){ simulate(); }
    [n, jitter].forEach(i=>i.addEventListener('input', recalc));
    if(btn) btn.addEventListener('click', simulate);
    simulate();
  }

  function mountBatchLab(root){
    const data = root.querySelector('[data-k="data"]');
    const parts = root.querySelector('[data-k="parts"]');
    const outShuffle = root.querySelector('[data-out="shuffle"]');
    const outSort = root.querySelector('[data-out="sort"]');
    const outIO = root.querySelector('[data-out="io"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const GB = Number(data.value); // 1..500
      const P = Number(parts.value); // 1..200
      // toy costs
      const shuffle = (GB * 30) / Math.max(1, P/10); // seconds
      const sort = (GB * 10) * Math.log2(Math.max(2,P)); // seconds
      const io = GB * 2.2; // "TB read+write" scaled
      outShuffle.textContent = (shuffle).toFixed(1)+'s';
      outSort.textContent = (sort).toFixed(1)+'s';
      outIO.textContent = io.toFixed(1)+' GB-IO';
      outShuffle.className = 'v ' + (shuffle<60?'good':'bad');

      drawBars(canvas, [shuffle/3, sort/3, io], ['Shuffle','Sort','IO']);
    }
    [data, parts].forEach(i=>i.addEventListener('input', recalc));
    recalc();
  }

  function mountStreamLab(root){
    const rate = root.querySelector('[data-k="rate"]');
    const late = root.querySelector('[data-k="late"]');
    const wm = root.querySelector('[data-k="wm"]');
    const outLoss = root.querySelector('[data-out="loss"]');
    const outLag = root.querySelector('[data-out="lag"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const R = Number(rate.value); // events/s
      const L = Number(late.value); // % late events
      const W = Number(wm.value); // allowed lateness seconds
      // toy: late fraction dropped depends on watermark strictness
      const dropped = clamp((L/100) * (1 - W/30), 0, 1);
      const lag = clamp(W*1000 + (L/100)*1200, 0, 60000);
      outLoss.textContent = fmtPct(dropped);
      outLag.textContent = fmtMs(lag);
      outLoss.className = 'v ' + (dropped < 0.02 ? 'good':'bad');

      // line: watermark vs completeness (0..1)
      const pts = [];
      for(let s=0;s<=60;s+=2){
        const completeness = clamp(1 - (L/100)*Math.exp(-s/Math.max(1,W)), 0,1);
        pts.push([s, completeness]);
      }
      drawLine(canvas, pts);
    }
    [rate, late, wm].forEach(i=>i.addEventListener('input', recalc));
    recalc();
  }

  function mountFutureLab(root){
    const unbundle = root.querySelector('[data-k="unbundle"]');
    const dataflow = root.querySelector('[data-k="dataflow"]');
    const transact = root.querySelector('[data-k="transact"]');
    const out = root.querySelector('[data-out="score"]');
    const canvas = root.querySelector('canvas');

    function recalc(){
      const u = unbundle.checked ? 1 : 0;
      const d = dataflow.checked ? 1 : 0;
      const t = transact.checked ? 1 : 0;

      // toy scores
      const agility = 5 + u*3 + d*2;
      const complexity = 4 + u*3 + d*3 + t*2;
      const correctness = 5 + t*3 + d*1;
      out.textContent = `Agility ${agility}/10 · Correctness ${correctness}/10 · Complexity ${complexity}/10`;
      drawBars(canvas, [agility, correctness, complexity], ['Agility','Correct','Complex']);
    }
    [unbundle, dataflow, transact].forEach(i=>i.addEventListener('change', recalc));
    recalc();
  }

  const labMounts = {
    'slo': mountSloLab,
    'datamodel': mountDataModelLab,
    'storage': mountStorageLab,
    'schema': mountSchemaLab,
    'replication': mountReplicationLab,
    'partition': mountPartitionLab,
    'txn': mountTxnLab,
    'time': mountTimeLab,
    'consensus': mountConsensusLab,
    'batch': mountBatchLab,
    'stream': mountStreamLab,
    'future': mountFutureLab,
  };

  function initLabs(){
    $$('.lab[data-lab]').forEach(root=>{
      const name = root.getAttribute('data-lab');
      const fn = labMounts[name];
      if(fn){
        try{ fn(root); }catch(err){ console.error('Lab mount failed:', name, err); }
      }
    });
  }

  // ---------- Boot ----------
  window.addEventListener('DOMContentLoaded', ()=>{
    initTheme();

    const toggle = $('#themeToggle');
    if(toggle){
      toggle.addEventListener('click', ()=>{
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }

    initIndexSearch();
    initActiveToc();
    initLabs();

    // ---------- Scroll progress ----------
    const bar = $('#scrollProgress');
    if(bar){
      const update = ()=>{
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - window.innerHeight);
        const pct = (window.scrollY / max) * 100;
        bar.style.width = pct.toFixed(2) + '%';
      };
      window.addEventListener('scroll', update, {passive:true});
      window.addEventListener('resize', update);
      update();
    }
  });

})();
