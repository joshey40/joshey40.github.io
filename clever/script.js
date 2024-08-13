
function startGame(gameNum) {
    var game = document.getElementById("game_select");
    game.style.display = "none";
    var game = document.getElementById("game");
    game.style.display = "block";
}




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
        dice.style.backgroundColor = dice_colors[i];
        dice.innerHTML = dice_values[dice_colors[i]];
        dice_container.appendChild(dice);
    }
}
