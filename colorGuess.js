// =========================
// GLOBAL STATE
// =========================
const isRandomMode = window.location.pathname.includes("random.html");

let data = [];
let target;
let selected = null;
let hasWon = false;

let highlightedIndex = 0;
let filteredList = [];

let guessCount = 0;
let maxTries = 6;

// =========================
// SETTINGS
// =========================
const defaultSettings = {
  unlimitedTry: false,
  hint: false
};

let settings = { ...defaultSettings };

// =========================
// DOM REFERENCES
// =========================
const optionsDiv = document.getElementById("options");
const searchInput = document.getElementById("search");
const modal = document.getElementById("settings-modal");
const targetColor = document.getElementById("color-box");

// =========================
// INIT
// =========================
function initGame() {
  if (isRandomMode) {
    const seed = getOrCreateRandomSeed();
    hideNewRoundButton();
    target = data[seed];
    targetColor.style.backgroundColor = target.color;
  } else {
    target = getDailyTarget(data);
    targetColor.style.backgroundColor = target.color;
  }

  loadStreak();

  if (!isRandomMode) startTimer();

  loadGuesses();
  renderList(data);
}

// =========================
// DATA FETCH
// =========================
fetch("data_color.json")
  .then(res => {
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  })
  .then(json => {
    console.log("Loaded via fetch");
    data = json;
    initGame();
  })
  .catch(err => {
    console.warn("Fetch failed", err);
    data = null
  });

// =========================
// RANDOM / DAILY LOGIC
// =========================
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function seededRandom(seed) {
  const x = Math.cos(seed) * 10000;
  return x - Math.floor(x);
}

function getDailyTarget(data) {
  const seed = parseInt(getTodayKey().replace(/-/g, ""));
  const rand = seededRandom(seed);
  return data[Math.floor(rand * data.length)];
}

function getOrCreateRandomSeed() {
  let seed = localStorage.getItem("randomColorSeed");

  if (!seed) {
    seed = Math.floor(Math.random() * data.length);
    localStorage.setItem("randomColorSeed", seed);
  }

  return parseInt(seed);
}

// =========================
// GAME LOGIC
// =========================
function guess() {
  if (!selected || hasWon) return;

  renderGuess(selected, true);

  selected = null;
  searchInput.value = "";
  searchInput.blur();
}

function renderGuess(char, save = true) {
  const table = document.getElementById("resultColor");

  const row = document.createElement("tr");

  // Determine if the color matches
  const colorMatch = char.color === target.color ? "correct" : "wrong";

  row.innerHTML = `
    <td><img src="./images/${char.image}.webp"></td>
    <td>${char.name}</td>
    <td style="background-color: ${char.color};"></td>
  `;

  table.appendChild(row);

  if (save) saveGuess(char.name);

  // WIN CONDITION
  if (char.name === target.name) {
    hasWon = true;
    lockGame();

    showColorAnswer();
    // document.getElementById("status").textContent = "✅ Correct!";

    if (isRandomMode) showNewRoundButton();

    if (!isRandomMode) {
      const today = getTodayKey();
      const lastWin = localStorage.getItem("lastColorWin");

      if (lastWin !== today) {
        updateStreak(true);
        localStorage.setItem("lastColorWin", today);
      }
    }
  }

  guessCount += 1;

  if (guessCount >= maxTries && !hasWon) {
    lockGame();

    if (isRandomMode) showNewRoundButton();

    if (!isRandomMode) {
      updateStreak(false);
    }

    showColorAnswer();
    // document.getElementById("status").textContent = "❌ You lost!";
  }
}


// =========================
// COMPARISON
// =========================



// =========================
// STORAGE
// =========================
function getStorageKey() {
  return isRandomMode
    ? localStorage.getItem("randomColorSeed")
    : "colorGuesses_" + getTodayKey();
}

function saveGuess(name) {
  const key = getStorageKey();
  let guesses = JSON.parse(localStorage.getItem(key)) || [];

  guesses.push(name);
  localStorage.setItem(key, JSON.stringify(guesses));
}

function loadGuesses() {
  const key = getStorageKey();
  const guesses = JSON.parse(localStorage.getItem(key)) || [];

  guesses.forEach(name => {
    const char = data.find(c => c.name === name);
    if (char) renderGuess(char, false);
  });
}

// =========================
// STREAK
// =========================
function loadStreak() {
  if (isRandomMode) return;
  document.getElementById("streak").textContent =
    localStorage.getItem("colorStreak") || 0;
}

function updateStreak(win) {
  let streak = parseInt(localStorage.getItem("colorStreak") || 0);

  streak = win ? streak + 1 : 0;

  localStorage.setItem("colorStreak", streak);
  loadStreak();
}

// =========================
// TIMER
// =========================
function startTimer() {
  const el = document.getElementById("timer");

  setInterval(() => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    const diff = tomorrow - now;

    const h = Math.floor(diff / 1000 / 60 / 60);
    const m = Math.floor(diff / 1000 / 60) % 60;
    const s = Math.floor(diff / 1000) % 60;

    el.textContent = `${h}h ${m}m ${s}s`;
  }, 1000);
}

// =========================
// UI (DROPDOWN)
// =========================
function renderList(list) {
  optionsDiv.innerHTML = "";
  filteredList = list;
  highlightedIndex = 0;

  list.forEach((char, index) => {
    const div = document.createElement("div");
    div.className = "option";

    div.innerHTML = `
      <img src="./images/${char.image}.webp">
      <span>${char.name}</span>
    `;

    div.onclick = () => selectCharacter(index);

    optionsDiv.appendChild(div);
  });
}

function selectCharacter(index) {
  if (hasWon) return;

  const char = filteredList[index];
  if (!char) return;

  selected = char;
  searchInput.value = char.name;
  optionsDiv.classList.add("hidden");

  guess();
}

function filterList() {
  const val = searchInput.value.toLowerCase();
  renderList(data.filter(c => c.name.toLowerCase().includes(val)));
}

function showDropdown() {
  optionsDiv.classList.remove("hidden");
  filterList();
  updateHighlight();
}

// =========================
// UI (NAV / EVENTS)
// =========================
document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    optionsDiv.classList.add("hidden");
  }
});

searchInput.addEventListener("keydown", (e) => {
  if (optionsDiv.classList.contains("hidden")) return;

  const max = filteredList.length - 1;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    highlightedIndex = Math.min(highlightedIndex + 1, max);
    updateHighlight();
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    highlightedIndex = Math.max(highlightedIndex - 1, 0);
    updateHighlight();
  }

  if (e.key === "Enter") {
    e.preventDefault();
    if (highlightedIndex >= 0) selectCharacter(highlightedIndex);
  }
});

function updateHighlight() {
  const items = optionsDiv.querySelectorAll(".option");

  items.forEach((el, i) => {
    el.classList.toggle("active", i === highlightedIndex);
  });

  const active = items[highlightedIndex];
  if (active) active.scrollIntoView({ block: "nearest" });
}

function highlightNav() {
  const path = window.location.pathname;

  if (path.includes("color.html")) {
    document.getElementById("nav-color")?.classList.add("active");
  } else {
    document.getElementById("nav-daily")?.classList.add("active");
  }
}

highlightNav();

// =========================
// UI (GAME CONTROL)
// =========================
function lockGame() {
  document.getElementById("search").disabled = true;
}

function newRound() {
  localStorage.removeItem("randomColorSeed");
  // localStorage.removeItem("guesses_random");

  const seed = getOrCreateRandomSeed();
  target = data[seed];

  targetColor.style.backgroundColor = target.color;

  document.getElementById("resultColor").innerHTML = `
    <tr>
      <th>Image</th>
      <th>Name</th>
      <th>Color</th>
    </tr>
  `;

  hasWon = false;
  selected = null;
  guessCount = 0;
  searchInput.disabled = false;
  searchInput.value = "";

  hideNewRoundButton();
  resetColorAnswer();
}

function showNewRoundButton() {
  document.getElementById("new-round-btn").classList.remove("hidden");
}

function hideNewRoundButton() {
  document.getElementById("new-round-btn").classList.add("hidden");
}

// =========================
// SETTINGS UI
// =========================
function loadSettings() {
  const saved = JSON.parse(localStorage.getItem("settings"));
  if (saved) settings = { ...defaultSettings, ...saved };

  if (settings.unlimitedTry) {
    maxTries = Infinity;
  }

  document.getElementById("setting-unlimited").checked = settings.unlimitedTry;
  document.getElementById("setting-hint").checked = settings.hint;
}

function saveSettings() {
  settings.unlimitedTry = document.getElementById("setting-unlimited").checked;
  settings.hint = document.getElementById("setting-hint").checked;

  localStorage.setItem("settings", JSON.stringify(settings));
}

document.getElementById("open-settings").onclick = () => {
  modal.classList.remove("hidden");
  loadSettings();
};

function closeSettings() {
  saveSettings();
  modal.classList.add("hidden");
}

// =========================
// ANSWER UI
// =========================
function showColorAnswer() {
  const box = document.getElementById("color-box");
  const answer = document.getElementById("color-answer");
  const img = document.getElementById("color-image");
  const name = document.getElementById("color-name");

  // box.style.background = target.color;
  img.src = "./images/" + target.image + ".webp";
  name.textContent = target.name;
  answer.classList.remove("hidden");
}

function resetColorAnswer() {
  const answer = document.getElementById("color-answer");
  const img = document.getElementById("color-image");
  const name = document.getElementById("color-name");

  answer.classList.add("hidden");
  img.src = "";
  name.textContent = "";
}

//log for debug purposes
const version = "1.4"
function debug() {
  console.log("color mode debug version " + version);
}

debug()