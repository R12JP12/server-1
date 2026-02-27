// GRREENCraft prototype engine
// Original code by R12JP12

class GRWorld {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.blocks = this.createFlatWorld();
  }

  createFlatWorld() {
    const blocks = [];
    for (let x = 0; x < this.width; x++) {
      blocks[x] = [];
      for (let y = 0; y < this.height; y++) {
        blocks[x][y] = y > this.height / 2 ? "air" : "grass";
      }
    }
    return blocks;
  }
}

class GRRenderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.world = world;
    this.blockSize = 16;

    this.textures = {
      grass: this.loadTexture("textures/grass.png"),
      air: this.loadTexture("textures/air.png")
    };
  }

  loadTexture(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  draw(player) {
    const { ctx, blockSize, world, textures, canvas } = this;

    // Camera centers on the player
    const cameraX = player.x * blockSize - canvas.width / 2;
    const cameraY = player.y * blockSize - canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        const block = world.blocks[x][y];
        const tex = textures[block];

        const screenX = x * blockSize - cameraX;
        const screenY = y * blockSize - cameraY;

        if (tex && tex.complete) {
          ctx.drawImage(tex, screenX, screenY, blockSize, blockSize);
        } else {
          ctx.fillStyle = block === "grass" ? "#3cb043" : "#87ceeb";
          ctx.fillRect(screenX, screenY, blockSize, blockSize);
        }
      }
    }

    // Draw the player as a simple square for now
    ctx.fillStyle = "red";
    ctx.fillRect(
      canvas.width / 2 - blockSize / 2,
      canvas.height / 2 - blockSize / 2,
      blockSize,
      blockSize
    );
  }
}

class GRPlayer {
  constructor() {
    this.x = 10;
    this.y = 10;
    this.speed = 0.1;
  }
}

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

window.addEventListener("load", () => {
  const canvas = document.getElementById("game");
  const world = new GRWorld(40, 30);
  const renderer = new GRRenderer(canvas, world);
  const player = new GRPlayer();

  // Block breaking & placing
  canvas.addEventListener("mousedown", e => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / renderer.blockSize);
    const y = Math.floor((e.clientY - rect.top) / renderer.blockSize);

    if (e.button === 0) {
      world.blocks[x][y] = "air"; // break
    } else if (e.button === 2) {
      world.blocks[x][y] = "grass"; // place
    }
  });

  // Disable right-click menu
  window.addEventListener("contextmenu", e => e.preventDefault());

  // Game loop
  function update() {
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;

    renderer.draw(player); // IMPORTANT FIX
    requestAnimationFrame(update);
  }

  update();
});
