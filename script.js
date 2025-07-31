// Disable right-click and dragging
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('mousedown', event => event.preventDefault());

// Lightbox Elements
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const caption = document.getElementById("caption");
const closeBtn = document.querySelector(".lightbox .close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

let currentIndex = 0;
let categoryImages = [];
let currentGalleryTitle = "";

// Define galleries
const galleries = {
    mariana: ["mariana_1.jpg", "mariana_2.jpg", "mariana_3.jpg", "mariana_4.jpg", "mariana_5.jpg"],
    fiorella: ["fiorella_1.jpg"],
    shinny: ["shinny_1.jpg", "shinny_2.jpg"],
    alvin: ["alvin_1.jpg", "alvin_2.jpg", "alvin_3.jpg"]
};

// Click event for thumbnails
document.querySelectorAll(".gallery .gallery-item").forEach(item => {
    const img = item.querySelector("img");
    const galleryName = img.dataset.gallery;
    const galleryTitle = item.querySelector(".desc").innerText;

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
}

// Update Lightbox with fade effect
function updateLightbox() {
    lightboxImg.style.opacity = 0;
    setTimeout(() => {
        lightboxImg.src = categoryImages[currentIndex].src;
        lightboxImg.alt = currentGalleryTitle;
        caption.innerText = currentGalleryTitle;
        lightboxImg.style.opacity = 1;
    }, 200);
}

// Navigation
prevBtn.addEventListener("click", () => changeImage(-1));
nextBtn.addEventListener("click", () => changeImage(1));

function changeImage(step) {
    currentIndex = (currentIndex + step + categoryImages.length) % categoryImages.length;
    updateLightbox();
}

// Close lightbox
closeBtn.addEventListener("click", () => {
    lightbox.style.display = "none";
});

// Close on outside click
window.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.style.display = "none";
});

// Close on ESC
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") lightbox.style.display = "none";
});

// Swipe Gesture Support for Mobile
let touchStartX = 0;
let touchEndX = 0;
lightbox.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].screenX; });
lightbox.addEventListener("touchend", (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); });
function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) changeImage(1);
    if (touchEndX > touchStartX + swipeThreshold) changeImage(-1);
}

// --- Mobile Hamburger Menu Toggle ---
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
hamburger.addEventListener("click", () => navLinks.classList.toggle("active"));
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => navLinks.classList.remove("active"));
});

// --- Scroll-based Active Nav Highlight ---
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
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) link.classList.add("active");
    });
});

// --- Fade-in Sections on Scroll ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
    });
}, { threshold: 0.15 });
sections.forEach(section => observer.observe(section));

// --- Staggered Animation for Gallery Items ---
const galleryItems = document.querySelectorAll(".gallery-item");
const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), index * 100);
        }
    });
}, { threshold: 0.2 });
galleryItems.forEach(item => galleryObserver.observe(item));

// --- Navbar Background and Shadow Fade ---
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// --- Filter Buttons ---
const filterButtons = document.querySelectorAll(".filter-btn");
const galleryItemsAll = document.querySelectorAll(".gallery-item");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const category = btn.dataset.filter;

    galleryItemsAll.forEach(item => {
      if (category === "all" || item.classList.contains(category)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  });
});
