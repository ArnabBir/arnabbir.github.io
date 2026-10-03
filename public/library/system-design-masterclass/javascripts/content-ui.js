const SECTION_PATTERN = /(?:entit|data model|\bmodel\b|\bapi\b|apis|interface)/i;
const ENTITY_PATTERN = /(?:entit|data model|\bmodel\b)/i;
const API_PATTERN = /(?:\bapi\b|apis|interface)/i;
const HTTP_PATTERN = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+([^\s]+)(?:\s+(.*))?$/;

document$.subscribe(() => {
  document.querySelectorAll(".md-content h2").forEach((heading) => {
    if (heading.dataset.contractEnhanced) return;

    const title = heading.textContent.replace("¶", "").trim();
    if (!SECTION_PATTERN.test(title)) return;

    const nodes = sectionNodes(heading);
    const codeBlocks = nodes.flatMap((node) => [
      ...(node.matches?.(".highlight") ? [node] : []),
      ...node.querySelectorAll?.(".highlight") || []
    ]);
    if (codeBlocks.length === 0) return;

    const entities = ENTITY_PATTERN.test(title)
      ? uniqueBy(codeBlocks.flatMap((block) => parseEntities(block.textContent)), "name")
      : [];
    const endpoints = API_PATTERN.test(title)
      ? uniqueBy(codeBlocks.flatMap((block) => parseEndpoints(block.textContent)), "key")
      : [];

    if (entities.length === 0 && endpoints.length === 0) return;

    heading.dataset.contractEnhanced = "true";
    const explorer = buildExplorer(title, entities, endpoints, codeBlocks);
    heading.insertAdjacentElement("afterend", explorer);
  });
});

function sectionNodes(heading) {
  const nodes = [];
  let node = heading.nextElementSibling;
  while (node && node.tagName !== "H2") {
    nodes.push(node);
    node = node.nextElementSibling;
  }
  return nodes;
}

function parseEntities(text) {
  if (/^(?:flowchart|graph|sequenceDiagram|stateDiagram|erDiagram)/m.test(text)) return [];

  const lines = text.split("\n");
  const entities = [];
  let current = null;

  const finish = () => {
    if (!current) return;
    const close = current.body.lastIndexOf(")");
    const body = close >= 0 ? current.body.slice(0, close) : current.body;
    const fields = splitFields(body).filter(Boolean);
    if (fields.length > 0) entities.push({ name: current.name, fields });
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(/^(?:CREATE\s+TABLE\s+)?([A-Z][A-Za-z0-9_]*)\s*\((.*)$/i);

    if (!current && match && !HTTP_PATTERN.test(line)) {
      current = { name: match[1], body: match[2] };
      if (balanced(current.body)) finish();
      continue;
    }

    if (current) {
      current.body += ` ${line}`;
      if (balanced(current.body)) finish();
    }
  }

  finish();
  return entities;
}

function balanced(value) {
  let depth = 1;
  for (const character of value) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
  }
  return depth <= 0;
}

function splitFields(value) {
  const fields = [];
  let depth = 0;
  let field = "";

  for (const character of value) {
    if (character === "(" || character === "[") depth += 1;
    if (character === ")" || character === "]") depth -= 1;
    if (character === "," && depth === 0) {
      fields.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }

  if (field.trim()) fields.push(field.trim());
  return fields;
}

function parseEndpoints(text) {
  const lines = text.split("\n");
  const endpoints = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    const match = line.match(HTTP_PATTERN);
    if (!match) return;

    const details = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].trim();
      if (HTTP_PATTERN.test(next)) break;
      if (next) details.push(next);
    }

    endpoints.push({
      method: match[1],
      path: match[2],
      note: match[3] || "",
      details,
      key: `${match[1]} ${match[2]}`
    });
  });

  return endpoints;
}

function uniqueBy(items, key) {
  return [...new Map(items.map((item) => [item[key], item])).values()];
}

function buildExplorer(title, entities, endpoints, sourceBlocks) {
  const explorer = document.createElement("section");
  explorer.className = "sdm-contract-explorer show-source";

  const heading = document.createElement("div");
  heading.className = "sdm-contract-header";
  heading.innerHTML = `
    <div>
      <span class="sdm-contract-kicker">Interactive contract</span>
      <strong>${escapeHtml(title.replace(/^\d+\.\s*/, ""))}</strong>
    </div>
    <button type="button" class="sdm-source-toggle" aria-expanded="true">Hide source</button>`;

  const controls = document.createElement("div");
  controls.className = "sdm-contract-controls";

  const views = document.createElement("div");
  views.className = "sdm-contract-views";

  if (entities.length > 0) {
    const entityView = buildEntityView(entities);
    views.append(entityView);

    if (entities.length > 2) {
      const search = document.createElement("input");
      search.type = "search";
      search.className = "sdm-schema-search";
      search.placeholder = `Filter ${entities.length} entities or fields`;
      search.setAttribute("aria-label", "Filter entities and fields");
      search.addEventListener("input", () => filterEntities(entityView, search.value));
      controls.append(search);
    }
  }

  if (endpoints.length > 0) views.append(buildApiView(endpoints));

  // The generated overview is heuristic; keep the complete authored contract visible.
  sourceBlocks.forEach((block) => block.classList.add("sdm-contract-source", "is-visible"));
  heading.querySelector(".sdm-source-toggle").addEventListener("click", (event) => {
    const visible = explorer.classList.toggle("show-source");
    sourceBlocks.forEach((block) => block.classList.toggle("is-visible", visible));
    event.currentTarget.textContent = visible ? "Hide source" : "Show source";
    event.currentTarget.setAttribute("aria-expanded", String(visible));
  });

  explorer.append(heading);
  if (controls.childElementCount > 0) explorer.append(controls);
  explorer.append(views);
  return explorer;
}

function buildEntityView(entities) {
  const view = document.createElement("div");
  view.className = "sdm-entity-grid";

  entities.forEach((entity) => {
    const card = document.createElement("article");
    card.className = "sdm-entity-card";
    card.dataset.search = `${entity.name} ${entity.fields.join(" ")}`.toLowerCase();

    const fields = entity.fields.map((field) => {
      const key = /(?:^|\s)(?:id|.*_id)(?:\s|$)/i.test(field);
      const temporal = /(?:_at|timestamp|date|time)/i.test(field);
      const state = /(?:status|state|version)/i.test(field);
      const kind = key ? "key" : temporal ? "time" : state ? "state" : "field";
      return `<li><span class="sdm-field-kind ${kind}">${kind}</span><code>${escapeHtml(field)}</code></li>`;
    }).join("");

    card.innerHTML = `
      <button type="button" class="sdm-entity-title" aria-expanded="true">
        <span>${escapeHtml(entity.name)}</span><small>${entity.fields.length} fields</small>
      </button>
      <ul>${fields}</ul>`;

    card.querySelector("button").addEventListener("click", (event) => {
      const collapsed = card.classList.toggle("is-collapsed");
      event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    });
    view.append(card);
  });

  return view;
}

function buildApiView(endpoints) {
  const view = document.createElement("div");
  view.className = "sdm-api-stack";

  endpoints.forEach((endpoint, index) => {
    const card = document.createElement("details");
    card.className = `sdm-api-card method-${endpoint.method.toLowerCase()}`;
    if (index === 0) card.open = true;

    const summary = document.createElement("summary");
    summary.innerHTML = `
      <span class="sdm-http-method">${endpoint.method}</span>
      <code>${escapeHtml(endpoint.path)}</code>
      ${endpoint.note ? `<span class="sdm-api-note">${escapeHtml(endpoint.note)}</span>` : ""}`;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "sdm-copy-contract";
    copy.textContent = "Copy";
    copy.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        const header = [endpoint.key, endpoint.note].filter(Boolean).join(" ");
        await navigator.clipboard.writeText([header, ...endpoint.details].join("\n"));
        copy.textContent = "Copied";
      } catch {
        copy.textContent = "Copy unavailable";
      }
      window.setTimeout(() => { copy.textContent = "Copy"; }, 1200);
    });
    summary.append(copy);
    card.append(summary);

    const body = document.createElement("div");
    body.className = "sdm-api-body";
    body.innerHTML = endpoint.details.length
      ? `<pre><code>${escapeHtml(endpoint.details.join("\n"))}</code></pre>`
      : "<p>See the source and surrounding notes for request and response details.</p>";
    card.append(body);
    view.append(card);
  });

  return view;
}

function filterEntities(view, query) {
  const normalized = query.trim().toLowerCase();
  view.querySelectorAll(".sdm-entity-card").forEach((card) => {
    card.hidden = normalized && !card.dataset.search.includes(normalized);
  });
}

function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
}
