# Product Requirements Document: Mini Machines

## 1. Overview

**Product Name:** Mini Machines  
**Genre:** Local multiplayer party / arcade game  
**Platform:** Web browser (desktop host + smartphones as controllers) on a local area network  
**Core Technologies:** Three.js, HappyFunTimes, WebGL, Node.js, HTML5/WebSocket  
**Target Use Case:** Live events, expos, parties, arcades, and corporate activations where a large crowd joins instantly with their phones over the event LAN.

### Elevator Pitch
*Mini Machines* is a fast-paced, LAN-only, top-down/third-person arena battle game inspired by *Mario Kart* Balloon Battle. Dozens (or hundreds) of players drive tiny toy-like machines on a big shared 1080p screen. Each machine starts with three balloons and uses a smartphone as a steering wheel, accelerator, and item button. Pop opponents' balloons, protect your own, and be the last kart rolling. Rounds last 60–90 seconds and rotate through battle-themed modes so the crowd can hop in and out without friction.

## 2. Goals & Success Criteria

| Goal | Success Criteria |
|------|------------------|
| Instant join with no install | Player joins by entering a short URL or scanning a QR code on the event LAN; ready to drive in < 5 seconds. |
| Supports 10–200 concurrent players | Stable 30 FPS on a mid-range host PC with 100+ simultaneous machines. |
| Readable from a distance | Characters, score, and status are legible on a 1080p projector or large TV from 5–10 meters away. |
| Low event-staff overhead | Auto-rotation of game modes, automatic reconnection, self-service respawn; host controls limited to pause, end, and start. |
| Crowd energy amplification | Frequent balloon pops, power-ups, and leaderboards drive audible reactions. |

## 3. Target Audience

- **Primary:** Event attendees at conferences, festivals, game expos, arcades, and company parties.
- **Secondary:** Streaming/content creators running local multiplayer showcases.
- **Tertiary:** Educators / museums using play to attract groups.

## 4. Gameplay

### 4.1 Core Loop
1. Player scans QR code / opens the LAN-only short URL on their phone.
2. Player enters a nickname (auto-generated if skipped) and chooses a machine color/style.
3. Player spawns into the current arena round with **three balloons** tied to their kart.
4. Use phone to steer, accelerate, brake/reverse, and activate items with the action button.
5. Pop opponents' balloons, avoid losing your own, and survive.
6. Round ends when one player remains or the timer expires → leaderboard displayed → short interstitial (10 s) → next round begins.
7. Player can leave at any time; new players can join mid-round (they respawn with three balloons if eliminated).

### 4.2 Controls

| Phone Input | Action |
|-------------|--------|
| Device tilt / virtual joystick (left) | Steer left/right |
| Touch-and-hold right side / virtual gas pedal | Accelerate |
| Tap upper-right button / pinch | Brake / reverse |
| Single prominent center button | Use held item / attack (shell, bomb, boost, etc.) |
| Swipe up | Self-right / respawn if flipped |

The host screen always shows a simple "Tilt to steer, hold to gas, tap button to throw!" infographic before a player spawns.

### 4.3 Game Modes (Auto-Rotating Battle Modes)

All modes use the same core balloon-battle rules: each kart begins with **three balloons**. Direct hits from items or collisions under certain power-ups pop one balloon. Losing all three balloons eliminates the kart until the next round.

#### A. Balloon Battle (Free-for-All)
- Every kart for itself.
- Pop opponents' balloons; protect your own.
- Last kart with balloons wins. If the timer expires, the kart with the most balloons remaining wins (ties broken by pops dealt).

#### B. Team Pop (Red vs. Blue)
- Players are split into two teams automatically.
- Team score is the total balloons popped from the opposing team.
- Team with the most pops when time expires wins.

#### C. Balloon Stock Match
- Each player has three lives represented by three balloon sets.
- Losing all balloons costs one life; the player respawns immediately with a fresh set if lives remain.
- Last player with any lives remaining wins.

#### D. Shrinking Arena (Sudden Drop)
- The playfield slowly contracts, pushing karts toward the center.
- Standard balloon battle rules; falling off the arena eliminates the kart instantly.
- Last kart standing wins.

### 4.4 Items / Pickups

Items appear as glowing boxes scattered around the arena and are used with the action button. Only one item can be held at a time.

| Item | Effect |
|------|--------|
| Green Shell | Straight-firing projectile; pops one balloon on impact; bounces off walls. |
| Red Shell | Homing projectile; locks onto the nearest opponent and pops one balloon. |
| Banana Peel | Drops behind the kart; any kart that drives over it spins out and loses one balloon. |
| Bob-omb | Short-fuse bomb thrown in an arc; explodes in a radius and pops balloons. |
| Mushroom Boost | Temporary speed boost; colliding with an opponent while boosted pops one of their balloons. |
| Feather / Hop | Brief jump; useful for dodging items or crossing small gaps. |
| Star | Temporary invincibility; collisions pop opponents' balloons and you are immune to items. |
| Triple Balloons | Rare item that restores one lost balloon (max three). |

Items spawn randomly and are activated by the action button.

### 4.5 Scoring & Meta

- **Balloons:** Each player starts every round with three balloons.
- **Pops:** Dealing a hit that pops an opponent's balloon awards points.
- **Survival:** Last kart standing or most balloons remaining awards bonus points.
- **Round Score:** Based on balloons popped, balloons survived with, and final placement.
- **Session Score:** Rolling cumulative points across all rounds a player participates in.
- **Leaderboard:** Shows top 5 at the end of each round and a persistent "session" top 5.
- **Crowd MVP:** A random fun stat each round (Most Pops, Best Comeback, Longest Survival, Most Items Used, etc.).

## 5. Visual & Audio Design

### 5.1 Art Direction
- **Style:** Bright, chunky, toy-like karts; saturated colors; clean diffuse lighting; soft shadows; cartoon explosions and balloon pop effects.
- **Camera:** Slightly angled top-down, smoothly tracking the arena center; zooms out dynamically as players spread out. Locked to a **1080p (1920×1080)** target resolution.
- **Arena Themes:** Toy box, kitchen table, classroom floor, arcade carpet, neon grid.
- **Machine Customization:** Chassis shape, color, wheel style, antenna/horn decorations, underglow trail color, and balloon color.
- **Event Branding:** Placements reserved for sponsor/event artwork: ai& (inference provider), Moonshot (lab), and Tokyu Corporation (real estate). Assets will be supplied later and applied to arena banners, loading/interstitial screens, and kart decal slots.

### 5.2 UI
- Large, high-contrast HUD optimized for 1080p projection.
- Countdown timer always visible.
- Mode objective text at the top center (e.g., "Pop their balloons!").
- Balloon indicators next to each player's name on the leaderboard.
- Score panel on the left/right edge.
- Connection status / QR code / LAN URL shown during interstitial.
- Staff-only overlay: Start Round, Pause, and End Game buttons; no other host intervention is supported.

### 5.3 Audio
- Upbeat chiptune/arcade soundtrack with tempo that rises near round end.
- Distinct SFX for engine loops, collisions, item pickups, item throws, balloon pops, eliminations, falls, and round transitions.
- Optional crowd-reactive stinger when a new leader takes over or when a player is eliminated.

## 6. Technical Architecture

### 6.1 System Diagram

```
+----------------------------------+
| Host PC (Big Screen)             |
| Three.js + Game Simulation       |
| HappyFunTimes Host / WebSocket   |
+----------------------------------+
              ^
              | WebSocket / LAN
              v
+----------------------------------+
| Player Smartphones               |
| Controller Web Page              |
| (HTML5 tilt + touch UI)          |
+----------------------------------+
```

### 6.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Rendering | Three.js (WebGL) |
| Physics | cannon-es or rapier.js (3D collisions) |
| Networking | HappyFunTimes (or custom WebSocket fallback) |
| Server | Node.js + Express (optional static fallback) |
| State Sync | Authoritative host; clients send inputs only |
| Audio | Web Audio API + Howler.js |

### 6.3 Networking Requirements

- **LAN-only:** Host and phones must be on the same local area network / event Wi-Fi. No public internet play.
- Latency target < 50 ms on local network.
- Input packet rate: 20 Hz per client (throttled).
- State broadcast: 20 Hz to all clients; position interpolation on clients for smoothness.
- Graceful handling of packet loss: input prediction + server reconciliation for host display.

### 6.4 Performance Targets

| Metric | Target |
|--------|--------|
| Host FPS | 60 FPS on GTX 1060 / equivalent with 100 machines |
| Max concurrent players | 200 (configurable) |
| Input latency | < 80 ms end-to-end |
| Reconnection time | < 3 s |

## 7. HappyFunTimes Integration

### 7.1 Roles
- **HappyFunTimes Host** runs on the host PC alongside the Three.js game.
- Each phone becomes a generic "controller" device.
- The game receives:
  - `join` / `leave` events
  - `input` events (tilt x/y, touch state, button presses)
  - `name` / `color` selections
- The game sends back:
  - Haptic pulses
  - Player color assignments
  - Personalized score updates
  - Round state (waiting, playing, result)

### 7.2 Fallback Controller
Because the game is LAN-only, if HappyFunTimes is unavailable, provide a standalone controller page served by the host on the local network that uses standard device orientation and touch events over WebSocket.

## 8. User Flows

### 8.1 Event Organizer Setup
1. Launch host application on a PC connected to a 1080p projector/TV.
2. Connect host PC and player devices to the same LAN / event Wi-Fi.
3. Display QR code and LAN short URL on the big screen.
4. Select auto-rotate playlist or manual mode selection.
5. Staff can only **Start**, **Pause**, or **End** the game from the host overlay; no direct gameplay intervention is supported.
6. Press Start; game runs unattended until stopped.

### 8.2 Player Flow
1. Scan QR code / visit the LAN-only short URL.
2. Allow device orientation permissions if prompted.
3. Pick a nickname and color (or accept defaults).
4. Spawn into the current or next round with three balloons.
5. Drive, collect items, pop opponents' balloons, and protect your own.
6. Accumulate session score across rounds.
7. Leave by closing the browser.

## 9. Minimum Viable Product (MVP)

The MVP supports one event-ready build with the following scope:

- [ ] Three.js renderer at 1080p with one arena theme.
- [ ] Physics-based kart driving for up to 50 concurrent players.
- [ ] HappyFunTimes controller integration.
- [ ] Balloon battle system: three balloons per kart, item-based popping, elimination, and respawn.
- [ ] Two battle modes: Balloon Battle (free-for-all) and Team Pop (red vs. blue).
- [ ] Four items: Green Shell, Red Shell, Banana Peel, Mushroom Boost.
- [ ] Round rotation, leaderboard, and balloon survival scoring.
- [ ] QR code / LAN short URL display.
- [ ] Basic sound effects and music.
- [ ] Host controls limited to Start, Pause, and End Game.

## 10. Future Enhancements

- Additional arena themes (kitchen, classroom, neon city).
- More battle modes: Balloon Stock Match and Shrinking Arena.
- More items: Bob-omb, Feather, Star, Triple Balloons.
- Spectator mode on phones for players waiting to join.
- Twitch / streaming overlay integration.
- Tournament bracket mode for organized events.
- Sponsor branding asset integration (ai&, Moonshot, Tokyu Corporation).
- AI bots to fill low-player-count rounds.
- Mobile AR spectator view (optional).

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wi-Fi congestion with 100+ phones on LAN | High | Use a dedicated 5 GHz router; limit state broadcast; provide QR-code fallback. |
| Device orientation permissions blocked | Medium | Offer on-screen virtual joystick fallback on controller page. |
| Motion sickness from camera | Low | Keep camera mostly static; avoid rapid zooms or rolls. |
| Host PC performance drops | Medium | Add LOD for distant karts; cap physics step; reduce particle counts. |
| Players confused by controls | Medium | Show animated controller tutorial on phone before first spawn. |
| Balloon physics/network sync issues | Medium | Authoritative host handles all pops; clients predict visual effects only. |

## 12. Milestones

| Milestone | Deliverable | Target |
|-----------|-------------|--------|
| M1 | Tech prototype: single kart driving + HappyFunTimes echo | Week 2 |
| M2 | Multiplayer arena: 10 karts, collisions, three-balloon system, spawn/respawn | Week 4 |
| M3 | Battle modes + UI: Balloon Battle, Team Pop, leaderboard, host Start/Pause/End | Week 6 |
| M4 | MVP polish: items, audio, visual effects, 50-player stress test at 1080p | Week 8 |
| M5 | Soft launch at a local event and feedback collection | Week 10 |

## 13. Open Questions

- What file formats will the sponsor assets be delivered in (SVG, PNG, etc.)?
- Where should each sponsor logo appear on the 1080p screen (title card, arena banners, kart decals, leaderboard footer)?
- Should the host pause/end/start controls be accessible via a separate input device (keyboard/mouse) or as on-screen buttons only?
- Are there preferred color palettes from ai&, Moonshot, or Tokyu Corporation that must be respected in placeholder branding?

## 14. Appendix

### 14.1 Glossary
- **HappyFunTimes:** A framework that turns smartphones into game controllers over a local network.
- **Authoritative host:** The host PC is the single source of truth for game state; phones only send inputs.
- **LOD:** Level of detail; rendering simpler models for distant objects to improve performance.

### 14.2 References
- Three.js documentation: https://threejs.org/docs
- HappyFunTimes: http://happyfuntimes.net
- cannon-es physics: https://pmndrs.github.io/cannon-es/
