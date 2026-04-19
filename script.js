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

// =========================
// INIT
// =========================
function initGame() {
  if (isRandomMode) {
    const seed = getOrCreateRandomSeed();
    hideNewRoundButton();
    target = data[seed];
  } else {
    target = getDailyTarget(data);
  }

  loadStreak();

  if (!isRandomMode) startTimer();

  loadGuesses();
  renderList(data);
}

// =========================
// DATA FETCH
// =========================
fetch("data.json")
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
    console.warn("Fetch failed, using fallback", err);
    data = [
      { name: "Ayaka", image: "https://via.placeholder.com/50", height: 160, debut: "2020-09-15", birthday: "04-01", branch: "JP" },
      { name: "Bella", image: "https://via.placeholder.com/50", height: 165, debut: "2021-03-10", birthday: "07-12", branch: "EN" },
      { name: "Clara", image: "https://via.placeholder.com/50", height: 158, debut: "2019-11-20", birthday: "01-25", branch: "ID" }
    ];
    initGame();
  });

// =========================
// RANDOM / DAILY LOGIC
// =========================
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailyTarget(data) {
  const seed = parseInt(getTodayKey().replace(/-/g, ""));
  const rand = seededRandom(seed);
  return data[Math.floor(rand * data.length)];
}

function getOrCreateRandomSeed() {
  let seed = localStorage.getItem("randomSeed");

  if (!seed) {
    seed = Math.floor(Math.random() * data.length);
    localStorage.setItem("randomSeed", seed);
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
}

function renderGuess(char, save = true) {
  const table = document.getElementById("result");

  const [hC, hA] = compareNumber(char.height, target.height);
  const [dC, dA] = compareDate(char.debut, target.debut);
  const [bC, bA] = compareDate(char.birthday, target.birthday);
  const [brC] = compareText(char.branch, target.branch);

  const row = document.createElement("tr");

  row.innerHTML = `
    <td><img src="${char.image}"></td>
    <td>${char.name}</td>
    <td class="${hC}">${char.height} ${hA}</td>
    <td class="${dC}">${char.debut} ${dA}</td>
    <td class="${bC}">${char.birthday} ${bA}</td>
    <td class="${brC}">${char.branch}</td>
  `;

  table.appendChild(row);

  if (save) saveGuess(char.name);

  // WIN CONDITION
  if (char.name === target.name) {
    hasWon = true;
    lockGame();
    showNewRoundButton();

    if (!isRandomMode) {
      const today = getTodayKey();
      const lastWin = localStorage.getItem("lastWin");

      if (lastWin !== today) {
        updateStreak(true);
        localStorage.setItem("lastWin", today);
      }
    }
  }

  guessCount += 1;

  if (guessCount >= maxTries && !hasWon) {
    lockGame();
    showNewRoundButton();

    document.getElementById("status").textContent = "❌ You lost!";
  }
}

// =========================
// COMPARISON
// =========================
function compareNumber(val, targetVal) {
  if (val === targetVal) return ["correct", ""];
  return val > targetVal ? ["wrong", "↓"] : ["wrong", "↑"];
}

function compareDate(val, targetVal) {
  if (val === targetVal) return ["correct", ""];
  return val > targetVal ? ["wrong", "↓"] : ["wrong", "↑"];
}

function compareText(val, targetVal) {
  return val === targetVal ? ["correct", ""] : ["wrong", ""];
}

// =========================
// STORAGE
// =========================
function getStorageKey() {
  return isRandomMode
    ? "guesses_random_" + localStorage.getItem("randomSeed")
    : "guesses_" + getTodayKey();
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
  if(isRandomMode) return;
  document.getElementById("streak").textContent =
    localStorage.getItem("streak") || 0;
}

function updateStreak(win) {
  let streak = parseInt(localStorage.getItem("streak") || 0);

  streak = win ? streak + 1 : 0;

  localStorage.setItem("streak", streak);
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
      <img src="${char.image}">
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

  if (path.includes("random.html")) {
    document.getElementById("nav-random")?.classList.add("active");
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
  localStorage.removeItem("randomSeed");
  localStorage.removeItem("guesses_random");

  const seed = getOrCreateRandomSeed();
  target = data[seed];

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
  selected = null;
  guessCount = 0;
  searchInput.disabled = false;
  searchInput.value = "";

  hideNewRoundButton();
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

//log
function debug(){
console.log(new Date().toISOString() + " daily seed log");

const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    const diff = tomorrow - now;

    console.log({
      now,
      tomorrow,
      diff
    })
}

debug()