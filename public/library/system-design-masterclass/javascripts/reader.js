(() => {
  const key = "sdm-reader-layout";
  let layout = "wide";
  try {
    if (localStorage.getItem(key) === "focus") layout = "focus";
  } catch { /* Reading controls still work when storage is unavailable. */ }
  document.documentElement.dataset.readerLayout = layout;

  let article;
  let progress;
  let frame = 0;
  const updateProgress = () => {
    frame = 0;
    if (!article?.isConnected || !progress) return;
    const bounds = article.getBoundingClientRect();
    const distance = bounds.height - innerHeight;
    const value = distance > 0 ? Math.max(0, Math.min(1, -bounds.top / distance)) : 0;
    progress.style.transform = `scaleX(${value})`;
  };
  const updateTables = () => {
    article?.querySelectorAll(".md-typeset__scrollwrap").forEach((wrapper) => {
      const overflowing = wrapper.scrollWidth > wrapper.clientWidth + 1;
      if (overflowing) {
        wrapper.tabIndex = 0;
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-label", "Scrollable table");
      } else {
        wrapper.removeAttribute("tabindex");
        wrapper.removeAttribute("role");
        wrapper.removeAttribute("aria-label");
      }
    });
  };
  const scheduleProgress = () => {
    if (!frame) frame = requestAnimationFrame(updateProgress);
  };
  addEventListener("scroll", scheduleProgress, { passive: true });
  const updateLayout = () => {
    updateTables();
    scheduleProgress();
  };
  addEventListener("resize", updateLayout);
  const observer = new ResizeObserver(updateLayout);

  document$.subscribe(() => {
    observer.disconnect();
    document.querySelector(".md-search")?.setAttribute("aria-label", "Search course");
    document.querySelector(".md-progress")?.setAttribute("aria-label", "Loading page");
    article = document.querySelector(".md-content__inner");
    if (!article) return;
    progress = document.querySelector(".sdm-reading-progress");
    if (!progress) {
      progress = document.createElement("div");
      progress.className = "sdm-reading-progress";
      progress.setAttribute("aria-hidden", "true");
      document.querySelector(".md-header")?.append(progress);
    }
    const home = Boolean(article.querySelector(".course-hero"));
    progress.hidden = home;
    if (!home && !article.querySelector(".sdm-reader-bar")) {
      const bar = document.createElement("div");
      bar.className = "sdm-reader-bar";
      const label = document.createElement("span");
      label.className = "sdm-reader-label";
      label.textContent = document.querySelector(".md-tabs__item--active")?.textContent.trim() || "Field notes";
      const options = document.createElement("div");
      options.className = "sdm-reader-options";
      options.setAttribute("role", "group");
      options.setAttribute("aria-label", "Reading layout");
      for (const [value, text, title] of [
        ["wide", "Workspace", "Show chapter navigation and table of contents"],
        ["focus", "Focus", "Hide desktop sidebars for focused reading"]
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.title = title;
        button.dataset.layout = value;
        button.setAttribute("aria-pressed", String(layout === value));
        button.addEventListener("click", () => {
          layout = value;
          document.documentElement.dataset.readerLayout = value;
          options.querySelectorAll("button").forEach((item) => {
            item.setAttribute("aria-pressed", String(item.dataset.layout === value));
          });
          try { localStorage.setItem(key, value); } catch { /* Optional persistence. */ }
          scheduleProgress();
        });
        options.append(button);
      }
      bar.append(label, options);
      article.prepend(bar);
    }
    observer.observe(article);
    updateLayout();
  });
})();
