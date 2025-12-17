const impulse = [
  "Atme tief ein. Du musst heute nicht alles halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein."
];

// Texte (ohne Verneinungen)
const step1Text = "Du bist sicher.\nDu bist hier.";
const step2Text =
  "Wenn Gedanken laut werden und dein Inneres keinen Halt findet, ist das kein Fehler.\n" +
  "Dein Körper sucht nach Sicherheit.\n" +
  "Du darfst langsamer werden.";

const affirmations = [
  "Ich bin sicher.",
  "Ich bin ganz.",
  "Ich bin gehalten in mir."
];

const ritualText =
  "Nimm drei tiefe Atemzüge.\n" +
  "Atme ruhig ein – atme länger aus.\n" +
  "Lass die Schultern sinken.\n" +
  "Spüre den Boden unter dir.";

// Typing-Settings (langsamer = größerer Wert)
const CHAR_DELAY = 28;      // Zeichenweise (ms)
const LINE_PAUSE = 420;     // Pause nach jeder Zeile (ms)
const STEP_PAUSE = 900;     // Pause nach jedem Block (ms)

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function hideAllSteps() {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("step" + i);
    if (el) el.classList.remove("show");
  }
}

// Safteres Einblenden (ohne "ruck" von translate)
function showStep(n) {
  const el = document.getElementById("step" + n);
  if (el) el.classList.add("show");
}

// Typewriter: schreibt Text zeilenweise/zeichenweise in ein Element
async function typeInto(el, text) {
  if (!el) return;
  el.innerHTML = "";

  const lines = text.split("\n");
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    const lineEl = document.createElement("div");
    el.appendChild(lineEl);

    for (let i = 0; i < line.length; i++) {
      lineEl.textContent += line[i];
      await sleep(CHAR_DELAY);
    }
    await sleep(LINE_PAUSE);
  }
}

// Bullet-Typewriter (Affirmationen)
async function typeBullets(el, items) {
  if (!el) return;
  el.innerHTML = "";
  const ul = document.createElement("ul");
  el.appendChild(ul);

  for (const item of items) {
    const li = document.createElement("li");
    ul.appendChild(li);
    for (let i = 0; i < item.length; i++) {
      li.textContent += item[i];
      await sleep(CHAR_DELAY);
    }
    await sleep(LINE_PAUSE);
  }
}

// Hintergrundmusik: sofort im Klick starten (muted), später weich einblenden
function primeBgMusic() {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  bg.muted = true;     // Autoplay-Hack für iOS
  bg.volume = 0.0;

  // WICHTIG: play() direkt im Klick-Kontext
  bg.play().catch(() => {});
}

async function fadeInBgMusic(target = 0.12, durationMs = 6000) {
  const bg = document.getElementById("bgMusic");
  if (!bg) return;

  // jetzt hörbar machen
  bg.muted = false;

  const steps = 30;
  const stepMs = Math.floor(durationMs / steps);
  for (let i = 1; i <= steps; i++) {
    bg.volume = (target * i) / steps;
    await sleep(stepMs);
  }
}

function stopVocal() {
  const vocal = document.getElementById("audioPlayer");
  if (vocal) {
    vocal.pause();
    vocal.currentTime = 0;
  }
}

async function neuerImpuls() {
  // Impuls wechseln
  const box = document.getElementById("impuls");
  if (box) box.innerText = impulse[Math.floor(Math.random() * impulse.length)];

  // Reset UI
  hideAllSteps();
  stopVocal();

  // Hintergrundmusik sofort "primen"
  primeBgMusic();

  // Inhalte tippen lassen – langsam & nacheinander
  showStep(1);
  await typeInto(document.getElementById("step1Text"), step1Text);
  await sleep(STEP_PAUSE);

  showStep(2);
  await typeInto(document.getElementById("step2Text"), step2Text);
  await sleep(STEP_PAUSE);

  showStep(3);
  await typeBullets(document.getElementById("step3Text"), affirmations);
  await sleep(STEP_PAUSE);

  showStep(4);
  await typeInto(document.getElementById("step4Text"), ritualText);
  await sleep(STEP_PAUSE);

  showStep(5);
  await fadeInBgMusic(0.12, 6500); // sanft einblenden
}

document.addEventListener("DOMContentLoaded", () => {
  hideAllSteps();

  const btn = document.getElementById("btnImpuls");
  if (btn) btn.addEventListener("click", () => {
    // async sicher starten
    neuerImpuls();
  });

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
