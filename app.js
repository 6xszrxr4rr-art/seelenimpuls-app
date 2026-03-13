document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  let runId = 0;

  // --- Konfiguration ---
  const CHAR_DELAY = 50; 
  const PAUSE_LONG = 800; // Pause bei Punkt oder Komma
  const BLOCK_DELAY = 2000;

  // --- UI Funktionen ---
  function show(id) { 
    const el = $(id);
    if (el) {
      el.classList.remove("hidden");
      setTimeout(() => el.classList.add("visible"), 50);
    }
  }

  function hide(id) {
    const el = $(id);
    if (el) {
      el.classList.remove("visible");
      el.classList.add("hidden");
    }
  }

  // --- Natürliches Tippen ---
  async function typeEffect(el, text, myRun) {
    if (!el) return;
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      if (myRun !== runId) return;
      el.textContent += text[i];
      
      // Pause variieren für natürlichen Rhythmus
      let delay = CHAR_DELAY;
      if ([".", "!", "?", "\n"].includes(text[i])) delay = PAUSE_LONG;
      else if ([","].includes(text[i])) delay = 300;

      await sleep(delay);
    }
  }

  async function typeList(ul, items, myRun) {
    if (!ul) return;
    ul.innerHTML = "";
    for (const item of items) {
      if (myRun !== runId) return;
      const li = document.createElement("li");
      ul.appendChild(li);
      await typeEffect(li, item, myRun);
      await sleep(500);
    }
  }

  // --- Audio ---
  function playBackground() {
    const bg = $("bgMusic");
    bg.volume = 0;
    bg.play();
    // Fade In
    let vol = 0;
    const interval = setInterval(() => {
      if (vol < 0.1) {
        vol += 0.01;
        bg.volume = vol;
      } else clearInterval(interval);
    }, 200);
  }

  function stopBackground() {
    const bg = $("bgMusic");
    let vol = bg.volume;
    const interval = setInterval(() => {
      if (vol > 0.01) {
        vol -= 0.01;
        bg.volume = vol;
      } else {
        bg.pause();
        clearInterval(interval);
      }
    }, 100);
  }

  // --- Haupt-Logik ---
  window.runSituation = async function(n) {
    runId++;
    const myRun = runId;
    const s = window.SITUATIONS[n];
    if (!s) return;

    // Reset & Setup
    document.body.classList.add("running");
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    hide("chooseCard");
    show("backTopWrap");
    show("situationTitleCard");
    $("situationTitle").textContent = s.title;
    
    // Song Preload
    const song = $("songPlayer");
    song.src = s.songFile;
    song.load();

    playBackground();

    // Sequenz
    await sleep(1000);
    
    show("b1");
    await typeEffect($("t1"), s.ankommenText, myRun);
    await sleep(BLOCK_DELAY);

    show("b2");
    await typeEffect($("t2"), s.erklaerungText, myRun);
    await sleep(BLOCK_DELAY);

    show("b3");
    await typeList($("t3"), s.affirmations, myRun);
    await sleep(BLOCK_DELAY);

    show("b4");
    await typeList($("t4"), s.ritual, myRun);
    await sleep(BLOCK_DELAY);

    show("b5");
    $("outroContainer").innerHTML = ""; // Clear old outro
    if (s.songOutro) {
      const p = document.createElement("div");
      p.className = "songOutro";
      p.textContent = s.songOutro;
      $("outroContainer").appendChild(p);
    }
    
    show("backBottomWrap");
  };

  // --- Event Listener ---
  $("btnImpuls").onclick = () => {
    const impulses = [
      "Du musst heute nichts mehr erreichen.",
      "Dein Atem ist dein Anker.",
      "Alles darf so sein, wie es gerade ist.",
      "Du bist sicher in diesem Moment."
    ];
    $("impuls").textContent = impulses[Math.floor(Math.random() * impulses.length)];
  };

  $("btnContinue").onclick = () => {
    hide("continueCard");
    show("chooseCard");
  };

  $("btnSong").onclick = () => {
    stopBackground();
    $("songPlayer").play();
  };

  const go
