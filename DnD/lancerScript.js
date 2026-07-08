const Color1 = [
    "#ff0000",
    "#ff8800",
    "#ffff00",
    "#88ff00",
    "#00ff00",
    "#00ff88",
    "#00ffff",
    "#0088ff",
    "#0000ff",
    "#8800ff",
    "#ff00ff",
    "#ff0088",
    "#000000",
]

const Color2 = [
    "#ff0000",
    "#ff4000",
    "#ff8000",
    "#ffb000",
    "#ffff00",
    "#b0ff00",
    "#80ff00",
    "#40ff00",
    "#00ff00",
    "#00ff40",
    "#00ff80",
    "#00ffb0",
    "#00ffff",
    "#00b0ff",
    "#0080ff",
    "#0040ff",
    "#0000ff",
    "#4000ff",
    "#8000ff",
    "#b000ff",
    "#ff00ff",
    "#ff00b0",
    "#ff0080",
    "#ff0040",
    "#000000",
]

const ColorCode = Color1;

const boxContainer = document.getElementById("diceResultContainer").children[0];

var diceResultBoxNumber = 3;
var currentBoxIndex = 0;
var saveArr = [];

function saveSession() {
    let key = document.getElementById("storageKey").value;
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(saveArr));
}

function loadSession() {
    let key = document.getElementById("storageKey").value;
    if (!key) return;
    saveArr = JSON.parse(localStorage.getItem(key)) || [];

    diceResultBoxNumber = saveArr.length;

    boxContainer.children[0].replaceChildren();
    boxContainer.children[1].replaceChildren();

    for (let i = 0; i < saveArr.length; i++) {
        let newtd = document.createElement("td");
        newtd.classList.add("saveCategory");
        newtd.style.backgroundColor = ColorCode[saveArr[i][1]];
        newtd.addEventListener("click", (e) => cycleColor(e, i));

        let newsavecont = document.createElement("td");
        newsavecont.classList.add("saveNum");
        newsavecont.addEventListener("click", () => selectIndex(i));
        newsavecont.innerText = saveArr[i][0];

        boxContainer.children[0].append(newtd);
        boxContainer.children[1].append(newsavecont);

    }

    selectIndex();

}

function createBoxes() {
    let currentNumberOfBox = boxContainer.children[0].childElementCount;
    let targetNumberBox = parseInt(document.getElementById("sbIpt").value);
    if (currentNumberOfBox == targetNumberBox) return;
    if (targetNumberBox < 1) return;

    //more
    for (let i = 0; i < targetNumberBox - currentNumberOfBox; i++) {
        let tempCurrent = currentNumberOfBox + i;

        let newtd = document.createElement("td");
        newtd.classList.add("saveCategory");
        newtd.style.backgroundColor = ColorCode[0];
        newtd.addEventListener("click", (e) => cycleColor(e, tempCurrent));

        let newsavecont = document.createElement("td");
        newsavecont.classList.add("saveNum");
        newsavecont.addEventListener("click", () => selectIndex(tempCurrent));

        boxContainer.children[0].append(newtd);
        boxContainer.children[1].append(newsavecont);
        saveArr.push([null, 0]);
    }
    //less
    for (let i = 0; i < currentNumberOfBox - targetNumberBox; i++) {
        boxContainer.children[0].removeChild(boxContainer.children[0].lastElementChild);
        boxContainer.children[1].removeChild(boxContainer.children[1].lastElementChild);
        saveArr.pop();
    }

    diceResultBoxNumber = targetNumberBox;


    console.log(saveArr);
    if (currentBoxIndex >= targetNumberBox || currentNumberOfBox == 0) selectIndex();
}

function selectIndex(idx = 0) {
    if (checkBoxNotExist()) return;
    try {
        boxContainer.children[1].children[currentBoxIndex].classList.remove("selecting");
    }
    finally {
        currentBoxIndex = idx;
        boxContainer.children[1].children[currentBoxIndex].classList.add("selecting");
    }
}

function nextIndex() {
    selectIndex((currentBoxIndex + 1) % diceResultBoxNumber);
}

function cycleColor(event, idx) {
    saveArr[idx][1] = (saveArr[idx][1] + 1) % ColorCode.length;
    let nextColor = ColorCode[saveArr[idx][1]];
    event.srcElement.style.backgroundColor = nextColor;
}

function saveDiceNum(num = 0) {
    if (checkBoxNotExist()) return;
    saveArr[currentBoxIndex][0] = (num == -1 ? null : num);
    boxContainer.children[1].children[currentBoxIndex].innerText = (num == -1 ? "" : num);
    console.log(saveArr);
    nextIndex();
}

function checkBoxNotExist() {
    return boxContainer.children[0] == null || boxContainer.children[0].childElementCount < 1;
}

function closePopup() {
    document.getElementById("saveConfirm").hidden = true;
    document.getElementById("loadConfirm").hidden = true;
}

function openPopup(isLoad = false){
    document.getElementById("saveConfirm").hidden = isLoad;
    document.getElementById("loadConfirm").hidden = !isLoad;
}

function showKeys() {
    let element = document.getElementById("keyList");
    element.value = "";
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        element.value += key + "\n";
    }
}

showKeys();