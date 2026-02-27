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

  draw() {
    const { ctx, blockSize, world, textures } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        const block = world.blocks[x][y];
        const tex = textures[block];

        if (tex && tex.complete) {
          ctx.drawImage(tex, x * blockSize, y * blockSize, blockSize, blockSize);
        } else {
          ctx.fillStyle = block === "grass" ? "#3cb043" : "#87ceeb";
          ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
      }
    }
  }
}

window.addEventListener("load", () => {
  const canvas = document.getElementById("game");
  const world = new GRWorld(40, 30);
  const renderer = new GRRenderer(canvas, world);
  renderer.draw();
});
