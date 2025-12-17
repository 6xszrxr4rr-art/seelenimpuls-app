// --- Zufalls-Impulse oben ---
const impulse = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

// --- Helper: Schritte ein/ausblenden ---
function hideAllSteps() {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("step" + i);
    if (el) el.classList.remove("show");
  }
}

function showStep(n) {
  const el = document.getElementById("step" + n);
  if (el) el.classList.add("show");
}

// --- Musik-Helper ---
function stopAudio(id) {
  const a = document.getElementById(id);
  if (!a) return;
  a.pause();
  a.currentTime = 0;
}

function startBackgroundMusicSoft() {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  // leise starten
  bg.volume = 0.15;

  // iPhone/Safari: Autoplay klappt nur nach User-Interaktion (Buttonklick).
  // Wir starten es nach dem Klick per play().
  bg.play().catch(() => {
    // Wenn es blockt, ist das ok – dann kann man später manuell starten
    // (aber meist klappt es nach Button-Klick).
  });
}

// --- Hauptablauf: sanft nacheinander einblenden ---
function startSituationFlow() {
  // Reset
  hideAllSteps();
  stopAudio("audioPlayer"); // gesungene Affirmation stoppen (falls lief)

  // Hintergrundmusik NICHT sofort beim Laden, sondern erst im Flow (nach Klick)
  // und erst am Ende, damit es wirklich sanft wirkt:
  // (Wenn du sie lieber direkt ab Schritt 1 willst, sag kurz Bescheid.)
  const delays = [0, 1200, 3500, 5600, 8200]; // ms: Schritt 1..5

  setTimeout(() => showStep(1), delays[0]);     // Ankommen
  setTimeout(() => showStep(2), delays[1]);     // Erklärung
  setTimeout(() => showStep(3), delays[2]);     // Affirmationen
  setTimeout(() => showStep(4), delays[3]);     // Ritual
  setTimeout(() => {
    showStep(5);                                // Musik anzeigen
    startBackgroundMusicSoft();                 // Hintergrundmusik starten (leise)
  }, delays[4]);
}

// --- Button "Neuen Impuls ziehen" ---
function neuerImpuls() {
  // Text oben wechseln
  const box = document.getElementById("impuls");
  if (box) {
    box.innerText = impulse[Math.floor(Math.random() * impulse.length)];
  }

  // Flow starten (das ist dein "langsam einblenden")
  startSituationFlow();
}

// --- Initialisierung ---
document.addEventListener("DOMContentLoaded", () => {
  hideAllSteps();

  const btn = document.getElementById("btnImpuls");
  if (btn) {
    btn.addEventListener("click", () => {
      neuerImpuls();
    });
  }

  // Gesungene Affirmation: nur auf Button-Klick
  const btnVocal = document.getElementById("btnVocal");
  if (btnVocal) {
    btnVocal.addEventListener("click", () => {
      const player = document.getElementById("audioPlayer");
      if (!player) return;

      player.currentTime = 0;
      player.play().catch(() => {
        // falls iPhone noch blockt: User kann im Player auf Play tippen
      });
    });
  }
});
