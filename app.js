// Helper
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Impulse
const impulses = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

// Sehr leise Hintergrundmusik (das ist die „richtige“ Stelle!)
const BG_TARGET_VOLUME = 0.012; // <- WIRKLICH leise (0.008–0.02 ist sinnvoll)
const BG_FADE_MS = 6000;

let situation1Running = false;

// --- Typewriter: Absatz (stabil + keine Sprünge) ---
async function typeParagraph(el, text, speed = 22) {
  if (!el) return;

  // Wichtig: Text hat feste \n => Zeilenumbruch stabil
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await wait(speed);
  }
}

// --- Typewriter: Liste (keine riesigen Abstände; CSS regelt li margin) ---
async function typeList(listEl, items, speed = 18) {
  if (!listEl) return;

  listEl.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = "";
    listEl.appendChild(li);

    for (let i = 0; i < item.length; i++) {
      li.textContent += item[i];
      await wait(speed);
    }
    await wait(250);
  }
}

// --- Musik Fade-In (wirklich leise) ---
function fadeInBgMusic(targetVolume = BG_TARGET_VOLUME, durationMs = BG_FADE_MS) {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  // Sofort hart begrenzen
  targetVolume = Math.max(0, Math.min(0.03, targetVolume)); // nie über 0.03

  bg.volume = 0;

  // iPhone/Safari: play nur nach User-Klick erlaubt
  bg.play().then(() => {
    const steps = 60;
    const stepTime = Math.max(50, Math.floor(durationMs / steps));
    let v = 0;
    const inc = targetVolume / steps;

    const timer = setInterval(() => {
      v += inc;
      bg.volume = Math.min(targetVolume, v);
      if (bg.volume >= targetVolume) clearInterval(timer);
    }, stepTime);
  }).catch(() => {
    // Wenn Safari blockt, passiert hier nichts.
    // User müsste ggf. nochmal tippen.
  });
}

function stopSongIfPlaying() {
  const song = document.getElementById("songPlayer");
  if (!song) return;
  song.pause();
  song.currentTime = 0;
}

function showBlock(id) {
  const b = document.getElementById(id);
  if (!b) return;
  b.classList.remove("hidden");
  // reflow
  void b.offsetWidth;
  b.classList.add("show");
}

async function startSituation1() {
  if (situation1Running) return;
  situation1Running = true;

  try {
    // Song stoppen falls er lief
    stopSongIfPlaying();

    // Hintergrundmusik sehr leise starten
    fadeInBgMusic(BG_TARGET_VOLUME, BG_FADE_MS);

    // Texte: mit festen Zeilenumbrüchen => kein Springen
    const textAnkommen =
      "Du bist hier.\n" +
      "Du darfst ruhig werden.";

    const textErklaerung =
      "Innere Unruhe ist oft ein Zeichen.\n" +
      "Dein Nervensystem sucht Sicherheit.\n" +
      "Dein Körper lädt dich ein,\n" +
      "Tempo herauszunehmen\n" +
      "und wieder im Moment anzukommen.";

    const affirmationen = [
      "Ich bin sicher.",
      "Ich bin ganz.",
      "Ich bin gehalten in mir."
    ];

    const ritual = [
      "Drei tiefe Atemzüge.",
      "Einatmen – ruhig und weich.",
      "Ausatmen – etwas länger.",
      "Schultern sinken lassen.",
      "Boden unter dir spüren."
    ];

    // Block 1
    showBlock("b1");
    await typeParagraph(document.getElementById("lineAnkommen"), textAnkommen, 20);
    await wait(900);

    // Block 2
    showBlock("b2");
    await typeParagraph(document.getElementById("lineErklaerung"), textErklaerung, 18);
    await wait(1200);

    // Block 3
    showBlock("b3");
    await typeList(document.getElementById("lineAffirmationen"), affirmationen, 18);
    await wait(800);

    // Block 4
    showBlock("b4");
    await typeList(document.getElementById("lineRitual"), ritual, 18);
    await wait(700);

    // Block 5
    showBlock("b5");

  } finally {
    situation1Running = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Impuls Button
  const btnImpuls = document.getElementById("btnImpuls");
  const impulsEl = document.getElementById("impuls");
  if (btnImpuls && impulsEl) {
    btnImpuls.addEventListener("click", () => {
      impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    });
  }

  // Start Situation 1
  const btnSituation1 = document.getElementById("btnSituation1");
  if (btnSituation1) {
    btnSituation1.addEventListener("click", startSituation1);
  }

  // Song Button (bewusst per Klick)
  const btnSong = document.getElementById("btnSong");
  const song = document.getElementById("songPlayer");
  const bg = document.getElementById("bgMusic");

  if (btnSong && song) {
    btnSong.addEventListener("click", () => {
      // Wenn Song startet: Hintergrundmusik noch leiser (optional, aber angenehm)
      if (bg) bg.volume = Math.min(bg.volume, 0.006);

      song.currentTime = 0;
      song.play().catch(() => {});
    });

    // Wenn Song endet: Hintergrundmusik wieder auf Ziel-Lautstärke
    song.addEventListener("ended", () => {
      if (bg) bg.volume = BG_TARGET_VOLUME;
    });
    song.addEventListener("pause", () => {
      // Nur zurückstellen, wenn nicht komplett gestoppt
      if (bg) bg.volume = BG_TARGET_VOLUME;
    });
  }

  // Extra Sicherheit: Background-Musik beim Laden schon leise setzen
  const bgMusic = document.getElementById("bgMusic");
  if (bgMusic) bgMusic.volume = 0;
});
