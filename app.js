// Kleine Helfer
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function show(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("show");
}

const impulse = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

function neuerImpuls() {
  // Impuls wechseln
  const imp = document.getElementById("impuls");
  if (imp) imp.innerText = impulse[Math.floor(Math.random() * impulse.length)];

  // Sequence starten (nach Button-Klick = erlaubt auf iPhone)
  startSequence();
}

async function startSequence() {
  // Hintergrundmusik: leiser Start + sanftes Fade
  const bg = document.getElementById("bgMusic");
  if (bg) {
    try {
      bg.pause();
      bg.currentTime = 0;
      bg.volume = 0.08;        // START sehr leise
      await bg.play();         // klappt nur nach Interaktion (Button)
      // Fade-in auf angenehm leise
      let v = 0.08;
      const target = 0.16;     // <- hier die Ziel-Lautstärke (sehr leise)
      for (let i = 0; i < 16; i++) {
        v += (target - 0.08) / 16;
        bg.volume = Math.max(0, Math.min(1, v));
        await sleep(160);
      }
    } catch (e) {
      // Falls iPhone blockt: erst nach erstem Button-Klick klappt es meistens.
    }
  }

  // Alles, was schrittweise erscheinen soll, erstmal verstecken
  const ids = [
    "step-explain",
    "step-aff-title", "step-aff-list",
    "step-rit-title", "step-ritual",
    "step-music-title", "step-music-text",
    "step-vocal"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add("hidden"); el.classList.remove("show"); }
  });

  // Jetzt langsam einblenden – mit genug Zeit zum Lesen
  await sleep(600);
  show("step-explain");
  await sleep(4200);

  show("step-aff-title");
  await sleep(300);
  show("step-aff-list");
  await sleep(4200);

  show("step-rit-title");
  await sleep(300);
  show("step-ritual");
  await sleep(5200);

  show("step-music-title");
  await sleep(250);
  show("step-music-text");
  await sleep(900);

  show("step-vocal");
}

// Gesungene Affirmation nur auf Knopfdruck starten
document.addEventListener("DOMContentLoaded", () => {
  const btnVocal = document.getElementById("btnVocal");
  if (btnVocal) {
    btnVocal.addEventListener("click", () => {
      const audio = document.getElementById("audioPlayer");
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });
  }
});
