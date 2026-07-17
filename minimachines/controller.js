"use strict";
// Mini Machines — phone controller.
// Talks to the host game over HappyFunTimes (GameClient). Host is authoritative.

const GAME_ID = "minimachines";
const COLORS = [
  "#ff5e3a", "#ffd24a", "#3ad17a", "#3aa6ff",
  "#b061ff", "#ff61c6", "#ffffff", "#7bdfff",
];

// ---- HFT client ----
let client = null;
let netId = null;
let connected = false;
let joined = false;

// player choices
let myName = "";
let myColor = COLORS[0];

// live input state (sent ~20x/sec)
let input = { steer: 0, gas: 0, brake: false, action: false };
let lastSent = "";

// ---- dom ----
const $ = (id) => document.getElementById(id);
const joinScreen = $("join"), playScreen = $("play");
const nameInput = $("nameInput"), colorsEl = $("colors"), joinBtn = $("joinBtn"), statusEl = $("status");
const meName = $("meName"), meBalloons = $("meBalloons"), leaderboardEl = $("leaderboard");
const roundBanner = $("roundBanner");
const steerZone = $("steerZone"), steerKnob = $("steerKnob");
const actionBtn = $("actionBtn");
const gasZone = $("gasZone"), brakeBtnReal = $("brakeBtn");
const itemIcon = $("itemIcon");
const deadEl = $("dead");

// ---- color picker ----
COLORS.forEach((c, i) => {
  const s = document.createElement("div");
  s.className = "swatch" + (i === 0 ? " sel" : "");
  s.style.background = c;
  s.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach(x => x.classList.remove("sel"));
    s.classList.add("sel");
    myColor = c;
  });
  colorsEl.appendChild(s);
});

// random default name
nameInput.value = "P" + Math.floor(Math.random() * 900 + 100);

function setStatus(t) { statusEl.textContent = t; }

// ---- connect to HFT relay ----
function connect() {
  try {
    const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host;
    client = new HFT.GameClient({ gameId: GAME_ID, url: wsUrl });
  } catch (e) {
    setStatus("reload page");
    return;
  }
  client.on("state", (d) => onState(d));
  client.on("round", (d) => onRound(d));
  client.on("eliminated", () => { deadEl.classList.remove("hidden"); });
  client.on("roundResult", () => { /* leaderboard updated via state/round */ });

  // GameClient emits 'connect'/'disconnect' (no listener => noisy). Attach noop:
  client.on("connect", () => { connected = true; setStatus("connected — tap JOIN"); });
  client.on("disconnect", () => { connected = false; if (joined) setStatus("reconnecting…"); });
}

connect();

// ---- join ----
joinBtn.addEventListener("click", () => {
  if (!client) { setStatus("no connection"); return; }
  myName = (nameInput.value || "").trim().slice(0, 10) || ("P" + Math.floor(Math.random() * 900 + 100));
  client.sendCmd("playerConfig", { name: myName, color: myColor });
  joined = true;
  joinScreen.classList.add("hidden");
  playScreen.classList.remove("hidden");
  startSending();
  requestTilt();
});

// ---- input: tilt ----
let tiltEnabled = false;
function requestTilt() {
  const D = window.DeviceOrientationEvent;
  if (D && typeof D.requestPermission === "function") {
    D.requestPermission().then(s => { tiltEnabled = (s === "granted"); bindTilt(); })
      .catch(() => { tiltEnabled = false; });
  } else if (D) {
    tiltEnabled = true; bindTilt();
  }
}
let tiltCalib = 0;
function bindTilt() {
  if (!tiltEnabled) return;
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    let g = e.gamma; // -90..90 (left/right)
    if (!tiltCalib && Math.abs(g) > 4) tiltCalib = g * 0.5;
    const v = clamp((g - tiltCalib) / 35, -1, 1);
    input.steer = v;
  });
  // allow recalibration by tapping steer zone
  steerZone.addEventListener("touchstart", () => { tiltCalib = 0; }, { passive: true });
}

// ---- input: touch steering (fallback / override) on left zone ----
let steerTouchId = null, steerStartX = 0;
steerZone.addEventListener("touchstart", (e) => {
  if (tiltEnabled) return; // tilt is primary when available
  const t = e.changedTouches[0];
  steerTouchId = t.identifier;
  steerStartX = t.clientX;
}, { passive: true });
steerZone.addEventListener("touchmove", (e) => {
  if (tiltEnabled || steerTouchId == null) return;
  for (const t of e.changedTouches) if (t.identifier === steerTouchId) {
    const dx = t.clientX - steerStartX;
    input.steer = clamp(dx / 90, -1, 1);
    steerKnob.style.transform = `translateX(calc(-50% + ${input.steer * 60}px))`;
  }
}, { passive: true });
const endSteer = (e) => {
  for (const t of e.changedTouches) if (t.identifier === steerTouchId) {
    steerTouchId = null; input.steer = 0;
    steerKnob.style.transform = "translateX(-50%)";
  }
};
steerZone.addEventListener("touchend", endSteer, { passive: true });
steerZone.addEventListener("touchcancel", endSteer, { passive: true });

// ---- input: gas (hold right-bottom zone) ----
const setGas = (v) => { input.gas = v ? 1 : 0; };
gasZone.addEventListener("touchstart", (e) => { e.preventDefault(); setGas(true); }, { passive: false });
const gasEnd = (e) => { for (const t of e.changedTouches) setGas(false); };
gasZone.addEventListener("touchend", gasEnd, { passive: true });
gasZone.addEventListener("touchcancel", gasEnd, { passive: true });

// ---- input: brake ----
const setBrake = (v) => { input.brake = v; };
brakeBtnReal.addEventListener("touchstart", (e) => { e.preventDefault(); setBrake(true); }, { passive: false });
brakeBtnReal.addEventListener("touchend", () => setBrake(false), { passive: true });
brakeBtnReal.addEventListener("touchcancel", () => setBrake(false), { passive: true });

// ---- input: action (use item) — edge triggered ----
let actionHeld = false;
actionBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (!actionHeld) { actionHeld = true; input.action = true; }
}, { passive: false });
actionBtn.addEventListener("touchend", () => { actionHeld = false; input.action = false; }, { passive: true });
actionBtn.addEventListener("touchcancel", () => { actionHeld = false; input.action = false; }, { passive: true });

// ---- send loop ~20Hz ----
function startSending() {
  setInterval(() => {
    if (!client || !joined) return;
    const snap = JSON.stringify(input);
    // action is edge-ish: send while held; game consumes on rising edge
    client.sendCmd("input", { ...input });
    lastSent = snap;
  }, 50);
}

// ---- receive: personal state ----
function onState(d) {
  if (!d) return;
  if (d.name) meName.textContent = d.name;
  if (d.color) { myColor = d.color; }
  // balloons
  const b = (typeof d.balloons === "number") ? d.balloons : 3;
  meBalloons.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const s = document.createElement("span");
    s.textContent = i < b ? "🎈" : "⚫";
    meBalloons.appendChild(s);
  }
  // item icon
  itemIcon.textContent = itemEmoji(d.item);
  actionBtn.classList.toggle("empty", !d.item);
  // alive
  if (d.alive === false) deadEl.classList.remove("hidden");
  else if (d.alive === true) deadEl.classList.add("hidden");
}

// ---- receive: round / leaderboard ----
function onRound(d) {
  if (!d) return;
  if (d.banner != null) {
    roundBanner.textContent = d.banner;
    roundBanner.classList.remove("hidden");
    clearTimeout(roundBanner._t);
    roundBanner._t = setTimeout(() => roundBanner.classList.add("hidden"), 900);
  }
  if (d.leaderboard) {
    leaderboardEl.innerHTML = "";
    d.leaderboard.slice(0, 5).forEach(r => {
      const row = document.createElement("div");
      row.className = "lb-row";
      row.innerHTML = `<span><span class="lb-dot" style="background:${r.color}"></span><span class="lb-name">${esc(r.name)}</span></span><span>${r.score}</span>`;
      leaderboardEl.appendChild(row);
    });
  }
  if (d.phase === "lobby") deadEl.classList.add("hidden");
}

function itemEmoji(item) {
  switch (item) {
    case "green": return "🐢"; // green shell
    case "red": return "🎯";   // red shell
    case "banana": return "🍌";
    case "mushroom": return "🍄";
    case "star": return "⭐";
    default: return "";
  }
}

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function esc(s) { return String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])); }
