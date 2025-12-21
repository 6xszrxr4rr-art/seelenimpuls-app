const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Kleine Impulse oben
const impulse = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

function neuerImpuls() {
  const el = document.getElementById("impuls");
  if (!el) return;
  el.innerText = impulse[Math.floor(Math.random() * impulse.length)];
}

// ---------- Reveal / Typewriter ----------
function typeText(el, text, speed = 36) {
  return new Promise((resolve) => {
    if (!el) return resolve();

    el.innerHTML = "";   // korrekt
    let i = 0;

    function tick() {
      const ch = text.charAt(i);

      if (ch === "\n") {
        el.innerHTML += "<br>";
      } else {
        el.innerHTML += ch;   // ← DAS ist der wichtige Unterschied
      }

      i++;
      if (i < text.length) {
        setTimeout(tick, speed);
      } else {
        resolve();
      }
    }

    tick();
  });
}
// Erklärungstext mit bewussten Zeilenumbrüchen
const textErklaerung =
  "Innere Unruhe ist ein Zeichen.\n" +
  "Dein Nervensystem sucht Sicherheit.\n" +
  "Dein Körper lädt dich ein,\n" +
  "Tempo herauszunehmen\n" +
  "und wieder im Moment anzukommen.";
function fadeInBgMusic(targetVolume = 0.004, durationMs = 6000) {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  bg.volume = 0; // Start wirklich ganz leise

  // iPhone/Safari: Audio erst nach USER-KLICK erlaubt
  bg.play().then(() => {
    const steps = 60; // mehr Steps = weicher
    const stepTime = Math.max(50, Math.floor(durationMs / steps));
    let v = 0;
    const inc = targetVolume / steps;

    const timer = setInterval(() => {
      v += inc;
      bg.volume = Math.min(targetVolume, v);
      if (bg.volume >= targetVolume) clearInterval(timer);
    }, stepTime);
  }).catch(() => {
    // Wenn Safari blockt: dann passiert hier nichts (User müsste nochmal tippen)
  });
}

function stopSongIfPlaying() {
  const song = document.getElementById("songPlayer");
  if (!song) return;
  song.pause();
  song.currentTime = 0;
}

async function startSituation1() {
  if (situation1Running) return;
  situation1Running = true;

  try {
    const content = document.getElementById("content");
    if (!content) return;

    content.classList.remove("hidden");

    stopSongIfPlaying();

    fadeInBgMusic(0.035, 3500);

    await typeText(document.getElementById("lineAnkommen"),
      "Du bist hier. Du darfst ruhig werden.", 30);
    await wait(1200);

    await typeText(document.getElementById("lineErklaerung"),
      textErklaerung, 32);
    await wait(6500); // <- HIER mehr Pause nach Erklärung (statt 3500)

    await typeText(document.getElementById("lineAffirmationen"),
      "• Ich bin sicher.\n• Ich bin ganz.\n• Ich bin gehalten in mir.", 30);
    await wait(4000); // <- mehr Pause nach Affirmationen (statt 2500)

    await typeText(document.getElementById("lineRitual"),
      "1) Drei tiefe Atemzüge.\n2) Einatmen – ruhig und weich.\n3) Ausatmen – etwas länger.\n4) Schultern sinken lassen.\n5) Boden unter dir spüren.", 30);
    await wait(2500);

  } finally {
    situation1Running = false; // <- DAS ist C (aber “safe”)
  }
}

  // Button für Song aktivieren
  const btnSong = document.getElementById("btnSong");
  if (btnSong) {
    btnSong.onclick = () => {
      const song = document.getElementById("songPlayer");
      if (!song) return;
      song.currentTime = 0;
      song.play().catch(() => {});
    };
  }
}

// Wiring
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnSituation1");
  if (btn) btn.addEventListener("click", startSituation1);
});
