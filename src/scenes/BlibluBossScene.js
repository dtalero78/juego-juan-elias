import Phaser from 'phaser';
import Dolphin from '../entities/Dolphin.js';
import ColombiaBall from '../entities/ColombiaBall.js';
import RedTriangle from '../entities/RedTriangle.js';
import Clon from '../entities/Clon.js';
import Perrito from '../entities/Perrito.js';
import Torbellino from '../entities/Torbellino.js';
import Bullet from '../entities/Bullet.js';
import BlibluBoss from '../entities/BlibluBoss.js';
import SoundGenerator from '../utils/SoundGenerator.js';
import TouchControls from '../ui/TouchControls.js';
import { isMobile } from '../config.js';

const GROUND_COLOR = 0xC8965A;
const PLATFORM_COLOR = 0xD4A46A;
const PLAYER_MAX_HEALTH = 4;

export default class BlibluBossScene extends Phaser.Scene {
  constructor() {
    super('BlibluBossScene');
    this.selectedBullets = ['normal', 'fire'];
    this.selectedCharacter = 'dolphin';
    this.soundGen = null;
    this.isMobileDevice = isMobile;
  }

  init(data) {
    if (data && data.selectedBullets) this.selectedBullets = data.selectedBullets;
    if (data && data.selectedCharacter) this.selectedCharacter = data.selectedCharacter;
  }

  create() {
    this.gameOver = false;
    this.gameWon = false;

    this.soundGen = new SoundGenerator(this);
    this.soundGen.init();

    // Fondo
    const bg = this.add.image(400, 325, 'fondoBliblu');
    bg.setDisplaySize(800, 650);
    bg.setDepth(0);

    // Plataformas
    this.platforms = [];
    this.createGround();
    this.createPlatforms();

    // Jugador
    if (this.selectedCharacter === 'colombiaBall') {
      this.player = new ColombiaBall(this, 100, 520);
      this.dolphin = this.player;
    } else if (this.selectedCharacter === 'redTriangle') {
      this.player = new RedTriangle(this, 100, 520);
      this.dolphin = this.player;
    } else if (this.selectedCharacter === 'clon') {
      this.player = new Clon(this, 100, 520);
      this.dolphin = this.player;
    } else if (this.selectedCharacter === 'perrito') {
      this.player = new Perrito(this, 100, 520);
      this.dolphin = this.player;
    } else {
      this.player = new Dolphin(this, 100, 520, this.selectedBullets);
      this.dolphin = this.player;
    }

    // Boss
    this.boss = new BlibluBoss(this, 650, 570);
    this.boss.setTarget(this.player);

    // Dragon del Sol de Oro
    this.dragonSolEquipped = localStorage.getItem('mielito_dragon_sol_equipped') === 'true'
      && this.selectedCharacter === 'colombiaBall';
    this.dragonHits = 0;
    this.dragonWindowStart = 0;
    this.dragonAuraActive = false;
    this.dragonAuraCircle = null;

    // Proyectiles del jugador
    this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.torbellinos = this.physics.add.group({ classType: Torbellino, runChildUpdate: true });
    this.magnetBalls = [];

    // Controles
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
    ['dolphinShoot','blibluDied','blibluSlam','blibluRage','dolphinJump','dolphinDash','dolphinFrenzy',
     'colombiaJump','colombiaDash','colombiaPunch','colombiaSpecial','colombiaAttack','colombiaEnergyBall','colombiaKnifeSlash','colombiaModeChange',
     'triangleJump','triangleDash','triangleShoot','triangleShield','triangleFireball','triangleMegaFireball',
     'clonJump','clonDash','clonShoot','clonMelee','clonModeChange',
     'perritoJump','perritoDash','perritoMagnet','perritoMelee','perritoModeChange'
    ].forEach(e => this.events.off(e));

    // Eventos del jugador
    this.events.on('dolphinShoot', this.createBullet, this);
    this.events.on('dolphinJump', () => this.soundGen.play('jump'), this);
    this.events.on('dolphinDash', () => this.soundGen.play('dash'), this);
    this.events.on('dolphinFrenzy', (active) => {
      if (!active) return;
      this.soundGen.play('shootFire');
      const txt = this.add.text(400, 260, '⚡ FRENESI ⚡', { fontSize: '30px', fill: '#00FFFF', fontFamily: 'Courier New', fontStyle: 'bold', stroke: '#003333', strokeThickness: 5 }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: txt, y: 195, alpha: 0, duration: 1800, ease: 'Cubic.easeOut', onComplete: () => txt.destroy() });
      const flash = this.add.rectangle(400, 325, 800, 650, 0x00FFFF, 0.15).setDepth(19);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, onComplete: () => flash.destroy() });
    }, this);
    this.events.on('colombiaJump', () => this.soundGen.play('jump'), this);
    this.events.on('colombiaDash', () => this.soundGen.play('dash'), this);
    this.events.on('colombiaPunch', () => this.soundGen.play('hit'), this);
    this.events.on('colombiaSpecial', () => this.soundGen.play('shootFire'), this);
    this.events.on('colombiaAttack', this.handleColombiaAttack, this);
    this.events.on('colombiaEnergyBall', this.handleColombiaEnergyBall, this);
    this.events.on('colombiaKnifeSlash', (x, y, velX, velY, angle, chargeLevel, scale) => this.createColombiaKnife(x, y, velX, velY, angle, chargeLevel, scale), this);
    this.events.on('colombiaModeChange', (mode) => {
      if (this.ammoText) this.ammoText.setText(mode === 'knife' ? 'ESPACIO: Cuchillazo (WASD apunta) | Q: cambiar | X: Dash' : 'ESPACIO: Combo → Bola de energía | Q: cambiar | X: Dash');
    }, this);
    this.events.on('triangleJump', () => this.soundGen.play('jump'), this);
    this.events.on('triangleDash', () => this.soundGen.play('dash'), this);
    this.events.on('triangleShoot', () => this.soundGen.play('shootFire'), this);
    this.events.on('triangleShield', () => this.soundGen.play('pickup'), this);
    this.events.on('triangleFireball', this.createBigFireball, this);
    this.events.on('triangleMegaFireball', this.createMegaFireball, this);
    this.events.on('clonJump', () => this.soundGen.play('jump'), this);
    this.events.on('clonDash', () => this.soundGen.play('dash'), this);
    this.events.on('clonShoot', (x, y, flipX) => this.createClonPlasma(x, y, flipX), this);
    this.events.on('clonMelee', this.handleClonMelee, this);
    this.events.on('clonModeChange', (mode) => {
      if (this.ammoText) this.ammoText.setText(mode === 'melee' ? 'ESPACIO: Golpe | Q: cambiar | X: Dash' : `ESPACIO: Plasma Nova (${this.player?.plasmaShots ?? 3}/3) | Q: cambiar | X: Dash`);
    }, this);
    this.events.on('clonPlasmaShots', (shots) => {
      if (this.ammoText) this.ammoText.setText(`ESPACIO: Plasma Nova (${shots}/3) | Q: cambiar | X: Dash`);
    }, this);
    this.events.on('blibluSlam', this.handleBrutusSlam, this);
    this.events.on('blibluRage', this.handleBrutusRage, this);
    this.events.on('perritoJump', () => this.soundGen.play('jump'), this);
    this.events.on('perritoDash', () => this.soundGen.play('dash'), this);
    this.events.on('perritoMagnet', this.createMagnetBall, this);
    this.events.on('perritoMelee', this.handlePerritoMelee, this);
    this.events.on('perritoModeChange', (mode) => {
      if (this.ammoText) {
        this.ammoText.setText(mode === 'melee'
          ? 'ESPACIO: Golpe | Q: cambiar | X: Dash'
          : 'ESPACIO: Tormenta Magnética (x3) | Q: cambiar | X: Dash');
        this.ammoText.setFill(mode === 'melee' ? '#FF8800' : '#FF00FF');
      }
    }, this);
    this.events.on('blibluDied', this.handleVictory, this);

    // Colisiones
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.boss, this.ground);
    this.platforms.forEach(p => {
      this.physics.add.collider(this.player, p);
      this.physics.add.collider(this.boss, p);
    });

    this.physics.add.overlap(this.boss, this.bullets, this.hitBoss, null, this);
    this.physics.add.overlap(this.boss, this.torbellinos, this.hitBossWithTorbellino, null, this);
    this.physics.add.overlap(this.player, this.boss, this.hitPlayerWithBoss, null, this);

    // Q key
    this.qKey.on('down', () => {
      if (!this.gameOver && !this.gameWon) {
        if (this.selectedCharacter === 'redTriangle') {
          this.player.activateShield();
        } else if (this.selectedCharacter !== 'colombiaBall' && this.selectedCharacter !== 'clon' && this.selectedCharacter !== 'perrito') {
          this.dolphin.nextBulletType();
          this.updateAmmoUI();
        }
      }
    });

    this.createUI();

    if (this.isMobileDevice) {
      this.touchControls = new TouchControls(this);
      this.touchControls.create();
    }

    // Powerups
    this.powerups = this.physics.add.group();
    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
    this.physics.add.collider(this.powerups, this.ground);

    this.time.addEvent({ delay: 20000, callback: this.spawnAmmoRain, callbackScope: this, loop: true });
    this.time.delayedCall(5000, () => this.spawnAmmoRain());
  }

  createGround() {
    this.ground = this.add.rectangle(400, 635, 800, 30, GROUND_COLOR);
    this.physics.add.existing(this.ground, true);

    // Borde superior decorativo
    const border = this.add.rectangle(400, 621, 800, 4, 0xA0724A);
    border.setDepth(1);
  }

  createPlatforms() {
    const defs = [
      { x: 130, y: 500, w: 140 },
      { x: 670, y: 500, w: 140 },
      { x: 260, y: 400, w: 120 },
      { x: 540, y: 400, w: 120 },
      { x: 400, y: 300, w: 160 },
      { x: 150, y: 240, w: 90 },
      { x: 650, y: 240, w: 90 },
    ];
    defs.forEach(d => {
      const plat = this.add.rectangle(d.x, d.y, d.w, 16, PLATFORM_COLOR);
      plat.setStrokeStyle(2, 0xA0724A);
      plat.setDepth(1);
      this.physics.add.existing(plat, true);
      this.platforms.push(plat);
    });
  }

  createUI() {
    const maxHealth = (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'clon' || this.selectedCharacter === 'perrito') ? 4 : 3;
    const healthColor = this.selectedCharacter === 'redTriangle' ? '#FF0000' : (this.selectedCharacter === 'clon' ? '#00FF00' : '#006400');

    this.playerHealthText = this.add.text(10, 10, `Vida: ${maxHealth}/${maxHealth}`, {
      fontSize: '20px', fill: healthColor, fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa', padding: { x: 5, y: 2 }
    });

    if (this.selectedCharacter === 'colombiaBall') {
      this.ammoText = this.add.text(10, 35, 'ESPACIO: Combo → Bola de energía | Q: cambiar | X: Dash', {
        fontSize: '12px', fill: '#FF6600', fontFamily: 'Courier New',
        backgroundColor: '#000000aa', padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'redTriangle') {
      this.ammoText = this.add.text(10, 35, 'Fuego: ∞ | Q: Escudo', {
        fontSize: '16px', fill: '#FF4500', fontFamily: 'Courier New',
        backgroundColor: '#000000aa', padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'clon') {
      this.ammoText = this.add.text(10, 35, 'ESPACIO: Plasma Nova (3/3) | Q: cambiar | X: Dash', {
        fontSize: '12px', fill: '#00AAFF', fontFamily: 'Courier New',
        backgroundColor: '#000000aa', padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'perrito') {
      this.ammoText = this.add.text(10, 35, 'ESPACIO: Tormenta Magnética (x3) | Q: cambiar | X: Dash', {
        fontSize: '12px', fill: '#FF00FF', fontFamily: 'Courier New',
        backgroundColor: '#000000aa', padding: { x: 5, y: 2 }
      });
    } else {
      this.ammoText = this.add.text(10, 35, 'Balas: 20 [Normal]', {
        fontSize: '16px', fill: '#FFD700', fontFamily: 'Courier New',
        backgroundColor: '#000000aa', padding: { x: 5, y: 2 }
      });
    }

    this.bossHealthText = this.add.text(580, 10, `BRUTUS: ${this.boss.health}`, {
      fontSize: '16px', fill: '#FF3300', fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa', padding: { x: 5, y: 2 }
    });

    // Barra de vida del boss
    this.bossBarBg = this.add.rectangle(400, 26, 300, 12, 0x333333).setDepth(5);
    this.bossBar = this.add.rectangle(400 - 150 + 1, 26, 298, 10, 0xFF3300).setDepth(6);
    this.bossBar.setOrigin(0, 0.5);

    this.bossNameLabel = this.add.text(400, 14, '⚠ BRUTUS ⚠', {
      fontSize: '13px', fill: '#FF4400', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(7);

    this.gameOverText = this.add.text(400, 300, '', {
      fontSize: '48px', fill: '#ff0000', fontFamily: 'Courier New', align: 'center'
    }).setOrigin(0.5).setVisible(false);

    this.restartText = this.add.text(400, 360, '', {
      fontSize: '20px', fill: '#fff', fontFamily: 'Courier New', align: 'center'
    }).setOrigin(0.5).setVisible(false);
  }

  updateBossHealthUI() {
    if (!this.boss.active) return;
    if (this.bossHealthText) this.bossHealthText.setText(`BRUTUS: ${this.boss.health}`);
    if (this.bossBar) {
      const ratio = Math.max(0, this.boss.health / this.boss.maxHealth);
      this.bossBar.setSize(Math.round(298 * ratio), 10);
    }
  }

  // ── Proyectiles del jugador ──

  createBullet(x, y, bulletType, flipX) {
    if (this.gameOver || this.gameWon) return;

    const dir = flipX ? -1 : 1;
    const bx = x + dir * 10;

    if (bulletType === 'fire') this.soundGen.play('shootFire');
    else if (bulletType === 'ice') this.soundGen.play('shootIce');
    else this.soundGen.play('shoot');

    if (bulletType === 'normal') {
      const b = this.bullets.get(bx, y, 'bullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(520 * dir); b.body.allowGravity = false; b.damage = 4; b.bulletType = 'normal'; b.setScale(1.2);
        const t = this.time.addEvent({ delay: 30, callback: () => { if (!b.active) { t.remove(); return; } const p = this.add.circle(b.x, b.y, Phaser.Math.Between(3,7), 0x00FFFF, 0.7); this.tweens.add({ targets: p, scale: 0, alpha: 0, duration: 200, onComplete: () => p.destroy() }); }, loop: true }); }
    } else if (bulletType === 'fire') {
      const b = this.bullets.get(bx, y, 'fireBullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(500 * dir); b.body.allowGravity = false; b.damage = 4; b.bulletType = 'fire'; b.setScale(1.1);
        this.tweens.add({ targets: b, scale: 1.6, duration: 800, ease: 'Quad.easeIn' });
        const t = this.time.addEvent({ delay: 28, callback: () => { if (!b.active) { t.remove(); return; } const p = this.add.circle(b.x, b.y, Phaser.Math.Between(5,11), Phaser.Math.RND.pick([0xFF4400,0xFF8800,0xFFCC00]), 0.8); this.tweens.add({ targets: p, scale: 0, alpha: 0, duration: 240, onComplete: () => p.destroy() }); }, loop: true }); }
    } else if (bulletType === 'ice') {
      const b = this.bullets.get(bx, y, 'iceBullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(370 * dir); b.body.allowGravity = false; b.damage = 2; b.bulletType = 'ice'; b.slowEffect = true; b.setScale(1.8); b.setTint(0xADD8E6);
        this.tweens.add({ targets: b, alpha: 0.55, scaleX: 2.1, scaleY: 1.5, duration: 220, yoyo: true, repeat: -1 }); }
    } else if (bulletType === 'triple') {
      const angles = [-38, -18, 0, 18, 38]; const speeds = [390, 420, 450, 420, 390];
      angles.forEach((ang, i) => { this.time.delayedCall(i * 40, () => {
        const b = this.bullets.get(bx, y, 'tripleBullet');
        if (!b) return; b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.damage = 2; b.bulletType = 'triple'; b.setScale(1.1); b.body.allowGravity = false;
        const rad = Phaser.Math.DegToRad(ang); b.setVelocity(Math.cos(rad) * speeds[i] * dir, Math.sin(rad) * speeds[i]);
        this.tweens.add({ targets: b, scale: 1.4, duration: 180, yoyo: true, repeat: -1 });
      }); });
      const fan = this.add.circle(bx, y, 14, 0xFFFF00, 0.8); this.tweens.add({ targets: fan, scale: 3, alpha: 0, duration: 250, onComplete: () => fan.destroy() });
    } else if (bulletType === 'fast') {
      const b = this.bullets.get(bx, y, 'fastBullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(1050 * dir); b.body.allowGravity = false; b.damage = 2; b.bulletType = 'fast'; b.setScale(0.85); b.setTint(0xFFFF44);
        const t = this.time.addEvent({ delay: 18, callback: () => { if (!b.active) { t.remove(); return; } const p = this.add.circle(b.x, b.y, Phaser.Math.Between(3,8), 0xFFFF00, 0.9); this.tweens.add({ targets: p, scaleX: 4, scaleY: 0.3, alpha: 0, duration: 160, onComplete: () => p.destroy() }); }, loop: true }); }
    } else if (bulletType === 'teleport') {
      const b = this.bullets.get(bx, y, 'teleportBullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocity(370 * dir, -180); b.damage = 0; b.bulletType = 'teleport'; b.isTeleport = true; b.body.allowGravity = true; b.body.setGravityY(300); b.setScale(1.4);
        this.tweens.add({ targets: b, alpha: 0.4, scale: 1.8, duration: 130, yoyo: true, repeat: -1 }); }
    } else if (bulletType === 'xmas') {
      const b = this.bullets.get(bx, y, 'xmasBullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(400 * dir); b.body.allowGravity = false; b.damage = 6; b.bulletType = 'xmas'; b.isXmas = true; b.setScale(1.3);
        this.tweens.add({ targets: b, rotation: Math.PI * 2, duration: 450, repeat: -1 });
        this.tweens.add({ targets: b, scale: 1.7, duration: 200, yoyo: true, repeat: -1 }); }
    } else {
      const b = this.bullets.get(bx, y, 'bullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(520 * dir); b.body.allowGravity = false; b.damage = 4; b.bulletType = bulletType; }
    }

    this.updateAmmoUI();
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
      for (let i = 0; i < 6; i++) this.boss.takeDamage();
      this.updateBossHealthUI();
      this.soundGen.play('explosion');
    });
    this.time.delayedCall(3000, () => { if (fb && fb.active) fb.destroy(); });
  }

  createMegaFireball(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;
    const dir = flipX ? -1 : 1;
    const fb = this.physics.add.image(x, y, 'bigFireball');
    fb.body.allowGravity = false;
    fb.setVelocityX(dir * 720);
    fb.setScale(2.4);
    fb.setTint(0xFFFFAA);
    this.tweens.add({ targets: fb, scale: 2.9, duration: 90, yoyo: true, repeat: -1 });
    this.physics.add.overlap(this.boss, fb, () => {
      if (!fb.active || !this.boss.active) return;
      fb.destroy();
      for (let i = 0; i < 20; i++) this.boss.takeDamage();
      this.updateBossHealthUI();
      const boom = this.add.circle(fb.x, fb.y, 30, 0xFF4400, 0.9);
      this.tweens.add({ targets: boom, scale: 5, alpha: 0, duration: 500, onComplete: () => boom.destroy() });
      this.soundGen.play('explosion');
    });
    const trail = this.time.addEvent({
      delay: 25,
      callback: () => {
        if (!fb.active) { trail.remove(); return; }
        const p = this.add.circle(fb.x, fb.y, Phaser.Math.Between(8, 20), Phaser.Math.RND.pick([0xFF2200, 0xFF6600, 0xFFFF00]), 0.8);
        this.tweens.add({ targets: p, scale: 0, alpha: 0, duration: 250, onComplete: () => p.destroy() });
      },
      loop: true
    });
    this.time.delayedCall(3000, () => { if (fb && fb.active) fb.destroy(); });
  }

  createTorbellino(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;
    const torb = this.torbellinos.get(x, y);
    if (torb) {
      torb.fire(x, y, flipX ? -1 : 1);
      torb.setScale(3.5);
      torb.body.setSize(torb.width * 0.8, torb.height * 0.8);
    }
    this.soundGen.play('shoot');
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

  // ── Colisiones boss ──

  hitBoss(boss, bullet) {
    if (!bullet.active || !boss.active) return;
    this.tweens.killTweensOf(bullet);
    bullet.setActive(false); bullet.setVisible(false);
    const dmg = bullet.damage || 1;
    for (let i = 0; i < dmg; i++) boss.takeDamage();
    this.updateBossHealthUI();
    this.soundGen.play('hit');
  }

  hitBossWithTorbellino(boss, torb) {
    if (!torb.active || !boss.active) return;
    torb.setActive(false); torb.setVisible(false);
    torb.body.stop();
    this.tweens.killTweensOf(torb);
    for (let i = 0; i < 10; i++) boss.takeDamage();
    this.updateBossHealthUI();
    this.soundGen.play('hit');
  }

  hitPlayerWithBoss(player, boss) {
    if (!boss.active || player.invulnerable) return;
    this.damageDolphin(boss.isDashing ? 2 : 1);
  }

  handleColombiaAttack(x, y, comboCount, flipX) {
    if (!this.boss || !this.boss.active) return;
    const attackX = flipX ? x - 40 : x + 40;
    const dist = Phaser.Math.Distance.Between(attackX, y, this.boss.x, this.boss.y);
    if (dist < 80) {
      if (this.dragonSolEquipped) this.checkDragonHit();
      if (this.dragonAuraActive) {
        this.applyDragonAttack(this.boss);
      } else {
        for (let i = 0; i < comboCount; i++) this.boss.takeDamage();
      }
      const hitColor = this.dragonAuraActive ? 0xFFD700 : 0xFFFFFF;
      const fx = this.add.circle(this.boss.x, this.boss.y, 20, hitColor, 0.8);
      this.tweens.add({ targets: fx, scale: 2, alpha: 0, duration: 150, onComplete: () => fx.destroy() });
      this.updateBossHealthUI();
    }
  }

  handleColombiaEnergyBall(energySphere) {
    this.physics.add.overlap(energySphere, this.boss, () => {
      if (!this.boss.active || !energySphere.active) return;
      this.soundGen.play('hit');
      for (let i = 0; i < 5; i++) this.boss.takeDamage();
      this.updateBossHealthUI();
      const fx = this.add.circle(this.boss.x, this.boss.y, 40, 0x9400D3, 0.8);
      this.tweens.add({ targets: fx, scale: 2.5, alpha: 0, duration: 400, onComplete: () => fx.destroy() });
      energySphere.body.enable = false;
      this.tweens.add({ targets: energySphere, scale: 2, alpha: 0, duration: 200, onComplete: () => { if (energySphere.active) energySphere.destroy(); } });
    });
  }

  createColombiaKnife(x, y, velX, velY, angle, chargeLevel = 0, knifeScale = 1.6) {
    if (this.gameOver || this.gameWon || !this.boss || !this.boss.active) return;

    const isSuperCharge = chargeLevel >= 10;
    const burnTicks = isSuperCharge ? 0 : Math.floor(2 + chargeLevel * 0.5);

    const knife = this.physics.add.image(x, y, 'colombiaKnife');
    knife.setAngle(angle);
    knife.body.allowGravity = false;
    knife.setVelocity(velX, velY);
    knife.setScale(knifeScale);
    if (isSuperCharge) knife.setTint(0xFFFFFF);

    const emberColor = isSuperCharge ? 0xFFFF00 : 0xFF4400;
    this.time.addEvent({
      delay: 25,
      callback: () => {
        if (!knife.active) return;
        const ember = this.add.circle(knife.x, knife.y, Phaser.Math.Between(isSuperCharge ? 8 : 4, isSuperCharge ? 16 : 9), emberColor, 0.8);
        this.tweens.add({ targets: ember, scale: 0, alpha: 0, duration: 220, onComplete: () => ember.destroy() });
      },
      loop: true, repeat: 40
    });

    this.physics.add.overlap(knife, this.boss, () => {
      if (!this.boss.active || !knife.active) return;
      const bx = this.boss.x, by = this.boss.y;
      knife.destroy();
      this.soundGen.play('hit');

      if (isSuperCharge) {
        this.cameras.main.shake(300, 0.018);
        const boom = this.add.circle(bx, by, 10, 0xFFFF00, 1);
        this.tweens.add({ targets: boom, scale: 14, alpha: 0, duration: 600, onComplete: () => boom.destroy() });
        const fire = this.add.circle(bx, by, 5, 0xFF4400, 0.9);
        this.tweens.add({ targets: fire, scale: 12, alpha: 0, duration: 800, onComplete: () => fire.destroy() });
        for (let i = 0; i < 12; i++) {
          const spark = this.add.circle(bx + Phaser.Math.Between(-80,80), by + Phaser.Math.Between(-80,80), Phaser.Math.Between(6,16), 0xFF6600, 0.9);
          this.tweens.add({ targets: spark, scale: 0, alpha: 0, duration: Phaser.Math.Between(400,700), onComplete: () => spark.destroy() });
        }
        for (let i = 0; i < 15; i++) { if (this.boss.active) this.boss.takeDamage(); }
        this.updateBossHealthUI();
      } else {
        this.boss.takeDamage();
        this.updateBossHealthUI();
        const burn = this.add.circle(bx, by, 25, 0xFF4400, 0.85);
        this.tweens.add({ targets: burn, scale: 2.5, alpha: 0, duration: 350, onComplete: () => burn.destroy() });
        for (let i = 1; i <= burnTicks; i++) {
          this.time.delayedCall(i * 500, () => {
            if (this.boss && this.boss.active) {
              this.boss.takeDamage();
              this.updateBossHealthUI();
              const dot = this.add.circle(this.boss.x, this.boss.y, 12, 0xFF6600, 0.7);
              this.tweens.add({ targets: dot, scale: 2, alpha: 0, duration: 250, onComplete: () => dot.destroy() });
            }
          });
        }
      }
    });

    this.time.delayedCall(2000, () => { if (knife.active) knife.destroy(); });
  }

  handlePerritoMelee(hitX, hitY, perrito) {
    if (this.gameOver || this.gameWon || !this.boss || !this.boss.active) return;
    this.soundGen.play('hit');
    const dist = Phaser.Math.Distance.Between(hitX, hitY, this.boss.x, this.boss.y);
    if (dist < 90) {
      this.boss.takeDamage();
      this.updateBossHealthUI();
      const fx = this.add.circle(this.boss.x, this.boss.y, 25, perrito.magnetColor, 0.7);
      this.tweens.add({ targets: fx, alpha: 0, scale: 2, duration: 300, onComplete: () => fx.destroy() });
    }
  }

  handleClonMelee(hitX, hitY) {
    if (this.gameOver || this.gameWon || !this.boss || !this.boss.active) return;
    this.soundGen.play('hit');
    const dist = Phaser.Math.Distance.Between(hitX, hitY, this.boss.x, this.boss.y);
    if (dist < 90) {
      this.boss.takeDamage();
      this.updateBossHealthUI();
      const impact = this.add.circle(this.boss.x, this.boss.y, 30, 0x00FF00, 0.7);
      this.tweens.add({ targets: impact, alpha: 0, scale: 2, duration: 300, onComplete: () => impact.destroy() });
    }
  }

  // ── Dragon del Sol ──

  checkDragonHit() {
    if (this.dragonAuraActive) return;
    const now = this.time.now;
    if (this.dragonWindowStart === 0) this.dragonWindowStart = now;
    if (now - this.dragonWindowStart > 5 * 60 * 1000) { this.dragonHits = 0; this.dragonWindowStart = now; }
    this.dragonHits++;
    if (this.dragonHits >= 10) this.activateDragonAura();
  }

  activateDragonAura() {
    this.dragonAuraActive = true;
    this.dragonAuraCircle = this.add.circle(this.player.x, this.player.y, 48, 0xFFD700, 0.3).setDepth(4);
    this.tweens.add({ targets: this.dragonAuraCircle, scale: 1.3, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
    const txt = this.add.text(400, 265, 'AURA DEL DRAGON SOL', {
      fontSize: '22px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold', stroke: '#FF6600', strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: txt, alpha: 0, y: 215, duration: 2500, onComplete: () => txt.destroy() });
    this.soundGen.play('shootFire');
  }

  applyDragonAttack(boss) {
    for (let i = 0; i < 5; i++) if (boss.active) boss.takeDamage();
    const pushDir = (this.player.x < boss.x) ? 1 : -1;
    boss.x += pushDir * 30;
    boss.stunnedUntil = this.time.now + 500;
  }

  // ── Daño al jugador ──

  damageDolphin(amount = 1) {
    if (!this.dolphin || this.dolphin.invulnerable || this.gameOver) return;
    this.soundGen.play('hurt');
    const health = this.dolphin.takeDamage(amount);
    const maxHealth = (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'clon' || this.selectedCharacter === 'perrito') ? 4 : 3;

    if (this.playerHealthText) {
      this.playerHealthText.setText(`Vida: ${Math.max(0, health)}/${maxHealth}`);
      if (health <= 1) this.playerHealthText.setFill('#ff0000');
      else if (health <= 2) this.playerHealthText.setFill('#ffff00');
    }

    if (health <= 0) { this.gameOver = true; this.handleGameOver(); }
  }

  // ── Ammo / powerups ──

  updateAmmoUI() {
    if (this.selectedCharacter === 'colombiaBall') return; // handled by colombiaModeChange event
    if (this.selectedCharacter === 'clon' || this.selectedCharacter === 'perrito') return;
    if (!this.dolphin.ammo) return;
    const typeNames = { normal: 'Normal', fire: 'Fuego', ice: 'Hielo', triple: 'Triple', fast: 'Rápida', xmas: 'Navidad' };
    const typeColors = { normal: '#FFD700', fire: '#FF4500', ice: '#00BFFF', triple: '#00FF00', fast: '#9400D3', xmas: '#FF0000' };
    const t = this.dolphin.bulletType;
    this.ammoText && this.ammoText.setText(`Balas: ${this.dolphin.ammo[t] || 0} [${typeNames[t] || t}]`);
    this.ammoText && this.ammoText.setFill(typeColors[t] || '#FFD700');
  }

  spawnAmmoRain() {
    if (this.gameOver || this.gameWon) return;
    const allTypes = {
      normal: { type: 'normal', texture: 'ammoNormal', amount: 10 },
      fire:   { type: 'fire',   texture: 'ammoFire',   amount: 8 },
      ice:    { type: 'ice',    texture: 'ammoIce',    amount: 3 },
      triple: { type: 'triple', texture: 'ammoTriple', amount: 3 },
      fast:   { type: 'fast',   texture: 'ammoFast',   amount: 5 },
      xmas:   { type: 'xmas',   texture: 'ammoXmas',   amount: 4 }
    };
    const types = this.selectedBullets.map(t => allTypes[t]).filter(Boolean);
    for (let i = 0; i < 12; i++) {
      const rnd = Phaser.Math.RND.pick(types);
      if (!rnd) continue;
      const x = Phaser.Math.Between(50, 750);
      this.time.delayedCall(i * 100, () => {
        if (this.gameOver || this.gameWon) return;
        const pu = this.powerups.create(x, -20, rnd.texture);
        pu.ammoType = rnd.type; pu.ammoAmount = rnd.amount;
        pu.setVelocityY(150); pu.setBounce(0.3);
        this.time.delayedCall(10000, () => { if (pu.active) pu.destroy(); });
      });
    }
  }

  collectPowerup(dolphin, powerup) {
    if (!powerup.active) return;
    if (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'redTriangle' || this.selectedCharacter === 'clon') {
      if (dolphin.health < dolphin.maxHealth) {
        dolphin.health++;
        this.soundGen.play('pickup');
        const maxH = dolphin.maxHealth;
        this.playerHealthText && this.playerHealthText.setText(`Vida: ${dolphin.health}/${maxH}`);
        const t = this.add.text(powerup.x, powerup.y, '+1', { fontSize: '16px', fill: '#00FF00', fontFamily: 'Courier New' }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: powerup.y - 50, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
      }
      powerup.destroy(); return;
    }
    this.soundGen.play('pickup');
    dolphin.addAmmo(powerup.ammoType, powerup.ammoAmount);
    this.updateAmmoUI();
    const t = this.add.text(powerup.x, powerup.y, `+${powerup.ammoAmount} ${powerup.ammoType}`, { fontSize: '14px', fill: '#00FF00', fontFamily: 'Courier New' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: powerup.y - 50, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
    powerup.destroy();
  }

  createClonPlasma(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;
    const dir = flipX ? -1 : 1;
    const plasma = this.physics.add.image(x + dir * 30, y, 'clonPlasma');
    plasma.setScale(1.8);
    plasma.body.allowGravity = false;
    plasma.setVelocityX(dir * 200);

    // Pulso visual
    this.tweens.add({ targets: plasma, scale: 2.2, duration: 300, yoyo: true, repeat: -1 });

    this.physics.add.overlap(this.boss, plasma, () => {
      if (!plasma.active || !this.boss.active) return;
      this.tweens.killTweensOf(plasma);
      plasma.destroy();
      // Explosión AoE
      const boom = this.add.circle(this.boss.x, this.boss.y, 60, 0x0088FF, 0.7);
      this.tweens.add({ targets: boom, scale: 2.5, alpha: 0, duration: 500, onComplete: () => boom.destroy() });
      for (let i = 0; i < 20; i++) this.boss.takeDamage();
      this.updateBossHealthUI();
      this.soundGen.play('explosion');
    });

    // Auto-destruir si sale de pantalla
    this.time.delayedCall(4000, () => { if (plasma && plasma.active) plasma.destroy(); });
    this.soundGen.play('shootFire');
  }

  handleBrutusSlam(bossX, bossY) {
    if (this.gameOver || this.gameWon) return;
    // Shockwave visual
    const wave = this.add.circle(bossX, bossY, 20, 0xFF4400, 0.8);
    this.tweens.add({ targets: wave, scaleX: 6, scaleY: 2, alpha: 0, duration: 400, onComplete: () => wave.destroy() });
    this.soundGen.play('explosion');
    // Daño al jugador si está cerca
    if (this.player && this.player.active) {
      const dist = Phaser.Math.Distance.Between(bossX, bossY, this.player.x, this.player.y);
      if (dist < 120) this.damageDolphin(1);
    }
  }

  handleBrutusRage() {
    if (this.gameOver || this.gameWon) return;
    // Cambiar color de barra y label a rojo intenso
    if (this.bossBar) this.bossBar.setFillStyle(0xFF0000);
    if (this.bossNameLabel) {
      this.bossNameLabel.setText('⚠ BRUTUS — FURIA ⚠').setFill('#FF0000');
    }
    // Alerta de rage
    const rageText = this.add.text(400, 280, '¡FURIA!', {
      fontSize: '60px', fill: '#FF0000', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: rageText, alpha: 0, scale: 2.5, duration: 1200, onComplete: () => rageText.destroy() });
    this.soundGen.play('explosion');
  }

  // ── Victoria / Derrota ──

  handleVictory() {
    this.gameWon = true;
    this.physics.pause();
    this.soundGen.play('victory');
    const plates = parseInt(localStorage.getItem('mielito_plates') || '0', 10);
    localStorage.setItem('mielito_plates', String(plates + 150));
    if (this.touchControls) this.touchControls.destroy();
    this.gameOverText.setText('¡BRUTUS DERROTADO!').setFill('#FFD700').setVisible(true);
    const msg = this.isMobileDevice ? 'Toca aquí para jugar de nuevo' : 'R: Jugar de nuevo | M: Menú';
    this.restartText.setText(msg).setVisible(true);
    this.input.keyboard.once('keydown-R', () => this.scene.restart());
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));
    if (this.isMobileDevice) { this.restartText.setInteractive(); this.restartText.once('pointerdown', () => this.scene.restart()); }
  }

  handleGameOver() {
    this.physics.pause();
    this.soundGen.play('gameOver');
    if (this.touchControls) this.touchControls.destroy();
    this.gameOverText.setText('¡APLASTADO!').setFill('#ff0000').setVisible(true);
    const msg = this.isMobileDevice ? 'Toca aquí para reintentar' : 'R: Reintentar | M: Menú';
    this.restartText.setText(msg).setVisible(true);
    this.input.keyboard.once('keydown-R', () => this.scene.restart());
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));
    if (this.isMobileDevice) { this.restartText.setInteractive(); this.restartText.once('pointerdown', () => this.scene.restart()); }
  }

  // ── Update ──

  update() {
    if (this.gameOver || this.gameWon) return;

    let cursors, wasd, spaceBar, xKey;
    if (this.isMobileDevice && this.touchControls) {
      cursors = this.touchControls.getState();
      wasd = this.touchControls.getWasdState();
      spaceBar = this.touchControls.getSpaceState();
      xKey = this.touchControls.getXKeyState();
    } else {
      cursors = this.cursors; wasd = this.wasd; spaceBar = this.spaceBar; xKey = this.xKey;
    }

    this.dolphin.update(cursors, wasd, spaceBar, xKey, this.qKey);

    if (this.boss && this.boss.active) this.boss.update();

    if (this.dragonAuraCircle && this.dragonAuraCircle.active && this.dolphin && this.dolphin.active) {
      this.dragonAuraCircle.setPosition(this.dolphin.x, this.dolphin.y);
    }

    // Limpiar balas fuera de pantalla
    this.bullets.getChildren().forEach(b => {
      if (b.active && (b.x > 850 || b.x < -50 || b.y > 700)) {
        b.setActive(false); b.setVisible(false);
      }
    });
  }

  shutdown() {
    this.events.off('dolphinShoot');
    this.events.off('colombiaAttack');
    this.events.off('colombiaEnergyBall');
    this.events.off('triangleFireball');
    this.events.off('triangleMegaFireball');
    this.events.off('clonShoot');
    this.events.off('perritoMagnet');
    this.events.off('perritoMelee');
    this.events.off('blibluDied');
  }
}
