"use strict";

/**
 * Very lightweight “gate”: the page only renders if the query param ?k= matches
 * a pre-hashed passphrase. This is NOT real authentication — just obscurity.
 *
 * 1) Pick a passphrase, e.g. "sunflower".
 * 2) Compute its SHA-256 hex once (see snippet below) and paste into AUTH_HASH.
 *
 * Browser snippet to compute the hash of 'sunflower':
 *   (async () => {
 *     const enc = new TextEncoder().encode('sunflower');
 *     const buf = await crypto.subtle.digest('SHA-256', enc);
 *     console.log([...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''));
 *   })();
 *
 * Then visit: /secret.html?k=sunflower
 */
const AUTH_HASH = "981f186fb4a95e346ef08c2f69e08b96d4d0fe6d476e64466f870597d216317e"; // <-- replace with your own

// Minimal “database” right in the file.
// Add/edit rows: src (full-size image), price, sku, note (optional).
const ITEMS = [
  // Bouquets (examples — change to your real files & prices)
  { src: "./assets/mariana/mariana_166.jpg", price: 95, sku: "MC-166", note: "" },
  { src: "./assets/mariana/mariana_124.jpg", price: 85, sku: "MC-124", note: "Red roses" },
  // Ribbons
  { src: "./assets/shinny/shinny_10.jpg", price: 15, sku: "SR-010", note: "" },
  { src: "./assets/shinny/shinny_18.jpg", price: 18, sku: "SR-018", note: "" },
  // Gifts
  { src: "./assets/fiorella/fiorella_11.jpg", price: 28, sku: "FG-011", note: "" },
  { src: "./assets/fiorella/fiorella_13.jpg", price: 30, sku: "FG-013", note: "" },
  // Apparel
  { src: "./assets/alvin/alvin_2.jpg", price: 22, sku: "AA-002", note: "T-shirt" },
  { src: "./assets/alvin/alvin_3.jpg", price: 22, sku: "AA-003", note: "T-shirt" },
  // Home
  { src: "./assets/home/home_1.jpg", price: 40, sku: "OH-001", note: "Wall art" },
  { src: "./assets/home/home_2.jpg", price: 48, sku: "OH-002", note: "Wall art" },
];

/* ---------------- Gate ---------------- */
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function getKeyFromURL() {
  const url = new URL(location.href);
  return url.searchParams.get("k") || "";
}

async function gate() {
  const gateMsg = document.getElementById("gateMsg");
  const app = document.getElementById("app");

  gateMsg.hidden = false;
  gateMsg.textContent = "Checking access…";

  try {
    const k = getKeyFromURL();
    if (!k) throw new Error("Missing code (?k=…)");

    const digest = await sha256Hex(k);
    if (digest !== AUTH_HASH) throw new Error("Invalid code");

    gateMsg.hidden = true;
    app.hidden = false;
    initApp();
  } catch (err) {
    gateMsg.textContent = "404 Not Found";
    // Optional: after a delay, go home
    // setTimeout(() => location.href = "index.html", 1500);
  }
}

/* ---------------- App ---------------- */
function render(items) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  items.forEach(it => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = it.src;
    img.alt = it.sku || "item";
    img.width = 200;  

    const meta = document.createElement("div");
    meta.className = "meta";

    const price = document.createElement("span");
    price.className = "price";
    price.textContent = `$${Number(it.price).toFixed(2)}`;

    const sku = document.createElement("span");
    sku.className = "sku";
    sku.textContent = it.sku || "";

    meta.append(price, sku);
    card.append(img, meta);

    if (it.note) {
      const note = document.createElement("div");
      note.className = "muted";
      note.textContent = it.note;
      card.append(note);
    }

    frag.appendChild(card);
  });

  grid.appendChild(frag);
  document.getElementById("count").textContent = `${items.length} item(s)`;
}

function initApp() {
  const search = document.getElementById("search");
  render(ITEMS);

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    if (!q) return render(ITEMS);
    const filtered = ITEMS.filter(it =>
      (it.sku || "").toLowerCase().includes(q) ||
      (it.note || "").toLowerCase().includes(q)
    );
    render(filtered);
  });
}

/* Boot */
gate();
