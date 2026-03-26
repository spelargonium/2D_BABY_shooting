// ===== 初期設定 =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===== 画像 =====
const playerImg = new Image();
playerImg.src = "baby.png";

const virusImg = new Image();
virusImg.src = "virus_character.png";

// ===== シーン =====
let scene = "title";

// ===== 基本 =====
let player, frame, stage, stageTimer, score;
let gravity = 0.8;
let ground = 340;

// ===== 入力 =====
let shooting = false;
let charging = false;
let chargePower = 0;

// ===== オブジェクト =====
let enemies, bullets, enemyBullets;

// ===== ボス =====
let boss, bossActive;

// ===== 初期化 =====
function init() {
  player = {
    x: 100,
    y: 250,
    vy: 0,
    width: 60,
    height: 60,
    jumping: false,
    hp: 5,
    invincible: 0
  };

  frame = 0;
  stage = 1;
  stageTimer = 0;
  score = 0;

  enemies = [];
  bullets = [];
  enemyBullets = [];

  boss = null;
  bossActive = false;
}

// ===== 入力 =====
document.addEventListener("keydown", e => {
  if (scene === "title" || scene === "gameover" || scene === "clear") {
    scene = "game";
    init();
    return;
  }

  if (e.code === "Space" && !player.jumping) {
    player.vy = -15;
    player.jumping = true;
  }

  if (e.code === "KeyX") shooting = true;
  if (e.code === "KeyA") charging = true;
});

document.addEventListener("keyup", e => {
  if (e.code === "KeyX") shooting = false;

  if (e.code === "KeyA") {
    charging = false;

    bullets.push({
      x: player.x + 50,
      y: player.y + 30,
      power: Math.min(chargePower, 5),
      size: 10 + chargePower * 5,
      speed: 8
    });

    chargePower = 0;
  }
});

// ===== 更新 =====
function update() {
  if (scene !== "game") return;

  frame++;
  stageTimer++;
  score++;

  // ===== プレイヤー =====
  player.vy += gravity;
  player.y += player.vy;

  if (player.y > ground - player.height) {
    player.y = ground - player.height;
    player.vy = 0;
    player.jumping = false;
  }

  if (player.invincible > 0) player.invincible--;

  if (charging) chargePower += 0.2;

  // ===== 通常弾 =====
  if (shooting && frame % 10 === 0) {
    bullets.push({
      x: player.x + 50,
      y: player.y + 30,
      power: 1,
      size: 5,
      speed: 10
    });
  }

  // ===== ステージ =====
  if (stage === 1) {
    if (frame % 60 === 0) {
      enemies.push({ x: 800, y: ground - 40, type: "normal", speed: 4 });
    }
    if (stageTimer > 800) {
      stage = 2;
      stageTimer = 0;
      enemies = [];
    }
  }

  if (stage === 2) {
    if (frame % 40 === 0) enemies.push({ x: 800, y: ground - 40, type: "normal", speed: 4 });
    if (frame % 70 === 0) enemies.push({ x: 800, y: ground - 40, type: "fast", speed: 8 });
    if (frame % 90 === 0) enemies.push({ x: 800, y: ground - 40, type: "jump", vy: -12 });
    if (frame % 60 === 0) enemies.push({ x: 800, y: Math.random()*200, type: "fly", speed: 5 });

    if (stageTimer > 1200) {
      stage = 3;
      stageTimer = 0;
      enemies = [];
    }
  }

  if (stage === 3 && !bossActive) {
    bossActive = true;
    boss = { x: 500, y: 150, hp: 120, maxHp: 120 };
  }

  // ===== 敵 =====
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.x -= e.speed || 4;

    if (e.type === "fly") e.y += Math.sin(frame * 0.1) * 3;

    if (e.type === "jump") {
      e.y += e.vy;
      e.vy += 0.6;
      if (e.y > ground - 40) {
        e.y = ground - 40;
        e.vy = -10;
      }
    }

    // 画面外削除
    if (e.x < -50) enemies.splice(i, 1);
  }

  // ===== ボス =====
  if (bossActive && boss) {
    boss.y += (player.y - boss.y + (Math.random() - 0.5) * 40) * 0.02;

    if (frame % 25 === 0) {
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        enemyBullets.push({
          x: boss.x,
          y: boss.y + 60,
          vx: -2,
          vy: i * 0.8
        });
      }
    }

    if (frame % 60 === 0) {
      let dx = player.x - boss.x;
      let dy = player.y - boss.y;
      let len = Math.sqrt(dx * dx + dy * dy);

      enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: dx / len * 4,
        vy: dy / len * 4
      });
    }
  }

  // ===== 弾 =====
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.speed;

    if (b.x > 820) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let b = enemyBullets[i];
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < -50 || b.x > 850 || b.y < -50 || b.y > 450) {
      enemyBullets.splice(i, 1);
    }
  }

  // ===== 被弾 =====
  function hit() {
    if (player.invincible > 0) return;
    player.hp--;
    player.invincible = 60;
    if (player.hp <= 0) scene = "gameover";
  }

  enemies.forEach(e => {
    if (
      player.x < e.x + 40 &&
      player.x + 60 > e.x &&
      player.y < e.y + 40 &&
      player.y + 60 > e.y
    ) hit();
  });

  enemyBullets.forEach(b => {
    if (
      player.x < b.x &&
      player.x + 60 > b.x &&
      player.y < b.y &&
      player.y + 60 > b.y
    ) hit();
  });

  // ===== 弾ヒット =====
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    let b = bullets[bi];

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      let e = enemies[ei];
      if (b.x > e.x && b.y > e.y && b.y < e.y + 40) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score += 100;
        break;
      }
    }

    if (boss && b.x > boss.x && b.y > boss.y && b.y < boss.y + 120) {
      boss.hp -= b.power;
      bullets.splice(bi, 1);

      if (boss.hp <= 0) {
        boss = null;
        bossActive = false;
        scene = "clear";
      }
    }
  }
}

// ===== 描画 =====


function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (scene === "title") {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,800,400);
    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.fillText("BABY GAME",250,180);
    ctx.font = "20px";
    ctx.fillText("Press Space",300,220);
    return;
  }

  if (scene === "clear") {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,800,400);
    ctx.fillStyle = "yellow";
    ctx.font = "40px";
    ctx.fillText("CLEAR!",300,180);
    ctx.font = "20px";
    ctx.fillText("Score: "+score,300,220);
    return;
  }

  // ===== 通常描画 =====
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0,0,800,400);

  ctx.fillStyle = "green";
  ctx.fillRect(0,ground,800,60);

  if (player.invincible % 10 < 5) {
    ctx.drawImage(playerImg, player.x, player.y, 60, 60);
  }

  enemies.forEach(e=>{
    ctx.drawImage(virusImg,e.x,e.y,40,40);
  });

  bullets.forEach(b=>{
    ctx.fillStyle = b.power > 1 ? "yellow" : "red";
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.size,0,Math.PI*2);
    ctx.fill();
  });

  enemyBullets.forEach(b=>{
    ctx.fillStyle="blue";
    ctx.fillRect(b.x,b.y,6,6);
  });

  if (boss) {
    ctx.drawImage(virusImg,boss.x,boss.y,120,120);
    ctx.fillStyle="red";
    ctx.fillRect(boss.x,boss.y-10,(boss.hp/boss.maxHp)*120,6);
  }

  ctx.fillStyle="black";
  ctx.fillText("HP:"+player.hp,10,30);
  ctx.fillText("Score:"+score,10,50);

  if (scene === "gameover") {
    ctx.font="40px";
    ctx.fillText("GAME OVER",250,200);
  }
}

// ===== ループ =====
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();