const wait = (ms) => new Promise((r) => setTimeout(r, ms));

document.addEventListener("DOMContentLoaded", () => {
  // Elemente
  const btnImpuls = document.getElementById("btnImpuls");
  const impulsEl = document.getElementById("impuls");

  const startBtn = document.getElementById("startSituation");
  const playSongBtn = document.getElementById("playSong");

  const b1 = document.getElementById("b1");
  const b2 = document.getElementById("b2");
  const b3 = document.getElementById("b3");
  const b4 = document.getElementById("b4");
  const b5 = document.getElementById("b5");

  const t1 = document.getElementById("t1");
  const t2 = document.getElementById("t2");
  const t3 = document.getElementById("t3");
  const t4 = document.getElementById("t4");

  const rain = document.getElementById("rain");

  const bg = document.getElementById("bgMusic");
  const song = document.getElementById("song");

  // Inhalte
  const impulses = [
    "Atme tief ein. Du musst heute nichts halten.",
    "Du darfst langsam sein.",
    "Alles darf weicher werden.",
    "Du bist sicher – hier und jetzt."
  ];

  // Musik-Settings
  const BG_VOL = 0.0035;     // sehr leise (wenn noch zu laut: 0.002)
  const BG_MAX = 90000;      // 90 Sekunden
  const BG_FADE_IN = 6500;
  const BG_FADE_OUT = 4500;

  // Schreibtempo (langsamer)
  const TYPE = 44;

  // Pausen zwischen Blöcken (Zeit zum Lesen/Spüren)
  const PAUSE = {
    b1: 4000,
    b2: 6500,
    b3: 7500,
    b4: 12000
  };

  let running = false;
  let bgTimer = null;

  // Helpers
  async function fade(audio, to, ms) {
    if (!audio) return;
    to = Math.max(0, Math.min(1, to));
    const steps = 60;
    const stepMs = Math.max(40, Math.floor(ms / steps));
    const from = audio.volume ?? 0;
    const diff = (to - from) / steps;

    for (let i = 0; i < steps; i++) {
      audio.volume = Math.max(0, Math.min(1, (audio.volume ?? from) + diff));
      await wait(stepMs);
    }
    audio.volume = to;
  }

  async function startBg() {
    if (!bg) return;

    if (bgTimer) {
      clearTimeout(bgTimer);
      bgTimer = null;
    }

    bg.pause();
    bg.currentTime = 0;
    bg.volume = 0;

    try {
      await bg.play(); // iOS erlaubt das nach Button-Klick
    } catch {
      return;
    }

    await fade(bg, BG_VOL, BG_FADE_IN);

    bgTimer = setTimeout(() => {
      stopBg(true);
    }, BG_MAX);
  }

  async function stopBg(withFade) {
    if (!bg) return;

    if (bgTimer) {
      clearTimeout(bgTimer);
      bgTimer = null;
    }

    if (withFade) {
      await fade(bg, 0, BG_FADE_OUT);
    }
    bg.pause();
    bg.currentTime = 0;
    bg.volume = 0;
  }

  function stopSong() {
    if (!song) return;
    song.pause();
    song.currentTime = 0;
  }

  async function typeText(el, text) {
    if (!el) return;
    el.textContent = "";
    for (const ch of text) {
      el.textContent += ch;
      await wait(TYPE);
    }
  }

  async function typeList(el, items) {
    if (!el) return;
    el.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      el.appendChild(li);
      for (const ch of item) {
        li.textContent += ch;
        await wait(TYPE);
      }
      await wait(900);
    }
  }

  // Buttons
  if (btnImpuls && impulsEl) {
    btnImpuls.onclick = () => {
      impulsEl.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    };
  }

  if (playSongBtn && song) {
    playSongBtn.onclick = async () => {
      // Hintergrundmusik MUSS aus, wenn Song startet
      await stopBg(true);
      stopSong();
      song.play().catch(() => {});
    };
  }

  if (startBtn) {
    startBtn.onclick = async () => {
      if (running) return;
      running = true;

      try {
        stopSong();
        await startBg();

        // Texte
        const ankommen =
          "Du bist hier.\n" +
          "In diesem Moment darfst du langsamer werden.";

        const erklaerung =
          "Innere Unruhe ist oft ein wertvoller Hinweis deines Unterbewusstseins.\n" +
          "Dein inneres System sucht nach Sicherheit und Orientierung.\n" +
          "Du darfst diesem Signal jetzt zuhören.\n" +
          "Nichts muss gelöst werden – nur gespürt.";

        const affirmationen = [
          "Ich bin sicher.",
          "Ich bin ganz.",
          "Ich bin gehalten in mir."
        ];

        const ritual = [
          "Nimm dir jetzt einen Moment nur für dich.",
          "Nimm drei tiefe Atemzüge.",
          "Atme ruhig und gleichmäßig ein.",
          "Atme etwas länger aus.",
          "Lass deine Schultern sanft sinken.",
          "Nimm den Boden unter deinen Füßen wahr.",
          "Spüre, wie Ruhe und Harmonie dich durchströmen."
        ];

        // Ablauf
        b1.classList.add("show");
        await typeText(t1, ankommen);
        await wait(PAUSE.b1);

        b2.classList.add("show");
        await typeText(t2, erklaerung);
        await wait(PAUSE.b2);

        b3.classList.add("show");
        await typeList(t3, affirmationen);
        await wait(PAUSE.b3);

        b4.classList.add("show");
        await typeList(t4, ritual);
        await wait(PAUSE.b4);

        b5.classList.add("show");

        // Visuelle Effekte erst am Ende
        if (rain) rain.style.display = "block";
      } finally {
        running = false;
      }
    };
  }
});
