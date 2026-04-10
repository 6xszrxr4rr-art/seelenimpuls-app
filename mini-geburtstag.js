window.GEBURTSTAG = (function () {
  const songs = [
    {
      id: "mann-klassisch",
      label: "🎩 Für den Mann – Klassisch",
      hint: "Warm & herzlich",
      lyrics: `Heute ist dein großer Tag, [NAME],
ein Tag, der nach dir ruft.
Du trägst das Jahr mit Würde –
und noch viel mehr, das weißt du selbst.

Alles Gute, lieber [NAME],
möge dieses Jahr dir schenken,
was dein Herz sich heimlich wünscht
und was du selten denkst.

Prost auf dich, auf [NAME] –
der die Welt ein bisschen besser macht.
Herzlichen Glückwunsch! 🥂`
    },
    {
      id: "frau-romantisch",
      label: "🌸 Für die Frau – Romantisch",
      hint: "Zart & gefühlvoll",
      lyrics: `Es gibt einen Menschen, der leuchtet –
und dieser Mensch bist du, [NAME].
Heute zünden wir Kerzen für dich
und feiern alles, was du bist.

Herzlichen Glückwunsch, liebe [NAME],
du machst das Leben schöner.
Möge heute alles stimmen –
für dich, die Strahlendste.

Auf dich, auf [NAME], auf diesen Tag –
der ganz allein dir gehört. 🌸`
    },
    {
      id: "kind-froelich",
      label: "🎈 Für ein Kind – Fröhlich",
      hint: "Bunt & energiegeladen",
      lyrics: `Hipp hipp hurra! Wer hat denn heut Geburtstag?
Na klar, das bist du – [NAME]!
Einmal, zweimal, dreimal hoch –
[NAME] lebe hoch, lebe hoch, lebe hoch!

Du bist jetzt ein Jahr größer,
ein Jahr klüger, ein Jahr cooler!
Herzlichen Glückwunsch, kleiner [NAME] –
heute ist dein Tag! Feier ihn! 🎉`
    },
    {
      id: "angeber-witzig",
      label: "😎 Für den Angeber – Witzig",
      hint: "Frech & selbstironisch",
      lyrics: `Wer ist der Beste? Natürlich – [NAME]!
Wer ist der Schönste? Ja, [NAME]!
Wer ist bescheiden? Na ja... nicht ganz –
aber das macht [NAME] auch so toll!

Herzlichen Glückwunsch, du Star!
Heute darfst du es noch lauter sagen.
[NAME] – die Welt dreht sich um dich,
zumindest heute. Geniess es! 😄`
    },
    {
      id: "jubilaeeum-feierlich",
      label: "🥂 Jubiläum – Feierlich",
      hint: "Würdevoll & festlich",
      lyrics: `Heute feiern wir [NAME] –
und all das, was entstanden ist.
Jahre kommen, Jahre gehen,
doch [NAME] bleibt – und das ist gut.

Ein Hoch auf diesen besonderen Tag,
auf [NAME] und auf alles Schöne.
Herzlichen Glückwunsch zum Jubiläum –
möge noch vieles folgen! 🥂`
    }
  ];

  function init() {
    const container = document.getElementById("geburtstag-song-container");
    if (!container) return;

    let selectedSong = null;

    container.innerHTML = `
      <div class="block">
        <div class="block-header">🎂 Anlass & Stil wählen</div>
        <div id="gb-song-list" style="display:flex;flex-direction:column;gap:12px;"></div>
      </div>
      <div class="block" id="gb-name-block" style="display:none;">
        <div class="block-header">✍️ Name eingeben</div>
        <input type="text" id="gb-name-input" placeholder="Name..."
          style="width:100%;padding:16px;font-size:20px;border:1px solid #e0e0e0;border-radius:14px;outline:none;font-family:inherit;box-sizing:border-box;" />
        <button class="btn-primary" id="gb-generate-btn" style="margin-top:15px;">Liedtext anzeigen ✨</button>
      </div>
      <div id="gb-result-block"></div>
    `;

    const list = document.getElementById("gb-song-list");
    songs.forEach(song => {
      const btn = document.createElement("button");
      btn.className = "situationBtn";
      btn.style.marginBottom = "0";
      btn.innerHTML = `<span class="headline">${song.label}</span><span class="hint">${song.hint}</span>`;
      btn.onclick = () => {
        document.querySelectorAll("#gb-song-list .situationBtn").forEach(b => {
          b.style.background = "";
          b.style.borderColor = "";
        });
        btn.style.background = "rgba(74,144,226,0.12)";
        btn.style.borderColor = "#4a90e2";
        selectedSong = song;
        const nameBlock = document.getElementById("gb-name-block");
        nameBlock.style.display = "block";
        nameBlock.scrollIntoView({ behavior: "smooth" });
      };
      list.appendChild(btn);
    });

    document.getElementById("gb-generate-btn").onclick = () => {
      const nameInput = document.getElementById("gb-name-input");
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.style.borderColor = "#e74c3c";
        nameInput.focus();
        return;
      }
      showResult(selectedSong, name);
    };
  }

  function showResult(song, name) {
    if (!song || !name) return;
    const lyrics = song.lyrics.replace(/\[NAME\]/g, name);
    const resultBlock = document.getElementById("gb-result-block");
    resultBlock.innerHTML = `
      <div class="block" style="border:2px solid rgba(74,144,226,0.3);background:rgba(74,144,226,0.04);">
        <div class="block-header">🎵 Für ${name}</div>
        <div style="white-space:pre-wrap;font-size:17px;line-height:1.9;color:#2c3e50;font-style:italic;">${lyrics}</div>
        <div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap;">
          <button id="gb-share-btn" class="btn-primary" style="flex:1;font-size:17px;padding:16px;">📤 Teilen</button>
          <button id="gb-copy-btn" style="flex:1;padding:16px;border-radius:20px;border:1px solid #4a90e2;background:white;color:#4a90e2;font-size:17px;cursor:pointer;font-family:inherit;">📋 Kopieren</button>
        </div>
        <button id="gb-new-btn" style="width:100%;margin-top:12px;padding:15px;border-radius:20px;border:1px solid #d0d0d0;background:none;color:#718096;font-size:16px;cursor:pointer;font-family:inherit;">← Anderen Stil wählen</button>
      </div>
    `;
    resultBlock.scrollIntoView({ behavior: "smooth" });

    document.getElementById("gb-share-btn").onclick = async () => {
      const shareText = `Für ${name} 🎂\n\n${lyrics}\n\n– Erstellt mit Seelenimpuls`;
      if (navigator.share) {
        try { await navigator.share({ text: shareText }); } catch (e) {}
      } else {
        await navigator.clipboard?.writeText(shareText);
        const btn = document.getElementById("gb-share-btn");
        if (btn) { btn.textContent = "✅ Kopiert!"; setTimeout(() => { btn.textContent = "📤 Teilen"; }, 2000); }
      }
    };

    document.getElementById("gb-copy-btn").onclick = async () => {
      await navigator.clipboard?.writeText(`Für ${name}:\n\n${lyrics}`);
      const btn = document.getElementById("gb-copy-btn");
      if (btn) { btn.textContent = "✅ Kopiert!"; setTimeout(() => { btn.textContent = "📋 Kopieren"; }, 2000); }
    };

    document.getElementById("gb-new-btn").onclick = () => {
      resultBlock.innerHTML = "";
      document.querySelectorAll("#gb-song-list .situationBtn").forEach(b => {
        b.style.background = "";
        b.style.borderColor = "";
      });
      document.getElementById("gb-name-block").style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  return { init };
})();
