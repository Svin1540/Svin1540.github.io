const streakKey = "randomStreak";

// =========================
// INIT
// =========================
function initMode() {
  target = getRandomTarget(data);
  hideNewRoundButton();
}

// =========================
// RANDOM MODE
// =========================

function getStorageKey() {
  return "guesses_random";
}

function getRandomTarget(data) {
  const seed = getOrCreateRandomSeed();
  return data[seed];
}

function getOrCreateRandomSeed() {
  let seed = localStorage.getItem("randomSeed");

  if (seed === null || seed >= allowedCharLength) {
    seed = Math.floor(Math.random() * allowedCharLength);
    localStorage.setItem("randomSeed", seed);
  }

  return parseInt(seed);
}

// =========================
// RANDOM STREAK
// =========================

function handleModeWin() {
  if (!localStorage.getItem("isRandomWin")) {
    updateStreak(true);
    localStorage.setItem("isRandomWin", true);
  }

  showNewRoundButton();
}

function handleModeLoss() {
  showNewRoundButton();
  updateStreak(false);
  localStorage.setItem("isRandomWin", true);
}

// =========================
// RANDOM GAME CONTROL
// =========================

function newRound() {
  localStorage.removeItem("randomSeed");
  localStorage.removeItem("guesses_random");
  localStorage.removeItem("isRandomWin");
  localStorage.removeItem("randomPlayed");

  target = getRandomTarget(data);

  document.getElementById("result").innerHTML = `
    <tr>
      <th>Image</th>
      <th>Name</th>
      <th>Height</th>
      <th>Debut</th>
      <th>Birthday</th>
      <th>Branch</th>
    </tr>
  `;

  hasWon = false;
  hasPlayed = false;
  selected = null;
  guessCount = 0;

  searchInput.disabled = false;
  searchInput.value = "";

  hideNewRoundButton();
  resetTopPanel();
}

// =========================
// RANDOM UI
// =========================

function showNewRoundButton() {
  document.getElementById("new-round-btn").classList.remove("hidden");
  document.getElementById("new-round-btn").focus();
}

function hideNewRoundButton() {
  document.getElementById("new-round-btn").classList.add("hidden");
}

// =========================
// SEEDLOCK
// =========================

function checkSeedLock() {
  if (!localStorage.getItem("randomPlayed")) {
    currentConfigKey = localStorage.getItem(configKey);
  } else {
    currentConfigKey = localStorage.getItem("randomConfig");
  }
}

function setPlayed() {
  localStorage.setItem("randomPlayed", true);
  localStorage.setItem("randomConfig", currentConfigKey);
}