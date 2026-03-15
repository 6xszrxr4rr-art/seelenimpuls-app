document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Sanfte, gleichmäßige Schreibgeschwindigkeit
  const SPEED = 85; 
  const PAUSE_BLOCKS = 2000;

  const impulses = [
    "Atme tief ein. Du darfst gehalten sein.",
    "Du darfst langsam sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht werden.",
    "Du darfst in Sicherheit ankommen."
  ];

  function showView(viewId) {
    ["ui-home", "ui-chooser", "ui-run"].forEach(id => $(id).classList.add("hidden"));
    $(viewId).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function softScroll() {
  // Eine Verzögerung von 150ms lässt den Browser den Text erst "setzen",
  // bevor er seidenweich nach unten gleitet.
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth' 
    });
  }, 150);
}

  // --- DIE STABILE SCHREIB-LOGIK (Kein Springen) ---
  async function typeEffect(id, text) {
    const el = $(id);
    if (!el) return;

    // 1. Platzhalter setzen: Text ist da, aber unsichtbar (opacity: 0)
    // Das verhindert das Springen der Zeilen.
    el.innerHTML = `<span style="opacity:0">${text}</span>`;
    
    // 2. Wir erstellen eine sichtbare Ebene darüber
    const visibleLayer = document.createElement("span");
    visibleLayer.style.position = "absolute";
    visibleLayer.style.left = "0";
    visibleLayer.style.top = "0";
    el.appendChild(visibleLayer);

    let current = "";
    for (let char of text) {
      current += char;
      

            visibleLayer.textContent = current;

      // Prüft auf "Atme" oder "atme"
if (current.toLowerCase().includes("atme")) {
  const box = document.getElementById("breathBox");
  // Prüfe ob die Box existiert und noch versteckt ist
  if (box && (box.style.display === "" || box.style.display === "none")) {
    box.style.display = "block";
    box.style.opacity = "0";
    
    // Kleiner Timeout, damit der Browser das display:block registriert
    setTimeout(() => {
      box.style.transition = "opacity 2s ease-in-out";
      box.style.opacity = "1";
      // Starte den Text-Wechsel (EIN/AUS)
      if (typeof startBreathingText === "function") {
        startBreathingText();
      }
    }, 50);
  }
}
      
      // Bei Satzzeichen kurz innehalten
      if ([".", "!", "?"].includes(char)) {
        softScroll();
        await sleep(700);
      }
      await sleep(SPEED);
    }
    softScroll();
  }

  async function typeListEffect(id, items) {
    const list = $(id);
    if (!list) return;
    list.innerHTML = "";
    
    for (let item of items) {
      const li = document.createElement("li");
      list.appendChild(li);
      
      // Auch hier: Platzhalter-Trick für die Liste
      li.innerHTML = `<span style="opacity:0">${item}</span>`;
      const vis = document.createElement("span");
      vis.style.position = "absolute";
      vis.style.left = "35px"; // Wegen des Icons
      vis.style.top = "0";
      li.appendChild(vis);

      let current = "";
      for (let char of item) {
        current += char;
        vis.textContent = current;
        await sleep(SPEED);
      }
      softScroll();
      await sleep(3500);
    }
  }

  async function runSituation(n) {
    const s = window.SITUATIONS && window.SITUATIONS[n];
    if (!s) return;
  if (s.songFile) {
    const bgAudio = new Audio(s.songFile);
    bgAudio.volume = 0.4; // Etwas leiser, damit es im Hintergrund bleibt
    bgAudio.play().catch(e => console.log("Musik-Autoplay blockiert"));
  }

        showView("ui-run");
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("audioContainer").innerHTML = "";
    
    // ZUSÄTZLICH EINFÜGEN: Kreis für neue Runde verstecken
    const bBox = $("breathBox");
    if (bBox) {
        bBox.style.display = "none";
        bBox.style.opacity = "0";
    }


    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", s.ankommenText);
    await sleep(1000);

    // 2. EINBLICK
    if (s.erklaerungText) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", s.erklaerungText);
      await sleep(1000);
    }

    // ATEM-GUIDE (für bestimmte Situationen)
    if ([1, 2, 10].includes(n)) {
      softScroll();
      await sleep(1000); 
    }

    // 3. KRAFTSÄTZE
    if (s.affirmations) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", s.affirmations);
      await sleep(1000);
    }

    // 4. MINI-RITUAL
    if (s.ritual) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", s.ritual);
      await sleep(1000);
    }

    // 5. ABSCHLUSS & GESUNGENE AFFIRMATION
    if (s.songOutro) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", s.songOutro);
      
      if(s.songFile) {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.style.marginTop = "25px";
        btn.innerHTML = "<span>🎵 Gesungene Affirmation hören</span>";
                btn.onclick = () => {
          const audio = new Audio(s.songFile);
          audio.play();
          btn.disabled = true;
          btn.innerHTML = "<span>Wird abgespielt...</span>";

          // NEU: Lyrics Box finden und befüllen
          const lBox = document.getElementById("lyricsBox");
          const lCont = document.getElementById("lyricsContent");
          if (lBox && lCont && s.lyrics) {
            lBox.style.display = "block";
            lCont.innerText = s.lyrics;
            softScroll(); // Scrollt sanft nach unten, damit man den Text sieht
          }
        };

        $("audioContainer").appendChild(btn);
        softScroll();
      }
    }
  }

  // --- Startseite ---
    // Event Listener für den Impuls-Wechsel
  $("btnImpuls").onclick = async () => {
    const el = $("impuls");
    el.style.opacity = "0"; 
    await sleep(500);
    el.textContent = impulses[Math.floor(Math.random() * impulses.length)];
    el.style.opacity = "1";
  };


  $("btnContinue").onclick = () => showView("ui-chooser");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick = () => location.reload();

  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }
  
    // Diese Funktion steuert den Textwechsel im Atemkreis
  function startBreathingText() {
    const label = $("breathLabel");
    if (!label) return;

    const colorEin = "#0056b3"; // Barrierefreies Blau
    const colorAus = "#2d5a27"; // Barrierefreies Grün

    const updateText = () => {
      label.textContent = "EIN";
      label.style.color = colorEin;
      
      setTimeout(() => {
        label.textContent = "AUS";
        label.style.color = colorAus;
      }, 4000); // Wechsel nach 4 Sekunden
    };

    updateText();
    setInterval(updateText, 8000); // Gesamtrhythmus 8 Sekunden
  }

});
