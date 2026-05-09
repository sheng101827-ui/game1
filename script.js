var vertexHeight = 500;
var planeDefinition = 50;
var planeSize = 15000;
var enemyattackFrequency = 1000;
var lives = 3;
var BulletsFired = 0;
var Kills = 0;
var cx = 0, cy = 0, cz = 0;
var bullets = [];
var enemies = [];
var exploders = [];

function createShipTexture() {
  var canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  var ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 10;
  
  ctx.beginPath();
  ctx.moveTo(128, 10);
  ctx.lineTo(200, 80);
  ctx.lineTo(160, 70);
  ctx.lineTo(128, 85);
  ctx.lineTo(96, 70);
  ctx.lineTo(56, 80);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(128, 50, 15, 0, Math.PI * 2);
  ctx.fill();
  
  var texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createEnemyTexture() {
  var canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 100;
  var ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 15;
  
  ctx.beginPath();
  ctx.ellipse(128, 50, 100, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.ellipse(128, 50, 40, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  var texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createShadowTexture() {
  var canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  var ctx = canvas.getContext('2d');
  
  var gradient = ctx.createRadialGradient(128, 48, 0, 128, 48, 80);
  gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  var texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createBackgroundTexture() {
  var canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  var ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#000033';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#00ffff';
  for (var i = 0; i < 100; i++) {
    var x = Math.random() * canvas.width;
    var y = Math.random() * canvas.height;
    var size = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 2;
  for (var i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 100 + 50);
    ctx.lineTo(canvas.width, i * 100 + 50);
    ctx.stroke();
  }
  
  var texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 5);
  return texture;
}

var Enemytexture = createEnemyTexture();
var shiptexture = createShipTexture();
var shadowtexture = createShadowTexture();
var texture = createBackgroundTexture();

var container = document.createElement('div');
container.style.position = 'absolute';
container.style.top = '0';
container.style.left = '0';
container.style.zIndex = '1';
document.body.appendChild(container);

var StartText = document.getElementById('Start');
var livesText = document.getElementById('lives');
var killsText = document.getElementById('kills');
var bulletsText = document.getElementById('bullets');
var gamestateText = document.getElementById('status');
var GameOverText = document.getElementById('GameOver');
var FinalKillsText = document.getElementById('FinalKills');
var FinalBulletsText = document.getElementById('FinalBullets');

var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 100000);
camera.position.z = 1000;
camera.position.y = -30000;

camera.lookAt(new THREE.Vector3(0, 6000, 0));

var scene = new THREE.Scene();

StartText.style.display = 'block';

function WorldObjects() {
  var wallMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ffff });
  var wallObj = new THREE.PlaneGeometry(5000, 2000, 10, 10);
  this.Wall = function() { return new THREE.Mesh(wallObj, wallMaterial); }
  
  var shadowMaterial = new THREE.MeshBasicMaterial({ wireframe: false, transparent: true, map: shadowtexture });
  var shadowObj = new THREE.PlaneGeometry(64, 24, 1, 1);
  this.shadow = function() { return new THREE.Mesh(shadowObj, shadowMaterial); }
  
  var shipMaterial = new THREE.MeshBasicMaterial({ transparent: true, map: shiptexture });
  var shipObj = new THREE.PlaneGeometry(64, 24, 1, 1);
  this.Ship = function() { return new THREE.Mesh(shipObj, shipMaterial); }
  
  var ufoMaterial = new THREE.MeshBasicMaterial({ map: Enemytexture });
  var ufoObj = new THREE.PlaneGeometry(100, 40, 1, 1);
  this.UFO = function() { return new THREE.Mesh(ufoObj, ufoMaterial); }
  
  var tunnelMaterial = new THREE.MeshBasicMaterial({ wireframe: false, map: texture });
  var tunnelObj = new THREE.PlaneGeometry(25000, 60000, 3, planeDefinition);
  this.Tunnel = function() { return new THREE.Mesh(tunnelObj, tunnelMaterial); }
}

var Objects = new WorldObjects();

function Explode(x, y, z) {
  var age = 0;
  var movementSpeed = 80;
  var totalObjects = 1000;
  var objectSize = 10;
  var dirs = [];
  var colors = [0xffffff, 0xff0000, 0xffff00, 0x00ffff];
  var geometry = new THREE.BufferGeometry();
  var positions = [];
  
  for (i = 0; i < totalObjects; i++) {
    positions.push(x, y, z);
    dirs.push({
      x: (Math.random() * movementSpeed) - (movementSpeed / 2),
      y: (Math.random() * movementSpeed) - (movementSpeed / 2),
      z: (Math.random() * movementSpeed) - (movementSpeed / 2)
    });
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
  var material = new THREE.PointsMaterial({ size: objectSize, color: colors[Math.floor(Math.random() * colors.length)] });
  var particles = new THREE.Points(geometry, material);
  
  this.object = particles;
  this.status = true;
  
  this.xDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
  this.yDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
  this.zDir = (Math.random() * movementSpeed) - (movementSpeed / 2);
  
  scene.add(this.object);
  
  this.reverse = function() {
    var pCount = totalObjects;
    while (pCount--) {
      dirs[pCount].y = -(dirs[pCount].y);
      dirs[pCount].x = -(dirs[pCount].x);
      dirs[pCount].z = -(dirs[pCount].z);
    }
  }
  
  this.update = function() {
    if (this.status == true && age < 2000) {
      age += 1;
      var positions = this.object.geometry.attributes.position.array;
      for (var i = 0; i < totalObjects; i++) {
        positions[i * 3] += dirs[i].x;
        positions[i * 3 + 1] += dirs[i].y;
        positions[i * 3 + 2] += dirs[i].z;
      }
      this.object.geometry.attributes.position.needsUpdate = true;
    } else if (age >= 2000) {
      this.status = false;
    }
  }
}

function player() {
  countdown = 0;
  this.explosion;
  this.status = true;
  this.ship = Objects.Ship();
  this.ship.rotation.x = 1.56;
  this.ship.position.y = -29500;
  this.ship.position.z = 900;
  this.ship.visible = true;
  
  this.shadow = Objects.shadow();
  this.shadow.rotation.x = 1.56;
  this.shadow.position.y = this.ship.position.y;
  this.shadow.position.x = this.ship.position.x;
  this.shadow.position.z = 825;
  
  this.positionY = function() { return Math.round(this.ship.position.y); }
  this.positionZ = function() { return Math.round(this.ship.position.z); }
  this.positionX = function() { return Math.round(this.ship.position.x); }
  
  scene.add(this.ship);
  scene.add(this.shadow);
  
  this.turnleft = function() {
    this.ship.rotation.z = .25;
  }
  
  this.turnright = function() {
    this.ship.rotation.z = -.25;
  }
  
  this.update = function() {
    this.ship.rotation.z = 0;
    this.ship.position.x -= cx;
    this.ship.position.z -= cy;
    if (countdown > 0) {
      countdown -= 1;
      if (countdown == 0) {
        this.status = true;
      }
    }
    if (!(this.ship.position.x > -400 && this.ship.position.x < 400)) {
      this.ship.position.x += cx;
      cx = 0;
    }
    
    if (!(this.ship.position.z > 850 && this.ship.position.z < 1050)) {
      this.ship.position.z += cy;
      cy = 0;
    }
    this.shadow.position.x = this.ship.position.x;
  }
  
  this.restart = function() {
    this.ship.position.z = 900;
    this.ship.position.x = 0;
    cz = 0;
    cy = 0;
    cx = 0;
    countdown = 180;
    this.ship.visible = true;
    this.shadow.visible = true;
  }
  
  this.dead = function() {
    if (this.status == true && countdown == 0) {
      this.status = false;
      this.explosion = new Explode(this.ship.position.x, this.ship.position.y, this.ship.position.z);
      exploders.push(this.explosion);
      this.ship.visible = false;
      this.shadow.visible = false;
      lives -= 1;
      updateHUD();
      if (lives > 0) {
        gamestateText.style.display = 'block';
      } else {
        GameOverText.style.display = 'block';
        FinalKillsText.innerHTML = Kills;
        FinalBulletsText.innerHTML = BulletsFired;
      }
    }
  }
}

function enemy() {
  var initialMove = false;
  this.endingX = (Math.random() * 800) - 400;
  this.endingZ = (Math.random() * 200);
  
  this.status = false;
  
  this.enemy1 = Objects.UFO();
  this.enemy1.rotation.x = 1.56;
  this.enemy1.position.x = (Math.random() * 16000) - 8000;
  this.enemy1.position.y = ((Math.random() * 124000) - 64000);
  this.enemy1.position.z = (Math.random() * 3000) + 5500;
  scene.add(this.enemy1);
  
  this.positionY = function() { return Math.round(this.enemy1.position.y); }
  this.positionZ = function() { return Math.round(this.enemy1.position.z); }
  this.positionX = function() { return Math.round(this.enemy1.position.x); }
  
  this.update = function() {
    if (this.status == true) {
      if (this.enemy1.position.y < -35000) {
        this.status = false;
        this.enemy1.position.x = (Math.random() * 16000) - 8000;
        this.enemy1.position.y = ((Math.random() * 124000) - 64000);
        this.enemy1.position.z = (Math.random() * 3000) + 5500;
      }
      initialMove = true;
      if ((this.enemy1.position.x != this.endingX)) {
        if (this.enemy1.position.x < this.endingX)
          this.enemy1.position.x += 50;
        if (this.enemy1.position.x > this.endingX)
          this.enemy1.position.x -= 50;
        
        initialMove = false;
      }
      
      if (!(this.enemy1.position.z < (this.endingZ + 850))) {
        this.enemy1.position.z -= 20;
      }
      if (initialMove == true) {
        this.enemy1.position.x += 50;
      }
      this.enemy1.position.y -= (Math.random() * 30) + 20;
    }
  }
  
  this.dead = function() {
    this.status = false;
    exploders.push(new Explode(this.enemy1.position.x, this.enemy1.position.y, this.enemy1.position.z));
    this.enemy1.position.x = (Math.random() * 16000) - 8000;
    this.enemy1.position.y = ((Math.random() * 124000) - 64000);
    this.enemy1.position.z = (Math.random() * 3000) + 5500;
    Kills += 1;
    updateHUD();
  }
}

function EnemyInit() {
  for (var x = 0; x < 25; x++) {
    xpu = new enemy();
    enemies.push(xpu);
  }
}

function LevelBackground() {
  floorVisible = true;
  closingWall = true;
  flat = false;
  stars = true;
  movespeed = 250;
  
  if (!flat) {
    this.floor = Objects.Tunnel();
    this.floor1 = Objects.Tunnel();
    this.floor2 = Objects.Tunnel();
  }
  
  this.floor1.position.y = 60000;
  this.floor2.position.y = 120000;
  
  if (!floorVisible) {
    this.floor.visible = false;
    this.floor1.visible = false;
    this.floor2.visible = false;
  }
  
  if (closingWall) {
    this.wall = Objects.Wall();
    this.wall.rotation.x = 1.56;
    this.wall.position.x = 6000;
    this.wall.position.y = 70000;
    this.wall.position.z = 950;
  }
  
  this.wallY = function() { return Math.round(this.wall.position.y); }
  this.wallZ = function() { return Math.round(this.wall.position.z); }
  this.wallX = function() { return Math.round(this.wall.position.x); }
  
  if (!flat) {
    makeWalls(this.floor);
    makeWalls(this.floor1);
    makeWalls(this.floor2);
  }
  
  scene.add(this.wall);
  scene.add(this.floor);
  scene.add(this.floor1);
  scene.add(this.floor2);
  
  if (stars)
    creatStars();
  
  this.restart = function() {
    movespeed = 250;
    this.update();
  }
  
  this.stop = function() {
    movespeed = 0;
  }
  
  this.update = function() {
    this.floor.position.y -= movespeed;
    this.floor1.position.y -= movespeed;
    this.floor2.position.y -= movespeed;
    
    if (this.floor.position.y < -60000) {
      this.floor.position.y = 120000;
    }
    if (this.floor1.position.y < -60000) {
      this.floor1.position.y = 120000;
    }
    if (this.floor2.position.y < -60000) {
      this.floor2.position.y = 120000;
    }
    
    if (closingWall) {
      this.wall.position.y -= movespeed;
      if (this.wall.position.x > 2500) {
        this.wall.position.x -= 10;
      } else if (this.wall.position.x < -2500) {
        this.wall.position.x += 10;
      }
      
      if (this.wall.position.y < -29600) {
        this.wall.position.y = 70000;
        this.wall.position.x = 6000 * wallLocation();
      }
    }
  }
  
  function creatStars() {
    var geometry = new THREE.BufferGeometry();
    var positions = [];
    for (i = 0; i < 500; i++) {
      positions.push(
        Math.random() * 110000 - 55000,
        40000,
        Math.random() * 80000 - 40000
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    var material = new THREE.PointsMaterial({ size: 6, color: 0xffffff });
    var particles = new THREE.Points(geometry, material);
    particles.position.z = 5400;
    particles.position.y = -20000;
    particles.rotation.x -= .31;
    scene.add(particles);
  }
  
  function makeWalls(plane) {
    var vertices = plane.geometry.attributes.position.array;
    for (var i = 0; i < vertices.length / 3; i++) {
      var x = vertices[i * 3];
      if (x == -12500) {
        vertices[i * 3 + 2] = 2000;
        vertices[i * 3] = -4150;
      }
      if (x == 12500) {
        vertices[i * 3 + 2] = 2000;
        vertices[i * 3] = 4150;
      }
    }
    plane.geometry.attributes.position.needsUpdate = true;
  };
}

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;

var currentlyPressedKeys = {};
var gameStarted = false;

function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true;
  if (event.keyCode == 32) {
    if (!gameStarted) {
      gameStarted = true;
      StartText.style.display = 'none';
      start();
      render();
    } else if (lives > 0) {
      test.restart();
      pl.restart();
      gamestateText.style.display = "none";
    } else {
      lives = 3;
      start();
      GameOverText.style.display = "none";
    }
  }
  
  if (event.keyCode == 13 && gameStarted) {
    shoot();
  }
  
  if (event.keyCode == 70) {
    toggleFullScreen();
  }
}

function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
  
  if (!event.keyCode == 13) {
    cz = 0;
    cy = 0;
    cx = 0;
  }
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function bulletsInit(total) {
  for (var x = 0; x < total; x++) {
    var bullet;
    bullet = new THREE.Mesh(
      new THREE.SphereGeometry(5, 10, 10),
      new THREE.MeshBasicMaterial({ wireframe: false, color: 0xff0000 })
    );
    bullet.visible = false;
    scene.add(bullet);
    bullets.push(bullet);
  }
}

function shoot() {
  var aShot = false;
  BulletsFired += 1;
  updateHUD();
  for (var x = 0; x < bullets.length; x++) {
    if (!aShot) {
      if (bullets[x].visible == false) {
        bullets[x].visible = true;
        bullets[x].position.y = pl.positionY();
        bullets[x].position.x = pl.positionX();
        bullets[x].position.z = pl.positionZ();
        aShot = true;
      }
    }
  }
}

function updateHUD() {
  livesText.innerHTML = lives;
  killsText.innerHTML = Kills;
  bulletsText.innerHTML = BulletsFired;
}

function start() {
  scene = new THREE.Scene();
  enemies = [];
  bullets = [];
  exploders = [];
  lives = 3;
  BulletsFired = 0;
  Kills = 0;
  cx = 0, cy = 0, cz = 0;
  test = new LevelBackground();
  pl = new player();
  updateHUD();
  bulletsInit(300);
  EnemyInit();
}

function render() {
  requestAnimationFrame(render);
  
  if (!gameStarted) {
    return;
  }
  
  pl.update();
  test.update();
  
  var pCount = exploders.length;
  while (pCount--) {
    if (exploders[pCount].status) {
      exploders[pCount].update();
    } else {
      scene.remove(exploders[pCount].object);
    }
  }
  
  for (var x = 0; x < enemies.length; x++) {
    enemies[x].update();
    if (enemies[x].status) {
      if (enemies[x].positionY() <= pl.positionY() && enemies[x].positionY() >= pl.positionY() - 50) {
        if (enemies[x].positionZ() <= pl.positionZ() + 50 && enemies[x].positionZ() >= pl.positionZ() - 50) {
          if (enemies[x].positionX() <= pl.positionX() + 50 && enemies[x].positionX() >= pl.positionX() - 50) {
            pl.dead();
            test.stop();
            enemies[x].dead();
          }
        }
      }
    } else {
      if (Math.round((Math.random() * enemyattackFrequency)) == 1) {
        enemies[x].status = true;
      }
    }
  }
  
  handleKeys();
  
  if (pl.positionY() == test.wallY() - 2000) {
    if ((pl.positionX() <= (0) && pl.positionX() >= (test.wallX())) || (pl.positionX() >= (0) && pl.positionX() <= (test.wallX()))) {
      pl.dead();
      test.stop();
    }
  }
  
  for (var x = 0; x < bullets.length; x++) {
    if (bullets[x].visible == true) {
      bullets[x].position.y += 50;
    }
    
    if (bullets[x].position.y > -25000 && bullets[x].visible == true) {
      bullets[x].visible = false;
      bullets[x].position.y = 0;
      bullets[x].position.x = 0;
      bullets[x].position.z = 0;
    }
    
    for (var e = 0; e < enemies.length; e++) {
      if (enemies[e].status) {
        if (enemies[e].positionY() - 10 <= Math.round(bullets[x].position.y) && enemies[e].positionY() + 10 <= Math.round(bullets[x].position.y)) {
          if (((enemies[e].positionX() - 50) <= bullets[x].position.x && enemies[e].positionX() + 50 >= bullets[x].position.x)
              && (enemies[e].positionZ() - 50 <= bullets[x].position.z && enemies[e].positionZ() + 50 >= bullets[x].position.z)) {
            enemies[e].dead();
          }
        }
      }
    }
  }
  
  renderer.render(scene, camera);
}

function wallLocation() {
  wx = Math.round(Math.random() * 1);
  if (wx == 0) {
    return -1;
  } else if (wx == 1) {
    return 1;
  }
}

function handleKeys() {
  if (!gameStarted) return;
  
  if (currentlyPressedKeys[65]) {
    pl.turnleft();
    cx += .1;
  }
  
  if (currentlyPressedKeys[68]) {
    pl.turnright();
    cx -= .1;
  }
  if (currentlyPressedKeys[87]) {
    cy -= .1;
  }
  if (currentlyPressedKeys[83]) {
    cy += .1;
  }
}

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}