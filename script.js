// Constantes y configuraciones
const PLAYER_WIDTH = 40; // Ancho del jugador
const CANVAS_WIDTH = 600; // Ancho del canvas
const JUMP_HEIGHT = 100; // Altura máxima del salto
const STEP_SIZE = 2; // Tamaño del paso al caminar
const COLLISION_MARGIN = 30; // Margen de colisión con la puerta
const LEG_FRAMES = [0, 1, 2, 1]; // Secuencia de animación de las piernas

// Elementos del DOM
const playerCanvas = document.getElementById("playerCanvas");
const ctx = playerCanvas.getContext("2d");
const door = document.getElementById("door");
const levelElement = document.getElementById("level");
const scoreElement = document.getElementById("score");
const sceneContainer = document.querySelector(".scene-container");

// Estado del juego
const gameState = {
    level: 1,
    score: 0,
    isJumping: false,
    walkPosition: 50,
    moveDirection: null, // 'left', 'right', o null
    lastMoveDirection: "right",
    jumpHeight: 0,
    isFalling: false,
    legFrame: 0,
    animationFrame: 0,
    isWalking: false,
    stepCount: 0,
    isGameOver: false,
};

// Objetos del juego
const barranco = {
    x: 50,
    width: 40,
    isActive: false,
    fallHeight: 0,
};

const piso = {
    altura: 20,
    ancho: CANVAS_WIDTH,
    desapareciendo: false,
    anchoDesaparecido: 0,
};

// Dibujar al jugador
function drawPlayer() {
    ctx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);

    // Cabeza
    ctx.fillStyle = "black";
    ctx.fillRect(17, 30, 7, 7);

    // Cuerpo
    ctx.fillRect(15, 37, 12, 13);

    // Piernas (animación)
    if (gameState.isWalking || gameState.isJumping) {
        if (gameState.lastMoveDirection === "left") {
            drawLegsLeft();
        } else if (gameState.lastMoveDirection === "right") {
            drawLegsRight();
        }
    } else {
        drawLegsStatic();
    }
}

// Dibujar piernas (izquierda)
function drawLegsLeft() {
    ctx.fillRect(11, 46, 11, 6);
    ctx.fillRect(20, 46, 7, 4);
    ctx.fillRect(11, 51, 5, 3);
    ctx.fillRect(22, 49, 11, 5);
}

// Dibujar piernas (derecha)
function drawLegsRight() {
    ctx.fillRect(20, 46, 11, 4);
    ctx.fillRect(15, 46, 5, 6);
    ctx.fillRect(25, 49, 6, 5);
    ctx.fillRect(10, 49, 10, 5);
}

// Dibujar piernas (estáticas)
function drawLegsStatic() {
    ctx.fillRect(15, 50, 5, 20);
    ctx.fillRect(22, 50, 5, 20);
}

// Animar las piernas
function animateLegs() {
    if (gameState.moveDirection !== null) {
        gameState.animationFrame++;
        if (gameState.animationFrame >= 10) {
            gameState.legFrame = (gameState.legFrame + 1) % LEG_FRAMES.length;
            gameState.animationFrame = 0;
        }
    }
    drawPlayer();
    requestAnimationFrame(animateLegs);
}

// Manejadores de eventos de teclado
function handleKeyUp(event) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        gameState.moveDirection = null;
        gameState.isWalking = false;
        playerCanvas.classList.remove("walking");
    }
}

function handleKeyDown(event) {
    if ((event.key === " " || event.key === "ArrowUp") && !gameState.isJumping) {
        jump();
    }

    if (event.key === "ArrowRight") {
        gameState.moveDirection = "right";
        gameState.lastMoveDirection = "right";
        playerCanvas.classList.add("walking");
    }
    if (event.key === "ArrowLeft") {
        gameState.moveDirection = "left";
        gameState.lastMoveDirection = "left";
        playerCanvas.classList.add("walking");
    }
}

// Saltar
function jump() {
    if (gameState.isJumping) return;
    gameState.isJumping = true;
    gameState.isFalling = false;
    gameState.jumpHeight = 0;
    requestAnimationFrame(handleJump);
}

function handleJump() {
    if (gameState.jumpHeight >= JUMP_HEIGHT) {
        gameState.isFalling = true;
        requestAnimationFrame(handleFall);
        return;
    }
    gameState.jumpHeight += 5;
    playerCanvas.style.bottom = `${gameState.jumpHeight}px`;
    requestAnimationFrame(handleJump);
}

function handleFall() {
    if (gameState.jumpHeight <= 0) {
        gameState.isJumping = false;
        gameState.isFalling = false;
        return;
    }
    gameState.jumpHeight -= 5;
    playerCanvas.style.bottom = `${gameState.jumpHeight}px`;
    requestAnimationFrame(handleFall);
}

// Verificar colisión con el barranco
function checkBarrancoCollision() {
    if (
        barranco.isActive &&
        gameState.walkPosition >= barranco.x &&
        gameState.walkPosition <= barranco.x + barranco.width &&
        piso.anchoDesaparecido >= barranco.width &&
        !gameState.isJumping
    ) {
        alert(`¡Caíste en el barranco! Puntuación: ${gameState.score}`);
        resetGame();
    }
}

// Mover al jugador
function movePlayer() {
    if (gameState.isGameOver) return;

    if (gameState.moveDirection === "left" && gameState.walkPosition > 0) {
        gameState.walkPosition -= STEP_SIZE;
        updateStepCount();
    } else if (gameState.moveDirection === "right" && gameState.walkPosition < CANVAS_WIDTH - PLAYER_WIDTH) {
        gameState.walkPosition += STEP_SIZE;
        updateStepCount();
    }

    playerCanvas.style.left = `${gameState.walkPosition}px`;
    finishGame();
    activateBarranco();
    checkBarrancoCollision();
    requestAnimationFrame(movePlayer);
}

// Actualizar el contador de pasos
function updateStepCount() {
    gameState.stepCount++;
    if (gameState.stepCount % 10 === 0) {
        gameState.isWalking = !gameState.isWalking;
    }
}

// Activar el barranco
function activateBarranco() {
    if (gameState.walkPosition === 320) {
        sceneContainer.classList.add("eliminar-seccion");
        barranco.isActive = true;
        piso.desapareciendo = true;
    }
}

// Finalizar el juego
function finishGame() {
    const playerRect = playerCanvas.getBoundingClientRect();
    const doorRect = door.getBoundingClientRect();

    if (
        playerRect.left + COLLISION_MARGIN < doorRect.right &&
        playerRect.right - COLLISION_MARGIN > doorRect.left &&
        playerRect.bottom > doorRect.top
    ) {
        stopGame();
        nextGame();
    }
}

// Detener el juego
function stopGame() {
    playerCanvas.classList.remove("walking");
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    gameState.isWalking = false;
    gameState.moveDirection = null;
}

// Reiniciar el juego
function resetGame() {
    stopGame();
    Object.assign(gameState, {
        level: 1,
        score: 0,
        isJumping: false,
        walkPosition: 50,
        moveDirection: null,
        lastMoveDirection: "right",
        jumpHeight: 0,
        isFalling: false,
        legFrame: 0,
        animationFrame: 0,
        isWalking: false,
        stepCount: 0,
    });

    barranco.isActive = false;
    piso.desapareciendo = false;
    levelElement.textContent = gameState.level;
    scoreElement.textContent = gameState.score;
}

// Siguiente nivel
function nextGame() {
   // ganaste
}

// Inicialización
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
animateLegs();
movePlayer();