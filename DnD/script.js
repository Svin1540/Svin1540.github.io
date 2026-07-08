let d20singleValue = document.getElementById("d20singleValue")
let d20singleLog = document.getElementById("d20singleLog")
let d20multiLog = document.getElementById("d20multiLog")
let d20multiLogTable = document.getElementById("d20multiLogTable")
let averageLog = document.getElementById("average")

let diceView = document.getElementById("diceContainer")
let diceTotal = document.getElementById("diceTotal")
let resultContainer = document.getElementById("resultContainer")

//config
let diceSize = 20
let multirollNumber = 0
let customRollEnabled = false;

//dices
let dices = []


function singleRoll() {
    let res = (customRollEnabled ? customRoll() : rollD20())
    d20singleValue.value = res
    placeLog(res)
}

function multiRoll(num) {
    if (num == -1) num = multirollNumber;
    multirollNumber = num;
    let arrVal = new Array((customRollEnabled ? diceSize + 1 : 21)).fill(0);
    let res;
    let prevVal = -1;
    for (var i = 0; i < multirollNumber; ++i) {
        res = (customRollEnabled ? customRoll() : rollD20());
        arrVal[res - 1]++
        if (prevVal == res) {
            arrVal[arrVal.length - 1]++;
        }
        prevVal = res;
    }
    multiLog(arrVal);
}

function rollD20() {
    let res = Math.floor(Math.random() * 20 + 1)

    return res
}

function customRoll(num = -1) {
    let rollNum = (num == -1 ? diceSize : num);
    if (rollNum < 1) return;
    let res = Math.floor(Math.random() * rollNum + 1)

    return res
}

function modifierRoll(num, mod) {
    let res = customRoll(num);
    return res + mod;
}

// function rollDND() {
//     let currentDiceNum = 0;
//     let currentDiceContainer = null;
//     dices.forEach(die => {
//         if (die != currentDiceNum) {
//             currentDiceNum = die;
//             if (currentDiceContainer) {
//                 currentDiceContainer.style.gridTemplateColumns = "repeat(" + currentDiceContainer.childElementCount + ",1fr)";
//             }

//             let newDiceNumber = document.createElement("div");
//             newDiceNumber.classList.add("row");
//             newDiceNumber.style.gridTemplateColumns = "1fr";
//             newDiceNumber.style.fontWeight = "bold";
//             newDiceNumber.innerText = "d" + die;

//             let newDiceContainer = document.createElement("div");
//             newDiceContainer.classList.add("row");

//             resultContainer.append(newDiceNumber)
//             resultContainer.append(newDiceContainer);
//             currentDiceContainer = newDiceContainer;
//         }
//         let res = customRoll(die);
//         let newResult = document.createElement("div");
//         newResult.innerText = res;
//         currentDiceContainer.append(newResult);

//     })
//     currentDiceContainer.style.gridTemplateColumns = "repeat(" + currentDiceContainer.childElementCount + ",1fr)";
// }

function rollDND(){
    if(!dices || dices.length == 0) return;
    let currentDiceNum = 0;
    let currentDiceContainer = null;
    let total = 0;
    let newRoll = document.createElement("div");
    let dropdown = document.createElement("div");
    dropdown.innerHTML = `
        <span> \\/ </span>
        <hr/>
    `
    dropdown.style.display = "flex"
    dropdown.style.cursor = "pointer"

    dropdown.addEventListener("click", () => newRoll.hidden = !newRoll.hidden);

    resultContainer.prepend(newRoll);
    resultContainer.prepend(dropdown);
    dices.forEach(die => {
        if(die != currentDiceNum){
            currentDiceNum = die;

            let newDiceNumber = document.createElement("div");
            newDiceNumber.style.gridTemplateColumns = "1fr";
            newDiceNumber.style.fontWeight = "bold";
            newDiceNumber.innerText = "d" + die;

            let newDiceContainer = document.createElement("div");

            newRoll.append(newDiceNumber)
            newRoll.append(newDiceContainer);
            currentDiceContainer = newDiceContainer;
        }
        let res = customRoll(die);
        total += res;
        let newResult = document.createElement("span");
        newResult.innerText = res;
        newResult.classList.add("diceRes");
        switch(res){
            case 1 : newResult.style.backgroundColor = "#ff0000"; break;
            case die : newResult.style.backgroundColor = "#00ff00"; break;
        }
        currentDiceContainer.append(newResult);
    })
    let totalDiv = document.createElement("div");
    totalDiv.innerText = "Total: " + total;
    newRoll.append(totalDiv);
}

function addDice(num) {
    const index = dices.findIndex(x => x > num);
    if (index === -1) {
        dices.push(num);
    } else {
        dices.splice(index, 0, num);
    }

    updateDiceVisual();
}

function removeDice(num) {
    dices.splice(dices.indexOf(num), 1);
    updateDiceVisual();
}

function updateDiceVisual() {
    diceView.replaceChildren();
    diceTotal.replaceChildren();

    let currentDiceNum = 0;
    let currentDiceCount = 0;

    dices.forEach(die => {
        let newDice = document.createElement("button");
        newDice.innerText = "d" + die;
        newDice.classList.add("dices")
        newDice.addEventListener("click", () => removeDice(die))
        diceView.append(newDice);

        if (die != currentDiceNum) {
            if (currentDiceCount > 0) {
                diceTotal.innerText += (" " + currentDiceCount + "d" + currentDiceNum)

            }

            currentDiceNum = die;
            currentDiceCount = 1;
        } else {
            currentDiceCount++;
        }


    })
    diceTotal.innerText += (" " + currentDiceCount + "d" + currentDiceNum)


}

function clearResult(){
    resultContainer.replaceChildren();
}

function toggleLogD20Single() {
    d20singleLog.hidden = !d20singleLog.hidden
}

function placeLog(res) {
    let now = new Date()

    d20singleLog.value = (
        String(now.getMinutes()).padStart(2, "0") +
        ":" + String(now.getSeconds()).padStart(2, "0")
        + " -- " + String(res).padStart(2, " ") + " | " + document.getElementById("comment").value + "\n"
    ) + d20singleLog.value
}

function multiLog(arrVal) {
    let total = 0;
    d20multiLog.textContent = "Repeat : " + arrVal[arrVal.length - 1]

    d20multiLogTable.innerHTML = (
        `<tr>
            <th>Roll Dice Number</th>
            <th>Times Rolled</th>
            <th>Graph Presentation</th>
            <th>Percentage vs Average</th>
        </tr>`
    )

    for (var i = 0; i < arrVal.length - 1; ++i) {
        d20multiLogTable.innerHTML += `
        <tr>
            <td>` + (i + 1) + `</td>
            <td>` + arrVal[i] + `</td>
            <td>` + GraphingRoll(arrVal[i]) + `</td>
            <td>` + CountAverage(arrVal[i]) + `</td>
        </tr>
        `
        total += ((i + 1) * arrVal[i]);
    }

    averageLog.innerText = "Average: " + (total / multirollNumber)
    document.getElementById("expectedAverage").innerText = "Expected Average: " + (((customRollEnabled ? diceSize : 20) + 1) / 2)
}

function GraphingRoll(val) {
    let graphStr = "";
    let divisor = multirollNumber / (5 * (customRollEnabled ? diceSize : 20));
    let tempVal = val + divisor / 2;
    while (tempVal >= divisor) {
        graphStr += "&#x25A0;"
        tempVal -= divisor
    }
    return graphStr;
}

function CountAverage(val) {
    let avg = multirollNumber / (customRollEnabled ? diceSize : 20);
    let againstAvg = (val - avg) / avg
    againstAvg = Math.round(againstAvg * 10000) / 100
    return (againstAvg + "%")
}

function test() {
    customRollEnabled = true;
    multirollNumber = parseInt(document.getElementById("customRoll").value);
    diceSize = parseInt(document.getElementById("customDice").value);
    if (
        multirollNumber < 1 ||
        diceSize < 2
    ) customRollEnabled = false;
    document.getElementById("customRollButton").hidden = !customRollEnabled;
}
/*
const textarea = document.getElementById('myTextarea');
const lines = textarea.value.split('\n');
lines.pop();
textarea.value = lines.join('\n');
*/