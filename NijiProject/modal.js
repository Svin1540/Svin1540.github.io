let isGenerated = false;
const configKey = "config";

document.getElementById("open-settings").onclick = () => {
  modal.classList.remove("hidden");
//   loadSettings();
    generateCheckbox();
};

function showModalPage(pageIndex) {
    const pages = document.querySelectorAll(".modal-page");

    pages.forEach((page, index) => {
        if (index === pageIndex) {
            page.classList.remove("hidden");
        } else {
            page.classList.add("hidden");
        }
    });
}

function generateCheckbox() {
    if (isGenerated) return;
    isGenerated = true;

    const container = document.getElementById("chars-checklist");
    container.innerHTML = "";
    if(hasPlayed) container.innerHTML += (
        "<div>You have played the previous seed. Any change to the character config will only be applied on the next game.</div>"
    )

    const groups = {};

    rawData.forEach((char, index) => {
        // Create branch group if it doesn't exist yet
        if (!groups[char.branch]) {
            const category = document.createElement("div");
            category.className = "category";

            const title = document.createElement("h3");
            title.textContent = char.branch;
            title.onclick = function () {
                toggleCategory(this);
            };

            const content = document.createElement("div");
            content.className = "category-content";

            category.appendChild(title);
            category.appendChild(content);
            container.appendChild(category);

            // Save reference to the content element
            groups[char.branch] = content;
        }

        // Create character checkbox
        const label = document.createElement("label");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = allowedChar[index];
        ///////////////////////////////////////////////////////////////////////////////////////
        // change checkbox.selected based on config

        // Callback uses the index in data
        checkbox.onchange = function () {
            changeBool(index);
        };

        label.appendChild(checkbox);
        label.append(` ${char.name}`);

        // Add character to its branch group
        groups[char.branch].appendChild(label);
    });
}


function toggleCategory(title) {
    const content = title.nextElementSibling;

    content.classList.toggle("hidden");
}

function changeBool(ind){
    console.log(ind);
    allowedChar[ind] = !allowedChar[ind];
}

// =============================================================
const BASE62_CHARS =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";


// ========================================
// BOOLEAN ARRAY → BASE62
// ========================================

function boolsToBase62(boolArray) {
    if (boolArray.length !== dataLength) {
        throw new Error(`Expected ${dataLength} booleans`);
    }

    let value = 0n;

    for (let i = 0; i < dataLength; i++) {
        if (boolArray[i]) {
            value |= 1n << BigInt(i);
        }
    }

    return bigIntToBase62(value);
}


// ========================================
// BASE62 → BOOLEAN ARRAY
// ========================================

function base62ToBools(code) {
    const value = base62ToBigInt(code);

    const boolArray = new Array(dataLength);

    for (let i = 0; i < dataLength; i++) {
        boolArray[i] =
            (value & (1n << BigInt(i))) !== 0n;
    }

    return boolArray;
}


// ========================================
// BIGINT → BASE62
// ========================================

function bigIntToBase62(value) {
    if (value === 0n) {
        return "0";
    }

    let result = "";

    while (value > 0n) {
        const remainder = value % 62n;

        result =
            BASE62_CHARS[Number(remainder)] + result;

        value /= 62n;
    }

    return result;
}


// ========================================
// BASE62 → BIGINT
// ========================================

function base62ToBigInt(code) {
    let value = 0n;

    for (const char of code) {
        const index = BASE62_CHARS.indexOf(char);

        if (index === -1) {
            throw new Error(`Invalid Base62 character: ${char}`);
        }

        value =
            value * 62n + BigInt(index);
    }

    return value;
}


function saveConfig(config) {
    let appliedConfig = boolsToBase62(config)
    localStorage.setItem(configKey, appliedConfig);
    if(hasPlayed) return;
    console.log("config has changed");
    currentConfigKey = appliedConfig;
    reloadGame();
}

function loadConfig() {
    checkSeedLock();

    if (currentConfigKey === null) {
        let filled = new Array(dataLength).fill(true);
        currentConfigKey = boolsToBase62(filled);
        return filled;
    }

    return base62ToBools(currentConfigKey);
}




function DebugConfig() {
    const config = new Array(170).fill(false);

    config[0] = true;
    config[3] = true;
    config[50] = true;
    config[100] = true;
    config[169] = true;

    const code = boolsToBase62(config);

    console.log(code);

    const restored = base62ToBools(code);

    console.log(restored[0]);   // true
    console.log(restored[1]);   // true
    console.log(restored[3]);   // true
    console.log(restored[50]);  // true
    console.log(restored[100]); // true
    console.log(restored[169]); // true
}

// DebugConfig();
