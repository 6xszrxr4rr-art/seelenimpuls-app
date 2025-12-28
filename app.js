document.addEventListener("DOMContentLoaded", () => {

  const impulses = [
    "Atme tief ein. Du musst heute nichts halten.",
    "Du darfst langsamer sein.",
    "Dein Herz kennt den Weg.",
    "Alles darf leicht sein."
  ];

  const btnImpuls = document.getElementById("btnImpuls");
  const btnSituation1 = document.getElementById("btnSituation1");
  const impulsText = document.getElementById("impuls");
  const block1 = document.getElementById("block1");
  const text1 = document.getElementById("text1");

  if (!btnImpuls || !btnSituation1) {
    alert("Button fehlt im HTML");
    return;
  }

  // 🔹 Impuls
  btnImpuls.addEventListener("click", () => {
    const i = Math.floor(Math.random() * impulses.length);
    impulsText.textContent = impulses[i];
  });

  // 🔹 Situation
  btnSituation1.addEventListener("click", () => {
    block1.classList.remove("hidden");
    text1.textContent =
      "Du bist hier. Dein Körper darf ankommen. Nichts muss jetzt gelöst werden.";
  });

});
