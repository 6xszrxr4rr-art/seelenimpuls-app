window.TIER_ORAKEL = (function () {
  const tiere = {
    schmetterling: {
      name: "Schmetterling", emoji: "🦋",
      bedeutung: "Transformation · Leichtigkeit · Neubeginn",
      botschaft: "Du stehst mitten in einer Verwandlung. Der Schmetterling erscheint, wenn die Seele bereit ist, ihre alte Hülle loszulassen und in etwas Größeres hineinzuwachsen. Was war, darf vergehen.",
      buchhinweis: "Deine Seele kennt den Weg der Verwandlung. Vertraue dem Prozess.",
      ritual: [
        "Schreibe auf, was du loslassen möchtest – und zerreisse oder verbrenne das Papier bewusst.",
        "Trage heute eine Farbe, die dich leicht und inspiriert fühlen lässt.",
        "Atme dreimal tief ein und stelle dir vor, wie Flügel deine Schultern heben."
      ]
    },
    biene: {
      name: "Biene", emoji: "🐝",
      bedeutung: "Gemeinschaft · Fleiß · Süße des Lebens",
      botschaft: "Die Biene erinnert dich an die Kraft der Gemeinschaft und deine eigene Süße. Du bist gerufen, deine Gaben zu teilen – und dabei deinen eigenen Rhythmus zu finden.",
      buchhinweis: "Wie die Biene weißt du, was dir Kraft gibt. Kehre zu deiner Mitte zurück.",
      ritual: [
        "Genieße heute etwas Süßes bewusst und mit voller Aufmerksamkeit.",
        "Schreibe drei Gaben auf, die du in die Welt trägst.",
        "Summe oder singe einen Ton – lass deine Stimme schwingen."
      ]
    },
    wolf: {
      name: "Wolf", emoji: "🐺",
      bedeutung: "Instinkt · Wildheit · Treue · innere Wahrheit",
      botschaft: "Der Wolf erscheint, wenn deine Wildheit und dein Instinkt gebraucht werden. Du hast ein tiefes Wissen in dir – vertraue ihm, auch wenn die anderen es nicht sehen.",
      buchhinweis: "Der Wolf in dir kennt den Weg. Er braucht keinen Beweis.",
      ritual: [
        "Gehe heute allein in die Natur und sei mit dir.",
        "Schreibe auf, was dein Instinkt dir schon lange sagen will.",
        "Lass die Emotion raus, die du zurückgehalten hast."
      ]
    },
    adler: {
      name: "Adler", emoji: "🦅",
      bedeutung: "Überblick · Vision · Klarheit · Freiheit",
      botschaft: "Der Adler gibt dir Überblick. Steige heraus aus dem Gewirr des Alltags – du bist dazu berufen, die Dinge aus der Vogelperspektive zu sehen.",
      buchhinweis: "Von oben sieht alles kleiner aus. Du kannst den Überblick wählen.",
      ritual: [
        "Geh an einen erhöhten Ort – physisch Überblick gewinnen.",
        "Frage dich: Wie würde ich diese Situation aus der Distanz betrachten?",
        "Visualisiere, wie du hoch über deiner Situation schwebst – ruhig und klar."
      ]
    },
    katze: {
      name: "Katze", emoji: "🐱",
      bedeutung: "Unabhängigkeit · Intuition · Selbstfürsorge · Grenzen",
      botschaft: "Die Katze erinnert dich an deine Eigenständigkeit und dein Recht auf Grenzen. Du darfst wählerisch sein. Du darfst Nein sagen. Du darfst dich zurückziehen.",
      buchhinweis: "Wie die Katze weißt du, was dir gut tut. Hör auf dieses Wissen.",
      ritual: [
        "Gib dir heute eine Stunde vollständig für dich allein – keine Verpflichtungen.",
        "Beobachte etwas ruhig und aufmerksam, ohne einzugreifen.",
        "Strecke deinen Körper bewusst – lang und vollständig, wie eine Katze beim Aufwachen."
      ]
    },
    hund: {
      name: "Hund", emoji: "🐕",
      bedeutung: "Treue · Freundschaft · Vertrauen · Loyalität",
      botschaft: "Der Hund steht für bedingungslose Treue – zuerst zu dir selbst. Bist du dir selbst ein guter Freund? Er erinnert dich auch, wem du vertrauen darfst.",
      buchhinweis: "Sei dir selbst der beste Freund, den du dir wünschen kannst.",
      ritual: [
        "Tue heute etwas für dich, das du einem guten Freund gerne tun würdest.",
        "Danke einem Menschen, der dir treu ist.",
        "Gehe spazieren – einfach so, ohne Ziel."
      ]
    },
    rabe: {
      name: "Rabe", emoji: "🪶",
      bedeutung: "Wahrheit · Wandel · Magie · Verborgenes",
      botschaft: "Der Rabe ist Bote des Wandels. Er erscheint, wenn verborgene Wahrheiten an die Oberfläche drängen. Schau hin, was du lieber nicht sehen wolltest.",
      buchhinweis: "Der Rabe zeigt, was hinter dem Schleier wartet. Schau mutig hin.",
      ritual: [
        "Schreibe im freien Fluss – was kommt, wenn du die Kontrolle loslässt?",
        "Sitze in der Dämmerung und beobachte den Übergang von Licht zu Dunkel.",
        "Frage dich ehrlich: Was verdränge ich gerade?"
      ]
    },
    fuchs: {
      name: "Fuchs", emoji: "🦊",
      bedeutung: "Klugheit · Anpassung · Kreativität · Spielfreude",
      botschaft: "Der Fuchs ruft deine Cleverness und Anpassungsfähigkeit auf. Du besitzt mehr Weisheit, als du glaubst. Vertraue deinem Witz und deiner Beweglichkeit.",
      buchhinweis: "Deine Intelligenz ist dein Geschenk. Nutze sie mit Leichtigkeit.",
      ritual: [
        "Beobachte eine Situation heute mit spielerischer Neugierde statt mit Ernst.",
        "Frage dich: Welche kreative Lösung habe ich noch nicht in Betracht gezogen?",
        "Bewege dich heute leicht – und lass einen schweren Gedanken los."
      ]
    },
    kaefer: {
      name: "Käfer", emoji: "🐞",
      bedeutung: "Beharrlichkeit · Achtsamkeit · das Kleine · Stärke",
      botschaft: "Der Käfer – klein und mächtig – erinnert dich daran, dass auch das Unscheinbare bedeutsam ist. Er steht für Beharrlichkeit und die Kraft, Lasten leicht zu tragen.",
      buchhinweis: "Das Kleine ist nicht unwichtig. Der Käfer weiß das.",
      ritual: [
        "Schau genau hin: Was in deinem Alltag verdient mehr Aufmerksamkeit?",
        "Wähle bewusst, eine Aufgabe leicht zu nehmen – nicht schwerer als nötig.",
        "Beobachte in der Natur etwas Kleines mit voller Aufmerksamkeit."
      ]
    },
    eule: {
      name: "Eule", emoji: "🦉",
      bedeutung: "Weisheit · Intuition · Nacht · inneres Wissen",
      botschaft: "Die Eule bringt Weisheit und die Fähigkeit, im Dunkeln zu sehen. Wenn sie dir begegnet, ist es Zeit, auf deine innere Stimme zu hören – sie weiß mehr als dein Verstand.",
      buchhinweis: "Deine Seele weiß. Die Eule erinnert dich daran, zuzuhören.",
      ritual: [
        "Sitze in Stille und stelle deiner inneren Stimme eine Frage. Warte auf die Antwort.",
        "Schreibe in der Dämmerung oder Nacht – dieser Moment gehört der Weisheit.",
        "Schau in den Spiegel und frage: Was siehst du wirklich?"
      ]
    },
    hirsch: {
      name: "Hirsch", emoji: "🦌",
      bedeutung: "Würde · Sanftheit · Stärke · Anmut",
      botschaft: "Der Hirsch steht für Würde, Sanftheit und innere Stärke. Er ruft dich, aufrecht zu gehen – mit Herz und Haltung, ohne dich klein zu machen.",
      buchhinweis: "Du darfst groß sein und sanft zugleich. Der Hirsch zeigt es dir.",
      ritual: [
        "Richte dich körperlich auf – Schultern zurück, Kopf hoch. Fühle deine Würde.",
        "Sprich heute mit sanfter Stimme, auch wenn du es mit Nachdruck meinst.",
        "Gehe in der Natur aufrecht und bewusst."
      ]
    },
    schlange: {
      name: "Schlange", emoji: "🐍",
      bedeutung: "Häutung · Heilung · Urkraft · Erneuerung",
      botschaft: "Die Schlange ist Urkraft und Heilerin. Wenn sie erscheint, steht Häutung bevor – ein Loslassen des Alten, damit das Neue wachsen kann.",
      buchhinweis: "Die Schlange häutet sich, ohne Angst vor dem Neuen. Du auch.",
      ritual: [
        "Was ist 'alte Haut' in deinem Leben? Schreibe es auf und lass es bewusst los.",
        "Bewege deinen Körper fließend – Yoga, Tanzen, wellenartige Bewegungen.",
        "Trinke viel Wasser heute – reinige dich von innen."
      ]
    },
    pferd: {
      name: "Pferd", emoji: "🐴",
      bedeutung: "Freiheit · Kraft · Bewegung · Bestimmung",
      botschaft: "Das Pferd ruft deine innere Freiheit und Kraft. Es ist Zeit, alte Einschränkungen abzuschütteln und dich frei zu bewegen – deiner eigenen Bestimmung entgegen.",
      buchhinweis: "Das Pferd rennt, weil es kann. Du auch.",
      ritual: [
        "Laufe heute – schnell, frei, ohne Ziel.",
        "Frage dich: Wo halte ich mich selbst zurück?",
        "Lass etwas los, das dich einsperrt – ein Glaubenssatz, eine Gewohnheit."
      ]
    },
    frosch: {
      name: "Frosch", emoji: "🐸",
      bedeutung: "Reinigung · Emotionen · Übergang · Erneuerung",
      botschaft: "Der Frosch lebt zwischen den Welten – Wasser und Land, Gefühl und Realität. Er erscheint, wenn Reinigung und emotionale Erneuerung gefragt sind.",
      buchhinweis: "Das Wasser wäscht alles fort, was nicht mehr dir gehört.",
      ritual: [
        "Nimm ein bewusstes Bad oder eine lange Dusche – lass das Wasser alles abwaschen.",
        "Schreibe, was du emotional loslassen möchtest.",
        "Wage heute einen Schritt, den du aufgeschoben hast."
      ]
    },
    loewe: {
      name: "Löwe", emoji: "🦁",
      bedeutung: "Mut · Herzfeuer · Führung · Würde",
      botschaft: "Der Löwe ruft dein Herzfeuer und deinen Mut. Steh zu deiner Meinung. Steh zu dir. Zeig dich in deiner vollen Größe, ohne dich zu entschuldigen.",
      buchhinweis: "Dein Mut ist dein Geschenk an die Welt. Zeig ihn.",
      ritual: [
        "Sage heute laut etwas, das du bisher nicht aussprechen konntest.",
        "Tue eine Sache mit voller Überzeugung – ohne Entschuldigung.",
        "Begrüße den Morgen bewusst: Stehe auf und recke dich in die Welt hinein."
      ]
    }
  };

  const keywords = {
    schmetterling: ["schmetterling", "falter"],
    biene: ["biene", "bienen", "hummel"],
    wolf: ["wolf", "wölfe", "wölfen"],
    adler: ["adler", "falke", "greifvogel"],
    katze: ["katze", "kater", "kätzchen"],
    hund: ["hund", "hunde", "welpe"],
    rabe: ["rabe", "raben", "krähe", "krähen"],
    fuchs: ["fuchs", "füchse"],
    kaefer: ["käfer", "kaefer", "marienkäfer"],
    eule: ["eule", "uhu"],
    hirsch: ["hirsch", "reh", "rehkitz"],
    schlange: ["schlange", "schlangen"],
    pferd: ["pferd", "pferde"],
    frosch: ["frosch", "frösche", "kröte"],
    loewe: ["löwe", "löwen"]
  };

  function findAnimal(text) {
    const lower = text.toLowerCase();
    for (const [key, words] of Object.entries(keywords)) {
      if (words.some(w => lower.includes(w))) return tiere[key];
    }
    return null;
  }

  function init() {
    const container = document.getElementById("tier-orakel-container");
    if (!container) return;

    container.innerHTML = `
      <div class="block">
        <div class="block-header">🌿 Beschreibe dein Erlebnis</div>
        <p style="color:#7f8c8d;font-size:15px;margin-top:0;">Welchem Tier bist du begegnet? Beschreibe kurz die Situation.</p>
        <textarea id="to-input" placeholder="z.B. Heute morgen saß ein Käfer auf meiner Fensterbank..."
          style="width:100%;min-height:110px;padding:16px;font-size:17px;border:1px solid #e0e0e0;border-radius:14px;outline:none;font-family:inherit;resize:vertical;box-sizing:border-box;line-height:1.5;"></textarea>
        <button class="btn-primary" id="to-btn" style="margin-top:15px;">Botschaft empfangen ✨</button>
      </div>
      <div id="to-result"></div>
    `;

    document.getElementById("to-btn").onclick = () => {
      const input = document.getElementById("to-input");
      const text = input.value.trim();
      if (!text) { input.style.borderColor = "#e74c3c"; input.focus(); return; }
      input.style.borderColor = "#e0e0e0";
      showResult(findAnimal(text));
    };
  }

  function showResult(tier) {
    const result = document.getElementById("to-result");

    if (!tier) {
      result.innerHTML = `
        <div class="block" style="text-align:center;">
          <div style="font-size:40px;margin-bottom:15px;">🔍</div>
          <p style="font-size:17px;color:#7f8c8d;">Das Tier konnte ich noch nicht erkennen. Nenne es direkt – z.B. "Schmetterling", "Eule", "Wolf", "Käfer"…</p>
          <button class="btn-primary" id="to-retry" style="margin-top:10px;">Nochmal versuchen</button>
        </div>
      `;
      document.getElementById("to-retry").onclick = () => {
        result.innerHTML = "";
        const input = document.getElementById("to-input");
        input.value = "";
        input.focus();
      };
      return;
    }

    const ritualItems = tier.ritual.map(r => `<li>${r}</li>`).join("");

    result.innerHTML = `
      <div class="block" style="text-align:center;border:2px solid rgba(74,144,226,0.2);">
        <div style="font-size:64px;margin-bottom:10px;">${tier.emoji}</div>
        <div style="font-size:26px;font-weight:bold;color:#2c3e50;margin-bottom:6px;">${tier.name}</div>
        <div style="font-size:13px;letter-spacing:1.5px;color:#4a90e2;text-transform:uppercase;">${tier.bedeutung}</div>
      </div>
      <div class="block">
        <div class="block-header">💌 Botschaft für dich</div>
        <p style="font-size:18px;line-height:1.8;color:#2c3e50;">${tier.botschaft}</p>
        <div style="margin-top:18px;padding:16px;background:rgba(74,144,226,0.07);border-radius:14px;border-left:3px solid #4a90e2;">
          <p style="margin:0;font-style:italic;color:#4a90e2;font-size:16px;">"${tier.buchhinweis}"</p>
        </div>
      </div>
      <div class="block">
        <div class="block-header">🌙 Dein Mini-Ritual</div>
        <ul>${ritualItems}</ul>
        <button id="to-new-btn" style="width:100%;margin-top:15px;padding:15px;border-radius:20px;border:1px solid #d0d0d0;background:none;color:#718096;font-size:16px;cursor:pointer;font-family:inherit;">← Neues Tier befragen</button>
      </div>
    `;

    document.getElementById("to-new-btn").onclick = () => {
      result.innerHTML = "";
      const input = document.getElementById("to-input");
      input.value = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    result.scrollIntoView({ behavior: "smooth" });
  }

  return { init };
})();
