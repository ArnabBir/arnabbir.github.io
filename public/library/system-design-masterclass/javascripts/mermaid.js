/* One render queue across Material's instant navigation; detached pages are skipped. */
(() => {
  const diagramConfig = {
    startOnLoad: false,
    theme: "base",
    securityLevel: "strict",
    fontFamily: "Inter, system-ui, sans-serif",
    themeVariables: {
      background: "#f8fafc", primaryColor: "#eaf2ff", primaryTextColor: "#172b4d",
      primaryBorderColor: "#426b9c", lineColor: "#526782", secondaryColor: "#edf7f5",
      tertiaryColor: "#f1f5f9", clusterBkg: "#f1f5f9", clusterBorder: "#b6c4d5",
      edgeLabelBackground: "#f8fafc", textColor: "#172b4d", fontSize: "16px",
      actorBkg: "#eaf2ff", actorBorder: "#426b9c", actorTextColor: "#172b4d",
      actorLineColor: "#8b9bb0", signalColor: "#526782", signalTextColor: "#172b4d",
      labelBoxBkgColor: "#edf7f5", labelBoxBorderColor: "#7b9d97", labelTextColor: "#172b4d",
      loopTextColor: "#172b4d", noteBkgColor: "#fff5d9", noteBorderColor: "#b58c35",
      noteTextColor: "#473a17", activationBkgColor: "#dce9f8", activationBorderColor: "#426b9c",
      sequenceNumberColor: "#ffffff"
    },
    flowchart: { curve: "linear", padding: 18, nodeSpacing: 36, rankSpacing: 52, htmlLabels: false },
    sequence: { useMaxWidth: false, actorMargin: 44, messageMargin: 34, mirrorActors: false },
    themeCSS: ".node rect, .node polygon, .node path { stroke-width: 1.3px; } .edgePath path { stroke-width: 1.4px; }"
  };
  mermaid.initialize(diagramConfig);
  let queue = Promise.resolve();
  let serial = 0;
  let openDialog;
  document$.subscribe(() => {
    openDialog?.close();
    document.querySelectorAll("pre.mermaid").forEach(block => {
      const diagram = document.createElement("div");
      diagram.className = "mermaid";
      diagram.textContent = block.textContent;
      block.replaceWith(diagram);
    });
    for (const diagram of document.querySelectorAll(".mermaid:not([data-queued])")) {
      diagram.dataset.queued = "true";
      const source = diagram.textContent;
      const id = `sdm-diagram-${++serial}`;
      queue = queue.then(async () => {
        if (!diagram.isConnected) return;
        try {
          // Material also initializes Mermaid on navigation. Apply our palette
          // at the actual render boundary so its default theme cannot replace it.
          mermaid.initialize(diagramConfig);
          const { svg } = await mermaid.render(id, source);
          if (!diagram.isConnected) return;
          diagram.innerHTML = svg;
          diagram.dataset.processed = "true";
          installControls(diagram, source, id);
        } catch (error) {
          if (!diagram.isConnected) return;
          diagram.textContent = "Diagram could not be drawn. The source is available below.";
          const details = document.createElement("details");
          const summary = document.createElement("summary");
          summary.textContent = "Diagram source";
          const code = document.createElement("pre");
          code.textContent = source;
          details.append(summary, code);
          diagram.append(details);
          console.error("Unable to render diagram", error);
        }
      });
    }
  });

  function installControls(diagram, source, id) {
    const svg = diagram.querySelector("svg");
    if (!svg) return;
    let preceding = diagram.previousElementSibling;
    while (preceding && !/^H[1-6]$/.test(preceding.tagName)) preceding = preceding.previousElementSibling;
    const title = preceding?.textContent.replace(/\s*¶\s*$/, "").trim() || "System design diagram";
    const shell = document.createElement("figure");
    shell.className = "sdm-diagram-shell";
    shell.setAttribute("aria-label", title);
    const toolbar = document.createElement("figcaption");
    toolbar.className = "sdm-diagram-toolbar";
    const label = document.createElement("span");
    label.className = "sdm-diagram-label";
    label.textContent = title;
    const actions = document.createElement("div");
    actions.className = "sdm-diagram-actions";
    actions.innerHTML = `<button type="button" data-action="zoom-out" aria-label="Zoom out">-</button>
      <output aria-label="Current zoom">100%</output>
      <button type="button" data-action="zoom-in" aria-label="Zoom in">+</button>
      <button type="button" data-action="fit" title="Show the whole diagram; labels may become smaller">Fit</button>
      <button type="button" data-action="reset" title="Restore readable label size">Read</button>
      <button type="button" data-action="fullscreen" aria-haspopup="dialog">Expand</button>`;
    toolbar.append(label, actions);
    const viewport = document.createElement("div");
    viewport.className = "sdm-diagram-viewport";
    viewport.tabIndex = 0;
    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-label", `${title}. Scroll to explore the diagram.`);
    const hint = document.createElement("p");
    hint.className = "sdm-diagram-hint";
    hint.textContent = "Scroll to follow the flow. Fit shows the overview; Read restores label size.";
    const details = document.createElement("details");
    details.className = "sdm-diagram-source";
    const summary = document.createElement("summary");
    summary.textContent = "Text diagram";
    const pre = document.createElement("pre");
    pre.textContent = source;
    details.append(summary, pre);
    diagram.replaceWith(shell);
    viewport.append(diagram);
    shell.append(toolbar, viewport, hint, details);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", title);
    const naturalWidth = svg.viewBox.baseVal.width || svg.getBBox().width;
    let scale = 1;
    const output = actions.querySelector("output");
    const available = () => {
      const style = getComputedStyle(viewport);
      return Math.max(1, viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    };
    // An overview can be requested, but never silently reduce text below 14px.
    const readingScale = () => Math.min(1, Math.max(0.9, available() / naturalWidth));
    const apply = () => {
      svg.style.width = `${Math.round(naturalWidth * scale)}px`;
      svg.style.maxWidth = "none";
      svg.style.height = "auto";
      output.value = `${Math.round(scale * 100)}%`;
      output.textContent = output.value;
    };
    actions.addEventListener("click", event => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "zoom-in") scale = Math.min(3, scale * 1.2);
      if (action === "zoom-out") scale = Math.max(0.1, scale / 1.2);
      if (action === "fit") scale = Math.min(1, available() / naturalWidth);
      if (action === "reset") scale = readingScale();
      if (action === "fit" || action === "reset") viewport.scrollTo({ left: 0, top: 0 });
      if (action === "fullscreen") {
        if (openDialog) { openDialog.close(); return; }
        const anchor = document.createComment("diagram position");
        shell.before(anchor);
        const dialog = document.createElement("dialog");
        dialog.className = "sdm-diagram-dialog";
        dialog.setAttribute("aria-label", title);
        document.body.append(dialog);
        dialog.append(shell);
        shell.classList.add("is-expanded");
        button.textContent = "Close";
        document.body.classList.add("sdm-diagram-open");
        // Keep repeated Tab / Shift+Tab inside the expanded reader.
        dialog.addEventListener("keydown", (event) => {
          if (event.key !== "Tab") return;
          const controls = [...dialog.querySelectorAll("button, summary, [tabindex]")]
            .filter((element) => element.tabIndex >= 0 && !element.disabled && element.getClientRects().length);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        });
        dialog.addEventListener("close", () => {
          anchor.replaceWith(shell);
          shell.classList.remove("is-expanded");
          button.textContent = "Expand";
          document.body.classList.remove("sdm-diagram-open");
          openDialog = undefined;
          dialog.remove();
          if (shell.isConnected) button.focus();
        }, { once: true });
        openDialog = dialog;
        dialog.showModal();
        button.focus();
      }
      apply();
    });
    scale = readingScale();
    apply();
  }
})();
