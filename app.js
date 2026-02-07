// app.js (Controller)

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- Basic UI helpers ----------
  function show(id){ const el = $(id); if (el) el.classList.remove("hidden"); }
  function hide(id){ const el = $(id); if (el) el.classList.add("hidden"); }

  // Sanftes Scrollen zu Element (ohne "nervöses Mitscrollen")
  function glideToElement(elOrId, duration = 1200, offset = 12){
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

 function scrollUnderTopUI(targetId, duration = 900){
  const el = document.getElementById(targetId);
  if (!el) return;

  const backTop = document.getElementById("backTopWrap");
  const titleCard = document.getElementById("situationTitleCard");

  const topH =
    (backTop && !backTop.classList.contains("hidden") ? backTop.offsetHeight : 0) +
    (titleCard && !titleCard.classList.contains("hidden") ? titleCard.offsetHeight : 0) +
    12;

  const y = window.scrollY + el.getBoundingClientRect().top - topH;
  window.scrollTo({ top: y, behavior: "auto" });
}
  
  // ---------- Typing (einfach & stabil) ----------
  const CHAR_DELAY_MS = 140;
  const BETWEEN_BLOCKS_MS = 3000;
  const AFTER_RITUAL_MS = 5000;

  let runId = 0;

  async function typeText(el, text, myRun){
    if (!el) return;
    el.innerHTML = "";
    const t = (text || "").toString();
    for (let i = 0; i < t.length; i++){
      if (myRun !== runId) return;
      const ch = t[i];
      if (ch === "\n") el.insertAdjacentHTML("beforeend", "<br>");
      else el.insertAdjacentText("beforeend", ch);
      await sleep(CHAR_DELAY_MS);
    }
  }

  async function typeList(ul, items, myRun){
    if (!ul) return;
    ul.innerHTML = "";
    for (const item of (items || [])){
      if (myRun !== runId) return;
      const li = document.createElement("li");
      ul.appendChild(li);
      const s = (item || "").toString();
      for (let i = 0; i < s.length; i++){
        if (myRun !== runId) return;
        li.textContent += s[i];
        await sleep(CHAR_DELAY_MS);
      }
      await sleep(600);
    }
  }

  // ---------- Audio ----------
  const BG_TARGET_GAIN = 0.0085;
  const BG_FADE_MS = 2500;
  const BG_MAX_PLAY_MS = 180000;
  const SONG_TARGET_GAIN = 0.035;

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

  // ---------- UI State ----------
  const dividerEl = document.querySelector(".divider");

  function clearAllBlocks(){
    ["b1","b2","b3","b4","b5"].forEach(hide);
    if ($("t1")) $("t1").innerHTML = "";
    if ($("t2")) $("t2").innerHTML = "";
    if ($("t3")) $("t3").innerHTML = "";
    if ($("t4")) $("t4").innerHTML = "";
    // Outro in b5 entfernen (falls vorhanden)
    const b5 = $("b5");
    if (b5){
      const outro = b5.querySelector(".songOutro");
      if (outro) outro.remove();
    }
  }

  function showChooser(){
    hide("chooseCard"); // erst sauber
    show("chooseHintCard");
    show("chooseCard");
  }

  function hideChooser(){
    hide("chooseHintCard");
    hide("chooseCard");
  }

  function enterRunUI(s){
    document.body.classList.add("running");

    hide("topCard");
    hide("continueCard");

    hideChooser();

    show("backTopWrap");
    show("situationTitleCard");
    if ($("situationTitle")) $("situationTitle").textContent = s.title || "";

    hide("backBottomWrap"); // unten erst am Ende
    if (dividerEl) dividerEl.classList.add("hidden"); // weniger Luft

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function exitRunUI(){
    document.body.classList.remove("running");

    show("topCard");
    show("continueCard");

    hide("situationTitleCard");
    hide("backTopWrap");
    hide("backBottomWrap");

    if (dividerEl) dividerEl.classList.remove("hidden");

    showChooser();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBack(){
    clearAllBlocks();
    stopSong();
    stopBgMusic(true);
    exitRunUI();
  }

  // ---------- Run situation ----------
  async function runSituation(n){
    runId++;
    const myRun = runId;

    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) {
      alert("Situation " + n + " nicht gefunden. Prüfe: situations/situation-" + n + ".js geladen?");
      return;
    }

    clearAllBlocks();
    stopSong();
    stopBgMusic(false);
    enterRunUI(s);

    // Song-Datei pro Situation (in deinen situation-*.js als s.songFile)
    const song = $("songPlayer");
    if (song && s.songFile) {
      const srcEl = song.querySelector("source");
      if (srcEl) { srcEl.src = s.songFile; song.load(); }
    }

    await startBgMusic();

    // Block 1 (Ankommen) – direkt sichtbar unter dem Titel
    show("b1");
    await glideToElement("b1", 0, 0);
    await typeText($("t1"), s.ankommenText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 2
    show("b2");
    await typeText($("t2"), s.erklaerungText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 3 (Affirmationen)
    show("b3");
    // moveBackBelow($("b3"));   // löschen/auskommentieren
    await typeList($("t3"), s.affirmations, myRun);
    await sleep(BETWEEN_BLOCKS_MS); // ✅ soll stehen bleiben
    
    // Block 4
    show("b4");
    await glideToElement("b4", 900, 12);
    await typeList($("t4"), s.ritual, myRun);
    await sleep(AFTER_RITUAL_MS);

    // Block 5 + Outro
    show("b5");
    if (s.songOutro) {
      const p = document.createElement("p");
      p.className = "songOutro fadeIn";
      p.textContent = s.songOutro;
      $("b5").appendChild(p);
    }

    // Back unten JETZT anzeigen (Ende)
    show("backBottomWrap");
    await glideToElement("backBottomWrap", 900, 12);

    setTimeout(() => stopBgMusic(true), 45000);
  }

  // ---------- UI Wiring ----------
  const btnImpuls = $("btnImpuls");
  const impulsEl = $("impuls");
  const btnSong = $("btnSong");
  const btnContinue = $("btnContinue");
  const btnBackTop = $("btnBackTop");
  const btnBackBottom = $("btnBackBottom");

  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  // Impuls Button
  if (btnImpuls && impulsEl){
    btnImpuls.addEventListener("click", () => {
      impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    });
  }

  // "Situation wählen"
  if (btnContinue){
    btnContinue.classList.add("hidden");
    btnContinue.classList.remove("fadeIn");

    btnContinue.addEventListener("click", () => showChooser());

    setTimeout(() => {
      btnContinue.classList.remove("hidden");
      btnContinue.classList.add("fadeIn");
    }, 8000);
  }

  // Back Buttons
  if (btnBackTop) btnBackTop.addEventListener("click", goBack);
  if (btnBackBottom) btnBackBottom.addEventListener("click", goBack);

  // Situation 1–9 Buttons
  for (let i = 1; i <= 9; i++){
    const btn = $(`btnSituation${i}`);
    if (btn){
      btn.addEventListener("click", () => runSituation(i));
    }
  }

  // Song Button
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
