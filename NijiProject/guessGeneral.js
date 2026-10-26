// =========================
// GLOBAL STATE
// =========================
let rawData = [];
let data = [];
let dataLength;
let target;
let selected = null;
let hasPlayed = false;
let hasWon = false;

let highlightedIndex = 0;
let filteredList = [];

let currentConfigKey;
let allowedChar = [];
let allowedCharLength;

let guessCount = 0;
let maxTries = 6;

var isClosing = false;
var gameStop = false;

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
const modal = document.getElementById("modalOverlay");

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", initData);

function initData() {
    fetch("data.json")
        .then(res => {
            if (!res.ok) throw new Error("Fetch failed");
            return res.json();
        })
        .then(json => {
            console.log("Loaded via fetch");
            rawData = json;
            dataLength = rawData.length;
            initSetting();
            initGame();
        })
        .catch(err => {
            console.warn("Fetch failed", err);
        });
}

function initSetting() {
    loadSettings();
    data = rawData.filter((_, index) => allowedChar[index] === true);
    allowedCharLength = data.length;
}

function reloadGame(){
    data = rawData.filter((_, index) => allowedChar[index] === true);
    allowedCharLength = data.length;
    initGame();
}

function initGame() {
    // Mode-specific functions will be defined in daily.js and random.js.
    initMode();

    loadStreak();
    loadGuesses();
    renderList(data);
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
    const table = document.getElementById("result");

    const [hC, hA] = compareNumber(char.height, target.height);
    const [dC, dA] = compareDate(char.debut, target.debut);
    const [bC, bA] = compareDate(char.birthday, target.birthday);
    const [brC] = compareText(char.branch, target.branch);

    const row = document.createElement("tr");

    row.innerHTML = `
    <td><img src="./images/${char.image}.webp"></td>
    <td>${char.name}</td>
    <td class="${hC}">${char.height} ${hA}</td>
    <td class="${dC}">${formatDebut(char.debut)} ${dA}</td>
    <td class="${bC}">${formatBirthday(char.birthday)} ${bA}</td>
    <td class="${brC}">${char.branch}</td>
  `;

    table.insertBefore(row, table.children[1]);

    if (save) saveGuess(char.name);

    if (!hasPlayed) {
        hasPlayed = true;

        setPlayed();
    }

    // WIN CONDITION
    if (char.name === target.name) {
        hasWon = true;

        lockGame();
        showEndGame(true);
        handleModeWin();
    }

    guessCount += 1;

    // LOSS CONDITION
    if (guessCount >= maxTries && !hasWon) {
        lockGame();
        handleModeLoss();
        showEndGame(false);
    }
}

// =========================
// PARSER
// =========================
function formatBirthday(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long"
    });
}

function formatDebut(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
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

function saveGuess(name) {
    const key = getStorageKey();
    const guesses = JSON.parse(localStorage.getItem(key)) || [];

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
    document.getElementById("streak").textContent =
        localStorage.getItem(streakKey) || 0;
}

function updateStreak(win) {
    let streak = parseInt(localStorage.getItem(streakKey) || 0);

    streak = win ? streak + 1 : 0;

    localStorage.setItem(streakKey, streak);

    loadStreak();
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

    renderList(
        data.filter(c => c.name.toLowerCase().includes(val))
    );
}

function showDropdown() {
    optionsDiv.classList.remove("hidden");
    filterList();
    updateHighlight();
}

// =========================
// UI (NAV / EVENTS)
// =========================
document.addEventListener("click", e => {
    if (!e.target.closest(".dropdown")) {
        optionsDiv.classList.add("hidden");
    }
});

document.addEventListener("keydown", e => {
    if (isClosing || gameStop) {
        isClosing = false;
        return;
    }

    if (e.key === "Enter") {
        e.preventDefault();
        showDropdown();
        searchInput.focus();
    }
});

searchInput.addEventListener("keydown", e => {
    if (optionsDiv.classList.contains("hidden")) return;

    const max = filteredList.length - 1;

    if (e.key === "ArrowDown") {
        e.preventDefault();

        highlightedIndex = Math.min(
            highlightedIndex + 1,
            max
        );

        updateHighlight();
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();

        highlightedIndex = Math.max(
            highlightedIndex - 1,
            0
        );

        updateHighlight();
    }

    if (e.key === "Enter") {
        e.preventDefault();
        isClosing = true;

        if (highlightedIndex >= 0) {
            selectCharacter(highlightedIndex);
        }
    }
});

function updateHighlight() {
    const items = optionsDiv.querySelectorAll(".option");

    items.forEach((el, i) => {
        el.classList.toggle("active", i === highlightedIndex);
    });

    const active = items[highlightedIndex];

    if (active) {
        active.scrollIntoView({ block: "nearest" });
    }
}

// =========================
// UI (GAME CONTROL)
// =========================
function lockGame() {
    document.getElementById("search").disabled = true;
}

// =========================
// SETTINGS UI
// =========================
function loadSettings() {
    // const saved = JSON.parse(localStorage.getItem("settings"));
    // if (saved) settings = { ...defaultSettings, ...saved };

    // if (settings.unlimitedTry) maxTries = Infinity;
    // document.getElementById("setting-unlimited").checked = settings.unlimitedTry;
    // document.getElementById("setting-hint").checked = settings.hint;

    allowedChar = loadConfig();

    if (allowedChar.length !== dataLength) {
        allowedChar.length = dataLength;
    }
}

function saveSettings() {
    // settings.unlimitedTry = document.getElementById("setting-unlimited").checked;
    // settings.hint = document.getElementById("setting-hint").checked;
    // localStorage.setItem("settings", JSON.stringify(settings));

    saveConfig(allowedChar);
}

// document.getElementById("open-settings").onclick = () => {
//   modal.classList.remove("hidden");
//   loadSettings();
// };

function closeSettings(e) {
    if (e.target !== modal) return;

    saveSettings();
    modal.classList.add("hidden");
}

// =========================
// ANSWER UI
// =========================
function showEndGame(win) {
    const statusEl = document.getElementById("status");
    const img = document.getElementById("answer-image");

    img.src = "./images/" + target.image + ".webp";

    document.getElementById("answer-display").classList.remove("hidden");

    statusEl.classList.remove("hidden");
    statusEl.classList.remove("status-win", "status-lose");

    if (win) {
        statusEl.classList.add("status-win");
        statusEl.textContent =
            `✅ You win! The character was ${target.name}`;
    } else {
        statusEl.classList.add("status-lose");
        statusEl.textContent =
            `❌ You lost! The character was ${target.name}`;
    }

    document.getElementById("after-game").classList.remove("hidden");

    gameStop = true;
}

function resetTopPanel() {
    document.getElementById("answer-display").classList.add("hidden");

    const status = document.getElementById("status");

    status.classList.add("hidden");
    status.classList.remove("status-win", "status-lose");
    status.textContent = "";

    document.getElementById("after-game").classList.add("hidden");

    gameStop = false;
}

// =========================
// DEBUG
// =========================
const version = "3.0";

function debug() {
    console.log("debug version " + version);
}

debug();