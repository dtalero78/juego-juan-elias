# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Phaser 3 action game ("Mielito el Fugitivo") where players choose a character and bullet types to battle bosses or compete in PvP. Built with vanilla JavaScript (ES modules) and Vite.

## Commands

```bash
npm run dev      # Start Vite dev server on localhost:3000
npm run build    # Production build to dist/
npm run preview  # Serve production build locally
npm start        # Production server (uses $PORT env var)
```

No test framework or linter is configured.

## Architecture

**Entry flow:** `index.html` → `src/main.js` → `src/config.js` (Phaser config) → Scene chain

### Scenes (in execution order)

1. **PreloadScene** — Generates almost all textures procedurally via Phaser Graphics API (no external sprite sheets). Only 3 characters load external PNGs.
2. **MenuScene** — Character selection (4 characters), boss selection (2 bosses), bullet type selection (pick 2 of 7 types), PvP mode entry.
3. **GameScene** — Main battle vs Octopus boss. Platforms, player bullets, enemy bullets, powerup drops.
4. **IceBossScene** — Winter-themed boss fight with snow/freeze mechanics.
5. **PvPScene** — Local multiplayer or vs AI. Supports all 4 characters with CharacterAI opponents.

Data passes between scenes via `this.scene.start('SceneName', { selectedBullets, selectedCharacter })`.

### Entity System

All entities extend `Phaser.Physics.Arcade.Sprite`. Key classes in `src/entities/`:

- **Playable characters:** `Dolphin` (ranged), `ColombiaBall` (melee combo), `RedTriangle` (mid-range + shield), `TimeMaster` (flying + time-stop, PvP only)
- **Bosses:** `Octopus` (5 attack patterns, 100 HP), `IceBoss` (ice-themed variant)
- **Projectiles:** `Bullet`, `OctopusBullet`, `Snowball`, `GoldenRay`
- **CharacterAI** — Behavior-based AI with per-character profiles (aggression, optimal distance, cooldowns)

Characters have dual-mode stats: low HP (3-4) in single-player, 100 HP in PvP.

### Communication Pattern

Scenes and entities communicate via Phaser events (`this.events.on/emit`), not direct method calls. Key events: `dolphinShoot`, `octopusShoot`, `octopusDied`.

### Support Systems

- **TouchControls** (`src/ui/`) — On-screen d-pad and action buttons for mobile. Player-side aware (P1/P2 layouts).
- **SoundGenerator** (`src/utils/`) — All audio is synthesized via Web Audio API (no sound files). Gracefully degrades if unavailable.
- **Mobile detection** — `isMobile` exported from `config.js`, drives responsive UI sizing and touch control visibility.

## Key Conventions

- Textures are created in PreloadScene using `graphics.generateTexture()` then the graphics object is destroyed — follow this pattern when adding new sprites.
- Bullet types are tracked per-character with an ammo object (`this.ammo[type]`). Q key cycles between selected types.
- The game canvas is 800x650 with FIT scaling (min 320x260). All positioning should respect these bounds.
- Multi-touch is enabled (3 active pointers) for mobile play.
