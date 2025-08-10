"use strict";

/* =========================================
   Global galleries map (visible to all code)
   ========================================= */
let galleries = {};

/* =========================
   Language Loader (Centralized)
   ========================= */
const languageButtons = document.querySelectorAll(".language-selector button");
const ALLOWED_LANGS = new Set(["en", "es"]);

function loadLanguage(lang) {
  const safeLang = ALLOWED_LANGS.has(lang) ? lang : "en";
  fetch(`./lang/${safeLang}.json`)
    .then(res => res.ok ? res.json() : {})
    .then(translations => {
      // text nodes
      document.querySelectorAll("[data-key]").forEach(el => {
        const key = el.getAttribute("data-key");
        if (translations[key]) el.textContent = translations[key];
      });

      // attribute nodes: e.g., data-i18n-attr="aria-label:mailtoCtaLabel;title:someKey"
      document.querySelectorAll("[data-i18n-attr]").forEach(el => {
        const pairs = (el.getAttribute("data-i18n-attr") || "")
          .split(";")
          .map(s => s.trim())
          .filter(Boolean);
        pairs.forEach(pair => {
          const [attr, tKey] = pair.split(":").map(s => s.trim());
          if (attr && tKey && translations[tKey]) el.setAttribute(attr, translations[tKey]);
        });
      });

      document.documentElement.setAttribute("lang", safeLang);
      localStorage.setItem("lang", safeLang);
      languageButtons.forEach(btn =>
        btn.classList.toggle("active", btn.dataset.lang === safeLang)
      );
    })
    .catch(() => {/* fail closed */});
}

const stored = localStorage.getItem("lang");
const browserDefault = (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "en";
loadLanguage(ALLOWED_LANGS.has(stored) ? stored : browserDefault);

languageButtons.forEach(btn => btn.addEventListener("click", () => loadLanguage(btn.dataset.lang)));


/* =========================
   Block Right Click in Brands Section
   ========================= */
const brandsSection = document.getElementById("brands");
if (brandsSection) {
  brandsSection.addEventListener("contextmenu", (e) => e.preventDefault());
}

/* =========================
   Page detection
   ========================= */
const IS_GALLERY_PAGE = document.body.classList.contains("gallery-page");

/* =========================
   Gallery data sources
   ========================= */

// Helper to build zero‑padded file names
function buildNames(prefix, count, pad = 0, start = 1) {
  return Array.from({ length: count }, (_, i) =>
    `${prefix}${String(i + start).padStart(pad, "0")}.jpg`
  );
}

/* ---- A) GALLERY PAGE: auto-generate tiles + derived map ---- */
if (IS_GALLERY_PAGE) {
  const GALLERY_CONFIG = {
    mariana:  { folder: "./assets/mariana",  prefix: "mariana_",  count: 70, label: "Mariana's Collection", className: "bouquets", pad: 3 },
    fiorella: { folder: "./assets/fiorella", prefix: "fiorella_", count: 16, label: "Fiorella's Gifts", className: "gifts",    pad: 3 },
    shinny:   { folder: "./assets/shinny",   prefix: "shinny_",   count: 20, label: "Shinny Ribbons", className: "ribbons",  pad: 3 },
    alvin:    { folder: "./assets/alvin",    prefix: "alvin_",    count: 8,  label: "Alvin's Apparel", className: "apparel",  pad: 3 },
    cool:     { folder: "./assets/cool",     prefix: "cool_",     count: 1,  label: "Cool Vinyls", className: "gifts",    pad: 3 }
  };

  (function renderGalleryFromConfig() {
    const container = document.querySelector(".gallery");
    if (!container) return;

    const frag = document.createDocumentFragment();
    for (const [key, cfg] of Object.entries(GALLERY_CONFIG)) {
      const files = buildNames(cfg.prefix, cfg.count, cfg.pad);
      files.forEach((file) => {
        const item = document.createElement("div");
        item.className = `gallery-item ${cfg.className}`;

        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = `${cfg.folder}/${file}`;
        img.alt = cfg.label;
        img.dataset.gallery = key;
        img.addEventListener("error", () => item.remove()); // hide broken tiles

        const desc = document.createElement("div");
        desc.className = "desc";
        desc.textContent = cfg.label;

        item.append(img, desc);
        frag.appendChild(item);
      });
    }
    container.appendChild(frag);
  })();

  // Lightbox source map for the gallery page
  galleries = Object.fromEntries(
    Object.entries(GALLERY_CONFIG).map(([key, cfg]) => [
      key,
      buildNames(cfg.prefix, cfg.count, cfg.pad)
    ])
  );
}
/* ---- B) INDEX (and other pages): derive map from existing DOM ---- */
else {
  // Build galleries by scanning inline thumbnails on the page
  galleries = Array.from(document.querySelectorAll(".gallery .gallery-item img"))
    .reduce((acc, img) => {
      const galleryName = img.dataset.gallery;
      if (!galleryName) return acc;

      try {
        const url = new URL(img.getAttribute("src"), window.location.href);
        const file = url.pathname.split("/").pop();
        if (!acc[galleryName]) acc[galleryName] = [];
        if (file && !acc[galleryName].includes(file)) acc[galleryName].push(file);
      } catch {
        // fallback if URL() fails (relative paths)
        const src = img.getAttribute("src") || "";
        const file = src.split("/").pop();
        if (!acc[galleryName]) acc[galleryName] = [];
        if (file && !acc[galleryName].includes(file)) acc[galleryName].push(file);
      }
      return acc;
    }, {});

  // Optional: keep brands list around in case other code references it
  galleries.brands = [
    "abners_stickers.png","alvins_apparel.png","cool_vinyls.png",
    "fiorella_gifts.png","mariana_collect.png","shinny_ribbons.png",
    "valeries_stickers.png"
  ];
}

/* =========================
   Lightbox Implementation (delegated)
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

// Only set up if elements exist
if (lightbox && lightboxImg && caption && closeBtn && prevBtn && nextBtn) {
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  closeBtn.setAttribute("aria-label", "Close lightbox");
  prevBtn.setAttribute("aria-label", "Previous image");
  nextBtn.setAttribute("aria-label", "Next image");

  // One listener for every gallery on the page
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".gallery .gallery-item img");
    if (!img) return;

    const galleryName = img.dataset.gallery;
    const tile = img.closest(".gallery-item");
    const titleEl = tile ? tile.querySelector(".desc") : null;
    const galleryTitle = titleEl ? titleEl.innerText : "";

    const files = galleries[galleryName] || [];
    if (!files.length) return;

    currentGalleryTitle = galleryTitle;
    categoryImages = files.map(file => ({
      src: `./assets/${galleryName}/${file}`,
      alt: galleryTitle
    }));
    currentIndex = 0;
    openLightbox();
  });

  function openLightbox() {
    lightbox.style.display = "flex";
    updateLightbox();
    lightbox.focus();
  }

  function updateLightbox() {
    lightboxImg.style.opacity = 0;
    setTimeout(() => {
      lightboxImg.src = categoryImages[currentIndex].src;
      lightboxImg.alt = currentGalleryTitle;
      caption.innerText = currentGalleryTitle;
      lightboxImg.style.opacity = 1;
    }, 200);
  }

  prevBtn.addEventListener("click", () => changeImage(-1));
  nextBtn.addEventListener("click", () => changeImage(1));

  function changeImage(step) {
    currentIndex = (currentIndex + step + categoryImages.length) % categoryImages.length;
    updateLightbox();
  }

  closeBtn.addEventListener("click", () => (lightbox.style.display = "none"));
  window.addEventListener("click", e => { if (e.target === lightbox) lightbox.style.display = "none"; });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") lightbox.style.display = "none";
    if (e.key === "ArrowRight") changeImage(1);
    if (e.key === "ArrowLeft") changeImage(-1);
  });

  // Swipe (mobile)
  let touchStartX = 0;
  lightbox.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; });
  lightbox.addEventListener("touchend", e => {
    const touchEndX = e.changedTouches[0].screenX;
    const swipe = 50;
    if (touchEndX < touchStartX - swipe) changeImage(1);
    if (touchEndX > touchStartX + swipe) changeImage(-1);
  });
}

/* =========================
   Hamburger Menu (Mobile)
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

/* =========================
   Scroll-based Active Nav Highlight
   ========================= */
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

/* =========================
   Fade-in Animations
   ========================= */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.15 });

sections.forEach(section => observer.observe(section));

// Stagger reveal for gallery items (supports both pages)
document.querySelectorAll(".gallery").forEach(gal => {
  const items = gal.querySelectorAll(".gallery-item");
  const galleryObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) setTimeout(() => entry.target.classList.add("visible"), index * 100);
    });
  }, { threshold: 0.2 });
  items.forEach(item => galleryObserver.observe(item));
});

/* =========================
   Navbar Background Scroll Effect
   ========================= */
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* =========================
   Filter Buttons (gallery page only)
   ========================= */
if (IS_GALLERY_PAGE) {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryContainer = document.querySelector(".gallery");
  if (filterButtons.length && galleryContainer) {
    const galleryItemsAll = () => galleryContainer.querySelectorAll(".gallery-item");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const category = btn.dataset.filter;
        galleryItemsAll().forEach(item => {
          item.style.display = (category === "all" || item.classList.contains(category)) ? "block" : "none";
        });
      });
    });
  }
}
