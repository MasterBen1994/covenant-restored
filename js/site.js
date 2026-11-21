// Shared chrome (top bar, menu, footer), content fill, and motion.
(function () {
  const S = window.SITE;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.remove("no-js");

  // ---- Top bar + full-screen menu ----
  const header = document.querySelector("[data-header]");
  if (header) {
    header.outerHTML = `
      <header class="topbar">
        <button type="button" data-menu-open aria-expanded="false" aria-controls="menu">Menu</button>
        <a class="logo" href="index.html">${S.ministryName}<small>with ${S.founderName}</small></a>
        <a class="right" href="scorecard.html"><span class="long">Take the Scorecard</span><span class="short">Scorecard</span></a>
      </header>
      <div class="menu" id="menu" aria-hidden="true">
        <button type="button" class="close" data-menu-close>Close</button>
        <nav>
          <a href="index.html"><span>01</span>Home</a>
          <a href="index.html#story"><span>02</span>Her Story</a>
          <a href="index.html#pillars"><span>03</span>The Six Pillars</a>
          <a href="index.html#cohort"><span>04</span>The Cohort</a>
          <a href="scorecard.html"><span>05</span>The Scorecard</a>
        </nav>
        <div class="foot"><span>${S.tagline}</span><a href="mailto:${S.contactEmail}">${S.contactEmail}</a></div>
      </div>`;
    const menu = document.getElementById("menu");
    const openBtn = document.querySelector("[data-menu-open]");
    const setMenu = open => {
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-hidden", String(!open));
      openBtn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
      window.__lenis && (open ? window.__lenis.stop() : window.__lenis.start());
    };
    openBtn.addEventListener("click", () => setMenu(true));
    menu.querySelector("[data-menu-close]").addEventListener("click", () => setMenu(false));
    menu.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
  }

  // ---- Top bar state: transparent over the hero, frosted once scrolled ----
  const bar = document.querySelector(".topbar");
  const heroDark = document.querySelector(".hero-full");
  const setBar = () => {
    if (!bar) return;
    const y = window.scrollY;
    bar.classList.toggle("solid", y > 40);
    bar.classList.toggle("on-dark", !!heroDark && y <= 40);
  };
  addEventListener("scroll", setBar, { passive: true });
  setBar();

  // ---- Footer ----
  const footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.outerHTML = `
      <footer class="site-footer"><div class="wrap">
        <div class="word">${S.ministryName}</div>
        <div class="cols">
          <div><p class="mission">${S.tagline}</p></div>
          <div><h4>Explore</h4><a href="index.html#story">Her Story</a><a href="index.html#pillars">Six Pillars</a><a href="index.html#cohort">Cohort</a><a href="scorecard.html">Scorecard</a></div>
          <div><h4>Policies</h4><a href="privacy.html">Privacy</a><a href="cohort-agreement.html">Cohort Agreement</a><a href="safety.html">Safety</a></div>
          <div><h4>Contact</h4><a href="mailto:${S.contactEmail}">${S.contactEmail}</a></div>
        </div>
        <div class="base"><span>© ${new Date().getFullYear()} ${S.ministryName} · ${S.founderName}</span><span>Made with love, for covenant marriages.</span></div>
      </div></footer>`;
  }

  // ---- Content fill ----
  document.querySelectorAll("[data-site]").forEach(el => { el.textContent = S[el.dataset.site]; });
  document.querySelectorAll('a[data-mailto]').forEach(a => { a.href = "mailto:" + S.contactEmail; a.textContent = S.contactEmail; });
  document.querySelectorAll(".ph[data-img]").forEach(el => {
    const src = (S.images || {})[el.dataset.img];
    if (src) {
      el.classList.add("has-img");
      el.insertAdjacentHTML("afterbegin", `<img src="${src}" alt="${el.dataset.alt || ""}" loading="${el.dataset.img === "hero" ? "eager" : "lazy"}">`);
    } else if (el.dataset.alt) {
      el.insertAdjacentHTML("beforeend", `<span class="ph-label">Photo · ${el.dataset.alt}</span>`);
    }
  });

  // ---- Preloader (once per session) ----
  const pre = document.querySelector(".preloader");
  let seen = false;
  try { seen = sessionStorage.getItem("seenIntro") === "1"; sessionStorage.setItem("seenIntro", "1"); } catch (_) {}
  const startPage = () => document.querySelectorAll("[data-hero]").forEach(el => el.classList.add("in"));
  if (pre && !seen && !reduce) {
    const count = pre.querySelector(".count");
    const t0 = performance.now(), dur = 1400;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      count.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (p < 1) requestAnimationFrame(tick);
      else { pre.classList.add("done"); setTimeout(startPage, 350); setTimeout(() => pre.remove(), 1200); }
    })(t0);
  } else {
    pre && pre.remove();
    requestAnimationFrame(startPage);
  }

  // ---- Smooth scroll ----
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ lerp: 0.09 });
    window.__lenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href").split("#")[1];
      const target = id && document.getElementById(id);
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -20 }); }
    }));
  }

  // ---- Scroll reveals ----
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll("[data-reveal]:not([data-hero])").forEach(el => io.observe(el));

  // ---- Parallax on images ----
  const par = [...document.querySelectorAll("[data-parallax]")];
  if (par.length && !reduce) {
    const update = () => {
      const vh = innerHeight;
      par.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        const img = el.querySelector("img");
        if (img) img.style.transform = `translate3d(0, ${(p * -6).toFixed(2)}%, 0)`;
      });
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
})();
