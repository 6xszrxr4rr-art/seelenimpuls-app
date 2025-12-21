(() => {
  // ---------- Settings ----------
  const TYPE_SPEED_MS = 32;          // langsamer tippen
  const BETWEEN_BLOCKS_MS = 1800;    // Pause zwischen Blöcken
  const RITUAL_STEP_PAUSE_MS = 1400; // Zeit zum Mitmachen pro Ritual-Schritt

  const BG_TARGET_VOL = 0.006;       // sehr leise Hintergrundmusik
  const BG_FADEIN_MS = 4500;
  const BG_AUTO_FADEOUT_AFTER_MS = 45000; // nach 45s ausfaden
  const BG_FADEOUT_MS = 5000;

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Abbruch/“nur 1 Sequenz gleichzeitig”
  let runToken = 0;
  let bgFadeTimer = null;

  function clearList(el) {
    if (!el) return;
    el.innerHTML = "";
  }

  // Typewriter: schreibt Text als TextContent (stabil) – Newlines über CSS pre-line
  async function typeText(el, text, speed = TYPE_SPEED_MS, token) {
    if (!el) return;
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      if (token !== runToken) return;
      el.textContent += text[i];
      await sleep(speed);
    }
  }

  // List typewriter
  async function typeList(listEl, items, speed = TYPE_SPEED_MS, token) {
    if (!listEl) return;
    clearList(listEl);

    for (const item of items) {
      if (token !== runToken) return;

      const li = document.createElement("li");
      li.textContent = "";
      listEl.appendChild(li);

      for (let i = 0; i < item.length; i++) {
        if (token !== runToken) return;
        li.textContent += item[i];
        await sleep(speed);
      }
    }
  }

  function showBlock(id) {
    const b = $(id);
    if (!b) return;
    b.classList.remove("hidden");
    // reflow für saubere Transition
    void b.offsetWidth;
    b.classList.add("show");
  }

  // ---------- Audio ----------
  function fadeTo(audioEl, targetVol, durationMs) {
    if (!audioEl) return;
    const steps = 60;
    const stepTime = Math.max(50, Math.floor(durationMs / steps));
    const start = audioEl.volume ?? 0;
    const delta = (targetVol - start) / steps;

    let current = start;
    const timer = setInterval(() => {
      current += delta;
      audioEl.volume = Math.max(0, Math.min(1, current));
      if (
        (delta >= 0 && audioEl.volume >= targetVol) ||
        (delta < 0 && audioEl.volume <= targetVol)
      ) {
        audioEl.volume = targetVol;
        clearInterval(timer);
      }
    }, stepTime);
  }

  function startBgMusic() {
    const bg = $("bgMusic");
    if (!bg) return;

    // iOS/Safari: play nur nach User-Klick zuverlässig – passiert hier.
    bg.loop = true;
    bg.currentTime = 0;
    bg.volume = 0;

    bg.play().then(() => {
      fadeTo(bg, BG_TARGET_VOL, BG_FADEIN_MS);

      // Auto-Fadeout, damit es nicht ewig läuft
      if (bgFadeTimer) clearTimeout(bgFadeTimer);
      bgFadeTimer = setTimeout(() => {
        fadeOutAndStopBg();
      }, BG_AUTO_FADEOUT_AFTER_MS);
    }).catch(() => {
      // falls Safari blockt: dann bleibt es still – App läuft trotzdem
    });
  }

  function fadeOutAndStopBg() {
    const bg = $("bgMusic");
    if (!bg) return;
    fadeTo(bg, 0, BG_FADEOUT_MS);
    setTimeout(() => {
      try {
        bg.pause();
        bg.currentTime = 0;
      } catch {}
    }, BG_FADEOUT_MS + 50);
  }

  function stopBgImmediately() {
    const bg = $("bgMusic");
    if (!bg) return;
    try {
      bg.pause();
      bg.currentTime = 0;
      bg.volume = 0;
    } catch {}
  }

  // ---------- Impulse ----------
  const impulse = [
    "Atme tief ein. Du musst heute nichts halten.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht sein."
  ];

  function neuerImpuls() {
    const el = $("impuls");
    if (!el) return;
    el.textContent = impulse[Math.floor(Math.random() * impulse.length)];
  }

  // ---------- Content ----------
  const ankommen = "Du bist hier.\nDu darfst jetzt langsamer werden.";

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
    "Nimm drei tiefe Atemzüge – nur für dich.",
    "Atme ruhig und gleichmäßig ein.",
    "Atme etwas länger aus.",
    "Lass deine Schultern sinken.",
    "Nimm den Boden unter deinen Füßen wahr.",
    "Spüre, wie Ruhe und Harmonie dich sanft durchströmen."
  ];

  // ---------- Sequence ----------
  async function startSituation1() {
    // Neue Sequenz starten (bricht evtl. alte ab)
    runToken++;
    const token = runToken;

    // Reset/auf Anfangszustand
    ["b1","b2","b3","b4","b5"].forEach((id) => {
      const b = $(id);
      if (!b) return;
      b.classList.add("hidden");
      b.classList.remove("show");
    });

    clearList($("t3"));
    clearList($("t4"));
    $("t1") && ($("t1").textContent = "");
    $("t2") && ($("t2").textContent = "");

    // Visual-Ende aus
    const endVis = $("endVisual");
    if (endVis) endVis.classList.remove("on");

    // Background Music starten
    startBgMusic();

    // Block 1
    showBlock("b1");
    await typeText($("t1"), ankommen, TYPE_SPEED_MS, token);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 2
    showBlock("b2");
    await typeText($("t2"), erklaerung, TYPE_SPEED_MS, token);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 3
    showBlock("b3");
    await typeList($("t3"), affirmationen, TYPE_SPEED_MS, token);
    await sleep(BETWEEN_BLOCKS_MS);

    // Block 4 (Ritual) + Pausen zum Mitmachen
    showBlock("b4");
    const listEl = $("t4");
    clearList(listEl);

    for (const step of ritual) {
      if (token !== runToken) return;
      const li = document.createElement("li");
      li.textContent = "";
      listEl.appendChild(li);

      for (let i = 0; i < step.length; i++) {
        if (token !== runToken) return;
        li.textContent += step[i];
        await sleep(TYPE_SPEED_MS);
      }
      // Zeit zum Mitmachen
      await sleep(RITUAL_STEP_PAUSE_MS);
    }

    await sleep(BETWEEN_BLOCKS_MS);

    // Block 5 + dezente Visuals
    showBlock("b5");
    if (endVis) endVis.classList.add("on");
  }

  // Gesungene Affirmation: Background aus, Song an
  function startSong() {
    const song = $("audioPlayer");
    if (!song) return;

    // Background stoppen
    if (bgFadeTimer) clearTimeout(bgFadeTimer);
    fadeOutAndStopBg();

    // Song starten
    try {
      song.currentTime = 0;
      song.play().catch(() => {});
    } catch {}
  }

  // ---------- Wiring ----------
  document.addEventListener("DOMContentLoaded", () => {
    const btnImpuls = $("btnImpuls");
    btnImpuls && btnImpuls.addEventListener("click", neuerImpuls);

    const btnSituation1 = $("btnSituation1");
    btnSituation1 && btnSituation1.addEventListener("click", startSituation1);

    const btnSong = $("btnSong");
    btnSong && btnSong.addEventListener("click", startSong);

    // Start-Impuls initial setzen
    neuerImpuls();
  });
})();
