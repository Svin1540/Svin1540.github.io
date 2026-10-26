const streakKey = "streak";

// =========================
// INIT
// =========================
function initMode() {
    target = getDailyTarget(data);
    startTimer();
}

// =========================
// DAILY TARGET
// =========================
function doubleRandom(dateSeed, hashMember) {
    let str = `${dateSeed}:${hashMember}`;
    let hash = 2166136261; //FNV1-a offset basis

    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619); //FNV1-a
    }

    hash += hash << 13;
    hash ^= hash >>> 7;
    hash += hash << 3;
    hash ^= hash >>> 17;
    hash += hash << 5;

    hash = (hash >>> 0) / 4294967296; //32 bit unsigned

    return hash;
}

function getStorageKey(todayKey) {
    todayKey ??= getTodayKey();
    return "guesses_" + todayKey;
}

function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getDailyTarget(data) {
    const seed = parseInt(getTodayKey().replace(/-/g, ""));
    //   const rand = seededRandom(seed);
    const rand = doubleRandom(getTodayKey(), currentConfigKey);
    console.log(rand);

    return data[Math.floor(rand * allowedCharLength)];
}

// =========================
// DAILY STREAK
// =========================

function handleModeWin() {
    const today = getTodayKey();
    const lastWin = localStorage.getItem("lastWin");

    if (lastWin !== today) {
        // Remove the previous day's saved guesses, if there were any.
        if (lastWin !== null) {
            localStorage.removeItem(getStorageKey(lastWin));
        }

        updateStreak(true);
        localStorage.setItem("lastWin", today);
    }
}

function handleModeLoss() {
    updateStreak(false);
}

// =========================
// DAILY TIMER
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

        el.textContent = `⏳ Next: ${h}h ${m}m ${s}s`;
    }, 1000);
}

// =========================
// SEEDLOCK
// =========================

function checkSeedLock() {
    if (localStorage.getItem("lastPlayed") != getTodayKey()) {
        currentConfigKey = localStorage.getItem(configKey);
    } else {
        currentConfigKey = localStorage.getItem("lastPlayedConfig");
    }
}

function setPlayed() {
    const today = getTodayKey();

    if (today !== localStorage.getItem("lastPlayed")) {
        localStorage.setItem("lastPlayed", today);
        localStorage.setItem("lastPlayedConfig", currentConfigKey);
    }
}

// =========================
// DEBUG / EXPERIMENTAL
// =========================

function debugday(offset) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate() + offset).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function debugDoubleRandomDate() {
    const hashMember = currentConfigKey;

    console.log("=== DEBUG: Changing dateSeed ===");
    console.log("hashMember:", hashMember);

    for (let i = 0; i < 20; i++) {
        const dateSeed = debugday(i);
        const result = doubleRandom(dateSeed, hashMember);

        console.log({
            dateSeed,
            hashMember,
            result
        });
    }
}

function debugDoubleRandomMember() {
    const dateSeed = parseInt(getTodayKey().replace(/-/g, ""));
    const hashMember = currentConfigKey;

    console.log("=== DEBUG: Changing hashMember ===");
    console.log("dateSeed:", dateSeed);

    for (let i = 0; i < 20; i++) {
        const member = `${hashMember}${i}`;
        const result = doubleRandom(dateSeed, member);

        console.log({
            dateSeed,
            hashMember: member,
            result
        });
    }
}