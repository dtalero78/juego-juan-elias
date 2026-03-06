# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Phaser 3 action game ("Mielito el Fugitivo") where players choose a character and bullet types to battle bosses or compete in PvP. Built with vanilla JavaScript (ES modules) and Vite.

## Shop / Currency

- **Placas** — main currency, stored in `localStorage('mielito_plates')`.
- **Pousos** — secondary currency, stored in `localStorage('mielito_pousos')`.
- Shop is opened from MenuScene. Sections: Clon skins, Perrito skins, Dragon del Sol de Oro (30 pousos), daily chest, 500 placas → 10 pousos exchange.
- **Roulette** (once/day): 5 sectors — 5 pousos (50%), 100 placas (25%), 250 placas (10%), 500 placas (5%), Skin Tierra (10%).
- **Daily chest** (once/day): placas, pousos, skin tierra, or Dragon del Sol.
- **Dragon del Sol de Oro**: Colombia Ball exclusive. 10 hits in 5 min → golden aura → 5 damage/hit + push + 0.5s stun on boss. Tracked per-scene.

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

1. **PreloadScene** — Loads external PNGs for characters and bosses; generates remaining textures procedurally via `graphics.generateTexture()`. External PNGs loaded in `preload()`, procedural textures in `createPlaceholderAssets()` called from `preload()`.
2. **MenuScene** — Character selection (5 characters), boss selection (3 bosses), bullet type selection (pick 2 of 7 types), PvP mode entry, shop.
3. **GameScene** — Main battle vs Octopus boss. Platforms, player bullets, enemy bullets, powerup drops.
4. **IceBossScene** — Winter-themed boss fight with snow/freeze mechanics.
5. **FinalBossScene** — Final boss "Hector" (500 HP, 2 phases). Phase 1: spread shots. Phase 2: bouncing rays, no body contact damage. QTE system for blocking boss attacks.
6. **BlibluBossScene** — Bliblu boss fight. Ground-based boss with melee damage and 20s bouncing dash. Light brown floor/platforms, fondo.jp2 background.
7. **PvPScene** — Local multiplayer or vs AI. Supports all 5 characters with CharacterAI opponents.

Data passes between scenes via `this.scene.start('SceneName', { selectedBullets, selectedCharacter })`.

### Entity System

All entities extend `Phaser.Physics.Arcade.Sprite`. Key classes in `src/entities/`:

- **Playable characters:** `Dolphin` (ranged), `ColombiaBall` (melee combo), `RedTriangle` (mid-range + shield, sprite: pou_chino.png), `Perrito` (magnet balls + melee), `TimeMaster` (flying + time-stop, PvP only)
- **Bosses:** `Octopus` (5 attack patterns, 100 HP), `IceBoss` (ice-themed, 80 HP), `FinalBoss` (Hector, 500 HP, 2 phases, sprite: boss_final.png), `BlibluBoss` (120 HP, melee + bounce dash every 20s, sprite: bliblu.png / bliblu_dash.png)
- **Projectiles:** `Bullet`, `OctopusBullet`, `Snowball`, `GoldenRay`, `Torbellino`
- **CharacterAI** — Behavior-based AI with per-character profiles (aggression, optimal distance, cooldowns)

Characters have dual-mode stats: low HP (3-4) in single-player, 100 HP in PvP.

### Communication Pattern

Scenes and entities communicate via Phaser events (`this.events.on/emit`), not direct method calls. Key events: `dolphinShoot`, `octopusShoot`, `octopusDied`, `iceBossDied`, `finalBossDied`, `blibluDied`, `colombiaAttack`, `triangleFireball`, `clonShoot`, `perritoMagnet`.

**IMPORTANT:** Before registering listeners in `create()`, call `this.events.off(e)` for each custom game event (NOT `removeAllListeners()` — that breaks Phaser's internal update loop). Pattern: `['dolphinShoot', 'colombiaAttack', ...].forEach(e => this.events.off(e));`

### Support Systems

- **TouchControls** (`src/ui/`) — On-screen d-pad and action buttons for mobile. Player-side aware (P1/P2 layouts).
- **SoundGenerator** (`src/utils/`) — All audio is synthesized via Web Audio API (no sound files). Gracefully degrades if unavailable.
- **Mobile detection** — `isMobile` exported from `config.js`, drives responsive UI sizing and touch control visibility.

## Key Conventions

- **New sprites** go in `public/assets/`. Load with `this.load.image(key, 'assets/file.png')` in PreloadScene's `preload()`. Procedural textures go in `createPlaceholderAssets()`.
- Bullet types are tracked per-character with an ammo object (`this.ammo[type]`). Q key cycles between selected types.
- The game canvas is 800x650 with FIT scaling (min 320x260). All positioning should respect these bounds.
- Multi-touch is enabled (3 active pointers) for mobile play.
- **Boss stun pattern:** `boss.stunnedUntil = this.time.now + ms` — boss `update()` returns early while stunned.
- **Boss damage per hit** in FinalBoss is 10 (health -= 10 per `takeDamage()` call). Other bosses use 1 per call.
- **`wasQDown` pattern** used in RedTriangle for manual JustDown detection with plain `{isDown}` objects.
