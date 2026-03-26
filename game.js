const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===== 画像 =====
const playerImg = new Image();
playerImg.src = "baby.png";

// ===== プレイヤー =====
let player = {
  x: 100,
  y: 250,
  vy: 0,
  width: 60,
  height: 60,
  jumping: false
};

let gravity = 0.8;
let ground = 340;

// ===== 状態 =====
let frame = 0;
let gameOver = false;
let score = 0;

// ===== 操作 =====
let shooting = false;

// ===== オブジェクト =====
let obstacles = [];
let bullets = [];
let enemyBullets = [];

// ===== ボス =====
let boss = null;
let bossActive = false;

// ===== 入力 =====
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !player.jumping) {
    player.vy = -15;
    player.jumping = true;
  }
  if (e.code === "KeyX") shooting = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code === "KeyX") shooting = false;
});

// ===== スマホ操作 =====
window.addEventListener("DOMContentLoaded", () => {
  const jumpBtn = document.getElementById("jump-btn");
  const shootBtn = document.getElementById("shoot-btn");

  if (jumpBtn) {
    jumpBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (!player.jumping) {
        player.vy = -15;
        player.jumping = true;
      }
    });
    jumpBtn.addEventListener("click", () => {
      if (!player.jumping) {
        player.vy = -15;
        player.jumping = true;
      }
    });
  }

  if (shootBtn) {
    shootBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      shooting = true;
    });
    shootBtn.addEventListener("touchend", () => shooting = false);
    shootBtn.addEventListener("click", () => shooting = true);
  }
});

// ===== 更新 =====
function update() {
  if (gameOver) return;

  frame++;
  score++;

  // ===== プレイヤー =====
  player.vy += gravity;
  player.y += player.vy;

  if (player.y > ground - player.height) {
    player.y = ground - player.height;
    player.vy = 0;
    player.jumping = false;
  }

  // ===== 敵 =====
  if (!bossActive && frame % 60 === 0) {
    obstacles.push({
      x: canvas.width,
      y: ground - 40,
      width: 40,
      height: 40,
      speed: 5
    });
  }

  obstacles.forEach(o => o.x -= o.speed);

  // ===== ボス出現 =====
  if (score > 1000 && !bossActive) {
    bossActive = true;
    boss = {
      x: canvas.width,
      y: 150,
      width: 120,
      height: 120,
      hp: 50,
      maxHp: 50
    };
  }

  // ===== ボス行動（弾幕） =====
  if (bossActive && boss) {
    boss.x = 500;
    boss.y += (player.y - boss.y) * 0.03;

    // 弾幕①：ばらまき
    if (frame % 30 === 0) {
      for (let i = 0; i < 6; i++) {
        enemyBullets.push({
          x: boss.x,
          y: boss.y + 60,
          vx: -3,
          vy: (i - 3) * 1.2
        });
      }
    }

    // 弾幕②：プレイヤー狙い
    if (frame % 50 === 0) {
      let dx = player.x - boss.x;
      let dy = player.y - boss.y;
      let len = Math.sqrt(dx * dx + dy * dy);

      enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: (dx / len) * 6,
        vy: (dy / len) * 6
      });
    }
  }

  // ===== 自機弾 =====
  if (shooting && frame % 10 === 0) {
    bullets.push({
      x: player.x + 50,
      y: player.y + 30
    });
  }

  bullets.forEach(b => b.x += 10);

  // ===== 敵弾 =====
  enemyBullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
  });

  // ===== 衝突 =====
  obstacles.forEach(o => {
    if (
      player.x < o.x + o.width &&
      player.x + player.width > o.x &&
      player.y < o.y + o.height &&
      player.y + player.height > o.y
    ) gameOver = true;
  });

  enemyBullets.forEach(b => {
    if (
      player.x < b.x &&
      player.x + player.width > b.x &&
      player.y < b.y &&
      player.y + player.height > b.y
    ) gameOver = true;
  });

  // ===== 弾と敵 =====
  bullets.forEach((b, bi) => {
    obstacles.forEach((o, oi) => {
      if (
        b.x < o.x + o.width &&
        b.x > o.x &&
        b.y < o.y + o.height &&
        b.y > o.y
      ) {
        obstacles.splice(oi, 1);
        bullets.splice(bi, 1);
        score += 100;
      }
    });

    // ボス
    if (bossActive && boss) {
      if (
        b.x < boss.x + boss.width &&
        b.x > boss.x &&
        b.y < boss.y + boss.height &&
        b.y > boss.y
      ) {
        boss.hp--;
        bullets.splice(bi, 1);

        if (boss.hp <= 0) {
          bossActive = false;
          boss = null;
          enemyBullets = [];
          score += 2000;
        }
      }
    }
  });
}

// ===== 描画 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "green";
  ctx.fillRect(0, ground, canvas.width, 60);

  ctx.drawImage(playerImg, player.x, player.y, 60, 60);

  obstacles.forEach(o => {
    ctx.fillStyle = "purple";
    ctx.fillRect(o.x, o.y, o.width, o.height);
  });

  bullets.forEach(b => {
    ctx.fillStyle = "red";
    ctx.fillRect(b.x, b.y, 10, 5);
  });

  enemyBullets.forEach(b => {
    ctx.fillStyle = "blue";
    ctx.fillRect(b.x, b.y, 6, 6);
  });

  // ボス
  if (bossActive && boss) {
    ctx.fillStyle = "black";
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

    ctx.fillStyle = "red";
    ctx.fillRect(boss.x, boss.y - 10, (boss.hp / boss.maxHp) * boss.width, 5);
  }

  ctx.fillStyle = "black";
  ctx.fillText("Score: " + score, 10, 30);

  if (gameOver) {
    ctx.font = "40px sans-serif";
    ctx.fillText("GAME OVER", 250, 200);
  }
}

// ===== リスタート =====
document.addEventListener("touchstart", () => {
  if (gameOver) location.reload();
});

document.addEventListener("keydown", (e) => {
  if (gameOver && e.code === "Space") location.reload();
});

// ===== ループ =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();