// app.js (Controller) – nutzt Situationen aus /situations/situation-1.js ... situation-9.js

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function show(id){
    const el = $(id);
    if (el) el.classList.remove("hidden");
  }
  function hide(id){
    const el = $(id);
    if (el) el.classList.add("hidden");
  }

  // ---------- Scroll helpers ----------
  function followWhileTyping(_el){ return; } // komplett aus

  function glideToElement(elOrId, duration = 1400, offset = 12){
    const el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
    if (!el) return Promise.resolve();

    const startY = window.scrollY;
    const rect = el.getBoundingClientRect();
    const targetY = startY + rect.top - offset;

    const start = performance.now();
    return new Promise(resolve => {
      function step(now){
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, startY + (targetY - startY) * ease);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  // ---------- UI: Auswahl zeigen/verstecken ----------
  function showChooser(){
    show("chooseHintCard");
    show("chooseCard");
  }
  function hideChooser(){
    hide("chooseHintCard");
    hide("chooseCard");
  }

  // ---------- Run UI ----------
  function enterRunUI(s){
    document.body.classList.add("running");

    hide("topCard");
    hide("continueCard");

    hideChooser();

    // Titel
    const titleEl = $("situationTitle");
    if (titleEl) titleEl.textContent = s.title || "";
    show("situationTitleCard");

    // Back oben an, Back unten erstmal aus
    show("backTopWrap");
    hide("backBottomWrap");

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function exitRunUI(){
    document.body.classList.remove("running");

    show("topCard");
    show("continueCard");

    hide("situationTitleCard");
    hide("backTopWrap");
    hide("backBottomWrap");

    showChooser();
  }

  // ---------- Blocks reset ----------
  function clearAllBlocks(){
    ["b1","b2","b3","b4","b5"].forEach(hide);

    if ($("t1")) $("t1").innerHTML = "";
    if ($("t2")) $("t2").innerHTML = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";

    // Outro ggf. entfernen
    const b5 = $("b5");
    if (b5){
      b5.querySelectorAll(".songOutro").forEach(n => n.remove());
    }
  }

  // ---------- Back-Button immer direkt unter letztem sichtbaren Block ----------
  function placeBackBelow(el){
    const wrap = $("backBottomWrap");
    if (!wrap || !el) return;
    el.insertAdjacentElement("afterend", wrap);
  }

  // ---------- Impuls (Kopfkarte) ----------
  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  // ---------- Timing ----------
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  // ---------- Audio ----------
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

  // ---------- Typing ----------
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
        followWhileTyping(cursor);
        await sleep(Math.max(120, CHAR_DELAY_MS * 2));
      }
    }
  }

  async function typeList(ul, items, myRun){
    if (!ul) return;
    ul.innerHTML = "";

    for (const item of (items || [])){
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
    stopSong();
    stopBgMusic(false);

    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) {
      alert("Situation " + n + " nicht gefunden. Prüfe: situations/situation-" + n + ".js geladen?");
      return;
    }

    enterRunUI(s);

    // Song-Datei pro Situation (wenn du s.songFile hast)
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
    await glideToElement("b1", 0, 0);
    placeBackBelow($("b1"));
    await glideToElement("b1", 1600, 12);
    await typeText($("t1"), s.ankommenText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 2
    show("b2");
    placeBackBelow($("b2"));
    await typeText($("t2"), s.erklaerungText, myRun);

    // nach Erklärung: b3 hochholen, damit es "oben" weitergeht
    show("b3");
    await glideToElement("b3", 0, 0);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 3
    placeBackBelow($("b3"));
    await typeList($("t3"), s.affirmations, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 4
    show("b4");
    placeBackBelow($("b4"));
    await typeList($("t4"), s.ritual, myRun);
    await sleep(AFTER_RITUAL_MS);

    // Block 5
    show("b5");
    placeBackBelow($("b5"));

    const outro = s.songOutro;
    if (outro) {
      const p = document.createElement("p");
      p.className = "songOutro fadeIn";
      p.style.marginTop = "12px";
      p.textContent = outro;
      $("b5").appendChild(p);
    }

    // Back unten jetzt EINBLENDEN (am Ende)
    show("backBottomWrap");
    placeBackBelow($("b5"));

    setTimeout(() => stopBgMusic(true), 45000);
  }

  // ---------- UI Wiring ----------
  const btnImpuls = $("btnImpuls");
  const impulsEl = $("impuls");
  const btnSong = $("btnSong");
  const btnContinue = $("btnContinue");

  // Startzustand
  hide("chooseHintCard");
  hide("chooseCard");
  hide("backTopWrap");
  hide("backBottomWrap");
  hide("situationTitleCard");

  // Continue: Auswahl zeigen
  if (btnContinue){
    btnContinue.classList.add("hidden");
    btnContinue.classList.remove("fadeIn");

    btnContinue.addEventListener("click", () => {
      showChooser();
    });

    setTimeout(() => {
      btnContinue.classList.remove("hidden");
      btnContinue.classList.add("fadeIn");
    }, 8000);
  }

  // Impuls button
  if (btnImpuls && impulsEl) {
    btnImpuls.addEventListener("click", () => {
      impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    });
  }

  // Back buttons (oben + unten)
  const btnBackTop = $("btnBackTop");
  const btnBackBottom = $("btnBackBottom");

  function goBack(){
    clearAllBlocks();
    exitRunUI();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  if (btnBackTop) btnBackTop.addEventListener("click", goBack);
  if (btnBackBottom) btnBackBottom.addEventListener("click", goBack);

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

        if (songGain) songGain.gain.value = 0.01;
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
