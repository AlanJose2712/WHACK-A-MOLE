let currMoles = [];
let currPlants = [];
let score = 0;
let hits = 0;
let misses = 0;
let highScore = localStorage.getItem("moleHighScore") || 0;
let gameOver = false;
let timeLeft = 30;

let spawnInterval;
let timerInterval;

document.getElementById("highScore").innerText = highScore;

// --- SOUND SETUP ---
let bgMusic = new Audio("./music/background.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

let hitSound = new Audio("./hit.wav");
let overSound = new Audio("./gameover.wav");

let soundEnabled = true;

// DIFFICULTY SETTINGS
const difficultySettings = {
    easy:   { speed: 1400, time: 50 },
    medium: { speed: 1100, time: 35 },
    hard:   { speed: 1000, time: 35 }
};

function startGame() {
    let mode = document.getElementById("difficulty").value;
    let config = difficultySettings[mode];

    score = hits = misses = 0;
    document.getElementById("score").innerText = score;
    timeLeft = config.time;
    document.getElementById("time").innerText = timeLeft;

    if (soundEnabled) bgMusic.play().catch(() => {});
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("restartBtn").style.display = "inline-block";
    document.getElementById("board").style.pointerEvents = "auto";

    setBoard();
    startTimers(config);
}

function restart() {
    bgMusic.pause();
    bgMusic.currentTime = 0;
    location.reload();
}

function setBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    for (let i = 0; i < 9; i++) {
        let tile = document.createElement("div");
        tile.id = i.toString();

        // PC click
        tile.addEventListener("click", selectTile);

        // 📱 MOBILE touch support
        tile.addEventListener("touchstart", selectTile, { passive: true });

        board.appendChild(tile);
    }
}

function startTimers(cfg) {
    // ⛔ Remove old separate mole + plant spawning
    // ⭕ Replace with combined synchronized spawner
    spawnInterval = setInterval(() => {
        spawnCombined();
    }, cfg.speed);

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            document.getElementById("time").innerText = timeLeft;
        } else {
            endGame();
        }
    }, 1000);
}

function endGame() {
    if (gameOver) return;
    gameOver = true;

    clearInterval(spawnInterval);
    clearInterval(timerInterval);

    currMoles.forEach(m => m.innerHTML = "");
    currPlants.forEach(p => p.innerHTML = "");

    bgMusic.pause();
    bgMusic.currentTime = 0;

    if (soundEnabled) overSound.play();

    if (score > highScore) {
        localStorage.setItem("moleHighScore", score);
        document.getElementById("highScore").innerText = score;
    }

    showStats();
}

// ------------------ NEW SYSTEM: MOLE + PLANT SPAWN TOGETHER ------------------
function spawnCombined() {
    if (gameOver) return;

    // Clear previous
    currMoles.forEach(m => m.innerHTML = "");
    currPlants.forEach(p => p.innerHTML = "");
    currMoles = [];
    currPlants = [];

    let mode = document.getElementById("difficulty").value;

    let moleCount = 1;
    let plantCount = 1;

    // HARD MODE CHAOS
    if (mode === "hard") {
        let pattern = Math.floor(Math.random() * 3);
        if (pattern === 0) { moleCount = 1; plantCount = 2; }
        if (pattern === 1) { moleCount = 2; plantCount = 1; }
        if (pattern === 2) { moleCount = 2; plantCount = 2; }
    }

    let used = new Set();

    // Spawn moles
    for (let i = 0; i < moleCount; i++) {
        let id;
        do { id = Math.floor(Math.random() * 9); }
        while (used.has(id));
        used.add(id);

        let tile = document.getElementById(id);
        let img = document.createElement("img");
        img.src = "./images/monty-mole.png";
        tile.appendChild(img);
        currMoles.push(tile);
    }

    // Spawn snakes (piranha)
    for (let i = 0; i < plantCount; i++) {
        let id;
        do { id = Math.floor(Math.random() * 9); }
        while (used.has(id));
        used.add(id);

        let tile = document.getElementById(id);
        let img = document.createElement("img");
        img.src = "./images/piranha-plant.png";
        tile.appendChild(img);
        currPlants.push(tile);
    }
}

function selectTile() {
    if (gameOver) return;

    if (currMoles.includes(this)) {
        score += 10;
        hits++;
        document.getElementById("score").innerText = score;

        // popup
        let pop = document.createElement("div");
        pop.classList.add("popup");
        pop.innerText = "+10";
        document.body.appendChild(pop);

        const rect = this.getBoundingClientRect();
        pop.style.left = rect.left + 70 + "px";
        pop.style.top = rect.top + 20 + "px";
        setTimeout(() => pop.remove(), 600);

        this.innerHTML = "";
        if (soundEnabled) hitSound.play();

    } else if (currPlants.includes(this)) {
        misses++;

        let flash = document.createElement("div");
        flash.classList.add("redFlash");
        this.appendChild(flash);
        setTimeout(() => flash.remove(), 400);

        this.classList.add("shake");
        setTimeout(() => this.classList.remove("shake"), 200);

        endGame();
    }
}

// ---------------- SOUND -----------------
function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById("soundBtn").innerText =
        soundEnabled ? "Sound: ON" : "Sound: OFF";

    if (!soundEnabled) bgMusic.pause();
    else bgMusic.play().catch(() => {});
}

// ---------------- STATS -----------------
function showStats() {
    const modal = document.getElementById("statsModal");
    document.getElementById("totalHits").innerText = hits;
    document.getElementById("totalMisses").innerText = misses;
    const acc = hits + misses === 0 ? 0 : Math.round((hits / (hits + misses)) * 100);
    document.getElementById("accuracy").innerText = acc;
    modal.classList.remove("hidden");
}

function closeStats() {
    document.getElementById("statsModal").classList.add("hidden");
}
