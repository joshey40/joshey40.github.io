const dice_colors = ["white", "silver", "yellow", "blue", "green", "pink"];

function rerollDice() {
    var dice_container = document.getElementById("dice_container");
    for (var i = 0; i < 6; i++) {
        dice = document.createElement("div");
        dice.className = "dice";
        dice.style.backgroundColor = dice_colors[Math.floor(Math.random() * 6)];
        dice_container.appendChild(dice);
    }
}