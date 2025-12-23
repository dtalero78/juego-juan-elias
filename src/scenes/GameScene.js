import Phaser from 'phaser';
import Dolphin from '../entities/Dolphin.js';
import Bullet from '../entities/Bullet.js';
import Octopus from '../entities/Octopus.js';
import OctopusBullet from '../entities/OctopusBullet.js';
import Platform from '../entities/Platform.js';
import SoundGenerator from '../utils/SoundGenerator.js';
import TouchControls from '../ui/TouchControls.js';
import { isMobile } from '../config.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.selectedBullets = ['normal', 'fire']; // Default
    this.soundGen = null;
    this.touchControls = null;
    this.isMobileDevice = isMobile;
  }

  init(data) {
    // Recibir las balas seleccionadas del menú
    if (data && data.selectedBullets) {
      this.selectedBullets = data.selectedBullets;
    }
  }

  create() {
    this.gameOver = false;
    this.gameWon = false;

    // Inicializar generador de sonidos
    this.soundGen = new SoundGenerator(this);
    this.soundGen.init();

    // Fondo
    this.cameras.main.setBackgroundColor('#87CEEB'); // Cielo azul

    // Crear plataformas
    this.platforms = [];
    this.createPlatforms();

    // Crear delfín (empieza arriba del suelo)
    this.dolphin = new Dolphin(this, 100, 550, this.selectedBullets);

    // Crear villano (a la derecha, más grande e imponente)
    this.octopus = new Octopus(this, 700, 300);

    // Grupos para proyectiles
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    });

    this.octopusBullets = this.physics.add.group({
      classType: OctopusBullet,
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

    // Eventos
    this.events.on('dolphinShoot', this.createBullet, this);
    this.events.on('octopusShoot', this.createOctopusBullet, this);
    this.events.on('octopusDied', this.handleVictory, this);
    this.events.on('dolphinJump', () => this.soundGen.play('jump'), this);
    this.events.on('dolphinDash', () => this.soundGen.play('dash'), this);

    // Colisiones
    this.physics.add.overlap(
      this.octopus,
      this.bullets,
      this.hitOctopus,
      null,
      this
    );

    this.physics.add.overlap(
      this.dolphin,
      this.octopusBullets,
      this.hitDolphin,
      null,
      this
    );

    // Colisión con plataformas
    this.platforms.forEach(platform => {
      this.physics.add.collider(this.dolphin, platform);
    });

    // Suelo - posicionado correctamente para que el delfín no se hunda
    // El rectángulo se dibuja desde su centro, así que 640 + 20/2 = 650 (borde inferior)
    this.ground = this.add.rectangle(400, 640, 800, 20, 0x228B22);
    this.physics.add.existing(this.ground, true); // true = estático
    this.physics.add.collider(this.dolphin, this.ground);

    // UI
    this.createUI();

    // Tecla Q para cambiar tipo de bala
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.qKey.on('down', () => {
      if (!this.gameOver && !this.gameWon) {
        this.dolphin.nextBulletType();
        this.updateAmmoUI();
      }
    });

    // Crear controles táctiles si es dispositivo móvil
    if (this.isMobileDevice) {
      this.touchControls = new TouchControls(this);
      this.touchControls.create();
    }

    // Grupo para powerups
    this.powerups = this.physics.add.group();

    // Colisión con powerups
    this.physics.add.overlap(
      this.dolphin,
      this.powerups,
      this.collectPowerup,
      null,
      this
    );

    // Colisión de powerups con el suelo
    this.physics.add.collider(this.powerups, this.ground);

    // Timer para lluvia de munición cada 20 segundos
    this.ammoRainTimer = this.time.addEvent({
      delay: 20000,
      callback: this.spawnAmmoRain,
      callbackScope: this,
      loop: true
    });

    // Primera lluvia al inicio
    this.time.delayedCall(5000, () => {
      this.spawnAmmoRain();
    });
  }

  createPlatforms() {
    // Plataformas móviles - posiciones ajustadas para ser alcanzables
    // El suelo está en Y=640, el delfín salta ~120px
    const platformPositions = [
      { x: 150, y: 540 },  // Muy cerca del suelo, fácil de alcanzar
      { x: 350, y: 460 },  // Segunda altura
      { x: 550, y: 380 },  // Tercera altura
      { x: 250, y: 300 },  // Cuarta altura
      { x: 450, y: 220 },  // Quinta altura (más alta)
    ];

    platformPositions.forEach(pos => {
      const platform = new Platform(this, pos.x, pos.y);
      this.platforms.push(platform);
    });
  }

  createUI() {
    // Tamaños adaptados para móvil
    const fontSize = this.isMobileDevice ? '14px' : '20px';
    const smallFontSize = this.isMobileDevice ? '12px' : '16px';

    // Vida del delfín
    this.dolphinHealthText = this.add.text(10, 10, 'Vida: 3/3', {
      fontSize: fontSize,
      fill: '#006400',
      fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa',
      padding: { x: 5, y: 2 }
    });

    // Munición
    this.ammoText = this.add.text(10, 35, 'Balas: 20 [Normal]', {
      fontSize: smallFontSize,
      fill: '#FFD700',
      fontFamily: 'Courier New',
      backgroundColor: '#000000aa',
      padding: { x: 5, y: 2 }
    });

    // Vida del pulpo - ajustar posición para móvil
    const villainTextX = this.isMobileDevice ? 500 : 580;
    this.healthText = this.add.text(villainTextX, 10, 'Villano: 100', {
      fontSize: smallFontSize,
      fill: '#8B0000',
      fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa',
      padding: { x: 5, y: 2 }
    });

    // Instrucciones solo en desktop
    if (!this.isMobileDevice) {
      this.instructionsText = this.add.text(10, 60, 'A/D: Mover | W: Saltar | ESPACIO: Disparar | Q: Cambiar bala | X: Dash', {
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
    if (!this.gameOver && !this.gameWon) {
      // Sonido según tipo de bala
      if (bulletType === 'fire') {
        this.soundGen.play('shootFire');
      } else if (bulletType === 'ice') {
        this.soundGen.play('shootIce');
      } else {
        this.soundGen.play('shoot');
      }

      // Configuración según tipo de bala (normal es más fuerte)
      const bulletConfig = {
        normal: { texture: 'bullet', speed: 400, damage: 3 },
        fire: { texture: 'fireBullet', speed: 450, damage: 2 },
        ice: { texture: 'iceBullet', speed: 350, damage: 1, slow: true },
        triple: { texture: 'tripleBullet', speed: 400, damage: 1, count: 3 },
        fast: { texture: 'fastBullet', speed: 800, damage: 1 }
      };

      const config = bulletConfig[bulletType] || bulletConfig.normal;

      if (config.count === 3) {
        // Disparo triple
        [-30, 0, 30].forEach(angle => {
          const bullet = this.bullets.get(x, y, config.texture);
          if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.reset(x, y);
            bullet.damage = config.damage;
            bullet.bulletType = bulletType;
            const rad = Phaser.Math.DegToRad(angle);
            bullet.setVelocity(
              Math.cos(rad) * config.speed,
              Math.sin(rad) * config.speed
            );
          }
        });
      } else {
        const bullet = this.bullets.get(x, y, config.texture);
        if (bullet) {
          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.body.reset(x, y);
          bullet.setVelocityX(config.speed);
          bullet.damage = config.damage;
          bullet.bulletType = bulletType;
          bullet.slowEffect = config.slow || false;
        }
      }

      // Actualizar UI de munición
      this.updateAmmoUI();
    }
  }

  createOctopusBullet(x, y, attackType = 'normal', angle = 0) {
    if (!this.gameOver && !this.gameWon) {
      const bullet = this.octopusBullets.get(x, y, 'octopusBullet');
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.reset(x, y);
        bullet.attackType = attackType;

        switch (attackType) {
          case 'spread':
            // Disparo en abanico con ángulo
            const rad = Phaser.Math.DegToRad(angle);
            bullet.setVelocity(-250 * Math.cos(rad * 0.3), 250 * Math.sin(rad * 0.1));
            bullet.setScale(0.8);
            break;

          case 'rapid':
            // Disparo rápido y pequeño
            bullet.setVelocityX(-350);
            bullet.setScale(0.7);
            bullet.setTint(0xFF00FF); // Púrpura para identificar
            break;

          case 'homing':
            // Bala teledirigida que sigue al delfín por 3 segundos
            bullet.setScale(1.2);
            bullet.setTint(0xFF0000); // Roja para identificar
            bullet.isHoming = true;
            bullet.homingSpeed = 180;
            bullet.homingStartTime = this.time.now; // Guardar tiempo de inicio
            bullet.homingDuration = 3000; // 3 segundos de seguimiento
            bullet.setVelocityX(-150);
            break;

          case 'bomb':
            // Bomba que se dispara más lejos y cae
            bullet.setScale(1.5);
            bullet.setTint(0x000000); // Negra
            bullet.isBomb = true;
            bullet.setVelocity(-300, -100); // Más velocidad horizontal y sube primero
            bullet.body.allowGravity = true;
            bullet.body.setGravityY(400); // Más gravedad para arco
            break;

          default: // 'normal'
            bullet.setVelocityX(-250);
            bullet.setScale(1);
            bullet.clearTint();
            break;
        }
      }
    }
  }

  // Actualizar balas especiales del villano
  updateOctopusBullets() {
    this.octopusBullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;

      // Balas teledirigidas (homing) - solo por 3 segundos
      if (bullet.isHoming && this.dolphin && this.dolphin.active) {
        const elapsed = this.time.now - bullet.homingStartTime;

        if (elapsed < bullet.homingDuration) {
          // Sigue persiguiendo
          const angle = Phaser.Math.Angle.Between(
            bullet.x, bullet.y,
            this.dolphin.x, this.dolphin.y
          );
          bullet.setVelocity(
            Math.cos(angle) * bullet.homingSpeed,
            Math.sin(angle) * bullet.homingSpeed
          );
        } else {
          // Ya no persigue, sigue en línea recta
          bullet.isHoming = false;
          bullet.clearTint();
          bullet.setTint(0x666666); // Gris para indicar que ya no sigue
        }
      }

      // Bombas que explotan al tocar el suelo o después de cierto tiempo
      if (bullet.isBomb && bullet.y > 600) {
        this.createBombExplosion(bullet.x, bullet.y);
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.allowGravity = false;
      }

      // Destruir balas que salen de la pantalla
      if (bullet.x < -50 || bullet.x > 850 || bullet.y > 700 || bullet.y < -50) {
        bullet.setActive(false);
        bullet.setVisible(false);
        if (bullet.body) bullet.body.allowGravity = false;
      }
    });
  }

  // Crear explosión de bomba
  createBombExplosion(x, y) {
    // Sonido de explosión
    this.soundGen.play('explosion');

    // Visual de explosión
    const explosion = this.add.circle(x, y, 60, 0xFF4500, 0.7);

    // Verificar si el delfín está en el área de explosión
    if (this.dolphin && this.dolphin.active) {
      const distance = Phaser.Math.Distance.Between(x, y, this.dolphin.x, this.dolphin.y);
      if (distance < 80) {
        this.hitDolphin();
      }
    }

    // Efecto visual
    this.tweens.add({
      targets: explosion,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    });

    // Onda de choque visual
    const shockwave = this.add.circle(x, y, 20, 0xFFFF00, 0.5);
    this.tweens.add({
      targets: shockwave,
      scale: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => shockwave.destroy()
    });
  }

  hitOctopus(octopus, bullet) {
    if (!bullet.active) return;
    if (!octopus.active) return;

    const damage = bullet.damage || 1;
    const bulletType = bullet.bulletType || 'normal';

    // Sonido de golpe
    this.soundGen.play('hit');

    // Desactivar la bala
    bullet.setActive(false);
    bullet.setVisible(false);
    if (bullet.body) {
      bullet.body.stop();
    }

    // Aplicar daño al villano
    for (let i = 0; i < damage; i++) {
      if (octopus.active) octopus.takeDamage();
    }

    // Efecto de CONGELACIÓN (bala de hielo) - 2 segundos inmóvil
    if (bulletType === 'ice' && octopus.active) {
      const originalSpeed = octopus.moveSpeed;
      octopus.moveSpeed = 0; // Completamente congelado
      octopus.setTint(0x00FFFF);

      // Detener disparos del villano
      if (octopus.shootTimer) {
        octopus.shootTimer.paused = true;
      }

      this.time.delayedCall(2000, () => {
        if (octopus.active) {
          octopus.moveSpeed = originalSpeed;
          octopus.clearTint();
          if (octopus.shootTimer) {
            octopus.shootTimer.paused = false;
          }
        }
      });
    }

    // Efecto de FUEGO - crear área de daño por 2 segundos
    if (bulletType === 'fire' && octopus.active) {
      this.createFireArea(bullet.x, bullet.y);
    }

    // Actualizar UI
    if (this.healthText && octopus.active) {
      this.healthText.setText(`Vida Villano: ${octopus.health}/100`);
    }
  }

  // Crear área de fuego que hace daño por 2 segundos
  createFireArea(x, y) {
    // Crear visual del área de fuego
    const fireArea = this.add.circle(x, y, 40, 0xFF4500, 0.5);
    this.physics.add.existing(fireArea, true);

    // Daño periódico cada 500ms durante 2 segundos
    let damageCount = 0;
    const maxDamage = 4; // 4 ticks de daño en 2 segundos

    const damageTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        if (this.octopus && this.octopus.active) {
          // Verificar si el villano está en el área
          const distance = Phaser.Math.Distance.Between(
            fireArea.x, fireArea.y,
            this.octopus.x, this.octopus.y
          );

          if (distance < 80) { // Radio de daño
            this.octopus.takeDamage();
            this.octopus.setTint(0xFF4500);
            this.time.delayedCall(100, () => {
              if (this.octopus.active) this.octopus.clearTint();
            });

            // Actualizar UI
            if (this.healthText && this.octopus.active) {
              this.healthText.setText(`Vida Villano: ${this.octopus.health}/100`);
            }
          }
        }

        damageCount++;
        if (damageCount >= maxDamage) {
          damageTimer.remove();
          fireArea.destroy();
        }
      },
      loop: true
    });

    // Efecto visual de parpadeo
    this.tweens.add({
      targets: fireArea,
      alpha: 0.2,
      duration: 200,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (fireArea.active) fireArea.destroy();
      }
    });
  }

  hitDolphin() {
    if (!this.gameOver && this.dolphin) {
      // Sonido de daño
      this.soundGen.play('hurt');

      const health = this.dolphin.takeDamage();

      // Actualizar UI
      if (this.dolphinHealthText) {
        this.dolphinHealthText.setText(`Vida: ${health}/3`);

        // Cambiar color según la vida
        if (health <= 1) {
          this.dolphinHealthText.setFill('#ff0000');
        } else if (health <= 2) {
          this.dolphinHealthText.setFill('#ffff00');
        }
      }

      // Si la vida llega a 0, game over
      if (health <= 0) {
        this.gameOver = true;
        this.handleGameOver();
      }
    }
  }

  handleGameOver() {
    this.physics.pause();
    this.soundGen.play('gameOver');

    // Ocultar controles táctiles
    if (this.touchControls) {
      this.touchControls.destroy();
    }

    this.gameOverText.setText('MORISTE');
    this.gameOverText.setVisible(true);

    const restartMsg = this.isMobileDevice
      ? 'Toca aquí para reintentar'
      : 'Presiona R para reintentar\nPresiona M para volver al menú';
    this.restartText.setText(restartMsg);
    this.restartText.setVisible(true);

    // Controles de teclado
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });

    this.input.keyboard.once('keydown-M', () => {
      this.scene.start('MenuScene');
    });

    // Control táctil para reiniciar
    if (this.isMobileDevice) {
      this.restartText.setInteractive();
      this.restartText.once('pointerdown', () => {
        this.scene.restart();
      });
    }
  }

  handleVictory() {
    this.gameWon = true;
    this.physics.pause();
    this.soundGen.play('victory');

    // Ocultar controles táctiles
    if (this.touchControls) {
      this.touchControls.destroy();
    }

    this.gameOverText.setFill('#00ff00');
    this.gameOverText.setText('¡VICTORIA!\nMielito escapó');
    this.gameOverText.setVisible(true);

    const restartMsg = this.isMobileDevice
      ? 'Toca aquí para jugar de nuevo'
      : 'Presiona R para jugar de nuevo\nPresiona M para volver al menú';
    this.restartText.setText(restartMsg);
    this.restartText.setVisible(true);

    // Controles de teclado
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });

    this.input.keyboard.once('keydown-M', () => {
      this.scene.start('MenuScene');
    });

    // Control táctil para reiniciar
    if (this.isMobileDevice) {
      this.restartText.setInteractive();
      this.restartText.once('pointerdown', () => {
        this.scene.restart();
      });
    }
  }

  // Lluvia de munición (solo los tipos seleccionados)
  spawnAmmoRain() {
    if (this.gameOver || this.gameWon) return;

    const allAmmoTypes = {
      normal: { type: 'normal', texture: 'ammoNormal', amount: 10 },
      fire: { type: 'fire', texture: 'ammoFire', amount: 5 },
      ice: { type: 'ice', texture: 'ammoIce', amount: 5 },
      triple: { type: 'triple', texture: 'ammoTriple', amount: 3 },
      fast: { type: 'fast', texture: 'ammoFast', amount: 5 }
    };

    // Solo usar los tipos seleccionados
    const ammoTypes = this.selectedBullets.map(type => allAmmoTypes[type]);

    // Generar 20 powerups en total
    for (let i = 0; i < 20; i++) {
      const randomType = Phaser.Math.RND.pick(ammoTypes);
      const x = Phaser.Math.Between(50, 750);

      this.time.delayedCall(i * 100, () => {
        if (this.gameOver || this.gameWon) return;

        const powerup = this.powerups.create(x, -20, randomType.texture);
        powerup.ammoType = randomType.type;
        powerup.ammoAmount = randomType.amount;
        powerup.setVelocityY(150);
        powerup.setBounce(0.3);

        // Destruir después de 10 segundos si no se recoge
        this.time.delayedCall(10000, () => {
          if (powerup.active) {
            powerup.destroy();
          }
        });
      });
    }
  }

  // Recolectar powerup
  collectPowerup(dolphin, powerup) {
    if (!powerup.active) return;

    // Sonido de recoger
    this.soundGen.play('pickup');

    dolphin.addAmmo(powerup.ammoType, powerup.ammoAmount);
    this.updateAmmoUI();

    // Efecto visual
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

  // Actualizar UI de munición
  updateAmmoUI() {
    const ammo = this.dolphin.ammo;
    const currentType = this.dolphin.bulletType;
    const typeNames = {
      normal: 'Normal',
      fire: 'Fuego',
      ice: 'Hielo',
      triple: 'Triple',
      fast: 'Rápida'
    };
    const typeColors = {
      normal: '#FFD700',
      fire: '#FF4500',
      ice: '#00BFFF',
      triple: '#00FF00',
      fast: '#9400D3'
    };

    const currentAmmo = ammo[currentType];
    this.ammoText.setText(`Balas: ${currentAmmo} [${typeNames[currentType]}]`);
    this.ammoText.setFill(typeColors[currentType]);
  }

  update() {
    if (!this.gameOver && !this.gameWon) {
      // Usar controles táctiles o de teclado según el dispositivo
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

      this.dolphin.update(cursors, wasd, spaceBar, xKey);
      if (this.octopus && this.octopus.active) {
        this.octopus.update();
      }
      // Actualizar plataformas móviles
      this.platforms.forEach(platform => {
        platform.update();
      });
      // Actualizar balas especiales del villano (homing, bombs)
      this.updateOctopusBullets();
    }
  }

  shutdown() {
    // Limpiar eventos
    this.events.off('dolphinShoot');
    this.events.off('octopusShoot');
    this.events.off('octopusDied');

    // Limpiar timers del pulpo
    if (this.octopus) {
      if (this.octopus.shootTimer) {
        this.octopus.shootTimer.remove();
      }
    }
  }
}
