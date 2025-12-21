// app.js (komplett ersetzen)

// Helper
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Impulse
const impulses = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

// Musik: noch einen Tick leiser
const BG_TARGET_VOLUME = 0.010; // <- noch leiser als vorher
const BG_FADE_MS = 7000;

// Typewriter: etwas langsamer
const TYPE_SPEED_PARA = 26;     // war schneller -> jetzt langsamer
const TYPE_SPEED_LIST = 24;     // Listen auch langsamer

// Pausen: Zeit zum Lesen + Zeit zum „Machen“
const PAUSE_AFTER_BLOCK_1 = 2800;
const PAUSE_AFTER_BLOCK_2 = 4200;
const PAUSE_AFTER_AFFIRMATIONS = 5200; // Zeit zum Nachspüren
const PAUSE_AFTER_RITUAL = 9000;       // Zeit, um Atemzüge etc. ansatzweise zu machen

let situation1Running = false;

// Absatz tippen (stabil, keine Sprünge)
async function typeParagraph(el, text, speed = TYPE_SPEED_PARA) {
  if (!el) return;
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await wait(speed);
  }
}

// Liste tippen
async function typeList(listEl, items, speed = TYPE_SPEED_LIST) {
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
    await wait(600); // kleine Pause zwischen Listeneinträgen
  }
}

// Musik Fade-In (wirklich leise)
function fadeInBgMusic(targetVolume = BG_TARGET_VOLUME, durationMs = BG_FADE_MS) {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  targetVolume = Math.max(0, Math.min(0.03, targetVolume));
  bg.volume = 0;

  bg.play().then(() => {
    const steps = 70;
    const stepTime = Math.max(60, Math.floor(durationMs / steps));
    let v = 0;
    const inc = targetVolume / steps;

    const timer = setInterval(() => {
      v += inc;
      bg.volume = Math.min(targetVolume, v);
      if (bg.volume >= targetVolume) clearInterval(timer);
    }, stepTime);
  }).catch(() => {});
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
  void b.offsetWidth; // reflow
  b.classList.add("show");
}

async function startSituation1() {
  if (situation1Running) return;
  situation1Running = true;

  try {
    stopSongIfPlaying();
    fadeInBgMusic(BG_TARGET_VOLUME, BG_FADE_MS);

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
    await typeParagraph(document.getElementById("lineAnkommen"), textAnkommen);
    await wait(PAUSE_AFTER_BLOCK_1);

    // Block 2
    showBlock("b2");
    await typeParagraph(document.getElementById("lineErklaerung"), textErklaerung);
    await wait(PAUSE_AFTER_BLOCK_2);

    // Block 3
    showBlock("b3");
    await typeList(document.getElementById("lineAffirmationen"), affirmationen);
    await wait(PAUSE_AFTER_AFFIRMATIONS);

    // Block 4
    showBlock("b4");
    await typeList(document.getElementById("lineRitual"), ritual);
    await wait(PAUSE_AFTER_RITUAL);

    // Block 5
    showBlock("b5");

  } finally {
    situation1Running = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Impuls
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

  // Song Button
  const btnSong = document.getElementById("btnSong");
  const song = document.getElementById("songPlayer");
  const bg = document.getElementById("bgMusic");

  if (btnSong && song) {
    btnSong.addEventListener("click", () => {
      if (bg) bg.volume = Math.min(bg.volume, 0.006);
      song.currentTime = 0;
      song.play().catch(() => {});
    });

    song.addEventListener("ended", () => {
      if (bg) bg.volume = BG_TARGET_VOLUME;
    });
    song.addEventListener("pause", () => {
      if (bg) bg.volume = BG_TARGET_VOLUME;
    });
  }

  // Sicherheit: Start leise
  const bgMusic = document.getElementById("bgMusic");
  if (bgMusic) bgMusic.volume = 0;
});
