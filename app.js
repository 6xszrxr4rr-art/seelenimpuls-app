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

// Hintergrundmusik: noch leiser + endet automatisch
const BG_TARGET_VOLUME = 0.007;     // <- sehr leise (noch leiser als vorher)
const BG_FADE_IN_MS = 6000;
const BG_FADE_OUT_MS = 5000;
const BG_MAX_PLAY_MS = 120000;      // <- 2 Minuten laufen lassen, dann ausfaden + stoppen

// Typewriter: Tick langsamer
const TYPE_SPEED_PARA = 30;
const TYPE_SPEED_LIST = 28;

// Pausen (damit man wirklich Zeit hat)
const PAUSE_AFTER_BLOCK_1 = 3200;
const PAUSE_AFTER_BLOCK_2 = 5200;
const PAUSE_AFTER_AFFIRMATIONS = 6500;
const PAUSE_AFTER_RITUAL = 12000;   // Zeit für Atemzüge etc.

let situation1Running = false;
let bgAutoStopTimer = null;

// ---------- Audio helpers ----------
function clearBgTimer(){
  if (bgAutoStopTimer) {
    clearTimeout(bgAutoStopTimer);
    bgAutoStopTimer = null;
  }
}

function fadeVolume(audio, to, durationMs){
  if (!audio) return Promise.resolve();
  to = Math.max(0, Math.min(1, to));
  const from = audio.volume ?? 0;
  const steps = 60;
  const stepTime = Math.max(40, Math.floor(durationMs / steps));
  const delta = (to - from) / steps;

  return new Promise((resolve) => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      audio.volume = Math.max(0, Math.min(1, (audio.volume ?? from) + delta));
      if (i >= steps) {
        audio.volume = to;
        clearInterval(timer);
        resolve();
      }
    }, stepTime);
  });
}

async function startBgMusic(){
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  clearBgTimer();

  // Start wirklich leise
  bg.volume = 0;

  try {
    await bg.play();
  } catch {
    return; // Safari blockt ggf. – dann passiert nichts
  }

  await fadeVolume(bg, BG_TARGET_VOLUME, BG_FADE_IN_MS);

  // Automatisch nach BG_MAX_PLAY_MS ausfaden & stoppen
  bgAutoStopTimer = setTimeout(async () => {
    await stopBgMusic(true);
  }, BG_MAX_PLAY_MS);
}

async function stopBgMusic(withFade = true){
  const bg = document.getElementById("bgMusic");
  if (!bg
