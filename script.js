// Disable right-click and dragging
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('mousedown', event => event.preventDefault());

// Lightbox functionality
const galleryImages = document.querySelectorAll(".gallery img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const caption = document.getElementById("caption");
const closeBtn = document.querySelector(".lightbox .close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

let currentIndex = 0;

// Open lightbox when clicking an image
galleryImages.forEach((img, index) => {
    img.addEventListener("click", () => {
        lightbox.style.display = "flex";
        lightboxImg.src = img.src;
        caption.innerText = img.alt;
        currentIndex = index;
    });
});

// Close lightbox
closeBtn.addEventListener("click", () => {
    lightbox.style.display = "none";
});

// Navigation
prevBtn.addEventListener("click", () => changeImage(-1));
nextBtn.addEventListener("click", () => changeImage(1));

function changeImage(step) {
    currentIndex = (currentIndex + step + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentIndex].src;
    caption.innerText = galleryImages[currentIndex].alt;
}

// Close when clicking outside image
window.addEventListener("click", (e) => {
    if (e.target === lightbox) {
        lightbox.style.display = "none";
    }
});

// Close with ESC key
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        lightbox.style.display = "none";
    }
});

// ✅ Swipe Gesture Support for Mobile
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

lightbox.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance in px for swipe
    if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left → next image
        changeImage(1);
    }
    if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right → previous image
        changeImage(-1);
    }
}
