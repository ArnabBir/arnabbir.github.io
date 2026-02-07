/* TLPI Interactive Library v2 Widgets
   Purpose: educational simulations (not kernel-accurate), meant to build intuition.
   No external dependencies required.
*/
(function(){
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  const clamp = (x,a,b)=>Math.max(a, Math.min(b, x));

  function h(tag, attrs={}, children=[]){
    const el = document.createElement(tag);
    Object.entries(attrs||{}).forEach(([k,v])=>{
      if(k==="class") el.className = v;
      else if(k==="html") el.innerHTML = v;
      else if(k.startsWith("on") && typeof v==="function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    });
    (Array.isArray(children)?children:[children]).filter(c=>c!==null && c!==undefined).forEach(c=>{
      if(typeof c === "string") el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    });
    return el;
  }

  /* ---------------------------------------------
   * 1) Kernel Object Graph (Canvas)
   * --------------------------------------------- */
  const KERNEL_GRAPH = (function(){
    // Canonical kernel object nodes. Position is in normalized coordinates (0..1).
    const nodes = [
      {id:"process", label:"task_struct (process)", x:.18, y:.30, desc:"A process/task: PID, memory map, open files, credentials, signal handlers."},
      {id:"thread", label:"thread (kernel task)", x:.18, y:.48, desc:"A thread is a task that shares an address space with siblings (CLONE_VM)."},
      {id:"scheduler", label:"scheduler", x:.08, y:.40, desc:"Chooses runnable tasks; policy + priority + CPU affinity."},
      {id:"cred", label:"credentials (cred)", x:.30, y:.18, desc:"uid/gid + capabilities; often copy-on-write for privilege transitions."},
      {id:"signal", label:"signals", x:.33, y:.40, desc:"Signal dispositions, masks, and pending queues; SIGCHLD, SIGTERM, SIGKILL."},
      {id:"timer", label:"timers", x:.40, y:.55, desc:"POSIX timers, interval timers, timeouts driving sleeping + scheduling."},

      {id:"fdtable", label:"fdtable", x:.42, y:.28, desc:"Per-process file descriptor table mapping small ints → open file descriptions."},
      {id:"file", label:"struct file (open file)", x:.56, y:.28, desc:"Open file description: offset, flags, ops; refcounted and shared via dup/fork."},
      {id:"inode", label:"inode", x:.70, y:.22, desc:"File metadata: mode, owner, size, timestamps; lives in inode cache."},
      {id:"dentry", label:"dentry", x:.68, y:.35, desc:"Directory entry cache (name → inode) used in path resolution."},
      {id:"mount", label:"mount / superblock", x:.82, y:.28, desc:"Mount namespace + filesystem instance; drives path traversal & permissions."},
      {id:"pagecache", label:"page cache", x:.78, y:.48, desc:"Caches file-backed pages; affects buffering, readahead, writeback."},
      {id:"pipe", label:"pipe", x:.56, y:.48, desc:"Kernel buffer + endpoints for unidirectional byte streams (pipe/fifo)."},
      {id:"epoll", label:"epoll", x:.64, y:.60, desc:"Readiness event aggregator: O(1) wakeups, avoids O(N) scanning."},

      {id:"vmm", label:"mm_struct (addr space)", x:.38, y:.70, desc:"Process address space: vm_areas, page tables, brk, mmap regions."},
      {id:"vma", label:"vm_area_struct", x:.56, y:.72, desc:"Contiguous virtual region with permissions + backing (anon/file)."},
      {id:"page", label:"page frames", x:.76, y:.72, desc:"Physical pages; mapped into processes; reclaimed/evicted by VM."},

      {id:"socket", label:"socket", x:.86, y:.56, desc:"Endpoint for network/IPC; has protocol state + buffers."},
      {id:"tcp", label:"TCP state", x:.92, y:.68, desc:"SYN/ACK handshake, congestion control, retransmissions."},
      {id:"skb", label:"sk_buff (packets)", x:.82, y:.76, desc:"Kernel packet buffers for networking stacks."},
      {id:"tty", label:"tty/pty", x:.93, y:.38, desc:"Terminal devices: line discipline, controlling terminal, job control."},
    ];

    const edges = [
      ["process","scheduler"],["thread","scheduler"],
      ["process","cred"],["process","signal"],["process","fdtable"],["process","vmm"],["process","tty"],
      ["thread","signal"],
      ["signal","timer"],
      ["fdtable","file"],["file","inode"],["file","pipe"],["file","socket"],
      ["inode","dentry"],["dentry","mount"],["inode","pagecache"],["pagecache","page"],
      ["vmm","vma"],["vma","page"],
      ["socket","tcp"],["socket","skb"],["epoll","file"],["epoll","socket"],
      ["tty","process"]
    ];

    function mount(rootId, opts={}){
      const root = typeof rootId === "string" ? document.getElementById(rootId) : rootId;
      if(!root) return;

      const highlight = new Set(opts.highlight || []);
      const title = opts.title || "Kernel Object Graph";
      const subtitle = opts.subtitle || "Hover nodes to see what the kernel object represents; highlighted nodes are most relevant to this chapter.";

      const wrap = h("div", {class:"widget"}, [
        h("div", {class:"wtitle"}, [
          h("h4", {html: title}),
          h("span", {class:"pill"}, [
            h("span", {class:"muted2"}, ["Interactive"]),
            h("span", {class:"muted2"}, ["•"]),
            h("span", {class:"muted"}, ["Canvas graph"])
          ])
        ]),
        h("div", {class:"wbody"}, [
          h("div", {class:"muted", style:"margin-bottom:10px"}, [subtitle]),
          h("div", {class:"canvas-wrap"}, [
            h("canvas", {id:`kg_${Math.random().toString(16).slice(2)}`}),
            h("div", {class:"canvas-tip"})
          ])
        ])
      ]);

      root.appendChild(wrap);

      const canvas = qs("canvas", wrap);
      const tip = qs(".canvas-tip", wrap);
      const ctx = canvas.getContext("2d");
      let w=0,hgt=0, dpr=1;
      let hoverId = null;
      let lockedId = null;

      function resize(){
        const rect = canvas.getBoundingClientRect();
        dpr = window.devicePixelRatio || 1;
        w = Math.max(320, rect.width);
        hgt = Math.max(260, rect.height);
        canvas.width = Math.round(w*dpr);
        canvas.height = Math.round(hgt*dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0);
        draw();
      }

      function themeColors(){
        const styles = getComputedStyle(document.documentElement);
        const isLight = document.documentElement.classList.contains("theme-light");
        return {
          bg: isLight ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.35)",
          text: styles.getPropertyValue("--text").trim(),
          muted: styles.getPropertyValue("--muted").trim(),
          border: styles.getPropertyValue("--border").trim(),
          accent: styles.getPropertyValue("--accent").trim(),
          accent2: styles.getPropertyValue("--accent2").trim(),
        };
      }

      function nodeAt(x,y){
        // x,y in CSS pixels
        const radius = 14;
        let best = null;
        let bestD = 1e9;
        nodes.forEach(n=>{
          const nx = n.x*w;
          const ny = n.y*hgt;
          const dx = x-nx;
          const dy = y-ny;
          const d = Math.sqrt(dx*dx + dy*dy);
          if(d < radius+4 && d < bestD){
            bestD = d;
            best = n;
          }
        });
        return best;
      }

      function draw(){
        const c = themeColors();
        // clear
        ctx.clearRect(0,0,w,hgt);

        // background subtle grid
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = c.border;
        for(let x=0; x<w; x+=28){
          ctx.beginPath();
          ctx.moveTo(x,0); ctx.lineTo(x,hgt);
          ctx.stroke();
        }
        for(let y=0; y<hgt; y+=28){
          ctx.beginPath();
          ctx.moveTo(0,y); ctx.lineTo(w,y);
          ctx.stroke();
        }
        ctx.restore();

        // edges
        ctx.save();
        ctx.globalAlpha = 0.55;
        edges.forEach(([a,b])=>{
          const na = nodes.find(n=>n.id===a);
          const nb = nodes.find(n=>n.id===b);
          if(!na || !nb) return;
          const ax = na.x*w, ay=na.y*hgt;
          const bx = nb.x*w, by=nb.y*hgt;
          const aHot = highlight.has(a);
          const bHot = highlight.has(b);
          ctx.lineWidth = (aHot || bHot) ? 2 : 1;
          ctx.strokeStyle = (aHot || bHot) ? "rgba(6,182,212,.45)" : "rgba(255,255,255,.18)";
          if(document.documentElement.classList.contains("theme-light")){
            ctx.strokeStyle = (aHot || bHot) ? "rgba(124,58,237,.35)" : "rgba(15,23,42,.18)";
          }
          ctx.beginPath();
          ctx.moveTo(ax,ay);
          // slight curve
          const mx = (ax+bx)/2;
          const my = (ay+by)/2;
          const cx = mx + (ay-by)*0.08;
          const cy = my + (bx-ax)*0.08;
          ctx.quadraticCurveTo(cx,cy,bx,by);
          ctx.stroke();
        });
        ctx.restore();

        // nodes
        nodes.forEach(n=>{
          const x=n.x*w, y=n.y*hgt;
          const isHot = highlight.has(n.id);
          const isHover = (lockedId ? lockedId===n.id : hoverId===n.id);
          const r = isHot ? 14 : 12;

          // glow
          ctx.save();
          ctx.globalAlpha = isHot ? 0.55 : 0.28;
          if(document.documentElement.classList.contains("theme-light")){
            ctx.globalAlpha = isHot ? 0.18 : 0.10;
          }
          const grd = ctx.createRadialGradient(x,y,2,x,y,32);
          grd.addColorStop(0, isHot ? "rgba(124,58,237,.95)" : "rgba(255,255,255,.35)");
          grd.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(x,y,32,0,Math.PI*2); ctx.fill();
          ctx.restore();

          // circle
          ctx.save();
          ctx.lineWidth = isHover ? 2 : 1;
          ctx.strokeStyle = isHot ? "rgba(6,182,212,.7)" : "rgba(255,255,255,.22)";
          if(document.documentElement.classList.contains("theme-light")){
            ctx.strokeStyle = isHot ? "rgba(124,58,237,.55)" : "rgba(15,23,42,.22)";
          }
          ctx.fillStyle = isHot ? "rgba(124,58,237,.22)" : "rgba(255,255,255,.06)";
          if(document.documentElement.classList.contains("theme-light")){
            ctx.fillStyle = isHot ? "rgba(124,58,237,.08)" : "rgba(255,255,255,.75)";
          }
          ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
          ctx.fill(); ctx.stroke();
          ctx.restore();

          // label
          ctx.save();
          ctx.font = `12px ${getComputedStyle(document.body).fontFamily}`;
          ctx.fillStyle = document.documentElement.classList.contains("theme-light") ? "rgba(10,12,20,.86)" : "rgba(255,255,255,.78)";
          if(!isHot) ctx.fillStyle = document.documentElement.classList.contains("theme-light") ? "rgba(10,12,20,.68)" : "rgba(255,255,255,.62)";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(n.id, x + 16, y);
          ctx.restore();
        });
      }

      function showTip(n, x, y){
        if(!n){ tip.style.display="none"; return; }
        const html = `<div style="font-weight:900; margin-bottom:4px">${escapeHtml(n.label)}</div>
                      <div style="color:inherit; opacity:.88; line-height:1.5">${escapeHtml(n.desc)}</div>
                      <div style="margin-top:8px; opacity:.82"><span class="mono small">id</span> <span class="pill"><strong>${escapeHtml(n.id)}</strong></span></div>`;
        tip.innerHTML = html;
        tip.style.display = "block";
      }

      canvas.addEventListener("mousemove", (e)=>{
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const n = nodeAt(x,y);
        if(lockedId) return;
        hoverId = n ? n.id : null;
        if(n) showTip(n, x, y);
        else tip.style.display = "none";
        draw();
      });

      canvas.addEventListener("mouseleave", ()=>{
        if(lockedId) return;
        hoverId = null;
        tip.style.display="none";
        draw();
      });

      canvas.addEventListener("click", (e)=>{
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const n = nodeAt(x,y);
        if(!n){
          lockedId = null;
          tip.style.display="none";
          draw();
          return;
        }
        if(lockedId === n.id){
          lockedId = null;
          tip.style.display="none";
        } else {
          lockedId = n.id;
          showTip(n, x, y);
        }
        draw();
      });

      // Resize observer
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      // Redraw on theme change
      const mo = new MutationObserver(()=>draw());
      mo.observe(document.documentElement, {attributes:true, attributeFilter:["class"]});

      resize();
    }

    function escapeHtml(s){
      return String(s).replace(/[&<>"']/g, (c)=>({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
      }[c]));
    }

    return { mount, nodes, edges };
  })();

  /* ---------------------------------------------
   * 2) File Descriptor / Open File Description Lab
   * --------------------------------------------- */
  const FD_LAB = (function(){
    function mount(rootId, opts={}){
      const root = typeof rootId === "string" ? document.getElementById(rootId) : rootId;
      if(!root) return;

      // State model (toy but faithful to major invariants)
      const state = {
        nextPid: 4100,
        nextOFD: 100,
        nextInode: 8000,
        procs: [],
        ofd: new Map(),   // ofdId -> {id, path, offset, flags:Set, inodeId, ref}
        inode: new Map(), // inodeId -> {id, path, size, mode}
        log: []
      };

      function mkInode(path){
        const id = state.nextInode++;
        state.inode.set(id, {id, path, size: 0, mode: "0644"});
        return id;
      }

      function mkOFD(path, flags){
        const inodeId = mkInode(path);
        const id = state.nextOFD++;
        state.ofd.set(id, {id, path, offset: 0, flags: new Set(flags||[]), inodeId, ref: 1});
        return id;
      }

      function mkProc(name){
        const pid = state.nextPid++;
        const p = {name, pid, ppid: 1, state:"RUNNING", fds: new Map()};
        // stdio
        const tty = mkOFD("/dev/tty", ["O_RDWR"]);
        const tty2 = mkOFD("/dev/tty", ["O_RDWR"]);
        const tty3 = mkOFD("/dev/tty", ["O_RDWR"]);
        p.fds.set(0, tty);
        p.fds.set(1, tty2);
        p.fds.set(2, tty3);
        return p;
      }

      const parent = mkProc("parent");
      // open a default file
      const logOFD = mkOFD("/var/log/app.log", ["O_WRONLY","O_APPEND"]);
      parent.fds.set(3, logOFD);
      state.procs.push(parent);

      function pushLog(msg){
        state.log.unshift({t: new Date(), msg});
        state.log = state.log.slice(0, 10);
      }

      function findFreeFD(proc){
        for(let i=0;i<128;i++){
          if(!proc.fds.has(i)) return i;
        }
        return null;
      }

      function incRef(ofdId){
        const o = state.ofd.get(ofdId);
        if(o){ o.ref += 1; }
      }
      function decRef(ofdId){
        const o = state.ofd.get(ofdId);
        if(!o) return;
        o.ref -= 1;
        if(o.ref <= 0){
          state.ofd.delete(ofdId);
          // inode persists in cache in reality; we keep it for visibility.
        }
      }

      function doOpen(proc, path, flags){
        const fd = findFreeFD(proc);
        if(fd===null) return pushLog("open(): no free fd in toy range");
        const ofdId = mkOFD(path, flags);
        proc.fds.set(fd, ofdId);
        pushLog(`open("${path}", ${flags.join("|")}) → fd ${fd} (ofd ${ofdId})`);
      }

      function doDup(proc, fromFd){
        if(!proc.fds.has(fromFd)) return pushLog(`dup(${fromFd}): EBADF`);
        const fd = findFreeFD(proc);
        if(fd===null) return pushLog("dup(): no free fd");
        const ofdId = proc.fds.get(fromFd);
        incRef(ofdId);
        proc.fds.set(fd, ofdId);
        pushLog(`dup(${fromFd}) → ${fd} (shares ofd ${ofdId}; shared offset)`);
      }

      function doClose(proc, fd){
        if(!proc.fds.has(fd)) return pushLog(`close(${fd}): EBADF`);
        const ofdId = proc.fds.get(fd);
        proc.fds.delete(fd);
        decRef(ofdId);
        pushLog(`close(${fd}) (ofd ${ofdId} ref--)`);
      }

      function doRW(proc, fd, nBytes, kind){
        if(!proc.fds.has(fd)) return pushLog(`${kind}(${fd}, ${nBytes}): EBADF`);
        const ofdId = proc.fds.get(fd);
        const o = state.ofd.get(ofdId);
        if(!o) return pushLog(`${kind}(${fd}): stale ofd`);
        if(kind==="read" && o.flags.has("O_WRONLY")) return pushLog(`read(${fd}): EBADF (write-only)`);
        if(kind==="write" && o.flags.has("O_RDONLY")) return pushLog(`write(${fd}): EBADF (read-only)`);
        // partial I/O + EINTR simulation
        const partial = Math.max(1, Math.floor(nBytes * (0.6 + Math.random()*0.4)));
        if(o.flags.has("O_APPEND") && kind==="write"){
          // In reality: offset set to EOF atomically per write
          const inode = state.inode.get(o.inodeId);
          o.offset = inode ? inode.size : o.offset;
        }
        o.offset += partial;
        const inode = state.inode.get(o.inodeId);
        if(inode && kind==="write") inode.size = Math.max(inode.size, o.offset);
        pushLog(`${kind}(${fd}, ${nBytes}) → ${partial} bytes; ofd ${ofdId} offset=${o.offset}`);
      }

      function doSeek(proc, fd, off){
        if(!proc.fds.has(fd)) return pushLog(`lseek(${fd}): EBADF`);
        const o = state.ofd.get(proc.fds.get(fd));
        if(!o) return;
        if(o.flags.has("O_APPEND")) pushLog(`lseek(${fd}): allowed, but O_APPEND will override offset on write()`);
        o.offset = Math.max(0, off);
        pushLog(`lseek(${fd}, ${off}, SEEK_SET) → offset=${o.offset}`);
      }

      function doFork(){
        // Clone parent's fd table; they share OFDs.
        const p = state.procs[0];
        const child = mkProc("child");
        child.ppid = p.pid;
        // wipe stdio created by mkProc
        child.fds.clear();
        p.fds.forEach((ofdId, fd)=>{
          child.fds.set(fd, ofdId);
          incRef(ofdId);
        });
        state.procs.push(child);
        pushLog(`fork() → child pid=${child.pid} (shares OFDs; refcounts increase)`);
      }

      function doExec(proc){
        // Close fds with CLOEXEC.
        const closable = [];
        proc.fds.forEach((ofdId, fd)=>{
          const o = state.ofd.get(ofdId);
          if(o && o.flags.has("O_CLOEXEC")) closable.push(fd);
        });
        closable.forEach(fd=>doClose(proc, fd));
        pushLog(`execve(): image replaced; fds with O_CLOEXEC closed (${closable.length})`);
      }

      function render(){
        root.innerHTML = "";
        const wrap = h("div", {class:"widget"}, [
          h("div", {class:"wtitle"}, [
            h("h4", {html:"FD & OFD Lab"}),
            h("span", {class:"pill"}, [
              h("strong", {}, ["dup/fork invariants"]),
              h("span", {class:"muted2"}, ["•"]),
              h("span", {class:"muted"}, ["shared offsets"])
            ])
          ]),
          h("div", {class:"wbody"}, [
            h("div", {class:"muted", style:"margin-bottom:10px"}, [
              "This simulator models the Linux invariants: ",
              h("code", {}, ["fd → open file description → inode"]),
              ", and how ",
              h("code", {}, ["dup()"]),
              " and ",
              h("code", {}, ["fork()"]),
              " share offsets and flags. It is not a complete kernel implementation."
            ]),
            h("div", {class:"grid2"}, [
              // left: processes
              h("div", {}, [
                h("div", {class:"callouts"}, [
                  h("div", {class:"callout good"}, [
                    h("div", {class:"k"}, ["Invariant"]),
                    h("div", {class:"v"}, ["Two descriptors that reference the same open file description share file offset and status flags."])
                  ]),
                  h("div", {class:"callout warn"}, [
                    h("div", {class:"k"}, ["Gotcha"]),
                    h("div", {class:"v"}, ["After fork(), parent + child share OFDs. If both write to the same fd without coordination, offsets interleave."])
                  ]),
                ]),

                state.procs.map(proc => renderProc(proc))
              ]),
              // right: ofd/inode + controls
              h("div", {}, [
                renderControls(),
                h("hr", {class:"sep"}),
                renderOFDTable(),
                h("hr", {class:"sep"}),
                renderInodeTable(),
                h("hr", {class:"sep"}),
                renderLog()
              ])
            ])
          ])
        ]);

        root.appendChild(wrap);
      }

      function renderProc(proc){
        const rows = Array.from(proc.fds.entries()).sort((a,b)=>a[0]-b[0]).map(([fd, ofdId])=>{
          const o = state.ofd.get(ofdId);
          const flags = o ? Array.from(o.flags).join("|") : "";
          const off = o ? o.offset : 0;
          return h("tr", {}, [
            h("td", {class:"mono"}, [String(fd)]),
            h("td", {class:"mono"}, [String(ofdId)]),
            h("td", {class:"mono"}, [String(off)]),
            h("td", {}, [o ? o.path : "—"]),
            h("td", {class:"mono muted2"}, [flags || "—"])
          ]);
        });

        return h("div", {class:"glass pad", style:"margin-top:12px"}, [
          h("div", {style:"display:flex; align-items:flex-start; justify-content:space-between; gap:10px"}, [
            h("div", {}, [
              h("div", {style:"font-weight:900; letter-spacing:-.02em"}, [`${proc.name} (pid ${proc.pid})`]),
              h("div", {class:"muted2 small mono", style:"margin-top:4px"}, [`ppid ${proc.ppid} • state ${proc.state}`])
            ]),
            h("div", {style:"display:flex; gap:8px"}, [
              h("button", {class:"btn small", onclick: ()=>doExec(proc)}, ["execve()"]),
            ])
          ]),
          h("div", {class:"muted2 small", style:"margin-top:10px"}, [
            "FD table (toy):"
          ]),
          h("table", {class:"table", style:"margin-top:8px"}, [
            h("thead", {}, [h("tr", {}, [
              h("th", {}, ["fd"]),
              h("th", {}, ["ofd"]),
              h("th", {}, ["offset"]),
              h("th", {}, ["path"]),
              h("th", {}, ["flags"])
            ])]),
            h("tbody", {}, rows.length ? rows : [h("tr", {}, [h("td",{colspan:"5"},["(no open fds)"])])])
          ])
        ]);
      }

      function renderControls(){
        // Controls operate on parent by default; if child exists, allow selection
        const procSel = h("select", {class:"input", style:"padding:10px 12px"}, state.procs.map((p,i)=>{
          return h("option", {value:String(i)}, [`${p.name} (pid ${p.pid})`]);
        }));

        const path = h("input", {class:"input", placeholder:"/tmp/data.bin", value:"/tmp/data.bin"});
        const flags = h("input", {class:"input", placeholder:"O_RDONLY|O_CLOEXEC", value:"O_RDONLY|O_CLOEXEC"});
        const fromFd = h("input", {class:"input", placeholder:"fd", value:"3"});
        const bytes = h("input", {class:"input", placeholder:"nbytes", value:"128"});
        const off = h("input", {class:"input", placeholder:"offset", value:"0"});

        const getProc = ()=> state.procs[Number(procSel.value||"0")];

        return h("div", {class:"glass pad"}, [
          h("div", {class:"section-title"}, ["LAB CONTROLS"]),
          h("div", {class:"muted2 small", style:"margin-top:-2px"}, [
            "Try: ",
            h("code", {}, ["dup(3)"]),
            ", then ",
            h("code", {}, ["fork()"]),
            ", then write from both processes and observe shared offsets."
          ]),
          h("div", {style:"margin-top:10px; display:grid; gap:10px"}, [
            h("div", {}, [
              h("div", {class:"muted2 small", style:"margin-bottom:6px"}, ["Target process"]),
              procSel
            ]),

            h("div", {class:"grid2", style:"grid-template-columns: 1fr 1fr"}, [
              h("div", {}, [
                h("div", {class:"muted2 small", style:"margin-bottom:6px"}, ["open() path"]),
                path
              ]),
              h("div", {}, [
                h("div", {class:"muted2 small", style:"margin-bottom:6px"}, ["flags"]),
                flags
              ]),
            ]),
            h("div", {style:"display:flex; gap:10px; flex-wrap:wrap"}, [
              h("button", {class:"btn primary small", onclick: ()=>{
                const f = flags.value.split("|").map(s=>s.trim()).filter(Boolean);
                doOpen(getProc(), path.value.trim()||"/tmp/data.bin", f.length?f:["O_RDONLY"]);
                render();
              }}, ["open()"]),
              h("button", {class:"btn small", onclick: ()=>{
                doFork();
                render();
              }}, ["fork()"]),
            ]),
            h("hr", {class:"sep"}),

            h("div", {class:"grid2", style:"grid-template-columns: 1fr 1fr"}, [
              h("div", {}, [
                h("div", {class:"muted2 small", style:"margin-bottom:6px"}, ["fd"]),
                fromFd
              ]),
              h("div", {}, [
                h("div", {class:"muted2 small", style:"margin-bottom:6px"}, ["bytes / offset"]),
                h("div", {style:"display:flex; gap:10px"}, [bytes, off])
              ])
            ]),

            h("div", {style:"display:flex; gap:10px; flex-wrap:wrap"}, [
              h("button", {class:"btn small", onclick: ()=>{
                doDup(getProc(), Number(fromFd.value));
                render();
              }}, ["dup()"]),
              h("button", {class:"btn small", onclick: ()=>{
                doRW(getProc(), Number(fromFd.value), Number(bytes.value||"1"), "read");
                render();
              }}, ["read()"]),
              h("button", {class:"btn small", onclick: ()=>{
                doRW(getProc(), Number(fromFd.value), Number(bytes.value||"1"), "write");
                render();
              }}, ["write()"]),
              h("button", {class:"btn small", onclick: ()=>{
                doSeek(getProc(), Number(fromFd.value), Number(off.value||"0"));
                render();
              }}, ["lseek()"]),
              h("button", {class:"btn small", onclick: ()=>{
                doClose(getProc(), Number(fromFd.value));
                render();
              }}, ["close()"])
            ])
          ])
        ]);
      }

      function renderOFDTable(){
        const rows = Array.from(state.ofd.values()).sort((a,b)=>a.id-b.id).map(o=>{
          const inode = state.inode.get(o.inodeId);
          return h("tr", {}, [
            h("td", {class:"mono"}, [String(o.id)]),
            h("td", {}, [o.path]),
            h("td", {class:"mono"}, [String(o.offset)]),
            h("td", {class:"mono"}, [String(o.ref)]),
            h("td", {class:"mono muted2"}, [Array.from(o.flags).join("|")]),
            h("td", {class:"mono"}, [inode ? String(inode.id) : "—"])
          ]);
        });

        return h("div", {}, [
          h("div", {class:"section-title"}, ["OPEN FILE DESCRIPTIONS (OFD)"]),
          h("div", {class:"muted2 small", style:"margin-top:6px"}, [
            "In real Linux: OFD contains file position and status flags; multiple fds can point here via dup/fork."
          ]),
          h("table", {class:"table", style:"margin-top:10px"}, [
            h("thead", {}, [h("tr", {}, [
              h("th", {}, ["ofd"]),
              h("th", {}, ["path"]),
              h("th", {}, ["offset"]),
              h("th", {}, ["ref"]),
              h("th", {}, ["flags"]),
              h("th", {}, ["inode"])
            ])]),
            h("tbody", {}, rows.length ? rows : [h("tr", {}, [h("td",{colspan:"6"},["(none)"])])])
          ])
        ]);
      }

      function renderInodeTable(){
        const rows = Array.from(state.inode.values()).sort((a,b)=>a.id-b.id).slice(-10).map(i=>{
          return h("tr", {}, [
            h("td", {class:"mono"}, [String(i.id)]),
            h("td", {}, [i.path]),
            h("td", {class:"mono"}, [String(i.size)]),
            h("td", {class:"mono muted2"}, [i.mode])
          ]);
        });

        return h("div", {}, [
          h("div", {class:"section-title"}, ["INODES (TOY VIEW)"]),
          h("div", {class:"muted2 small", style:"margin-top:6px"}, [
            "Inodes are metadata; data may be cached in the page cache and written back later."
          ]),
          h("table", {class:"table", style:"margin-top:10px"}, [
            h("thead", {}, [h("tr", {}, [
              h("th", {}, ["inode"]),
              h("th", {}, ["path"]),
              h("th", {}, ["size"]),
              h("th", {}, ["mode"])
            ])]),
            h("tbody", {}, rows.length ? rows : [h("tr", {}, [h("td",{colspan:"4"},["(none)"])])])
          ])
        ]);
      }

      function renderLog(){
        const items = state.log.map(l=>{
          return h("div", {class:"mono small", style:"padding:6px 0; border-bottom:1px solid var(--border)"}, [
            h("span", {class:"muted2"}, [formatTime(l.t)]),
            "  ",
            h("span", {class:"muted"}, [l.msg])
          ]);
        });

        return h("div", {}, [
          h("div", {class:"section-title"}, ["TRACE LOG (TOY)"]),
          h("div", {class:"muted2 small", style:"margin-top:6px"}, [
            "Think of this as a high-level view of what you'd confirm with ",
            h("code", {}, ["strace -f"]),
            " or ",
            h("code", {}, ["perf trace"]),
            "."
          ]),
          h("div", {style:"margin-top:10px"}, items.length ? items : [h("div",{class:"muted2"},["(empty)"])])
        ]);
      }

      function formatTime(d){
        const pad=(n)=>String(n).padStart(2,"0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }

      render();
    }

    return { mount };
  })();

  /* ---------------------------------------------
   * 3) Process Lifecycle Lab (fork/exec/wait)
   * --------------------------------------------- */
  const PROC_LAB = (function(){
    function mount(rootId, opts={}){
      const root = typeof rootId === "string" ? document.getElementById(rootId) : rootId;
      if(!root) return;

      const state = {
        nextPid: 9000,
        parent: {pid: 1337, ppid: 1, name:"parent", prog:"/usr/bin/app", state:"RUNNING", exit:null},
        child: null,
        events: []
      };

      function log(msg){
        state.events.unshift({t: new Date(), msg});
        state.events = state.events.slice(0, 12);
      }

      function fork(){
        if(state.child) return log("fork(): already has a child in this toy model");
        state.child = {pid: state.nextPid++, ppid: state.parent.pid, name:"child", prog: state.parent.prog, state:"RUNNING", exit:null};
        log(`fork() → child pid=${state.child.pid} (copy-on-write address space; inherits fds, cwd, env)`);
        render();
      }

      function exec(){
        if(!state.child) return log("execve(): no child yet — fork first");
        if(state.child.state !== "RUNNING") return log("execve(): child not running");
        state.child.prog = "/usr/bin/worker";
        log(`execve("/usr/bin/worker", ...) → replaces process image (same pid=${state.child.pid})`);
        render();
      }

      function exitChild(){
        if(!state.child) return log("exit(): no child");
        if(state.child.state !== "RUNNING") return log("exit(): child not running");
        state.child.state = "ZOMBIE";
        state.child.exit = 0;
        log(`_exit(0) → child becomes ZOMBIE until parent calls wait*()`);
        render();
      }

      function wait(){
        if(!state.child) return log("waitpid(): no child");
        if(state.child.state !== "ZOMBIE") return log("waitpid(): child not a zombie yet");
        log(`waitpid(${state.child.pid}, ...) → reaps exit status=${state.child.exit} (zombie removed)`);
        state.child = null;
        render();
      }

      function parentExit(){
        if(state.parent.state !== "RUNNING") return;
        state.parent.state = "EXITED";
        state.parent.exit = 0;
        if(state.child && state.child.state==="RUNNING"){
          state.child.ppid = 1;
          log("parent exit → running child is re-parented to PID 1 (init/systemd)");
        } else if(state.child && state.child.state==="ZOMBIE"){
          log("parent exit → zombie will be reaped by PID 1");
        }
        log("_exit(0) (parent)");
        render();
      }

      function reset(){
        state.parent = {pid: 1337, ppid: 1, name:"parent", prog:"/usr/bin/app", state:"RUNNING", exit:null};
        state.child = null;
        state.events = [];
        log("reset");
        render();
      }

      function render(){
        root.innerHTML = "";
        const wrap = h("div", {class:"widget"}, [
          h("div", {class:"wtitle"}, [
            h("h4", {html:"Process Lifecycle Lab"}),
            h("span", {class:"pill"}, [
              h("strong", {}, ["fork/exec/wait"]),
              h("span", {class:"muted2"}, ["•"]),
              h("span", {class:"muted"}, ["zombies + reparenting"])
            ])
          ]),
          h("div", {class:"wbody"}, [
            h("div", {class:"muted", style:"margin-bottom:10px"}, [
              "A process is a kernel task with a PID and resources. ",
              h("code", {}, ["fork()"]),
              " clones, ",
              h("code", {}, ["execve()"]),
              " overlays the program image, and ",
              h("code", {}, ["waitpid()"]),
              " reaps exit status. This lab focuses on the *state machine*."
            ]),
            h("div", {class:"grid2"}, [
              h("div", {}, [
                renderProcCard(state.parent, "Parent"),
                state.child ? renderProcCard(state.child, "Child") : h("div", {class:"glass pad", style:"margin-top:12px"}, [
                  h("div", {style:"font-weight:900"}, ["Child"]),
                  h("div", {class:"muted2 small", style:"margin-top:6px"}, ["No child yet — click fork()."])
                ])
              ]),
              h("div", {}, [
                h("div", {class:"glass pad"}, [
                  h("div", {class:"section-title"}, ["ACTIONS"]),
                  h("div", {style:"display:flex; gap:10px; flex-wrap:wrap; margin-top:10px"}, [
                    h("button", {class:"btn primary small", onclick: fork}, ["fork()"]),
                    h("button", {class:"btn small", onclick: exec}, ["execve()"]),
                    h("button", {class:"btn small", onclick: exitChild}, ["child _exit()"]),
                    h("button", {class:"btn small", onclick: wait}, ["waitpid()"]),
                    h("button", {class:"btn small", onclick: parentExit}, ["parent _exit()"]),
                    h("button", {class:"btn small ghost", onclick: reset}, ["reset"])
                  ]),
                  h("div", {class:"muted2 small", style:"margin-top:12px"}, [
                    "Shortcut mental model: ",
                    h("code", {}, ["fork() copies structure"]),
                    ", ",
                    h("code", {}, ["exec() replaces image"]),
                    ", ",
                    h("code", {}, ["wait() reaps status"])
                  ])
                ]),
                h("div", {class:"glass pad", style:"margin-top:12px"}, [
                  h("div", {class:"section-title"}, ["EVENTS"]),
                  h("div", {style:"margin-top:10px"}, state.events.map(e=>h("div",{class:"mono small", style:"padding:6px 0; border-bottom:1px solid var(--border)"},[
                    h("span", {class:"muted2"}, [fmt(e.t)]),
                    "  ",
                    h("span", {class:"muted"}, [e.msg])
                  ])))
                ])
              ])
            ])
          ])
        ]);
        root.appendChild(wrap);
      }

      function renderProcCard(p, label){
        const badge = p.state === "RUNNING" ? "good" : (p.state === "ZOMBIE" ? "warn" : "bad");
        return h("div", {class:`glass pad ${badge}`, style:"margin-top:12px"}, [
          h("div", {style:"display:flex; align-items:center; justify-content:space-between; gap:10px"}, [
            h("div", {style:"font-weight:900; letter-spacing:-.02em"}, [label]),
            h("span", {class:`pill`}, [h("strong", {}, [p.state])])
          ]),
          h("div", {class:"muted2 small mono", style:"margin-top:8px"}, [`pid ${p.pid} • ppid ${p.ppid}`]),
          h("div", {class:"muted", style:"margin-top:8px"}, [
            "Program: ", h("span",{class:"mono"}, [p.prog])
          ]),
          h("div", {class:"muted2 small", style:"margin-top:10px"}, [
            p.state==="ZOMBIE"
              ? "Exit status is retained in kernel until reaped by parent."
              : (p.state==="EXITED" ? "Process has exited (toy state)." : "Runnable/scheduled by kernel.")
          ])
        ]);
      }

      function fmt(d){
        const pad=(n)=>String(n).padStart(2,"0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }

      render();
    }
    return { mount };
  })();

  /* ---------------------------------------------
   * 4) Signals Lab (mask/pending/SA_RESTART intuition)
   * --------------------------------------------- */
  const SIGNAL_LAB = (function(){
    const SIGNALS = [
      {name:"SIGINT", desc:"Interactive interrupt (Ctrl-C)."},
      {name:"SIGTERM", desc:"Polite termination request."},
      {name:"SIGKILL", desc:"Uncatchable kill (cannot be blocked)."},
      {name:"SIGCHLD", desc:"Child changed state (exit/stop/continue)."},
      {name:"SIGALRM", desc:"Timer alarm."},
      {name:"SIGPIPE", desc:"Write to pipe/socket with no readers."},
      {name:"SIGHUP", desc:"Hangup; commonly used for reload."},
      {name:"SIGUSR1", desc:"Application-defined."},
      {name:"SIGUSR2", desc:"Application-defined."},
    ];

    function mount(rootId, opts={}){
      const root = typeof rootId === "string" ? document.getElementById(rootId) : rootId;
      if(!root) return;

      const state = {
        mask: new Set(),
        pending: [],
        handlers: new Map(), // name -> "DEFAULT"|"IGNORE"|"HANDLER"
        restart: true,
        inSyscall: false,
        log: []
      };

      function handlerOf(sig){
        return state.handlers.get(sig) || "DEFAULT";
      }

      function log(msg){
        state.log.unshift({t:new Date(), msg});
        state.log = state.log.slice(0, 10);
      }

      function enqueue(sig){
        // SIGKILL cannot be blocked/handled; deliver immediately
        if(sig==="SIGKILL"){
          log("SIGKILL delivered immediately → process terminated (simulated).");
          state.pending = [];
          state.inSyscall = false;
          render();
          return;
        }
        state.pending.push(sig);
        log(`signal queued: ${sig}`);
        deliver();
        render();
      }

      function deliver(){
        // deliver one pending signal if it's unblocked
        for(let i=0;i<state.pending.length;i++){
          const sig = state.pending[i];
          if(state.mask.has(sig)) continue;
          // remove from pending
          state.pending.splice(i,1);

          const disp = handlerOf(sig);
          if(disp==="IGNORE"){
            log(`${sig} ignored.`);
            return;
          }
          if(disp==="HANDLER"){
            log(`${sig} handled by user handler (reentrant constraints apply).`);
            // If we were in syscall, decide EINTR vs restart
            if(state.inSyscall){
              if(state.restart){
                log("SA_RESTART: syscall restarted transparently.");
              } else {
                log("No SA_RESTART: syscall returns -1 with EINTR (caller must retry).");
              }
            }
            return;
          }
          // DEFAULT
          if(sig==="SIGTERM" || sig==="SIGINT" || sig==="SIGPIPE" || sig==="SIGHUP"){
            log(`${sig} default action → terminate (simulated).`);
            state.pending = [];
            state.inSyscall = false;
            return;
          }
          log(`${sig} default action → delivered (no termination simulated).`);
          if(state.inSyscall){
            if(state.restart){
              log("SA_RESTART: syscall restarted transparently.");
            } else {
              log("No SA_RESTART: syscall returns EINTR.");
            }
          }
          return;
        }
      }

      function toggleMask(sig){
        if(state.mask.has(sig)) state.mask.delete(sig);
        else state.mask.add(sig);
        log(`mask updated: ${state.mask.size} blocked signal(s)`);
        // After unblocking, deliver
        deliver();
        render();
      }

      function setHandler(sig, mode){
        state.handlers.set(sig, mode);
        log(`disposition(${sig}) = ${mode}`);
        deliver();
        render();
      }

      function simulateSyscall(){
        state.inSyscall = true;
        log("entered blocking syscall: read(fd, buf, n) ...");
        // wait a bit; in real kernel, a signal can interrupt
        setTimeout(()=>{
          if(!state.inSyscall) return;
          // if no signal arrives, the syscall completes
          log("syscall completed normally (no interrupt).");
          state.inSyscall = false;
          render();
        }, 1200);
        render();
      }

      function interruptSyscall(){
        if(!state.inSyscall){
          log("no syscall in flight");
          render();
          return;
        }
        // deliver first unblocked pending, else generate SIGALRM for demonstration
        if(state.pending.length===0) state.pending.push("SIGALRM");
        deliver();
        // If no SA_RESTART, syscall "exits" as EINTR
        if(!state.restart){
          state.inSyscall = false;
        }
        render();
      }

      function render(){
        root.innerHTML = "";
        const sigSel = h("select", {class:"input", style:"padding:10px 12px"}, SIGNALS.map(s=>h("option",{value:s.name},[`${s.name} — ${s.desc}`])));
        const modeSel = h("select", {class:"input", style:"padding:10px 12px"}, ["DEFAULT","IGNORE","HANDLER"].map(m=>h("option",{value:m},[m])));

        const wrap = h("div", {class:"widget"}, [
          h("div", {class:"wtitle"}, [
            h("h4", {html:"Signals Lab"}),
            h("span", {class:"pill"}, [
              h("strong", {}, ["mask + pending"]),
              h("span", {class:"muted2"}, ["•"]),
              h("span", {class:"muted"}, ["EINTR vs SA_RESTART"])
            ])
          ]),
          h("div", {class:"wbody"}, [
            h("div", {class:"muted", style:"margin-bottom:10px"}, [
              "Signals are asynchronous notifications. The tricky part is how they interact with blocking syscalls and thread masks. ",
              "Use this lab to build intuition for ",
              h("code", {}, ["sigprocmask"]),
              ", ",
              h("code", {}, ["sigaction"]),
              ", and the ",
              h("code", {}, ["EINTR"]),
              " retry pattern."
            ]),
            h("div", {class:"grid2"}, [
              h("div", {}, [
                h("div", {class:"glass pad"}, [
                  h("div", {class:"section-title"}, ["CONTROLS"]),
                  h("div", {style:"margin-top:10px; display:grid; gap:10px"}, [
                    h("div", {}, [h("div",{class:"muted2 small",style:"margin-bottom:6px"},["Choose signal"]), sigSel]),
                    h("button", {class:"btn primary small", onclick: ()=>enqueue(sigSel.value)}, ["send signal"]),
                    h("div", {class:"grid2", style:"grid-template-columns:1fr 1fr"}, [
                      h("div", {}, [
                        h("div",{class:"muted2 small",style:"margin-bottom:6px"},["Disposition"]),
                        modeSel
                      ]),
                      h("button", {class:"btn small", onclick: ()=>setHandler(sigSel.value, modeSel.value)}, ["set disposition"])
                    ]),
                    h("button", {class:"btn small", onclick: ()=>toggleMask(sigSel.value)}, [
                      state.mask.has(sigSel.value) ? "unblock (remove from mask)" : "block (add to mask)"
                    ]),
                    h("div", {style:"display:flex; align-items:center; justify-content:space-between; gap:10px"}, [
                      h("div",{class:"muted2 small"},["SA_RESTART"]),
                      h("button", {class:"btn small", onclick: ()=>{
                        state.restart = !state.restart;
                        log(`SA_RESTART = ${state.restart}`);
                        render();
                      }}, [state.restart ? "ON" : "OFF"])
                    ]),
                    h("hr",{class:"sep"}),
                    h("button", {class:"btn small", onclick: simulateSyscall}, ["simulate blocking read()"]),
                    h("button", {class:"btn small", onclick: interruptSyscall}, ["deliver interrupt to syscall"])
                  ])
                ]),
                h("div", {class:"glass pad", style:"margin-top:12px"}, [
                  h("div", {class:"section-title"}, ["STATE"]),
                  h("div", {class:"muted", style:"margin-top:8px"}, [
                    h("div", {}, ["In-syscall: ", h("span",{class:"pill"}, [h("strong",{},[state.inSyscall ? "YES" : "NO"])])]),
                    h("div", {style:"margin-top:10px"}, ["Blocked mask: ", state.mask.size ? Array.from(state.mask).map(s=>h("span",{class:"pill",style:"margin-right:6px"},[h("strong",{},[s])])) : h("span",{class:"muted2"},["(empty)"])]),
                    h("div", {style:"margin-top:10px"}, ["Pending: ", state.pending.length ? state.pending.map(s=>h("span",{class:"pill",style:"margin-right:6px"},[h("strong",{},[s])])) : h("span",{class:"muted2"},["(none)"])]),
                  ])
                ])
              ]),
              h("div", {}, [
                h("div", {class:"glass pad"}, [
                  h("div", {class:"section-title"}, ["TRACE (SIMULATED)"]),
                  h("div", {class:"muted2 small", style:"margin-top:6px"}, [
                    "Real tools: ", h("code",{},["strace -f"]), ", ", h("code",{},["perf trace"]), ", ", h("code",{},["gdb handle SIG..."] )
                  ]),
                  h("div", {style:"margin-top:10px"}, state.log.map(e=>h("div",{class:"mono small", style:"padding:6px 0; border-bottom:1px solid var(--border)"},[
                    h("span",{class:"muted2"},[fmt(e.t)]),"  ",h("span",{class:"muted"},[e.msg])
                  ])))
                ]),
                h("div", {class:"glass pad", style:"margin-top:12px"}, [
                  h("div", {class:"section-title"}, ["SAFETY RULES"]),
                  h("div", {class:"muted", style:"margin-top:8px; line-height:1.7"}, [
                    h("ul", {}, [
                      h("li", {}, ["Only call async-signal-safe functions inside handlers (think: write(2), _exit(2))."]),
                      h("li", {}, ["Use a flag + main loop to handle complex work outside the handler."]),
                      h("li", {}, ["Always design for EINTR: either use SA_RESTART or explicit retry loops."])
                    ])
                  ])
                ])
              ])
            ])
          ])
        ]);
        root.appendChild(wrap);
      }

      function fmt(d){
        const pad=(n)=>String(n).padStart(2,"0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }

      render();
    }

    return { mount };
  })();

  /* ---------------------------------------------
   * 5) TCP Socket State Lab (toy)
   * --------------------------------------------- */
  const SOCKET_LAB = (function(){
    const STATES = ["CLOSED","LISTEN","SYN_SENT","SYN_RCVD","ESTABLISHED","FIN_WAIT_1","FIN_WAIT_2","CLOSE_WAIT","LAST_ACK","TIME_WAIT"];

    function mount(rootId, opts={}){
      const root = typeof rootId === "string" ? document.getElementById(rootId) : rootId;
      if(!root) return;

      const state = {
        client: {state:"CLOSED", sendQ:0, recvQ:0},
        server: {state:"CLOSED", acceptQ:0, sendQ:0, recvQ:0},
        log:[]
      };

      function log(msg){
        state.log.unshift({t:new Date(), msg});
        state.log = state.log.slice(0, 12);
      }

      function listen(){
        if(state.server.state !== "CLOSED") return log("listen(): server not CLOSED");
        state.server.state = "LISTEN";
        state.server.acceptQ = 0;
        log("server: socket() + bind() + listen(backlog=...) → LISTEN");
        render();
      }

      function connect(){
        if(state.client.state !== "CLOSED") return log("connect(): client not CLOSED");
        if(state.server.state !== "LISTEN") return log("connect(): server must be LISTEN");
        state.client.state = "SYN_SENT";
        state.server.state = "SYN_RCVD";
        log("client: connect() → SYN_SENT; server: SYN received → SYN_RCVD");
        render();
      }

      function handshake(){
        if(state.client.state !== "SYN_SENT" || state.server.state !== "SYN_RCVD") return log("handshake(): must be mid-handshake");
        state.client.state = "ESTABLISHED";
        state.server.acceptQ += 1;
        // server remains LISTEN conceptually; we model it as LISTEN with queued conn
        state.server.state = "LISTEN";
        log("3-way handshake complete → client ESTABLISHED; server queues connection in accept queue");
        render();
      }

      function accept(){
        if(state.server.state !== "LISTEN") return log("accept(): server must be LISTEN");
        if(state.server.acceptQ <= 0) return log("accept(): no pending connections");
        state.server.acceptQ -= 1;
        // in real: accept returns new fd in ESTABLISHED
        log("server: accept() returns new connected socket (ESTABLISHED)");
        render();
      }

      function send(){
        if(state.client.state !== "ESTABLISHED") return log("send(): client must be ESTABLISHED");
        // in real: server must have accepted or kernel buffers hold; we simulate acceptQ as buffer
        state.client.sendQ += 1;
        state.server.recvQ += 1;
        log("client: send() → bytes in flight; server: recv buffer increases");
        render();
      }

      function recv(){
        if(state.server.recvQ <= 0) return log("recv(): server recvQ empty");
        state.server.recvQ -= 1;
        log("server: recv() consumes data from recv buffer");
        render();
      }

      function closeClient(){
        if(state.client.state !== "ESTABLISHED") return log("close(): client must be ESTABLISHED");
        state.client.state = "FIN_WAIT_1";
        state.server.state = "CLOSE_WAIT";
        log("client close() → FIN_WAIT_1; server receives FIN → CLOSE_WAIT");
        render();
      }

      function closeServer(){
        if(state.server.state !== "CLOSE_WAIT") return log("server close(): must be CLOSE_WAIT");
        state.server.state = "LAST_ACK";
        state.client.state = "FIN_WAIT_2";
        log("server close() → LAST_ACK; client receives ACK → FIN_WAIT_2");
        render();
      }

      function finalAck(){
        if(state.server.state !== "LAST_ACK") return log("finalAck(): must be LAST_ACK");
        state.server.state = "CLOSED";
        state.client.state = "TIME_WAIT";
        log("final ACK: server CLOSED; client enters TIME_WAIT to absorb delayed packets");
        render();
        setTimeout(()=>{
          if(state.client.state==="TIME_WAIT"){
            state.client.state="CLOSED";
            log("TIME_WAIT expired → client CLOSED");
            render();
          }
        }, 1500);
      }

      function reset(){
        state.client = {state:"CLOSED", sendQ:0, recvQ:0};
        state.server = {state:"CLOSED", acceptQ:0, sendQ:0, recvQ:0};
        state.log = [];
        log("reset");
        render();
      }

      function render(){
        root.innerHTML = "";
        const wrap = h("div", {class:"widget"}, [
          h("div", {class:"wtitle"}, [
            h("h4", {html:"TCP Socket State Lab"}),
            h("span", {class:"pill"}, [
              h("strong", {}, ["handshake + teardown"]),
              h("span",{class:"muted2"},["•"]),
              h("span",{class:"muted"},["accept queue"])
            ])
          ]),
          h("div", {class:"wbody"}, [
            h("div", {class:"muted", style:"margin-bottom:10px"}, [
              "A toy model of TCP states and server accept behavior. Use it to reason about ",
              h("code",{},["listen()"]),
              " backlog, connection establishment, and why ",
              h("code",{},["TIME_WAIT"]),
              " exists."
            ]),
            h("div", {class:"grid2"}, [
              h("div", {}, [
                renderEndpoint("Client", state.client),
                renderEndpoint("Server", state.server, true),
                h("div", {class:"glass pad", style:"margin-top:12px"}, [
                  h("div",{class:"section-title"},["ACTIONS"]),
                  h("div", {style:"display:flex; gap:10px; flex-wrap:wrap; margin-top:10px"}, [
                    h("button",{class:"btn primary small", onclick: listen},["server listen()"]),
                    h("button",{class:"btn small", onclick: connect},["client connect()"]),
                    h("button",{class:"btn small", onclick: handshake},["complete handshake"]),
                    h("button",{class:"btn small", onclick: accept},["server accept()"]),
                    h("button",{class:"btn small", onclick: send},["client send()"]),
                    h("button",{class:"btn small", onclick: recv},["server recv()"]),
                    h("button",{class:"btn small", onclick: closeClient},["client close()"]),
                    h("button",{class:"btn small", onclick: closeServer},["server close()"]),
                    h("button",{class:"btn small", onclick: finalAck},["final ACK"]),
                    h("button",{class:"btn small ghost", onclick: reset},["reset"])
                  ])
                ])
              ]),
              h("div", {}, [
                h("div", {class:"glass pad"}, [
                  h("div", {class:"section-title"}, ["TRACE (SIMULATED)"]),
                  h("div", {class:"muted2 small", style:"margin-top:6px"}, [
                    "Real debugging: ",
                    h("code",{},["ss -antp"]),
                    ", ",
                    h("code",{},["tcpdump"]),
                    ", ",
                    h("code",{},["netstat"]),
                    ", ",
                    h("code",{},["strace -f -e trace=network"])
                  ]),
                  h("div", {style:"margin-top:10px"}, state.log.map(e=>h("div",{class:"mono small", style:"padding:6px 0; border-bottom:1px solid var(--border)"},[
                    h("span",{class:"muted2"},[fmt(e.t)]),"  ",h("span",{class:"muted"},[e.msg])
                  ])))
                ]),
                h("div", {class:"glass pad", style:"margin-top:12px"}, [
                  h("div",{class:"section-title"},["OPERATIONAL NOTES"]),
                  h("div",{class:"muted", style:"margin-top:8px; line-height:1.7"},[
                    h("ul",{},[
                      h("li",{},["Backlog overflow → SYNs dropped or refused (depends on kernel settings)."]),
                      h("li",{},["accept() returns a new file descriptor for the established connection; the listening fd stays in LISTEN."]),
                      h("li",{},["TIME_WAIT is normal on the active closer; reuse requires SO_REUSEADDR/SO_REUSEPORT + care."])
                    ])
                  ])
                ])
              ])
            ])
          ])
        ]);
        root.appendChild(wrap);
      }

      function renderEndpoint(label, e, isServer=false){
        const badge = (s)=>{
          if(s==="ESTABLISHED") return "good";
          if(s==="LISTEN" || s.includes("WAIT")) return "warn";
          if(s==="CLOSED") return "";
          return "";
        };
        return h("div", {class:"glass pad", style:"margin-top:12px"}, [
          h("div", {style:"display:flex; align-items:center; justify-content:space-between; gap:10px"}, [
            h("div", {style:"font-weight:900; letter-spacing:-.02em"}, [label]),
            h("span", {class:"pill"}, [h("strong",{},[e.state])])
          ]),
          isServer ? h("div",{class:"muted2 small", style:"margin-top:8px"},[`acceptQ ${e.acceptQ} • recvQ ${e.recvQ}`]) :
                     h("div",{class:"muted2 small", style:"margin-top:8px"},[`sendQ ${e.sendQ} • recvQ ${e.recvQ}`]),
          h("div", {class:"muted", style:"margin-top:10px"}, [
            "State meaning: ",
            h("span",{class:"mono"}, [e.state]),
            isServer && e.state==="LISTEN" ? " (listening socket; accept creates connected sockets)" : ""
          ])
        ]);
      }

      function fmt(d){
        const pad=(n)=>String(n).padStart(2,"0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }

      render();
    }

    return { mount };
  })();

  /* ---------------------------------------------
   * 6) select/poll/epoll Complexity Lab
   * --------------------------------------------- */
  const EPOLL_LAB = (function(){
    function mount(rootId, opts={}){
      const root = typeof rootId === "string" ? document.getElementById(rootId) : rootId;
      if(!root) return;

      const state = {
        N: opts.N || 2000,
        k: opts.k || 20,
        model: "select",
        tick: 0
      };

      function cost(model, N, k){
        // Toy CPU-operation counts per event loop iteration
        if(model==="select") return {scan: N, deliver: k, total: N + k};
        if(model==="poll")   return {scan: N, deliver: k, total: N + k};
        if(model==="epoll")  return {scan: Math.round(Math.log2(N)+1), deliver: k, total: Math.round(Math.log2(N)+1) + k};
        return {scan:N, deliver:k, total:N+k};
      }

      function render(){
        root.innerHTML = "";
        const wrap = h("div",{class:"widget"},[
          h("div",{class:"wtitle"},[
            h("h4",{html:"I/O Multiplexing Lab"}),
            h("span",{class:"pill"},[
              h("strong",{},["select vs poll vs epoll"]),
              h("span",{class:"muted2"},["•"]),
              h("span",{class:"muted"},["O(N) vs O(k)"])
            ])
          ]),
          h("div",{class:"wbody"},[
            h("div",{class:"muted",style:"margin-bottom:10px"},[
              "Alternative I/O models are about scaling readiness notification. ",
              "This lab shows the *shape* of the cost: scanning ",
              h("code",{},["N"]),
              " fds each loop vs delivering only the ",
              h("code",{},["k"]),
              " ready ones."
            ]),
            h("div",{class:"grid2"},[
              h("div",{},[
                h("div",{class:"glass pad"},[
                  h("div",{class:"section-title"},["CONTROLS"]),
                  slider("Tracked fds (N)", state.N, 50, 200000, (v)=>{state.N=v; render();}),
                  slider("Ready fds per tick (k)", state.k, 1, 2000, (v)=>{state.k=v; render();}),
                  h("div",{style:"display:flex; gap:10px; flex-wrap:wrap; margin-top:10px"},[
                    modelBtn("select"),
                    modelBtn("poll"),
                    modelBtn("epoll"),
                    h("button",{class:"btn small ghost", onclick: ()=>{state.N=2000; state.k=20; state.model="select"; render();}},["reset"])
                  ]),
                  h("div",{class:"muted2 small",style:"margin-top:10px"},[
                    "Rule of thumb: if N is large and k is small, epoll scales better; but design, wakeups, and thread model matter too."
                  ])
                ]),
                h("div",{class:"glass pad", style:"margin-top:12px"},[
                  h("div",{class:"section-title"},["COMPLEXITY SNAPSHOT"]),
                  snapshot()
                ])
              ]),
              h("div",{},[
                h("div",{class:"glass pad"},[
                  h("div",{class:"section-title"},["OPERATIONAL TAKEAWAYS"]),
                  h("div",{class:"muted",style:"margin-top:8px; line-height:1.7"},[
                    h("ul",{},[
                      h("li",{},["select(): fd_set bitmasks → hard FD_SETSIZE limits (unless using pselect variants); O(N) scanning."]),
                      h("li",{},["poll(): array of pollfd → avoids bitset size limit, but still O(N) scanning."]),
                      h("li",{},["epoll(): kernel maintains interest list; wait returns only ready set O(k)."]),
                      h("li",{},["Edge-triggered epoll requires draining until EAGAIN; otherwise you can stall."]),
                      h("li",{},["Nonblocking I/O + backpressure is essential to keep a single loop responsive."])
                    ])
                  ])
                ]),
                h("div",{class:"glass pad", style:"margin-top:12px"},[
                  h("div",{class:"section-title"},["MINI-EXPERIMENT"]),
                  h("div",{class:"muted",style:"margin-top:8px; line-height:1.7"},[
                    "Try: set N=50,000 and k=5. Observe how the scan cost dominates for select/poll. ",
                    "Then increase k to 1,000 and notice epoll’s deliver cost dominates. ",
                    "Conclusion: epoll optimizes the common case ",
                    h("code",{},["k << N"]),
                    ", but you still need efficient per-connection work."
                  ])
                ])
              ])
            ])
          ])
        ]);
        root.appendChild(wrap);
      }

      function modelBtn(name){
        const isActive = state.model===name;
        return h("button",{class:`btn small ${isActive?"primary":""}`, onclick: ()=>{state.model=name; render();}},[name]);
      }

      function slider(label, value, min, max, on){
        const wrap = h("div",{style:"margin-top:10px"},[]);
        wrap.appendChild(h("div",{class:"muted2 small", style:"margin-bottom:6px"},[`${label}: `, h("span",{class:"mono"},[String(value)])]));
        const input = h("input",{type:"range", min:String(min), max:String(max), value:String(value), class:"input"});
        input.style.padding="6px 10px";
        input.addEventListener("input", ()=>on(Number(input.value)));
        wrap.appendChild(input);
        return wrap;
      }

      function snapshot(){
        const c = cost(state.model, state.N, state.k);
        const rows = [
          ["Model", state.model],
          ["Tracked fds (N)", String(state.N)],
          ["Ready fds (k)", String(state.k)],
          ["Scan cost", `~${c.scan} ops / tick`],
          ["Delivery cost", `~${c.deliver} ops / tick`],
          ["Total cost", `~${c.total} ops / tick`],
        ];
        const table = h("table",{class:"table", style:"margin-top:10px"},[
          h("thead",{},[h("tr",{},[h("th",{},["Metric"]),h("th",{},["Value"])])]),
          h("tbody",{}, rows.map(r=>h("tr",{},[h("td",{},[r[0]]),h("td",{class:"mono"},[r[1]])])))
        ]);
        return table;
      }

      render();
    }

    return { mount };
  })();

  /* ---------------------------------------------
   * 7) strace Snippet Parser (syscall histogram)
   * --------------------------------------------- */
  const STRACE_PARSER = (function(){
    function mount(rootId, opts={}){
      const root = typeof rootId === "string" ? document.getElementById(rootId) : rootId;
      if(!root) return;

      const state = {counts:new Map(), errors:new Map(), total:0};

      function parse(text){
        state.counts.clear();
        state.errors.clear();
        state.total = 0;

        // Very tolerant regex:
        // 12345  openat(....) = 3
        // openat(...) = -1 ENOENT (No such file or directory)
        const lines = text.split(/\r?\n/);
        for(const line of lines){
          const m = line.match(/^\s*(?:\d+\s+)?([a-zA-Z_][a-zA-Z0-9_]+)\(/);
          if(!m) continue;
          const name = m[1];
          state.total += 1;
          state.counts.set(name, (state.counts.get(name)||0)+1);

          const em = line.match(/=\s*-1\s+([A-Z0-9_]+)/);
          if(em){
            const err = em[1];
            const key = `${name}:${err}`;
            state.errors.set(key, (state.errors.get(key)||0)+1);
          }
        }
      }

      function render(){
        root.innerHTML = "";
        const ta = h("textarea",{class:"input", rows:"10", placeholder:"Paste a short strace snippet here...\n\nTip: strace -f -tt -T -e trace=%file,%process,%network <cmd>"});
        ta.style.fontFamily = "var(--mono)";
        ta.style.lineHeight = "1.5";
        ta.value = opts.example || "";

        const out = h("div", {}, []);

        const wrap = h("div",{class:"widget"},[
          h("div",{class:"wtitle"},[
            h("h4",{html:"strace Analyzer"}),
            h("span",{class:"pill"},[
              h("strong",{},["syscall histogram"]),
              h("span",{class:"muted2"},["•"]),
              h("span",{class:"muted"},["errors surfaced"])
            ])
          ]),
          h("div",{class:"wbody"},[
            h("div",{class:"muted",style:"margin-bottom:10px"},[
              "Paste a small trace. This widget extracts syscall frequency and highlights common error patterns (e.g., ",
              h("code",{},["openat:ENOENT"]),
              "). It helps you decide what to inspect next."
            ]),
            ta,
            h("div",{style:"display:flex; gap:10px; flex-wrap:wrap; margin-top:10px"},[
              h("button",{class:"btn primary small", onclick: ()=>{
                parse(ta.value);
                out.replaceChildren(renderTables());
              }},["Parse trace"]),
              h("button",{class:"btn small ghost", onclick: ()=>{
                ta.value = opts.example || "";
                out.innerHTML="";
              }},["Reset"])
            ]),
            h("div",{style:"margin-top:12px"}, [out])
          ])
        ]);
        root.appendChild(wrap);
      }

      function renderTables(){
        const entries = Array.from(state.counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 20);
        const errors = Array.from(state.errors.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 20);

        const countTable = h("table",{class:"table"},[
          h("thead",{},[h("tr",{},[h("th",{},["syscall"]),h("th",{},["count"])] )]),
          h("tbody",{}, entries.map(([name,c])=>h("tr",{},[
            h("td",{class:"mono"},[name]),
            h("td",{class:"mono"},[String(c)])
          ])))
        ]);

        const errTable = h("table",{class:"table", style:"margin-top:12px"},[
          h("thead",{},[h("tr",{},[h("th",{},["syscall:errno"]),h("th",{},["count"])] )]),
          h("tbody",{}, errors.length ? errors.map(([k,c])=>h("tr",{},[
            h("td",{class:"mono"},[k]),
            h("td",{class:"mono"},[String(c)])
          ])) : [h("tr",{},[h("td",{colspan:"2"},["(no errors detected)"])])])
        ]);

        return h("div",{},[
          h("div",{class:"pill"},[h("strong",{},["Total calls"]), h("span",{class:"muted2"},["•"]), h("span",{class:"mono"},[String(state.total)])]),
          h("div",{class:"muted2 small", style:"margin-top:10px"},["Top syscalls (first 20):"]),
          countTable,
          h("div",{class:"muted2 small", style:"margin-top:12px"},["Top errors (first 20):"]),
          errTable
        ]);
      }

      render();
    }

    return { mount };
  })();

  window.TLPIWidgets = {
    mountKernelGraph: KERNEL_GRAPH.mount,
    mountFDLab: FD_LAB.mount,
    mountProcLab: PROC_LAB.mount,
    mountSignalLab: SIGNAL_LAB.mount,
    mountSocketLab: SOCKET_LAB.mount,
    mountEpollLab: EPOLL_LAB.mount,
    mountStraceParser: STRACE_PARSER.mount,
    kernelGraph: KERNEL_GRAPH
  };
})();
