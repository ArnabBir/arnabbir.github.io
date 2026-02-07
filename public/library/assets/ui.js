/* TLPI Interactive Library v2 UI
   - Theme toggle (dark/light)
   - Sidebar nav (chapters + appendices)
   - Live search filter
   - Right-side table of contents
   - Scroll progress bar
   - Code copy buttons
   - Quiz interaction
*/
(function(){
  const LS_THEME_KEY = "tlpi_theme_v2";

  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  function setTheme(mode){
    const root = document.documentElement;
    if(mode === "light") root.classList.add("theme-light");
    else root.classList.remove("theme-light");
    localStorage.setItem(LS_THEME_KEY, mode);
    const badge = qs("[data-theme-badge]");
    if(badge) badge.textContent = (mode === "light") ? "Light" : "Dark";
  }

  function initTheme(){
    const saved = localStorage.getItem(LS_THEME_KEY);
    if(saved) setTheme(saved);
    else {
      const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      setTheme(prefersLight ? "light" : "dark");
    }
    const toggle = qs("[data-theme-toggle]");
    if(toggle){
      toggle.addEventListener("click", ()=>{
        const isLight = document.documentElement.classList.contains("theme-light");
        setTheme(isLight ? "dark" : "light");
      });
    }
  }

  function initThemeSync(){
    window.addEventListener("message", (event)=>{
      const data = event.data || {};
      if(data.type !== "THEME_CHANGE") return;
      const next = data.theme === "light" ? "light" : "dark";
      setTheme(next);
    });
  }

  function initScrollProgress(){
    const bar = qs("#scrollProgress");
    if(!bar) return;
    const onScroll = ()=>{
      const h = document.documentElement;
      const max = Math.max(1, h.scrollHeight - h.clientHeight);
      const p = (h.scrollTop / max) * 100;
      bar.style.width = `${p}%`;
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();
  }

  function mountNavList(nav, currentHref){
    const list = qs("#navList");
    if(!list || !nav) return;

    const mkItem = (item, kind)=>{
      const a = document.createElement("a");
      a.className = "navitem";
      a.href = (kind==="chapter") ? (`../${item.href}`) : (`../${item.href}`);
      const num = document.createElement("div");
      num.className = "num";
      num.textContent = kind==="chapter" ? String(item.n).padStart(2,"0") : item.letter;
      const label = document.createElement("div");
      label.className = "label";
      const t = document.createElement("div");
      t.className = "t";
      t.textContent = item.title;
      const m = document.createElement("div");
      m.className = "m";
      m.textContent = (kind==="chapter")
        ? `PDF p.${item.pdfPageIndex+1} (index) • ${item.id}`
        : `Appendix • PDF p.${item.pdfPageIndex+1} • ${item.id}`;

      label.appendChild(t);
      label.appendChild(m);
      a.appendChild(num);
      a.appendChild(label);

      if(currentHref && currentHref.endsWith(item.href)) a.classList.add("active");
      return a;
    };

    // Chapters
    const chapHeader = document.createElement("div");
    chapHeader.className = "section-title";
    chapHeader.style.marginTop = "6px";
    chapHeader.textContent = "CHAPTERS";
    list.appendChild(chapHeader);

    nav.chapters.forEach(ch => list.appendChild(mkItem(ch, "chapter")));

    // Appendices
    if(nav.appendices && nav.appendices.length){
      const appHeader = document.createElement("div");
      appHeader.className = "section-title";
      appHeader.style.marginTop = "18px";
      appHeader.textContent = "APPENDICES";
      list.appendChild(appHeader);
      nav.appendices.forEach(ap => list.appendChild(mkItem(ap, "appendix")));
    }

    // Filter
    const input = qs("#navSearch");
    if(input){
      input.addEventListener("input", ()=>{
        const q = input.value.trim().toLowerCase();
        qsa(".navitem", list).forEach(a=>{
          const text = a.textContent.toLowerCase();
          a.style.display = text.includes(q) ? "" : "none";
        });
      });
    }
  }

  function mountPrevNext(nav, currentKind, currentId){
    const prev = qs("[data-prev]");
    const next = qs("[data-next]");
    if(!prev || !next || !nav) return;

    const flat = [];
    nav.chapters.forEach(ch=>flat.push({kind:"chapter", ...ch}));
    if(nav.appendices) nav.appendices.forEach(ap=>flat.push({kind:"appendix", ...ap}));

    const idx = flat.findIndex(x => x.id === currentId);
    const prevItem = idx > 0 ? flat[idx-1] : null;
    const nextItem = idx >=0 && idx < flat.length-1 ? flat[idx+1] : null;

    if(prevItem){
      prev.href = `../${prevItem.href}`;
      prev.removeAttribute("disabled");
      prev.title = `Previous: ${prevItem.kind==="chapter" ? "Ch "+prevItem.n : "App "+prevItem.letter} — ${prevItem.title}`;
    } else {
      prev.href = "#";
      prev.setAttribute("disabled","true");
      prev.title = "No previous item";
    }
    if(nextItem){
      next.href = `../${nextItem.href}`;
      next.removeAttribute("disabled");
      next.title = `Next: ${nextItem.kind==="chapter" ? "Ch "+nextItem.n : "App "+nextItem.letter} — ${nextItem.title}`;
    } else {
      next.href = "#";
      next.setAttribute("disabled","true");
      next.title = "No next item";
    }
  }

  function mountTOC(){
    const toc = qs("#toc");
    const main = qs("main");
    if(!toc || !main) return;

    const heads = qsa("h2[data-toc], h3[data-toc]", main);
    if(!heads.length) return;

    // Ensure IDs
    heads.forEach(h=>{
      if(!h.id){
        const base = h.getAttribute("data-toc") || h.textContent;
        const slug = base.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
        h.id = slug;
      }
    });

    toc.innerHTML = "";
    heads.forEach(h=>{
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.getAttribute("data-toc") || h.textContent;
      a.dataset.for = h.id;
      if(h.tagName.toLowerCase()==="h3") a.style.marginLeft = "10px";
      toc.appendChild(a);
    });

    const obs = new IntersectionObserver((entries)=>{
      const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if(!visible.length) return;
      const id = visible[0].target.id;
      qsa("#toc a").forEach(a=>a.classList.toggle("active", a.dataset.for===id));
    }, {rootMargin:"-20% 0px -70% 0px", threshold:[0.05,0.1,0.2]});

    heads.forEach(h=>obs.observe(h));
  }

  function mountCopyButtons(){
    qsa("[data-copy]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        const targetSel = btn.getAttribute("data-copy");
        const target = qs(targetSel);
        if(!target) return;
        const text = target.innerText;
        try{
          await navigator.clipboard.writeText(text);
          const prev = btn.textContent;
          btn.textContent = "Copied ✓";
          setTimeout(()=>btn.textContent = prev, 900);
        }catch(e){
          btn.textContent = "Copy failed";
          setTimeout(()=>btn.textContent = "Copy", 900);
        }
      });
    });
  }

  function mountQuiz(){
    qsa("[data-quiz]").forEach(q=>{
      const answer = Number(q.getAttribute("data-answer"));
      const opts = qsa("[data-opt]", q);
      const feedback = qs(".feedback", q);
      let locked = false;

      opts.forEach(opt=>{
        opt.addEventListener("click", ()=>{
          if(locked) return;
          locked = true;
          const idx = Number(opt.getAttribute("data-opt"));
          opts.forEach(o=>o.classList.remove("correct","wrong"));
          if(idx === answer){
            opt.classList.add("correct");
            if(feedback) feedback.textContent = q.getAttribute("data-explain") || "Correct.";
          } else {
            opt.classList.add("wrong");
            const correct = opts.find(o=>Number(o.getAttribute("data-opt"))===answer);
            if(correct) correct.classList.add("correct");
            if(feedback) feedback.textContent = q.getAttribute("data-explain") || "Incorrect — review the concept and retry.";
          }
        });
      });
    });
  }

  function setSubTitle(text){
    const el = qs("#subTitle");
    if(el) el.textContent = text;
  }

  function initChapterPage(ctx){
    initTheme();
    initThemeSync();
    initScrollProgress();
    if(window.TLPI_NAV){
      const here = location.pathname.replace(/^.*\//,"");
      // we are in chapters/ or appendices/ — link references are relative
      // For matching, use the tlpi_nav href
      const currentHref = (ctx.kind==="chapter")
        ? `chapters/ch${String(ctx.n).padStart(2,"0")}.html`
        : `appendices/${ctx.letter.toLowerCase()}.html`;
      mountNavList(window.TLPI_NAV, currentHref);
      mountPrevNext(window.TLPI_NAV, ctx.kind, ctx.id);
    }
    mountTOC();
    mountCopyButtons();
    mountQuiz();
    if(ctx && ctx.subtitle) setSubTitle(ctx.subtitle);

    // Keyboard shortcuts
    window.addEventListener("keydown", (e)=>{
      if(e.key === "/" && !e.metaKey && !e.ctrlKey){
        const s = qs("#navSearch");
        if(s){ e.preventDefault(); s.focus(); }
      }
      if(e.key === "ArrowLeft" && (e.metaKey || e.ctrlKey)){
        const p = qs("[data-prev]");
        if(p && !p.hasAttribute("disabled")) location.href = p.href;
      }
      if(e.key === "ArrowRight" && (e.metaKey || e.ctrlKey)){
        const n = qs("[data-next]");
        if(n && !n.hasAttribute("disabled")) location.href = n.href;
      }
    });
  }

  function initIndexPage(){
    initTheme();
    initThemeSync();
    initScrollProgress();
    mountCopyButtons();

    const list = qs("#chapterCards");
    if(!list || !window.TLPI_NAV) return;

    const mkCard = (ch)=>{
      const a = document.createElement("a");
      a.className = "glass pad hover";
      a.style.display = "block";
      a.href = ch.href;
      a.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
          <div class="pill"><strong>Ch ${String(ch.n).padStart(2,"0")}</strong><span class="muted2">•</span><span class="muted">${escapeHtml(ch.id)}</span></div>
          <div class="muted2 small mono">PDF p.${ch.pdfPageIndex+1}</div>
        </div>
        <div style="margin-top:10px; font-weight:900; letter-spacing:-.02em; font-size:16px">${escapeHtml(ch.title)}</div>
        <div class="muted" style="margin-top:8px; font-size:13px; line-height:1.55">
          Open an interactive, production-minded companion page: mental model, syscall map, failure modes, labs, and an executable simulator.
        </div>
      `;
      return a;
    };

    window.TLPI_NAV.chapters.forEach(ch => list.appendChild(mkCard(ch)));

    const search = qs("#globalSearch");
    if(search){
      search.addEventListener("input", ()=>{
        const q = search.value.trim().toLowerCase();
        qsa(":scope > a", list).forEach(a=>{
          a.style.display = a.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  window.TLPIUI = { initChapterPage, initIndexPage, setTheme };
})();
