import {
  clearPunishmentSelections,
  getPunishmentSelections,
  isFirebaseReady,
  savePunishmentSelection
} from "./firebase.js";

const quotes = [
  "You are my favorite person, even on the hardest days.",
  "I would choose your laugh in every version of my life.",
  "I am sorry for the hurt. I am grateful for your heart.",
  "You deserve softness, honesty, and love that feels safe.",
  "My favorite future is the one where we are okay again."
];

const cuteMessages = [
  "Okay, I deserved that one 😭",
  "Your decision has been sent straight to my heart.",
  "I am taking notes and behaving immediately.",
  "Tiny apology submitted with maximum sincerity.",
  "I accept this sentence with love."
];

let audioContext;
let musicNodes = [];
let musicPlaying = false;

if (document.getElementById("loader")) {
  document.body.classList.add("is-loading");
}

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader")?.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
  }, 700);
});

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".hero-section")) {
    return;
  }

  createParticles();
  createFloatingHearts();
  setupAnimations();
  setupHeartTrail();
  setupMusic();
  setupPunishmentCards();
  setupFinalButtons();
  rotateQuotes();

  if (!isFirebaseReady()) {
    showToast("Firebase is not configured yet. Choices will save locally for preview.");
  }
});

function setupAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".line-one", {
    y: 38,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 0.35
  });

  gsap.from(".hero-heart", {
    scale: 0,
    rotate: -24,
    opacity: 0,
    duration: 0.8,
    ease: "back.out(1.8)",
    delay: 0.95
  });

  gsap.from(".line-two", {
    y: 38,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 1.25
  });

  gsap.from(".reveal-soft", {
    y: 22,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: "power2.out",
    delay: 1.7
  });

  gsap.utils.toArray(".reason-card").forEach((card, index) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: "top 86%"
      },
      x: index % 2 === 0 ? -32 : 32,
      y: 24,
      opacity: 0,
      duration: 0.7,
      ease: "power2.out"
    });
  });

  gsap.utils.toArray(".promise-item").forEach((item) => {
    gsap.from(item, {
      scrollTrigger: {
        trigger: item,
        start: "top 82%",
        onEnter: () => item.querySelector(".promise-dot")?.classList.add("beat")
      },
      y: 34,
      opacity: 0,
      duration: 0.75,
      ease: "power2.out"
    });
  });

  gsap.from(".option-card", {
    scrollTrigger: {
      trigger: "#punishment",
      start: "top 75%"
    },
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: "back.out(1.2)"
  });
}

function setupPunishmentCards() {
  document.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => handleSelection(card.dataset.option, ""));
  });

  document.getElementById("customPunishmentForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("customMessage");
    const customMessage = input.value.trim();

    if (!customMessage) {
      showToast("Write a tiny punishment first, please.");
      return;
    }

    handleSelection("Custom Text Input Option", customMessage);
    input.value = "";
  });
}

async function handleSelection(option, customMessage) {
  const label = customMessage || option;

  try {
    const savedResponse = await savePunishmentSelection({ option, customMessage });
    showCelebration(label);
    showToast(savedResponse.localOnly
      ? "Saved locally. Add Firebase config to sync it online."
      : randomFrom(cuteMessages)
    );
    createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 28);
  } catch (error) {
    console.error(error);
    showToast("Something went wrong saving it. Firebase config may need a look.");
  }
}

function showCelebration(label) {
  const modal = document.getElementById("celebrationModal");
  const text = document.getElementById("selectedPunishmentText");
  text.textContent = `"${label}" has been selected. I accept my fate lovingly.`;
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");

  gsap.fromTo(".celebration-card", { scale: 0.86, y: 28 }, { scale: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" });
}

document.getElementById("closeCelebration")?.addEventListener("click", () => {
  const modal = document.getElementById("celebrationModal");
  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
});

function setupFinalButtons() {
  document.getElementById("forgiveBtn")?.addEventListener("click", () => {
    recordQuickResponse("Forgive Me ❤️");
    const overlay = document.getElementById("forgiveOverlay");
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 80);
    createFullscreenHearts();
    gsap.fromTo(".forgive-message", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.7)" });
  });

  document.getElementById("thinkingBtn")?.addEventListener("click", () => {
    recordQuickResponse("Still Thinking");
    showToast("Fair. I will wait gently and keep trying better.");
  });

  document.getElementById("thinkingBtnHero")?.addEventListener("click", () => {
    recordQuickResponse("Still Thinking");
    showToast("Take your time. I know your heart matters.");
  });

  document.getElementById("chanceBtn")?.addEventListener("click", () => {
    recordQuickResponse("One More Chance?");
    document.getElementById("punishment")?.scrollIntoView({ behavior: "smooth" });
    showToast("Choose my punishment. I am ready.");
  });
}

async function recordQuickResponse(option) {
  try {
    await savePunishmentSelection({ option });
  } catch (error) {
    console.error(error);
  }
}

function setupMusic() {
  const toggle = document.getElementById("musicToggle");

  toggle?.addEventListener("click", async () => {
    if (!musicPlaying) {
      await startSoftMusic();
      toggle.classList.add("is-playing");
      showToast("Soft background music on.");
    } else {
      stopSoftMusic();
      toggle.classList.remove("is-playing");
      showToast("Music paused.");
    }
  });
}

async function startSoftMusic() {
  audioContext = audioContext || new AudioContext();
  await audioContext.resume();

  const masterGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const notes = [261.63, 329.63, 392.0, 493.88];

  masterGain.gain.value = 0.045;
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  filter.connect(masterGain);
  masterGain.connect(audioContext.destination);

  musicNodes = notes.map((frequency, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = index % 2 ? "triangle" : "sine";
    osc.frequency.value = frequency;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(filter);
    osc.start();
    return { osc, gain };
  });

  musicPlaying = true;
}

function stopSoftMusic() {
  musicNodes.forEach(({ osc }) => osc.stop());
  musicNodes = [];
  musicPlaying = false;
}

function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  for (let index = 0; index < 42; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * -9}s`;
    particle.style.setProperty("--duration", `${7 + Math.random() * 8}s`);
    particle.style.setProperty("--sway", `${-35 + Math.random() * 70}px`);
    container.appendChild(particle);
  }
}

function createFloatingHearts() {
  const container = document.getElementById("floatingHearts");
  if (!container) return;

  for (let index = 0; index < 24; index += 1) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = randomFrom(["♡", "♥", "💕", "💗"]);
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.animationDelay = `${Math.random() * -14}s`;
    heart.style.setProperty("--duration", `${9 + Math.random() * 9}s`);
    heart.style.setProperty("--size", `${0.9 + Math.random() * 1.5}rem`);
    heart.style.setProperty("--sway", `${-55 + Math.random() * 110}px`);
    container.appendChild(heart);
  }
}

function setupHeartTrail() {
  let lastTrail = 0;

  window.addEventListener("pointermove", (event) => {
    const now = Date.now();
    if (now - lastTrail < 65) return;
    lastTrail = now;

    const heart = document.createElement("span");
    heart.className = "trail-heart";
    heart.textContent = "❤";
    heart.style.left = `${event.clientX}px`;
    heart.style.top = `${event.clientY}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 900);
  });
}

function createHeartBurst(x, y, count) {
  for (let index = 0; index < count; index += 1) {
    const heart = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 220;

    heart.className = "burst-heart";
    heart.textContent = randomFrom(["❤️", "💖", "💕", "💗", "🌸"]);
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    heart.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    heart.style.setProperty("--r", `${Math.random() * 220 - 110}deg`);
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1400);
  }
}

function createFullscreenHearts() {
  const container = document.getElementById("heartExplosion");

  for (let index = 0; index < 80; index += 1) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      createHeartBurst(x, y, 4);
    }, index * 18);
  }

  if (container) {
    gsap.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  }
}

function rotateQuotes() {
  const quote = document.getElementById("quoteRotator");
  if (!quote) return;

  let index = 0;
  setInterval(() => {
    index = (index + 1) % quotes.length;
    gsap.to(quote, {
      opacity: 0,
      y: -10,
      duration: 0.25,
      onComplete: () => {
        quote.textContent = quotes[index];
        gsap.fromTo(quote, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35 });
      }
    });
  }, 4300);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function renderAdminResponses({ listEl, emptyEl, statusEl }) {
  try {
    const responses = await getPunishmentSelections();
    const localNote = isFirebaseReady()
      ? "Connected to Firebase Firestore."
      : "Firebase is not configured yet, so this shows choices saved in this browser.";

    statusEl.textContent = `${localNote} ${responses.length} response${responses.length === 1 ? "" : "s"} found.`;
    listEl.innerHTML = "";
    emptyEl.classList.toggle("hidden", responses.length > 0);

    responses.forEach((response) => {
      const card = document.createElement("article");
      card.className = "response-card glass-card";
      const timestamp = formatTimestamp(response.createdAt);

      const title = response.customMessage || response.option || "Unknown choice";
      const meta = response.source || (response.localOnly ? "Local backup" : "Firestore");

      card.innerHTML = `
        <div class="response-topline">
          <h3>${escapeHtml(title)}</h3>
          <span>${escapeHtml(meta)}</span>
        </div>
        ${response.customMessage ? `<p>Custom option selected</p>` : ""}
        <time>${timestamp}</time>
      `;

      listEl.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Could not load responses. Check Firebase config and Firestore rules.";
  }
}

export async function clearAdminResponses({ listEl, emptyEl, statusEl }) {
  try {
    await clearPunishmentSelections();
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
    statusEl.textContent = "Responses cleared. Fresh start.";
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Could not clear Firestore responses. Check delete permissions in Firestore rules.";
  }
}

function formatTimestamp(value) {
  if (!value) return "Timestamp pending";

  if (typeof value === "string") {
    return new Date(value).toLocaleString();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  return "Timestamp unavailable";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
