# Mini Machines

Mario-Kart-style balloon battle for live events. Phones become controllers via HappyFunTimes. Three.js renders the arena on a big screen. Works on **LAN** (default) or **the internet**.

## Quick Start (LAN)

```bash
cd minimachines
npm install        # installs qrcode (Three.js already vendored)
npm start          # starts HFT relay server on port 18679
```

Then:
- **Host screen:** Open `http://localhost:18679/game.html` on the PC connected to the projector/TV.
- **Players:** Scan the QR code on the big screen (or open the URL shown) on their phone. Must be on the same Wi-Fi/LAN.

## Internet Play

To let players join from anywhere over the internet, set `PUBLIC_URL` to the externally-reachable URL:

The public production address is **https://mm.jethachan.net**. It runs in a managed Cloudflare Container behind a Worker, so the Node relay and its WebSocket connections do not depend on a local computer.

```bash
# Direct HTTPS (self-signed or Let's Encrypt cert)
PUBLIC_URL=https://mini.example.com \
TLS_CERT=/path/to/cert.pem \
TLS_KEY=/path/to/key.pem \
npm start

# Or behind a reverse proxy (nginx/Caddy handles TLS, forwards to this server)
PUBLIC_URL=https://mini.example.com \
PORT=18679 \
npm start
```

The server auto-detects `wss://` (secure WebSocket) when the page is served over HTTPS, and `ws://` when over HTTP. No code changes needed.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `18679` | Port the relay server listens on |
| `PUBLIC_URL` | *(auto: LAN IP)* | URL players use to join (e.g. `https://mini.example.com`) |
| `TLS_CERT` | *(none)* | Path to PEM cert file for direct HTTPS |
| `TLS_KEY` | *(none)* | Path to PEM key file for direct HTTPS |

### Reverse Proxy Example (nginx)

```nginx
server {
    listen 443 ssl;
    server_name mini.example.com;

    ssl_certificate /etc/letsencrypt/live/mini.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mini.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:18679;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Then start with:
```bash
PUBLIC_URL=https://mini.example.com npm start
```

### Reverse Proxy Example (Caddy, auto-TLS)

```Caddyfile
mini.example.com {
    reverse_proxy 127.0.0.1:18679
}
```

Then start with:
```bash
PUBLIC_URL=https://mini.example.com npm start
```

## Host Controls

| Key | Action |
|-----|--------|
| `Space` | Start round / Pause |
| `Esc` | End round |
| START button | Begin a round (lobby only) |
| PAUSE button | Pause/resume |
| END button | End the current round |

## How It Works

```
Host PC (game.html)                    Phones (controller.html)
┌──────────────────────┐               ┌────────────────────┐
│  Three.js arena      │   WebSocket   │  HFT GameClient     │
│  HFT GameServer      │◄─────────────►│  Tilt + touch UI    │
│  Authoritative sim   │  ws:// or wss:// │ Personalized HUD   │
└──────────────────────┘               └────────────────────┘
```

- The host PC runs the authoritative game simulation (physics, collisions, items, scoring).
- Phones send input only (steer, gas, brake, action) at ~20Hz.
- The host broadcasts state (balloons, score, item, alive) and round info (phase, countdown, leaderboard) to each phone.
- Works over LAN or the internet — WebSocket auto-upgrades to `wss://` when served over HTTPS.

## Game Rules

- Each kart starts with **3 balloons**.
- Items (Green Shell, Red Shell, Banana, Mushroom Boost, Star) spawn as pickups around the arena.
- Getting hit by a shell, banana, or rammed by a boosted/star kart pops one balloon.
- Lose all 3 balloons → eliminated for the rest of the round.
- Last kart standing wins (or most balloons when the 90s timer expires).

## File Structure

```
minimachines/
├── start.js              # HFT server launcher (serves game + controller, generates QR)
├── package.json
├── game.html             # Host screen HTML
├── game.css              # Host screen styles
├── game.js               # Game engine (Three.js + HFT GameServer + game logic)
├── controller.html       # Phone controller HTML
├── controller.js         # Controller logic (HFT GameClient + input)
├── controller.css        # Controller styles
├── three.module.min.js   # Three.js (vendored, offline)
├── three.core.min.js     # Three.js core (vendored, offline)
└── smoke/
    └── hft-smoke.js      # Headless relay test
```

## Sponsors

Branding placeholders are built in for: **ai&** (inference provider), **Moonshot** (lab), **Tokyu Corporation** (real estate). Sponsor logos appear as arena wall banners and on the floor. Replace with real assets when available.

## Tech Stack

- **Three.js** — WebGL rendering (vendored ES module, no CDN needed)
- **HappyFunTimes** — smartphone-as-controller relay (`privateServer: true`, works over LAN or internet)
- **Node.js** — server (Express via HFT)
- **QRCode** — generates join QR on the host screen
