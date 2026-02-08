
/* ============================================================
   JCIP Interactive Atlas — client-side engine (no deps)
   Components:
     - RaceLab (atomicity / lost updates)
     - DeadlockLab (liveness)
     - HBExplorer (happens-before)
     - PoolLab (executor / queueing)
     - AmdahlLab (speedup)
     - CASLab (nonblocking + ABA)
   ============================================================ */

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a,b,t)=>a+(b-a)*t;

  function fmt(ms){ return `${ms.toFixed(0)}ms`; }
  function toast(msg){
    const el = $("#toast");
    if(!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(()=> el.classList.remove("show"), 2400);
  }

  // ---------- Search (index + chapter pages) ----------
  function initSearch(){
    const input = $("#globalSearch");
    if(!input) return;
    const cards = $$("[data-searchable]");
    const indexList = $$("#chaptersList [data-chapter-item]");
    function normalize(s){ return (s||"").toLowerCase().replace(/\s+/g," ").trim(); }

    function apply(q){
      const nq = normalize(q);
      const isEmpty = nq.length === 0;
      cards.forEach(c=>{
        const hay = normalize(c.getAttribute("data-searchable"));
        const show = isEmpty || hay.includes(nq);
        c.style.display = show ? "" : "none";
      });
      indexList.forEach(item=>{
        const hay = normalize(item.getAttribute("data-searchable"));
        const show = isEmpty || hay.includes(nq);
        item.style.display = show ? "" : "none";
      });
    }

    input.addEventListener("input", ()=> apply(input.value));
    document.addEventListener("keydown",(e)=>{
      if(e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey){
        const t = e.target;
        const isTyping = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
        if(!isTyping){
          e.preventDefault();
          input.focus();
          toast("Search: type to filter chapters & modules");
        }
      }
      if(e.key === "Escape" && document.activeElement === input){
        input.value = "";
        apply("");
        input.blur();
        toast("Search cleared");
      }
    });

    const hint = $("#searchHint");
    if(hint){ hint.addEventListener("click", ()=>{ input.focus(); toast("Tip: Press / to search anywhere"); }); }

    // Initial
    apply(input.value);
  }

  // ---------- Theme toggle + parent sync ----------
  function setTheme(mode){
    if(mode === "light"){
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
    }
  }

  function initThemeToggle(){
    const btn = $("#themeToggle");
    if(btn){
      btn.addEventListener("click", ()=>{
        document.body.classList.toggle("theme-light");
        toast(document.body.classList.contains("theme-light") ? "Light mode" : "Dark mode");
      });
    }

    // Sync theme with parent site (when embedded in iframe)
    window.addEventListener("message", (event)=>{
      const data = event.data || {};
      if(data.type !== "THEME_CHANGE") return;
      setTheme(data.theme === "light" ? "light" : "dark");
    });
  }

  // ---------- Canvas utilities ----------
  function fitCanvas(canvas){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const needW = Math.floor(w * dpr);
    const needH = Math.floor(h * dpr);
    if(canvas.width !== needW || canvas.height !== needH){
      canvas.width = needW;
      canvas.height = needH;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx, w, h, dpr};
  }

  function isLight(){ return document.body.classList.contains("theme-light"); }
  // Adaptive colors for canvas drawing (dark vs light)
  function cText(a){ return isLight() ? `rgba(15,23,42,${a||.92})` : `rgba(234,240,255,${a||.92})`; }
  function cBg(a){ return isLight() ? `rgba(15,23,42,${a||.08})` : `rgba(0,0,0,${a||.26})`; }
  function cStroke(a){ return isLight() ? `rgba(15,23,42,${a||.12})` : `rgba(255,255,255,${a||.10})`; }

  function drawGrid(ctx, w, h){
    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = isLight() ? "rgba(15,23,42,.10)" : "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    const step = 22;
    for(let x=0; x<=w; x+=step){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
    }
    for(let y=0; y<=h; y+=step){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }
    ctx.restore();
  }

  function badgeColor(kind){
    if(kind === "ok") return "rgba(49,208,170,.95)";
    if(kind === "warn") return "rgba(255,176,32,.95)";
    if(kind === "danger") return "rgba(255,77,109,.95)";
    return cText(.9);
  }

  function fillRoundedRect(ctx, x,y,w,h,r, fill){
    r = Math.min(r, w/2, h/2);
    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function strokeRoundedRect(ctx, x,y,w,h,r, stroke){
    r = Math.min(r, w/2, h/2);
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Component: RaceLab ----------
  function RaceLab(root){
    this.root = root;
    this.canvas = $("canvas", root);
    this.mode = $("select[data-field='mode']", root);
    this.iters = $("input[data-field='iters']", root);
    this.chaos = $("input[data-field='chaos']", root);
    this.runBtn = $("button[data-action='run']", root);
    this.resetBtn = $("button[data-action='reset']", root);
    this.out = $(".race-out", root);

    this.state = { steps: [], lost: 0, final: 0, expected: 0 };
    this._bind();
    this.render();
  }
  RaceLab.prototype._bind = function(){
    const rer = ()=> this.render();
    this.mode?.addEventListener("change", rer);
    this.iters?.addEventListener("input", rer);
    this.chaos?.addEventListener("input", rer);
    this.runBtn?.addEventListener("click", ()=> this.run());
    this.resetBtn?.addEventListener("click", ()=>{ this.state.steps=[]; this.state.lost=0; this.state.final=0; this.render(); toast("RaceLab reset"); });
    window.addEventListener("resize", ()=> this.draw());
  };

  RaceLab.prototype.run = function(){
    const mode = this.mode?.value || "unsafe";
    const n = clamp(parseInt(this.iters?.value || "200", 10), 10, 2500);
    const chaos = clamp(parseFloat(this.chaos?.value || "0.5"), 0, 1);

    // Model: two threads increment shared counter n times each => expected 2n.
    // Unsafe: increment = read -> add -> write. Interleavings can lose updates.
    // Lock: only one thread can do the 3 steps at a time.
    // Atomic: CAS loop (modeled; should never lose updates but may retry under chaos).
    let counter = 0;
    let lost = 0;
    let retries = 0;

    // Each thread has micro-ops queue.
    const T = [{name:"T1", i:0, phase:0, reg:0, blocked:false},
               {name:"T2", i:0, phase:0, reg:0, blocked:false}];
    let lockHeldBy = null;

    // build timeline steps for visualization
    const steps = [];
    function pushStep(tname, label, kind){
      steps.push({t:tname, label, kind, counter});
    }

    function tryLock(t){
      if(lockHeldBy === null){ lockHeldBy = t.name; return true; }
      return lockHeldBy === t.name;
    }
    function unlock(t){
      if(lockHeldBy === t.name) lockHeldBy = null;
    }

    // scheduler: pick next thread using chaos randomness
    let guard = 0;
    const maxOps = n*2*6 + 10000;
    while((T[0].i < n || T[1].i < n) && guard++ < maxOps){
      const pick = (Math.random() < chaos) ? (Math.random() < .5 ? 0 : 1) : (T[0].i <= T[1].i ? 0 : 1);
      const t = T[pick];

      if(t.i >= n) continue;

      if(mode === "lock"){
        if(!tryLock(t)){
          pushStep(t.name, "WAIT lock", "warn");
          continue;
        }
      }

      if(mode === "atomic"){
        // CAS loop: read current, compute next, attempt set.
        // Under chaos we may "fail" to simulate contention; then retry.
        const read = counter;
        pushStep(t.name, `READ ${read}`, "ok");
        const next = read + 1;
        pushStep(t.name, `CALC ${read}+1`, "ok");

        const failProb = chaos * 0.35; // higher chaos => more contention
        if(Math.random() < failProb){
          retries++;
          pushStep(t.name, `CAS FAIL (expected ${read})`, "warn");
          continue;
        }else{
          counter = next;
          pushStep(t.name, `CAS SET ${next}`, "ok");
          t.i++;
          continue;
        }
      }

      // unsafe or lock: perform micro-ops with interleavings via phase
      if(t.phase === 0){
        t.reg = counter;
        pushStep(t.name, `READ ${t.reg}`, "ok");
        t.phase = 1;
      }else if(t.phase === 1){
        t.reg = t.reg + 1;
        pushStep(t.name, `ADD -> ${t.reg}`, "ok");
        t.phase = 2;
      }else if(t.phase === 2){
        // Lost update if counter changed since read (and we overwrite).
        const before = counter;
        counter = t.reg;
        if(counter <= before){ lost++; pushStep(t.name, `WRITE ${counter} (lost!)`, "danger"); }
        else pushStep(t.name, `WRITE ${counter}`, "ok");
        t.phase = 0;
        t.i++;
        if(mode === "lock") unlock(t);
      }
    }

    this.state.steps = steps.slice(-220); // last steps for viz
    this.state.lost = lost;
    this.state.final = counter;
    this.state.expected = 2*n;
    this.state.retries = retries;
    this.draw();
    this._renderOut();
    toast(mode === "unsafe" ? "Ran unsafe interleavings" : mode === "lock" ? "Ran under mutual exclusion" : "Ran atomic (CAS) model");
  };

  RaceLab.prototype._renderOut = function(){
    if(!this.out) return;
    const s = this.state;
    const accuracy = s.expected ? (s.final / s.expected) : 1;
    const drift = s.expected - s.final;
    const kind = drift === 0 ? "ok" : drift < 0 ? "warn" : "danger";
    const mode = this.mode?.value || "unsafe";
    this.out.innerHTML = `
      <div class="kv">
        <span class="k">Mode</span><span class="v">${mode}</span>
        <span class="k">Expected</span><span class="v">${s.expected}</span>
        <span class="k">Final</span><span class="v">${s.final}</span>
        <span class="k">Lost</span><span class="v">${s.lost}</span>
        <span class="k">Retries</span><span class="v">${s.retries||0}</span>
      </div>
      <div class="divider"></div>
      <div class="note"><strong>Interpretation:</strong> The shared counter should end at <b>${s.expected}</b>.
      ${drift === 0 ? "No drift: linearizability preserved." :
        `Drift of <b>${drift}</b> indicates lost updates (non-atomic RMW).` }
      </div>
    `;
    const badge = $(".race-badge", this.root);
    if(badge){
      badge.textContent = drift === 0 ? "linearizable" : "lost updates";
      badge.className = `badge ${kind} race-badge`;
    }
  };

  RaceLab.prototype.render = function(){
    // lightweight re-render: update labels
    const it = $("#itersVal", this.root);
    const ch = $("#chaosVal", this.root);
    if(it) it.textContent = `${this.iters?.value || 200}`;
    if(ch) ch.textContent = `${Math.round((parseFloat(this.chaos?.value||.5))*100)}%`;
    this._renderOut();
    this.draw();
  };

  RaceLab.prototype.draw = function(){
    if(!this.canvas) return;
    const {ctx, w, h} = fitCanvas(this.canvas);
    ctx.clearRect(0,0,w,h);
    drawGrid(ctx,w,h);

    // lanes
    const pad = 16;
    const laneH = (h - pad*2) / 2;
    const laneY = [pad, pad + laneH];
    const laneNames = ["T1", "T2"];
    ctx.save();
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillStyle = cText(.85);
    for(let i=0;i<2;i++){
      fillRoundedRect(ctx, pad, laneY[i]+6, 88, 20, 10, cBg(.28));
      strokeRoundedRect(ctx, pad, laneY[i]+6, 88, 20, 10, cStroke(.10));
      ctx.fillText(laneNames[i], pad+14, laneY[i]+21);
    }
    ctx.restore();

    const steps = this.state.steps || [];
    if(steps.length === 0){
      ctx.save();
      ctx.fillStyle = "rgba(167,178,214,.9)";
      ctx.font = "14px "+getComputedStyle(document.body).fontFamily;
      ctx.fillText("Press Run to generate an interleaving timeline.", pad+110, pad+24);
      ctx.restore();
      return;
    }
    // draw steps as blocks
    const maxBlocks = steps.length;
    const x0 = pad + 110;
    const x1 = w - pad;
    const usableW = Math.max(1, x1 - x0);
    const bw = usableW / maxBlocks;
    for(let i=0;i<steps.length;i++){
      const s = steps[i];
      const lane = (s.t === "T1") ? 0 : 1;
      const x = x0 + i*bw + 1;
      const y = laneY[lane] + 40;
      const blockH = laneH - 56;
      const color = (s.kind === "danger") ? "rgba(255,77,109,.75)" :
                    (s.kind === "warn") ? "rgba(255,176,32,.65)" :
                    "rgba(0,212,255,.35)";
      fillRoundedRect(ctx, x, y, Math.max(2, bw-2), blockH, 6, color);
    }
    // overlay text labels for last few steps
    ctx.save();
    ctx.fillStyle = cText(.88);
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    const last = steps.slice(-6);
    const textX = pad + 110;
    const baseY = pad + 30;
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    last.forEach((s, idx)=>{
      ctx.fillStyle = (s.kind === "danger") ? "rgba(255,77,109,.92)" :
                      (s.kind === "warn") ? "rgba(255,176,32,.92)" :
                      cText(.88);
      ctx.fillText(`${s.t}: ${s.label}`, textX, baseY + idx*16);
    });
    ctx.restore();
  };

  // ---------- Component: DeadlockLab ----------
  function DeadlockLab(root){
    this.root = root;
    this.canvas = $("canvas", root);
    this.orderA = $("select[data-field='orderA']", root);
    this.orderB = $("select[data-field='orderB']", root);
    this.stepBtn = $("button[data-action='step']", root);
    this.runBtn = $("button[data-action='run']", root);
    this.resetBtn = $("button[data-action='reset']", root);
    this.out = $(".deadlock-out", root);

    this.state = null;
    this.reset();
    this._bind();
    this.draw();
    this._renderOut();
  }

  DeadlockLab.prototype._bind = function(){
    const r = ()=>{ this.reset(); this.draw(); this._renderOut(); };
    this.orderA?.addEventListener("change", r);
    this.orderB?.addEventListener("change", r);
    this.stepBtn?.addEventListener("click", ()=> this.step());
    this.runBtn?.addEventListener("click", ()=> this.run());
    this.resetBtn?.addEventListener("click", ()=>{ this.reset(); this.draw(); this._renderOut(); toast("DeadlockLab reset"); });
    window.addEventListener("resize", ()=> this.draw());
  };

  DeadlockLab.prototype.reset = function(){
    const oa = (this.orderA?.value || "L1>L2").split(">");
    const ob = (this.orderB?.value || "L2>L1").split(">");
    this.state = {
      locks: {L1:null, L2:null},
      A: {name:"A", order: oa, pc:0, holds:[] , waits:null, done:false},
      B: {name:"B", order: ob, pc:0, holds:[] , waits:null, done:false},
      trace: [],
      deadlock:false
    };
    this.state.trace.push({msg:`A order ${oa.join(" → ")}, B order ${ob.join(" → ")}`});
  };

  DeadlockLab.prototype._tryAcquire = function(T, L){
    const s = this.state;
    if(s.locks[L] === null){
      s.locks[L] = T.name;
      T.holds.push(L);
      T.waits = null;
      s.trace.push({t:T.name, msg:`acquired ${L}`, kind:"ok"});
      return true;
    }
    if(s.locks[L] === T.name) return true;
    T.waits = L;
    s.trace.push({t:T.name, msg:`blocked on ${L}`, kind:"warn"});
    return false;
  };

  DeadlockLab.prototype._releaseAll = function(T){
    const s = this.state;
    T.holds.forEach(L=>{ if(s.locks[L] === T.name) s.locks[L] = null; });
    T.holds = [];
  };

  DeadlockLab.prototype._advance = function(T){
    if(T.done) return;
    const want = T.order[T.pc];
    if(!want){ T.done = true; this.state.trace.push({t:T.name, msg:`completed critical section`, kind:"ok"}); this._releaseAll(T); return; }
    const ok = this._tryAcquire(T, want);
    if(ok) T.pc++;
  };

  DeadlockLab.prototype._checkDeadlock = function(){
    const s = this.state;
    const A = s.A, B = s.B;
    const dead = !!(A.waits && B.waits &&
                    A.waits === (B.holds[0] || null) &&
                    B.waits === (A.holds[0] || null));
    // More general: cycle in waits-for graph of size 2.
    const holds = (t)=> new Set(t.holds);
    const cycle = A.waits && B.waits &&
      holds(A).has(B.waits) && holds(B).has(A.waits);
    s.deadlock = !!(dead || cycle);
    if(s.deadlock){
      s.trace.push({msg:"DEADLOCK: circular wait detected", kind:"danger"});
    }
  };

  DeadlockLab.prototype.step = function(){
    const s = this.state;
    if(s.deadlock){ toast("Deadlock already reached — reset or change lock ordering"); return; }
    // alternate A/B steps to show classic deadlock scenario
    const next = (s.trace.filter(x=>x.t).length % 2 === 0) ? s.A : s.B;
    this._advance(next);
    this._checkDeadlock();
    this.draw();
    this._renderOut();
  };

  DeadlockLab.prototype.run = function(){
    const s = this.state;
    for(let i=0;i<14 && !s.deadlock && (!s.A.done || !s.B.done);i++){
      this.step();
    }
    toast(s.deadlock ? "Deadlock reproduced" : "Completed without deadlock");
  };

  DeadlockLab.prototype._renderOut = function(){
    const s = this.state;
    const badge = $(".deadlock-badge", this.root);
    if(badge){
      badge.textContent = s.deadlock ? "deadlock" : "progressing";
      badge.className = `badge ${s.deadlock ? "danger":"ok"} deadlock-badge`;
    }
    if(!this.out) return;
    const L1 = s.locks.L1 || "free";
    const L2 = s.locks.L2 || "free";
    const A = s.A, B = s.B;
    const hint = s.deadlock
      ? "Fixes: enforce global lock ordering (always L1 then L2), use tryLock/timeouts, or eliminate nested locking."
      : "Try choosing opposite acquisition orders to create a circular wait.";
    const last = s.trace.slice(-6).map(x=>{
      const c = x.kind ? badgeColor(x.kind) : cText(.85);
      const who = x.t ? `${x.t}: ` : "";
      return `<div style="font-family:var(--mono);font-size:12px;color:${c}">${who}${x.msg}</div>`;
    }).join("");
    this.out.innerHTML = `
      <table class="table" style="margin-bottom:12px">
        <tr><th>Lock</th><th>Owner</th><th>Meaning</th></tr>
        <tr><td><b>L1</b></td><td>${L1}</td><td>Monitor/Mutex A</td></tr>
        <tr><td><b>L2</b></td><td>${L2}</td><td>Monitor/Mutex B</td></tr>
      </table>
      <div class="callout">
        <div class="icon">⇄</div>
        <div class="t"><b>Waits-for graph</b>: each thread holds some locks and may wait on the next lock in its order. A deadlock is a cycle in this graph. <br/><span style="color:var(--text)">${hint}</span></div>
      </div>
      <div class="divider"></div>
      ${last}
    `;
  };

  DeadlockLab.prototype.draw = function(){
    if(!this.canvas) return;
    const {ctx, w, h} = fitCanvas(this.canvas);
    ctx.clearRect(0,0,w,h);
    drawGrid(ctx,w,h);

    const s = this.state;
    const pad = 16;

    // Nodes: A, B, L1, L2
    const nodes = [
      {id:"A", x: pad+90, y: h*0.30},
      {id:"B", x: pad+90, y: h*0.70},
      {id:"L1", x: w-pad-110, y: h*0.35},
      {id:"L2", x: w-pad-110, y: h*0.65},
    ];

    function nodeBy(id){ return nodes.find(n=>n.id===id); }

    function drawNode(n, kind){
      const fill = kind === "thread" ? "rgba(124,92,255,.20)" : "rgba(0,212,255,.16)";
      const stroke = kind === "thread" ? "rgba(124,92,255,.55)" : "rgba(0,212,255,.45)";
      fillRoundedRect(ctx, n.x-56, n.y-18, 112, 36, 14, fill);
      strokeRoundedRect(ctx, n.x-56, n.y-18, 112, 36, 14, stroke);
      ctx.save();
      ctx.fillStyle = cText(.92);
      ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.id, n.x, n.y);
      ctx.restore();
    }

    nodes.forEach(n=> drawNode(n, n.id==="A"||n.id==="B" ? "thread":"lock"));

    function arrow(from,to,color,label){
      const a = nodeBy(from), b = nodeBy(to);
      if(!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.max(1, Math.hypot(dx,dy));
      const ux = dx/len, uy = dy/len;
      const sx = a.x + ux*60;
      const sy = a.y + uy*18;
      const ex = b.x - ux*70;
      const ey = b.y - uy*18;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx,sy);
      ctx.lineTo(ex,ey);
      ctx.stroke();

      // head
      ctx.fillStyle = color;
      ctx.beginPath();
      const head = 8;
      ctx.moveTo(ex,ey);
      ctx.lineTo(ex - ux*head - uy*head*0.7, ey - uy*head + ux*head*0.7);
      ctx.lineTo(ex - ux*head + uy*head*0.7, ey - uy*head - ux*head*0.7);
      ctx.closePath();
      ctx.fill();

      // label
      if(label){
        ctx.fillStyle = cText(.85);
        ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        const mx = (sx+ex)/2, my=(sy+ey)/2;
        fillRoundedRect(ctx, mx-42, my-12, 84, 24, 10, cBg(.28));
        strokeRoundedRect(ctx, mx-42, my-12, 84, 24, 10, cStroke(.10));
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(label, mx, my+1);
      }
      ctx.restore();
    }

    // holds: lock -> thread edges (ownership)
    const ownerColor = "rgba(49,208,170,.85)";
    if(s.locks.L1){ arrow("L1", s.locks.L1, ownerColor, "holds"); }
    if(s.locks.L2){ arrow("L2", s.locks.L2, ownerColor, "holds"); }

    // waits: thread -> lock edges
    const waitColor = s.deadlock ? "rgba(255,77,109,.90)" : "rgba(255,176,32,.85)";
    if(s.A.waits){ arrow("A", s.A.waits, waitColor, "wait"); }
    if(s.B.waits){ arrow("B", s.B.waits, waitColor, "wait"); }

    if(s.deadlock){
      ctx.save();
      ctx.fillStyle = "rgba(255,77,109,.92)";
      ctx.font = "700 14px "+getComputedStyle(document.body).fontFamily;
      ctx.fillText("Deadlock: circular wait", pad, pad+18);
      ctx.restore();
    }
  };

  // ---------- Component: Happens-Before Explorer ----------
  function HBExplorer(root){
    this.root = root;
    this.canvas = $("canvas", root);
    this.scenario = $("select[data-field='scenario']", root);
    this.tog = {
      po: $("input[data-edge='po']", root),
      lock: $("input[data-edge='lock']", root),
      vol: $("input[data-edge='vol']", root),
      start: $("input[data-edge='start']", root),
      join: $("input[data-edge='join']", root),
      final: $("input[data-edge='final']", root),
    };
    this.out = $(".hb-out", root);
    this._bind();
    this.render();
  }

  HBExplorer.prototype._bind = function(){
    const r = ()=> this.render();
    this.scenario?.addEventListener("change", r);
    Object.values(this.tog).forEach(x=> x?.addEventListener("change", r));
    window.addEventListener("resize", ()=> this.draw());
  };

  HBExplorer.prototype._model = function(){
    // Each scenario defines nodes and which edges are relevant.
    // We'll compute reachability in directed graph and decide "canReadSeeWrite".
    const scenario = this.scenario?.value || "plain";
    // nodes: w (write), r (read), plus hb primitives
    const base = {
      nodes: [
        {id:"T1.W", label:"T1: write x=1"},
        {id:"T1.U", label:"T1: publish"},
        {id:"T2.V", label:"T2: observe"},
        {id:"T2.R", label:"T2: read x"},
      ],
      want: {from:"T1.W", to:"T2.R"},
      notes: [],
      defaults: {po:true, lock:false, vol:false, start:false, join:false, final:false}
    };

    if(scenario === "monitor"){
      base.nodes = [
        {id:"T1.L+", label:"T1: lock(m)"},
        {id:"T1.W", label:"T1: write x=1"},
        {id:"T1.L-", label:"T1: unlock(m)"},
        {id:"T2.L+", label:"T2: lock(m)"},
        {id:"T2.R", label:"T2: read x"},
        {id:"T2.L-", label:"T2: unlock(m)"},
      ];
      base.want = {from:"T1.W", to:"T2.R"};
      base.notes = ["Monitor unlock happens-before subsequent monitor lock on same monitor."];
      base.defaults = {po:true, lock:true, vol:false, start:false, join:false, final:false};
    }

    if(scenario === "volatile"){
      base.nodes = [
        {id:"T1.W", label:"T1: write x=1"},
        {id:"T1.Vw", label:"T1: volatile write v=1"},
        {id:"T2.Vr", label:"T2: volatile read v"},
        {id:"T2.R", label:"T2: read x"},
      ];
      base.want = {from:"T1.W", to:"T2.R"};
      base.notes = ["A volatile write happens-before every subsequent volatile read of the same variable."];
      base.defaults = {po:true, lock:false, vol:true, start:false, join:false, final:false};
    }

    if(scenario === "startJoin"){
      base.nodes = [
        {id:"Main.W", label:"Main: write x=1"},
        {id:"Main.S", label:"Main: start(T)"},
        {id:"T.R", label:"T: read x"},
        {id:"T.E", label:"T: exit"},
        {id:"Main.J", label:"Main: join(T)"},
        {id:"Main.R", label:"Main: read y"},
      ];
      base.want = {from:"Main.W", to:"T.R"};
      base.notes = ["Thread start establishes happens-before to actions in started thread.",
                    "Thread completion happens-before successful join."];
      base.defaults = {po:true, lock:false, vol:false, start:true, join:true, final:false};
    }

    if(scenario === "finalField"){
      base.nodes = [
        {id:"T1.C", label:"T1: new Obj(final f=42)"},
        {id:"T1.P", label:"T1: publish ref"},
        {id:"T2.O", label:"T2: observe ref"},
        {id:"T2.R", label:"T2: read final f"},
      ];
      base.want = {from:"T1.C", to:"T2.R"};
      base.notes = ["Final-field semantics: if object is safely published, reads of final fields see initialized values."];
      base.defaults = {po:true, lock:false, vol:false, start:false, join:false, final:true};
    }

    return base;
  };

  HBExplorer.prototype._edges = function(model){
    // Edges are added based on toggles.
    const enabled = (k)=> !!(this.tog[k]?.checked);

    const edges = [];
    const ids = model.nodes.map(n=>n.id);

    // Program order: within each thread, add edge between sequential actions.
    if(enabled("po")){
      const threadGroups = {};
      ids.forEach(id=>{
        const t = id.split(".")[0];
        (threadGroups[t] ||= []).push(id);
      });
      Object.keys(threadGroups).forEach(t=>{
        const arr = threadGroups[t];
        for(let i=0;i<arr.length-1;i++){
          edges.push({from:arr[i], to:arr[i+1], kind:"po"});
        }
      });
    }

    // Scenario-specific hb edges
    const scen = this.scenario?.value || "plain";
    if(scen === "monitor" && enabled("lock")){
      edges.push({from:"T1.L-", to:"T2.L+", kind:"hb"});
    }
    if(scen === "volatile" && enabled("vol")){
      edges.push({from:"T1.Vw", to:"T2.Vr", kind:"hb"});
    }
    if(scen === "startJoin"){
      if(enabled("start")) edges.push({from:"Main.S", to:"T.R", kind:"hb"});
      if(enabled("join")) edges.push({from:"T.E", to:"Main.J", kind:"hb"});
    }
    if(scen === "finalField" && enabled("final")){
      edges.push({from:"T1.C", to:"T2.R", kind:"hb"}); // simplified safe-publication consequence
    }
    return edges;
  };

  HBExplorer.prototype._reachable = function(nodes, edges, from, to){
    const adj = new Map(nodes.map(n=>[n.id, []]));
    edges.forEach(e=> adj.get(e.from)?.push(e.to));
    const seen = new Set([from]);
    const q = [from];
    while(q.length){
      const u = q.shift();
      if(u === to) return true;
      const nbrs = adj.get(u) || [];
      for(const v of nbrs){
        if(!seen.has(v)){ seen.add(v); q.push(v); }
      }
    }
    return false;
  };

  HBExplorer.prototype.render = function(){
    // Apply defaults on scenario change if user hasn't manually touched
    const model = this._model();
    // ensure toggles exist and set defaults if toggles are currently null/undefined or on first run
    if(!this._inited){
      for(const k in model.defaults){
        if(this.tog[k]) this.tog[k].checked = !!model.defaults[k];
      }
      this._inited = true;
    }
    const edges = this._edges(model);
    this.state = {model, edges};
    this.draw();
    this._renderOut();
  };

  HBExplorer.prototype._renderOut = function(){
    if(!this.out) return;
    const {model, edges} = this.state;
    const can = this._reachable(model.nodes, edges, model.want.from, model.want.to);
    const badge = $(".hb-badge", this.root);
    if(badge){
      badge.textContent = can ? "visible" : "not guaranteed";
      badge.className = `badge ${can ? "ok":"warn"} hb-badge`;
    }

    const expl = can
      ? "There is a happens-before path from the write to the read, so the read is guaranteed to observe the write (or a later one)."
      : "No happens-before path: the read may observe a stale value due to reordering, caching, or lack of publication.";

    const edgeList = edges.map(e=>`<li><span style="font-family:var(--mono)">${e.from}</span> → <span style="font-family:var(--mono)">${e.to}</span> <span style="color:rgba(167,178,214,.85)">(${e.kind})</span></li>`).join("");
    const notes = (model.notes||[]).map(n=>`<div class="note" style="margin-top:10px">${n}</div>`).join("");

    this.out.innerHTML = `
      <div class="callout">
        <div class="icon">HB</div>
        <div class="t"><b>Visibility claim</b>: ${expl}</div>
      </div>
      <div class="divider"></div>
      <div style="color:var(--text); font-weight:700; margin-bottom:8px">Edges currently active</div>
      <ul style="margin:0; padding-left:18px; color:rgba(167,178,214,.92); line-height:1.65">${edgeList || "<li>(none)</li>"}</ul>
      ${notes}
    `;
  };

  HBExplorer.prototype.draw = function(){
    if(!this.canvas) return;
    const {ctx, w, h} = fitCanvas(this.canvas);
    ctx.clearRect(0,0,w,h);
    drawGrid(ctx,w,h);

    const {model, edges} = this.state;
    const nodes = model.nodes;
    // Layout: left-to-right stages
    const pad = 20;
    const cols = Math.max(2, nodes.length);
    const xStep = (w - pad*2) / (nodes.length-1 || 1);
    const yMid = h/2;
    const yAlt = 74;

    const pos = {};
    nodes.forEach((n, i)=>{
      const x = pad + i*xStep;
      const y = (i%2===0) ? (yMid - yAlt) : (yMid + yAlt);
      pos[n.id] = {x,y};
    });

    function drawEdge(e){
      const a = pos[e.from], b = pos[e.to];
      if(!a || !b) return;
      const color = e.kind === "hb" ? "rgba(0,212,255,.85)" : "rgba(124,92,255,.75)";
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      // curve
      const mx = (a.x+b.x)/2;
      const my = (a.y+b.y)/2;
      const ctrlY = (a.y < b.y) ? (my - 60) : (my + 60);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, ctrlY, b.x, b.y);
      ctx.stroke();
      // arrow head
      const t = 0.95;
      const px = lerp(a.x, b.x, t);
      const py = lerp(a.y, b.y, t);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.fillStyle = color;
      ctx.beginPath();
      const head = 8;
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - Math.cos(angle)*head - Math.sin(angle)*head*0.65, b.y - Math.sin(angle)*head + Math.cos(angle)*head*0.65);
      ctx.lineTo(b.x - Math.cos(angle)*head + Math.sin(angle)*head*0.65, b.y - Math.sin(angle)*head - Math.cos(angle)*head*0.65);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    edges.forEach(drawEdge);

    // nodes
    nodes.forEach(n=>{
      const p = pos[n.id];
      const isWrite = n.id.endsWith(".W");
      const isRead = n.id.endsWith(".R");
      const fill = isWrite ? "rgba(49,208,170,.14)" : isRead ? "rgba(255,176,32,.12)" : cBg(.20);
      const stroke = isWrite ? "rgba(49,208,170,.55)" : isRead ? "rgba(255,176,32,.55)" : cStroke(.12);
      fillRoundedRect(ctx, p.x-88, p.y-22, 176, 44, 14, fill);
      strokeRoundedRect(ctx, p.x-88, p.y-22, 176, 44, 14, stroke);
      ctx.save();
      ctx.fillStyle = cText(.92);
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.label, p.x, p.y+1);
      ctx.restore();
    });

    // highlight query path endpoints
    ctx.save();
    ctx.fillStyle = cText(.86);
    ctx.font = "700 13px "+getComputedStyle(document.body).fontFamily;
    ctx.fillText("Query: can the read see the write?", pad, pad+16);
    ctx.restore();
  };

  // ---------- Component: PoolLab ----------
  function PoolLab(root){
    this.root = root;
    this.canvas = $("canvas", root);
    this.workers = $("input[data-field='workers']", root);
    this.arrival = $("input[data-field='arrival']", root);
    this.service = $("input[data-field='service']", root);
    this.queue = $("input[data-field='queue']", root);
    this.policy = $("select[data-field='policy']", root);
    this.runBtn = $("button[data-action='run']", root);
    this.out = $(".pool-out", root);

    this.series = null;
    this._bind();
    this.simulate();
  }

  PoolLab.prototype._bind = function(){
    const r = ()=> this.simulate();
    [this.workers,this.arrival,this.service,this.queue].forEach(el=> el?.addEventListener("input", r));
    this.policy?.addEventListener("change", r);
    this.runBtn?.addEventListener("click", ()=>{ this.simulate(true); toast("Pool simulation re-ran"); });
    window.addEventListener("resize", ()=> this.draw());
  };

  PoolLab.prototype.simulate = function(force){
    const W = clamp(parseInt(this.workers?.value||"4",10),1,64);
    const lambda = clamp(parseFloat(this.arrival?.value||"40"),1,2000); // tasks/sec
    const svcMs = clamp(parseFloat(this.service?.value||"30"),1,1000); // ms per task per worker
    const Qmax = clamp(parseInt(this.queue?.value||"100",10),0,5000);
    const policy = this.policy?.value||"abort"; // abort|callerRuns|discard|discardOldest

    const horizon = 12.0; // seconds
    const dt = 0.05; // 50ms step
    const steps = Math.floor(horizon/dt);

    let q = 0;
    let busy = 0; // workers busy count approximated by utilization
    let completed = 0;
    let rejected = 0;
    let callerRuns = 0;
    let latencyEwma = 0;

    // We model as fluid queue with service capacity W*(1000/svcMs) tasks/sec
    const mu = W * (1000.0/svcMs);

    const qSeries = [];
    const rejSeries = [];
    const utilSeries = [];

    for(let i=0;i<steps;i++){
      const t = i*dt;

      // arrivals
      const arrivals = lambda*dt;
      q += arrivals;

      // handle capacity + queue limit
      if(Qmax === 0){
        // direct handoff: if busy, apply policy
        // We'll approximate by considering instantaneous offered load.
        const offered = lambda;
        const cap = mu;
        if(offered > cap){
          const excess = (offered - cap)*dt;
          // policy impacts
          if(policy === "callerRuns"){
            // excess executed by callers at latency penalty
            callerRuns += excess;
            completed += excess;
          }else if(policy === "discard"){
            rejected += excess;
          }else if(policy === "discardOldest"){
            rejected += excess;
          }else{
            rejected += excess;
          }
        }
        // accepted load is min(offered,cap)
        const accepted = Math.min(offered, cap)*dt;
        completed += accepted;
        // utilization approximated
        const util = clamp(offered/cap, 0, 1);
        utilSeries.push(util);
        qSeries.push(0);
        rejSeries.push(rejected);
        continue;
      }

      if(q > Qmax){
        const overflow = q - Qmax;
        if(policy === "discard"){
          rejected += overflow;
          q = Qmax;
        } else if(policy === "discardOldest"){
          // drop oldest: also overflow
          rejected += overflow;
          q = Qmax;
        } else if(policy === "callerRuns"){
          callerRuns += overflow;
          completed += overflow;
          q = Qmax;
        } else { // abort
          rejected += overflow;
          q = Qmax;
        }
      }

      // service
      const served = Math.min(q, mu*dt);
      q -= served;
      completed += served;

      // approximate utilization based on demand
      const util = clamp((lambda / mu), 0, 1);
      utilSeries.push(util);

      // latency approximation (Little's law): L = Wq / λ_eff
      const lambdaEff = Math.max(1e-6, (lambda - (rejected/dt))/1.0);
      const est = (q / Math.max(1e-6, Math.min(lambda, mu))) * 1000; // ms
      latencyEwma = latencyEwma*0.9 + est*0.1;

      qSeries.push(q);
      rejSeries.push(rejected);
    }

    const throughput = completed/horizon;
    const rejectRate = rejected/horizon;
    const utilAvg = utilSeries.reduce((a,b)=>a+b,0)/utilSeries.length;
    this.series = {qSeries, rejSeries, utilSeries, W, lambda, svcMs, Qmax, policy, mu, throughput, rejectRate, callerRuns, utilAvg, latencyMs: latencyEwma};
    this._renderOut();
    this.draw();
  };

  PoolLab.prototype._renderOut = function(){
    if(!this.out || !this.series) return;
    const s = this.series;
    const sat = s.lambda / s.mu;
    const satKind = sat < 0.75 ? "ok" : sat < 1.0 ? "warn" : "danger";
    const badge = $(".pool-badge", this.root);
    if(badge){
      badge.textContent = sat < 1 ? "stable" : "saturated";
      badge.className = `badge ${satKind} pool-badge`;
    }
    const tip = sat < 1
      ? "λ < μ: queue will be bounded (in expectation). Tune queue for burstiness, not for steady overload."
      : "λ ≥ μ: the system is overloaded. Add capacity, reduce work per task, shed load, or push back at the edge.";

    this.out.innerHTML = `
      <div class="kv">
        <span class="k">Capacity μ</span><span class="v">${s.mu.toFixed(1)} tasks/s</span>
        <span class="k">Offered λ</span><span class="v">${s.lambda.toFixed(1)} tasks/s</span>
        <span class="k">Utilization</span><span class="v">${Math.round(s.utilAvg*100)}%</span>
        <span class="k">Throughput</span><span class="v">${s.throughput.toFixed(1)} tasks/s</span>
        <span class="k">Rejected</span><span class="v">${s.rejectRate.toFixed(1)} tasks/s</span>
        <span class="k">Est Latency</span><span class="v">${s.latencyMs.toFixed(0)}ms</span>
      </div>
      <div class="divider"></div>
      <div class="note"><strong>Queueing intuition:</strong> In steady state, Little’s Law suggests latency grows roughly with queue length. <br/>${tip}</div>
    `;
    const fields = [
      ["workersVal", s.W],
      ["arrivalVal", s.lambda],
      ["serviceVal", `${s.svcMs}ms`],
      ["queueVal", s.Qmax],
    ];
    fields.forEach(([id,val])=>{
      const el = $("#"+id, this.root);
      if(el) el.textContent = `${val}`;
    });
  };

  PoolLab.prototype.draw = function(){
    if(!this.canvas || !this.series) return;
    const {ctx, w, h} = fitCanvas(this.canvas);
    ctx.clearRect(0,0,w,h);
    drawGrid(ctx,w,h);

    const s = this.series;
    const pad = 18;
    const plotX0 = pad;
    const plotY0 = pad + 18;
    const plotW = w - pad*2;
    const plotH = h - pad*2 - 18;

    // axes label
    ctx.save();
    ctx.fillStyle = cText(.86);
    ctx.font = "700 13px "+getComputedStyle(document.body).fontFamily;
    ctx.fillText("Queue depth over time (simulated)", pad, pad+14);
    ctx.restore();

    // Normalize series
    const q = s.qSeries;
    const maxQ = Math.max(10, ...q);
    // line
    ctx.save();
    ctx.strokeStyle = "rgba(0,212,255,.90)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    q.forEach((v,i)=>{
      const x = plotX0 + (i/(q.length-1))*plotW;
      const y = plotY0 + plotH - (v/maxQ)*plotH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.restore();

    // capacity line: show saturation threshold at Qmax maybe
    if(s.Qmax > 0){
      const yq = plotY0 + plotH - (s.Qmax/maxQ)*plotH;
      ctx.save();
      ctx.strokeStyle = "rgba(255,176,32,.65)";
      ctx.setLineDash([6,6]);
      ctx.beginPath(); ctx.moveTo(plotX0,yq); ctx.lineTo(plotX0+plotW,yq); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,176,32,.85)";
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillText(`Qmax=${s.Qmax}`, plotX0+8, Math.max(plotY0+12, yq-8));
      ctx.restore();
    }

    // right side mini legend
    ctx.save();
    fillRoundedRect(ctx, w-pad-180, pad+10, 172, 66, 14, cBg(.26));
    strokeRoundedRect(ctx, w-pad-180, pad+10, 172, 66, 14, cStroke(.10));
    ctx.fillStyle = cText(.90);
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(`μ = ${s.mu.toFixed(1)} /s`, w-pad-170, pad+34);
    ctx.fillText(`λ = ${s.lambda.toFixed(1)} /s`, w-pad-170, pad+52);
    ctx.fillText(`policy = ${s.policy}`, w-pad-170, pad+70);
    ctx.restore();
  };

  // ---------- Component: AmdahlLab ----------
  function AmdahlLab(root){
    this.root = root;
    this.canvas = $("canvas", root);
    this.p = $("input[data-field='p']", root);
    this.n = $("input[data-field='n']", root);
    this.out = $(".amdahl-out", root);
    this._bind();
    this.render();
  }
  AmdahlLab.prototype._bind = function(){
    const r = ()=> this.render();
    this.p?.addEventListener("input", r);
    this.n?.addEventListener("input", r);
    window.addEventListener("resize", ()=> this.draw());
  };
  AmdahlLab.prototype.render = function(){
    const p = clamp(parseFloat(this.p?.value||"0.9"), 0, 0.999);
    const n = clamp(parseInt(this.n?.value||"8",10), 1, 256);
    const speed = 1 / ((1-p) + (p/n));
    const eff = speed / n;
    const max = 1 / (1-p);
    this.state = {p,n,speed,eff,max};
    const pv = $("#pVal", this.root);
    const nv = $("#nVal", this.root);
    if(pv) pv.textContent = `${Math.round(p*100)}%`;
    if(nv) nv.textContent = `${n}`;
    const badge = $(".amdahl-badge", this.root);
    if(badge){
      const kind = speed < 3 ? "warn" : "ok";
      badge.textContent = `speedup ×${speed.toFixed(2)}`;
      badge.className = `badge ${kind} amdahl-badge`;
    }
    if(this.out){
      this.out.innerHTML = `
        <div class="kv">
          <span class="k">Parallel fraction p</span><span class="v">${(p*100).toFixed(1)}%</span>
          <span class="k">Cores n</span><span class="v">${n}</span>
          <span class="k">Speedup</span><span class="v">×${speed.toFixed(2)}</span>
          <span class="k">Efficiency</span><span class="v">${(eff*100).toFixed(0)}%</span>
          <span class="k">Upper bound</span><span class="v">×${max.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="note"><strong>Takeaway:</strong> The serial fraction (1−p) sets a hard ceiling. If 10% is serial, speedup can never exceed ×10 — no matter how many cores you add.</div>
      `;
    }
    this.draw();
  };
  AmdahlLab.prototype.draw = function(){
    if(!this.canvas || !this.state) return;
    const {ctx,w,h} = fitCanvas(this.canvas);
    ctx.clearRect(0,0,w,h);
    drawGrid(ctx,w,h);

    const pad = 18;
    ctx.save();
    ctx.fillStyle=cText(.86);
    ctx.font = "700 13px "+getComputedStyle(document.body).fontFamily;
    ctx.fillText("Amdahl’s Law (speedup vs cores)", pad, pad+14);
    ctx.restore();

    const plotX0=pad, plotY0=pad+20, plotW=w-pad*2, plotH=h-pad*2-20;
    const p = this.state.p;
    const maxSpeed = Math.min(64, 1/((1-p) + (p/256)));
    const Nmax = 64;

    // curve
    ctx.save();
    ctx.strokeStyle="rgba(124,92,255,.92)";
    ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=1;i<=Nmax;i++){
      const s = 1/((1-p)+(p/i));
      const x = plotX0 + ((i-1)/(Nmax-1))*plotW;
      const y = plotY0 + plotH - (s/maxSpeed)*plotH;
      if(i===1) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.restore();

    // marker for chosen n
    const n = clamp(this.state.n, 1, Nmax);
    const sN = 1/((1-p)+(p/n));
    const mx = plotX0 + ((n-1)/(Nmax-1))*plotW;
    const my = plotY0 + plotH - (sN/maxSpeed)*plotH;
    ctx.save();
    fillRoundedRect(ctx, mx-6, my-6, 12, 12, 6, "rgba(0,212,255,.90)");
    ctx.fillStyle=cText(.92);
    ctx.font="12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(`n=${n}, ×${sN.toFixed(2)}`, mx+10, my-10);
    ctx.restore();

    // ceiling line
    const ceiling = 1/(1-p);
    const cy = plotY0 + plotH - (ceiling/maxSpeed)*plotH;
    ctx.save();
    ctx.strokeStyle="rgba(255,176,32,.70)";
    ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.moveTo(plotX0, cy); ctx.lineTo(plotX0+plotW, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle="rgba(255,176,32,.90)";
    ctx.font="12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(`ceiling ×${ceiling.toFixed(2)}`, plotX0+8, Math.max(plotY0+14, cy-8));
    ctx.restore();
  };

  // ---------- Component: CASLab (ABA) ----------
  function CASLab(root){
    this.root = root;
    this.canvas = $("canvas", root);
    this.contention = $("input[data-field='cont']", root);
    this.withStamp = $("input[data-field='stamp']", root);
    this.runBtn = $("button[data-action='run']", root);
    this.out = $(".cas-out", root);
    this.state = {steps:[]};
    this._bind();
    this.render();
  }
  CASLab.prototype._bind = function(){
    const r=()=> this.render();
    this.contention?.addEventListener("input", r);
    this.withStamp?.addEventListener("change", r);
    this.runBtn?.addEventListener("click", ()=>{ this.simulate(); toast("CAS simulation executed"); });
    window.addEventListener("resize", ()=> this.draw());
  };
  CASLab.prototype.render = function(){
    const cv = $("#contVal", this.root);
    if(cv) cv.textContent = `${Math.round(parseFloat(this.contention?.value||"0.4")*100)}%`;
    this._renderOut();
    this.draw();
  };
  CASLab.prototype.simulate = function(){
    const cont = clamp(parseFloat(this.contention?.value||"0.4"), 0, 1);
    const stamped = !!(this.withStamp?.checked);

    // ABA story:
    // T1 reads A, wants to CAS A->C.
    // T2 changes A->B then B->A.
    // T1 CAS succeeds if only value tracked; fails if stamped.
    let value = "A";
    let stamp = 0;

    const steps=[];
    const push=(t,msg,kind)=>steps.push({t,msg,kind,value,stamp});

    // T1 reads
    const t1ReadV = value, t1ReadS = stamp;
    push("T1", `read (${value}, s=${stamp})`, "ok");

    // T2 maybe interferes
    const interferes = Math.random() < cont;
    if(interferes){
      // A->B
      value="B"; stamp++;
      push("T2", `write B`, "warn");
      // B->A
      value="A"; stamp++;
      push("T2", `write A`, "warn");
    }else{
      push("T2", `no interference`, "ok");
    }

    // T1 attempts CAS
    if(stamped){
      const ok = (value===t1ReadV && stamp===t1ReadS);
      if(ok){
        value="C"; stamp++;
        push("T1", `CAS ok → C (stamp matched)`, "ok");
      }else{
        push("T1", `CAS fail (stamp changed)`, "danger");
      }
    }else{
      const ok = (value===t1ReadV);
      if(ok){
        value="C"; stamp++;
        push("T1", `CAS ok → C (ABA not detected)`, interferes ? "danger":"ok");
      }else{
        push("T1", `CAS fail (value changed)`, "warn");
      }
    }

    this.state = {steps, stamped, interferes, value, stamp};
    this._renderOut();
    this.draw();
  };
  CASLab.prototype._renderOut = function(){
    if(!this.out) return;
    const s = this.state || {steps:[]};
    const bad = (s.interferes && !s.stamped && s.value==="C");
    const badge = $(".cas-badge", this.root);
    if(badge){
      badge.textContent = bad ? "ABA hazard" : (s.stamped ? "stamped CAS" : "CAS");
      badge.className = `badge ${bad ? "danger" : s.stamped ? "ok" : "warn"} cas-badge`;
    }
    const lines = (s.steps||[]).map(st=>{
      const c = badgeColor(st.kind);
      return `<div style="font-family:var(--mono);font-size:12px;color:${c}">${st.t}: ${st.msg} <span style="color:rgba(167,178,214,.85)">@(${st.value}, s=${st.stamp})</span></div>`;
    }).join("") || `<div style="color:rgba(167,178,214,.9)">Press “Run” to simulate a CAS attempt under contention.</div>`;

    this.out.innerHTML = `
      <div class="callout">
        <div class="icon">≟</div>
        <div class="t"><b>CAS</b> enables lock-free progress, but it can be fooled by <b>ABA</b> if the value returns to the expected state after intermediate changes. Use stamped/versioned references when ABA matters.</div>
      </div>
      <div class="divider"></div>
      ${lines}
      ${bad ? `<div class="note" style="margin-top:12px"><strong>Detected:</strong> ABA occurred; T1 observed A, another thread changed A→B→A, and T1’s CAS succeeded despite intervening updates.</div>` : ``}
    `;
  };
  CASLab.prototype.draw = function(){
    if(!this.canvas) return;
    const {ctx,w,h} = fitCanvas(this.canvas);
    ctx.clearRect(0,0,w,h);
    drawGrid(ctx,w,h);

    const pad = 18;
    ctx.save();
    ctx.fillStyle=cText(.86);
    ctx.font="700 13px "+getComputedStyle(document.body).fontFamily;
    ctx.fillText("ABA timeline (value and stamp)", pad, pad+14);
    ctx.restore();

    const s = this.state || {steps:[]};
    const steps = s.steps || [];
    const x0 = pad, y0 = pad+30, W = w-pad*2, H = h-pad*2-30;
    // Draw track
    fillRoundedRect(ctx, x0, y0+H/2-22, W, 44, 16, cBg(.20));
    strokeRoundedRect(ctx, x0, y0+H/2-22, W, 44, 16, cStroke(.10));
    // Steps positions
    const n = Math.max(1, steps.length);
    for(let i=0;i<n;i++){
      const st = steps[i];
      const x = x0 + (i/(n-1 || 1))*W;
      const col = st.kind==="danger" ? "rgba(255,77,109,.92)" :
                  st.kind==="warn" ? "rgba(255,176,32,.90)" :
                  "rgba(0,212,255,.85)";
      fillRoundedRect(ctx, x-7, y0+H/2-7, 14, 14, 7, col);
      ctx.save();
      ctx.fillStyle=cText(.9);
      ctx.font="12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign="center";
      ctx.fillText(st.value, x, y0+H/2-14);
      ctx.fillStyle="rgba(167,178,214,.9)";
      ctx.fillText(`s=${st.stamp}`, x, y0+H/2+28);
      ctx.restore();
    }
  };

  // ---------- Hydration ----------
  function initComponents(){
    $$("[data-component='race-lab']").forEach(el=> new RaceLab(el));
    $$("[data-component='deadlock-lab']").forEach(el=> new DeadlockLab(el));
    $$("[data-component='hb-explorer']").forEach(el=> new HBExplorer(el));
    $$("[data-component='pool-lab']").forEach(el=> new PoolLab(el));
    $$("[data-component='amdahl-lab']").forEach(el=> new AmdahlLab(el));
    $$("[data-component='cas-lab']").forEach(el=> new CASLab(el));
  }

  function initSmoothAnchors(){
    $$("a[href^='#']").forEach(a=>{
      a.addEventListener("click",(e)=>{
        const id = a.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:"smooth", block:"start"});
        }
      });
    });
  }

  function init(){
    initSearch();
    initThemeToggle();
    initSmoothAnchors();
    initComponents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
