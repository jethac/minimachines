"use strict";
// Headless smoke test: confirm HFT relay pairs a GameClient -> GameServer (playerconnect fires).
// Uses HFT's own browser bundle in Node with a `ws` polyfill.
global.WebSocket = require("../../HappyFunTimes/node_modules/ws");
global.window = { location: { host: "localhost:18679", hostname: "localhost", port: "18679" } };
global.window.location = global.window.location;

const hft = require("../../HappyFunTimes/dist/hft.js");
const server = new hft.GameServer({ gameId: "minimachines-smoke" });

let gotConnect = false;
server.on("connect", () => { console.log("[server] connected to relay"); gotConnect = true; });
server.on("playerconnect", (netPlayer, name, data) => {
  console.log("[server] PLAYERCONNECT name=", name, "data=", JSON.stringify(data));
  netPlayer.on("testcmd", (d) => console.log("[server] got testcmd from player:", JSON.stringify(d)));
  netPlayer.on("disconnect", () => console.log("[server] player disconnected"));
  // send something to the controller
  netPlayer.sendCmd("hello", { msg: "welcome " + name });
});

// Give the server a moment to register as the game with the relay first.
setTimeout(() => {
  const client = new hft.GameClient({ reconnect: false, gameId: "minimachines-smoke" });
  client.on("hello", (d) => {
    console.log("[client] got hello from game:", JSON.stringify(d));
    console.log("SMOKE_TEST_PASS");
    setTimeout(() => process.exit(0), 300);
  });
  setTimeout(() => {
    if (!gotConnect) console.log("[server] no connect yet");
    client.sendCmd("testcmd", { n: 1 });
  }, 800);
}, 600);
setTimeout(() => { console.log("SMOKE_TEST_FAIL_TIMEOUT"); process.exit(1); }, 6000);
