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
const BETWEEN_BLOCKS_MS = 15000;   // 15 Sekunden Pause nach jedem Block
const AFTER_RITUAL_MS = 25000;    // 25 Sekunden Zeit für Ritual

// Musik
const BG_TARGET_GAIN = 0.003;   // EXTREM leise (noch leiser: 0.001
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

/* ---------- Audio helpers (iOS-safe via WebAudio Gain) ---------- */

let audioCtx = null;
let bgGain = null;
let bgSource = null;

function ensureAudioGraph() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const bg = $("bgMusic");
ensureAudioGraph();
if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  if (!bg) return;

  bgSource = audioCtx.createMediaElementSource(bg);
  bgGain = audioCtx.createGain();
  bgGain.gain.value = 0; // startet stumm

  bgSource.connect(bgGain);
  bgGain.connect(audioCtx.destination);
}

function fadeGainTo(target, durationMs) {
  if (!bgGain || !audioCtx) return;
  const now = audioCtx.currentTime;
  const dur = Math.max(0.05, durationMs / 1000);
  bgGain.gain.cancelScheduledValues(now);
  bgGain.gain.setValueAtTime(bgGain.gain.value, now);
  bgGain.gain.linearRampToValueAtTime(target, now + dur);
}

let bgStopTimer = null;

function startBgMusic(){
  const bg = $("bgMusic");
  if (!bg) return;

  // Reset
  bg.pause();
  bg.currentTime = 0;
  bg.loop = false;           // soll enden (nicht endlos)
  bg.volume = 0.0001;   // HARD LIMIT – sehr sehr leise

  // Safari/iPhone: Play nur nach User-Klick möglich – wir sind im Klick
  bg.play().then(() => {
    fadeGainTo(BG_TARGET_GAIN, BG_FADE_MS);

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
  if (fade) {
  fadeGainTo(0, 900);
  setTimeout(() => { bg.pause(); }, 950);
} else {
  fadeGainTo(0, 50);
  bg.pause();
}

function stopSong(){
  const song = document.getElementById("songPlayer");
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
window.addEventListener("DOMContentLoaded", () => {
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
  setTimeout(() => stopBgMusic(true), 30000); // 30 Sek. nachklingen
});

$("btnSong").addEventListener("click", async () => {
  // 1) Hintergrundmusik sofort stoppen (nicht nur fade)
  stopBgMusic(false);

  const song = document.getElementById("songPlayer");
  if (!song) return;

  try{
    // iOS: einmal "resetten", dann play
    song.pause();
    song.currentTime = 0;
    song.volume = 1.0;

    await song.play();
  }catch(e){
    // Wenn iOS trotzdem blockt: kleiner Trick -> einmal kurz stumm starten, dann normal
    try{
      song.muted = true;
      await song.play();
      song.muted = false;
    }catch(_){}
  }
});

/* Song-Ende: optional BG nicht wieder starten (bewusst ruhig) */
$("songPlayer").addEventListener("ended", () => {
  // nichts – bewusst Stille danach
});
