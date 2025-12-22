/* =========================
   Seelenimpuls – app.js
   Stabil: kein „Springen“, keine Dopplungen,
   leise BG-Musik, stoppt bei Song, endet automatisch.
   ========================= */

const impulses = [
  "Atme tief ein. Du musst heute nichts halten.",
  "Du darfst langsam sein.",
  "Dein Herz kennt den Weg.",
  "Alles darf leicht sein.",
  "Du musst nicht kämpfen, um sicher zu sein."
];

// Typing / Pausen
const CHAR_DELAY_MS = 65;          // etwas langsamer
const BETWEEN_BLOCKS_MS = 3800;    // Pause zum Lesen/Umsetzen
const AFTER_RITUAL_MS = 6500;      // extra Zeit nach Mini-Ritual

// Musik
// Musik
const BG_TARGET_VOLUME = 0.007;   // leiser (vorher war’s zu laut)
const BG_FADE_MS       = 2200;    // weicher/ruhiger Fade (länger)
const BG_MAX_PLAY_MS   = 120000;  // max 2 Minuten laufen lassen
let runId = 0; // schützt vor Doppelstarts

function $(id){ return document.getElementById(id); }
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function show(id){
  const el = $(id);
  if (!el) return;
  el.classList.remove("hidden");
}

function clearAllBlocks(){
  ["b1","b2","b3","b4","b5"].forEach(id => {
    const el = $(id);
    if (el) el.classList.add("hidden");
  });
  $("t1").textContent = "";
  $("t2").textContent = "";
  $("t3").innerHTML = "";
  $("t4").innerHTML = "";
  $("endVisual").classList.remove("on");
  $("drops").innerHTML = "";
}

async function typeText(el, text, myRun){
  el.textContent = "";
  for (let i=0; i<text.length; i++){
    if (myRun !== runId) return;
    el.textContent += text[i];
    await sleep(CHAR_DELAY_MS);
  }
}

async function typeList(ul, items, myRun){
  ul.innerHTML = "";
  for (const item of items){
    if (myRun !== runId) return;
    const li = document.createElement("li");
    ul.appendChild(li);
    for (let i=0; i<item.length; i++){
      if (myRun !== runId) return;
      li.textContent += item[i];
      await sleep(CHAR_DELAY_MS);
    }
    await sleep(420);
  }
}

/* ---------- Audio helpers ---------- */
function fadeTo(audio, target, durationMs){
  if (!audio) return;
  const start = audio.volume || 0;
  const steps = 30;
  const stepTime = Math.max(30, Math.floor(durationMs / steps));
  let n = 0;

  const timer = setInterval(() => {
    n++;
    const v = start + (target - start) * (n / steps);
    audio.volume = Math.max(0, Math.min(1, v));
    if (n >= steps) clearInterval(timer);
  }, stepTime);
}

let bgStopTimer = null;

function startBgMusic(){
  const bg = $("bgMusic");
  if (!bg) return;

  // Reset
  bg.pause();
  bg.currentTime = 0;
  bg.loop = false;           // soll enden (nicht endlos)
  bg.volume = 0;             // starte wirklich leise

  // Safari/iPhone: Play nur nach User-Klick möglich – wir sind im Klick
  bg.play().then(() => {
    fadeTo(bg, BG_TARGET_VOLUME, BG_FADE_MS);

    // nach X ms automatisch aus
    if (bgStopTimer) clearTimeout(bgStopTimer);
    bgStopTimer = setTimeout(() => stopBgMusic(true), BG_MAX_PLAY_MS);
  }).catch(() => {
    // wenn Safari blockt: passiert einfach nichts
  });
}

function stopBgMusic(fade){
  const bg = $("bgMusic");
  if (!bg) return;

  if (bgStopTimer) clearTimeout(bgStopTimer);
  bgStopTimer = null;

  if (!fade){
    bg.pause();
    return;
  }
  fadeTo(bg, 0, 900);
  setTimeout(() => {
    bg.pause();
  }, 950);
}

function stopSong(){
  const song = $("songPlayer");
  if (!song) return;
  song.pause();
  song.currentTime = 0;
}

/* ---------- End visuals ---------- */
function showEndVisual(){
  const box = $("endVisual");
  const drops = $("drops");
  if (!box || !drops) return;

  box.classList.add("on");
  drops.innerHTML = "";

  // „tanzende Regentropfen“
  const count = 18;
  for (let i=0; i<count; i++){
    const d = document.createElement("div");
    d.className = "drop";
    d.style.left = (Math.random()*100).toFixed(2) + "%";
    d.style.animationDuration = (2.6 + Math.random()*2.6).toFixed(2) + "s";
    d.style.animationDelay = (Math.random()*1.8).toFixed(2) + "s";
    d.style.opacity = (0.25 + Math.random()*0.55).toFixed(2);
    d.style.height = (18 + Math.random()*30).toFixed(0) + "%";
    drops.appendChild(d);
  }
}

/* ---------- UI wiring ---------- */
$("btnImpuls").addEventListener("click", () => {
  const el = $("impuls");
  el.textContent = impulses[Math.floor(Math.random()*impulses.length)];
});

$("btnSituation1").addEventListener("click", async () => {
  runId++;               // stoppt evtl. laufende Sequenzen
  const myRun = runId;

  clearAllBlocks();
  stopSong();            // falls Song noch läuft
  startBgMusic();        // BG startet leise

  const ankommen =
    "Du bist hier.\n" +
    "Du darfst jetzt langsamer werden.";

  const erklaerung =
    "Innere Unruhe ist oft ein wertvoller Hinweis deines Unterbewusstseins.\n" +
    "Dein Nervensystem sucht Sicherheit.\n" +
    "Dein Körper lädt dich ein, Tempo herauszunehmen\n" +
    "und wieder im Moment anzukommen.";

  const affirmationen = [
    "Ich bin sicher.",
    "Ich bin ganz.",
    "Ich bin gehalten in mir."
  ];

  const ritual = [
    "Nimm dir einen Moment nur für dich.",
    "Atme ruhig und gleichmäßig ein.",
    "Atme etwas länger aus.",
    "Lass deine Schultern sinken.",
    "Nimm den Boden unter deinen Füßen wahr.",
    "Spüre, wie Ruhe und Harmonie dich durchströmen."
  ];

  // Block 1
  show("b1");
  await typeText($("t1"), ankommen, myRun);
  await sleep(BETWEEN_BLOCKS_MS);

  // Block 2
  show("b2");
  await typeText($("t2"), erklaerung, myRun);
  await sleep(BETWEEN_BLOCKS_MS);

  // Block 3
  show("b3");
  await typeList($("t3"), affirmationen, myRun);
  await sleep(BETWEEN_BLOCKS_MS);

  // Block 4 (Ritual) + extra Zeit
  show("b4");
  await typeList($("t4"), ritual, myRun);
  await sleep(AFTER_RITUAL_MS);

  // Block 5
  show("b5");

  // Danach: visuelle Ruhefläche + BG langsam beenden
  showEndVisual();
  // BG darf noch kurz laufen, dann endet es
  setTimeout(() => stopBgMusic(true), 30000); // 30 Sekunden nachklingen lassen
});

$("btnSong").addEventListener("click", () => {
  // Beim Song: Hintergrundmusik aus, Song an
  stopBgMusic(true);

  const song = $("songPlayer");
  if (!song) return;

  song.currentTime = 0;
  song.volume = 1.0;
  song.play().catch(() => {});
});

/* Song-Ende: optional BG nicht wieder starten (bewusst ruhig) */
$("songPlayer").addEventListener("ended", () => {
  // nichts – bewusst Stille danach
});
