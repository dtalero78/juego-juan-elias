import Phaser from 'phaser';
import Dolphin from '../entities/Dolphin.js';
import ColombiaBall from '../entities/ColombiaBall.js';
import RedTriangle from '../entities/RedTriangle.js';
import Clon from '../entities/Clon.js';
import Perrito from '../entities/Perrito.js';
import Torbellino from '../entities/Torbellino.js';
import Bullet from '../entities/Bullet.js';
import FinalBoss from '../entities/FinalBoss.js';
import SoundGenerator from '../utils/SoundGenerator.js';
import TouchControls from '../ui/TouchControls.js';
import { isMobile } from '../config.js';

const PLAYER_MAX_HEALTH = 10;
const QTE_LETTERS = ['A', 'Z', 'K', 'P'];
const QTE_KEYS = {
  A: Phaser.Input.Keyboard.KeyCodes.A,
  Z: Phaser.Input.Keyboard.KeyCodes.Z,
  K: Phaser.Input.Keyboard.KeyCodes.K,
  P: Phaser.Input.Keyboard.KeyCodes.P
};

export default class FinalBossScene extends Phaser.Scene {
  constructor() {
    super('FinalBossScene');
    this.selectedBullets = ['normal', 'fire'];
    this.selectedCharacter = 'dolphin';
    this.soundGen = null;
    this.touchControls = null;
    this.isMobileDevice = isMobile;
  }

  init(data) {
    if (data && data.selectedBullets) this.selectedBullets = data.selectedBullets;
    if (data && data.selectedCharacter) this.selectedCharacter = data.selectedCharacter;
  }

  create() {
    this.gameOver = false;
    this.gameWon = false;

    // Balas del boss: array de { sprite, qteTriggered, speed, isRay }
    this.bossBullets = [];
    // QTE activo: { letter, letterText, timerBar, timerBg, keyListener, timerEvent, bulletEntry }
    this.activeQTE = null;

    this.soundGen = new SoundGenerator(this);
    this.soundGen.init();

    this.createBackground();
    this.createGround();
    this.platforms = [];
    this.createPlatforms();

    // ── Personaje ──
    if (this.selectedCharacter === 'colombiaBall') {
      this.player = new ColombiaBall(this, 100, 550);
    } else if (this.selectedCharacter === 'redTriangle') {
      this.player = new RedTriangle(this, 100, 550);
    } else if (this.selectedCharacter === 'clon') {
      this.player = new Clon(this, 100, 550);
    } else if (this.selectedCharacter === 'perrito') {
      this.player = new Perrito(this, 100, 550);
    } else {
      this.player = new Dolphin(this, 100, 550, this.selectedBullets);
    }
    this.dolphin = this.player;
    this.player.health = PLAYER_MAX_HEALTH;
    this.player.maxHealth = PLAYER_MAX_HEALTH;

    // ── Boss ──
    this.boss = new FinalBoss(this, 650, 280);
    this.boss.setTarget(this.player);

    // ── Dragon del Sol de Oro ──
    this.dragonSolEquipped = localStorage.getItem('mielito_dragon_sol_equipped') === 'true'
      && this.selectedCharacter === 'colombiaBall';
    this.dragonHits = 0;
    this.dragonWindowStart = 0;
    this.dragonAuraActive = false;
    this.dragonAuraCircle = null;

    // ── Grupos de proyectiles del jugador ──
    this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.torbellinos = this.physics.add.group({ classType: Torbellino, runChildUpdate: true });
    this.magnetBalls = [];

    // ── Controles ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Limpiar solo los eventos del juego para evitar acumulación al reiniciar
    ['dolphinShoot','finalBossSpread','finalBossRay','finalBossDied','finalBossPhase2',
     'dolphinJump','dolphinDash','colombiaJump','colombiaDash','colombiaPunch','colombiaSpecial',
     'colombiaAttack','colombiaEnergyBall','triangleJump','triangleDash','triangleShoot',
     'triangleShield','triangleFireball','clonJump','clonDash','clonShoot','clonMelee','clonModeChange',
     'perritoJump','perritoDash','perritoMagnet','perritoMelee','perritoModeChange'
    ].forEach(e => this.events.off(e));

    // ── Eventos del jugador ──
    this.events.on('dolphinShoot', this.createBullet, this);
    this.events.on('dolphinJump', () => this.soundGen.play('jump'), this);
    this.events.on('dolphinDash', () => this.soundGen.play('dash'), this);
    this.events.on('colombiaJump', () => this.soundGen.play('jump'), this);
    this.events.on('colombiaDash', () => this.soundGen.play('dash'), this);
    this.events.on('colombiaPunch', () => this.soundGen.play('hit'), this);
    this.events.on('colombiaSpecial', () => this.soundGen.play('shootFire'), this);
    this.events.on('colombiaAttack', this.handleColombiaAttack, this);
    this.events.on('colombiaEnergyBall', this.handleColombiaEnergyBall, this);
    this.events.on('triangleJump', () => this.soundGen.play('jump'), this);
    this.events.on('triangleDash', () => this.soundGen.play('dash'), this);
    this.events.on('triangleShoot', () => this.soundGen.play('shootFire'), this);
    this.events.on('triangleShield', () => this.soundGen.play('pickup'), this);
    this.events.on('triangleFireball', this.createBigFireball, this);
    this.events.on('clonJump', () => this.soundGen.play('jump'), this);
    this.events.on('clonDash', () => this.soundGen.play('dash'), this);
    this.events.on('clonShoot', (x, y, flipX) => this.createTorbellino(x, y, flipX), this);
    this.events.on('clonMelee', this.handleClonMelee, this);
    this.events.on('clonModeChange', (mode) => {
      if (this.ammoText) this.ammoText.setText(mode === 'melee' ? 'ESPACIO: Golpe | Q: cambiar | X: Dash' : 'ESPACIO: Torbellino | Q: cambiar | X: Dash');
    }, this);
    this.events.on('perritoJump', () => this.soundGen.play('jump'), this);
    this.events.on('perritoDash', () => this.soundGen.play('dash'), this);
    this.events.on('perritoMagnet', this.createMagnetBall, this);
    this.events.on('perritoMelee', this.handlePerritoMelee, this);
    this.events.on('perritoModeChange', (mode) => {
      if (this.ammoText) {
        this.ammoText.setText(mode === 'melee'
          ? 'ESPACIO: Golpe | Q: cambiar | X: Dash'
          : 'ESPACIO: Bola Magnética | Q: cambiar | X: Dash');
        this.ammoText.setFill(mode === 'melee' ? '#FF8800' : '#FF00FF');
      }
    }, this);

    // ── Eventos del boss ──
    this.events.on('finalBossSpread', this.createSpreadShot, this);
    this.events.on('finalBossRay', this.createRay, this);
    this.events.on('finalBossDied', this.handleVictory, this);
    this.events.on('finalBossPhase2', this.handlePhase2, this);

    // ── Q key ──
    this.qKey.on('down', () => {
      if (!this.gameOver && !this.gameWon) {
        if (this.selectedCharacter === 'redTriangle') {
          this.dolphin.activateShield();
        } else if (this.selectedCharacter !== 'colombiaBall' && this.selectedCharacter !== 'clon' && this.selectedCharacter !== 'perrito') {
          this.dolphin.nextBulletType();
          this.updateAmmoUI();
        }
      }
    });

    // ── Colisiones con balas del jugador ──
    this.physics.add.overlap(this.boss, this.bullets, this.hitBoss, null, this);
    this.physics.add.overlap(this.boss, this.torbellinos, this.hitBossWithTorbellino, null, this);
    this.physics.add.overlap(this.player, this.boss, this.hitPlayerWithBoss, null, this);
    this.physics.add.collider(this.player, this.ground);
    this.platforms.forEach(p => this.physics.add.collider(this.player, p));

    this.createUI();

    if (this.isMobileDevice) {
      this.touchControls = new TouchControls(this, 'player1');
    }

    this.input.keyboard.on('keydown-R', () => { if (this.gameOver || this.gameWon) this.scene.restart(); });
    this.input.keyboard.on('keydown-M', () => { if (this.gameOver || this.gameWon) this.scene.start('MenuScene'); });
  }

  // ─────────────────────────────────────────────
  // FONDO Y ESCENARIO
  // ─────────────────────────────────────────────
  createBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0010, 0x0a0010, 0x1a0030, 0x1a0030, 1);
    bg.fillRect(0, 0, 800, 650);

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 430);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xFF2200, Phaser.Math.FloatBetween(0.3, 0.9));
      this.tweens.add({
        targets: star, alpha: 0.1,
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      });
    }

    this.add.text(400, 20, '⚠ HECTOR ⚠', {
      fontSize: '18px', fill: '#FF4400', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
  }

  createGround() {
    const g = this.add.graphics();
    g.fillStyle(0x2a0030, 1);
    g.fillRect(0, 0, 800, 40);
    g.lineStyle(3, 0xFF0044, 1);
    g.lineBetween(0, 0, 800, 0);
    g.generateTexture('finalGround', 800, 40);
    g.destroy();

    this.ground = this.physics.add.staticImage(400, 630, 'finalGround');
    this.ground.setDisplaySize(800, 40);
    this.ground.refreshBody();
  }

  createPlatforms() {
    const positions = [
      { x: 150, y: 480, w: 160 },
      { x: 400, y: 390, w: 160 },
      { x: 650, y: 480, w: 160 },
      { x: 250, y: 300, w: 130 },
      { x: 560, y: 290, w: 130 }
    ];
    positions.forEach(pos => {
      const pg = this.add.graphics();
      pg.fillStyle(0x330044, 1);
      pg.fillRect(0, 0, pos.w, 18);
      pg.lineStyle(2, 0xFF0066, 1);
      pg.strokeRect(0, 0, pos.w, 18);
      pg.generateTexture(`fp_${pos.x}_${pos.y}`, pos.w, 18);
      pg.destroy();
      const p = this.physics.add.staticImage(pos.x, pos.y, `fp_${pos.x}_${pos.y}`);
      p.setDisplaySize(pos.w, 18);
      p.refreshBody();
      this.platforms.push(p);
    });
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  createUI() {
    const fontSize = this.isMobileDevice ? '14px' : '16px';
    const smallFontSize = this.isMobileDevice ? '10px' : '12px';

    this.playerHealthText = this.add.text(10, 10, `Vida: ${PLAYER_MAX_HEALTH}/${PLAYER_MAX_HEALTH}`, {
      fontSize, fill: '#00FF00', fontFamily: 'Courier New', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
    });

    this.bossHealthText = this.add.text(400, 10, `BOSS: ${this.boss.health}/${this.boss.maxHealth}`, {
      fontSize, fill: '#FF4444', fontFamily: 'Courier New', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0);

    this.phaseText = this.add.text(400, 34, 'FASE 1', {
      fontSize: '13px', fill: '#FF8800', fontFamily: 'Courier New', backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0);

    // Barra de vida del boss
    this.bossBarBg = this.add.rectangle(400, 57, 300, 10, 0x330000).setOrigin(0.5, 0);
    this.bossBar = this.add.rectangle(250, 57, 300, 10, 0xFF0000).setOrigin(0, 0);

    if (this.selectedCharacter === 'dolphin') {
      this.ammoText = this.add.text(10, 34, '', {
        fontSize: smallFontSize, fill: '#FFD700', fontFamily: 'Courier New',
        backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
      });
      this.updateAmmoUI();
    } else if (this.selectedCharacter === 'perrito') {
      this.ammoText = this.add.text(10, 34, 'ESPACIO: Bola Magnética | Q: cambiar | X: Dash', {
        fontSize: smallFontSize, fill: '#FF00FF', fontFamily: 'Courier New',
        backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
      });
    }

    this.gameOverText = this.add.text(400, 280, '', {
      fontSize: '40px', fill: '#FF0000', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5, backgroundColor: '#000000cc', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setVisible(false).setDepth(20);

    this.restartText = this.add.text(400, 340, '', {
      fontSize: '18px', fill: '#FFD700', fontFamily: 'Courier New',
      backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setVisible(false).setDepth(20);
  }

  updateAmmoUI() {
    if (!this.ammoText || this.selectedCharacter !== 'dolphin') return;
    const types = this.dolphin.selectedBullets || [];
    const current = this.dolphin.currentBulletType || 'normal';
    this.ammoText.setText(types.map(t => t === current ? `[${t}]` : t).join(' | '));
  }

  // ─────────────────────────────────────────────
  // PROYECTILES DEL JUGADOR
  // ─────────────────────────────────────────────
  createBullet(x, y, direction, type) {
    const bullet = this.bullets.get(x, y);
    if (bullet) {
      bullet.fire(x, y, direction, type);
      this.soundGen.play('shoot');
    }
  }

  createTorbellino(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;
    const torb = this.torbellinos.get(x, y);
    if (torb) {
      torb.fire(x, y, flipX ? -1 : 1);
      torb.setScale(3.5);
      torb.body.setSize(torb.width * 0.8, torb.height * 0.8);
      this.soundGen.play('shoot');
    }
  }

  createBigFireball(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;
    const dir = flipX ? -1 : 1;
    const fb = this.physics.add.image(x, y, 'bigFireball');
    fb.body.allowGravity = false;
    fb.setVelocityX(dir * 500);
    fb.setScale(1.5);
    this.physics.add.overlap(this.boss, fb, () => {
      if (!fb.active || !this.boss.active) return;
      fb.destroy();
      for (let i = 0; i < 6; i++) {
        const h = this.boss.takeDamage();
        if (h <= 0 && this.boss.phase > 1) break;
      }
      this.updateBossHealthUI();
      this.soundGen.play('explosion');
    });
    this.time.delayedCall(3000, () => { if (fb && fb.active) fb.destroy(); });
  }

  // ─────────────────────────────────────────────
  // COLISIONES CON EL BOSS
  // ─────────────────────────────────────────────
  hitBoss(boss, bullet) {
    if (!bullet.active || !boss.active) return;

    const damage = bullet.damage || 1;
    const bulletType = bullet.bulletType || 'normal';

    this.soundGen.play('hit');
    this.tweens.killTweensOf(bullet);
    bullet.setActive(false);
    bullet.setVisible(false);

    let totalDamage = damage;
    if (bulletType === 'fire') totalDamage += 2;
    if (bulletType === 'xmas') totalDamage += 4;

    for (let i = 0; i < totalDamage; i++) {
      if (boss.active) boss.takeDamage();
    }

    this.updateBossHealthUI();

    // Efecto de impacto
    const hit = this.add.circle(bullet.x, bullet.y, 15, 0xFF4400, 0.8);
    this.tweens.add({ targets: hit, alpha: 0, scale: 2, duration: 200, onComplete: () => hit.destroy() });
  }

  hitBossWithTorbellino(boss, torb) {
    if (!torb.active || !boss.active) return;
    this.tweens.killTweensOf(torb);
    torb.setActive(false);
    torb.setVisible(false);
    for (let i = 0; i < 5; i++) { if (boss.active) boss.takeDamage(); }
    this.updateBossHealthUI();
    this.soundGen.play('hit');
  }

  handleColombiaAttack(x, y, dir) {
    if (this.gameOver || this.gameWon || !this.boss.active) return;
    const dist = Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y);
    if (dist < 110) {
      if (this.dragonSolEquipped) this.checkDragonHit();
      if (this.dragonAuraActive) {
        this.applyDragonAttack(this.boss);
      } else {
        this.boss.takeDamage();
      }
      this.updateBossHealthUI();
      this.soundGen.play('hit');
    }
  }

  checkDragonHit() {
    if (this.dragonAuraActive) return;
    const now = this.time.now;
    if (this.dragonWindowStart === 0) this.dragonWindowStart = now;
    if (now - this.dragonWindowStart > 5 * 60 * 1000) {
      this.dragonHits = 0;
      this.dragonWindowStart = now;
    }
    this.dragonHits++;
    if (this.dragonHits >= 10) this.activateDragonAura();
  }

  activateDragonAura() {
    this.dragonAuraActive = true;
    this.dragonAuraCircle = this.add.circle(this.player.x, this.player.y, 48, 0xFFD700, 0.3).setDepth(4);
    this.tweens.add({ targets: this.dragonAuraCircle, scale: 1.3, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
    const txt = this.add.text(400, 265, 'AURA DEL DRAGON SOL', {
      fontSize: '22px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#FF6600', strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: txt, alpha: 0, y: 215, duration: 2500, onComplete: () => txt.destroy() });
    this.soundGen.play('shootFire');
  }

  applyDragonAttack(boss) {
    for (let i = 0; i < 5; i++) boss.takeDamage();
    const pushDir = (this.player.x < boss.x) ? 1 : -1;
    boss.x += pushDir * 30;
    boss.moveDir = pushDir;
    boss.stunnedUntil = this.time.now + 500;
  }

  handleColombiaEnergyBall(x, y, dir) {
    if (this.gameOver || this.gameWon) return;
    const ball = this.physics.add.image(x, y, 'energyBall');
    ball.body.allowGravity = false;
    ball.setVelocityX(dir * 400);
    this.physics.add.overlap(this.boss, ball, () => {
      if (!ball.active || !this.boss.active) return;
      ball.destroy();
      for (let i = 0; i < 5; i++) this.boss.takeDamage();
      this.updateBossHealthUI();
      this.soundGen.play('hit');
    });
    this.time.delayedCall(3000, () => { if (ball && ball.active) ball.destroy(); });
  }

  handlePerritoMelee(hitX, hitY, perrito) {
    if (this.gameOver || this.gameWon || !this.boss.active) return;
    this.soundGen.play('hit');
    const dist = Phaser.Math.Distance.Between(hitX, hitY, this.boss.x, this.boss.y);
    if (dist < 90) {
      this.boss.takeDamage();
      this.updateBossHealthUI();
      const impact = this.add.circle(this.boss.x, this.boss.y, 25, perrito.magnetColor, 0.7);
      this.tweens.add({ targets: impact, alpha: 0, scale: 2, duration: 300, onComplete: () => impact.destroy() });
    }
  }

  handleClonMelee(hitX, hitY) {
    if (this.gameOver || this.gameWon || !this.boss.active) return;
    this.soundGen.play('hit');
    const dist = Phaser.Math.Distance.Between(hitX, hitY, this.boss.x, this.boss.y);
    if (dist < 90) {
      this.boss.takeDamage();
      this.updateBossHealthUI();
      const impact = this.add.circle(this.boss.x, this.boss.y, 30, 0x00FF00, 0.7);
      this.tweens.add({ targets: impact, alpha: 0, scale: 2, duration: 300, onComplete: () => impact.destroy() });
    }
  }

  createMagnetBall(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;
    const color = (this.dolphin && this.dolphin.magnetColor) ? this.dolphin.magnetColor : 0xFF00FF;
    const dir = flipX ? -1 : 1;
    const magnet = this.physics.add.image(x + dir * 30, y, 'magnetBall');
    magnet.setScale(1.4);
    magnet.body.allowGravity = false;
    magnet.setVelocityX(280 * dir);
    if (color !== 0xFF00FF) magnet.setTint(color);
    this.tweens.add({ targets: magnet, scale: 1.9, duration: 350, yoyo: true, repeat: -1 });

    const entry = { sprite: magnet, createTime: this.time.now };
    this.magnetBalls.push(entry);

    this.time.delayedCall(500, () => {
      if (!magnet.active) return;
      magnet.setVelocity(0, 0);
      const ring = this.add.circle(magnet.x, magnet.y, 150, color, 0.08);
      this.tweens.add({ targets: ring, alpha: 0, duration: 3500, onComplete: () => ring.destroy() });
    });

    this.time.delayedCall(4000, () => {
      if (!magnet.active) return;
      if (this.boss && this.boss.active) {
        const dist = Phaser.Math.Distance.Between(magnet.x, magnet.y, this.boss.x, this.boss.y);
        if (dist < 100) {
          for (let i = 0; i < 5; i++) this.boss.takeDamage();
          this.updateBossHealthUI();
        }
      }
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const p = this.add.circle(magnet.x + Math.cos(angle) * 8, magnet.y + Math.sin(angle) * 8, Phaser.Math.Between(5, 13), color);
        this.tweens.add({ targets: p, x: magnet.x + Math.cos(angle) * 90, y: magnet.y + Math.sin(angle) * 90, alpha: 0, duration: 600, ease: 'Cubic.easeOut', onComplete: () => p.destroy() });
      }
      const idx = this.magnetBalls.indexOf(entry);
      if (idx !== -1) this.magnetBalls.splice(idx, 1);
      magnet.destroy();
      this.soundGen.play('explosion');
    });

    this.soundGen.play('pickup');
  }

  updateMagnetBalls() {
    this.magnetBalls.forEach(m => {
      if (!m.sprite || !m.sprite.active) return;
      if (this.time.now - m.createTime < 500) return;
      this.bossBullets.forEach(entry => {
        const b = entry.sprite;
        if (!b || !b.active) return;
        const dist = Phaser.Math.Distance.Between(b.x, b.y, m.sprite.x, m.sprite.y);
        if (dist < 120) {
          if (dist < 16) {
            this.removeBossBullet(entry);
          } else {
            const angle = Phaser.Math.Angle.Between(b.x, b.y, m.sprite.x, m.sprite.y);
            b.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
          }
        }
      });
    });
  }

  // ─────────────────────────────────────────────
  // PROYECTILES DEL BOSS
  // ─────────────────────────────────────────────
  createSpreadShot(bossX, bossY, target) {
    if (this.gameOver || this.gameWon) return;

    const angle = (target && target.active)
      ? Phaser.Math.Angle.Between(bossX, bossY, target.x, target.y)
      : Math.PI;
    const speed = 200;

    const sprite = this.physics.add.image(bossX, bossY, 'spreadBullet');
    sprite.setScale(0.55);
    sprite.setTint(0xFF1111);
    sprite.body.allowGravity = false;
    sprite.body.setSize(6, 6);
    sprite.body.setOffset((sprite.width - 6) / 2, (sprite.height - 6) / 2);
    sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    // Efecto rojo pulsante
    this.tweens.add({
      targets: sprite,
      alpha: { from: 1, to: 0.6 },
      scale: { from: 0.55, to: 0.68 },
      duration: 250,
      yoyo: true,
      repeat: -1
    });
    let redToggle = false;
    this.time.addEvent({
      delay: 250,
      repeat: -1,
      callback: () => {
        if (!sprite.active) return;
        sprite.setTint(redToggle ? 0xFF8800 : 0xFF1111);
        redToggle = !redToggle;
      }
    });
    this.bossBullets.push({ sprite, qteTriggered: false, speed, isRay: false });

    this.soundGen.play('shoot');
  }

  createRay(bossX, bossY, target) {
    if (this.gameOver || this.gameWon) return;

    const dir = (target && target.active && target.x < bossX) ? -1 : 1;
    const sprite = this.physics.add.image(bossX + dir * 40, bossY, 'bigRay');
    sprite.body.allowGravity = false;
    sprite.setVelocityX(dir * 500);
    sprite.setVelocityY(0);
    sprite.setScale(0.45);
    sprite.setFlipX(dir < 0);
    sprite.body.setSize(sprite.width * 0.5, 5);
    sprite.body.setOffset(sprite.width * 0.25, (sprite.height - 5) / 2);

    this.bossBullets.push({ sprite, qteTriggered: false, speed: 500, isRay: true, dir });
    this.soundGen.play('shootFire');
  }

  removeBossBullet(entry) {
    if (entry.sprite && entry.sprite.active) {
      entry.sprite.destroy();
    }
    const idx = this.bossBullets.indexOf(entry);
    if (idx !== -1) this.bossBullets.splice(idx, 1);
    // Si era el bullet del QTE activo, cancelar QTE
    if (this.activeQTE && this.activeQTE.bulletEntry === entry) {
      this.clearQTE();
    }
  }

  // ─────────────────────────────────────────────
  // SISTEMA QTE
  // ─────────────────────────────────────────────
  triggerQTE(bulletEntry) {
    if (this.activeQTE || this.gameOver || this.gameWon) return;
    bulletEntry.qteTriggered = true;

    // Pausar disparos del boss
    if (this.boss) this.boss.shootingPaused = true;

    // Pausar la bala
    if (bulletEntry.sprite && bulletEntry.sprite.body) {
      bulletEntry.sprite.setVelocity(0, 0);
      bulletEntry.sprite.body.allowGravity = false;
    }

    const letter = Phaser.Utils.Array.GetRandom(QTE_LETTERS);

    // Panel de fondo
    const panel = this.add.rectangle(400, 340, 220, 110, 0x000000, 0.85).setDepth(30);
    panel.setStrokeStyle(3, 0xFF4400);

    // Letra
    const letterText = this.add.text(400, 320, letter, {
      fontSize: '56px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(31);

    this.tweens.add({
      targets: letterText, scaleX: 1.15, scaleY: 1.15,
      duration: 300, yoyo: true, repeat: -1
    });

    // Barra de tiempo
    const timerBg = this.add.rectangle(400, 374, 180, 14, 0x440000).setDepth(30);
    const timerBar = this.add.rectangle(310, 374, 180, 14, 0xFF4400).setOrigin(0, 0.5).setDepth(31);

    // Subtitle
    const sub = this.add.text(400, 356, `¡Presiona ${letter}!`, {
      fontSize: '13px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(31);

    // Listener de teclado (raw, para que funcione aunque la tecla ya esté presionada)
    const keyCode = QTE_KEYS[letter];
    const onKeyDown = (event) => {
      if (event.keyCode === keyCode) {
        this.handleQTESuccess(bulletEntry);
      }
    };
    this.input.keyboard.on('keydown', onKeyDown);

    // Tween de la barra (5s)
    const barTween = this.tweens.add({
      targets: timerBar,
      width: 0,
      duration: 5000,
      ease: 'Linear'
    });

    // Timer de 5s
    const timerEvent = this.time.delayedCall(5000, () => {
      this.handleQTEFail(bulletEntry);
    });

    this.activeQTE = {
      letter, letterText, timerBar, timerBg, panel, sub,
      onKeyDown, timerEvent, barTween, bulletEntry
    };
  }

  handleQTESuccess(bulletEntry) {
    if (!this.activeQTE || this.activeQTE.bulletEntry !== bulletEntry) return;

    // Efecto de éxito
    const flash = this.add.text(400, 290, '✓', {
      fontSize: '60px', fill: '#00FF44', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: flash, alpha: 0, y: 240, duration: 700, onComplete: () => flash.destroy() });

    this.soundGen.play('pickup');
    this.clearQTE();
    this.removeBossBullet(bulletEntry);
  }

  handleQTEFail(bulletEntry) {
    if (!this.activeQTE || this.activeQTE.bulletEntry !== bulletEntry) return;

    // Posición de explosión: donde estaba la bala (cerca del jugador)
    const ex = bulletEntry.sprite ? bulletEntry.sprite.x : this.player.x;
    const ey = bulletEntry.sprite ? bulletEntry.sprite.y : this.player.y;

    this.clearQTE();
    this.removeBossBullet(bulletEntry);

    // Explosión visual
    const boom = this.add.circle(ex, ey, 10, 0xFF2200, 1).setDepth(15);
    this.tweens.add({ targets: boom, radius: 80, alpha: 0, duration: 500, ease: 'Cubic.easeOut', onComplete: () => boom.destroy() });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const p = this.add.circle(ex + Math.cos(a) * 10, ey + Math.sin(a) * 10, Phaser.Math.Between(4, 10), 0xFF6600).setDepth(15);
      this.tweens.add({ targets: p, x: ex + Math.cos(a) * 70, y: ey + Math.sin(a) * 70, alpha: 0, duration: 500, ease: 'Cubic.easeOut', onComplete: () => p.destroy() });
    }
    // Texto de fallo
    const fail = this.add.text(400, 290, '✗', {
      fontSize: '60px', fill: '#FF0000', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(32);
    this.tweens.add({ targets: fail, alpha: 0, y: 240, duration: 700, onComplete: () => fail.destroy() });

    this.soundGen.play('explosion');
    this.damageDolphin(1);
  }

  clearQTE() {
    if (!this.activeQTE) return;
    const q = this.activeQTE;
    this.activeQTE = null;

    // Reanudar disparos del boss
    if (this.boss) this.boss.shootingPaused = false;

    if (q.timerEvent) q.timerEvent.remove();
    if (q.barTween) q.barTween.stop();
    if (q.onKeyDown) {
      this.input.keyboard.off('keydown', q.onKeyDown);
    }
    [q.letterText, q.timerBar, q.timerBg, q.panel, q.sub].forEach(obj => {
      if (obj && obj.active) obj.destroy();
    });
  }

  // ─────────────────────────────────────────────
  // DAÑO AL JUGADOR
  // ─────────────────────────────────────────────
  hitPlayerWithBoss(player, boss) {
    if (!boss.active || player.invulnerable) return;
    this.damageDolphin(1);
  }

  damageDolphin(amount = 1) {
    if (!this.dolphin || this.dolphin.invulnerable || this.gameOver) return;
    this.soundGen.play('hurt');

    // takeDamage de cada entidad acepta un amount diferente; usamos el patrón de invulnerabilidad manualmente
    const health = this.dolphin.takeDamage(amount);

    if (this.playerHealthText) {
      this.playerHealthText.setText(`Vida: ${Math.max(0, health)}/${PLAYER_MAX_HEALTH}`);
      if (health <= 3) this.playerHealthText.setFill('#ff0000');
      else if (health <= 6) this.playerHealthText.setFill('#ffff00');
    }

    if (health <= 0) {
      this.gameOver = true;
      this.handleGameOver();
    }
  }

  // ─────────────────────────────────────────────
  // UI DEL BOSS
  // ─────────────────────────────────────────────
  updateBossHealthUI() {
    if (!this.bossHealthText) return;
    const h = Math.max(0, this.boss.health);
    const maxH = this.boss.maxHealth;
    this.bossHealthText.setText(`BOSS: ${h}/${maxH}`);

    const ratio = h / maxH;
    const newW = Math.round(300 * ratio);
    if (this.bossBar) {
      this.bossBar.setSize(newW, 10);
      this.bossBar.setFillStyle(this.boss.phase === 2 ? 0xFF6600 : 0xFF0000);
    }
  }

  // ─────────────────────────────────────────────
  // FASE 2
  // ─────────────────────────────────────────────
  handlePhase2() {
    this.soundGen.play('shootFire');
    if (this.phaseText) { this.phaseText.setText('¡FASE 2!'); this.phaseText.setFill('#FF0000'); }

    // Limpiar todas las balas de fase 1
    [...this.bossBullets].forEach(entry => this.removeBossBullet(entry));

    const alert = this.add.text(400, 300, '¡SEGUNDA FASE!', {
      fontSize: '40px', fill: '#FF4400', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5, backgroundColor: '#000000cc', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: alert, alpha: 0, scale: 2, duration: 1800, ease: 'Cubic.easeOut',
      onComplete: () => alert.destroy()
    });

    this.time.delayedCall(100, () => this.updateBossHealthUI());
  }

  // ─────────────────────────────────────────────
  // VICTORIA / DERROTA
  // ─────────────────────────────────────────────
  handleVictory() {
    this.gameWon = true;
    this.physics.pause();
    this.soundGen.play('victory');
    this.clearQTE();

    const plates = parseInt(localStorage.getItem('mielito_plates') || '0', 10);
    localStorage.setItem('mielito_plates', (plates + 200).toString());

    this.gameOverText.setText('¡HECTOR DERROTADO!');
    this.gameOverText.setFill('#FFD700');
    this.gameOverText.setVisible(true);

    const sub = this.add.text(400, 330, '+200 placas de metal', {
      fontSize: '18px', fill: '#C0C0C0', fontFamily: 'Courier New',
      backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: sub, y: 310, alpha: 0, duration: 3000, delay: 1000, onComplete: () => sub.destroy() });

    const msg = this.isMobileDevice ? 'Toca aquí para volver al menú' : 'R: Reintentar | M: Menú';
    this.restartText.setText(msg);
    this.restartText.setVisible(true);

    if (this.isMobileDevice) {
      this.restartText.setInteractive();
      this.restartText.once('pointerdown', () => this.scene.start('MenuScene'));
    }
  }

  handleGameOver() {
    this.physics.pause();
    this.soundGen.play('gameOver');
    this.clearQTE();
    if (this.touchControls) this.touchControls.destroy();

    this.gameOverText.setText('¡ELIMINADO!');
    this.gameOverText.setFill('#FF0000');
    this.gameOverText.setVisible(true);

    const msg = this.isMobileDevice ? 'Toca aquí para reintentar' : 'R: Reintentar | M: Menú';
    this.restartText.setText(msg);
    this.restartText.setVisible(true);

    if (this.isMobileDevice) {
      this.restartText.setInteractive();
      this.restartText.once('pointerdown', () => this.scene.restart());
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────
  update() {
    if (this.gameOver || this.gameWon) return;

    let cursors, wasd, spaceBar, xKey;
    if (this.isMobileDevice && this.touchControls) {
      cursors = this.touchControls.getState();
      wasd = this.touchControls.getWasdState();
      spaceBar = this.touchControls.getSpaceState();
      xKey = this.touchControls.getXKeyState();
    } else {
      cursors = this.cursors;
      wasd = this.wasd;
      spaceBar = this.spaceBar;
      xKey = this.xKey;
    }

    // Durante QTE: bloquear ataques (espacio y teclas de acción) para que no dispare
    const blockedKey = { isDown: false, _justDown: false };
    const activeSpaceBar = this.activeQTE ? blockedKey : spaceBar;
    const activeXKey = this.activeQTE ? blockedKey : xKey;
    const activeQKey = this.activeQTE ? blockedKey : this.qKey;

    this.dolphin.update(cursors, wasd, activeSpaceBar, activeXKey, activeQKey);
    this.boss.update();
    this.updateBossBulletsTracking();
    this.updateMagnetBalls();

    if (this.dragonAuraCircle && this.dragonAuraCircle.active && this.player && this.player.active) {
      this.dragonAuraCircle.setPosition(this.player.x, this.player.y);
    }
  }

  updateBossBulletsTracking() {
    const px = this.player.x;
    const py = this.player.y;

    // Iterar hacia atrás para poder borrar sin problemas
    for (let i = this.bossBullets.length - 1; i >= 0; i--) {
      const entry = this.bossBullets[i];
      const b = entry.sprite;

      if (!b || !b.active || !b.body) {
        this.bossBullets.splice(i, 1);
        continue;
      }

      // Destruir si sale de pantalla
      if (b.x < -100 || b.x > 900 || b.y < -100 || b.y > 750) {
        this.removeBossBullet(entry);
        continue;
      }

      // Si hay QTE activo de ESTA bala, la mantenemos quieta
      if (this.activeQTE && this.activeQTE.bulletEntry === entry) continue;

      // Homing suave hacia el jugador
      const toPlayer = Phaser.Math.Angle.Between(b.x, b.y, px, py);
      const currVx = b.body.velocity.x;
      const currVy = b.body.velocity.y;
      const currAngle = Math.atan2(currVy, currVx);
      const angleDiff = Phaser.Math.Angle.Wrap(toPlayer - currAngle);
      const turnRate = entry.isRay ? 0.03 : 0.05;
      const newAngle = currAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate);
      const speed = entry.speed;
      b.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);

      // Comprobar proximidad para QTE
      if (!entry.qteTriggered && !this.activeQTE) {
        const dist = Phaser.Math.Distance.Between(b.x, b.y, px, py);
        const triggerDist = entry.isRay ? 160 : 120;
        if (dist < triggerDist) {
          this.triggerQTE(entry);
        }
      }
    }
  }
}
