/* TLPI Interactive Library v2 UI
   - Theme toggle (dark/light)
   - Sidebar nav (chapters + appendices) with visited tracking
   - Live search filter
   - Right-side table of contents with smooth scroll
   - Scroll progress bar
   - Code copy buttons
   - Quiz interaction with animations
   - Scroll-reveal animations (IntersectionObserver)
   - Reading time estimation
   - Chapter reading progress (localStorage)
   - Back to top button
   - Glass card mouse-tracking spotlight
*/
(function(){
  const LS_THEME_KEY = "tlpi_theme_v2";
  const LS_VISITED_KEY = "tlpi_visited_v2";
  const LS_PROGRESS_KEY = "tlpi_progress_v2";

  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  /* ── Theme ─────────────────────────────────── */
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

  /* ── Scroll progress ───────────────────────── */
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

  /* ── Visited chapters tracking ─────────────── */
  function getVisited(){
    try{
      return JSON.parse(localStorage.getItem(LS_VISITED_KEY) || "[]");
    }catch(e){ return []; }
  }
  function markVisited(id){
    const visited = getVisited();
    if(!visited.includes(id)){
      visited.push(id);
      localStorage.setItem(LS_VISITED_KEY, JSON.stringify(visited));
    }
  }

  /* ── Reading progress (per chapter) ────────── */
  function getProgress(){
    try{
      return JSON.parse(localStorage.getItem(LS_PROGRESS_KEY) || "{}");
    }catch(e){ return {}; }
  }
  function saveProgress(id, pct){
    const progress = getProgress();
    progress[id] = Math.max(progress[id] || 0, Math.round(pct));
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(progress));
  }

  function initReadingProgress(chapterId){
    if(!chapterId) return;
    const update = ()=>{
      const h = document.documentElement;
      const max = Math.max(1, h.scrollHeight - h.clientHeight);
      const pct = (h.scrollTop / max) * 100;
      saveProgress(chapterId, pct);
      if(pct > 90) markVisited(chapterId);
    };
    window.addEventListener("scroll", update, {passive:true});
    // Initial
    setTimeout(update, 500);
  }

  /* ── Reading time estimate ─────────────────── */
  function estimateReadingTime(){
    const main = qs("main");
    if(!main) return;
    const text = main.innerText || "";
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 220));
    const badge = qs("#readingTime");
    if(badge) badge.textContent = `~${minutes} min read`;
    // Also inject if slot exists
    const slot = qs("#readingTimeBadge");
    if(slot){
      slot.innerHTML = `<span class="icon">&#128214;</span> ~${minutes} min read`;
    }
  }

  /* ── Sidebar nav ───────────────────────────── */
  function mountNavList(nav, currentHref){
    const list = qs("#navList");
    if(!list || !nav) return;
    const visited = getVisited();

    const mkItem = (item, kind)=>{
      const a = document.createElement("a");
      a.className = "navitem";
      if(visited.includes(item.id)) a.classList.add("visited");
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
        ? `PDF p.${item.pdfPageIndex+1} (index) \u2022 ${item.id}`
        : `Appendix \u2022 PDF p.${item.pdfPageIndex+1} \u2022 ${item.id}`;

      label.appendChild(t);
      label.appendChild(m);
      a.appendChild(num);
      a.appendChild(label);

      // Show completion check for visited
      if(visited.includes(item.id)){
        const check = document.createElement("div");
        check.className = "completion-check";
        check.innerHTML = "&#10003;";
        check.title = "Visited";
        a.appendChild(check);
      }

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
      prev.title = `Previous: ${prevItem.kind==="chapter" ? "Ch "+prevItem.n : "App "+prevItem.letter} \u2014 ${prevItem.title}`;
    } else {
      prev.href = "#";
      prev.setAttribute("disabled","true");
      prev.title = "No previous item";
    }
    if(nextItem){
      next.href = `../${nextItem.href}`;
      next.removeAttribute("disabled");
      next.title = `Next: ${nextItem.kind==="chapter" ? "Ch "+nextItem.n : "App "+nextItem.letter} \u2014 ${nextItem.title}`;
    } else {
      next.href = "#";
      next.setAttribute("disabled","true");
      next.title = "No next item";
    }
  }

  /* ── Table of contents with smooth scroll ─── */
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
      // Smooth scroll
      a.addEventListener("click", (e)=>{
        e.preventDefault();
        const target = document.getElementById(h.id);
        if(target){
          target.scrollIntoView({behavior:"smooth", block:"start"});
          history.replaceState(null, "", `#${h.id}`);
        }
      });
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

  /* ── Code copy buttons ─────────────────────── */
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
          btn.textContent = "Copied \u2713";
          btn.classList.add("copied");
          setTimeout(()=>{
            btn.textContent = prev;
            btn.classList.remove("copied");
          }, 1200);
        }catch(e){
          btn.textContent = "Copy failed";
          setTimeout(()=>btn.textContent = "Copy", 900);
        }
      });
    });
  }

  /* ── Quiz interaction ──────────────────────── */
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
            if(feedback){
              feedback.textContent = q.getAttribute("data-explain") || "Correct.";
              feedback.style.color = "rgba(34,197,94,.9)";
            }
          } else {
            opt.classList.add("wrong");
            const correct = opts.find(o=>Number(o.getAttribute("data-opt"))===answer);
            if(correct) correct.classList.add("correct");
            if(feedback){
              feedback.textContent = q.getAttribute("data-explain") || "Incorrect \u2014 review the concept and retry.";
              feedback.style.color = "";
            }
          }
          // Allow retry after 3s
          setTimeout(()=>{ locked = false; }, 3000);
        });
      });
    });
  }

  /* ── Scroll-reveal animations ──────────────── */
  function initScrollReveal(){
    // Auto-tag glass sections in main for reveal animation
    const main = qs("main");
    if(!main) return;

    const sections = qsa(":scope > .glass", main);
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(prefersReduced) return;

    sections.forEach((el, i)=>{
      el.classList.add("reveal");
      if(i > 0 && i < 5) el.classList.add(`reveal-delay-${i}`);
    });

    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, {rootMargin:"0px 0px -60px 0px", threshold:0.05});

    sections.forEach(el=>obs.observe(el));
  }

  /* ── Back to top ───────────────────────────── */
  function initBackToTop(){
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.innerHTML = "\u2191";
    btn.title = "Back to top";
    btn.setAttribute("aria-label", "Scroll to top");
    document.body.appendChild(btn);

    btn.addEventListener("click", ()=>{
      window.scrollTo({top:0, behavior:"smooth"});
    });

    const onScroll = ()=>{
      btn.classList.toggle("show", window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();
  }

  /* ── Glass card mouse spotlight ────────────── */
  function initCardSpotlight(){
    qsa(".glass.hover").forEach(card=>{
      card.addEventListener("mousemove", (e)=>{
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    });
  }

  function setSubTitle(text){
    const el = qs("#subTitle");
    if(el) el.textContent = text;
  }

  /* ── Chapter page init ─────────────────────── */
  function initChapterPage(ctx){
    initTheme();
    initThemeSync();
    initScrollProgress();
    initBackToTop();
    if(window.TLPI_NAV){
      const here = location.pathname.replace(/^.*\//,"");
      const currentHref = (ctx.kind==="chapter")
        ? `chapters/ch${String(ctx.n).padStart(2,"0")}.html`
        : `appendices/${ctx.letter.toLowerCase()}.html`;
      mountNavList(window.TLPI_NAV, currentHref);
      mountPrevNext(window.TLPI_NAV, ctx.kind, ctx.id);
    }
    mountTOC();
    mountCopyButtons();
    mountQuiz();
    initScrollReveal();
    estimateReadingTime();
    initCardSpotlight();
    if(ctx && ctx.subtitle) setSubTitle(ctx.subtitle);

    // Track reading progress
    if(ctx && ctx.id) initReadingProgress(ctx.id);
    if(ctx && ctx.id) markVisited(ctx.id);

    // Keyboard shortcuts
    window.addEventListener("keydown", (e)=>{
      if(e.key === "/" && !e.metaKey && !e.ctrlKey){
        const s = qs("#navSearch");
        if(s){ e.preventDefault(); s.focus(); }
      }
      if(e.key === "ArrowLeft" && (e.metaKey || e.ctrlKey)){
        const p = qs("[data-prev]");
        if(p && !p.hasAttribute("disabled")){ e.preventDefault(); location.href = p.href; }
      }
      if(e.key === "ArrowRight" && (e.metaKey || e.ctrlKey)){
        const n = qs("[data-next]");
        if(n && !n.hasAttribute("disabled")){ e.preventDefault(); location.href = n.href; }
      }
    });
  }

  /* ── Index page init ───────────────────────── */
  function initIndexPage(){
    initTheme();
    initThemeSync();
    initScrollProgress();
    initBackToTop();
    mountCopyButtons();
    initCardSpotlight();

    const list = qs("#chapterCards");
    if(!list || !window.TLPI_NAV) return;

    const visited = getVisited();
    const progress = getProgress();

    const mkCard = (ch)=>{
      const a = document.createElement("a");
      a.className = "glass pad hover";
      a.style.display = "block";
      a.href = ch.href;
      const isVisited = visited.includes(ch.id);
      const pct = progress[ch.id] || 0;

      a.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
          <div class="pill"><strong>Ch ${String(ch.n).padStart(2,"0")}</strong><span class="muted2">\u2022</span><span class="muted">${escapeHtml(ch.id)}</span></div>
          <div style="display:flex; align-items:center; gap:8px">
            ${isVisited ? '<div class="completion-check">&#10003;</div>' : ''}
            <div class="muted2 small mono">PDF p.${ch.pdfPageIndex+1}</div>
          </div>
        </div>
        <div style="margin-top:10px; font-weight:900; letter-spacing:-.02em; font-size:16px">${escapeHtml(ch.title)}</div>
        <div class="muted" style="margin-top:8px; font-size:13px; line-height:1.55">
          Open an interactive, production-minded companion page: mental model, syscall map, failure modes, labs, and an executable simulator.
        </div>
        ${pct > 0 ? `<div style="margin-top:10px; height:3px; border-radius:999px; background:var(--border); overflow:hidden"><div style="height:100%; width:${pct}%; background:linear-gradient(90deg, var(--accent), var(--accent2)); border-radius:999px; transition:width .3s ease"></div></div>` : ''}
      `;
      return a;
    };

    window.TLPI_NAV.chapters.forEach(ch => list.appendChild(mkCard(ch)));

    // Stagger fade-in for cards
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!prefersReduced){
      const cards = qsa(":scope > a", list);
      const obs = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      }, {rootMargin:"0px 0px -40px 0px", threshold:0.05});

      cards.forEach((card, i)=>{
        card.classList.add("reveal");
        card.style.transitionDelay = `${Math.min(i * 0.03, 0.4)}s`;
        obs.observe(card);
      });
    }

    const search = qs("#globalSearch");
    if(search){
      search.addEventListener("input", ()=>{
        const q = search.value.trim().toLowerCase();
        qsa(":scope > a", list).forEach(a=>{
          a.style.display = a.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }

    // Show reading stats
    const statsEl = qs("#readingStats");
    if(statsEl){
      const total = window.TLPI_NAV.chapters.length + (window.TLPI_NAV.appendices ? window.TLPI_NAV.appendices.length : 0);
      const visitedCount = visited.length;
      statsEl.innerHTML = `<span class="pill"><strong>${visitedCount}</strong><span class="muted2">/</span><span class="muted">${total} visited</span></span>`;
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  window.TLPIUI = { initChapterPage, initIndexPage, setTheme, getVisited, getProgress };
})();
