/* ========================================
   CYBERPUNK PORTFOLIO — SCRIPT.JS
   Full-page navigation · Light/Dark mode
   Pure vanilla JS, zero dependencies
   ======================================== */

(function () {
  "use strict";

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ========================================
     1. THEME TOGGLE (Light / Dark)
     ======================================== */
  function initTheme() {
    const html = document.documentElement;
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "dark");
    html.dataset.theme = theme;

    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = html.dataset.theme === "dark" ? "light" : "dark";
        html.dataset.theme = next;
        localStorage.setItem("theme", next);
      });
    });
  }

  /* ========================================
     2. FULL-PAGE NAVIGATION
     ======================================== */
  let currentPage = 0;
  let isAnimating = false;
  let pages, container, indicators, navLinks, mobileLinks;
  const ANIM_DURATION = 500;

  function initPageNav() {
    pages = Array.from(document.querySelectorAll(".page"));
    container = document.querySelector(".pages-container");
    indicators = Array.from(document.querySelectorAll(".indicator[data-page]"));
    navLinks = Array.from(document.querySelectorAll("#desktop-nav .nav-link[data-page]"));
    mobileLinks = Array.from(document.querySelectorAll(".menu-links a[data-page]"));
    const totalPages = pages.length;

    function goToPage(idx) {
      if (isAnimating || idx < 0 || idx >= totalPages || idx === currentPage) return;
      isAnimating = true;

      pages[currentPage].classList.remove("active");
      currentPage = idx;
      pages[currentPage].classList.add("active");
      container.style.transform = "translateY(-" + (currentPage * 100) + "vh)";

      updateUI();

      setTimeout(() => { isAnimating = false; }, ANIM_DURATION);
    }

    window.__goToPage = goToPage;

    function updateUI() {
      indicators.forEach((dot) => {
        dot.classList.toggle("active", +dot.dataset.page === currentPage);
      });
      navLinks.forEach((link) => {
        link.classList.toggle("active", +link.dataset.page === currentPage);
      });
      mobileLinks.forEach((link) => {
        link.classList.toggle("active", +link.dataset.page === currentPage);
      });
    }

    indicators.forEach((dot) => {
      dot.addEventListener("click", () => goToPage(+dot.dataset.page));
    });

    const allPageLinks = [...navLinks, ...mobileLinks];
    allPageLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        goToPage(+link.dataset.page);
      });
    });

    document.querySelectorAll(".page-arrow-down").forEach((btn) => {
      btn.addEventListener("click", () => goToPage(currentPage + 1));
    });
    document.querySelectorAll(".page-arrow-up").forEach((btn) => {
      btn.addEventListener("click", () => goToPage(currentPage - 1));
    });

    /* --- Wheel navigation (debounced to prevent double-skip) --- */
    let wheelLocked = false;
    const WHEEL_LOCK_MS = 700;
    const DELTA_THRESHOLD = 20;

    window.addEventListener("wheel", (e) => {
      if (isAnimating || wheelLocked) { e.preventDefault(); return; }

      const section = pages[currentPage];
      const inner = section.querySelector(".page-scroll");
      const scrollEl = inner || section;
      const hasScroll = scrollEl.scrollHeight > scrollEl.clientHeight + 5;
      const direction = e.deltaY > 0 ? "down" : "up";

      if (hasScroll) {
        const atTop = scrollEl.scrollTop <= 3;
        const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 3;
        if (direction === "down" && !atBottom) return;
        if (direction === "up" && !atTop) return;
      }

      if (Math.abs(e.deltaY) < DELTA_THRESHOLD) return;

      e.preventDefault();
      wheelLocked = true;
      setTimeout(() => { wheelLocked = false; }, WHEEL_LOCK_MS);

      if (direction === "down") goToPage(currentPage + 1);
      else goToPage(currentPage - 1);
    }, { passive: false });

    /* --- Keyboard navigation --- */
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault(); goToPage(currentPage + 1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault(); goToPage(currentPage - 1);
      }
      if (e.key === "Home") { e.preventDefault(); goToPage(0); }
      if (e.key === "End")  { e.preventDefault(); goToPage(totalPages - 1); }
    });

    /* --- Touch swipe navigation --- */
    let touchStartY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 100;

    document.addEventListener("touchstart", (e) => {
      touchStartY = e.changedTouches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener("touchend", (e) => {
      const dy = touchStartY - e.changedTouches[0].clientY;
      const dt = Date.now() - touchStartTime;
      if (dt > 400) return;

      const section = pages[currentPage];
      const inner = section.querySelector(".page-scroll");
      const scrollEl = inner || section;
      const hasScroll = scrollEl.scrollHeight > scrollEl.clientHeight + 5;

      if (Math.abs(dy) > SWIPE_THRESHOLD) {
        if (dy > 0) {
          if (hasScroll && scrollEl.scrollTop + scrollEl.clientHeight < scrollEl.scrollHeight - 3) return;
          goToPage(currentPage + 1);
        } else {
          if (hasScroll && scrollEl.scrollTop > 3) return;
          goToPage(currentPage - 1);
        }
      }
    }, { passive: true });

    pages[0].classList.add("active");
    updateUI();

  }

  /* ========================================
     3. PARTICLE CANVAS
     ======================================== */
  function initParticles() {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    let mouseX = -1000, mouseY = -1000;
    const COUNT = isTouchDevice ? 30 : 60;
    const CONN = 130;
    const MOUSE_R = 170;

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }

    function create() {
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.4 + 0.5,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const theme = document.documentElement.dataset.theme;
      const rgb = theme === "light" ? "8,145,178" : "0,240,255";
      const baseAlpha = theme === "light" ? 0.35 : 0.25;
      const lineAlpha = theme === "light" ? 0.06 : 0.08;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = mouseX - p.x, dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_R) {
          const f = (MOUSE_R - dist) / MOUSE_R;
          p.vx -= dx * f * 0.003; p.vy -= dy * f * 0.003;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + rgb + "," + (baseAlpha + p.r * 0.12) + ")";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const ddx = p.x - p2.x, ddy = p.y - p2.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < CONN) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "rgba(" + rgb + "," + (lineAlpha * (1 - d / CONN)) + ")";
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    resize(); create(); draw();
    window.addEventListener("resize", () => { resize(); create(); });
    document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    document.addEventListener("mouseleave", () => { mouseX = -1000; mouseY = -1000; });
  }

  /* ========================================
     4. CUSTOM CURSOR
     ======================================== */
  function initCursor() {
    if (isTouchDevice) {
      document.body.style.cursor = "auto";
      document.querySelectorAll(".cursor-dot,.cursor-ring").forEach((el) => el.style.display = "none");
      return;
    }
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    });

    (function loop() {
      rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();

    const targets = "a,button,.btn,.skill-tag,.hamburger-icon,.logo,.project-card,.contact-item,.indicator,.theme-toggle,.blog-card,.about-orb-sphere,.exp-card,.hm-trigger,.hm-ctrl";
    document.addEventListener("mouseover", (e) => { if (e.target.closest(targets)) document.body.classList.add("cursor-hover"); });
    document.addEventListener("mouseout",  (e) => { if (e.target.closest(targets)) document.body.classList.remove("cursor-hover"); });
  }

  /* ========================================
     5. TYPED TEXT
     ======================================== */
  function initTypedText() {
    const el = document.getElementById("typed-text");
    if (!el) return;

    const strings = [
      "Associate Software Engineer",
      "Data & AI @ Red Hat",
      "Speaker @ GIDS 2023",
      "Harmonica Player \uD83C\uDFB5",
    ];
    let sIdx = 0, cIdx = 0, deleting = false;

    function tick() {
      const s = strings[sIdx];
      if (!deleting) {
        cIdx++;
        el.textContent = s.substring(0, cIdx);
        if (cIdx === s.length) { setTimeout(() => { deleting = true; tick(); }, 2000); return; }
        setTimeout(tick, 60);
      } else {
        cIdx--;
        el.textContent = s.substring(0, cIdx);
        if (cIdx === 0) { deleting = false; sIdx = (sIdx + 1) % strings.length; setTimeout(tick, 400); return; }
        setTimeout(tick, 35);
      }
    }
    setTimeout(tick, 800);
  }

  /* ========================================
     6. 3D TILT CARDS
     ======================================== */
  function initTiltCards() {
    if (isTouchDevice || isReducedMotion) return;
    const cards = document.querySelectorAll(".tilt-card");
    const MAX = 8;

    cards.forEach((card) => {
      let glare = card.querySelector(".tilt-glare");
      if (!glare) { glare = document.createElement("div"); glare.classList.add("tilt-glare"); card.appendChild(glare); }

      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const rx = ((y - r.height / 2) / (r.height / 2)) * -MAX;
        const ry = ((x - r.width / 2) / (r.width / 2)) * MAX;
        card.style.transform = "perspective(1000px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) scale3d(1.02,1.02,1.02)";
        glare.style.setProperty("--glare-x", (x / r.width * 100) + "%");
        glare.style.setProperty("--glare-y", (y / r.height * 100) + "%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)";
      });
      card.style.transition = "transform 0.4s cubic-bezier(0.4,0,0.2,1)";
    });
  }

  /* ========================================
     7. MAGNETIC BUTTONS
     ======================================== */
  function initMagneticButtons() {
    if (isTouchDevice) return;
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (x * 0.3) + "px," + (y * 0.3) + "px)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0,0)";
        btn.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
      });
      btn.addEventListener("mouseenter", () => {
        btn.style.transition = "transform 0.15s ease-out";
      });
    });
  }

  /* ========================================
     8. HAMBURGER MENU
     ======================================== */
  window.toggleMenu = function () {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    if (menu) menu.classList.toggle("open");
    if (icon) icon.classList.toggle("open");
  };

  /* ========================================
     9. EASTER EGG — Konami Code
     ======================================== */
  function initEasterEgg() {
    const SEQ = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let pos = 0;
    document.addEventListener("keydown", (e) => {
      if (e.key === SEQ[pos]) { pos++; if (pos === SEQ.length) { pos = 0; fire(); } } else { pos = 0; }
    });

    const logo = document.querySelector("#desktop-nav .logo");
    if (logo) {
      let clicks = 0, timer;
      logo.addEventListener("click", () => {
        clicks++; clearTimeout(timer);
        if (clicks >= 5) { clicks = 0; fire(); }
        timer = setTimeout(() => clicks = 0, 2000);
      });
    }

    function fire() {
      document.body.classList.add("page-glitch");
      setTimeout(() => document.body.classList.remove("page-glitch"), 1200);
    }
  }

  /* ========================================
     10. ORB REVEAL (hover orb icon → expand, hide sibling)
     ======================================== */
  function initOrbReveal() {
    var sections = document.querySelectorAll(".orb-section");

    sections.forEach(function (section) {
      var orb = section.querySelector(".orb-trigger");
      var target = section.querySelector(".orb-reveal");
      if (!orb || !target) return;

      var sibling = null;
      var timer = null;
      sections.forEach(function (s) { if (s !== section) sibling = s; });

      function openReveal() {
        clearTimeout(timer);
        section.classList.add("is-expanded");
        target.classList.add("is-open");
        orb.classList.add("is-open");
        if (sibling) sibling.classList.add("is-hidden");
      }

      function closeReveal() {
        clearTimeout(timer);
        section.classList.remove("is-expanded");
        target.classList.remove("is-open");
        orb.classList.remove("is-open");
        if (sibling) sibling.classList.remove("is-hidden");
      }

      orb.addEventListener("mouseenter", openReveal);
      orb.addEventListener("mouseleave", function () {
        timer = setTimeout(closeReveal, 150);
      });

      target.addEventListener("mouseenter", function () {
        clearTimeout(timer);
      });
      target.addEventListener("mouseleave", closeReveal);

      // Auto-collapse when scrolled to bottom (works on real mobile)
      var pageScroll = section.closest(".page-scroll");
      if (pageScroll) {
        var checking = false;
        pageScroll.addEventListener("scroll", function () {
          if (!target.classList.contains("is-open") || checking) return;
          var atBottom = pageScroll.scrollTop + pageScroll.clientHeight >= pageScroll.scrollHeight - 10;
          if (atBottom) {
            checking = true;
            closeReveal();
            pageScroll.scrollTop = 0;
            setTimeout(function () { checking = false; }, 500);
          }
        }, { passive: true });
      }


      orb.addEventListener("touchstart", function (e) {
        e.preventDefault();
        if (target.classList.contains("is-open")) {
          closeReveal();
        } else {
          openReveal();
        }
      }, { passive: false });
    });
  }

  /* ========================================
     11. HARMONICA MUSIC PLAYER
     ======================================== */
  function initHarmonica() {
    var zone     = document.getElementById("hm-zone");
    var trigger  = document.getElementById("hm-trigger");
    var btnPrev  = document.getElementById("hm-prev");
    var btnNext  = document.getElementById("hm-next");
    var btnVolUp = document.getElementById("hm-vol-up");
    var btnVolDn = document.getElementById("hm-vol-down");
    var btnPause = document.getElementById("hm-pause");
    var overlay  = document.getElementById("hm-notes-overlay");
    if (!zone || !trigger) return;

    var tunes = [
      "./assets/tunes/tune1.mp3",
      "./assets/tunes/tune2.mp3",
      "./assets/tunes/do-labso-ki.aac",
      "./assets/tunes/mere-sapno-ki-rani.aac",
      "./assets/tunes/roja-janeman.aac",
    ];

    var audio = new Audio();
    audio.volume = 0.7;
    var currentIdx = 0;
    var playing = false;
    var noteInterval = null;
    var noteSymbols = ["♪", "♫", "♩", "♬", "🎵", "🎶"];

    function spawnNote() {
      if (!overlay || overlay.classList.contains("is-hidden")) return;
      var note = document.createElement("span");
      note.className = "hm-float-note";
      note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
      var startX = Math.random() * window.innerWidth;
      var startY = window.innerHeight * (0.3 + Math.random() * 0.6);
      note.style.left = startX + "px";
      note.style.top = startY + "px";
      note.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      note.style.setProperty("--dy", -(150 + Math.random() * 250) + "px");
      note.style.setProperty("--rot", (Math.random() * 60 - 30) + "deg");
      note.style.setProperty("--dur", (4 + Math.random() * 4) + "s");
      note.style.fontSize = (1 + Math.random() * 0.8) + "rem";
      overlay.appendChild(note);
      setTimeout(function () { if (note.parentNode) note.remove(); }, 9000);
    }

    function startNotes() {
      stopNotes();
      spawnNote(); spawnNote();
      noteInterval = setInterval(spawnNote, 1200);
    }

    function stopNotes() {
      if (noteInterval) { clearInterval(noteInterval); noteInterval = null; }
    }

    function play() {
      audio.src = tunes[currentIdx];
      audio.play().then(function () {
        playing = true;
        zone.classList.add("is-playing");
        overlay.classList.remove("is-hidden");
        startNotes();
      }).catch(function () {});
    }

    function pause() {
      audio.pause();
      playing = false;
      zone.classList.remove("is-playing");
      overlay.classList.add("is-hidden");
      overlay.innerHTML = "";
      stopNotes();
    }

    function next() {
      currentIdx = (currentIdx + 1) % tunes.length;
      play();
    }

    function prev() {
      currentIdx = (currentIdx - 1 + tunes.length) % tunes.length;
      play();
    }

    audio.addEventListener("ended", function () { next(); });

    trigger.addEventListener("click", function () {
      if (playing) { pause(); } else { play(); }
    });

    if (btnPrev) btnPrev.addEventListener("click", function (e) { e.stopPropagation(); prev(); });
    if (btnNext) btnNext.addEventListener("click", function (e) { e.stopPropagation(); next(); });
    if (btnPause) btnPause.addEventListener("click", function (e) { e.stopPropagation(); pause(); });
    if (btnVolUp) btnVolUp.addEventListener("click", function (e) {
      e.stopPropagation();
      audio.volume = Math.min(1, +(audio.volume + 0.15).toFixed(2));
    });
    if (btnVolDn) btnVolDn.addEventListener("click", function (e) {
      e.stopPropagation();
      audio.volume = Math.max(0, +(audio.volume - 0.15).toFixed(2));
    });

    overlay.classList.add("is-hidden");
  }

  /* ========================================
     INIT
     ======================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initPageNav();
    initParticles();
    initCursor();
    initTypedText();
    initTiltCards();
    initMagneticButtons();
    initEasterEgg();
    initOrbReveal();
    initHarmonica();
  });
})();
