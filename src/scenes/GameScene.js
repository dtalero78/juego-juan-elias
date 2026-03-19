import Phaser from 'phaser';
import Dolphin from '../entities/Dolphin.js';
import ColombiaBall from '../entities/ColombiaBall.js';
import RedTriangle from '../entities/RedTriangle.js';
import Clon from '../entities/Clon.js';
import Perrito from '../entities/Perrito.js';
import Torbellino from '../entities/Torbellino.js';
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
    this.selectedCharacter = 'dolphin'; // Default
    this.soundGen = null;
    this.touchControls = null;
    this.isMobileDevice = isMobile;
  }

  init(data) {
    // Recibir las balas seleccionadas del menú
    if (data && data.selectedBullets) {
      this.selectedBullets = data.selectedBullets;
    }
    // Recibir el personaje seleccionado
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

    // Fondo
    this.cameras.main.setBackgroundColor('#87CEEB'); // Cielo azul

    // Crear plataformas
    this.platforms = [];
    this.createPlatforms();

    // Crear personaje según selección
    if (this.selectedCharacter === 'colombiaBall') {
      this.player = new ColombiaBall(this, 100, 550);
      this.dolphin = this.player; // Para compatibilidad con código existente
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

    // Crear villano (a la derecha, más grande e imponente)
    this.octopus = new Octopus(this, 700, 300);

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

    this.octopusBullets = this.physics.add.group({
      classType: OctopusBullet,
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

    // Limpiar solo los eventos del juego para evitar acumulación al reiniciar
    ['dolphinShoot','octopusShoot','octopusDied','dolphinJump','dolphinDash',
     'colombiaJump','colombiaDash','colombiaPunch','colombiaSpecial','colombiaAttack','colombiaEnergyBall',
     'triangleJump','triangleDash','triangleShoot','triangleShield','triangleFireball',
     'clonJump','clonDash','clonShoot','clonMelee','clonModeChange',
     'perritoJump','perritoDash','perritoMagnet','perritoMelee','perritoModeChange'
    ].forEach(e => this.events.off(e));

    // Eventos
    this.events.on('dolphinShoot', this.createBullet, this);
    this.events.on('octopusShoot', this.createOctopusBullet, this);
    this.events.on('octopusDied', this.handleVictory, this);
    this.events.on('dolphinJump', () => this.soundGen.play('jump'), this);
    this.events.on('dolphinDash', () => this.soundGen.play('dash'), this);

    // Eventos para Colombia Ball
    this.events.on('colombiaJump', () => this.soundGen.play('jump'), this);
    this.events.on('colombiaDash', () => this.soundGen.play('dash'), this);
    this.events.on('colombiaPunch', () => this.soundGen.play('hit'), this);
    this.events.on('colombiaSpecial', () => this.soundGen.play('shootFire'), this);
    this.events.on('colombiaAttack', this.handleColombiaAttack, this);
    this.events.on('colombiaEnergyBall', this.handleColombiaEnergyBall, this);

    // Eventos para Red Triangle
    this.events.on('triangleJump', () => this.soundGen.play('jump'), this);
    this.events.on('triangleDash', () => this.soundGen.play('dash'), this);
    this.events.on('triangleShoot', () => this.soundGen.play('shootFire'), this);
    this.events.on('triangleShield', () => this.soundGen.play('pickup'), this);
    this.events.on('triangleFireball', this.createBigFireball, this);

    // Eventos para Clon
    this.events.on('clonJump', () => this.soundGen.play('jump'), this);
    this.events.on('clonDash', () => this.soundGen.play('dash'), this);
    this.events.on('clonShoot', (x, y, flipX) => {
      this.createTorbellino(x, y, flipX);
    }, this);
    this.events.on('clonMelee', this.handleClonMelee, this);
    this.events.on('clonModeChange', (mode) => {
      if (this.ammoText) this.ammoText.setText(mode === 'melee' ? 'ESPACIO: Golpe | Q: cambiar | X: Dash' : 'ESPACIO: Torbellino | Q: cambiar | X: Dash');
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
          this.ammoText.setText('ESPACIO: Bola Magnética | Q: cambiar | X: Dash');
          this.ammoText.setFill('#FF00FF');
        }
      }
    }, this);

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

    // Torbellinos golpean al pulpo
    this.physics.add.overlap(
      this.octopus,
      this.torbellinos,
      this.hitOctopusWithTorbellino,
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

    // Tecla Q para cambiar tipo de bala o activar escudo
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.qKey.on('down', () => {
      if (!this.gameOver && !this.gameWon) {
        if (this.selectedCharacter === 'redTriangle') {
          // Activar escudo de tarjetas
          this.dolphin.activateShield();
        } else if (this.selectedCharacter !== 'colombiaBall' && this.selectedCharacter !== 'clon' && this.selectedCharacter !== 'perrito') {
          // perrito maneja Q internamente en su update()
          this.dolphin.nextBulletType();
          this.updateAmmoUI();
        }
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

    // Vida del personaje
    let maxHealth = 3;
    if (this.selectedCharacter === 'colombiaBall') maxHealth = 4;
    else if (this.selectedCharacter === 'redTriangle') maxHealth = 3;
    else if (this.selectedCharacter === 'clon') maxHealth = 4;
    else if (this.selectedCharacter === 'perrito') maxHealth = 4;

    this.dolphinHealthText = this.add.text(10, 10, `Vida: ${maxHealth}/${maxHealth}`, {
      fontSize: fontSize,
      fill: '#006400',
      fontFamily: 'Courier New',
      backgroundColor: '#ffffffaa',
      padding: { x: 5, y: 2 }
    });

    // Munición o info según personaje
    if (this.selectedCharacter === 'colombiaBall') {
      this.ammoText = this.add.text(10, 35, 'Combo: 0/3 → Bola de energía', {
        fontSize: smallFontSize,
        fill: '#9400D3',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'redTriangle') {
      this.ammoText = this.add.text(10, 35, 'Bola de fuego + Escudo (Q)', {
        fontSize: smallFontSize,
        fill: '#FF4500',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'clon') {
      this.ammoText = this.add.text(10, 35, 'Torbellino: ∞ | X: Dash', {
        fontSize: smallFontSize,
        fill: '#00FF00',
        fontFamily: 'Courier New',
        backgroundColor: '#000000aa',
        padding: { x: 5, y: 2 }
      });
    } else if (this.selectedCharacter === 'perrito') {
      this.ammoText = this.add.text(10, 35, 'ESPACIO: Bola Magnética | Q: cambiar | X: Dash', {
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
      this.instructionsText = this.add.text(10, 60, 'A/D: Mover | W: Saltar | ESPACIO: Disparar | Q: Cambiar bala | X+WASD: Dash direccional', {
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
        fast: { texture: 'fastBullet', speed: 800, damage: 1 },
        teleport: { texture: 'teleportBullet', speed: 350, damage: 0, isTeleport: true },
        xmas: { texture: 'xmasBullet', speed: 380, damage: 5, isXmas: true }
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
      } else if (config.isTeleport) {
        // Bala de teletransporte - viaja en arco
        const bullet = this.bullets.get(x, y, config.texture);
        if (bullet) {
          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.body.reset(x, y);
          bullet.setVelocity(config.speed, -200); // Arco hacia arriba
          bullet.damage = config.damage;
          bullet.bulletType = bulletType;
          bullet.isTeleport = true;
          bullet.body.allowGravity = true;
          bullet.body.setGravityY(300);
          bullet.setScale(1.2);

          // Efecto de brillo
          this.tweens.add({
            targets: bullet,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: -1
          });
        }
      } else if (config.isXmas) {
        // Bala navideña - esfera que explota con colores festivos
        const bullet = this.bullets.get(x, y, config.texture);
        if (bullet) {
          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.body.reset(x, y);
          bullet.setVelocityX(config.speed);
          bullet.damage = config.damage;
          bullet.bulletType = bulletType;
          bullet.isXmas = true;
          bullet.setScale(1.0);

          // Rotación festiva
          this.tweens.add({
            targets: bullet,
            rotation: Math.PI * 2,
            duration: 500,
            repeat: -1
          });
        }
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

    // Efecto de TELETRANSPORTE - teletransportar al delfín a la posición del impacto
    if (bulletType === 'teleport') {
      // Limpiar el tween de parpadeo
      this.tweens.killTweensOf(bullet);
      bullet.body.allowGravity = false;
      // Teletransportar cerca del villano pero no encima
      this.teleportDolphin(bullet.x - 80, bullet.y);
      // Causar 2 de daño adicional por el impacto directo
      if (octopus.active) {
        octopus.takeDamage();
        octopus.takeDamage();
      }
    }

    // Efecto de NAVIDAD - explosión festiva con colores rojo, verde y blanco
    if (bulletType === 'xmas') {
      this.tweens.killTweensOf(bullet);
      this.createXmasExplosion(bullet.x, bullet.y);
    }

    // Actualizar UI
    if (this.healthText && octopus.active) {
      this.healthText.setText(`Villano: ${octopus.health}`);
    }
  }

  // Crear explosión navideña con colores festivos
  createXmasExplosion(x, y) {
    const colors = [0xFF0000, 0x00FF00, 0xFFFFFF, 0xFFD700]; // Rojo, verde, blanco, dorado
    const particleCount = 20;

    // Sonido de explosión
    this.soundGen.play('explosion');

    // Crear partículas festivas
    for (let i = 0; i < particleCount; i++) {
      const color = Phaser.Math.RND.pick(colors);
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = Phaser.Math.Between(20, 60);
      const size = Phaser.Math.Between(4, 10);

      const particle = this.add.circle(x, y, size, color, 1);

      // Animar partícula hacia afuera
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

    // Crear estrellas que caen
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

    // Círculo de onda de choque festivo
    const shockwave = this.add.circle(x, y, 10, 0xFF0000, 0.5);
    this.tweens.add({
      targets: shockwave,
      scale: 5,
      alpha: 0,
      duration: 400,
      onComplete: () => shockwave.destroy()
    });

    // Segunda onda verde
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

  hitDolphin(player, bullet) {
    if (!this.gameOver && this.dolphin) {
      // Escudo del Triángulo Rojo: refleja el proyectil
      if (this.selectedCharacter === 'redTriangle' && this.dolphin.shieldActive) {
        if (bullet) {
          bullet.setActive(false);
          bullet.setVisible(false);
          if (bullet.body) bullet.body.allowGravity = false;
        }
        const cardIndex = this.dolphin.shieldCards.findIndex(c => c.active);
        if (cardIndex >= 0) this.dolphin.blockAttack(cardIndex);
        this.createReflectedFireball();
        this.soundGen.play('hit');
        return;
      }

      // Sonido de daño
      this.soundGen.play('hurt');

      const health = this.dolphin.takeDamage();
      const maxHealth = (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'clon') ? 4 : 3;

      // Actualizar UI
      if (this.dolphinHealthText) {
        this.dolphinHealthText.setText(`Vida: ${health}/${maxHealth}`);

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

    // +100 placas de metal por ganar
    const plates = parseInt(localStorage.getItem('mielito_plates') || '0', 10);
    localStorage.setItem('mielito_plates', String(plates + 100));

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
      fast: { type: 'fast', texture: 'ammoFast', amount: 5 },
      teleport: { type: 'teleport', texture: 'ammoTeleport', amount: 3 },
      xmas: { type: 'xmas', texture: 'ammoXmas', amount: 4 }
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

    // Colombia Ball, Red Triangle y Clon no usan munición, los powerups le dan vida
    if (this.selectedCharacter === 'colombiaBall' || this.selectedCharacter === 'redTriangle' || this.selectedCharacter === 'clon') {
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

  // Actualizar UI de munición o combo
  updateAmmoUI() {
    // Si es Colombia Ball, mostrar combo en lugar de munición
    if (this.selectedCharacter === 'colombiaBall') {
      const comboCount = this.player.comboCount || 0;
      this.ammoText.setText(`Combo: ${comboCount}/3 → Bola de energía`);
      return;
    }

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
      teleport: 'Teleport',
      xmas: 'Navidad'
    };
    const typeColors = {
      normal: '#FFD700',
      fire: '#FF4500',
      ice: '#00BFFF',
      triple: '#00FF00',
      fast: '#9400D3',
      teleport: '#00FFFF',
      xmas: '#FF0000'
    };

    const currentAmmo = ammo[currentType];
    this.ammoText.setText(`Balas: ${currentAmmo} [${typeNames[currentType]}]`);
    this.ammoText.setFill(typeColors[currentType]);
  }

  // Teletransportar al delfín a la posición de la bala
  teleportDolphin(x, y) {
    if (!this.dolphin || !this.dolphin.active) return;

    // Guardar posición original para efecto
    const originalX = this.dolphin.x;
    const originalY = this.dolphin.y;

    // Efecto de desaparición en posición original
    const disappearEffect = this.add.circle(originalX, originalY, 30, 0x00FFFF, 0.8);
    this.tweens.add({
      targets: disappearEffect,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => disappearEffect.destroy()
    });

    // Limitar Y para no teletransportarse debajo del suelo
    const safeY = Math.min(y, 580);
    // Limitar X para no salirse de la pantalla
    const safeX = Phaser.Math.Clamp(x, 50, 750);

    // Teletransportar
    this.dolphin.setPosition(safeX, safeY);
    this.dolphin.setVelocity(0, 0);
    this.dolphin.isInAir = true;

    // Efecto de aparición en nueva posición
    const appearEffect = this.add.circle(safeX, safeY, 5, 0xFF00FF, 1);
    this.tweens.add({
      targets: appearEffect,
      scale: 6,
      alpha: 0,
      duration: 300,
      onComplete: () => appearEffect.destroy()
    });

    // Sonido de teletransporte (reusar dash)
    this.soundGen.play('dash');

    // Breve invulnerabilidad después de teletransporte
    this.dolphin.invulnerable = true;
    this.dolphin.setTint(0x00FFFF);
    this.time.delayedCall(500, () => {
      if (this.dolphin && this.dolphin.active) {
        this.dolphin.invulnerable = false;
        this.dolphin.clearTint();
      }
    });
  }

  // Actualizar balas de teletransporte
  updateTeleportBullets() {
    this.bullets.getChildren().forEach(bullet => {
      if (!bullet.active || !bullet.isTeleport) return;

      // Si la bala toca el suelo (Y > 600), teletransportar
      if (bullet.y > 600) {
        this.teleportDolphin(bullet.x, 580);
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.allowGravity = false;
        this.tweens.killTweensOf(bullet);
      }

      // Si la bala sale de la pantalla por la derecha, teletransportar
      if (bullet.x > 780) {
        this.teleportDolphin(750, bullet.y);
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.allowGravity = false;
        this.tweens.killTweensOf(bullet);
      }

      // Si la bala sale por arriba, destruirla sin teletransporte
      if (bullet.y < -50) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.allowGravity = false;
        this.tweens.killTweensOf(bullet);
      }
    });
  }

  // Manejar ataque cuerpo a cuerpo de Colombia Ball
  handleColombiaAttack(x, y, comboCount, flipX) {
    if (!this.octopus || !this.octopus.active) return;

    // Calcular posición del ataque
    const attackX = flipX ? x - 40 : x + 40;
    const attackY = y;

    // Verificar distancia al boss
    const distance = Phaser.Math.Distance.Between(attackX, attackY, this.octopus.x, this.octopus.y);

    if (distance < 80) { // Rango de ataque melee
      if (this.dragonSolEquipped) this.checkDragonHit();
      if (this.dragonAuraActive) {
        this.applyDragonAttack(this.octopus);
      } else {
        const damage = comboCount;
        for (let i = 0; i < damage; i++) {
          if (this.octopus.active) this.octopus.takeDamage();
        }
      }

      // Efecto visual de golpe
      const hitColor = this.dragonAuraActive ? 0xFFD700 : 0xFFFFFF;
      const hitEffect = this.add.circle(this.octopus.x, this.octopus.y, 20, hitColor, 0.8);
      this.tweens.add({
        targets: hitEffect,
        scale: 2, alpha: 0,
        duration: 150,
        onComplete: () => hitEffect.destroy()
      });

      // Actualizar UI
      if (this.healthText && this.octopus.active) {
        this.healthText.setText(`Villano: ${this.octopus.health}`);
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
    for (let i = 0; i < 5; i++) { if (boss.active) boss.takeDamage(); }
    const pushDir = (this.player.x < boss.x) ? 1 : -1;
    boss.x += pushDir * 30;
    boss.stunnedUntil = this.time.now + 500;
  }

  // Crear bola de energía de Colombia Ball
  handleColombiaEnergyBall(energySphere, character) {
    // Configurar colisión entre la bola de energía y el octopus
    this.physics.add.overlap(energySphere, this.octopus, () => {
      if (!this.octopus.active || !energySphere.active) return;

      const damage = 5;

      // Sonido de golpe
      this.soundGen.play('hit');

      // Aplicar daño al villano
      for (let i = 0; i < damage; i++) {
        if (this.octopus.active) this.octopus.takeDamage();
      }

      // Efecto visual en el punto de impacto
      const impactEffect = this.add.circle(this.octopus.x, this.octopus.y, 30, 0x9400D3, 0.8);
      this.tweens.add({
        targets: impactEffect,
        scale: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => impactEffect.destroy()
      });

      // Knock back del pulpo
      const knockbackDir = this.octopus.x > energySphere.x ? 1 : -1;
      if (this.octopus.body) {
        this.octopus.body.setVelocityX(knockbackDir * 200);
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

    // Pulso visual
    this.tweens.add({
      targets: magnet,
      scale: 1.9,
      duration: 350,
      yoyo: true,
      repeat: -1
    });

    const entry = { sprite: magnet, createTime: this.time.now };
    this.magnetBalls.push(entry);

    // Tras 0.5s: detener y activar atracción
    this.time.delayedCall(500, () => {
      if (!magnet.active) return;
      magnet.setVelocity(0, 0);
      magnet.body.allowGravity = false;

      // Aro visual de campo magnético
      const ring = this.add.circle(magnet.x, magnet.y, 150, color, 0.08);
      this.tweens.add({
        targets: ring,
        alpha: 0,
        duration: 3500,
        onComplete: () => ring.destroy()
      });
    });

    // Tras 4s: explotar
    this.time.delayedCall(4000, () => {
      if (!magnet.active) return;

      // Daño al boss si está cerca
      if (this.octopus && this.octopus.active) {
        const dist = Phaser.Math.Distance.Between(magnet.x, magnet.y, this.octopus.x, this.octopus.y);
        if (dist < 100) {
          for (let i = 0; i < 5; i++) {
            if (this.octopus.active) this.octopus.takeDamage();
          }
          if (this.healthText && this.octopus.active) {
            this.healthText.setText(`Villano: ${this.octopus.health}`);
          }
        }
      }

      // Explosión visual
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

      // Quitar del array
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
      const elapsed = this.time.now - m.createTime;
      if (elapsed < 500) return; // Todavía en vuelo

      // Atraer balas del pulpo
      this.octopusBullets.getChildren().forEach(bullet => {
        if (!bullet.active) return;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, m.sprite.x, m.sprite.y);
        if (dist < 120) {
          if (dist < 16) {
            bullet.setActive(false);
            bullet.setVisible(false);
            if (bullet.body) bullet.body.stop();
          } else {
            const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, m.sprite.x, m.sprite.y);
            bullet.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
          }
        }
      });
    });
  }

  handlePerritoMelee(hitX, hitY, perrito) {
    if (this.gameOver || this.gameWon) return;
    this.soundGen.play('hit');

    if (this.octopus && this.octopus.active) {
      const dist = Phaser.Math.Distance.Between(hitX, hitY, this.octopus.x, this.octopus.y);
      if (dist < 90) {
        this.octopus.takeDamage();
        if (this.healthText && this.octopus.active) {
          this.healthText.setText(`Villano: ${this.octopus.health}`);
        }
        // Impacto visual
        const impact = this.add.circle(this.octopus.x, this.octopus.y, 25, perrito.magnetColor, 0.7);
        this.tweens.add({ targets: impact, alpha: 0, scale: 2, duration: 300, onComplete: () => impact.destroy() });
      }
    }
  }

  handleClonMelee(hitX, hitY) {
    if (this.gameOver || this.gameWon) return;
    this.soundGen.play('hit');
    if (this.octopus && this.octopus.active) {
      const dist = Phaser.Math.Distance.Between(hitX, hitY, this.octopus.x, this.octopus.y);
      if (dist < 90) {
        this.octopus.takeDamage();
        if (this.healthText) this.healthText.setText(`Villano: ${this.octopus.health}`);
        const impact = this.add.circle(this.octopus.x, this.octopus.y, 30, 0x00FF00, 0.7);
        this.tweens.add({ targets: impact, alpha: 0, scale: 2, duration: 300, onComplete: () => impact.destroy() });
      }
    }
  }

  createTorbellino(x, y, flipX) {
    if (!this.gameOver && !this.gameWon) {
      const torb = this.torbellinos.get(x, y);
      if (torb) {
        torb.fire(x, y, flipX ? -1 : 1);
        torb.setScale(3.5);
        torb.body.setSize(torb.width * 0.8, torb.height * 0.8);
      }
      this.soundGen.play('shoot');
    }
  }

  // Torbellino golpea al pulpo
  hitOctopusWithTorbellino(octopus, torbellino) {
    if (!torbellino.active || !octopus.active) return;

    torbellino.setActive(false);
    torbellino.setVisible(false);
    torbellino.body.stop();
    this.tweens.killTweensOf(torbellino);

    this.soundGen.play('hit');

    // El torbellino hace 10 de daño
    for (let i = 0; i < 10; i++) {
      if (octopus.active) octopus.takeDamage();
    }

    if (this.healthText && octopus.active) {
      this.healthText.setText(`Villano: ${octopus.health}`);
    }
  }

  // Fireball reflejada por el escudo del Triángulo
  createReflectedFireball() {
    if (!this.octopus || !this.octopus.active || !this.dolphin) return;
    const dir = this.octopus.x > this.dolphin.x ? 1 : -1;
    const bullet = this.bullets.get(this.dolphin.x, this.dolphin.y, 'bigFireball');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.reset(this.dolphin.x, this.dolphin.y);
      bullet.setVelocityX(550 * dir);
      bullet.body.allowGravity = false;
      bullet.damage = 10;
      bullet.bulletType = 'bigFireball';
      bullet.setScale(1.2);
      bullet.setTint(0xFFFF00);
      this.time.delayedCall(200, () => { if (bullet.active) bullet.clearTint(); });
    }
  }

  // Crear bola de fuego grande de Red Triangle
  createBigFireball(x, y, flipX) {
    if (!this.octopus || !this.octopus.active) return;

    const bullet = this.bullets.get(x, y, 'bigFireball');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.reset(x, y);

      const direction = flipX ? -1 : 1;
      bullet.setVelocityX(350 * direction);
      bullet.body.allowGravity = false;
      bullet.damage = 8; // Más daño que otras balas
      bullet.bulletType = 'bigFireball';
      bullet.setScale(1.3);

      // Efecto de fuego pulsante
      this.tweens.add({
        targets: bullet,
        scale: 1.5,
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
          const colors = [0xFF4500, 0xFFD700, 0xFF0000];
          const color = Phaser.Math.RND.pick(colors);
          const trailParticle = this.add.circle(
            bullet.x + Phaser.Math.Between(-5, 5),
            bullet.y + Phaser.Math.Between(-5, 5),
            Phaser.Math.Between(5, 12),
            color,
            0.7
          );
          this.tweens.add({
            targets: trailParticle,
            scale: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => trailParticle.destroy()
          });
        },
        loop: true
      });
    }
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

      this.dolphin.update(cursors, wasd, spaceBar, xKey, this.qKey);
      if (this.octopus && this.octopus.active) {
        this.octopus.update();
      }

      if (this.dragonAuraCircle && this.dragonAuraCircle.active && this.player && this.player.active) {
        this.dragonAuraCircle.setPosition(this.player.x, this.player.y);
      }

      // Actualizar plataformas móviles
      this.platforms.forEach(platform => {
        platform.update();
      });
      // Actualizar balas especiales del villano (homing, bombs)
      this.updateOctopusBullets();
      // Actualizar balas de teletransporte
      this.updateTeleportBullets();
      // Actualizar bolas magnéticas de Perrito
      this.updateMagnetBalls();
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
