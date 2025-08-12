"use strict";

/* =========================================
   One source of truth for galleries
   ========================================= */
const GALLERY_CONFIG = {
  mariana:  { folder: "./assets/mariana",  prefix: "mariana_",  count: 70, label: "Mariana's Collection", className: "bouquets", pad: 3 },
  fiorella: { folder: "./assets/fiorella", prefix: "fiorella_", count: 16, label: "Fiorella's Gifts",     className: "gifts",    pad: 3 },
  shinny:   { folder: "./assets/shinny",   prefix: "shinny_",   count: 20, label: "Shinny Ribbons",       className: "ribbons",  pad: 3 },
  alvin:    { folder: "./assets/alvin",    prefix: "alvin_",    count: 8,  label: "Alvin's Apparel",      className: "apparel",  pad: 3 },
  cool:     { folder: "./assets/cool",     prefix: "cool_",     count: 1,  label: "Cool Vinyls",          className: "gifts",    pad: 3 }
};

let galleries = {}; // filename arrays per key

/* =========================
   Language Loader (Centralized)
   ========================= */
const languageButtons = document.querySelectorAll(".language-selector button");

function loadLanguage(lang) {
  const safe = ["en","es"].includes(lang) ? lang : "en";
  fetch(`./lang/${safe}.json`)
    .then(res => res.ok ? res.json() : {})
    .then(translations => {
      document.querySelectorAll("[data-key]").forEach(el => {
        const key = el.getAttribute("data-key");
        if (translations[key]) el.textContent = translations[key];
      });
      document.documentElement.setAttribute("lang", safe);
      languageButtons.forEach(btn =>
        btn.classList.toggle("active", btn.dataset.lang === safe)
      );
      localStorage.setItem("lang", safe);
    })
    .catch(() => {/* fail-closed */});
}

const savedLang = localStorage.getItem("lang") || ((navigator.language||"").toLowerCase().startsWith("es") ? "es" : "en");
loadLanguage(savedLang);
languageButtons.forEach(btn => btn.addEventListener("click", () => loadLanguage(btn.dataset.lang)));

/* =========================
   Optional: block right-click only in Brands section
   ========================= */
const brandsSection = document.getElementById("brands");
if (brandsSection) brandsSection.addEventListener("contextmenu", e => e.preventDefault());

/* =========================
   Page detection & helpers
   ========================= */
const IS_GALLERY_PAGE = document.body.classList.contains("gallery-page");

if (IS_GALLERY_PAGE) {
  document.querySelectorAll('.brand-header, #gallery-page')
    .forEach(s => s.classList.add('visible'));
}

function buildNames(prefix, count, pad = 0, start = 1) {
  return Array.from({ length: count }, (_, i) =>
    `${prefix}${String(i + start).padStart(pad, "0")}.jpg`
  );
}

/* =========================
   Fade-in animations (with mobile-safe fallback)
   ========================= */
const SUPPORTS_IO = "IntersectionObserver" in window;

let sectionObserver = null;
let galleryIO = null;

if (SUPPORTS_IO) {
  sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.08, rootMargin: "120px 0px" });

  document.querySelectorAll("section").forEach(s => sectionObserver.observe(s));

  galleryIO = new IntersectionObserver(entries => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), idx * 80);
        galleryIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "140px 0px" });
} else {
  // Fallback: reveal everything immediately so nothing is invisible
  document.documentElement.classList.add("no-io");
  document.querySelectorAll("section").forEach(s => s.classList.add("visible"));
}

function observeNewGalleryItems(root = document) {
  const items = root.querySelectorAll(".gallery-item");
  if (SUPPORTS_IO && galleryIO) {
    items.forEach(item => galleryIO.observe(item));
  } else {
    items.forEach(item => item.classList.add("visible")); // ensure thumbnails show
  }
}

// If no section became visible soon after load, reveal them
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!document.querySelector('section.visible')) {
      document.querySelectorAll('section').forEach(s => s.classList.add('visible'));
    }
  }, 700);
});

/* =========================
   Build the galleries map from config (both pages)
   ========================= */
galleries = Object.fromEntries(
  Object.entries(GALLERY_CONFIG).map(([key, cfg]) => [key, buildNames(cfg.prefix, cfg.count, cfg.pad)])
);

/* =========================
   Render tiles on the gallery page only
   ========================= */
if (IS_GALLERY_PAGE) {
  const container = document.querySelector(".gallery");
  if (container) {
    const frag = document.createDocumentFragment();
    for (const [key, cfg] of Object.entries(GALLERY_CONFIG)) {
      const files = galleries[key];
      files.forEach(file => {
        const item = document.createElement("div");
        item.className = `gallery-item ${cfg.className}`;

        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = `${cfg.folder}/${file}`;
        img.alt = cfg.label;
        img.dataset.gallery = key;

        img.addEventListener("load", () => item.classList.add("visible"));
        img.addEventListener("error", () => item.remove());

        const desc = document.createElement("div");
        desc.className = "desc";
        desc.textContent = cfg.label;

        item.append(img, desc);
        frag.appendChild(item);
      });
    }
    container.appendChild(frag);
    observeNewGalleryItems(container);

    // Filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    if (filterButtons.length) {
      const itemsAll = () => container.querySelectorAll(".gallery-item");
      filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          filterButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const category = btn.dataset.filter;
          itemsAll().forEach(item => {
            item.style.display =
              category === "all" || item.classList.contains(category) ? "block" : "none";
          });
        });
      });
    }
  }
} else {
  // Index/other pages already have a few teaser thumbnails in HTML; just animate them
  document.querySelectorAll(".gallery").forEach(gal => observeNewGalleryItems(gal));
}

/* =========================
   Lightbox (shared)
   - Loads FULL category from GALLERY_CONFIG for ANY page
   - Starts on the image that was clicked
   - Adds zoom controls (auto-injected) + pan
   ========================= */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const caption = document.getElementById("caption");
const closeBtn = document.querySelector(".lightbox .close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

let currentIndex = 0;
let categoryImages = [];
let currentGalleryTitle = "";

// --- Zoom state ---
let scale = 1, posX = 0, posY = 0;
const ZOOM_STEP = 0.25;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Inject zoom toolbar if missing (works on both pages without HTML edits)
function ensureZoomControls() {
  if (!lightbox) return;
  if (lightbox.querySelector(".controls")) return;

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.setAttribute("role", "toolbar");
  controls.setAttribute("aria-label", "Image zoom controls");

  const btnIn = document.createElement("button");
  btnIn.className = "zoom-in";
  btnIn.type = "button";
  btnIn.setAttribute("aria-label", "Zoom in");
  btnIn.textContent = "＋";

  const btnOut = document.createElement("button");
  btnOut.className = "zoom-out";
  btnOut.type = "button";
  btnOut.setAttribute("aria-label", "Zoom out");
  btnOut.textContent = "－";

  const btnReset = document.createElement("button");
  btnReset.className = "zoom-reset";
  btnReset.type = "button";
  btnReset.setAttribute("aria-label", "Reset zoom");
  btnReset.textContent = "100%";

  controls.append(btnIn, btnOut, btnReset);

  // Insert controls after caption, before arrows (prev/next)
  const captionEl = lightbox.querySelector("#caption");
  if (captionEl && nextBtn) {
    lightbox.insertBefore(controls, nextBtn);
  } else {
    lightbox.appendChild(controls);
  }
}

function applyTransform() {
  if (!lightboxImg) return;
  lightboxImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  lightbox && lightbox.classList.toggle("zoomed", scale > 1);
}

function resetZoom() {
  scale = 1;
  posX = 0;
  posY = 0;
  applyTransform();
}

function zoomBy(delta) {
  const prev = scale;
  scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(scale + delta).toFixed(2)));
  if (scale === 1 && prev !== 1) { posX = 0; posY = 0; }
  applyTransform();
}

if (lightbox && lightboxImg && caption && closeBtn && prevBtn && nextBtn) {
  ensureZoomControls();

  // Wire click on any gallery image to open full category
  document.addEventListener("click", e => {
    const img = e.target.closest(".gallery .gallery-item img");
    if (!img) return;

    const galleryName = img.dataset.gallery;
    const cfg = GALLERY_CONFIG[galleryName];
    const files = galleries[galleryName] || [];
    if (!cfg || !files.length) return;

    // Build the full list for the lightbox (entire category)
    categoryImages = files.map(file => ({
      src: `${cfg.folder}/${file}`,
      alt: cfg.label
    }));
    currentGalleryTitle = cfg.label;

    // Find index of the clicked file (start here!)
    const clickedSrc = img.getAttribute("src") || "";
    const clickedFile = clickedSrc.split("/").pop();
    const idx = files.indexOf(clickedFile);
    currentIndex = idx >= 0 ? idx : 0;

    openLightbox();
  });

  function openLightbox() {
    lightbox.style.display = "flex";
    updateLightbox();
    closeBtn.focus(); // basic focus entry
  }

  function updateLightbox() {
    // reset zoom/pan for each image shown
    resetZoom();

    lightboxImg.style.opacity = 0;
    setTimeout(() => {
      lightboxImg.src = categoryImages[currentIndex].src;
      lightboxImg.alt = currentGalleryTitle;
      caption.innerText = `${currentGalleryTitle} (${currentIndex + 1}/${categoryImages.length})`;
      lightboxImg.style.opacity = 1;
    }, 150);
  }

  function changeImage(step) {
    currentIndex = (currentIndex + step + categoryImages.length) % categoryImages.length;
    updateLightbox();
  }

  prevBtn.addEventListener("click", () => changeImage(-1));
  nextBtn.addEventListener("click", () => changeImage(1));

  closeBtn.addEventListener("click", () => (lightbox.style.display = "none"));
  window.addEventListener("click", e => { if (e.target === lightbox) lightbox.style.display = "none"; });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") lightbox.style.display = "none";
    if (e.key === "ArrowRight") changeImage(1);
    if (e.key === "ArrowLeft") changeImage(-1);
  });

  // Swipe (mobile): image navigation
  let touchStartX = 0;
  lightbox.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  lightbox.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const SWIPE = 50;
    if (dx < -SWIPE) changeImage(1);
    if (dx >  SWIPE) changeImage(-1);
  }, { passive: true });

  // --- Zoom controls & pan ---
  const zoomInBtn  = lightbox.querySelector(".zoom-in");
  const zoomOutBtn = lightbox.querySelector(".zoom-out");
  const zoomResetBtn = lightbox.querySelector(".zoom-reset");

  if (zoomInBtn && zoomOutBtn && zoomResetBtn) {
    zoomInBtn.addEventListener("click", () => zoomBy(+ZOOM_STEP));
    zoomOutBtn.addEventListener("click", () => zoomBy(-ZOOM_STEP));
    zoomResetBtn.addEventListener("click", resetZoom);
  }

  // Double-click / double-tap toggle
  lightboxImg.addEventListener("dblclick", (e) => {
    e.preventDefault();
    scale = (scale === 1 ? 2 : 1);
    if (scale === 1) { posX = 0; posY = 0; }
    applyTransform();
  });

  // Wheel zoom (desktop)
  lightboxImg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -ZOOM_STEP : +ZOOM_STEP);
  }, { passive: false });

  // Drag to pan (mouse)
  let dragging = false, lastX = 0, lastY = 0;
  lightboxImg.addEventListener("mousedown", (e) => {
    if (scale === 1) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    posX += dx;
    posY += dy;
    applyTransform();
  });
  window.addEventListener("mouseup", () => dragging = false);

  // Touch to pan (single-finger)
  let touchDrag = false, tLastX = 0, tLastY = 0;
  lightboxImg.addEventListener("touchstart", (e) => {
    if (scale === 1) return;
    if (e.touches.length !== 1) return;
    touchDrag = true;
    tLastX = e.touches[0].clientX;
    tLastY = e.touches[0].clientY;
  }, { passive: true });

  lightboxImg.addEventListener("touchmove", (e) => {
    if (!touchDrag || scale === 1) return;
    if (e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - tLastX;
    const dy = y - tLastY;
    tLastX = x;
    tLastY = y;
    posX += dx;
    posY += dy;
    applyTransform();
  }, { passive: true });

  lightboxImg.addEventListener("touchend", () => { touchDrag = false; }, { passive: true });

  // Prevent native drag ghost
  lightboxImg.addEventListener("dragstart", (e) => e.preventDefault());
}

/* =========================
   Hamburger Menu (Mobile) + Scroll effects
   ========================= */
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
if (hamburger && navLinks) {
  hamburger.setAttribute("aria-label", "Toggle navigation menu");
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.addEventListener("click", () => {
    const isActive = navLinks.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", String(isActive));
  });
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

const sections = document.querySelectorAll("section");
const navItems = document.querySelectorAll(".nav-links a");
if (sections.length && navItems.length) {
  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
        current = section.getAttribute("id");
      }
    });
    navItems.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  });
}

const navbar = document.querySelector(".navbar");
if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });
}
