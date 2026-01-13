import Phaser from 'phaser';
import Dolphin from '../entities/Dolphin.js';
import ColombiaBall from '../entities/ColombiaBall.js';
import RedTriangle from '../entities/RedTriangle.js';
import TimeMaster from '../entities/TimeMaster.js';
import Bullet from '../entities/Bullet.js';
import GoldenRay from '../entities/GoldenRay.js';
import Platform from '../entities/Platform.js';
import CharacterAI from '../entities/CharacterAI.js';
import SoundGenerator from '../utils/SoundGenerator.js';
import TouchControls from '../ui/TouchControls.js';
import { isMobile } from '../config.js';

export default class PvPScene extends Phaser.Scene {
  constructor() {
    super('PvPScene');
    this.selectedPlayerCharacter = 'dolphin';
    this.selectedOpponentCharacter = 'dolphin';
    this.soundGen = null;
    this.touchControls = null;
    this.touchControlsPlayer2 = null;
    this.isMobileDevice = isMobile;
    this.isLocalMultiplayer = false; // Si es false, juega contra IA
  }

  init(data) {
    if (data && data.playerCharacter) {
      this.selectedPlayerCharacter = data.playerCharacter;
    }
    if (data && data.opponentCharacter) {
      this.selectedOpponentCharacter = data.opponentCharacter;
    }
    if (data && data.isLocalMultiplayer !== undefined) {
      this.isLocalMultiplayer = data.isLocalMultiplayer;
    }
  }

  create() {
    this.gameOver = false;
    this.winner = null;

    // Inicializar generador de sonidos
    this.soundGen = new SoundGenerator(this);
    this.soundGen.init();

    // Fondo
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Crear arena
    this.createArena();

    // Crear personajes
    this.player = this.createCharacter(this.selectedPlayerCharacter, 150, 500, false);
    this.opponent = this.createCharacter(this.selectedOpponentCharacter, 650, 500, true);

    // IA para oponente (solo si no es multijugador local)
    if (!this.isLocalMultiplayer) {
      this.opponentAI = new CharacterAI(this.opponent, this.player, this);
    }

    // Timer de recarga de munición para Dolphin (cada 30 segundos)
    this.time.addEvent({
      delay: 30000, // 30 segundos
      callback: () => {
        if (!this.gameOver) {
          // Recargar jugador si es Dolphin
          if (this.selectedPlayerCharacter === 'dolphin' && this.player.isPvPMode) {
            this.player.reloadAmmo(50);
            // Mostrar texto de recarga
            this.showReloadText(this.player.x, this.player.y - 50, 'Jugador');
          }
          // Recargar oponente si es Dolphin
          if (this.selectedOpponentCharacter === 'dolphin' && this.opponent.isPvPMode) {
            this.opponent.reloadAmmo(50);
            // Mostrar texto de recarga
            this.showReloadText(this.opponent.x, this.opponent.y - 50, 'Oponente');
          }
        }
      },
      loop: true
    });

    // Grupos de proyectiles separados
    this.playerBullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    });

    this.opponentBullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    });

    // Grupos de rayos dorados (TimeMaster)
    this.playerGoldenRays = this.physics.add.group({
      classType: GoldenRay,
      runChildUpdate: true
    });

    this.opponentGoldenRays = this.physics.add.group({
      classType: GoldenRay,
      runChildUpdate: true
    });

    // Configurar colisiones
    this.setupCollisions();

    // Controles
    this.setupControls();

    // Eventos
    this.setupEvents();

    // UI
    this.createUI();

    // Controles táctiles si es móvil
    if (this.isMobileDevice) {
      // Joystick para Jugador 1 (izquierda)
      this.touchControls = new TouchControls(this, 'player1');

      // Si es multijugador local, añadir joystick para Jugador 2 (derecha)
      if (this.isLocalMultiplayer) {
        this.touchControlsPlayer2 = new TouchControls(this, 'player2');
      }
    }
  }

  createCharacter(type, x, y, isAI) {
    let character;

    if (type === 'colombiaBall') {
      // ColombiaBall en modo PvP
      character = new ColombiaBall(this, x, y, true);
    } else if (type === 'redTriangle') {
      // RedTriangle en modo PvP
      character = new RedTriangle(this, x, y, true);
    } else if (type === 'timeMaster') {
      // TimeMaster en modo PvP - personaje volador
      character = new TimeMaster(this, x, y, true);
    } else {
      // Dolphin en modo PvP
      character = new Dolphin(this, x, y, ['normal', 'fire'], true);
    }

    character.isAI = isAI;
    // En modo multijugador local, ambos son jugadores humanos pero necesitamos distinguirlos
    // isPlayer1 = true solo para el jugador de la izquierda
    character.isPlayer1 = !isAI; // true para jugador 1
    character.isPlayer2 = isAI && this.isLocalMultiplayer; // true solo para jugador 2 en modo local

    // Voltearlo si es el oponente
    if (isAI && !this.isLocalMultiplayer) {
      character.setFlipX(true);
    }

    return character;
  }

  createArena() {
    this.platforms = [];

    // Suelo
    const ground = this.add.rectangle(400, 620, 800, 60, 0x228B22);
    this.physics.add.existing(ground, true);
    this.platforms.push(ground);

    // Plataformas simétricas
    // Plataformas bajas (izquierda y derecha)
    const platformLeft1 = new Platform(this, 150, 500, 150, 20);
    this.platforms.push(platformLeft1);

    const platformRight1 = new Platform(this, 650, 500, 150, 20);
    this.platforms.push(platformRight1);

    // Plataformas medias (más hacia el centro)
    const platformLeft2 = new Platform(this, 250, 400, 120, 20);
    this.platforms.push(platformLeft2);

    const platformRight2 = new Platform(this, 550, 400, 120, 20);
    this.platforms.push(platformRight2);

    // Plataforma central superior
    const platformCenter = new Platform(this, 400, 300, 150, 20);
    this.platforms.push(platformCenter);
  }

  setupCollisions() {
    // Colisiones con plataformas
    this.platforms.forEach(platform => {
      this.physics.add.collider(this.player, platform);
      this.physics.add.collider(this.opponent, platform);
    });

    // Jugador golpeado por proyectiles del oponente
    this.physics.add.overlap(
      this.player,
      this.opponentBullets,
      this.hitPlayer,
      null,
      this
    );

    // Oponente golpeado por proyectiles del jugador
    this.physics.add.overlap(
      this.opponent,
      this.playerBullets,
      this.hitOpponent,
      null,
      this
    );

    // Jugador golpeado por rayos dorados del oponente
    this.physics.add.overlap(
      this.player,
      this.opponentGoldenRays,
      this.hitPlayer,
      null,
      this
    );

    // Oponente golpeado por rayos dorados del jugador
    this.physics.add.overlap(
      this.opponent,
      this.playerGoldenRays,
      this.hitOpponent,
      null,
      this
    );
  }

  setupControls() {
    // Controles Jugador 1 (WASD + Space + X + Q)
    this.wasd = {
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Crear cursors vacíos para Jugador 1 (usaremos WASD)
    this.cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false }
    };

    // Controles Jugador 2 (Flechas + Numpad0/Ctrl + Numpad./Alt + Numpad1/Shift)
    if (this.isLocalMultiplayer) {
      this.cursorsP2 = this.input.keyboard.createCursorKeys();
      this.wasdP2 = {
        w: { isDown: false },
        a: { isDown: false },
        s: { isDown: false },
        d: { isDown: false }
      };
      // Múltiples opciones para atacar: Numpad 0, Ctrl derecho, o tecla M
      this.spaceBarP2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO);
      this.spaceBarP2Alt = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL); // Ctrl derecho
      this.spaceBarP2Alt2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

      // Múltiples opciones para dash: Numpad ., Alt, o tecla N
      this.xKeyP2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD); // Numpad +
      this.xKeyP2Alt = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ALT);
      this.xKeyP2Alt2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

      // Múltiples opciones para escudo/cambio: Numpad 1, Shift derecho, o tecla K
      this.qKeyP2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE);
      this.qKeyP2Alt = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.qKeyP2Alt2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    }
  }

  setupEvents() {
    // Eventos de disparo - verificar si es jugador u oponente
    this.events.on('dolphinShoot', (x, y, bulletType, flipX, character) => {
      if (character === this.player || character?.isPlayer1) {
        this.createPlayerBullet(x, y, bulletType, flipX);
      } else {
        this.createOpponentBullet(x, y, bulletType, flipX);
      }
    });

    this.events.on('triangleFireball', (x, y, flipX, character) => {
      if (character === this.player || character?.isPlayer1) {
        this.createPlayerBullet(x, y, 'bigFireball', flipX);
      } else {
        this.createOpponentBullet(x, y, 'bigFireball', flipX);
      }
    });

    // TimeMaster - rayos dorados
    this.events.on('timeMasterShoot', (x, y, flipX, character) => {
      if (character === this.player || character?.isPlayer1) {
        this.createPlayerGoldenRay(x, y, flipX);
      } else {
        this.createOpponentGoldenRay(x, y, flipX);
      }
    });

    // TimeMaster - parar el tiempo
    this.events.on('timeStopActivated', (character) => {
      // Pausar al oponente durante el Time Stop
      const target = (character === this.player || character?.isPlayer1) ? this.opponent : this.player;
      target.timeStopped = true;

      // Efecto visual de tiempo detenido
      target.setTint(0x8888FF);
    });

    this.events.on('timeStopDeactivated', (character) => {
      // Reactivar al oponente
      const target = (character === this.player || character?.isPlayer1) ? this.opponent : this.player;
      target.timeStopped = false;
      target.clearTint();
    });

    // Sonidos
    this.events.on('dolphinJump', () => this.soundGen.play('jump'));
    this.events.on('dolphinDash', () => this.soundGen.play('dash'));
    this.events.on('colombiaJump', () => this.soundGen.play('jump'));
    this.events.on('colombiaDash', () => this.soundGen.play('dash'));
    this.events.on('colombiaPunch', () => this.soundGen.play('hit'));
    this.events.on('colombiaSpecial', () => this.soundGen.play('shootFire'));
    this.events.on('triangleJump', () => this.soundGen.play('jump'));
    this.events.on('triangleDash', () => this.soundGen.play('dash'));
    this.events.on('triangleShoot', () => this.soundGen.play('shootFire'));

    // Ataques melee de Colombia Ball
    this.events.on('colombiaAttack', (x, y, comboCount, flipX, character) => {
      // Determinar atacante y objetivo basado en quién emitió el evento
      if (character === this.player || character?.isPlayer1) {
        this.handleMeleeAttack(x, y, comboCount, flipX, this.player, this.opponent);
      } else {
        this.handleMeleeAttack(x, y, comboCount, flipX, this.opponent, this.player);
      }
    });

    this.events.on('colombiaEnergyBall', (energySphere, character) => {
      // Detectar colisiones de la bola de energía con el objetivo
      if (character === this.player || character?.isPlayer1) {
        // Bola del jugador golpea al oponente
        this.physics.add.overlap(energySphere, this.opponent, () => {
          if (energySphere.active) {
            this.opponent.takeDamage();
            this.updateOpponentHealth();

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

            if (this.opponent.health <= 0) {
              this.gameOver = true;
              this.showVictory(true);
            }
          }
        });
      } else {
        // Bola del oponente golpea al jugador
        this.physics.add.overlap(energySphere, this.player, () => {
          if (energySphere.active) {
            this.player.takeDamage();
            this.updatePlayerHealth();

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

            if (this.player.health <= 0) {
              this.gameOver = true;
              this.showVictory(false);
            }
          }
        });
      }
    });
  }

  createUI() {
    const style = {
      font: '20px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    };

    // Vida del jugador (izquierda)
    this.playerHealthText = this.add.text(20, 20, '', style);
    this.updatePlayerHealth();

    // Vida del oponente (derecha)
    this.opponentHealthText = this.add.text(780, 20, '', style).setOrigin(1, 0);
    this.updateOpponentHealth();

    // Título
    const modeText = this.isLocalMultiplayer ? 'MODO LOCAL 2 JUGADORES' : 'MODO PvP';
    this.add.text(400, 20, modeText, {
      font: '28px Arial',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0);

    // Controles
    const controlsStyle = {
      font: '12px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    };

    if (this.isLocalMultiplayer) {
      // Mostrar controles de ambos jugadores
      this.add.text(10, 570, 'P1: WASD Mover | ESPACIO Atacar | X Dash | Q Escudo', controlsStyle);
      this.add.text(10, 590, 'P2: FLECHAS Mover | M/Num0/Ctrl Atacar | N/Num+/Alt Dash | K/Num1/Shift Escudo', controlsStyle);
    } else {
      this.add.text(10, 580, 'A/D: Mover | W: Saltar | ESPACIO: Atacar | X: Dash | Q: Escudo', controlsStyle);
    }
  }

  updatePlayerHealth() {
    const health = this.player.health || 0;
    const maxHealth = this.player.maxHealth || health;
    const label = this.isLocalMultiplayer ? 'Jugador 1' : 'Jugador';
    this.playerHealthText.setText(`${label}: ${health}/${maxHealth}`);
  }

  updateOpponentHealth() {
    const health = this.opponent.health || 0;
    const maxHealth = this.opponent.maxHealth || health;
    const label = this.isLocalMultiplayer ? 'Jugador 2' : 'Oponente';
    this.opponentHealthText.setText(`${label}: ${health}/${maxHealth}`);
  }

  createPlayerBullet(x, y, bulletType, flipX) {
    const bullet = this.playerBullets.get(x, y);
    if (bullet) {
      bullet.fire(x, y, flipX ? -1 : 1, bulletType);
    }
  }

  createOpponentBullet(x, y, bulletType, flipX) {
    const bullet = this.opponentBullets.get(x, y);
    if (bullet) {
      bullet.fire(x, y, flipX ? -1 : 1, bulletType);
    }
  }

  createPlayerGoldenRay(x, y, flipX) {
    const ray = this.playerGoldenRays.get(x, y);
    if (ray) {
      ray.fire(x, y, flipX ? -1 : 1);
    }
  }

  createOpponentGoldenRay(x, y, flipX) {
    const ray = this.opponentGoldenRays.get(x, y);
    if (ray) {
      ray.fire(x, y, flipX ? -1 : 1);
    }
  }

  handleMeleeAttack(x, y, comboCount, flipX, attacker, target) {
    // Verificar si el ataque golpea al objetivo
    const attackDistance = 60;
    const distance = Phaser.Math.Distance.Between(attacker.x, attacker.y, target.x, target.y);

    if (distance < attackDistance) {
      const damage = comboCount === 3 ? 2 : 1; // El tercer golpe hace más daño

      for (let i = 0; i < damage; i++) {
        target.takeDamage();
      }

      this.soundGen.play('hit');

      // Actualizar UI
      if (target === this.player) {
        this.updatePlayerHealth();
      } else {
        this.updateOpponentHealth();
      }

      // Verificar victoria
      if (target.health <= 0) {
        this.handleVictory(attacker === this.player);
      }
    }
  }

  hitPlayer(player, bullet) {
    if (!bullet.active || this.gameOver) return;

    bullet.setActive(false);
    bullet.setVisible(false);

    player.takeDamage();
    this.soundGen.play('hit');
    this.updatePlayerHealth();

    if (player.health <= 0) {
      this.handleVictory(false);
    }
  }

  hitOpponent(opponent, bullet) {
    if (!bullet.active || this.gameOver) return;

    bullet.setActive(false);
    bullet.setVisible(false);

    opponent.takeDamage();
    this.soundGen.play('hit');
    this.updateOpponentHealth();

    if (opponent.health <= 0) {
      this.handleVictory(true);
    }
  }

  handleVictory(playerWon) {
    if (this.gameOver) return;

    this.gameOver = true;
    this.winner = playerWon ? 'player' : 'opponent';

    // Detener personajes
    this.player.setVelocity(0, 0);
    this.opponent.setVelocity(0, 0);

    // Mostrar mensaje de victoria
    let text, color;
    if (this.isLocalMultiplayer) {
      text = playerWon ? '¡JUGADOR 1 GANA!' : '¡JUGADOR 2 GANA!';
      color = playerWon ? '#00FF00' : '#FF6600';
    } else {
      text = playerWon ? '¡VICTORIA!' : '¡DERROTA!';
      color = playerWon ? '#00FF00' : '#FF0000';
    }

    this.add.text(400, 250, text, {
      fontSize: '72px',
      fill: color,
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Opciones
    this.add.text(400, 350, 'R - Revancha', {
      fontSize: '28px',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(400, 390, 'M - Menú Principal', {
      fontSize: '28px',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Sonido de victoria/derrota
    if (playerWon) {
      this.soundGen.play('pickup'); // Usar sonido de pickup como victoria
    }

    // Configurar teclas de reinicio
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });

    this.input.keyboard.once('keydown-M', () => {
      this.scene.start('MenuScene');
    });
  }

  update() {
    if (this.gameOver) return;

    // Actualizar jugador 1
    let cursors, wasd, spaceBar, xKey, qKey;

    if (this.isMobileDevice && this.touchControls) {
      cursors = this.touchControls.getState();
      wasd = this.touchControls.getWasdState();
      spaceBar = this.touchControls.getSpaceState();
      xKey = this.touchControls.getXKeyState();
      qKey = { isDown: false };
    } else {
      cursors = this.cursors;
      wasd = this.wasd;
      spaceBar = this.spaceBar;
      xKey = this.xKey;
      qKey = this.qKey;
    }

    // Solo actualizar si no tiene el tiempo detenido
    if (!this.player.timeStopped) {
      this.player.update(cursors, wasd, spaceBar, xKey, qKey);
    }

    // Actualizar oponente
    if (this.isLocalMultiplayer) {
      // Modo multijugador local - Jugador 2 controla al oponente
      let cursorsP2, wasdP2, spaceBarP2, xKeyP2, qKeyP2;

      if (this.isMobileDevice && this.touchControlsPlayer2) {
        cursorsP2 = this.touchControlsPlayer2.getState();
        wasdP2 = this.touchControlsPlayer2.getWasdState();
        spaceBarP2 = this.touchControlsPlayer2.getSpaceState();
        xKeyP2 = this.touchControlsPlayer2.getXKeyState();
        qKeyP2 = { isDown: false };
      } else {
        cursorsP2 = this.cursorsP2;
        wasdP2 = this.wasdP2;

        // Combinar todas las teclas alternativas para atacar
        spaceBarP2 = {
          isDown: this.spaceBarP2.isDown || this.spaceBarP2Alt.isDown || this.spaceBarP2Alt2.isDown
        };

        // Combinar todas las teclas alternativas para dash
        xKeyP2 = {
          isDown: this.xKeyP2.isDown || this.xKeyP2Alt.isDown || this.xKeyP2Alt2.isDown
        };

        // Combinar todas las teclas alternativas para escudo/cambio
        qKeyP2 = {
          isDown: this.qKeyP2.isDown || this.qKeyP2Alt.isDown || this.qKeyP2Alt2.isDown
        };
      }

      // Solo actualizar si no tiene el tiempo detenido
      if (!this.opponent.timeStopped) {
        this.opponent.update(cursorsP2, wasdP2, spaceBarP2, xKeyP2, qKeyP2);
      }
    } else {
      // Modo contra IA
      if (!this.opponent.timeStopped) {
        const aiInputs = this.opponentAI.getInputs();
        this.opponent.update(...aiInputs);
      }
    }

    // Verificar colisión de Colombia Ball en modo energy ball
    if (this.player.constructor.name === 'ColombiaBall' && this.player.isEnergyBallMode) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.opponent.x, this.opponent.y
      );

      if (distance < 50) {
        this.hitOpponentWithEnergyBall(this.opponent, this.player);
      }
    }

    if (this.opponent.constructor.name === 'ColombiaBall' && this.opponent.isEnergyBallMode) {
      const distance = Phaser.Math.Distance.Between(
        this.opponent.x, this.opponent.y,
        this.player.x, this.player.y
      );

      if (distance < 50) {
        this.hitPlayerWithEnergyBall(this.player, this.opponent);
      }
    }

    // Actualizar plataformas móviles si las hay
    this.platforms.forEach(platform => {
      if (platform.update) platform.update();
    });
  }

  hitOpponentWithEnergyBall(opponent, energyBall) {
    if (!opponent.active || this.gameOver) return;

    // Evitar hits múltiples muy rápidos
    if (this.lastEnergyBallHitOpponent && this.time.now - this.lastEnergyBallHitOpponent < 200) {
      return;
    }
    this.lastEnergyBallHitOpponent = this.time.now;

    const damage = energyBall.energyBallDamage || 5;

    for (let i = 0; i < damage; i++) {
      opponent.takeDamage();
    }

    this.soundGen.play('hit');
    this.updateOpponentHealth();

    // Efecto visual
    const impactEffect = this.add.circle(opponent.x, opponent.y, 30, 0x9400D3, 0.8);
    this.tweens.add({
      targets: impactEffect,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => impactEffect.destroy()
    });

    if (opponent.health <= 0) {
      this.handleVictory(true);
    }
  }

  hitPlayerWithEnergyBall(player, energyBall) {
    if (!player.active || this.gameOver) return;

    if (this.lastEnergyBallHitPlayer && this.time.now - this.lastEnergyBallHitPlayer < 200) {
      return;
    }
    this.lastEnergyBallHitPlayer = this.time.now;

    const damage = energyBall.energyBallDamage || 5;

    for (let i = 0; i < damage; i++) {
      player.takeDamage();
    }

    this.soundGen.play('hit');
    this.updatePlayerHealth();

    // Efecto visual
    const impactEffect = this.add.circle(player.x, player.y, 30, 0x9400D3, 0.8);
    this.tweens.add({
      targets: impactEffect,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => impactEffect.destroy()
    });

    if (player.health <= 0) {
      this.handleVictory(false);
    }
  }

  shutdown() {
    // Limpiar eventos
    this.events.off('dolphinShoot');
    this.events.off('dolphinJump');
    this.events.off('dolphinDash');
    this.events.off('colombiaJump');
    this.events.off('colombiaDash');
    this.events.off('colombiaPunch');
    this.events.off('colombiaSpecial');
    this.events.off('colombiaAttack');
    this.events.off('colombiaEnergyBallActive');
    this.events.off('triangleJump');
    this.events.off('triangleDash');
    this.events.off('triangleShoot');
    this.events.off('triangleFireball');
  }

  showReloadText(x, y, characterName) {
    const reloadText = this.add.text(x, y, '+50 BALAS', {
      fontSize: '20px',
      fill: '#00FF00',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: reloadText,
      y: y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => reloadText.destroy()
    });
  }
}
