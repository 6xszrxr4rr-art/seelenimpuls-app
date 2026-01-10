window.onerror = function (msg, src, line, col) {
  alert("JS-Fehler: " + msg + " @ Zeile " + line + ":" + col);
};
alert("app.js gestartet ✅");
/* ===========================
   Seelenimpuls – app.js (FULL)
   Stabil auf iPhone/Safari:
   - Events erst nach DOMContentLoaded
   - BG + Song Lautstärke via WebAudio Gain
   - sanftes Mit-Scrollen während des Tippens
   =========================== */

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
 
   // --- sanftes Mit-Scrollen während des Tippens (ruhig + nur wenn nötig) ---
let lastScrollTs = 0;

function followWhileTyping(el){
  if (!el) return;

  const now = performance.now();
  if (now - lastScrollTs < 140) return; // etwas weniger "micro-ruckeln"
  lastScrollTs = now;

  const r = el.getBoundingClientRect();

  // Startet erst, wenn ~78% der Höhe erreicht sind
  const targetY = window.innerHeight * 0.78;

  if (r.bottom > targetY){
    const delta = r.bottom - targetY;

    // kleine Schritte -> ruhiger
    window.scrollBy({ top: Math.min(10, delta), behavior: "auto" });
  }
}
   
  function show(id){
    const el = $(id);
    if (!el) return;
    el.classList.remove("hidden");
  }

  function autoScrollTo(id){
  const el = $(id);
  if (!el) return;

  const y = window.scrollY + el.getBoundingClientRect().top - (window.innerHeight * 0.20);
  window.scrollTo({ top: y, behavior: "auto" });
}

  function clearAllBlocks(){
    ["b1","b2","b3","b4","b5"].forEach(id => {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });
    if ($("t1")) $("t1").textContent = "";
    if ($("t2")) $("t2").textContent = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
    if ($("endVisual")) $("endVisual").classList.remove("on");
    if ($("drops")) $("drops").innerHTML = "";
  }

  // ---------- Inhalte ----------
  const impulses = [
    "Atme tief ein. Du musst heute nichts halten.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht sein.",
    "Du musst nicht kämpfen, um sicher zu sein."
  ];

  const ankommenText =
  "Du bist hier.\n" +
  "\n" +
  "Nichts drängt.\n" +
  "Nichts will gelöst werden.\n" +
  "\n" +
  "Du darfst für einen Moment anhalten\n" +
  "und wahrnehmen,\n" +
  "dass dieser Augenblick gerade genug ist.";

const erklaerungText =
  "Innere Unruhe entsteht oft dann,\n" +
  "wenn dein Inneres schneller ist als der Moment.\n" +
  "\n" +
  "Gedanken kreisen,\n" +
  "der Körper bleibt angespannt,\n" +
  "auch wenn keine unmittelbare Gefahr da ist.\n" +
  "\n" +
  "Dein Nervensystem sucht nicht nach Antworten.\n" +
  "Es sucht nach Sicherheit.\n" +
  "\n" +
  "Diese kleinen Impulse laden dich ein,\n" +
  "wieder in deinem Körper anzukommen\n" +
  "und dem inneren Tempo sanft zu begegnen.";

const affirmationItems = [
  "Ich darf langsamer werden.",
  "Ich bin jetzt hier.",
  "Ich bin getragen in diesem Moment."
];

const ritualItems = [
  "Lass deinen Atem ruhig einströmen.",
  "Und lass ihn wieder hinausfließen – ein wenig länger, ein wenig weicher.",
  "Spüre, wie dein Körper gehalten wird.",
  "Der Boden unter dir. Die Fläche, die dich trägt.",
  "Mit jedem Ausatmen darf ein wenig Spannung gehen.",
  "Nicht alles. Nur so viel, wie jetzt möglich ist.",
  "Und dann bleibe hier noch einen Moment.",
  "Ohne etwas verändern zu müssen."
];

  // ---------- Timing ----------
  const CHAR_DELAY_MS = 110;  // vorher 70/95 → ruhiger, gleichmäßig
  const BETWEEN_BLOCKS_MS  = 3000;
  const AFTER_RITUAL_MS    = 5000;

  // ---------- Audio ----------
  const BG_TARGET_GAIN   = 0.0085;
  const BG_FADE_MS       = 2500;
  const BG_MAX_PLAY_MS   = 180000;
  const SONG_TARGET_GAIN = 0.04;   // Song leiser = kleiner

  let runId = 0;
  let bgStopTimer = null;

  // WebAudio Graph
  let audioCtx = null;
  let bgGain = null;
  let bgSource = null;
  let songGain = null;
  let songSource = null;

  function ensureAudioGraph(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // BG
    const bg = $("bgMusic");
    if (bg){
      bgSource = audioCtx.createMediaElementSource(bg);
      bgGain = audioCtx.createGain();
      bgGain.gain.value = 0;
      bgSource.connect(bgGain);
      bgGain.connect(audioCtx.destination);
    }

    // SONG
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

    // iOS: native volume ist unzuverlässig → Gain regelt
    bg.volume = 0.0001;

    try{
      await bg.play();
      fadeBgTo(BG_TARGET_GAIN, BG_FADE_MS);

      if (bgStopTimer) clearTimeout(bgStopTimer);
      bgStopTimer = setTimeout(() => stopBgMusic(true), BG_MAX_PLAY_MS);
    } catch(_){
      // Safari blockiert manchmal autoplay → kein Crash
    }
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

  // ---------- Typing ----------
  async function typeText(el, text, myRun){
  if (!el) return;

  el.textContent = "";
  const textNode = document.createTextNode("");
  el.appendChild(textNode);

  let cursor = el.querySelector(".cursor");
  if (!cursor) {
    cursor = document.createElement("span");
    cursor.className = "cursor";
    el.appendChild(cursor);
  }

  // Tokens: entweder "\n" oder Wort+Folgespaces
  const tokens = text.match(/\n|[^\s]+\s*/g) || [];

  let tokenCount = 0;

  for (const token of tokens){
    if (myRun !== runId) return;

    textNode.textContent += token;
    tokenCount++;

    // Scroll: bei Zeilenumbruch oder alle 3 Tokens (ruhig)
    if (token === "\n" || tokenCount % 3 === 0) {
      followWhileTyping(cursor);
    }

    await sleep(CHAR_DELAY_MS);
  }

  // am Ende einmal stabilisieren
  followWhileTyping(cursor);
}
}
   
  async function typeList(ul, items, myRun){
  if (!ul) return;
  ul.innerHTML = "";

  for (const item of items){
    if (myRun !== runId) return;

    const li = document.createElement("li");
    ul.appendChild(li);

    // Wortweise statt Buchstaben (verhindert Wort-"Springen")
    const tokens = item.match(/[^\s]+\s*/g) || [];
    let tokenCount = 0;

    for (const token of tokens){
      if (myRun !== runId) return;

      li.textContent += token;
      tokenCount++;

      // Scroll: alle 2 Tokens (ruhig)
      if (tokenCount % 2 === 0) {
        followWhileTyping(li);
      }

      await sleep(CHAR_DELAY_MS);
    }

    // kleine Pause zwischen Listenpunkten
    await sleep(600);
  }

  followWhileTyping(ul);
}
  }

  // ---------- UI Wiring ----------
  const btnImpuls     = $("btnImpuls");
  const btnSituation1 = $("btnSituation1");
  const btnSong       = $("btnSong");
  const impulsEl      = $("impuls");

  if (!btnImpuls || !btnSituation1 || !btnSong || !impulsEl) {
    alert("Fehler: Ein Button/Element fehlt im HTML (IDs prüfen: btnImpuls, btnSituation1, btnSong, impuls).");
    return;
  }

  btnImpuls.addEventListener("click", () => {
    impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
  });

  btnSituation1.addEventListener("click", async () => {
    runId++;
    const myRun = runId;

    clearAllBlocks();
    stopSong();
    stopBgMusic(false);
    await startBgMusic();

    show("b1");
    autoScrollTo("b1");
    await typeText($("t1"), ankommenText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b2");
    await typeText($("t2"), erklaerungText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b3");
    await typeList($("t3"), affirmationItems, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b4");
    await typeList($("t4"), ritualItems, myRun);
    await sleep(AFTER_RITUAL_MS);

    show("b5");

    setTimeout(() => stopBgMusic(true), 45000);
  });

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
      song.volume = 1.0; // Gain regelt

      if (songGain) songGain.gain.value = 0.02;

      await song.play();

      if (songGain){
        const now = audioCtx.currentTime;
        songGain.gain.cancelScheduledValues(now);
        songGain.gain.setValueAtTime(songGain.gain.value, now);
        songGain.gain.linearRampToValueAtTime(SONG_TARGET_GAIN, now + 1.2);
      }
    } catch(_){
      // iOS fallback
      try{
        song.muted = true;
        await song.play();
        song.muted = false;
      } catch(__) {}
    }
  });

});
