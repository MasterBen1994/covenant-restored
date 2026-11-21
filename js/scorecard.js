(function () {
  const S = window.SITE, C = window.CONFIG;
  const pillars = S.pillars;
  const answers = pillars.map(p => new Array(p.questions.length).fill(null));
  let step = 0;
  let result = null;

  const $ = id => document.getElementById(id);

  // Scoring: pillar % = (sum - min) / (max - min); overall = mean of pillar %.
  function score() {
    const byPillar = pillars.map((p, i) => {
      const n = p.questions.length;
      const sum = answers[i].reduce((a, b) => a + b, 0);
      return { key: p.key, name: p.name, pct: Math.round((sum - n) / (n * 4) * 100) };
    });
    const overall = Math.round(byPillar.reduce((a, p) => a + p.pct, 0) / byPillar.length);
    const band = overall >= 80 ? "Thriving" : overall >= 55 ? "Growing" : "Needs Attention";
    const weakest = [...byPillar].sort((a, b) => a.pct - b.pct).slice(0, 2);
    return { byPillar, overall, band, weakest };
  }

  function renderStep() {
    const p = pillars[step];
    $("step-label").textContent = `Pillar ${step + 1} of ${pillars.length}`;
    $("step-count").textContent = `${Math.round(step / pillars.length * 100)}% complete`;
    $("progress").style.width = `${step / pillars.length * 100}%`;
    $("pillar-name").textContent = p.name;
    $("pillar-verse").textContent = p.verse;
    $("quiz-err").textContent = "";
    $("back").style.visibility = step === 0 ? "hidden" : "visible";
    $("next-label").textContent = step === pillars.length - 1 ? "See my results" : "Next";
    $("questions").innerHTML = p.questions.map((q, qi) => `
      <fieldset class="q">
        <legend>${q}</legend>
        <div class="opts">
          ${S.scale.map((label, v) => `
            <label class="opt">
              <input type="radio" name="q${qi}" value="${v + 1}" ${answers[step][qi] === v + 1 ? "checked" : ""} aria-label="${label}">
              <span><b>${v + 1}</b>${label}</span>
            </label>`).join("")}
        </div>
        <div class="scale-key"><span>${S.scale[0]}</span><span>${S.scale[4]}</span></div>
      </fieldset>`).join("");
    toTop();
  }

  function toTop() {
    window.__lenis ? window.__lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
  }

  function barColor(pct) {
    return pct >= 80 ? "var(--good)" : pct >= 55 ? "var(--mid)" : "var(--low)";
  }

  function renderResults() {
    result = score();
    $("quiz").hidden = true;
    $("results").hidden = false;
    $("overall").textContent = result.overall;
    $("band").textContent = result.band;
    $("encourage").textContent = {
      "Thriving": "Your marriage has a strong foundation. Keep building on what's working.",
      "Growing": "There's real strength here, and a few areas ready for growth.",
      "Needs Attention": "Thank you for being honest. This is where change begins, and there is real hope."
    }[result.band];
    $("bars").innerHTML = [...result.byPillar].sort((a, b) => b.pct - a.pct).map(p => `
      <div class="bar-row">
        <div class="bar-label"><span>${p.name}</span><span class="muted">${p.pct}%</span></div>
        <div class="bar"><div data-w="${p.pct}" style="background:${barColor(p.pct)}"></div></div>
      </div>`).join("");
    $("weak-name").textContent = result.weakest[0].name;
    toTop();
    setTimeout(() => document.querySelectorAll(".bar > div").forEach(b => { b.style.width = b.dataset.w + "%"; }), 400);
  }

  // Swap this function to change email providers (Kit, Brevo, etc.).
  async function subscribe(name, email) {
    const fields = {
      email, name,
      overall_score: result.overall,
      band: result.band,
      weak_1: result.weakest[0].key,
      weak_2: result.weakest[1].key
    };
    result.byPillar.forEach(p => { fields[`score_${p.key}`] = p.pct; });

    if (C.DEMO_MODE || !C.MAILERLITE_FORM_URL) {
      console.info("[DEMO_MODE] Would send to email provider:", fields);
      return;
    }
    const body = new FormData();
    Object.entries(fields).forEach(([k, v]) => body.append(`fields[${k}]`, v));
    body.append("ml-submit", "1");
    body.append("anticsrf", "true");
    await fetch(C.MAILERLITE_FORM_URL, { method: "POST", body, mode: "no-cors" });
  }

  $("start").addEventListener("click", () => {
    $("intro").hidden = true;
    $("quiz").hidden = false;
    renderStep();
  });

  $("questions").addEventListener("change", e => {
    const qi = Number(e.target.name.slice(1));
    answers[step][qi] = Number(e.target.value);
  });

  $("back").addEventListener("click", () => { if (step > 0) { step--; renderStep(); } });

  $("quiz").addEventListener("submit", e => {
    e.preventDefault();
    if (answers[step].some(a => a === null)) {
      $("quiz-err").textContent = "Please answer every statement before continuing.";
      return;
    }
    if (step < pillars.length - 1) { step++; renderStep(); }
    else renderResults();
  });

  $("lead").addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("name").value.trim();
    const email = $("email").value.trim();
    if (!name) return ($("lead-err").textContent = "Please enter your first name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ($("lead-err").textContent = "Please enter a valid email address.");
    if (!$("consent").checked) return ($("lead-err").textContent = "Please check the box so we can send your results.");
    $("lead-err").textContent = "";
    $("send").disabled = true;
    $("send-label").textContent = "Sending…";
    try {
      await subscribe(name, email);
      try { sessionStorage.setItem("scorecard", JSON.stringify({ name, overall: result.overall, band: result.band })); } catch (_) {}
      location.href = "thanks.html";
    } catch (err) {
      $("lead-err").textContent = "Something went wrong. Please try again.";
      $("send").disabled = false;
      $("send-label").textContent = "Send my full results";
    }
  });
})();
