const dice_colors = ["white", "silver", "yellow", "blue", "green", "pink"];
const dice_values = {
    "white": 1,
    "silver": 1,
    "yellow": 1,
    "blue": 1,
    "green": 1,
    "pink": 1
};

function rerollDice() {
    var dice_container = document.getElementById("dice_container");
    dice_container.innerHTML = "";
    for (var i = 0; i < 6; i++) {
        dice = document.createElement("div");
        dice.className = "dice";
        dice.style.backgroundColor = dice_colors[Math.floor(Math.random() * 6)];
        dice_container.appendChild(dice);
    }
}