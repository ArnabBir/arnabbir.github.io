(() => {
  "use strict";

  const DAY = 86400;
  const calculators = [
    {
      id: "peak-qps", title: "Peak QPS", eyebrow: "Traffic", formula: "peak QPS = daily actions / 86,400 x peak factor",
      fields: [
        ["actions", "Actions per day", "actions/day", 10000000, 18000000, 1],
        ["peak", "Peak-to-average factor", "x", 6, 10, 1]
      ],
      calculate: (v) => {
        const average = v.actions / DAY;
        return result(average * v.peak, "requests/s", [["Average", average, "requests/s"], ["Daily actions", v.actions, "actions/day"]], "Assumes demand is spread across the day before the peak multiplier is applied.", "Peak factor dominates linearly. Compare an ordinary day with a launch, incident recovery, or regional failover.");
      }
    },
    {
      id: "little-law", title: "Little's Law concurrency", eyebrow: "Concurrency", formula: "in-flight = throughput x latency; provisioned = in-flight / target utilization",
      fields: [
        ["throughput", "Throughput", "requests/s", 20000, 30000, 1],
        ["latency", "Dependency latency", "ms", 250, 500, 1],
        ["utilization", "Target utilization", "%", 70, 60, 1, 100]
      ],
      validate: (v) => v.utilization > 0 ? "" : "Target utilization must be greater than zero.",
      calculate: (v) => {
        const inflight = v.throughput * v.latency / 1000;
        return result(inflight / (v.utilization / 100), "concurrent slots", [["In flight", inflight, "operations"], ["Utilization target", v.utilization, "%"]], "Uses average concurrency at the supplied throughput and latency; burst queues and latency distributions are excluded.", "Latency and throughput are equally sensitive. A p99 latency is useful for a safety case but is not an average-concurrency estimate.");
      }
    },
    {
      id: "storage", title: "Storage, retention & replication", eyebrow: "Data", formula: "bytes = writes/s x bytes/write x retention seconds x copies x (1 + overhead)",
      fields: [
        ["writes", "Sustained writes", "writes/s", 5000, 8000, 1],
        ["bytes", "Logical bytes per write", "bytes", 1200, 2000, 1],
        ["days", "Retention", "days", 365, 730, 1],
        ["copies", "Replication / durability factor", "x", 3, 3, 0.1],
        ["overhead", "Index and metadata overhead", "%", 35, 60, 1]
      ],
      calculate: (v) => {
        const logical = v.writes * v.bytes * v.days * DAY;
        const physical = logical * v.copies * (1 + v.overhead / 100);
        return result(physical, "bytes", [["Logical data", logical, "bytes"], ["Physical multiplier", v.copies * (1 + v.overhead / 100), "x"]], "Assumes fixed-size writes and full retention at one tier. Backups, temporary files, compaction, and compression are excluded.", "Retention, write rate, record size, and copies are linear. Separate object, index, backup, and database multipliers in a real design.");
      }
    },
    {
      id: "bandwidth", title: "Bandwidth & egress", eyebrow: "Network", formula: "bit/s = QPS x payload bytes x fan-out x 8",
      fields: [
        ["qps", "Peak responses", "responses/s", 12000, 20000, 1],
        ["payload", "Average response payload", "KiB", 40, 80, 0.1],
        ["fanout", "Network delivery factor", "x", 1, 1.5, 0.1]
      ],
      calculate: (v) => {
        const bytesSecond = v.qps * v.payload * 1024 * v.fanout;
        return result(bytesSecond * 8, "bit/s", [["Transfer rate", bytesSecond, "bytes/s"], ["Per day at sustained peak", bytesSecond * DAY, "bytes/day"]], "Uses binary KiB for payload input and reports decimal rate units. TLS, headers, retransmits, cache hits, and compression are excluded.", "Payload size and cache-hit assumptions often move egress more than API QPS. Test p50 and p99 object sizes separately.");
      }
    },
    {
      id: "queue", title: "Queue growth & drain", eyebrow: "Overload", formula: "backlog = max(0, arrival - processing) x incident time; drain time = backlog / (recovery - arrival)",
      fields: [
        ["arrival", "Arrival rate", "messages/s", 10000, 15000, 1],
        ["processing", "Degraded processing rate", "messages/s", 6500, 5000, 1],
        ["incident", "Degraded period", "minutes", 45, 90, 1],
        ["recovery", "Recovery processing rate", "messages/s", 14000, 18000, 1]
      ],
      calculate: (v) => {
        const backlog = Math.max(0, v.arrival - v.processing) * v.incident * 60;
        const spare = v.recovery - v.arrival;
        const drainSeconds = backlog === 0 ? 0 : (spare > 0 ? backlog / spare : Infinity);
        return result(backlog, "messages", [["Net growth", Math.max(0, v.arrival - v.processing), "messages/s"], ["Drain time", drainSeconds, "seconds"]], spare <= 0 && backlog > 0 ? "Recovery capacity does not exceed arrivals, so this backlog never drains." : "Assumes constant rates, no priority classes, no retries, and enough queue retention for the full backlog.", "The recovery surplus, not total recovery throughput, controls drain time. Check oldest-message age and storage bytes too.");
      }
    },
    {
      id: "shards", title: "Shard count & failure headroom", eyebrow: "Partitioning", formula: "shards = ceil(peak QPS / (per-shard QPS x utilization x surviving fraction))",
      fields: [
        ["peak", "Peak demand", "requests/s", 120000, 180000, 1],
        ["capacity", "Tested capacity per shard", "requests/s", 5000, 4000, 1],
        ["utilization", "Target utilization", "%", 65, 55, 1, 100],
        ["domains", "Failure domains", "count", 3, 3, 1],
        ["lost", "Domains tolerated lost", "count", 1, 1, 1]
      ],
      validate: (v) => {
        if (v.capacity <= 0 || v.utilization <= 0 || v.domains <= 0) return "Capacity, utilization, and failure domains must be greater than zero.";
        return v.lost < v.domains ? "" : "Lost domains must be fewer than total failure domains.";
      },
      calculate: (v) => {
        const surviving = (v.domains - v.lost) / v.domains;
        const shards = Math.ceil(v.peak / (v.capacity * v.utilization / 100 * surviving));
        return result(shards, "primary shards", [["Surviving capacity fraction", surviving * 100, "%"], ["Normal load per shard", shards === 0 ? 0 : v.peak / shards, "requests/s"]], "Assumes uniform keys and evenly balanced shards across independent failure domains. Replicas, storage limits, and migration capacity are excluded.", "Hot-key share or uneven placement can invalidate the average. Compare the hottest shard with the per-shard tested limit.");
      }
    },
    {
      id: "retries", title: "Retry amplification", eyebrow: "Resilience", formula: "effective attempts = original QPS x sum(retryable fraction^i), i = 0..max retries",
      fields: [
        ["qps", "Original request rate", "requests/s", 20000, 30000, 1],
        ["retryable", "Fraction reaching each retry", "%", 8, 30, 0.1, 100],
        ["retries", "Maximum retries", "count", 2, 3, 1, 10]
      ],
      calculate: (v) => {
        const fraction = v.retryable / 100;
        let multiplier = 0;
        for (let i = 0; i <= Math.floor(v.retries); i += 1) multiplier += fraction ** i;
        return result(v.qps * multiplier, "attempts/s", [["Amplification", multiplier, "x"], ["Extra attempts", v.qps * (multiplier - 1), "attempts/s"]], "Assumes the same retryable fraction at every attempt and no hedging. Correlated failures can be substantially worse.", "Retry fraction is nonlinear across attempts. Bound attempts with deadlines, jitter, budgets, and load shedding.");
      }
    },
    {
      id: "availability", title: "Availability composition", eyebrow: "Reliability", formula: "path availability = service availability x dependency availability ^ serial dependencies",
      fields: [
        ["service", "Service availability", "%", 99.99, 99.9, 0.001, 100],
        ["dependency", "Each dependency availability", "%", 99.95, 99.5, 0.001, 100],
        ["count", "Serial dependencies on path", "count", 3, 5, 1, 20]
      ],
      calculate: (v) => {
        const availability = (v.service / 100) * (v.dependency / 100) ** Math.floor(v.count);
        return result(availability * 100, "%", [["Monthly downtime", (1 - availability) * 30 * 24 * 60, "minutes"], ["Annual downtime", (1 - availability) * 365 * 24 * 60, "minutes"]], "Treats failures as independent and every dependency as strictly serial. Redundancy, graceful degradation, maintenance, and correlated incidents are excluded.", "One weak serial dependency can dominate. Model critical user journeys separately rather than multiplying fleet-wide SLAs.");
      }
    },
    {
      id: "latency", title: "Latency budget", eyebrow: "Performance", formula: "remaining budget = end-to-end target - sum(component budgets)",
      fields: [
        ["target", "End-to-end target", "ms", 300, 250, 1],
        ["edge", "Edge and network", "ms", 45, 70, 1],
        ["app", "Application work", "ms", 55, 70, 1],
        ["data", "Data dependencies", "ms", 120, 160, 1],
        ["queue", "Queueing reserve", "ms", 30, 40, 1]
      ],
      validate: (v) => v.target > 0 ? "" : "The end-to-end target must be greater than zero.",
      calculate: (v) => {
        const used = v.edge + v.app + v.data + v.queue;
        return result(v.target - used, "ms remaining", [["Allocated", used, "ms"], ["Budget used", used / v.target * 100, "%"]], used > v.target ? "The component budgets exceed the end-to-end target." : "Adds allocated budgets for serial stages. Adding measured stage p99 values does not establish an end-to-end p99 bound; validate the complete request distribution.", "Parallel calls contribute their critical path, not their sum. Protect explicit queueing and network reserves before optimizing code.");
      }
    },
    {
      id: "connections", title: "Connection pool sizing", eyebrow: "Resources", formula: "pool/replica = QPS x dependency share x hold time / replicas / utilization",
      fields: [
        ["qps", "Peak application QPS", "requests/s", 18000, 28000, 1],
        ["share", "Requests using dependency", "%", 80, 95, 1, 100],
        ["hold", "Connection hold time", "ms", 35, 80, 1],
        ["replicas", "Application replicas", "count", 12, 9, 1],
        ["utilization", "Pool target utilization", "%", 70, 60, 1, 100]
      ],
      validate: (v) => v.replicas > 0 && v.utilization > 0 ? "" : "Replicas and pool utilization must be greater than zero.",
      calculate: (v) => {
        const concurrent = v.qps * (v.share / 100) * v.hold / 1000;
        const perReplica = Math.ceil(concurrent / v.replicas / (v.utilization / 100));
        return result(perReplica, "connections / app replica", [["Concurrent dependency work", concurrent, "connections"], ["Fleet pool capacity", perReplica * v.replicas, "connections"]], "Assumes one connection per operation, balanced application replicas, and no multiplexing or transaction think time.", "Check the aggregate fleet pool against the dependency's connection ceiling. A larger pool can move queueing into the database and worsen overload.");
      }
    },
    {
      id: "cost", title: "Cost envelope", eyebrow: "Economics", formula: "monthly cost = requests + storage + egress + compute, then apply contingency",
      fields: [
        ["requests", "Requests per month", "million", 500, 900, 1],
        ["requestCost", "Request cost", "USD / million", 0.40, 0.55, 0.01],
        ["storage", "Average stored data", "GB-month", 50000, 90000, 1],
        ["storageCost", "Storage cost", "USD / GB-month", 0.023, 0.03, 0.001],
        ["egress", "Internet egress", "GB", 120000, 220000, 1],
        ["egressCost", "Egress cost", "USD / GB", 0.07, 0.09, 0.001],
        ["compute", "Compute and managed services", "USD / month", 18000, 30000, 1],
        ["contingency", "Unmodeled contingency", "%", 20, 30, 1]
      ],
      calculate: (v) => {
        const request = v.requests * v.requestCost;
        const storage = v.storage * v.storageCost;
        const egress = v.egress * v.egressCost;
        const subtotal = request + storage + egress + v.compute;
        return result(subtotal * (1 + v.contingency / 100), "USD/month", [["Modeled subtotal", subtotal, "USD/month"], ["Egress", egress, "USD/month"], ["Storage", storage, "USD/month"]], "Illustrative unit-price envelope only. Free tiers, regional pricing, commitments, taxes, support, logs, backups, and engineering cost are excluded.", "Rank the line items before optimizing. Replace list prices with measured usage and your provider contract.");
      }
    }
  ];

  function result(primary, unit, metrics, assumption, sensitivity) {
    return { primary, unit, metrics, assumption, sensitivity };
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function format(value, unit) {
    if (!Number.isFinite(value)) return value === Infinity && unit === "seconds" ? "Does not drain" : "Outside supported range";
    const absolute = Math.abs(value);
    if (unit === "%") return `${value.toLocaleString(undefined, { maximumFractionDigits: 5 })} %`;
    const byteSuffix = unit.startsWith("bytes") ? unit.slice(5) : "";
    const units = unit.includes("bit/s")
      ? [[1e12, "Tb/s"], [1e9, "Gb/s"], [1e6, "Mb/s"], [1e3, "Kb/s"]]
      : unit.includes("bytes")
        ? [[1e15, `PB${byteSuffix}`], [1e12, `TB${byteSuffix}`], [1e9, `GB${byteSuffix}`], [1e6, `MB${byteSuffix}`], [1e3, `KB${byteSuffix}`]]
        : [[1e9, `B ${unit}`], [1e6, `M ${unit}`], [1e3, `K ${unit}`]];
    const match = units.find(([threshold]) => absolute >= threshold);
    if (match) return `${(value / match[0]).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${match[1]}`;
    return `${value.toLocaleString(undefined, { maximumFractionDigits: absolute < 10 ? 3 : 1 })} ${unit}`;
  }

  function init() {
    document.querySelectorAll("[data-capacity-lab]").forEach((root) => {
      if (root.dataset.ready) return;
      root.dataset.ready = "true";
      root.querySelector("[data-tool-loading]")?.remove();
      buildLab(root);
    });
  }

  function buildLab(root) {
    const state = Object.fromEntries(calculators.map((calculator) => [calculator.id, {
      expected: Object.fromEntries(calculator.fields.map((field) => [field[0], field[3]])),
      pessimistic: Object.fromEntries(calculator.fields.map((field) => [field[0], field[4]]))
    }]));
    let scenario = "expected";
    const header = element("div", "sdm-tool-header");
    const intro = element("div");
    intro.append(element("p", "sdm-kicker", "CAPACITY WORKBENCH"), element("h2", "", "Make the units argue back"), element("p", "", "Edit assumptions, switch scenarios, and copy an interview-ready worksheet. Values stay on this page only."));
    const actions = element("div", "sdm-tool-actions");
    const scenarioGroup = element("div", "sdm-segmented");
    scenarioGroup.setAttribute("role", "group");
    scenarioGroup.setAttribute("aria-label", "Capacity scenario");
    ["expected", "pessimistic"].forEach((name) => {
      const button = element("button", name === scenario ? "is-active" : "", name[0].toUpperCase() + name.slice(1));
      button.type = "button";
      button.dataset.scenario = name;
      button.setAttribute("aria-pressed", String(name === scenario));
      scenarioGroup.append(button);
    });
    const copyAll = element("button", "sdm-button", "Copy all as Markdown");
    copyAll.type = "button";
    actions.append(scenarioGroup, copyAll);
    header.append(intro, actions);
    const status = element("p", "sdm-sr-only");
    status.setAttribute("aria-live", "polite");
    const grid = element("div", "sdm-calculator-grid");
    root.append(header, grid, status);

    const cards = calculators.map((calculator, index) => buildCalculator(calculator, state[calculator.id], scenario, index));
    cards.forEach((card) => grid.append(card.node));

    scenarioGroup.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-scenario]");
      if (!button || button.dataset.scenario === scenario) return;
      cards.forEach((card) => card.save(scenario));
      scenario = button.dataset.scenario;
      scenarioGroup.querySelectorAll("button").forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      cards.forEach((card) => card.load(scenario));
      status.textContent = `${button.textContent} assumptions loaded.`;
    });

    copyAll.addEventListener("click", async () => {
      const markdown = `# Capacity worksheet - ${scenario}\n\n${cards.map((card) => card.markdown()).filter(Boolean).join("\n\n")}`;
      const copied = await copyText(markdown);
      copyAll.textContent = copied ? "Copied" : "Copy failed";
      status.textContent = copied ? "All valid calculator results copied as Markdown." : "Clipboard access was unavailable.";
      setTimeout(() => { copyAll.textContent = "Copy all as Markdown"; }, 1600);
    });
  }

  function buildCalculator(calculator, saved, initialScenario, index) {
    const card = element("section", "sdm-calculator-card");
    card.dataset.calculator = calculator.id;
    const headingId = `calculator-${calculator.id}`;
    card.setAttribute("aria-labelledby", headingId);
    const top = element("div", "sdm-card-heading");
    const titleWrap = element("div");
    titleWrap.append(element("span", "sdm-card-number", String(index + 1).padStart(2, "0")), element("p", "sdm-kicker", calculator.eyebrow));
    const title = element("h3", "", calculator.title);
    title.id = headingId;
    top.append(titleWrap, title);
    const formula = element("code", "sdm-formula", calculator.formula);
    const form = element("form", "sdm-calculator-form");
    form.noValidate = true;
    const fields = new Map();
    calculator.fields.forEach((field) => {
      const [key, labelText, unit, , , step, max] = field;
      const group = element("div", "sdm-field");
      const label = element("label", "", labelText);
      const inputId = `${calculator.id}-${key}`;
      label.htmlFor = inputId;
      const control = element("div", "sdm-input-wrap");
      const input = document.createElement("input");
      input.type = "number";
      input.id = inputId;
      input.name = key;
      input.min = "0";
      if (max !== undefined) input.max = String(max);
      input.step = String(step);
      input.inputMode = "decimal";
      input.required = true;
      const suffix = element("span", "", unit);
      suffix.id = `${inputId}-unit`;
      control.append(input, suffix);
      group.append(label, control);
      form.append(group);
      fields.set(key, input);
    });
    const error = element("p", "sdm-field-error");
    error.id = `${calculator.id}-error`;
    error.setAttribute("role", "alert");
    fields.forEach((input) => input.setAttribute("aria-describedby", `${input.id}-unit ${error.id}`));
    const output = element("div", "sdm-result");
    output.setAttribute("aria-live", "polite");
    const primary = element("strong", "sdm-result-primary");
    const metrics = element("dl", "sdm-result-metrics");
    const assumption = element("p", "sdm-assumption");
    const sensitivity = element("p", "sdm-sensitivity");
    const copy = element("button", "sdm-copy-button", "Copy result");
    copy.type = "button";
    output.append(element("span", "sdm-result-label", "ESTIMATED RESULT"), primary, metrics, assumption, sensitivity, copy);
    card.append(top, formula, form, error, output);
    let currentScenario = initialScenario;
    let latest = null;

    const values = () => Object.fromEntries([...fields].map(([key, input]) => [key, Number(input.value)]));
    const save = (scenario) => { saved[scenario] = Object.fromEntries([...fields].map(([key, input]) => [key, input.value])); };
    const render = () => {
      const data = values();
      const invalid = [...fields.values()].find((input) => !input.validity.valid || input.value === "" || !Number.isFinite(Number(input.value)));
      const customError = !invalid && calculator.validate ? calculator.validate(data) : "";
      error.textContent = invalid ? "Enter a valid non-negative value for every input." : customError;
      output.hidden = Boolean(invalid || customError);
      fields.forEach((input) => input.setAttribute("aria-invalid", String(!input.validity.valid || input.value === "" || !Number.isFinite(Number(input.value)) || Boolean(customError))));
      latest = null;
      if (invalid || customError) return;
      latest = calculator.calculate(data);
      primary.textContent = format(latest.primary, latest.unit);
      metrics.replaceChildren();
      latest.metrics.forEach(([label, value, unit]) => {
        metrics.append(element("dt", "", label), element("dd", "", format(value, unit)));
      });
      assumption.textContent = `Assumption: ${latest.assumption}`;
      sensitivity.textContent = `Sensitivity: ${latest.sensitivity}`;
    };
    const load = (scenario) => {
      currentScenario = scenario;
      fields.forEach((input, key) => { input.value = saved[scenario][key]; });
      render();
    };
    const markdown = () => {
      if (!latest) return "";
      const inputs = [...fields].map(([key, input]) => {
        const definition = calculator.fields.find((field) => field[0] === key);
        return `- ${definition[1]}: ${input.value} ${definition[2]}`;
      }).join("\n");
      const secondary = latest.metrics.map(([label, value, unit]) => `- ${label}: ${format(value, unit)}`).join("\n");
      return `## ${calculator.title}\n\n**Scenario:** ${currentScenario}\n\n**Formula:** \`${calculator.formula}\`\n\n${inputs}\n\n**Result:** ${format(latest.primary, latest.unit)}\n\n${secondary}\n\n> ${latest.assumption}\n\n**Sensitivity:** ${latest.sensitivity}`;
    };
    form.addEventListener("input", () => { save(currentScenario); render(); });
    form.addEventListener("submit", (event) => event.preventDefault());
    copy.addEventListener("click", async () => {
      const copied = await copyText(markdown());
      copy.textContent = copied ? "Copied" : "Copy failed";
      setTimeout(() => { copy.textContent = "Copy result"; }, 1400);
    });
    load(initialScenario);
    return { node: card, save, load, markdown };
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      format,
      calculate: (id, values) => calculators.find((calculator) => calculator.id === id)?.calculate(values)
    };
    return;
  }

  if (typeof document$ !== "undefined") document$.subscribe(init);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
