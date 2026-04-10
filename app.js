document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const SPEED = 85;
  let lang = "de";
  let breathInterval = null;
  let bgAudio = null;

  const impulses = {
    de: [
      "Atme tief ein. Du darfst gehalten sein.",
      "Du darfst langsam sein.",
      "Dein Herz kennt den Weg.",
      "Alles darf leicht werden.",
      "Du darfst in Sicherheit ankommen."
    ],
    en: [
      "Breathe deeply in. You may be held.",
      "You may be slow.",
      "Your heart knows the way.",
      "Everything may become light.",
      "You may arrive in safety."
    ]
  };

  const ui = {
    de: {
      btnImpuls: "Neuer Impuls",
      btnContinue: "Situation wählen",
      btnBack: "Zurück",
      btnBackBottom: "ÜBUNG BEENDEN",
      impulsStart: "Atme tief ein.",
      headers: {
        b1: "🌿 Ankommen",
        b2: "💡 Einblick",
        b3: "✨ Kraftsätze",
        b4: "🌙 Mini-Ritual",
        b5: "🎶 Abschluss"
      },
      breathLabels: { ein: "EIN", aus: "AUS" },
      songBtn: "🎵 Gesungene Affirmation hören",
      songPlaying: "Wird abgespielt..."
    },
    en: {
      btnImpuls: "New Impulse",
      btnContinue: "Choose a Situation",
      btnBack: "Back",
      btnBackBottom: "END EXERCISE",
      impulsStart: "Breathe deeply in.",
      headers: {
        b1: "🌿 Arriving",
        b2: "💡 Insight",
        b3: "✨ Power Phrases",
        b4: "🌙 Mini Ritual",
        b5: "🎶 Closing"
      },
      breathLabels: { ein: "IN", aus: "OUT" },
      songBtn: "🎵 Listen to Sung Affirmation",
      songPlaying: "Playing..."
    }
  };

  function setLang(newLang) {
    lang = newLang;

    $("lang-de").classList.toggle("active", lang === "de");
    $("lang-en").classList.toggle("active", lang === "en");

    // Alle data-de / data-en Elemente aktualisieren
    document.querySelectorAll("[data-de]").forEach(el => {
      el.textContent = el.getAttribute("data-" + lang);
    });

    // Feste UI-Elemente
    const t = ui[lang];
    $("btnImpuls").textContent = t.btnImpuls;
    $("btnContinue").textContent = t.btnContinue;
    $("btnBackFromChooser").textContent = t.btnBack;
    $("btnBackBottom").textContent = t.btnBackBottom;

    // Startimpuls zurücksetzen wenn noch Standardtext
    const impulsEl = $("impuls");
    if (
      impulsEl.textContent === ui.de.impulsStart ||
      impulsEl.textContent === ui.en.impulsStart
    ) {
      impulsEl.textContent = t.impulsStart;
    }
  }

  function showView(viewId) {
    ["ui-home", "ui-chooser", "ui-run", "ui-geburtstag", "ui-tier-orakel"].forEach(id => $(id).classList.add("hidden"));
    $(viewId).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function softScroll() {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 150);
  }

  async function typeEffect(id, text) {
    const el = $(id);
    if (!el) return;

    el.innerHTML = `<span style="opacity:0">${text}</span>`;
    const visibleLayer = document.createElement("span");
    visibleLayer.style.position = "absolute";
    visibleLayer.style.left = "0";
    visibleLayer.style.top = "0";
    el.appendChild(visibleLayer);

    let current = "";
    for (let char of text) {
      current += char;
      visibleLayer.textContent = current;

      const lower = current.toLowerCase();
      if (lower.includes("atme") || lower.includes("breath")) {
        const box = document.getElementById("breathBox");
        if (box && getComputedStyle(box).display === "none") {
          box.style.display = "block";
          box.style.opacity = "0";
          setTimeout(() => {
            box.style.transition = "opacity 2s ease-in-out";
            box.style.opacity = "1";
            startBreathingText();
          }, 50);
        }
      }

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

      li.innerHTML = `<span style="opacity:0">${item}</span>`;
      const vis = document.createElement("span");
      vis.style.position = "absolute";
      vis.style.left = "35px";
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

    // Sprachabhängiges Feld auslesen (EN wenn vorhanden, sonst DE)
    const t = (field) => (lang === "en" && s[field + "_en"]) ? s[field + "_en"] : s[field];
    const headers = ui[lang].headers;

    if (breathInterval) {
      clearInterval(breathInterval);
      breathInterval = null;
    }
    if (bgAudio) {
      bgAudio.pause();
      bgAudio = null;
    }

    bgAudio = new Audio("audio/stillness-space.mp3");
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
    bgAudio.play().catch(() => {});

    showView("ui-run");
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => $(id).classList.add("hidden"));
    $("audioContainer").innerHTML = "";

    const bBox = $("breathBox");
    if (bBox) {
      bBox.style.display = "none";
      bBox.style.opacity = "0";
    }

    // Block-Header sprachabhängig setzen
    ["b1", "b2", "b3", "b4", "b5"].forEach(id => {
      $(id).querySelector(".block-header").textContent = headers[id];
    });

    // 1. ANKOMMEN
    $("b1").classList.remove("hidden");
    await typeEffect("t1", t("ankommenText"));
    await sleep(1000);

    // 2. EINBLICK
    if (t("erklaerungText")) {
      $("b2").classList.remove("hidden");
      await typeEffect("t2", t("erklaerungText"));
      await sleep(1000);
    }

    // ATEM-GUIDE
    if ([1, 2, 10].includes(n)) {
      softScroll();
      await sleep(1000);
    }

    // 3. KRAFTSÄTZE / POWER PHRASES
    if (t("affirmations")) {
      $("b3").classList.remove("hidden");
      await typeListEffect("t3", t("affirmations"));
      await sleep(1000);
    }

    // 4. MINI-RITUAL
    if (t("ritual")) {
      $("b4").classList.remove("hidden");
      await typeListEffect("t4", t("ritual"));
      await sleep(1000);
    }

    // 5. ABSCHLUSS
    if (t("songOutro")) {
      $("b5").classList.remove("hidden");
      await typeEffect("t5", t("songOutro"));

      if (s.songFile) {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.style.marginTop = "25px";
        btn.innerHTML = `<span>${ui[lang].songBtn}</span>`;
        btn.onclick = () => {
          const audio = new Audio(s.songFile);
          audio.play();
          btn.disabled = true;
          btn.innerHTML = `<span>${ui[lang].songPlaying}</span>`;

          const lBox = document.getElementById("lyricsBox");
          const lCont = document.getElementById("lyricsContent");
          if (lBox && lCont && s.lyrics) {
            lBox.style.display = "block";
            lCont.innerText = s.lyrics;
            softScroll();
          }
        };
        $("audioContainer").appendChild(btn);
        softScroll();
      }
    }
  }

  // --- Startseite ---
  $("btnImpuls").onclick = async () => {
    const el = $("impuls");
    el.style.opacity = "0";
    await sleep(500);
    const list = impulses[lang];
    el.textContent = list[Math.floor(Math.random() * list.length)];
    el.style.opacity = "1";
  };

  $("lang-de").onclick = () => setLang("de");
  $("lang-en").onclick = () => setLang("en");

  $("btnContinue").onclick = () => showView("ui-chooser");

  $("btnGoGeburtstag").onclick = () => {
    showView("ui-geburtstag");
    if (window.GEBURTSTAG) window.GEBURTSTAG.init();
  };

  $("btnGoTierOrakel").onclick = () => {
    showView("ui-tier-orakel");
    if (window.TIER_ORAKEL) window.TIER_ORAKEL.init();
  };

  $("btnBackGeburtstag").onclick = () => showView("ui-home");
  $("btnBackTierOrakel").onclick = () => showView("ui-home");
  $("btnBackFromChooser").onclick = () => showView("ui-home");
  $("btnBackBottom").onclick = () => {
    if (breathInterval) {
      clearInterval(breathInterval);
      breathInterval = null;
    }
    if (bgAudio) {
      bgAudio.pause();
      bgAudio = null;
    }
    showView("ui-home");
  };

  for (let i = 1; i <= 10; i++) {
    const btn = $("btnSituation" + i);
    if (btn) btn.onclick = () => runSituation(i);
  }

  function startBreathingText() {
    const label = $("breathLabel");
    if (!label) return;

    const colorEin = "#0056b3";
    const colorAus = "#2d5a27";

    const updateText = () => {
      label.textContent = ui[lang].breathLabels.ein;
      label.style.color = colorEin;
      setTimeout(() => {
        label.textContent = ui[lang].breathLabels.aus;
        label.style.color = colorAus;
      }, 4000);
    };

    updateText();
    breathInterval = setInterval(updateText, 8000);
  }

});
