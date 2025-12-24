import Phaser from 'phaser';
import Dolphin from '../entities/Dolphin.js';
import ColombiaBall from '../entities/ColombiaBall.js';
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

    // Fondo de hielo
    this.cameras.main.setBackgroundColor('#B0E0E6');

    // Crear efecto de nieve cayendo
    this.createSnowEffect();

    // Suelo de hielo
    this.ground = this.add.rectangle(400, 640, 800, 20, 0xADD8E6);
    this.physics.add.existing(this.ground, true);

    // Plataformas de hielo
    this.platforms = [];
    this.createIcePlatforms();

    // Crear personaje según selección
    if (this.selectedCharacter === 'colombiaBall') {
      this.player = new ColombiaBall(this, 100, 550);
      this.dolphin = this.player; // Para compatibilidad
    } else {
      this.player = new Dolphin(this, 100, 550, this.selectedBullets);
      this.dolphin = this.player;
    }

    // Crear Ice Boss
    this.iceBoss = new IceBoss(this, 650, 300);
    this.iceBoss.setTarget(this.dolphin);

    // Grupos para proyectiles
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    });

    this.snowballs = this.physics.add.group({
      classType: Snowball,
      runChildUpdate: true
    });

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

    // Eventos
    this.events.on('dolphinShoot', this.createBullet, this);
    this.events.on('iceBossShoot', this.createSnowball, this);
    this.events.on('iceBossDied', this.handleVictory, this);
    this.events.on('dolphinJump', () => this.soundGen.play('jump'), this);
    this.events.on('dolphinDash', () => this.soundGen.play('dash'), this);

    // Eventos para Colombia Ball
    this.events.on('colombiaJump', () => this.soundGen.play('jump'), this);
    this.events.on('colombiaDash', () => this.soundGen.play('dash'), this);
    this.events.on('colombiaPunch', () => this.soundGen.play('hit'), this);
    this.events.on('colombiaSpecial', () => this.soundGen.play('shootFire'), this);
    this.events.on('colombiaAttack', this.handleColombiaAttack, this);
    this.events.on('colombiaEnergyBall', this.createEnergyBall, this);

    // Colisiones
    this.physics.add.overlap(this.iceBoss, this.bullets, this.hitIceBoss, null, this);
    this.physics.add.overlap(this.dolphin, this.snowballs, this.hitDolphinWithSnowball, null, this);
    this.physics.add.overlap(this.dolphin, this.iceBoss, this.hitDolphinWithBoss, null, this);
    this.physics.add.collider(this.dolphin, this.ground);

    // Colisión con plataformas
    this.platforms.forEach(platform => {
      this.physics.add.collider(this.dolphin, platform);
    });

    // Cambiar tipo de bala con Q
    this.qKey.on('down', () => {
      if (!this.gameOver && !this.gameWon) {
        this.dolphin.nextBulletType();
        this.updateAmmoUI();
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

  createSnowEffect() {
    // Partículas de nieve simples
    this.snowParticles = [];
    for (let i = 0; i < 30; i++) {
      const snow = this.add.circle(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(-50, 650),
        Phaser.Math.Between(2, 4),
        0xFFFFFF,
        0.7
      );
      snow.speed = Phaser.Math.Between(30, 80);
      snow.drift = Phaser.Math.FloatBetween(-0.5, 0.5);
      this.snowParticles.push(snow);
    }
  }

  updateSnowEffect() {
    this.snowParticles.forEach(snow => {
      snow.y += snow.speed * 0.016;
      snow.x += snow.drift;

      if (snow.y > 650) {
        snow.y = -10;
        snow.x = Phaser.Math.Between(0, 800);
      }
      if (snow.x < 0) snow.x = 800;
      if (snow.x > 800) snow.x = 0;
    });
  }

  createIcePlatforms() {
    const positions = [
      { x: 150, y: 520 },
      { x: 400, y: 420 },
      { x: 650, y: 520 },
      { x: 280, y: 320 },
      { x: 520, y: 220 },
    ];

    positions.forEach(pos => {
      const platform = this.add.rectangle(pos.x, pos.y, 100, 15, 0x87CEEB);
      this.physics.add.existing(platform, true);
      this.platforms.push(platform);
    });
  }

  createUI() {
    const fontSize = this.isMobileDevice ? '14px' : '20px';
    const smallFontSize = this.isMobileDevice ? '12px' : '16px';

    // Vida del personaje
    const maxHealth = this.selectedCharacter === 'colombiaBall' ? 4 : 3;
    this.dolphinHealthText = this.add.text(10, 10, `Vida: ${maxHealth}/${maxHealth}`, {
      fontSize: fontSize,
      fill: '#006400',
      fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa',
      padding: { x: 5, y: 2 }
    });

    // Munición o Combo según personaje
    if (this.selectedCharacter === 'colombiaBall') {
      this.ammoText = this.add.text(10, 35, 'Combo: 0/3 → Bola de energía', {
        fontSize: smallFontSize,
        fill: '#9400D3',
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

  createBullet(x, y, bulletType) {
    if (this.gameOver || this.gameWon) return;

    // Sonido
    if (bulletType === 'fire') {
      this.soundGen.play('shootFire');
    } else if (bulletType === 'ice') {
      this.soundGen.play('shootIce');
    } else {
      this.soundGen.play('shoot');
    }

    const bulletConfig = {
      normal: { speed: 400, damage: 3 },
      fire: { speed: 450, damage: 4 }, // Fuego hace más daño al jefe de hielo
      ice: { speed: 350, damage: 1 },
      triple: { speed: 400, damage: 1, count: 3 },
      fast: { speed: 800, damage: 1 },
      xmas: { speed: 380, damage: 6, isXmas: true } // Navidad también hace más daño al hielo
    };

    const config = bulletConfig[bulletType] || bulletConfig.normal;

    if (config.count === 3) {
      [-30, 0, 30].forEach(angle => {
        const bullet = this.bullets.get(x, y, 'bullet');
        if (bullet) {
          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.body.reset(x, y);
          bullet.damage = config.damage;
          bullet.bulletType = bulletType;
          const rad = Phaser.Math.DegToRad(angle);
          bullet.setVelocity(Math.cos(rad) * config.speed, Math.sin(rad) * config.speed);
        }
      });
    } else if (config.isXmas) {
      // Bala navideña con rotación festiva
      const bullet = this.bullets.get(x, y, 'xmasBullet');
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.reset(x, y);
        bullet.setVelocityX(config.speed);
        bullet.damage = config.damage;
        bullet.bulletType = bulletType;
        bullet.isXmas = true;

        // Rotación festiva
        this.tweens.add({
          targets: bullet,
          rotation: Math.PI * 2,
          duration: 500,
          repeat: -1
        });
      }
    } else {
      const bullet = this.bullets.get(x, y, 'bullet');
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.reset(x, y);
        bullet.setVelocityX(config.speed);
        bullet.damage = config.damage;
        bullet.bulletType = bulletType;
      }
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

    this.time.delayedCall(1500, () => {
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
    const maxHealth = this.selectedCharacter === 'colombiaBall' ? 4 : 3;

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

  handleVictory() {
    this.gameWon = true;
    this.physics.pause();
    this.soundGen.play('victory');

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
    // Si es Colombia Ball, mostrar combo en lugar de munición
    if (this.selectedCharacter === 'colombiaBall') {
      const comboCount = this.player.comboCount || 0;
      this.ammoText.setText(`Combo: ${comboCount}/3 → Bola de energía`);
      return;
    }

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

    // Colombia Ball no usa munición, los powerups le dan vida
    if (this.selectedCharacter === 'colombiaBall') {
      if (dolphin.health < dolphin.maxHealth) {
        dolphin.health++;
        this.soundGen.play('pickup');
        const maxHealth = dolphin.maxHealth;
        this.dolphinHealthText.setText(`Vida: ${dolphin.health}/${maxHealth}`);
        this.dolphinHealthText.setFill('#006400');

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
      // Daño según el combo
      const damage = comboCount;
      for (let i = 0; i < damage; i++) {
        if (this.iceBoss.active) this.iceBoss.takeDamage();
      }

      // Efecto visual de golpe
      const hitEffect = this.add.circle(this.iceBoss.x, this.iceBoss.y, 20, 0xFFFFFF, 0.8);
      this.tweens.add({
        targets: hitEffect,
        scale: 2,
        alpha: 0,
        duration: 150,
        onComplete: () => hitEffect.destroy()
      });

      // Actualizar UI
      if (this.healthText && this.iceBoss.active) {
        this.healthText.setText(`Ice Boss: ${this.iceBoss.health}`);
      }
    }
  }

  // Crear bola de energía de Colombia Ball
  createEnergyBall(x, y, flipX) {
    if (!this.iceBoss || !this.iceBoss.active) return;

    const bullet = this.bullets.get(x, y, 'energyBall');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.reset(x, y);

      const direction = flipX ? -1 : 1;
      bullet.setVelocityX(500 * direction);
      bullet.damage = 5;
      bullet.bulletType = 'energyBall';
      bullet.setScale(1.2);

      // Efecto de brillo púrpura
      this.tweens.add({
        targets: bullet,
        alpha: 0.6,
        duration: 100,
        yoyo: true,
        repeat: -1
      });

      // Trail de energía
      const trail = this.time.addEvent({
        delay: 50,
        callback: () => {
          if (!bullet.active) {
            trail.remove();
            return;
          }
          const trailParticle = this.add.circle(bullet.x, bullet.y, 8, 0x9400D3, 0.5);
          this.tweens.add({
            targets: trailParticle,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => trailParticle.destroy()
          });
        },
        loop: true
      });
    }
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
        this.dolphin.update(cursors, wasd, spaceBar, xKey);
      }

      if (this.iceBoss && this.iceBoss.active) {
        this.iceBoss.update();
      }

      // Actualizar nieve
      this.updateSnowEffect();

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
