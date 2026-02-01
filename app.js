// app.js (Controller) – nutzt Situationen aus /situations/situation-1.js ... situation-9.js

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- Scroll / Follow (1:1 wie deine aktuelle App) ----------
  let lastScrollTs = 0;
  let lockScroll = false;

  function followWhileTyping(cursorEl){
    if (!cursorEl || lockScroll) return;

    const now = performance.now();
    if (now - lastScrollTs < 80) return;
    lastScrollTs = now;

    const r = cursorEl.getBoundingClientRect();
    const fixedY = window.innerHeight * 0.72;
    const cursorY = r.top + (r.height * 0.6);
    const diff = cursorY - fixedY;

    if (diff > 0) {
      window.scrollBy({ top: Math.min(14, diff), behavior: "auto" });
    }
  }

  function show(id){
    const el = $(id);
    if (!el) return;
    el.classList.remove("hidden");
  }

  function snapToTop(id){
    const el = $(id);
    if (!el) return;
    const y = window.scrollY + el.getBoundingClientRect().top - 12;
    window.scrollTo({ top: y, behavior: "auto" });
  }
function glideToTop(id, durationMs = 900){
  const el = $(id);
  if (!el) return;

  const startY = window.scrollY;
  const targetY = startY + el.getBoundingClientRect().top - 12;
  const delta = targetY - startY;

  const start = performance.now();

  function easeInOut(t){
    return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
  }

  function tick(now){
    const p = Math.min(1, (now - start) / durationMs);
    window.scrollTo({ top: startY + delta * easeInOut(p), behavior: "auto" });
    if (p < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
  
  function clearAllBlocks(){
    lockScroll = false;
    ["b1","b2","b3","b4","b5"].forEach(id => {
  const el = $(id);
  if (el) el.classList.add("hidden");
});
showChooser();

    if ($("t1")) $("t1").innerHTML = "";
    if ($("t2")) $("t2").innerHTML = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
  }

  function hideChooser(){
  const chooseCard = $("chooseCard");
  const hintCard = $("chooseHintCard");
  const list = $("situationsList");
  const backWrap = $("backWrap");
  if (hintCard) hintCard.classList.add("hidden");
  if (list) list.classList.add("hidden");
  if (backWrap) backWrap.classList.remove("hidden");
}

function showChooser(){
  const hintCard = $("chooseHintCard");
  const list = $("situationsList");
  const backWrap = $("backWrap");
  if (hintCard) hintCard.classList.remove("hidden");
  if (list) list.classList.remove("hidden");
  if (backWrap) backWrap.classList.add("hidden");
}
  
  // ---------- Impuls (Kopfkarte) ----------
  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  // ---------- Timing (1:1 wie deine aktuelle App) ----------
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  // ---------- Audio (1:1 wie deine aktuelle App) ----------
  const BG_TARGET_GAIN = 0.0085;
  const BG_FADE_MS = 2500;
  const BG_MAX_PLAY_MS = 180000;
  const SONG_TARGET_GAIN = 0.035;

  let runId = 0;
  let bgStopTimer = null;

  let audioCtx = null;
  let bgGain = null;
  let bgSource = null;
  let songGain = null;
  let songSource = null;

  function ensureAudioGraph(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const bg = $("bgMusic");
    if (bg){
      bgSource = audioCtx.createMediaElementSource(bg);
      bgGain = audioCtx.createGain();
      bgGain.gain.value = 0;
      bgSource.connect(bgGain);
      bgGain.connect(audioCtx.destination);
    }

    const song = $("songPlayer");
    if (song){
      songSource = audioCtx.createMediaElementSource(song);
      songGain = audioCtx.createGain();
      songGain.gain.value = 0;
      songSource.connect(songGain);
      songGain.connect(audioCtx.destination);
    }
  }

  function fadeBgTo(targetGain, durationMs){
    if (!audioCtx || !bgGain) return;
    const now = audioCtx.currentTime;
    const dur = Math.max(0.05, durationMs / 1000);

    bgGain.gain.cancelScheduledValues(now);
    bgGain.gain.setValueAtTime(bgGain.gain.value, now);
    bgGain.gain.linearRampToValueAtTime(targetGain, now + dur);
  }

  async function startBgMusic(){
    const bg = $("bgMusic");
    if (!bg) return;

    ensureAudioGraph();

    if (audioCtx && audioCtx.state === "suspended") {
      try { await audioCtx.resume(); } catch(_) {}
    }

    try { bg.pause(); } catch(_) {}
    bg.currentTime = 0;
    bg.loop = false;
    bg.volume = 0.0001;

    try{
      await bg.play();
      fadeBgTo(BG_TARGET_GAIN, BG_FADE_MS);

      if (bgStopTimer) clearTimeout(bgStopTimer);
      bgStopTimer = setTimeout(() => stopBgMusic(true), BG_MAX_PLAY_MS);
    } catch(_){}
  }

  function stopBgMusic(fade){
    const bg = $("bgMusic");
    if (!bg) return;

    if (bgStopTimer) clearTimeout(bgStopTimer);
    bgStopTimer = null;

    if (!fade){
      fadeBgTo(0, 50);
      try { bg.pause(); } catch(_) {}
      return;
    }

    fadeBgTo(0, 900);
    setTimeout(() => { try { bg.pause(); } catch(_) {} }, 950);
  }

  function stopSong(){
    const song = $("songPlayer");
    if (!song) return;
    try { song.pause(); } catch(_) {}
    song.currentTime = 0;
    if (songGain) songGain.gain.value = 0;
  }

  function setAudio(bgFile, songFile){
    const bg = $("bgMusic");
    const song = $("songPlayer");
    if (!bg || !song) return;

    const bgSrc = bg.querySelector("source");
    const songSrc = song.querySelector("source");
    if (bgSrc && bgFile) bgSrc.src = `audio/${bgFile}`;
    if (songSrc && songFile) songSrc.src = `audio/${songFile}`;

    bg.load();
    song.load();
  }

  // ---------- Typing (1:1 wie deine aktuelle App) ----------
  function wrapTextToLines(text, el) {
    const style = getComputedStyle(el);
    const font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const canvas = wrapTextToLines._c || (wrapTextToLines._c = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = font;

    const maxWidth = el.clientWidth;
    const paragraphs = (text || "").split("\n");
    const lines = [];

    for (const para of paragraphs) {
      if (!para.trim()) { lines.push(""); continue; }

      const words = para.split(/\s+/).filter(Boolean);
      let line = "";

      for (const w of words) {
        const test = line ? (line + " " + w) : w;

        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  async function typeText(el, text, myRun){
    if (!el) return;

    el.innerHTML = "";
    const lines = wrapTextToLines(text, el);

    const cursor = document.createElement("span");
    cursor.className = "cursor";
    el.appendChild(cursor);

    for (let li = 0; li < lines.length; li++){
      if (myRun !== runId) return;

      const line = lines[li];

      for (let i = 0; i < line.length; i++){
        if (myRun !== runId) return;
        cursor.insertAdjacentText("beforebegin", line[i]);
        followWhileTyping(cursor);
        await sleep(CHAR_DELAY_MS);
      }

      if (li < lines.length - 1) {
        cursor.insertAdjacentHTML("beforebegin", "<br>");

        if (lines[li + 1] === "") {
          for (let k = 0; k < 8; k++) {
            followWhileTyping(cursor);
            await sleep(CHAR_DELAY_MS);
          }
        } else {
          followWhileTyping(cursor);
          await sleep(Math.max(120, CHAR_DELAY_MS * 2));
        }
      }
    }
  }

  async function typeList(ul, items, myRun){
    if (!ul) return;
    ul.innerHTML = "";

    for (const item of items){
      if (myRun !== runId) return;

      const li = document.createElement("li");
      ul.appendChild(li);

      for (let i = 0; i < item.length; i++){
        if (myRun !== runId) return;
        li.textContent += item[i];
        if (i % 6 === 0) followWhileTyping(li);
        await sleep(CHAR_DELAY_MS);
      }

      await sleep(600);
    }

    followWhileTyping(ul);
  }

  // ---------- Run situation ----------
  async function runSituation(n){
    runId++;
    const myRun = runId;

    clearAllBlocks();
    hideChooser();
    
    stopSong();
    stopBgMusic(false);

   const s = window.SITUATIONS && window.SITUATIONS[n];
if (!s) {
  alert("Situation " + n + " nicht gefunden. Prüfe: situations/situation-" + n + ".js geladen?");
  return;
}

// Hintergrundmusik bleibt bei dir konstant über HTML → keine bgAudio nötig
// Song-Datei pro Situation:
const song = $("songPlayer");
if (song && s.songFile) {
  const srcEl = song.querySelector("source");
  if (srcEl) {
    srcEl.src = s.songFile;
    song.load();
  }
}

await startBgMusic();

// Block 1
show("b1");
snapToTop("b1");
await sleep(80);
await typeText($("t1"), s.ankommenText, myRun);
await sleep(BETWEEN_BLOCKS_MS);

// Block 2
show("b2");
await typeText($("t2"), s.erklaerungText, myRun);
await sleep(BETWEEN_BLOCKS_MS);

// Block 3 (Affirmationen): einmal ruhig nach oben gleiten, dann Scroll stoppen
show("b3");

// 1) einmal sanft nach oben "gleiten"
glideToTop("b3", 1100);
await sleep(1200); // kurz warten, bis die Bewegung fertig ist

// 2) ab jetzt NICHT mehr mitscrollen (kein Ruckeln mehr bei Ritual/Song)
lockScroll = true;

await typeList($("t3"), s.affirmations, myRun);
await sleep(BETWEEN_BLOCKS_MS);

// Block 4
show("b4");
await typeList($("t4"), s.ritual, myRun);
await sleep(AFTER_RITUAL_MS);

// Block 5
show("b5");
lockScroll = true;

setTimeout(() => stopBgMusic(true), 45000); 
  }

  // ---------- UI Wiring ----------
  const btnImpuls = $("btnImpuls");
  const impulsEl = $("impuls");
  const btnSong = $("btnSong");
  const btnContinue = $("btnContinue");

  function showChooser() {
  const hintCard = $("chooseHintCard");
  const chooseCard = $("chooseCard");

  if (hintCard) hintCard.classList.remove("hidden");
  if (chooseCard) chooseCard.classList.remove("hidden");

  // sanft in Richtung Auswahl scrollen
  if (chooseCard) {
    const y = window.scrollY + chooseCard.getBoundingClientRect().top - 12;
    window.scrollTo({ top: y, behavior: "auto" });
  }
}

// "Situation wählen" Button
if (!btnContinue) {
  alert("btnContinue nicht gefunden – prüfe im HTML: id=\"btnContinue\"");
} else {
  // beim Laden immer verstecken
  btnContinue.classList.add("hidden");
  btnContinue.classList.remove("fadeIn");

  // beim Klick Auswahl zeigen
  btnContinue.addEventListener("click", () => {
    showChooser();
  });

  // nach 8 Sekunden sicher einblenden
  setTimeout(() => {
    btnContinue.classList.remove("hidden");
    btnContinue.classList.add("fadeIn");
  }, 8000);
}
  
  if (btnImpuls && impulsEl) {
    btnImpuls.addEventListener("click", () => {
      impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    });
  }

  const btnBack = $("btnBack");
if (btnBack) {
  btnBack.addEventListener("click", () => {
    // Stoppe laufende Audio/Sequenzen (wenn du willst)
    // stopSong(); stopBgMusic(false);
    clearAllBlocks();
    showChooser();
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}
  
  // Situation 1–9 Buttons
  for (let i = 1; i <= 9; i++){
    const btn = $(`btnSituation${i}`);
    if (btn){
      btn.addEventListener("click", () => runSituation(i));
    }
  }

  // Song Button: BG stop + Song Gain Fade-in
  if (btnSong){
    btnSong.addEventListener("click", async () => {
      stopBgMusic(false);

      const song = $("songPlayer");
      if (!song) return;

      ensureAudioGraph();

      if (audioCtx && audioCtx.state === "suspended") {
        try { await audioCtx.resume(); } catch(_) {}
      }

      try{
        song.pause();
        song.currentTime = 0;
        song.volume = 1.0;

        if (songGain) songGain.gain.value = 0.01; // Start sehr leise
        await song.play();

        if (songGain){
          const now = audioCtx.currentTime;
          songGain.gain.cancelScheduledValues(now);
          songGain.gain.setValueAtTime(songGain.gain.value, now);
          songGain.gain.linearRampToValueAtTime(SONG_TARGET_GAIN, now + 1.2);
        }
      } catch(_){}
    });
  }

});
