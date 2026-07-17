"use strict";
// Mini Machines — host game (authoritative). Three.js + HappyFunTimes.
import * as THREE from "three";

const GAME_ID = "minimachines";

// ---- arena constants ----
const ARENA = 80;            // half-extent of square arena floor (so 2*ARENA wide)
const WALL_H = 3;
const KART_R = 1.6;          // collision radius
const MAX_SPEED = 26;
const ACCEL = 38;
const FRICTION = 14;
const TURN_RATE = 2.4;      // rad/s at full steer
const ROUND_TIME = 90;       // seconds
const COLORS = ["#ff5e3a","#ffd24a","#3ad17a","#3aa6ff","#b061ff","#ff61c6","#ffffff","#7bdfff"];

// =====================================================================
// THREE setup
// =====================================================================
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0e18);
scene.fog = new THREE.Fog(0x0c0e18, 140, 260);

// Design for 16:9 / 1080p framing.
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 600);
camera.position.set(0, 86, 78);
camera.lookAt(0, 0, 0);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ---- lights ----
scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x40342a, 0.9));
const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
sun.position.set(40, 90, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -ARENA - 10; sun.shadow.camera.right = ARENA + 10;
sun.shadow.camera.top = ARENA + 10; sun.shadow.camera.bottom = -ARENA - 10;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
scene.add(sun);

// =====================================================================
// Arena
// =====================================================================
function makeFloorTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#2a2350"; g.fillRect(0, 0, 512, 512);
  const n = 8, s = 512 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    g.fillStyle = ((x + y) % 2 === 0) ? "#322a5e" : "#2c254f";
    g.fillRect(x * s, y * s, s, s);
  }
  // sponsor text on floor center
  g.fillStyle = "rgba(255,255,255,0.06)"; g.font = "bold 60px sans-serif"; g.textAlign = "center";
  g.fillText("ai&  ·  Moonshot  ·  Tokyu", 256, 280);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(2 * ARENA, 2 * ARENA),
  new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.95 })
);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// walls
const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4f7a, roughness: 0.6 });
function addWall(x, z, w, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), wallMat);
  m.position.set(x, WALL_H / 2, z); m.castShadow = true; m.receiveShadow = true; scene.add(m);
}
addWall(0,  ARENA, 2 * ARENA + WALL_H, WALL_H);
addWall(0, -ARENA, 2 * ARENA + WALL_H, WALL_H);
addWall( ARENA, 0, WALL_H, 2 * ARENA + WALL_H);
addWall(-ARENA, 0, WALL_H, 2 * ARENA + WALL_H);

// sponsor banners (placeholder branded panels on the walls)
const sponsorData = [
  { label: "ai&", color: 0x3aa6ff },
  { label: "Moonshot", color: 0xb061ff },
  { label: "Tokyu Corporation", color: 0x3ad17a },
];
function makeBannerTexture(label, bg) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#" + new THREE.Color(bg).getHexString(); g.fillRect(0, 0, 1024, 128);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 0, 1024, 128);
  g.fillStyle = "#fff"; g.font = "bold 84px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, 512, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const banners = [];
function addBanner(label, color, x, y, z, ry) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 5),
    new THREE.MeshBasicMaterial({ map: makeBannerTexture(label, color) }));
  m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); banners.push(m);
}
addBanner(sponsorData[0].label, sponsorData[0].color, 0, 6,  ARENA - 0.2, 0);
addBanner(sponsorData[1].label, sponsorData[1].color, 0, 6, -ARENA + 0.2, Math.PI);
addBanner(sponsorData[2].label, sponsorData[2].color,  ARENA - 0.2, 6, 0, -Math.PI / 2);
addBanner(sponsorData[0].label, sponsorData[0].color, -ARENA + 0.2, 6, 0,  Math.PI / 2);

// ---- Label sprites (name) ----
function textSprite(text, color = "#ffffff", opts = {}) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  g.font = `bold ${opts.size || 64}px Trebuchet MS, sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 10; g.strokeStyle = "rgba(0,0,0,0.85)"; g.strokeText(text, 256, 64);
  g.fillStyle = color; g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  sp.scale.set(opts.w || 9, opts.h || 2.2, 1);
  return sp;
}

// =====================================================================
// Kart
// =====================================================================
class Kart {
  constructor(id, netPlayer, name, color) {
    this.id = id;
    this.net = netPlayer;
    this.name = name;
    this.color = new THREE.Color(color);
    this.colorHex = color;

    // state
    this.x = 0; this.z = 0; this.heading = 0;
    this.speed = 0;
    this.balloons = 3;
    this.alive = true;
    this.item = null;            // "green" | "red" | "banana" | "mushroom" | "star"
    this.boost = 0;              // boost timer
    this.star = 0;               // star timer
    this.spin = 0;               // spin-out timer
    this.respawnTimer = 0;
    this.score = 0;              // round score
    this.session = 0;            // session (cumulative) score
    this.lastAction = false;
    this.input = { steer: 0, gas: 0, brake: false, action: false };
    this.lastStateSent = 0;

    // mesh
    this.group = new THREE.Group();
    this.buildMesh();
    this.respawn(true);
    scene.add(this.group);

    this.nameSprite = textSprite(this.name, "#" + this.color.getHexString(), { size: 56 });
    this.nameSprite.position.set(0, 4.4, 0);
    this.group.add(this.nameSprite);
  }

  buildMesh() {
    const g = this.group;
    const bodyMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.45, metalness: 0.1 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 3.4), bodyMat);
    body.position.y = 1.0; body.castShadow = true; g.add(body);
    // cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.3 }));
    cabin.position.set(0, 1.7, -0.2); cabin.castShadow = true; g.add(cabin);
    // wheels
    const wmat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.8 });
    const wp = [[-1.3, -1.1], [1.3, -1.1], [-1.3, 1.1], [1.3, 1.1]];
    this.wheels = [];
    for (const [wx, wz] of wp) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 12), wmat);
      w.rotation.z = Math.PI / 2; w.position.set(wx, 0.7, wz); w.castShadow = true; g.add(w); this.wheels.push(w);
    }
    // balloons (3) floating above
    this.balloonMeshes = [];
    const bcolors = [0xff5e5e, 0x5effa0, 0x5eaaff];
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 12),
        new THREE.MeshStandardMaterial({ color: bcolors[i], roughness: 0.3, emissive: bcolors[i], emissiveIntensity: 0.15 }));
      b.position.set(-1 + i, 3.3 + Math.sin(i) * 0.2, 0); g.add(b); this.balloonMeshes.push(b);
    }
  }

  setColor(color) {
    this.color = new THREE.Color(color); this.colorHex = color;
    this.group.children[0].material.color = this.color;
    this.group.remove(this.nameSprite);
    this.nameSprite = textSprite(this.name, "#" + this.color.getHexString(), { size: 56 });
    this.nameSprite.position.set(0, 4.4, 0); this.group.add(this.nameSprite);
  }
  setName(name) {
    this.name = name;
    this.group.remove(this.nameSprite);
    this.nameSprite = textSprite(this.name, "#" + this.color.getHexString(), { size: 56 });
    this.nameSprite.position.set(0, 4.4, 0); this.group.add(this.nameSprite);
  }

  respawn(random = false) {
    if (random) {
      this.x = (Math.random() * 2 - 1) * (ARENA - 6);
      this.z = (Math.random() * 2 - 1) * (ARENA - 6);
      this.heading = Math.random() * Math.PI * 2;
    }
    this.speed = 0; this.balloons = 3; this.alive = true;
    this.item = null; this.boost = 0; this.star = 0; this.spin = 0;
    this.respawnTimer = 0;
    for (let i = 0; i < 3; i++) this.balloonMeshes[i].visible = true;
    this.group.visible = true;
  }

  pop(fromKart) {
    if (!this.alive) return;
    if (this.star > 0) return;          // invincible
    this.balloons--;
    const idx = this.balloons;
    if (idx >= 0 && idx < 3) this.balloonMeshes[idx].visible = false;
    spawnPopBurst(this.x, 3.3, this.z, this.colorHex);
    if (fromKart && fromKart !== this) fromKart.score++;
    if (this.balloons <= 0) {
      this.alive = false; this.group.visible = false;
      this.respawnTimer = -1; // spectate until next round
      if (this.net) this.net.sendCmd("eliminated", {});
    }
  }

  giveItem() {
    if (this.item) return;
    const pool = ["green", "banana", "mushroom", "green", "red", "mushroom"];
    this.item = pool[Math.floor(Math.random() * pool.length)];
  }

  useItem(game) {
    if (!this.item || !this.alive) return;
    const dir = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    switch (this.item) {
      case "green":
        game.spawnProjectile(this, dir.clone(), "green"); break;
      case "red":
        game.spawnProjectile(this, dir.clone(), "red"); break;
      case "banana":
        game.spawnBanana(this.x - dir.x * 3, this.z - dir.z * 3, this); break;
      case "mushroom":
        this.boost = 1.6; break;
      case "star":
        this.star = 6; break;
    }
    this.item = null;
  }

  update(dt, game) {
    if (!this.alive) { this.syncMesh(); return; }
    if (this.spin > 0) { this.spin -= dt; this.heading += dt * 12; this.syncMesh(); return; }

    const inp = this.input;
    // steering scales with speed sign
    const speedFactor = Math.min(1, Math.abs(this.speed) / 6 + 0.25);
    this.heading += inp.steer * TURN_RATE * dt * speedFactor * Math.sign(this.speed || 1);
    if (inp.steer && Math.abs(this.speed) < 0.1) this.heading += inp.steer * TURN_RATE * dt * 0.4;

    // accel
    const maxS = MAX_SPEED * (this.boost > 0 ? 1.7 : 1);
    if (inp.gas) this.speed += ACCEL * dt;
    else if (inp.brake) this.speed -= ACCEL * dt;
    else this.speed -= Math.sign(this.speed) * FRICTION * dt;
    this.speed = Math.max(-maxS * 0.5, Math.min(maxS, this.speed));
    if (Math.abs(this.speed) < 0.02) this.speed = 0;

    // timers
    if (this.boost > 0) this.boost -= dt;
    if (this.star > 0) this.star -= dt;

    // move
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z += Math.cos(this.heading) * this.speed * dt;

    // walls
    const lim = ARENA - KART_R;
    if (this.x < -lim) { this.x = -lim; this.speed *= -0.4; }
    if (this.x > lim) { this.x = lim; this.speed *= -0.4; }
    if (this.z < -lim) { this.z = -lim; this.speed *= -0.4; }
    if (this.z > lim) { this.z = lim; this.speed *= -0.4; }

    // action rising edge
    if (inp.action && !this.lastAction) this.useItem(game);
    this.lastAction = inp.action;

    this.syncMesh();
  }

  syncMesh() {
    this.group.position.set(this.x, 0, this.z);
    this.group.rotation.y = this.heading;
    // star flicker
    const bodyMat = this.group.children[0].material;
    if (this.star > 0) bodyMat.emissive.setHex((Math.floor(Date.now() / 80) % 2) ? 0x666600 : 0x222200);
    else bodyMat.emissive.setHex(0x000000);
    // wheel spin
    for (const w of this.wheels) w.rotation.x += this.speed * 0.06;
  }
}

// =====================================================================
// Projectiles / bananas / pop bursts
// =====================================================================
const projectiles = [];
const bananas = [];
const popBursts = [];

class Projectile {
  constructor(owner, dir, kind) {
    this.owner = owner;
    this.kind = kind;
    this.x = owner.x + dir.x * 3; this.z = owner.z + dir.z * 3;
    this.vx = dir.x * 60; this.vz = dir.z * 60;
    this.life = 4.0;
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10),
      new THREE.MeshStandardMaterial({ color: kind === "red" ? 0xff3b3b : 0x33d65a, emissive: kind === "red" ? 0xff0000 : 0x00aa00, emissiveIntensity: 0.5 }));
    this.mesh.position.set(this.x, 1.2, this.z); scene.add(this.mesh);
  }
  update(dt, game) {
    this.life -= dt;
    if (this.kind === "red") {
      // home toward nearest enemy
      const tgt = game.nearestKart(this.owner, this.x, this.z, 40);
      if (tgt) {
        const dx = tgt.x - this.x, dz = tgt.z - this.z;
        const len = Math.hypot(dx, dz) || 1;
        const tvx = (dx / len) * 55, tvz = (dz / len) * 55;
        this.vx += (tvx - this.vx) * dt * 3;
        this.vz += (tvz - this.vz) * dt * 3;
      }
    }
    this.x += this.vx * dt; this.z += this.vz * dt;
    const lim = ARENA - 0.6;
    if (this.x < -lim || this.x > lim) { this.vx *= -1; this.x = Math.max(-lim, Math.min(lim, this.x)); }
    if (this.z < -lim || this.z > lim) { this.vz *= -1; this.z = Math.max(-lim, Math.min(lim, this.z)); }
    this.mesh.position.set(this.x, 1.2, this.z);
    this.mesh.rotation.x += dt * 12; this.mesh.rotation.y += dt * 8;
    // hit detection
    for (const k of game.karts) {
      if (!k.alive || k === this.owner) continue;
      if (Math.hypot(k.x - this.x, k.z - this.z) < KART_R + 0.6) {
        k.pop(this.owner);
        this.life = 0; break;
      }
    }
    if (this.life <= 0) { scene.remove(this.mesh); return false; }
    return true;
  }
}

class Banana {
  constructor(x, z, owner) {
    this.x = x; this.z = z; this.owner = owner; this.life = 30;
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffe14a, roughness: 0.5 }));
    this.mesh.position.set(x, 0.7, z); this.mesh.rotation.z = Math.PI / 2; scene.add(this.mesh);
  }
  update(dt, game) {
    this.life -= dt;
    for (const k of game.karts) {
      if (!k.alive || k === this.owner) continue;
      if (Math.hypot(k.x - this.x, k.z - this.z) < KART_R + 0.7) {
        k.pop(this.owner); k.spin = 0.6; this.life = 0; break;
      }
    }
    if (this.life <= 0) { scene.remove(this.mesh); return false; }
    return true;
  }
}

class PopBurst {
  constructor(x, y, z, color) {
    this.life = 0.6;
    const geo = new THREE.SphereGeometry(0.6, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true });
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.position.set(x, y, z); scene.add(this.mesh);
    this.parts = [];
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), mat.clone());
      p.position.set(x, y, z);
      const a = (i / 8) * Math.PI * 2;
      p.userData = { vx: Math.cos(a) * 6, vy: 4 + Math.random() * 3, vz: Math.sin(a) * 6 };
      scene.add(p); this.parts.push(p);
    }
  }
  update(dt) {
    this.life -= dt;
    this.mesh.scale.multiplyScalar(1 + dt * 3); this.mesh.material.opacity = Math.max(0, this.life / 0.6);
    for (const p of this.parts) {
      p.position.x += p.userData.vx * dt; p.position.y += p.userData.vy * dt; p.position.z += p.userData.vz * dt;
      p.userData.vy -= 14 * dt; p.material.opacity = Math.max(0, this.life / 0.6);
    }
    if (this.life <= 0) { scene.remove(this.mesh); for (const p of this.parts) scene.remove(p); return false; }
    return true;
  }
}
function spawnPopBurst(x, y, z, color) { popBursts.push(new PopBurst(x, y, z, color)); }

// =====================================================================
// Item pickups
// =====================================================================
const pickups = [];
const PICKUP_COUNT = 10;
const pickupGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
function spawnPickups() {
  for (let i = 0; i < PICKUP_COUNT; i++) {
    const m = new THREE.Mesh(pickupGeo, new THREE.MeshStandardMaterial({ color: 0xffd24a, emissive: 0xff9d3c, emissiveIntensity: 0.6, transparent: true, opacity: 0.95 }));
    m.position.set((Math.random() * 2 - 1) * (ARENA - 8), 1.2, (Math.random() * 2 - 1) * (ARENA - 8));
    m.userData = { cooldown: 0 };
    scene.add(m); pickups.push(m);
  }
}

// =====================================================================
// Game (state machine + HFT)
// =====================================================================
class Game {
  constructor() {
    this.karts = [];
    this.kartsByNet = new Map();
    this.state = "LOBBY";        // LOBBY | COUNTDOWN | PLAYING | ROUND_END
    this.timer = 0;
    this.banner = "";
    this.lastBroadcast = 0;
    this.lastStateBroadcast = 0;
    this.pause = false;
    this.nextId = 1;
    this.lastCountdownN = -1;
    spawnPickups();
  }

  // ---- HFT ----
  initServer() {
    const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host;
    this.server = new HFT.GameServer({ gameId: GAME_ID, url: wsUrl });
    this.server.on("playerconnect", (netPlayer, name, data) => this.onPlayerConnect(netPlayer, name, data));
    this.server.on("disconnect", () => console.log("[host] relay disconnected (will auto-reconnect)"));
  }

  onPlayerConnect(netPlayer, name, data) {
    const id = this.nextId++;
    const dispName = (data && data.__hft_name__) || name || ("Player" + id);
    const color = COLORS[(id - 1) % COLORS.length];
    const kart = new Kart(id, netPlayer, dispName.slice(0, 10) || ("P" + id), color);
    kart.hftName = dispName;
    this.karts.push(kart);
    this.kartsByNet.set(netPlayer, kart);

    netPlayer.on("playerConfig", (d) => {
      if (!d) return;
      if (d.name) kart.setName(String(d.name).slice(0, 10));
      if (d.color) kart.setColor(d.color);
      kart.configured = true;
    });
    netPlayer.on("input", (d) => {
      if (!d) return;
      kart.input.steer = clamp(d.steer || 0, -1, 1);
      kart.input.gas = d.gas ? 1 : 0;
      kart.input.brake = !!d.brake;
      kart.input.action = !!d.action;
    });
    netPlayer.on("disconnect", () => this.removeKart(kart));

    this.sendRound(kart);
    updatePlayersOnline();
    updateLobbyWaiting();
  }

  removeKart(kart) {
    scene.remove(kart.group);
    const i = this.karts.indexOf(kart);
    if (i >= 0) this.karts.splice(i, 1);
    this.kartsByNet.delete(kart.net);
    updatePlayersOnline();
    updateLobbyWaiting();
  }

  nearestKart(from, x, z, maxDist) {
    let best = null, bd = maxDist * maxDist;
    for (const k of this.karts) {
      if (!k.alive || k === from) continue;
      const d = (k.x - x) ** 2 + (k.z - z) ** 2;
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  spawnProjectile(owner, dir, kind) { projectiles.push(new Projectile(owner, dir, kind)); }
  spawnBanana(x, z, owner) { bananas.push(new Banana(x, z, owner)); }

  // ---- state transitions ----
  startRound() {
    if (this.state !== "LOBBY") return;
    for (const k of this.karts) { k.respawn(true); k.score = 0; }
    projectiles.length = 0; bananas.length = 0;
    this.state = "COUNTDOWN"; this.timer = 3; this.lastCountdownN = -1; this.pause = false;
    setPhase("STARTING"); hideResult();
  }
  togglePause() {
    if (this.state === "PLAYING" || this.state === "COUNTDOWN") {
      this.pause = !this.pause;
      setPhase(this.pause ? "PAUSED" : (this.state === "PLAYING" ? "BATTLE" : "STARTING"));
    }
  }
  endRound() {
    if (this.state === "LOBBY") return;
    this.state = "ROUND_END"; this.timer = 10; this.pause = false;
    // finalize: survival bonus
    const alive = this.karts.filter(k => k.alive).sort((a, b) => b.balloons - a.balloons);
    alive.forEach((k, i) => { k.score += Math.max(0, 4 - i); k.session += k.score; });
    this.karts.filter(k => !k.alive).forEach(k => k.session += k.score);
    showResult(this.karts);
    setPhase("ROUND OVER");
  }
  toLobby() {
    this.state = "LOBBY"; this.timer = 0; this.pause = false;
    for (const k of this.karts) k.respawn(true);
    setPhase("LOBBY"); hideResult(); showLobbyCard();
  }

  // ---- main update ----
  update(dt) {
    if (this.pause) { this.broadcast(dt); return; }

    if (this.state === "LOBBY") {
      for (const k of this.karts) {
        k.input.action = false;
        k.update(dt, this);
      }
      this.resolveCollisions();
    } else if (this.state === "COUNTDOWN") {
      this.timer -= dt;
      const n = Math.ceil(this.timer);
      if (n !== this.lastCountdownN) {
        this.lastCountdownN = n;
        this.banner = n > 0 ? String(n) : "GO!";
        this.broadcastRound();
      }
      if (this.timer <= 0) {
        this.state = "PLAYING"; this.timer = ROUND_TIME; this.banner = "";
        setPhase("BATTLE"); hideLobbyCard();
        this.broadcastRound();
      }
      for (const k of this.karts) k.update(dt, this);
      this.resolveCollisions();
    } else if (this.state === "PLAYING") {
      this.timer -= dt;
      // item pickups
      for (const p of pickups) {
        if (p.userData.cooldown > 0) { p.userData.cooldown -= dt; p.visible = p.userData.cooldown <= 0; continue; }
        p.rotation.y += dt * 2; p.position.y = 1.2 + Math.sin(Date.now() / 300 + p.id) * 0.2;
        for (const k of this.karts) {
          if (k.alive && Math.hypot(k.x - p.position.x, k.z - p.position.z) < KART_R + 1.2) {
            k.giveItem(); p.userData.cooldown = 6; p.visible = false; break;
          }
        }
      }
      for (const k of this.karts) k.update(dt, this);
      this.resolveCollisions();
      // projectiles / bananas / bursts
      for (let i = projectiles.length - 1; i >= 0; i--) if (!projectiles[i].update(dt, this)) projectiles.splice(i, 1);
      for (let i = bananas.length - 1; i >= 0; i--) if (!bananas[i].update(dt, this)) bananas.splice(i, 1);
      for (let i = popBursts.length - 1; i >= 0; i--) if (!popBursts[i].update(dt)) popBursts.splice(i, 1);

      const aliveCount = this.karts.filter(k => k.alive).length;
      if (this.timer <= 0 || (aliveCount <= 1 && this.karts.length > 1)) { this.endRound(); }
    } else if (this.state === "ROUND_END") {
      this.timer -= dt;
      if (this.timer <= 0) this.toLobby();
    }

    this.broadcast(dt);
  }

  resolveCollisions() {
    const ks = this.karts;
    for (let i = 0; i < ks.length; i++) {
      const a = ks[i]; if (!a.alive) continue;
      for (let j = i + 1; j < ks.length; j++) {
        const b = ks[j]; if (!b.alive) continue;
        const dx = b.x - a.x, dz = b.z - a.z;
        const d = Math.hypot(dx, dz);
        const min = KART_R * 2;
        if (d > 0 && d < min) {
          const nx = dx / d, nz = dz / d, overlap = (min - d) / 2;
          a.x -= nx * overlap; a.z -= nz * overlap;
          b.x += nx * overlap; b.z += nz * overlap;
          // exchange a bit of speed
          const tmp = a.speed; a.speed = b.speed * 0.6; b.speed = tmp * 0.6;
          // ram pop (booster rams)
          if (a.boost > 0 && b.star <= 0) b.pop(a);
          else if (b.boost > 0 && a.star <= 0) a.pop(b);
          else if ((a.star > 0 || b.star > 0)) { if (a.star > 0) b.pop(a); if (b.star > 0) a.pop(b); }
        }
      }
    }
  }

  // ---- comms ----
  broadcast(dt) {
    this.lastStateBroadcast += dt;
    if (this.lastStateBroadcast > 0.1) { this.lastStateBroadcast = 0; this.sendStates(); }
    this.lastBroadcast += dt;
    if (this.lastBroadcast > 0.5) { this.lastBroadcast = 0; this.broadcastRound(); }
  }
  sendStates() {
    for (const k of this.karts) {
      if (!k.net) continue;
      k.net.sendCmd("state", {
        name: k.name, color: k.colorHex, balloons: k.balloons,
        item: k.item, alive: k.alive, score: k.session,
      });
    }
  }
  leaderboard() {
    return [...this.karts].sort((a, b) => b.session - a.session).slice(0, 5)
      .map(k => ({ name: k.name, color: k.colorHex, score: k.session }));
  }
  sendRound(kart) {
    const msg = { phase: this.state, banner: "", leaderboard: this.leaderboard() };
    (kart ? kart.net.sendCmd("round", msg) : this.server.broadcastCmd("round", msg));
  }
  broadcastRound() {
    this.server.broadcastCmd("round", { phase: this.state, banner: this.banner, leaderboard: this.leaderboard() });
    renderLeaderboard(this.leaderboard());
  }
}

// =====================================================================
// HUD helpers
// =====================================================================
const $ = (id) => document.getElementById(id);
const phaseTag = $("phaseTag"), timerTag = $("timerTag");
const leaderboardEl = $("leaderboard"), playersOnlineEl = $("playersOnline");
const lobbyCard = $("lobbyCard"), resultCard = $("resultCard");
const qrImg = $("qrImg"), joinUrlEl = $("joinUrl"), waitingEl = $("waiting");

function setPhase(t) { phaseTag.textContent = t; }
function updatePlayersOnline() { playersOnlineEl.textContent = `${game.karts.length} player${game.karts.length === 1 ? "" : "s"}`; }
function updateLobbyWaiting() {
  if (game.state === "LOBBY") waitingEl.textContent = game.karts.length ? `${game.karts.length} ready — host: press START` : "Waiting for players…";
}
function showLobbyCard() { lobbyCard.classList.remove("hidden"); }
function hideLobbyCard() { lobbyCard.classList.add("hidden"); }
function showResult(karts) {
  const rows = $("resultRows");
  rows.innerHTML = "";
  const sorted = [...karts].sort((a, b) => b.score - a.score);
  sorted.forEach((k, i) => {
    const r = document.createElement("div"); r.className = "result-row";
    r.innerHTML = `<span class="lb-rank">${i + 1}</span><span class="lb-dot" style="background:${k.colorHex}"></span><span class="lb-name">${esc(k.name)}</span><span class="lb-score">${k.score}</span>`;
    rows.appendChild(r);
  });
  const mvp = sorted[0];
  $("resultMvp").textContent = mvp ? `Round MVP: ${mvp.name} (${mvp.score} pts)` : "";
  resultCard.classList.remove("hidden");
}
function hideResult() { resultCard.classList.add("hidden"); }
function renderLeaderboard(lb) {
  leaderboardEl.innerHTML = `<div class="lb-title">LEADERBOARD</div>`;
  if (!lb.length) { leaderboardEl.innerHTML += `<div class="lb-row" style="color:#6b7090">—</div>`; return; }
  lb.forEach((r, i) => {
    const row = document.createElement("div"); row.className = "lb-row";
    row.innerHTML = `<span class="lb-rank">${i + 1}</span><span class="lb-dot" style="background:${r.color}"></span><span class="lb-name">${esc(r.name)}</span><span class="lb-score">${r.score}</span>`;
    leaderboardEl.appendChild(row);
  });
}
function esc(s) { return String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

// =====================================================================
// Host controls
// =====================================================================
$("startBtn").addEventListener("click", () => {
  if (game.state === "LOBBY") game.startRound();
});
$("pauseBtn").addEventListener("click", () => game.togglePause());
$("endBtn").addEventListener("click", () => game.endRound());
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); if (game.state === "LOBBY") game.startRound(); else game.togglePause(); }
  if (e.code === "Escape") game.endRound();
});

// =====================================================================
// Boot: fetch join info (QR + URL), init server, start loop
// =====================================================================
const game = new Game();
game.initServer();
setPhase("LOBBY"); showLobbyCard(); renderLeaderboard([]);

fetch("/joininfo").then(r => r.json()).then(d => {
  if (d.qr) qrImg.src = d.qr;
  if (d.url) joinUrlEl.textContent = d.url;
}).catch(() => { joinUrlEl.textContent = window.location.host; });

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  game.update(dt);
  if (game.state === "PLAYING" || game.state === "COUNTDOWN") timerTag.textContent = Math.max(0, Math.ceil(game.timer)) + "s";
  else timerTag.textContent = "";
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
