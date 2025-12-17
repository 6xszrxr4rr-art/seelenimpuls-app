const impulse = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

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

function startBgMusicSoft() {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;
  bg.volume = 0.12; // deutlich leiser Start
  bg.play().catch(() => {
    // iPhone kann trotzdem blocken – dann startet es erst, wenn User nochmal tippt
  });
}

function neuerImpuls() {
  // Impuls wechseln
  const box = document.getElementById("impuls");
  if (box) box.innerText = impulse[Math.floor(Math.random() * impulse.length)];

  // Schritte reset
  hideAllSteps();

  // Gesungene Affirmation stoppen (falls lief)
  const vocal = document.getElementById("audioPlayer");
  if (vocal) { vocal.pause(); vocal.currentTime = 0; }

  // Flow (langsam einblenden)
  showStep(1);
  setTimeout(() => showStep(2), 1400);
  setTimeout(() => showStep(3), 3600);
  setTimeout(() => showStep(4), 6000);
  setTimeout(() => { showStep(5); startBgMusicSoft(); }, 8600);
}

document.addEventListener("DOMContentLoaded", () => {
  hideAllSteps();

  const btn = document.getElementById("btnImpuls");
  if (btn) btn.addEventListener("click", neuerImpuls);

  const btnVocal = document.getElementById("btnVocal");
  if (btnVocal) {
    btnVocal.addEventListener("click", () => {
      const player = document.getElementById("audioPlayer");
      if (!player) return;
      player.currentTime = 0;
      player.play().catch(() => {});
    });
  }
});
