const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W, H;

function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// =========================
// GAME SETTINGS
// =========================

const roadWidth = 900;
const segmentLength = 200;
const totalSegments = 220;
const trackLength = totalSegments * segmentLength;

let position = 0;
let playerX = 0;
let speed = 0;

const maxSpeed = 900;
const acceleration = 500;
const braking = 900;
const friction = 180;
const steering = 2.8;

let nitro = 100;
let coins = 0;
let lap = 1;
const totalLaps = 3;

let raceTime = 0;
let gameStarted = false;
let gameFinished = false;

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {
        e.preventDefault();
    }

    if (e.key.toLowerCase() === "r") {
        restartGame();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// =========================
// AI CARS
// =========================

const aiCars = [
    {
        x: -0.45,
        z: 500,
        speed: 650,
        color: "#ff3030"
    },
    {
        x: 0.40,
        z: 900,
        speed: 690,
        color: "#30aaff"
    },
    {
        x: -0.20,
        z: 1400,
        speed: 720,
        color: "#ffd630"
    },
    {
        x: 0.20,
        z: 1900,
        speed: 675,
        color: "#b030ff"
    }
];

// =========================
// COINS
// =========================

const coinList = [];

for (let i = 0; i < 70; i++) {
    coinList.push({
        z: 700 + i * 850,
        x: (Math.random() * 1.5) - 0.75,
        collected: false
    });
}

// =========================
// ROAD
// =========================

const road = [];

for (let i = 0; i < totalSegments; i++) {

    let curve = 0;

    if (i > 20 && i < 55) {
        curve = 0.8;
    }

    if (i > 70 && i < 105) {
        curve = -0.9;
    }

    if (i > 120 && i < 155) {
        curve = 0.55;
    }

    if (i > 170 && i < 205) {
        curve = -0.7;
    }

    road.push({
        curve: curve
    });
}

// =========================
// START GAME
// =========================

function startGame() {

    gameStarted = true;

    const startScreen = document.getElementById("startScreen");

    if (startScreen) {
        startScreen.style.display = "none";
    }
}

// =========================
// RESTART
// =========================

function restartGame() {

    position = 0;
    playerX = 0;
    speed = 0;

    nitro = 100;
    coins = 0;

    lap = 1;
    raceTime = 0;

    gameStarted = true;
    gameFinished = false;

    aiCars[0].z = 500;
    aiCars[1].z = 900;
    aiCars[2].z = 1400;
    aiCars[3].z = 1900;

    coinList.forEach(c => {
        c.collected = false;
    });

    const finishScreen = document.getElementById("finishScreen");

    if (finishScreen) {
        finishScreen.style.display = "none";
    }
}

// =========================
// UPDATE
// =========================

function update(dt) {

    if (!gameStarted || gameFinished) {
        return;
    }

    raceTime += dt;

    // ACCELERATION
    if (keys["w"] || keys["arrowup"]) {

        speed += acceleration * dt;

    } else {

        speed -= friction * dt;
    }

    // BRAKE
    if (keys["s"] || keys["arrowdown"]) {

        speed -= braking * dt;
    }

    // NITRO
    const usingNitro =
        keys[" "] ||
        keys["space"];

    if (usingNitro && nitro > 0 && speed > 150) {

        speed += 1100 * dt;

        nitro -= 35 * dt;

        if (nitro < 0) {
            nitro = 0;
        }

    } else {

        nitro += 8 * dt;

        if (nitro > 100) {
            nitro = 100;
        }
    }

    speed = Math.max(0, Math.min(maxSpeed, speed));

    // STEERING
    if (keys["a"] || keys["arrowleft"]) {

        playerX -= steering * dt * (speed / maxSpeed + 0.3);
    }

    if (keys["d"] || keys["arrowright"]) {

        playerX += steering * dt * (speed / maxSpeed + 0.3);
    }

    // KEEP CAR ON TRACK
    if (playerX < -1.2) {
        playerX = -1.2;
        speed *= 0.96;
    }

    if (playerX > 1.2) {
        playerX = 1.2;
        speed *= 0.96;
    }

    // MOVE PLAYER
    position += speed * dt;

    // LAP SYSTEM
    if (position >= trackLength) {

        position -= trackLength;

        lap++;

        if (lap > totalLaps) {

            finishRace();
            return;
        }
    }

    // MOVE AI
    aiCars.forEach(car => {

        car.z += car.speed * dt;

        if (car.z >= trackLength) {
            car.z -= trackLength;
        }
    });

    // COIN COLLECTION
    coinList.forEach(coin => {

        if (coin.collected) {
            return;
        }

        let distance = Math.abs(coin.z - position);

        if (distance < 100) {

            if (Math.abs(coin.x - playerX) < 0.25) {

                coin.collected = true;
                coins++;

            }
        }
    });

    updateHUD();
}

// =========================
// HUD
// =========================

function updateHUD() {

    const positionText =
        document.getElementById("position");

    const lapText =
        document.getElementById("lap");

    const speedText =
        document.getElementById("speed");

    const timeText =
        document.getElementById("time");

    const coinText =
        document.getElementById("coins");

    const nitroBar =
        document.getElementById("nitroFill");

    if (positionText) {

        positionText.textContent =
            "POS: " + getPlayerPosition();
    }

    if (lapText) {

        lapText.textContent =
            "LAP: " + lap + "/" + totalLaps;
    }

    if (speedText) {

        speedText.textContent =
            Math.floor(speed * 0.18) + " KM/H";
    }

    if (timeText) {

        timeText.textContent =
            formatTime(raceTime);
    }

    if (coinText) {

        coinText.textContent =
            "COINS: " + coins;
    }

    if (nitroBar) {

        nitroBar.style.width =
            nitro + "%";
    }
}

// =========================
// PLAYER POSITION
// =========================

function getPlayerPosition() {

    let positionNumber = 1;

    aiCars.forEach(car => {

        if (car.z > position) {
            positionNumber++;
        }
    });

    return Math.min(positionNumber, 5);
}

// =========================
// FINISH
// =========================

function finishRace() {

    gameFinished = true;

    speed = 0;

    const finishScreen =
        document.getElementById("finishScreen");

    const finalTime =
        document.getElementById("finalTime");

    const finalCoins =
        document.getElementById("finalCoins");

    if (finalTime) {

        finalTime.textContent =
            "Time: " + formatTime(raceTime);
    }

    if (finalCoins) {

        finalCoins.textContent =
            "Coins: " + coins;
    }

    if (finishScreen) {

        finishScreen.style.display = "flex";
    }
}

// =========================
// TIME FORMAT
// =========================

function formatTime(seconds) {

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}

// =========================
// DRAW SKY
// =========================

function drawSky() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    gradient.addColorStop(0, "#4da6ff");
    gradient.addColorStop(0.55, "#bde6ff");
    gradient.addColorStop(1, "#ffffff");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

// =========================
// DRAW MOUNTAINS
// =========================

function drawMountains() {

    ctx.fillStyle = "#6f8292";

    ctx.beginPath();

    ctx.moveTo(0, H * 0.48);

    for (let x = 0; x <= W; x += 100) {

        const y =
            H * 0.38 +
            Math.sin(x * 0.012) * 70 +
            Math.sin(x * 0.035) * 30;

        ctx.lineTo(x, y);
    }

    ctx.lineTo(W, H * 0.62);
    ctx.lineTo(0, H * 0.62);

    ctx.closePath();

    ctx.fill();
}

// =========================
// ROAD DRAWING
// =========================

function drawRoad() {

    const horizon = H * 0.42;
    const roadBottom = H;

    const segmentsToDraw = 70;

    let roadCenter = W / 2;

    for (let i = segmentsToDraw; i >= 1; i--) {

        const depth = i / segmentsToDraw;

        const y1 =
            horizon +
            (1 - depth) * (roadBottom - horizon);

        const y2 =
            horizon +
            (1 - (i - 1) / segmentsToDraw) *
            (roadBottom - horizon);

        const perspective1 =
            1 - depth;

        const perspective2 =
            1 - (i - 1) / segmentsToDraw;

        const width1 =
            80 +
            perspective1 * 850;

        const width2 =
            80 +
            perspective2 * 850;

        const segmentIndex =
            Math.floor(
                (position / segmentLength + i) %
                totalSegments
            );

        const segment =
            road[segmentIndex];

        roadCenter +=
            segment.curve *
            perspective1 *
            8;

        // GRASS
        ctx.fillStyle =
            segmentIndex % 2 === 0
                ? "#2f9e44"
                : "#28863b";

        ctx.fillRect(
            0,
            y1,
            W,
            y2 - y1
        );

        // ROAD
        ctx.fillStyle =
            segmentIndex % 2 === 0
                ? "#3d4147"
                : "#383c42";

        ctx.beginPath();

        ctx.moveTo(
            roadCenter - width1 / 2,
            y1
        );

        ctx.lineTo(
            roadCenter + width1 / 2,
            y1
        );

        ctx.lineTo(
            roadCenter + width2 / 2,
            y2
        );

        ctx.lineTo(
            roadCenter - width2 / 2,
            y2
        );

        ctx.closePath();

        ctx.fill();

        // ROAD EDGES
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(
            roadCenter - width1 / 2,
            y1
        );

        ctx.lineTo(
            roadCenter - width2 / 2,
            y2
        );

        ctx.moveTo(
            roadCenter + width1 / 2,
            y1
        );

        ctx.lineTo(
            roadCenter + width2 / 2,
            y2
        );

        ctx.stroke();

        // CENTER LINE
        if (segmentIndex % 4 < 2) {

            ctx.strokeStyle = "#ffe600";
            ctx.lineWidth = 5;

            ctx.beginPath();

            ctx.moveTo(
                roadCenter,
                y1
            );

            ctx.lineTo(
                roadCenter,
                y2
            );

            ctx.stroke();
        }
    }
}

// =========================
// DRAW PLAYER CAR
// =========================

function drawPlayer() {

    const carWidth = 110;
    const carHeight = 180;

    const x =
        W / 2 +
        playerX * 300;

    const y =
        H - 220;

    // SHADOW
    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 145,
        70,
        18,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // BODY
    ctx.fillStyle = "#e51f2a";

    ctx.beginPath();

    ctx.roundRect(
        x - carWidth / 2,
        y,
        carWidth,
        carHeight,
        20
    );

    ctx.fill();

    // WINDOWS
    ctx.fillStyle = "#17202a";

    ctx.beginPath();

    ctx.roundRect(
        x - 38,
        y + 25,
        76,
        60,
        12
    );

    ctx.fill();

    // LIGHTS
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        x - 42,
        y + 10,
        22,
        10
    );

    ctx.fillRect(
        x + 20,
        y + 10,
        22,
        10
    );

    // WHEELS
    ctx.fillStyle = "#111";

    ctx.fillRect(
        x - 62,
        y + 35,
        18,
        55
    );

    ctx.fillRect(
        x + 44,
        y + 35,
        18,
        55
    );

    ctx.fillRect(
        x - 62,
        y + 120,
        18,
        55
    );

    ctx.fillRect(
        x + 44,
        y + 120,
        18,
        55
    );

    // NITRO FLAME
    if (
        keys[" "] ||
        keys["space"]
    ) {

        if (nitro > 0) {

            ctx.fillStyle = "#00d9ff";

            ctx.beginPath();

            ctx.moveTo(
                x - 22,
                y + carHeight
            );

            ctx.lineTo(
                x,
                y + carHeight + 70
            );

            ctx.lineTo(
                x + 22,
                y + carHeight
            );

            ctx.closePath();

            ctx.fill();
        }
    }
}

// =========================
// DRAW AI CARS
// =========================

function drawAICars() {

    aiCars.forEach(car => {

        let distance =
            car.z - position;

        if (distance < 0) {
            distance += trackLength;
        }

        if (distance > 3500) {
            return;
        }

        const depth =
            1 - distance / 3500;

        const scale =
            Math.max(0.15, depth);

        const x =
            W / 2 +
            car.x * 300 * scale;

        const y =
            H * 0.42 +
            depth * (H * 0.43);

        const width =
            80 * scale;

        const height =
            130 * scale;

        ctx.fillStyle = car.color;

        ctx.beginPath();

        ctx.roundRect(
            x - width / 2,
            y - height,
            width,
            height,
            10
        );

        ctx.fill();

        ctx.fillStyle = "#15191e";

        ctx.fillRect(
            x - width * 0.32,
            y - height * 0.75,
            width * 0.64,
            height * 0.25
        );
    });
}

// =========================
// DRAW COINS
// =========================

function drawCoins() {

    coinList.forEach(coin => {

        if (coin.collected) {
            return;
        }

        let distance =
            coin.z - position;

        if (distance < 0) {
            distance += trackLength;
        }

        if (distance > 2800) {
            return;
        }

        const depth =
            1 - distance / 2800;

        const x =
            W / 2 +
            coin.x * 300 * depth;

        const y =
            H * 0.42 +
            depth * H * 0.45;

        const radius =
            7 + depth * 12;

        ctx.fillStyle = "#ffd700";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#fff";

        ctx.lineWidth = 2;

        ctx.stroke();
    });
}

// =========================
// DRAW EVERYTHING
// =========================

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawSky();

    drawMountains();

    drawRoad();

    drawCoins();

    drawAICars();

    drawPlayer();
}

// =========================
// GAME LOOP
// =========================

let lastTime = performance.now();

function gameLoop(now) {

    const dt =
        Math.min(
            (now - lastTime) / 1000,
            0.05
        );

    lastTime = now;

    update(dt);

    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// =========================
// MOBILE CONTROLS
// =========================

function setupMobileButton(id, key) {

    const button =
        document.getElementById(id);

    if (!button) {
        return;
    }

    button.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            keys[key] = true;
        }
    );

    button.addEventListener(
        "touchend",
        e => {

            e.preventDefault();

            keys[key] = false;
        }
    );

    button.addEventListener(
        "mousedown",
        () => {

            keys[key] = true;
        }
    );

    button.addEventListener(
        "mouseup",
        () => {

            keys[key] = false;
        }
    );
}

setupMobileButton("leftBtn", "a");
setupMobileButton("rightBtn", "d");
setupMobileButton("gasBtn", "w");
setupMobileButton("brakeBtn", "s");
setupMobileButton("nitroBtn", "space");

// =========================
// START BUTTON
// =========================

const startButton =
    document.getElementById("startButton");

if (startButton) {

    startButton.addEventListener(
        "click",
        startGame
    );
}

// =========================
// RESTART BUTTON
// =========================

const restartButton =
    document.getElementById("restartButton");

if (restartButton) {

    restartButton.addEventListener(
        "click",
        restartGame
    );
}
