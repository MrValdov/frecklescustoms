// =========================
// Language Loader (Centralized)
// =========================
const languageButtons = document.querySelectorAll(".language-selector button");

function loadLanguage(lang) {
    fetch(`./lang/${lang}.json`)
        .then(res => res.json())
        .then(translations => {
            document.querySelectorAll("[data-key]").forEach(el => {
                const key = el.getAttribute("data-key");
                if (translations[key]) {
                    el.textContent = translations[key];
                }
            });
            // Update <html lang> for accessibility & SEO
            document.documentElement.setAttribute("lang", lang);
        })
        .catch(err => console.error("Error loading language file:", err));

    // Highlight active language button
    languageButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.lang === lang));

    // Remember preference
    localStorage.setItem("lang", lang);
}

// Initialize language on page load
const savedLang = localStorage.getItem("lang") || (navigator.language.startsWith("es") ? "es" : "en");
loadLanguage(savedLang);

// Event listeners for language buttons
languageButtons.forEach(btn => {
    btn.addEventListener("click", () => loadLanguage(btn.dataset.lang));
});

// =========================
// Block Right Click in Brands Section
// =========================
const brandsSection = document.getElementById("brands");

if (brandsSection) {
    brandsSection.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });
}

// =========================
// Lightbox Implementation
// =========================
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const caption = document.getElementById("caption");
const closeBtn = document.querySelector(".lightbox .close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

let currentIndex = 0;
let categoryImages = [];
let currentGalleryTitle = "";

// Add ARIA roles for accessibility
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
closeBtn.setAttribute("aria-label", "Close lightbox");
prevBtn.setAttribute("aria-label", "Previous image");
nextBtn.setAttribute("aria-label", "Next image");

// Gallery definitions (map categories to images)
const galleries = {
    mariana: ["mariana_1.jpg", "mariana_2.jpg", "mariana_3.jpg", "mariana_4.jpg", "mariana_5.jpg"],
    fiorella: ["fiorella_1.jpg"],
    shinny: ["shinny_1.jpg", "shinny_2.jpg"],
    alvin: ["alvin_1.jpg", "alvin_2.jpg", "alvin_3.jpg"]
};

// Click event for thumbnails
document.querySelectorAll(".gallery .gallery-item img").forEach(img => {
    const galleryName = img.dataset.gallery;
    const galleryTitle = img.closest(".gallery-item").querySelector(".desc").innerText;

    img.addEventListener("click", () => {
        currentGalleryTitle = galleryTitle;
        categoryImages = galleries[galleryName].map(file => ({
            src: `./assets/${galleryName}/${file}`,
            alt: galleryTitle
        }));
        currentIndex = 0;
        openLightbox();
    });
});

// Open Lightbox
function openLightbox() {
    lightbox.style.display = "flex";
    updateLightbox();
    lightbox.focus();
}

// Update Lightbox
function updateLightbox() {
    lightboxImg.style.opacity = 0;
    setTimeout(() => {
        lightboxImg.src = categoryImages[currentIndex].src;
        lightboxImg.alt = currentGalleryTitle;
        caption.innerText = currentGalleryTitle;
        lightboxImg.style.opacity = 1;
    }, 200);
}

// Lightbox navigation
prevBtn.addEventListener("click", () => changeImage(-1));
nextBtn.addEventListener("click", () => changeImage(1));

function changeImage(step) {
    currentIndex = (currentIndex + step + categoryImages.length) % categoryImages.length;
    updateLightbox();
}

// Close events
closeBtn.addEventListener("click", () => (lightbox.style.display = "none"));
window.addEventListener("click", e => { if (e.target === lightbox) lightbox.style.display = "none"; });
window.addEventListener("keydown", e => {
    if (e.key === "Escape") lightbox.style.display = "none";
    if (e.key === "ArrowRight") changeImage(1);
    if (e.key === "ArrowLeft") changeImage(-1);
});

// Swipe Gesture Support
let touchStartX = 0;
lightbox.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; });
lightbox.addEventListener("touchend", e => {
    const touchEndX = e.changedTouches[0].screenX;
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) changeImage(1);
    if (touchEndX > touchStartX + swipeThreshold) changeImage(-1);
});

// =========================
// Hamburger Menu (Mobile)
// =========================
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
hamburger.setAttribute("aria-label", "Toggle navigation menu");
hamburger.setAttribute("aria-expanded", "false");

hamburger.addEventListener("click", () => {
    const isActive = navLinks.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", isActive);
});
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
    });
});

// =========================
// Scroll-based Active Nav Highlight
// =========================
const sections = document.querySelectorAll("section");
const navItems = document.querySelectorAll(".nav-links a");
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

// =========================
// Fade-in Animations
// =========================
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
    });
}, { threshold: 0.15 });
sections.forEach(section => observer.observe(section));

const galleryItems = document.querySelectorAll(".gallery-item");
const galleryObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) setTimeout(() => entry.target.classList.add("visible"), index * 100);
    });
}, { threshold: 0.2 });
galleryItems.forEach(item => galleryObserver.observe(item));

// =========================
// Navbar Background Scroll Effect
// =========================
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// =========================
// Filter Buttons
// =========================
const filterButtons = document.querySelectorAll(".filter-btn");
const galleryItemsAll = document.querySelectorAll(".gallery-item");
filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const category = btn.dataset.filter;
        galleryItemsAll.forEach(item => {
            item.style.display = (category === "all" || item.classList.contains(category)) ? "block" : "none";
        });
    });
});
