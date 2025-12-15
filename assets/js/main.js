// assets/js/main.js

(function setYear(){
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

// Smooth scroll for in-page anchors
(function smoothAnchors(){
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", href);
  }, true);
})();

// FAQ toggle (index)
(function faqToggle(){
  document.addEventListener("click", (e) => {
    const q = e.target.closest && e.target.closest(".faq-q");
    if (!q) return;
    const item = q.closest(".faq-item");
    if (item) item.classList.toggle("open");
  });
})();

// Page fade-in/out transitions (no layout changes)
(function pageTransitions(){
  // fade in
  document.documentElement.classList.add("cc-loaded");

  const isModifiedClick = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

  function isSameDocument(url){
    return (
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  }

  function isSameDocument(url){
    return (
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  }

  function shouldHandleLink(a, e){
    const href = a.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if (a.target && a.target !== "_self") return false;
    if (isModifiedClick(e)) return false;

    // same-origin only
    let url;
    try {
      url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
    } catch (_) {
      return false;
    }

    // IMPORTANT: do NOT fade for same-document navigations like `index.html#about`.
    // Those do not trigger a full page load, which would leave the fade overlay visible.
    if (isSameDocument(url) && url.hash) return false;
    if (isSameDocument(url) && !url.hash) return false;

    return true;
  }

  function runFadeOut(nextHref){
    // overlay so we don't depend on body class styles
    const existing = document.getElementById("cc-transition");
    if (existing) existing.remove();

    // Keep header visible: only fade the area *below* the header.
    const header = document.querySelector("header");
    const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;

    const ov = document.createElement("div");
    ov.id = "cc-transition";
    ov.style.position = "fixed";
    ov.style.left = "0";
    ov.style.right = "0";
    ov.style.bottom = "0";
    ov.style.top = headerH + "px";
    ov.style.zIndex = "9999";
    ov.style.pointerEvents = "none";
    ov.style.background = getComputedStyle(document.body).backgroundColor || "#efefec";
    ov.style.opacity = "0";
    ov.style.transition = "opacity 220ms ease-in";
    document.body.appendChild(ov);

    requestAnimationFrame(() => { ov.style.opacity = "1"; });
    setTimeout(() => { window.location.href = nextHref; }, 180);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");

    // Handle same-document `index.html#section` or `#section` without fade.
    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
        const id = url.hash.slice(1);
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", url.hash);
        }
        return;
      }
    } catch (_) {
      // ignore
    }

    if (!shouldHandleLink(a, e)) return;
    e.preventDefault();
    runFadeOut(href);
  }, true);

  // If browser uses BFCache, ensure we never come back stuck behind an overlay.
  window.addEventListener("pageshow", () => {
    const ov = document.getElementById("cc-transition");
    if (ov) ov.remove();
  });
})();

// --- Home page: Supabase-powered carousels + seamless recycling loop ---
// Works only if the index has #campaignsTrack and/or #ambassadorsTrack.
(function homeCarousels(){
  const campaignsTrack = document.getElementById("campaignsTrack");
  const ambassadorsTrack = document.getElementById("ambassadorsTrack");
  if (!campaignsTrack && !ambassadorsTrack) return;

  const supabase = window.supabaseClient;

  function esc(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function tile(post){
    const href = `post.html?id=${encodeURIComponent(post.id)}`;
    return `
      <a class="scroll-card scroll-link" href="${href}">
        <img class="scroll-thumb" src="${esc(post.photo_url)}" alt="">
        <div class="scroll-label">${esc(post.header)}</div>
        <div class="scroll-title">${esc(post.title)}</div>
        <div class="scroll-meta">${esc(post.subheader)}</div>
      </a>
    `;
  }

  async function fetchLatest(type, limit){
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("posts")
      .select("id,type,created_at,photo_url,header,title,subheader")
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) { console.warn(error); return []; }
    return data || [];
  }

  async function render(){
    const campaigns = campaignsTrack ? await fetchLatest("campaign", 4) : [];
    const ambassadors = ambassadorsTrack ? await fetchLatest("ambassador", 4) : [];

    if (campaignsTrack) {
      campaignsTrack.innerHTML = campaigns.length ? (campaigns.map(tile).join("") + campaigns.map(tile).join("")) : "";
    }
    if (ambassadorsTrack) {
      ambassadorsTrack.innerHTML = ambassadors.length ? (ambassadors.map(tile).join("") + ambassadors.map(tile).join("")) : "";
    }

    initRecyclingCarousel();
  }

  // Recycling loop that keeps new nodes clickable (because they're <a>)
  function initRecyclingCarousel(){
    const rows = Array.from(document.querySelectorAll(".scroll-row"));
    if (!rows.length) return;

    // measure helper
    function getCardWidth(track){
      const first = track.querySelector(".scroll-card");
      if (!first) return 0;
      const cs = getComputedStyle(track);
      const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
      return first.getBoundingClientRect().width + gap;
    }

    rows.forEach((row) => {
      const track = row.querySelector(".scroll-track");
      if (!track) return;

      // prevent double init
      if (track.__ccInit) return;
      track.__ccInit = true;

      let x = 0;
      let lastT = performance.now();
      const speed = parseFloat(row.getAttribute("data-speed") || "40"); // px/sec
      const dir = row.getAttribute("data-dir") === "right" ? 1 : -1;

      // pause on hover
      let paused = false;
      row.addEventListener("mouseenter", () => { paused = true; });
      row.addEventListener("mouseleave", () => { paused = false; });

      // ensure we have at least 2 sets; if not, duplicate what's there
      const cards = Array.from(track.children);
      if (cards.length && cards.length < 8) {
        const html = track.innerHTML;
        track.insertAdjacentHTML("beforeend", html);
      }

      function tick(now){
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;

        if (!paused) x += dir * speed * dt;

        // recycle: when first card fully leaves, move it to end and adjust x
        const w = getCardWidth(track);
        if (w > 0) {
          while (dir < 0 && x <= -w) { // moving left
            x += w;
            const first = track.firstElementChild;
            if (first) track.appendChild(first);
          }
          while (dir > 0 && x >= w) { // moving right
            x -= w;
            const last = track.lastElementChild;
            if (last) track.insertBefore(last, track.firstElementChild);
          }
        }

        track.style.transform = `translate3d(${x}px,0,0)`;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // Render after DOM ready and after supabase client is ready
  document.addEventListener("DOMContentLoaded", () => {
    if (window.supabaseClient) {
      render();
    } else {
      // If client missing, still init carousel for any static tiles
      initRecyclingCarousel();
    }
  });
})();
