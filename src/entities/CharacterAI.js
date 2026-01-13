import Phaser from 'phaser';

export default class CharacterAI {
  constructor(character, target, scene) {
    this.character = character;
    this.target = target;
    this.scene = scene;

    // Temporizadores
    this.lastAttackTime = 0;
    this.attackCooldown = 500;
    this.lastJumpTime = 0;
    this.jumpCooldown = 800;
    this.lastDashTime = 0;
    this.dashCooldown = 2000;

    // Configuración según tipo de personaje
    this.setupCharacterBehavior();
  }

  setupCharacterBehavior() {
    const charType = this.character.constructor.name;

    if (charType === 'ColombiaBall') {
      this.optimalDistance = 80; // Close range para melee
      this.attackDistance = 100;
      this.aggressiveness = 0.8; // Muy agresivo para personaje melee
    } else if (charType === 'RedTriangle') {
      this.optimalDistance = 200; // Medium range
      this.attackDistance = 300;
      this.aggressiveness = 0.6;
    } else { // Dolphin
      this.optimalDistance = 250; // Long range
      this.attackDistance = 400;
      this.aggressiveness = 0.5;
    }
  }

  getInputs() {
    const distance = Phaser.Math.Distance.Between(
      this.character.x, this.character.y,
      this.target.x, this.target.y
    );

    const horizontalDistance = Math.abs(this.target.x - this.character.x);
    const verticalDistance = this.target.y - this.character.y;

    // Crear inputs virtuales
    const cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false }
    };

    const wasd = {
      a: { isDown: false },
      d: { isDown: false },
      w: { isDown: false },
      s: { isDown: false }
    };

    const spaceBar = { isDown: false };
    const xKey = { isDown: false };
    const qKey = { isDown: false };

    const now = this.scene.time.now;
    const onGround = this.character.body.blocked.down || this.character.body.touching.down;

    // Decisión de movimiento horizontal
    if (horizontalDistance > 50) {
      if (this.target.x < this.character.x) {
        // Moverse a la izquierda
        cursors.left.isDown = true;
        wasd.a.isDown = true;
      } else {
        // Moverse a la derecha
        cursors.right.isDown = true;
        wasd.d.isDown = true;
      }
    }

    // Decisión de salto
    if (onGround && now - this.lastJumpTime > this.jumpCooldown) {
      // Saltar si el objetivo está más alto
      if (verticalDistance < -100) {
        cursors.up.isDown = true;
        wasd.w.isDown = true;
        this.lastJumpTime = now;
      }

      // Saltar si hay una plataforma enfrente y el objetivo está en ella
      if (Math.random() < 0.15 && horizontalDistance < 200) {
        cursors.up.isDown = true;
        wasd.w.isDown = true;
        this.lastJumpTime = now;
      }

      // Saltar aleatoriamente para evasión
      if (Math.random() < 0.08) {
        cursors.up.isDown = true;
        wasd.w.isDown = true;
        this.lastJumpTime = now;
      }
    }

    // Decisión de ataque
    if (distance < this.attackDistance && now - this.lastAttackTime > this.attackCooldown) {
      // Aumentar probabilidad de ataque cuanto más cerca esté
      const attackProbability = 1 - (distance / this.attackDistance);
      if (Math.random() < attackProbability * this.aggressiveness) {
        spaceBar.isDown = true;
        this.lastAttackTime = now;
      }
    }

    // Usar dash para acercarse o alejarse
    if (now - this.lastDashTime > this.dashCooldown && this.character.canDash) {
      // Dash hacia el enemigo si está lejos
      if (horizontalDistance > this.optimalDistance * 1.5 && Math.random() < 0.3) {
        xKey.isDown = true;
        this.lastDashTime = now;

        // Mantener dirección de movimiento para dash direccional
        if (this.target.x < this.character.x) {
          wasd.a.isDown = true;
          cursors.left.isDown = true;
        } else {
          wasd.d.isDown = true;
          cursors.right.isDown = true;
        }
      }

      // Dash para alejarse si está muy cerca (excepto ColombiaBall)
      if (this.character.constructor.name !== 'ColombiaBall' &&
          horizontalDistance < this.optimalDistance * 0.5 &&
          Math.random() < 0.4) {
        xKey.isDown = true;
        this.lastDashTime = now;

        // Dash en dirección opuesta
        if (this.target.x < this.character.x) {
          wasd.d.isDown = true;
          cursors.right.isDown = true;
        } else {
          wasd.a.isDown = true;
          cursors.left.isDown = true;
        }
      }
    }

    // Usar escudo (solo RedTriangle)
    if (this.character.constructor.name === 'RedTriangle' &&
        this.character.activateShield &&
        !this.character.shieldActive &&
        Math.random() < 0.1) {
      qKey.isDown = true;
    }

    return [cursors, wasd, spaceBar, xKey, qKey];
  }
}
