// Seelenimpuls – app.js (komplett)

// Hintergrundmusik sicher starten (nur nach User-Klick erlaubt – iPhone/Safari)
function startBackgroundMusic() {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  // nur starten, wenn sie noch nicht läuft
  if (bg.paused) {
    bg.volume = 0.6; // sanfter Start
    bg.play().catch(() => {
      // iPhone kann trotzdem blocken, wenn der Klick nicht "zählt"
      // dann muss der User einmal Play tippen (kommt selten vor)
    });
  }
}

// Texte für Button "Neuen Impuls ziehen"
const impulse = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

const affirmationen = [
  "Ich bin sicher.",
  "Ich bin geführt.",
  "Ich vertraue mir."
];

// Wird vom Button in index.html aufgerufen: onclick="neuerImpuls()"
function neuerImpuls() {
  // 1) Hintergrundmusik starten (User-Klick)
  startBackgroundMusic();

  // 2) Impuls wechseln
  const imp = document.getElementById("impuls");
  if (imp) {
    imp.innerText = impulse[Math.floor(Math.random() * impulse.length)];
  }

  // 3) Affirmation wechseln
  const aff = document.getElementById("affirmation");
  if (aff) {
    aff.innerText =
      affirmationen[Math.floor(Math.random() * affirmationen.length)];
  }

  // 4) Gesungene Affirmation (Situation-Song) starten
  const audio = document.getElementById("audioPlayer");
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Falls Safari blockt: User kann Play im Player tippen
    });
  }
}
