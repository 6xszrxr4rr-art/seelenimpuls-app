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
    if (now - lastScrollTs < 90) return; // throttle
    lastScrollTs = now;

    const r = el.getBoundingClientRect();
    const padding = 240;
    const limit = window.innerHeight - padding;

    if (r.bottom > limit){
      window.scrollBy({ top: (r.bottom - limit), behavior: "smooth" });
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
    el.scrollIntoView({ behavior: "smooth", block: "start" });
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
    "Du darfst jetzt langsamer werden.";

  const erklaerungText =
    "Innere Unruhe ist oft ein wertvoller Hinweis.\n" +
    "Dein Nervensystem sucht Sicherheit.\n" +
    "Dein Körper lädt dich ein, Tempo herauszunehmen\n" +
    "und wieder im Moment anzukommen.";

  const affirmationItems = [
    "Ich bin sicher.",
    "Ich bin ganz.",
    "Ich bin gehalten in mir."
  ];

  const ritualItems = [
    "Nimm dir einen Moment nur für dich.",
    "Atme ruhig und gleichmäßig ein.",
    "Atme etwas länger aus.",
    "Lass deine Schultern sinken.",
    "Nimm den Boden unter deinen Füßen wahr.",
    "Spüre, wie Ruhe und Harmonie dich durchströmen."
  ];

  // ---------- Timing ----------
  const CHAR_DELAY_MS      = 70;
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

  // Textnode + Cursor sauber vorbereiten
  el.textContent = "";
  const textNode = document.createTextNode("");
  el.appendChild(textNode);

  let cursor = el.querySelector(".cursor");
  if (!cursor) {
    cursor = document.createElement("span");
    cursor.className = "cursor";
    el.appendChild(cursor);
  }

  for (let i = 0; i < text.length; i++){
    if (myRun !== runId) return;

    textNode.textContent += text[i];

    // JETZT: von Anfang an sanft mitscrollen
    followWhileTyping(cursor);

    await sleep(CHAR_DELAY_MS);
  }

  // kein harter Sprung am Ende mehr
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
        followWhileTyping(li);

        await sleep(CHAR_DELAY_MS);
      }

      followWhileTyping(ul);
      await sleep(700);
    }
  }

  // ---------- End Visuals ----------
  function showEndVisual(){
    const box = $("endVisual");
    const drops = $("drops");
    if (!box || !drops) return;

    box.classList.add("on");
    drops.innerHTML = "";

    const count = 18;
    for (let i = 0; i < count; i++){
      const d = document.createElement("div");
      d.className = "drop";
      d.style.left = (Math.random()*100).toFixed(2) + "%";
      d.style.animationDuration = (2.6 + Math.random()*2.6).toFixed(2) + "s";
      d.style.animationDelay = (Math.random()*1.8).toFixed(2) + "s";
      d.style.opacity = (0.25 + Math.random()*0.55).toFixed(2);
      d.style.height = (18 + Math.random()*30).toFixed(0) + "px";
      drops.appendChild(d);
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
    autoScrollTo("b2");
    await typeText($("t2"), erklaerungText, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b3");
    autoScrollTo("b3");
    await typeList($("t3"), affirmationItems, myRun);
    await sleep(BETWEEN_BLOCKS_MS);

    show("b4");
    autoScrollTo("b4");
    await typeList($("t4"), ritualItems, myRun);
    await sleep(AFTER_RITUAL_MS);

    show("b5");
    autoScrollTo("b5");

    showEndVisual();
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
