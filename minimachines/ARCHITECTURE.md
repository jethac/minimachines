# Architecture Decision: Zero-Cost Browser-Hosted Multiplayer

**Status:** Accepted — 2026-07-17

## Decision

Mini Machines will be a static web application. Opening the host page on the
projector computer starts the authoritative game simulation in that browser.
Phones connect directly to that host browser with WebRTC DataChannels.

A Cloudflare Worker plus Durable Object is permitted only as a short-lived,
free-tier signalling channel: it exchanges the WebRTC offer, answer, and ICE
candidates needed to pair a phone with the host. It is not a relay, does not
run game logic, and is not on the gameplay data path once a connection opens.

```
Static site                         Free pairing service
Host browser ── offer / answer ──► Cloudflare Worker / Durable Object
     │
     └──────── direct WebRTC DataChannels ────────► Player phones
               input upstream; player state downstream
```

## Why

- Event setup should require only opening a URL on the host/projector machine.
- The host machine already has the rendering and simulation compute needed for
  the game, so a paid always-on Node server is unnecessary.
- The paid Cloudflare Containers approach was rejected: it requires Workers
  Paid, while this project has a hard zero-cost operating requirement.
- The signalling workload is tiny and remains within Cloudflare Workers Free
  tier limits for normal event use.

## Product Consequences

- The displayed QR code identifies a temporary game room and lets a controller
  join with a single scan while the free signalling service is available.
- The host browser remains the authoritative source of truth. Controllers send
  input only; the host sends each player their state and round updates.
- Closing or reloading the host page ends the current game. This is intentional:
  the event machine is the server.
- The existing HappyFunTimes/Node relay is retained only as a local-development
  reference until the WebRTC transport replaces it.

## Constraints and Risks

- WebRTC normally establishes a direct route on event Wi-Fi with STUN. A
  restrictive network may require a TURN relay, which this zero-cost design
  deliberately does not provide.
- Events should use one shared Wi-Fi network and test pairing before doors open.
- If a network blocks peer-to-peer connectivity, the fallback is the current
  LAN Node relay run locally on the host, not a paid cloud relay.

## Explicit Non-Goals

- No Cloudflare Container, paid Worker, tunnel, or always-running backend.
- No internet-hosted authoritative simulation.
- No promise that the game continues after the host browser closes.
