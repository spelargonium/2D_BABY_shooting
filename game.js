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
let level = 1;
let speed = 5;
let bossActive = false;

// ===== カービィ風 =====
let floating = false;
let sucking = false;
let shooting = false;
let ability = "normal";

// ===== オブジェクト =====
let obstacles = [];
let bullets = [];
let particles = [];
let boss = null;

// ===== 背景 =====
let clouds = [];
let buildings = [];

for (let i = 0; i < 5; i++) {
  clouds.push({ x: i * 200, y: Math.random() * 100 });
  buildings.push({ x: i * 300, h: 100 + Math.random() * 100 });
}

// ===== 入力 =====
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!player.jumping) {
      player.vy = -15;
      player.jumping = true;
    } else {
      floating = true;
    }
  }
  if (e.code === "KeyZ") sucking = true;
  if (e.code === "KeyX") shooting = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code === "Space") floating = false;
  if (e.code === "KeyZ") sucking = false;
  if (e.code === "KeyX") shooting = false;
});

// ===== コピー能力 =====
function copyAbility(enemy) {
  ability = enemy.type;
}

// ===== 更新 =====
function update() {
  if (gameOver) return;

  frame++;
  score++;

  if (score % 300 === 0) {
    level++;
    speed++;
  }

  // ===== ボス出現 =====
  if (level % 5 === 0 && !bossActive) {
    bossActive = true;
    boss = {
      x: canvas.width,
      y: 200,
      width: 120,
      height: 120,
      hp: 20,
      maxHp: 20,
      phase: 1
    };
  }

  // ===== プレイヤー =====
  player.vy += gravity;
  player.y += player.vy;

  if (player.y > ground - player.height) {
    player.y = ground - player.height;
    player.vy = 0;
    player.jumping = false;
  }

  if (floating) player.vy -= 0.5;

  // ===== 背景 =====
  clouds.forEach(c => {
    c.x -= 1;
    if (c.x < -50) c.x = canvas.width;
  });

  buildings.forEach(b => {
    b.x -= 2;
    if (b.x < -50) b.x = canvas.width;
  });

  // ===== 敵生成 =====
  if (!bossActive && frame % 60 === 0) {
    let types = ["normal", "fire", "ice", "flying", "fast", "big"];
    let type = types[Math.floor(Math.random() * types.length)];

    let enemy = {
      x: canvas.width,
      width: 40,
      height: 40,
      type,
      frozen: 0,
      hp: type === "big" ? 3 : 1,
      speed: type === "fast" ? speed + 3 : speed
    };

    enemy.y = (type === "flying") ? 150 + Math.random() * 150 : ground - 40;

    obstacles.push(enemy);
  }

  // ===== 敵更新 =====
  obstacles.forEach(o => {
    if (o.frozen > 0) {
      o.frozen--;
    } else {
      o.x -= o.speed;

      if (o.type === "flying") {
        o.y += (player.y < o.y ? -1 : 1);
      }
    }

    // 衝突
    if (
      !sucking &&
      player.x < o.x + o.width &&
      player.x + player.width > o.x &&
      player.y < o.y + o.height &&
      player.y + player.height > o.y
    ) {
      createParticles(player.x, player.y);
      gameOver = true;
    }
  });

  // ===== ボス衝突 =====
  if (bossActive && boss) {
    if (
      !sucking &&
      player.x < boss.x + boss.width &&
      player.x + player.width > boss.x &&
      player.y < boss.y + boss.height &&
      player.y + player.height > boss.y
    ) {
      createParticles(player.x, player.y);
      gameOver = true;
    }
  }

  // ===== 吸い込み =====
  obstacles = obstacles.filter(o => {
    let dx = player.x - o.x;

    if (sucking && Math.abs(dx) < 150) o.x += dx * 0.1;

    if (sucking && Math.abs(dx) < 20) {
      copyAbility(o);
      createParticles(o.x, o.y);
      return false;
    }

    return o.x > -50;
  });

  // ===== 弾 =====
  if (shooting && frame % 10 === 0) {
    bullets.push({
      x: player.x + player.width,
      y: player.y + player.height * 0.7,
      r: 5,
      type: ability,
      speed: ability === "ice" ? 6 : 10
    });
  }

  bullets.forEach(b => b.x += b.speed);

  // ===== 弾衝突 =====
  bullets.forEach((b, bi) => {

    obstacles.forEach((o, oi) => {
      if (
        b.x < o.x + o.width &&
        b.x > o.x &&
        b.y < o.y + o.height &&
        b.y > o.y
      ) {
        if (b.type === "ice") {
          o.frozen = 30;
        } else {
          o.hp--;
          if (o.hp <= 0) {
            createParticles(o.x, o.y);
            obstacles.splice(oi, 1);
          }
        }
        bullets.splice(bi, 1);
        score += 50;
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
      }
    }
  });

  // ===== ボス更新 =====
  if (bossActive && boss) {

    // 追尾AI
    boss.y += (player.y - boss.y) * 0.02;

    // フェーズ2
    if (boss.hp < boss.maxHp / 2) {
      boss.phase = 2;
    }

    boss.x -= boss.phase === 1 ? 1 : 2;

    // 攻撃
    if (frame % (boss.phase === 1 ? 60 : 30) === 0) {
      obstacles.push({
        x: boss.x,
        y: boss.y + 50,
        width: 30,
        height: 30,
        type: "fire",
        speed: 7,
        hp: 1
      });
    }

    if (boss.hp <= 0) {
      createParticles(boss.x, boss.y);
      bossActive = false;
      boss = null;
      level++;
    }
  }

  // ===== パーティクル =====
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });

  particles = particles.filter(p => p.life > 0);
}

// ===== パーティクル =====
function createParticles(x, y) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x,
      y,
      vx: Math.random() * 6 - 3,
      vy: Math.random() * -6,
      life: 30
    });
  }
}

// ===== 描画 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  clouds.forEach(c => ctx.fillRect(c.x, c.y, 40, 20));
  buildings.forEach(b => ctx.fillRect(b.x, ground - b.h, 50, b.h));

  ctx.fillStyle = "green";
  ctx.fillRect(0, ground, canvas.width, 60);

  let bounce = Math.sin(frame * 0.2) * 3;

  ctx.save();
  ctx.beginPath();
  ctx.arc(player.x + 30, player.y + 30 + bounce, 30, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(playerImg, player.x, player.y + bounce, 60, 60);
  ctx.restore();

  // 敵
  obstacles.forEach(o => {
    ctx.fillStyle = o.frozen > 0 ? "lightblue" : "purple";
    ctx.fillRect(o.x, o.y, o.width, o.height);
  });

  // ボス
  if (bossActive && boss) {
    ctx.fillStyle = "black";
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

    // HPバー
    ctx.fillStyle = "red";
    ctx.fillRect(boss.x, boss.y - 10, (boss.hp / boss.maxHp) * boss.width, 5);
  }

  // 弾
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // パーティクル
  particles.forEach(p => {
    ctx.fillRect(p.x, p.y, 4, 4);
  });

  // UI
  ctx.fillStyle = "black";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Level: " + level, 10, 60);

  if (gameOver) {
    ctx.font = "40px sans-serif";
    ctx.fillText("GAME OVER", 250, 200);
  }
}

// ===== ループ =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();