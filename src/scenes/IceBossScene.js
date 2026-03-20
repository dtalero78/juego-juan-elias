import Phaser from 'phaser';
import Dolphin from '../entities/Dolphin.js';
import ColombiaBall from '../entities/ColombiaBall.js';
import RedTriangle from '../entities/RedTriangle.js';
import Clon from '../entities/Clon.js';
import Perrito from '../entities/Perrito.js';
import Torbellino from '../entities/Torbellino.js';
import Bullet from '../entities/Bullet.js';
import IceBoss from '../entities/IceBoss.js';
import Snowball from '../entities/Snowball.js';
import SoundGenerator from '../utils/SoundGenerator.js';
import TouchControls from '../ui/TouchControls.js';
import { isMobile } from '../config.js';

export default class IceBossScene extends Phaser.Scene {
  constructor() {
    super('IceBossScene');
    this.selectedBullets = ['normal', 'fire'];
    this.selectedCharacter = 'dolphin';
    this.soundGen = null;
    this.touchControls = null;
    this.isMobileDevice = isMobile;
  }

  init(data) {
    if (data && data.selectedBullets) {
      this.selectedBullets = data.selectedBullets;
    }
    if (data && data.selectedCharacter) {
      this.selectedCharacter = data.selectedCharacter;
    }
  }

  create() {
    this.gameOver = false;
    this.gameWon = false;

    // Inicializar generador de sonidos
    this.soundGen = new SoundGenerator(this);
    this.soundGen.init();

    // Crear fondo invernal mejorado
    this.createWinterBackground();

    // Crear efecto de nieve cayendo (mejorado)
    this.createSnowEffect();

    // Suelo de hielo con textura
    this.createIceGround();

    // Plataformas de hielo
    this.platforms = [];
    this.createIcePlatforms();

    // Crear personaje según selección
    if (this.selectedCharacter === 'colombiaBall') {
      this.player = new ColombiaBall(this, 100, 550);
      this.dolphin = this.player; // Para compatibilidad
    } else if (this.selectedCharacter === 'redTriangle') {
      this.player = new RedTriangle(this, 100, 550);
      this.dolphin = this.player;
    } else if (this.selectedCharacter === 'clon') {
      this.player = new Clon(this, 100, 550);
      this.dolphin = this.player;
    } else if (this.selectedCharacter === 'perrito') {
      this.player = new Perrito(this, 100, 550);
      this.dolphin = this.player;
    } else {
      this.player = new Dolphin(this, 100, 550, this.selectedBullets);
      this.dolphin = this.player;
    }

    // Crear Ice Boss
    this.iceBoss = new IceBoss(this, 650, 300);
    this.iceBoss.setTarget(this.dolphin);

    // Dragon del Sol de Oro
    this.dragonSolEquipped = localStorage.getItem('mielito_dragon_sol_equipped') === 'true'
      && this.selectedCharacter === 'colombiaBall';
    this.dragonHits = 0;
    this.dragonWindowStart = 0;
    this.dragonAuraActive = false;
    this.dragonAuraCircle = null;

    // Grupos para proyectiles
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    });

    this.snowballs = this.physics.add.group({
      classType: Snowball,
      runChildUpdate: true
    });

    // Grupo de torbellinos (Clon)
    this.torbellinos = this.physics.add.group({
      classType: Torbellino,
      runChildUpdate: true
    });

    // Bolas magnéticas (Perrito)
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
    ['dolphinShoot','iceBossShoot','iceBossDied','iceBossPhase2','dolphinJump','dolphinDash','dolphinFrenzy',
     'colombiaJump','colombiaDash','colombiaPunch','colombiaSpecial','colombiaAttack','colombiaEnergyBall','colombiaKnifeSlash','colombiaModeChange',
     'triangleJump','triangleDash','triangleShoot','triangleShield','triangleFireball','triangleMegaFireball',
     'clonJump','clonDash','clonShoot','clonMelee','clonModeChange','clonPlasmaShots',
     'perritoJump','perritoDash','perritoMagnet','perritoMelee','perritoModeChange'
    ].forEach(e => this.events.off(e));

    // Mini-enemigos
    this.miniEnemies = [];
    this.minionTimer = null;

    // Eventos
    this.events.on('dolphinShoot', this.createBullet, this);
    this.events.on('iceBossShoot', this.createSnowball, this);
    this.events.on('iceBossDied', this.handleVictory, this);
    this.events.on('iceBossPhase2', this.startPhase2, this);
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

    // Eventos para Colombia Ball
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

    // Eventos para Red Triangle
    this.events.on('triangleJump', () => this.soundGen.play('jump'), this);
    this.events.on('triangleDash', () => this.soundGen.play('dash'), this);
    this.events.on('triangleShoot', () => this.soundGen.play('shootFire'), this);
    this.events.on('triangleShield', () => this.soundGen.play('pickup'), this);
    this.events.on('triangleFireball', this.createBigFireball, this);
    this.events.on('triangleMegaFireball', this.createMegaFireball, this);

    // Eventos para Clon
    this.events.on('clonJump', () => this.soundGen.play('jump'), this);
    this.events.on('clonDash', () => this.soundGen.play('dash'), this);
    this.events.on('clonShoot', (x, y, flipX) => {
      this.createClonPlasma(x, y, flipX);
    }, this);
    this.events.on('clonMelee', this.handleClonMelee, this);
    this.events.on('clonModeChange', (mode) => {
      if (this.ammoText) this.ammoText.setText(mode === 'melee' ? 'ESPACIO: Golpe | Q: cambiar | X: Dash' : `ESPACIO: Plasma Nova (${this.player?.plasmaShots ?? 3}/3) | Q: cambiar | X: Dash`);
    }, this);
    this.events.on('clonPlasmaShots', (shots) => {
      if (this.ammoText) this.ammoText.setText(`ESPACIO: Plasma Nova (${shots}/3) | Q: cambiar | X: Dash`);
    }, this);

    // Eventos para Perrito
    this.events.on('perritoJump', () => this.soundGen.play('jump'), this);
    this.events.on('perritoDash', () => this.soundGen.play('dash'), this);
    this.events.on('perritoMagnet', this.createMagnetBall, this);
    this.events.on('perritoMelee', this.handlePerritoMelee, this);
    this.events.on('perritoModeChange', (mode) => {
      if (this.ammoText) {
        if (mode === 'melee') {
          this.ammoText.setText('ESPACIO: Golpe | Q: cambiar | X: Dash');
          this.ammoText.setFill('#FF8800');
        } else {
          this.ammoText.setText('ESPACIO: Tormenta Magnética (x3) | Q: cambiar | X: Dash');
          this.ammoText.setFill('#FF00FF');
        }
      }
    }, this);

    // Colisiones
    this.physics.add.overlap(this.iceBoss, this.bullets, this.hitIceBoss, null, this);
    this.physics.add.overlap(this.iceBoss, this.torbellinos, this.hitIceBossWithTorbellino, null, this);
    this.physics.add.overlap(this.dolphin, this.snowballs, this.hitDolphinWithSnowball, null, this);
    this.physics.add.overlap(this.dolphin, this.iceBoss, this.hitDolphinWithBoss, null, this);
    this.physics.add.collider(this.dolphin, this.ground);

    // Colisión con plataformas
    this.platforms.forEach(platform => {
      this.physics.add.collider(this.dolphin, platform);
    });

    // Cambiar tipo de bala con Q (o activar escudo para RedTriangle)
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

    // UI
    this.createUI();

    // Controles táctiles
    if (this.isMobileDevice) {
      this.touchControls = new TouchControls(this);
      this.touchControls.create();
    }

    // Powerups
    this.powerups = this.physics.add.group();
    this.physics.add.overlap(this.dolphin, this.powerups, this.collectPowerup, null, this);
    this.physics.add.collider(this.powerups, this.ground);

    // Lluvia de munición
    this.time.addEvent({
      delay: 20000,
      callback: this.spawnAmmoRain,
      callbackScope: this,
      loop: true
    });

    this.time.delayedCall(5000, () => this.spawnAmmoRain());
  }

  // Crear fondo invernal con montañas y cielo
  createWinterBackground() {
    // Imagen de fondo
    const bg = this.add.image(400, 325, 'fondoIceBoss');
    bg.setDisplaySize(800, 650);
    bg.setDepth(0);

    // Montañas de fondo (lejanas - más claras)
    const farMountains = this.add.graphics();
    farMountains.fillStyle(0x90CAF9, 0.6);
    farMountains.beginPath();
    farMountains.moveTo(0, 450);
    farMountains.lineTo(100, 280);
    farMountains.lineTo(200, 380);
    farMountains.lineTo(350, 200);
    farMountains.lineTo(450, 350);
    farMountains.lineTo(550, 180);
    farMountains.lineTo(700, 320);
    farMountains.lineTo(800, 250);
    farMountains.lineTo(800, 450);
    farMountains.closePath();
    farMountains.fill();

    // Montañas cercanas (más oscuras)
    const nearMountains = this.add.graphics();
    nearMountains.fillStyle(0x64B5F6, 0.8);
    nearMountains.beginPath();
    nearMountains.moveTo(0, 500);
    nearMountains.lineTo(80, 380);
    nearMountains.lineTo(180, 450);
    nearMountains.lineTo(280, 320);
    nearMountains.lineTo(400, 420);
    nearMountains.lineTo(500, 300);
    nearMountains.lineTo(620, 400);
    nearMountains.lineTo(750, 350);
    nearMountains.lineTo(800, 400);
    nearMountains.lineTo(800, 500);
    nearMountains.closePath();
    nearMountains.fill();

    // Nieve en las cumbres
    const snowCaps = this.add.graphics();
    snowCaps.fillStyle(0xFFFFFF, 0.9);
    // Cumbre 1
    snowCaps.fillTriangle(350, 200, 320, 240, 380, 240);
    // Cumbre 2
    snowCaps.fillTriangle(550, 180, 520, 220, 580, 220);
    // Cumbre 3
    snowCaps.fillTriangle(280, 320, 250, 355, 310, 355);

    // Luna/sol invernal
    const moon = this.add.circle(700, 80, 40, 0xFFFDE7, 0.8);
    // Brillo alrededor
    const moonGlow = this.add.circle(700, 80, 55, 0xFFFDE7, 0.2);

    // Estrellas titilantes
    this.stars = [];
    for (let i = 0; i < 20; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(30, 200),
        Phaser.Math.Between(1, 2),
        0xFFFFFF,
        Phaser.Math.FloatBetween(0.3, 0.8)
      );
      this.stars.push(star);

      // Animación de titilación
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.2, 0.5),
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1
      });
    }

    // Aurora boreal sutil
    const aurora = this.add.graphics();
    aurora.fillStyle(0x00E676, 0.1);
    aurora.fillRect(0, 50, 800, 100);
    aurora.fillStyle(0x00BCD4, 0.08);
    aurora.fillRect(0, 80, 800, 80);

    this.tweens.add({
      targets: aurora,
      alpha: 0.3,
      duration: 3000,
      yoyo: true,
      repeat: -1
    });
  }

  // Suelo de hielo con textura
  createIceGround() {
    // Base del suelo
    this.ground = this.add.rectangle(400, 635, 800, 30, 0x81D4FA);
    this.physics.add.existing(this.ground, true);

    // Textura de hielo en el suelo
    const groundTexture = this.add.graphics();
    groundTexture.fillStyle(0xB3E5FC, 0.5);
    for (let x = 0; x < 800; x += 40) {
      groundTexture.fillRect(x, 622, 35, 8);
    }
    groundTexture.fillStyle(0xE1F5FE, 0.6);
    for (let x = 20; x < 800; x += 60) {
      groundTexture.fillRect(x, 630, 25, 5);
    }

    // Montículos de nieve en el suelo
    for (let i = 0; i < 5; i++) {
      const x = 80 + i * 160;
      const mound = this.add.ellipse(x, 620, 60, 20, 0xFFFFFF, 0.7);
    }
  }

  createSnowEffect() {
    // Partículas de nieve mejoradas - más cantidad y variedad
    this.snowParticles = [];
    for (let i = 0; i < 60; i++) {
      const size = Phaser.Math.Between(2, 5);
      const snow = this.add.circle(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(-50, 650),
        size,
        0xFFFFFF,
        Phaser.Math.FloatBetween(0.4, 0.9)
      );
      snow.speed = Phaser.Math.Between(20, 100);
      snow.drift = Phaser.Math.FloatBetween(-1, 1);
      snow.wobble = Phaser.Math.FloatBetween(0, Math.PI * 2);
      snow.wobbleSpeed = Phaser.Math.FloatBetween(0.02, 0.05);
      this.snowParticles.push(snow);
    }

    // Copos de nieve grandes ocasionales
    this.bigSnowflakes = [];
    for (let i = 0; i < 8; i++) {
      const flake = this.add.star(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(-100, 650),
        6,
        3,
        6,
        0xFFFFFF,
        0.6
      );
      flake.speed = Phaser.Math.Between(15, 40);
      flake.rotationSpeed = Phaser.Math.FloatBetween(-0.02, 0.02);
      this.bigSnowflakes.push(flake);
    }
  }

  updateSnowEffect() {
    // Actualizar nieve pequeña con movimiento ondulante
    this.snowParticles.forEach(snow => {
      snow.y += snow.speed * 0.016;
      snow.wobble += snow.wobbleSpeed;
      snow.x += snow.drift + Math.sin(snow.wobble) * 0.5;

      if (snow.y > 620) {
        snow.y = -10;
        snow.x = Phaser.Math.Between(0, 800);
      }
      if (snow.x < 0) snow.x = 800;
      if (snow.x > 800) snow.x = 0;
    });

    // Actualizar copos grandes con rotación
    this.bigSnowflakes.forEach(flake => {
      flake.y += flake.speed * 0.016;
      flake.rotation += flake.rotationSpeed;

      if (flake.y > 620) {
        flake.y = -20;
        flake.x = Phaser.Math.Between(0, 800);
      }
    });

    // Actualizar plataformas móviles
    this.updateMovingPlatforms();
  }

  createIcePlatforms() {
    // Plataformas estáticas con diferentes tamaños
    const staticPlatforms = [
      { x: 100, y: 540, width: 120, height: 18 },
      { x: 700, y: 540, width: 120, height: 18 },
      { x: 250, y: 440, width: 100, height: 15 },
      { x: 550, y: 440, width: 100, height: 15 },
      { x: 400, y: 340, width: 150, height: 18 },
      { x: 150, y: 280, width: 80, height: 12 },
      { x: 650, y: 280, width: 80, height: 12 },
      { x: 400, y: 180, width: 120, height: 15 },
    ];

    staticPlatforms.forEach(pos => {
      this.createIcePlatform(pos.x, pos.y, pos.width, pos.height, false);
    });

    // Plataformas móviles
    this.movingPlatforms = [];

    // Plataforma móvil horizontal inferior
    const movingPlatform1 = this.createIcePlatform(300, 500, 90, 14, true);
    movingPlatform1.moveType = 'horizontal';
    movingPlatform1.startX = 200;
    movingPlatform1.endX = 400;
    movingPlatform1.moveSpeed = 80;
    movingPlatform1.direction = 1;
    this.movingPlatforms.push(movingPlatform1);

    // Plataforma móvil horizontal superior
    const movingPlatform2 = this.createIcePlatform(500, 240, 90, 14, true);
    movingPlatform2.moveType = 'horizontal';
    movingPlatform2.startX = 450;
    movingPlatform2.endX = 600;
    movingPlatform2.moveSpeed = 60;
    movingPlatform2.direction = -1;
    this.movingPlatforms.push(movingPlatform2);

    // Plataforma móvil vertical
    const movingPlatform3 = this.createIcePlatform(50, 400, 70, 12, true);
    movingPlatform3.moveType = 'vertical';
    movingPlatform3.startY = 350;
    movingPlatform3.endY = 520;
    movingPlatform3.moveSpeed = 50;
    movingPlatform3.direction = 1;
    this.movingPlatforms.push(movingPlatform3);

    // Plataforma móvil vertical derecha
    const movingPlatform4 = this.createIcePlatform(750, 380, 70, 12, true);
    movingPlatform4.moveType = 'vertical';
    movingPlatform4.startY = 300;
    movingPlatform4.endY = 480;
    movingPlatform4.moveSpeed = 40;
    movingPlatform4.direction = -1;
    this.movingPlatforms.push(movingPlatform4);

    // Decoraciones de hielo
    this.createIceDecorations();
  }

  createIcePlatform(x, y, width, height, isMoving) {
    // Contenedor para la plataforma
    const container = this.add.container(x, y);

    // Plataforma principal - gradiente de hielo
    const platform = this.add.rectangle(0, 0, width, height, 0x81D4FA);
    platform.setStrokeStyle(2, 0x4FC3F7);
    container.add(platform);

    // Brillo superior
    const highlight = this.add.rectangle(0, -height/4, width - 4, height/3, 0xE1F5FE, 0.6);
    container.add(highlight);

    // Carámbanos debajo de la plataforma
    const icicleCount = Math.floor(width / 20);
    for (let i = 0; i < icicleCount; i++) {
      const icicleX = -width/2 + 15 + i * 20;
      const icicleHeight = Phaser.Math.Between(8, 20);
      const icicle = this.add.triangle(
        icicleX, height/2 + icicleHeight/2,
        0, 0,
        6, 0,
        3, icicleHeight,
        0xB3E5FC
      );
      icicle.setAlpha(0.8);
      container.add(icicle);
    }

    // Física
    const physicsRect = this.add.rectangle(x, y, width, height);
    physicsRect.setVisible(false);
    this.physics.add.existing(physicsRect, true);
    this.platforms.push(physicsRect);

    // Indicador de plataforma móvil
    if (isMoving) {
      platform.setFillStyle(0x4DD0E1);
      platform.setStrokeStyle(2, 0x00BCD4);

      // Efecto de brillo para plataformas móviles
      this.tweens.add({
        targets: platform,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      physicsRect.container = container;
    }

    return physicsRect;
  }

  updateMovingPlatforms() {
    this.movingPlatforms.forEach(platform => {
      if (platform.moveType === 'horizontal') {
        platform.x += platform.moveSpeed * platform.direction * 0.016;

        if (platform.x >= platform.endX) {
          platform.direction = -1;
        } else if (platform.x <= platform.startX) {
          platform.direction = 1;
        }

        if (platform.container) {
          platform.container.x = platform.x;
        }
        platform.body.reset(platform.x, platform.y);

      } else if (platform.moveType === 'vertical') {
        platform.y += platform.moveSpeed * platform.direction * 0.016;

        if (platform.y >= platform.endY) {
          platform.direction = -1;
        } else if (platform.y <= platform.startY) {
          platform.direction = 1;
        }

        if (platform.container) {
          platform.container.y = platform.y;
        }
        platform.body.reset(platform.x, platform.y);
      }
    });
  }

  createIceDecorations() {
    // Cristales de hielo grandes en los bordes
    this.createIceCrystal(30, 580, 1);
    this.createIceCrystal(770, 580, -1);
    this.createIceCrystal(200, 600, 0.7);
    this.createIceCrystal(600, 600, 0.7);

    // Estalactitas en la parte superior
    const stalactitePositions = [50, 150, 300, 500, 650, 750];
    stalactitePositions.forEach(x => {
      this.createStalactite(x);
    });

    // Partículas de hielo flotantes (usando polygon para forma de diamante)
    this.iceParticles = [];
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(100, 500);
      // Crear diamante con polygon: arriba, derecha, abajo, izquierda
      const particle = this.add.polygon(x, y, [
        0, -5,   // arriba
        3, 0,    // derecha
        0, 5,    // abajo
        -3, 0    // izquierda
      ], 0xB3E5FC, 0.4);

      this.tweens.add({
        targets: particle,
        y: y - 20,
        alpha: 0.2,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1
      });

      this.iceParticles.push(particle);
    }
  }

  createIceCrystal(x, y, scale) {
    const crystal = this.add.container(x, y);

    // Cristal principal
    const main = this.add.polygon(0, 0, [
      0, -40 * Math.abs(scale),
      15 * scale, -10,
      10 * scale, 30,
      -10 * scale, 30,
      -15 * scale, -10
    ], 0x4FC3F7, 0.7);
    crystal.add(main);

    // Brillo interno
    const shine = this.add.polygon(0, -5, [
      0, -25 * Math.abs(scale),
      8 * scale, -5,
      5 * scale, 15,
      -5 * scale, 15,
      -8 * scale, -5
    ], 0xE1F5FE, 0.5);
    crystal.add(shine);

    // Destello
    const sparkle = this.add.circle(5 * scale, -20 * Math.abs(scale), 3, 0xFFFFFF, 0.8);
    crystal.add(sparkle);

    this.tweens.add({
      targets: sparkle,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  createStalactite(x) {
    const height = Phaser.Math.Between(30, 60);
    const width = Phaser.Math.Between(10, 20);

    const stalactite = this.add.triangle(
      x, height/2,
      0, 0,
      width, 0,
      width/2, height,
      0x81D4FA,
      0.8
    );
    stalactite.setStrokeStyle(1, 0xB3E5FC);

    // Gota de agua ocasional
    if (Phaser.Math.Between(0, 1) === 1) {
      this.time.addEvent({
        delay: Phaser.Math.Between(3000, 8000),
        callback: () => {
          if (this.gameOver || this.gameWon) return;
          const drop = this.add.circle(x, height + 5, 3, 0x4FC3F7, 0.8);
          this.tweens.add({
            targets: drop,
            y: 620,
            alpha: 0,
            duration: 1500,
            onComplete: () => drop.destroy()
          });
        },
        loop: true
      });
    }
  }

  createUI() {
    const fontSize = this.isMobileDevice ? '14px' : '20px';
    const smallFontSize = this.isMobileDevice ? '12px' : '16px';

    // Vida del personaje
    const maxHealth = (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'clon' || this.selectedCharacter === 'perrito') ? 4 : 3;
    const healthColor = this.selectedCharacter === 'redTriangle' ? '#FF0000' : (this.selectedCharacter === 'clon' ? '#00FF00' : '#006400');
    this.dolphinHealthText = this.add.text(10, 10, `Vida: ${maxHealth}/${maxHealth}`, {
      fontSize: fontSize,
      fill: healthColor,
      fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa',
      padding: { x: 5, y: 2 }
    });

    // Munición o Combo según personaje
    if (this.selectedCharacter === 'colombiaBall') {
      this.ammoText = this.add.text(10, 35, 'ESPACIO: Combo → Bola de energía | Q: cambiar | X: Dash', {
        fontSize: smallFontSize,
        fill: '#FF6600',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'redTriangle') {
      this.ammoText = this.add.text(10, 35, 'Fuego: ∞ | Q: Escudo', {
        fontSize: smallFontSize,
        fill: '#FF4500',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'clon') {
      this.ammoText = this.add.text(10, 35, 'ESPACIO: Plasma Nova (3/3) | Q: cambiar | X: Dash', {
        fontSize: smallFontSize,
        fill: '#00AAFF',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'perrito') {
      this.ammoText = this.add.text(10, 35, 'ESPACIO: Tormenta Magnética (x3) | Q: cambiar | X: Dash', {
        fontSize: smallFontSize,
        fill: '#FF00FF',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    } else {
      this.ammoText = this.add.text(10, 35, 'Balas: 20 [Normal]', {
        fontSize: smallFontSize,
        fill: '#FFD700',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    }

    const bossTextX = this.isMobileDevice ? 500 : 580;
    this.healthText = this.add.text(bossTextX, 10, 'Ice Boss: 80', {
      fontSize: smallFontSize,
      fill: '#00BFFF',
      fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa',
      padding: { x: 5, y: 2 }
    });

    if (!this.isMobileDevice) {
      this.add.text(10, 60, 'A/D: Mover | W: Saltar | ESPACIO: Disparar | Q: Cambiar bala | X+WASD: Dash', {
        fontSize: '11px',
        fill: '#333',
        fontFamily: 'Courier New'
      });
    }

    this.gameOverText = this.add.text(400, 300, '', {
      fontSize: this.isMobileDevice ? '32px' : '48px',
      fill: '#ff0000',
      fontFamily: 'Courier New',
      align: 'center'
    });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setVisible(false);

    this.restartText = this.add.text(400, 360, '', {
      fontSize: this.isMobileDevice ? '16px' : '20px',
      fill: '#fff',
      fontFamily: 'Courier New',
      align: 'center'
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setVisible(false);
  }

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
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(500 * dir); b.body.allowGravity = false; b.damage = 5; b.bulletType = 'fire'; b.setScale(1.1);
        this.tweens.add({ targets: b, scale: 1.7, duration: 800, ease: 'Quad.easeIn' });
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
    } else if (bulletType === 'xmas') {
      const b = this.bullets.get(bx, y, 'xmasBullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(400 * dir); b.body.allowGravity = false; b.damage = 7; b.bulletType = 'xmas'; b.isXmas = true; b.setScale(1.3);
        this.tweens.add({ targets: b, rotation: Math.PI * 2, duration: 450, repeat: -1 });
        this.tweens.add({ targets: b, scale: 1.7, duration: 200, yoyo: true, repeat: -1 }); }
    } else {
      const b = this.bullets.get(bx, y, 'bullet');
      if (b) { b.setActive(true); b.setVisible(true); b.body.reset(bx, y); b.setVelocityX(520 * dir); b.body.allowGravity = false; b.damage = 4; b.bulletType = bulletType; }
    }

    this.updateAmmoUI();
  }

  createSnowball(x, y, angle) {
    const snowball = this.snowballs.get(x, y, 'snowball');
    if (snowball) {
      snowball.setActive(true);
      snowball.setVisible(true);
      snowball.body.reset(x, y);
      snowball.setVelocity(Math.cos(angle) * 280, Math.sin(angle) * 280);
      snowball.freezeDuration = 1500;

      // Rotación visual
      this.tweens.add({
        targets: snowball,
        rotation: Math.PI * 4,
        duration: 1000,
        repeat: -1
      });
    }
  }

  hitIceBoss(boss, bullet) {
    if (!bullet.active || !boss.active) return;

    const damage = bullet.damage || 1;
    const bulletType = bullet.bulletType || 'normal';

    this.soundGen.play('hit');

    // Limpiar tweens antes de desactivar
    this.tweens.killTweensOf(bullet);

    bullet.setActive(false);
    bullet.setVisible(false);

    // Daño extra con fuego
    let totalDamage = damage;
    if (bulletType === 'fire') {
      totalDamage += 2; // Bonus de daño con fuego
      this.createFireHitEffect(bullet.x, bullet.y);
    }

    // Explosión navideña
    if (bulletType === 'xmas') {
      this.createXmasExplosion(bullet.x, bullet.y);
    }

    for (let i = 0; i < totalDamage; i++) {
      if (boss.active) boss.takeDamage();
    }

    if (this.healthText && boss.active) {
      this.healthText.setText(`Ice Boss: ${boss.health}`);
    }
  }

  createFireHitEffect(x, y) {
    const fire = this.add.circle(x, y, 30, 0xFF4500, 0.8);
    this.tweens.add({
      targets: fire,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => fire.destroy()
    });
  }

  // Explosión navideña festiva
  createXmasExplosion(x, y) {
    const colors = [0xFF0000, 0x00FF00, 0xFFFFFF, 0xFFD700];
    const particleCount = 20;

    this.soundGen.play('explosion');

    // Partículas festivas
    for (let i = 0; i < particleCount; i++) {
      const color = Phaser.Math.RND.pick(colors);
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = Phaser.Math.Between(20, 60);
      const size = Phaser.Math.Between(4, 10);

      const particle = this.add.circle(x, y, size, color, 1);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0,
        alpha: 0,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // Estrellas doradas
    for (let i = 0; i < 8; i++) {
      const starX = x + Phaser.Math.Between(-40, 40);
      const starY = y + Phaser.Math.Between(-40, 40);
      const star = this.add.star(starX, starY, 5, 3, 8, 0xFFD700, 1);

      this.tweens.add({
        targets: star,
        y: starY + 50,
        rotation: Math.PI * 2,
        alpha: 0,
        duration: 1000,
        ease: 'Power1',
        onComplete: () => star.destroy()
      });
    }

    // Ondas de choque festivas
    const shockwave = this.add.circle(x, y, 10, 0xFF0000, 0.5);
    this.tweens.add({
      targets: shockwave,
      scale: 5,
      alpha: 0,
      duration: 400,
      onComplete: () => shockwave.destroy()
    });

    const shockwave2 = this.add.circle(x, y, 10, 0x00FF00, 0.5);
    this.tweens.add({
      targets: shockwave2,
      scale: 4,
      alpha: 0,
      duration: 500,
      delay: 100,
      onComplete: () => shockwave2.destroy()
    });
  }

  hitDolphinWithSnowball(dolphin, snowball) {
    if (!snowball.active || this.gameOver) return;

    // Escudo del Triángulo Rojo: refleja la bola de nieve
    if (this.selectedCharacter === 'redTriangle' && this.dolphin.shieldActive) {
      snowball.setActive(false);
      snowball.setVisible(false);
      this.tweens.killTweensOf(snowball);
      const cardIndex = this.dolphin.shieldCards.findIndex(c => c.active);
      if (cardIndex >= 0) this.dolphin.blockAttack(cardIndex);
      this.createReflectedFireball();
      this.soundGen.play('hit');
      return;
    }

    snowball.setActive(false);
    snowball.setVisible(false);
    this.tweens.killTweensOf(snowball);

    this.freezeDolphin();
    this.damageDolphin();
  }

  hitDolphinWithBoss(dolphin, boss) {
    if (this.gameOver || !boss.isDashing) return;
    if (dolphin.invulnerable) return;

    this.freezeDolphin();
    this.damageDolphin();
  }

  freezeDolphin() {
    if (this.dolphin.isFrozen) return;

    this.dolphin.isFrozen = true;
    this.dolphin.setTint(0x00BFFF);

    // Guardar velocidades
    const savedSpeed = this.dolphin.speed;
    this.dolphin.speed = 0;

    // Efecto de congelación
    const iceBlock = this.add.rectangle(this.dolphin.x, this.dolphin.y, 50, 50, 0x87CEEB, 0.5);

    // Tiempo de congelación reducido (800ms en vez de 1500ms)
    this.time.delayedCall(800, () => {
      if (this.dolphin && this.dolphin.active) {
        this.dolphin.isFrozen = false;
        this.dolphin.speed = savedSpeed;
        this.dolphin.clearTint();
        iceBlock.destroy();
      }
    });
  }

  damageDolphin() {
    if (this.dolphin.invulnerable) return;

    this.soundGen.play('hurt');
    const health = this.dolphin.takeDamage();
    const maxHealth = (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'clon' || this.selectedCharacter === 'perrito') ? 4 : 3;

    if (this.dolphinHealthText) {
      this.dolphinHealthText.setText(`Vida: ${health}/${maxHealth}`);
      if (health <= 1) {
        this.dolphinHealthText.setFill('#ff0000');
      } else if (health <= 2) {
        this.dolphinHealthText.setFill('#ffff00');
      }
    }

    if (health <= 0) {
      this.gameOver = true;
      this.handleGameOver();
    }
  }

  handleGameOver() {
    this.physics.pause();
    this.soundGen.play('gameOver');

    if (this.touchControls) this.touchControls.destroy();

    this.gameOverText.setText('¡CONGELADO!');
    this.gameOverText.setFill('#00BFFF');
    this.gameOverText.setVisible(true);

    const restartMsg = this.isMobileDevice
      ? 'Toca aquí para reintentar'
      : 'R: Reintentar | M: Menú';
    this.restartText.setText(restartMsg);
    this.restartText.setVisible(true);

    this.input.keyboard.once('keydown-R', () => this.scene.restart());
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));

    if (this.isMobileDevice) {
      this.restartText.setInteractive();
      this.restartText.once('pointerdown', () => this.scene.restart());
    }
  }

  startPhase2() {
    // Texto de alerta
    const alertText = this.add.text(400, 300, '¡FASE 2!', {
      fontSize: '52px', fill: '#00FFFF', stroke: '#003366', strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: alertText, alpha: 0, scale: 2, duration: 1500,
      onComplete: () => alertText.destroy()
    });

    if (this.healthText) this.healthText.setFill('#00FFFF');

    // Spawn de mini-enemigos cada 30 segundos
    this.minionTimer = this.time.addEvent({
      delay: 30000,
      callback: this.spawnMiniEnemies,
      callbackScope: this,
      loop: true
    });
    // Primera oleada inmediata tras 2s
    this.time.delayedCall(2000, () => this.spawnMiniEnemies());
  }

  spawnMiniEnemies() {
    if (this.gameOver || this.gameWon) return;

    for (let i = 0; i < 5; i++) {
      const side = Math.random() < 0.5 ? 0 : 800;
      const y = Phaser.Math.Between(100, 550);
      const enemy = this.physics.add.sprite(side, y, 'miniIceEnemy');
      enemy.setScale(1.2);
      enemy.body.allowGravity = false;
      enemy.health = 1;

      this.miniEnemies.push(enemy);

      // Overlap con balas del jugador
      this.physics.add.overlap(enemy, this.bullets, (e, b) => {
        if (!e.active || !b.active) return;
        b.setActive(false); b.setVisible(false);
        this.tweens.killTweensOf(b);
        const fx = this.add.circle(e.x, e.y, 18, 0x00FFFF, 0.8);
        this.tweens.add({ targets: fx, alpha: 0, scale: 2.5, duration: 250, onComplete: () => fx.destroy() });
        e.setActive(false); e.setVisible(false);
        const idx = this.miniEnemies.indexOf(e); if (idx !== -1) this.miniEnemies.splice(idx, 1);
      });

      // Overlap con torbellinos del Clon
      this.physics.add.overlap(enemy, this.torbellinos, (e, t) => {
        if (!e.active || !t.active) return;
        t.setActive(false); t.setVisible(false); t.body.stop(); this.tweens.killTweensOf(t);
        const fx = this.add.circle(e.x, e.y, 18, 0x00FF00, 0.8);
        this.tweens.add({ targets: fx, alpha: 0, scale: 2.5, duration: 250, onComplete: () => fx.destroy() });
        e.setActive(false); e.setVisible(false);
        const idx = this.miniEnemies.indexOf(e); if (idx !== -1) this.miniEnemies.splice(idx, 1);
      });

      // Overlap con el jugador
      this.physics.add.overlap(this.dolphin, enemy, (player, e) => {
        if (!e.active || player.invulnerable) return;
        e.setActive(false); e.setVisible(false);
        const idx = this.miniEnemies.indexOf(e); if (idx !== -1) this.miniEnemies.splice(idx, 1);
        this.damageDolphin(1);
      });
    }
  }

  handleVictory() {
    this.gameWon = true;
    if (this.minionTimer) { this.minionTimer.remove(); this.minionTimer = null; }
    this.miniEnemies.forEach(e => { if (e.active) { e.setActive(false); e.setVisible(false); } });
    this.miniEnemies = [];
    this.physics.pause();
    this.soundGen.play('victory');

    // +100 placas de metal por ganar
    const plates = parseInt(localStorage.getItem('mielito_plates') || '0', 10);
    localStorage.setItem('mielito_plates', String(plates + 100));

    if (this.touchControls) this.touchControls.destroy();

    this.gameOverText.setFill('#00ff00');
    this.gameOverText.setText('¡VICTORIA!\nDerrotaste al Ice Boss');
    this.gameOverText.setVisible(true);

    const restartMsg = this.isMobileDevice
      ? 'Toca aquí para jugar de nuevo'
      : 'R: Jugar de nuevo | M: Menú';
    this.restartText.setText(restartMsg);
    this.restartText.setVisible(true);

    this.input.keyboard.once('keydown-R', () => this.scene.restart());
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));

    if (this.isMobileDevice) {
      this.restartText.setInteractive();
      this.restartText.once('pointerdown', () => this.scene.restart());
    }
  }

  updateAmmoUI() {
    if (this.selectedCharacter === 'colombiaBall') return; // handled by colombiaModeChange event

    // Clon no tiene munición variable
    if (this.selectedCharacter === 'clon') return;

    const ammo = this.dolphin.ammo;
    const currentType = this.dolphin.bulletType;
    const typeNames = {
      normal: 'Normal',
      fire: 'Fuego',
      ice: 'Hielo',
      triple: 'Triple',
      fast: 'Rápida',
      xmas: 'Navidad'
    };
    const typeColors = {
      normal: '#FFD700',
      fire: '#FF4500',
      ice: '#00BFFF',
      triple: '#00FF00',
      fast: '#9400D3',
      xmas: '#FF0000'
    };

    const currentAmmo = ammo[currentType] || 0;
    this.ammoText.setText(`Balas: ${currentAmmo} [${typeNames[currentType] || currentType}]`);
    this.ammoText.setFill(typeColors[currentType] || '#FFD700');
  }

  spawnAmmoRain() {
    if (this.gameOver || this.gameWon) return;

    const allAmmoTypes = {
      normal: { type: 'normal', texture: 'ammoNormal', amount: 10 },
      fire: { type: 'fire', texture: 'ammoFire', amount: 8 }, // Más fuego contra el jefe de hielo
      ice: { type: 'ice', texture: 'ammoIce', amount: 3 },
      triple: { type: 'triple', texture: 'ammoTriple', amount: 3 },
      fast: { type: 'fast', texture: 'ammoFast', amount: 5 },
      xmas: { type: 'xmas', texture: 'ammoXmas', amount: 4 } // Navidad también es fuerte contra hielo
    };

    const ammoTypes = this.selectedBullets.map(type => allAmmoTypes[type]).filter(t => t);

    for (let i = 0; i < 15; i++) {
      const randomType = Phaser.Math.RND.pick(ammoTypes);
      if (!randomType) continue;

      const x = Phaser.Math.Between(50, 750);

      this.time.delayedCall(i * 100, () => {
        if (this.gameOver || this.gameWon) return;

        const powerup = this.powerups.create(x, -20, randomType.texture);
        powerup.ammoType = randomType.type;
        powerup.ammoAmount = randomType.amount;
        powerup.setVelocityY(150);
        powerup.setBounce(0.3);

        this.time.delayedCall(10000, () => {
          if (powerup.active) powerup.destroy();
        });
      });
    }
  }

  collectPowerup(dolphin, powerup) {
    if (!powerup.active) return;

    // Colombia Ball, RedTriangle y Clon no usan munición, los powerups les dan vida
    if (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'redTriangle' || this.selectedCharacter === 'clon') {
      if (dolphin.health < dolphin.maxHealth) {
        dolphin.health++;
        this.soundGen.play('pickup');
        const maxHealth = dolphin.maxHealth;
        const healthColor = this.selectedCharacter === 'redTriangle' ? '#FF0000' : '#006400';
        this.dolphinHealthText.setText(`Vida: ${dolphin.health}/${maxHealth}`);
        this.dolphinHealthText.setFill(healthColor);

        // Efecto visual de curación
        const healText = this.add.text(powerup.x, powerup.y, '+1 ❤️', {
          fontSize: '16px',
          fill: '#00FF00',
          fontFamily: 'Courier New'
        });
        healText.setOrigin(0.5);

        this.tweens.add({
          targets: healText,
          y: powerup.y - 50,
          alpha: 0,
          duration: 1000,
          onComplete: () => healText.destroy()
        });
      }
      powerup.destroy();
      return;
    }

    this.soundGen.play('pickup');
    dolphin.addAmmo(powerup.ammoType, powerup.ammoAmount);
    this.updateAmmoUI();

    const text = this.add.text(powerup.x, powerup.y, `+${powerup.ammoAmount} ${powerup.ammoType}`, {
      fontSize: '14px',
      fill: '#00FF00',
      fontFamily: 'Courier New'
    });
    text.setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: powerup.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });

    powerup.destroy();
  }

  // Manejar ataque cuerpo a cuerpo de Colombia Ball
  handleColombiaAttack(x, y, comboCount, flipX) {
    if (!this.iceBoss || !this.iceBoss.active) return;

    // Calcular posición del ataque
    const attackX = flipX ? x - 40 : x + 40;
    const attackY = y;

    // Verificar distancia al boss
    const distance = Phaser.Math.Distance.Between(attackX, attackY, this.iceBoss.x, this.iceBoss.y);

    if (distance < 80) { // Rango de ataque melee
      if (this.dragonSolEquipped) this.checkDragonHit();
      if (this.dragonAuraActive) {
        this.applyDragonAttack(this.iceBoss);
      } else {
        const damage = comboCount;
        for (let i = 0; i < damage; i++) {
          if (this.iceBoss.active) this.iceBoss.takeDamage();
        }
      }

      // Efecto visual de golpe
      const hitColor = this.dragonAuraActive ? 0xFFD700 : 0xFFFFFF;
      const hitEffect = this.add.circle(this.iceBoss.x, this.iceBoss.y, 20, hitColor, 0.8);
      this.tweens.add({
        targets: hitEffect,
        scale: 2, alpha: 0,
        duration: 150,
        onComplete: () => hitEffect.destroy()
      });

      // Actualizar UI
      if (this.healthText && this.iceBoss.active) {
        this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
      }
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
    this.dragonAuraCircle = this.add.circle(this.dolphin.x, this.dolphin.y, 48, 0xFFD700, 0.3).setDepth(4);
    this.tweens.add({ targets: this.dragonAuraCircle, scale: 1.3, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
    const txt = this.add.text(400, 265, 'AURA DEL DRAGON SOL', {
      fontSize: '22px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#FF6600', strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: txt, alpha: 0, y: 215, duration: 2500, onComplete: () => txt.destroy() });
    this.soundGen.play('shootFire');
  }

  applyDragonAttack(boss) {
    for (let i = 0; i < 5; i++) { if (boss.active) boss.takeDamage(); }
    const pushDir = (this.dolphin.x < boss.x) ? 1 : -1;
    boss.x += pushDir * 30;
    boss.stunnedUntil = this.time.now + 500;
  }

  // Crear torbellino de Clon
  createMagnetBall(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;

    const color = (this.dolphin && this.dolphin.magnetColor) ? this.dolphin.magnetColor : 0xFF00FF;
    const dir = flipX ? -1 : 1;
    const startX = x + dir * 30;

    const magnet = this.physics.add.image(startX, y, 'magnetBall');
    magnet.setScale(1.4);
    magnet.body.allowGravity = false;
    magnet.setVelocityX(280 * dir);
    if (color !== 0xFF00FF) magnet.setTint(color);

    this.tweens.add({
      targets: magnet,
      scale: 1.9,
      duration: 350,
      yoyo: true,
      repeat: -1
    });

    const entry = { sprite: magnet, createTime: this.time.now };
    this.magnetBalls.push(entry);

    this.time.delayedCall(500, () => {
      if (!magnet.active) return;
      magnet.setVelocity(0, 0);
      magnet.body.allowGravity = false;
      const ring = this.add.circle(magnet.x, magnet.y, 150, color, 0.08);
      this.tweens.add({
        targets: ring,
        alpha: 0,
        duration: 3500,
        onComplete: () => ring.destroy()
      });
    });

    this.time.delayedCall(4000, () => {
      if (!magnet.active) return;

      if (this.iceBoss && this.iceBoss.active) {
        const dist = Phaser.Math.Distance.Between(magnet.x, magnet.y, this.iceBoss.x, this.iceBoss.y);
        if (dist < 100) {
          for (let i = 0; i < 5; i++) {
            if (this.iceBoss.active) this.iceBoss.takeDamage();
          }
          if (this.healthText && this.iceBoss.active) {
            this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
          }
        }
      }

      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const p = this.add.circle(
          magnet.x + Math.cos(angle) * 8,
          magnet.y + Math.sin(angle) * 8,
          Phaser.Math.Between(5, 13),
          color
        );
        this.tweens.add({
          targets: p,
          x: magnet.x + Math.cos(angle) * 90,
          y: magnet.y + Math.sin(angle) * 90,
          alpha: 0,
          duration: 600,
          ease: 'Cubic.easeOut',
          onComplete: () => p.destroy()
        });
      }

      const idx = this.magnetBalls.indexOf(entry);
      if (idx !== -1) this.magnetBalls.splice(idx, 1);
      magnet.destroy();
      this.soundGen.play('explosion');
    });

    this.soundGen.play('pickup');
  }

  updateMagnetBalls() {
    if (!this.magnetBalls || this.magnetBalls.length === 0) return;

    this.magnetBalls.forEach(m => {
      if (!m.sprite || !m.sprite.active) return;
      if (this.time.now - m.createTime < 500) return;

      // Atraer bolas de nieve del Ice Boss
      this.snowballs.getChildren().forEach(snowball => {
        if (!snowball.active) return;
        const dist = Phaser.Math.Distance.Between(snowball.x, snowball.y, m.sprite.x, m.sprite.y);
        if (dist < 120) {
          if (dist < 16) {
            snowball.setActive(false);
            snowball.setVisible(false);
            if (snowball.body) snowball.body.stop();
          } else {
            const angle = Phaser.Math.Angle.Between(snowball.x, snowball.y, m.sprite.x, m.sprite.y);
            snowball.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
          }
        }
      });
    });
  }

  handlePerritoMelee(hitX, hitY, perrito) {
    if (this.gameOver || this.gameWon) return;
    this.soundGen.play('hit');

    if (this.iceBoss && this.iceBoss.active) {
      const dist = Phaser.Math.Distance.Between(hitX, hitY, this.iceBoss.x, this.iceBoss.y);
      if (dist < 90) {
        this.iceBoss.takeDamage();
        if (this.healthText && this.iceBoss.active) {
          this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
        }
        const impact = this.add.circle(this.iceBoss.x, this.iceBoss.y, 25, perrito.magnetColor, 0.7);
        this.tweens.add({ targets: impact, alpha: 0, scale: 2, duration: 300, onComplete: () => impact.destroy() });
      }
    }
  }

  createClonPlasma(x, y, flipX) {
    if (this.gameOver || this.gameWon) return;
    const dir = flipX ? -1 : 1;
    const plasma = this.physics.add.image(x + dir * 30, y, 'clonPlasma');
    plasma.setScale(1.8); plasma.body.allowGravity = false;
    plasma.setVelocityX(dir * 200);
    this.tweens.add({ targets: plasma, scale: 2.2, duration: 300, yoyo: true, repeat: -1 });
    this.physics.add.overlap(this.iceBoss, plasma, () => {
      if (!plasma.active || !this.iceBoss.active) return;
      this.tweens.killTweensOf(plasma); plasma.destroy();
      const boom = this.add.circle(this.iceBoss.x, this.iceBoss.y, 60, 0x0088FF, 0.7);
      this.tweens.add({ targets: boom, scale: 2.5, alpha: 0, duration: 500, onComplete: () => boom.destroy() });
      for (let i = 0; i < 20; i++) { if (this.iceBoss.active) this.iceBoss.takeDamage(); }
      if (this.healthText) this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
      this.soundGen.play('explosion');
    });
    this.time.delayedCall(4000, () => { if (plasma && plasma.active) plasma.destroy(); });
    this.soundGen.play('shootFire');
  }

  handleClonMelee(hitX, hitY) {
    if (this.gameOver || this.gameWon) return;
    this.soundGen.play('hit');
    if (this.iceBoss && this.iceBoss.active) {
      const dist = Phaser.Math.Distance.Between(hitX, hitY, this.iceBoss.x, this.iceBoss.y);
      if (dist < 90) {
        this.iceBoss.takeDamage();
        if (this.healthText) this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
        const impact = this.add.circle(this.iceBoss.x, this.iceBoss.y, 30, 0x00FF00, 0.7);
        this.tweens.add({ targets: impact, alpha: 0, scale: 2, duration: 300, onComplete: () => impact.destroy() });
      }
    }
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

  // Torbellino golpea al Ice Boss
  hitIceBossWithTorbellino(boss, torbellino) {
    if (!torbellino.active || !boss.active) return;

    torbellino.setActive(false);
    torbellino.setVisible(false);
    torbellino.body.stop();
    this.tweens.killTweensOf(torbellino);

    this.soundGen.play('hit');

    // El torbellino hace 10 de daño
    for (let i = 0; i < 10; i++) {
      if (boss.active) boss.takeDamage();
    }

    if (this.healthText && boss.active) {
      this.healthText.setText(`Ice Boss: ${boss.health}`);
    }
  }

  // Crear bola de fuego grande de Red Triangle
  // Fireball reflejada por el escudo del Triángulo
  createReflectedFireball() {
    if (!this.iceBoss || !this.iceBoss.active || !this.dolphin) return;
    const dir = this.iceBoss.x > this.dolphin.x ? 1 : -1;
    const bullet = this.bullets.get(this.dolphin.x, this.dolphin.y, 'bigFireball');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.reset(this.dolphin.x, this.dolphin.y);
      bullet.setVelocityX(550 * dir);
      bullet.body.allowGravity = false;
      bullet.damage = 12;
      bullet.bulletType = 'bigFireball';
      bullet.setScale(1.2);
      bullet.setTint(0xFFFF00);
      this.time.delayedCall(200, () => { if (bullet.active) bullet.clearTint(); });
    }
  }

  createBigFireball(x, y, flipX) {
    if (!this.iceBoss || !this.iceBoss.active) return;

    const bullet = this.bullets.get(x, y, 'bigFireball');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.reset(x, y);

      const direction = flipX ? -1 : 1;
      bullet.setVelocityX(380 * direction);
      bullet.body.allowGravity = false;
      bullet.damage = 10; // Muy efectivo contra hielo
      bullet.bulletType = 'bigFireball';
      bullet.setScale(1.5);

      this.soundGen.play('shootFire');

      // Efecto de brillo de fuego
      this.tweens.add({
        targets: bullet,
        alpha: 0.7,
        scaleX: 1.7,
        scaleY: 1.3,
        duration: 150,
        yoyo: true,
        repeat: -1
      });

      // Trail de fuego
      const trail = this.time.addEvent({
        delay: 40,
        callback: () => {
          if (!bullet.active) {
            trail.remove();
            return;
          }
          const trailParticle = this.add.circle(bullet.x, bullet.y, 12, 0xFF4500, 0.6);
          this.tweens.add({
            targets: trailParticle,
            scale: 0,
            alpha: 0,
            y: bullet.y + Phaser.Math.Between(-10, 10),
            duration: 250,
            onComplete: () => trailParticle.destroy()
          });
        },
        loop: true
      });
    }
  }

  createMegaFireball(x, y, flipX) {
    if (!this.iceBoss || !this.iceBoss.active) return;
    const bullet = this.bullets.get(x, y, 'bigFireball');
    if (!bullet) return;
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.reset(x, y);
    const direction = flipX ? -1 : 1;
    bullet.setVelocityX(700 * direction);
    bullet.body.allowGravity = false;
    bullet.damage = 24;
    bullet.bulletType = 'bigFireball';
    bullet.setScale(2.2);
    bullet.setTint(0xFFFFAA);
    this.tweens.add({ targets: bullet, scale: 2.7, duration: 100, yoyo: true, repeat: -1 });
    const trail = this.time.addEvent({
      delay: 25,
      callback: () => {
        if (!bullet.active) { trail.remove(); return; }
        const p = this.add.circle(bullet.x, bullet.y, Phaser.Math.Between(8, 18), Phaser.Math.RND.pick([0xFF2200, 0xFF6600, 0xFFFF00]), 0.8);
        this.tweens.add({ targets: p, scale: 0, alpha: 0, duration: 250, onComplete: () => p.destroy() });
      },
      loop: true
    });
    this.time.delayedCall(3500, () => { if (bullet.active) { bullet.setActive(false); bullet.setVisible(false); } });
  }

  // Crear bola de energía de Colombia Ball
  handleColombiaEnergyBall(energySphere, character) {
    // Configurar colisión entre la bola de energía y el Ice Boss
    this.physics.add.overlap(energySphere, this.iceBoss, () => {
      if (!this.iceBoss.active || !energySphere.active) return;

      const damage = 5;

      // Sonido de golpe
      this.soundGen.play('hit');

      // Aplicar daño al Ice Boss
      for (let i = 0; i < damage; i++) {
        if (this.iceBoss.active) this.iceBoss.takeDamage();
      }

      // Efecto visual en el punto de impacto
      const impactEffect = this.add.circle(this.iceBoss.x, this.iceBoss.y, 40, 0x9400D3, 0.8);
      this.tweens.add({
        targets: impactEffect,
        scale: 2.5,
        alpha: 0,
        duration: 400,
        onComplete: () => impactEffect.destroy()
      });

      // Knock back del Ice Boss
      const knockbackDir = this.iceBoss.x > energySphere.x ? 1 : -1;
      if (this.iceBoss.body) {
        this.iceBoss.body.setVelocityX(knockbackDir * 150);
      }

      // Destruir la bola con efecto de explosión
      energySphere.body.enable = false;
      this.tweens.add({
        targets: energySphere,
        scale: 2,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          if (energySphere.active) energySphere.destroy();
        }
      });
    });
  }

  createEnergyBall(x, y, flipX) {
    // Este método ya no se usa para Colombia Ball
    // Se mantiene por compatibilidad pero no crea balas
  }

  createColombiaKnife(x, y, velX, velY, angle, chargeLevel = 0, knifeScale = 1.6) {
    if (this.gameOver || this.gameWon || !this.iceBoss || !this.iceBoss.active) return;

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

    this.physics.add.overlap(knife, this.iceBoss, () => {
      if (!this.iceBoss.active || !knife.active) return;
      const bx = this.iceBoss.x, by = this.iceBoss.y;
      knife.destroy();
      this.soundGen.play('hit');

      if (isSuperCharge) {
        // Explosión de área de fuego
        this.cameras.main.shake(300, 0.018);
        const boom = this.add.circle(bx, by, 10, 0xFFFF00, 1);
        this.tweens.add({ targets: boom, scale: 14, alpha: 0, duration: 600, onComplete: () => boom.destroy() });
        const fire = this.add.circle(bx, by, 5, 0xFF4400, 0.9);
        this.tweens.add({ targets: fire, scale: 12, alpha: 0, duration: 800, onComplete: () => fire.destroy() });
        for (let i = 0; i < 12; i++) {
          const spark = this.add.circle(bx + Phaser.Math.Between(-80,80), by + Phaser.Math.Between(-80,80), Phaser.Math.Between(6,16), 0xFF6600, 0.9);
          this.tweens.add({ targets: spark, scale: 0, alpha: 0, duration: Phaser.Math.Between(400,700), onComplete: () => spark.destroy() });
        }
        for (let i = 0; i < 15; i++) {
          if (this.iceBoss.active) this.iceBoss.takeDamage();
        }
        if (this.healthText && this.iceBoss.active) this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
      } else {
        this.iceBoss.takeDamage();
        if (this.healthText && this.iceBoss.active) this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
        const burn = this.add.circle(bx, by, 25, 0xFF4400, 0.85);
        this.tweens.add({ targets: burn, scale: 2.5, alpha: 0, duration: 350, onComplete: () => burn.destroy() });
        for (let i = 1; i <= burnTicks; i++) {
          this.time.delayedCall(i * 500, () => {
            if (this.iceBoss && this.iceBoss.active) {
              this.iceBoss.takeDamage();
              if (this.healthText && this.iceBoss.active) this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
              const dot = this.add.circle(this.iceBoss.x, this.iceBoss.y, 12, 0xFF6600, 0.7);
              this.tweens.add({ targets: dot, scale: 2, alpha: 0, duration: 250, onComplete: () => dot.destroy() });
            }
          });
        }
      }
    });

    this.time.delayedCall(2000, () => { if (knife.active) knife.destroy(); });
  }

  update() {
    if (!this.gameOver && !this.gameWon) {
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

      // No permitir movimiento si está congelado
      if (!this.dolphin.isFrozen) {
        this.dolphin.update(cursors, wasd, spaceBar, xKey, this.qKey);
      }

      if (this.iceBoss && this.iceBoss.active) {
        this.iceBoss.update();
      }

      if (this.dragonAuraCircle && this.dragonAuraCircle.active && this.dolphin && this.dolphin.active) {
        this.dragonAuraCircle.setPosition(this.dolphin.x, this.dolphin.y);
      }

      // Mover mini-enemigos hacia el jugador
      if (this.miniEnemies && this.dolphin && this.dolphin.active) {
        this.miniEnemies.forEach(e => {
          if (!e.active) return;
          const dx = this.dolphin.x - e.x;
          const dy = this.dolphin.y - e.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) { e.setVelocity((dx / len) * 120, (dy / len) * 120); }
        });
      }

      // Actualizar nieve
      this.updateSnowEffect();

      // Actualizar bolas magnéticas de Perrito
      this.updateMagnetBalls();

      // Limpiar snowballs fuera de pantalla
      this.snowballs.getChildren().forEach(snowball => {
        if (snowball.active && (snowball.x < -50 || snowball.x > 850 || snowball.y > 700)) {
          snowball.setActive(false);
          snowball.setVisible(false);
        }
      });
    }
  }

  shutdown() {
    this.events.off('dolphinShoot');
    this.events.off('iceBossShoot');
    this.events.off('iceBossDied');
  }
}
