// GRREENCraft prototype engine
// Original code by R12JP12

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

class GRWorld {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.blocks = this.generateWorld();
  }

  generateWorld() {
    const blocks = [];

    const baseHeight = Math.floor(this.height * 0.5);
    const amplitude = 6;
    const smoothness = 20;
    const biomeSize = 20;

    for (let x = 0; x < this.width; x++) {
      blocks[x] = [];

      const biomeIndex = Math.floor(x / biomeSize) % 4;
      let biome = "plains";
      if (biomeIndex === 1) biome = "forest";
      else if (biomeIndex === 2) biome = "desert";
      else if (biomeIndex === 3) biome = "mountains";

      let height =
        baseHeight +
        Math.floor(
          Math.sin(x / smoothness) * amplitude +
          Math.sin(x / (smoothness * 0.5)) * (amplitude * 0.5)
        );

      if (biome === "mountains") height -= 4;
      else if (biome === "desert") height += 2;

      for (let y = 0; y < this.height; y++) {
        let block = "air";

        if (y < height) block = "air";
        else if (y === height) block = biome === "desert" ? "sand" : "grass";
        else if (y < height + 3) block = biome === "desert" ? "sand" : "dirt";
        else block = "stone";

        blocks[x][y] = block;
      }
    }

    this.generateCaves(blocks);
    this.generateMineshafts(blocks);
    this.generateTrees(blocks);

    return blocks;
  }

  generateCaves(blocks) {
    const caveChance = 0.08;

    for (let x = 0; x < this.width; x++) {
      for (let y = 10; y < this.height; y++) {
        if (Math.random() < caveChance && blocks[x][y] === "stone") {
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = x + dx;
              const ny = y + dy;
              if (
                nx >= 0 &&
                ny >= 0 &&
                nx < this.width &&
                ny < this.height &&
                blocks[nx][ny] === "stone"
              ) {
                blocks[nx][ny] = "air";
              }
            }
          }
        }
      }
    }
  }

  generateMineshafts(blocks) {
    const shaftCount = 3;

    for (let i = 0; i < shaftCount; i++) {
      const startX = Math.floor(Math.random() * (this.width - 20)) + 10;
      const startY = Math.floor(Math.random() * (this.height - 20)) + 15;
      const length = Math.floor(Math.random() * 25) + 15;

      for (let x = startX; x < startX + length && x < this.width - 1; x++) {
        const y = startY;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < this.height) blocks[x][ny] = "air";
        }

        if (y + 2 < this.height) blocks[x][y + 2] = "planks";

        if ((x - startX) % 4 === 0) {
          if (y + 1 < this.height) blocks[x][y + 1] = "log";
          if (y - 1 >= 0) blocks[x][y - 1] = "log";
        }
      }
    }
  }

  generateTrees(blocks) {
    for (let x = 2; x < this.width - 2; x++) {
      let surfaceY = -1;
      for (let y = 0; y < this.height; y++) {
        if (blocks[x][y] === "grass" || blocks[x][y] === "sand") {
          surfaceY = y;
          break;
        }
      }
      if (surfaceY === -1) continue;

      if (blocks[x][surfaceY] !== "grass") continue;

      if (Math.random() < 0.12) {
        this.placeTree(blocks, x, surfaceY - 1);
      }
    }
  }

  placeTree(blocks, x, y) {
    const height = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < height; i++) {
      const ty = y - i;
      if (ty >= 0) blocks[x][ty] = "log";
    }

    const leafRadius = 2;
    const topY = y - height + 1;

    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
      for (let dy = -leafRadius; dy <= leafRadius; dy++) {
        const nx = x + dx;
        const ny = topY + dy;
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < this.width &&
          ny < this.height &&
          Math.abs(dx) + Math.abs(dy) < leafRadius + 1 &&
          blocks[nx][ny] === "air"
        ) {
          blocks[nx][ny] = "leaves";
        }
      }
    }
  }
}

class GRRenderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.world = world;
    this.blockSize = 32;

    this.textures = {
      sky: this.loadTexture("textures/sky.png"),
      grass: this.loadTexture("textures/grass.png"),
      dirt: this.loadTexture("textures/dirt.png"),
      stone: this.loadTexture("textures/stone.png"),
      sand: this.loadTexture("textures/sand.png"),
      leaves: this.loadTexture("textures/leaves.png"),
      log: this.loadTexture("textures/log.png"),
      planks: this.loadTexture("textures/planks.png"),
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

    // SKY (non-repeating)
    const skyTex = textures.sky;
    if (skyTex && skyTex.complete) {
      ctx.drawImage(skyTex, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const cameraX = player.x * blockSize - canvas.width / 2;
    const cameraY = player.y * blockSize - canvas.height / 2;

    // WORLD
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        const block = world.blocks[x][y];
        const tex = textures[block];

        const screenX = x * blockSize - cameraX;
        const screenY = y * blockSize - cameraY;

        if (tex && tex.complete) {
          ctx.drawImage(tex, screenX, screenY, blockSize, blockSize);
        } else {
          ctx.fillStyle =
            block === "grass" ? "#3cb043" :
            block === "dirt" ? "#8b4513" :
            block === "stone" ? "#777777" :
            block === "sand" ? "#d9c27f" :
            block === "leaves" ? "#2e8b57" :
            block === "log" ? "#5b3a1a" :
            block === "planks" ? "#b58a5a" :
            "#87ceeb";

          ctx.fillRect(screenX, screenY, blockSize, blockSize);
        }
      }
    }

    // PLAYER
    ctx.fillStyle = "blue";
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
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.01;
    this.jumpForce = -0.25;
    this.grounded = false;
  }
}

function isSolid(world, x, y) {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return true;
  const block = world.blocks[x][y];
  return block !== "air" && block !== "leaves";
}

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

window.addEventListener("load", () => {
  const canvas = document.getElementById("game");

  resizeCanvas(canvas);
  window.addEventListener("resize", () => resizeCanvas(canvas));

  const world = new GRWorld(200, 120);
  const renderer = new GRRenderer(canvas, world);
  const player = new GRPlayer();

  canvas.addEventListener("mousedown", e => {
    const rect = canvas.getBoundingClientRect();
    const blockSize = renderer.blockSize;

    const cameraX = player.x * blockSize - canvas.width / 2;
    const cameraY = player.y * blockSize - canvas.height / 2;

    const worldX = Math.floor((e.clientX - rect.left + cameraX) / blockSize);
    const worldY = Math.floor((e.clientY - rect.top + cameraY) / blockSize);

    if (
      worldX < 0 ||
      worldY < 0 ||
      worldX >= world.width ||
      worldY >= world.height
    ) return;

    if (e.button === 0) world.blocks[worldX][worldY] = "air";
    else if (e.button === 2) world.blocks[worldX][worldY] = "grass";
  });

  window.addEventListener("contextmenu", e => e.preventDefault());

  function update() {
    if (keys["ArrowLeft"]) player.vx = -player.speed;
    else if (keys["ArrowRight"]) player.vx = player.speed;
    else player.vx = 0;

    if (keys[" "] && player.grounded) {
      player.vy = player.jumpForce;
      player.grounded = false;
    }

    player.vy += player.gravity;

    let nextX = player.x + player.vx;
    let nextY = player.y + player.vy;

    if (!isSolid(world, Math.floor(nextX), Math.floor(player.y))) {
      player.x = nextX;
    }

    if (!isSolid(world, Math.floor(player.x), Math.floor(nextY))) {
      player.y = nextY;
      player.grounded = false;
    } else {
      if (player.vy > 0) {
        player.y = Math.floor(player.y);
        player.grounded = true;
      }
      player.vy = 0;
    }

    renderer.draw(player);
    requestAnimationFrame(update);
  }

  update();
});
