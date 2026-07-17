"use strict";
// Mini Machines launcher.
// Uses HappyFunTimes' standalone relay server (no Electron required).
// Serves THIS folder as the game's baseDir: game.html (host screen) + controller.html (phones).
// Works on LAN (default) or the internet (set PUBLIC_URL + optional TLS).
const path = require("path");
const os = require("os");
const fs = require("fs");
const https = require("https");
const QRCode = require("qrcode");

// HFT server lives one directory up (sibling repo). Its own node_modules
// (express, ws, ...) resolve relative to that module, so we don't need them here.
const hftServer = require("../HappyFunTimes/server/server");

const PORT = Number(process.env.PORT) || 18679;

// ---- internet play config ----
// PUBLIC_URL: the URL players will use to reach the server from the internet.
//   e.g. PUBLIC_URL=https://mini.example.com  (no trailing slash)
//   If omitted, falls back to the detected LAN IP (LAN play).
// TLS_CERT / TLS_KEY: file paths to PEM cert + key for direct HTTPS.
//   If omitted, the server runs plain HTTP (use a reverse proxy for TLS).
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const TLS_CERT = process.env.TLS_CERT || "";
const TLS_KEY = process.env.TLS_KEY || "";

function firstLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

// Build the HFT server options
const serverOpts = {
  baseDir: __dirname,
  port: PORT,
  privateServer: true, // never phone home to happyfuntimes.net
};

// If TLS cert + key are provided, create an HTTPS server and pass it to HFT.
// HFT's hft-server.js accepts options.httpServer for this.
let httpsServer = null;
if (TLS_CERT && TLS_KEY) {
  try {
    const tlsOpts = {
      cert: fs.readFileSync(TLS_CERT),
      key: fs.readFileSync(TLS_KEY),
    };
    httpsServer = https.createServer(tlsOpts);
    serverOpts.httpServer = httpsServer;
    console.log("TLS enabled: cert=" + TLS_CERT + " key=" + TLS_KEY);
  } catch (e) {
    console.error("Failed to load TLS cert/key:", e.message);
    process.exit(1);
  }
}

hftServer
  .start(serverOpts)
  .then((helper) => {
    // Determine the join URL shown to players
    let url;
    if (PUBLIC_URL) {
      url = PUBLIC_URL.replace(/\/+$/, "") + "/";
    } else {
      const ip = firstLanIp();
      const proto = httpsServer ? "https" : "http";
      url = proto + "://" + ip + ":" + PORT + "/";
    }
    const isInternet = !!PUBLIC_URL;

    console.log("============================================================");
    console.log("  Mini Machines  —  HappyFunTimes relay running");
    console.log("  Mode        :  " + (isInternet ? "INTERNET" : "LAN"));
    console.log("  Host screen :  " + (httpsServer ? "https" : "http") + "://localhost:" + PORT + "/game.html");
    console.log("  Join URL    :  " + url);
    if (isInternet) {
      console.log("  Players join from anywhere via the QR code / URL above.");
    } else {
      console.log("  (phones scan the QR code shown on the host screen)");
    }
    console.log("============================================================");

    // Attach a tiny endpoint that returns the join URL + a QR data-URL for the
    // host screen to display. Keeps the host page free of extra deps.
    const app = helper.app;
    app.get("/joininfo", async (req, res) => {
      try {
        const qr = await QRCode.toDataURL(url, { margin: 1, width: 480 });
        res.json({ url, qr, port: PORT, internet: isInternet });
      } catch (e) {
        res.status(500).json({ error: String(e), url });
      }
    });
  })
  .catch((err) => {
    console.error("Failed to start HappyFunTimes server:", err);
    process.exit(1);
  });
