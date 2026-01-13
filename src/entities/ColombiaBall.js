import Phaser from 'phaser';

export default class ColombiaBall extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isPvPMode = false) {
    super(scene, x, y, 'colombia_ball_new');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Escala (ajustada para que sea del tamaño apropiado)
    this.setScale(0.16);

    // Hitbox
    this.body.setSize(this.width * 0.7, this.height * 0.8);
    this.body.setOffset(this.width * 0.15, this.height * 0.1);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);

    // Movimiento
    this.speed = 200;
    this.jumpForce = -480;

    // Modo PvP
    this.isPvPMode = isPvPMode;

    // Vida según modo
    if (isPvPMode) {
      this.health = 100;
      this.maxHealth = 100;
    } else {
      this.health = 4;
      this.maxHealth = 4;
    }

    this.invulnerable = false;
    this.invulnerabilityTime = 1000;

    // Sistema de combos cuerpo a cuerpo
    this.isAttacking = false;
    this.comboCount = 0;
    this.maxCombo = 3; // 3 golpes + bola de energía
    this.comboTimer = null;
    this.comboWindow = 600; // ms para continuar el combo
    this.attackCooldown = 150; // ms entre golpes
    this.canAttack = true;

    // Bola de energía
    this.energyBallReady = false;
    this.isEnergyBallMode = false;
    this.energyBallDamage = 5;

    // Control de salto
    this.isInAir = false;

    // Estado del sprite
    this.currentSpriteState = 'idle';

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 800;
    this.dashDuration = 180;
    this.dashCooldown = 700;

    // Hitbox de ataque (invisible, para detectar golpes)
    this.meleeHitbox = null;
  }

  update(cursors, wasd, spaceBar, xKey) {
    if (this.isDashing) return;

    // Si está en modo energy ball, no permitir controles normales
    if (this.isEnergyBallMode) return;

    // Movimiento horizontal
    if (cursors.left.isDown || wasd.a.isDown) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else if (cursors.right.isDown || wasd.d.isDown) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Detectar suelo
    const onGround = this.body.blocked.down || this.body.touching.down;

    // Saltar
    if ((cursors.up.isDown || wasd.w.isDown) && onGround) {
      this.setVelocityY(this.jumpForce);
      this.isInAir = true;
      this.scene.events.emit('colombiaJump');
    }

    // Dash direccional con X
    if (xKey && xKey.isDown && this.canDash) {
      let dashDirX = 0;
      let dashDirY = 0;

      if (wasd.w.isDown || cursors.up.isDown) dashDirY = -1;
      if (wasd.s.isDown || cursors.down.isDown) dashDirY = 1;
      if (wasd.a.isDown || cursors.left.isDown) dashDirX = -1;
      if (wasd.d.isDown || cursors.right.isDown) dashDirX = 1;

      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = this.flipX ? -1 : 1;
      }

      this.performDash(dashDirX, dashDirY);
    }

    // Aterrizaje
    if (onGround && Math.abs(this.body.velocity.y) < 20) {
      this.isInAir = false;
    }

    // Ataque con espacio - sistema de combos
    if (spaceBar.isDown && this.canAttack) {
      this.performComboAttack();
    }

    // Actualizar sprite
    this.updateSprite();
  }

  performComboAttack() {
    this.canAttack = false;
    this.isAttacking = true;

    // Incrementar combo
    this.comboCount++;

    // Resetear timer del combo
    if (this.comboTimer) {
      this.comboTimer.remove();
    }

    // Emitir evento de ataque con el número de combo
    if (this.comboCount <= this.maxCombo) {
      // Golpe cuerpo a cuerpo
      this.scene.events.emit('colombiaAttack', this.x, this.y, this.comboCount, this.flipX, this);
      this.scene.events.emit('colombiaPunch');

      // Efecto visual del golpe
      this.createPunchEffect();

      // Después del tercer golpe, preparar bola de energía
      if (this.comboCount === this.maxCombo) {
        this.energyBallReady = true;

        // Disparar bola de energía automáticamente
        this.scene.time.delayedCall(200, () => {
          if (this.energyBallReady) {
            this.fireEnergyBall();
            this.energyBallReady = false;
            this.comboCount = 0;
          }
        });
      }
    }

    // Timer para resetear combo si no continúa
    this.comboTimer = this.scene.time.delayedCall(this.comboWindow, () => {
      this.comboCount = 0;
      this.energyBallReady = false;
    });

    // Terminar animación de ataque
    this.scene.time.delayedCall(150, () => {
      this.isAttacking = false;
    });

    // Cooldown entre golpes
    this.scene.time.delayedCall(this.attackCooldown, () => {
      this.canAttack = true;
    });
  }

  createPunchEffect() {
    const offsetX = this.flipX ? -30 : 30;
    const effect = this.scene.add.circle(this.x + offsetX, this.y, 15, 0xFCD116, 0.8);

    // Color según el golpe del combo
    const colors = [0xFCD116, 0x003893, 0xCE1126]; // Amarillo, Azul, Rojo
    effect.setFillStyle(colors[this.comboCount - 1] || 0xFCD116);

    this.scene.tweens.add({
      targets: effect,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => effect.destroy()
    });

    // Texto del combo
    if (this.comboCount > 1) {
      const comboText = this.scene.add.text(this.x, this.y - 40, `${this.comboCount} HIT!`, {
        fontSize: '16px',
        fill: '#FFFFFF',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      });
      comboText.setOrigin(0.5);

      this.scene.tweens.add({
        targets: comboText,
        y: this.y - 70,
        alpha: 0,
        duration: 500,
        onComplete: () => comboText.destroy()
      });
    }
  }

  fireEnergyBall() {
    // Disparar una bola de energía separada como proyectil
    this.scene.events.emit('colombiaSpecial');

    // Dirección del disparo
    const direction = this.flipX ? -1 : 1;
    const offsetX = this.flipX ? -40 : 40;
    const startX = this.x + offsetX;
    const startY = this.y;

    // Crear esfera negra grande (proyectil principal)
    const energySphere = this.scene.add.circle(startX, startY, 40, 0x000000, 0.9);
    energySphere.setStrokeStyle(4, 0xFF0000, 1); // Borde rojo
    this.scene.physics.add.existing(energySphere);
    energySphere.body.setCircle(40);
    energySphere.body.setVelocityX(500 * direction);
    energySphere.body.setAllowGravity(false);

    // Crear círculo rojo interior pulsante
    const innerGlow = this.scene.add.circle(startX, startY, 30, 0xFF0000, 0.5);

    // Efecto pulsante de la esfera negra
    this.scene.tweens.add({
      targets: energySphere,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true,
      repeat: -1
    });

    // Efecto pulsante del brillo rojo
    this.scene.tweens.add({
      targets: innerGlow,
      alpha: 0.8,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      repeat: -1
    });

    // Trail de energía negra con rojo
    let isActive = true;
    const trailTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!isActive || !energySphere.active) {
          trailTimer.remove();
          return;
        }
        // Partícula negra
        const trailParticle = this.scene.add.circle(energySphere.x, energySphere.y, 25, 0x000000, 0.7);
        trailParticle.setStrokeStyle(2, 0xFF0000, 0.8);

        this.scene.tweens.add({
          targets: trailParticle,
          scale: 0,
          alpha: 0,
          duration: 400,
          onComplete: () => trailParticle.destroy()
        });

        // Partícula roja pequeña
        const redParticle = this.scene.add.circle(
          energySphere.x + Phaser.Math.Between(-20, 20),
          energySphere.y + Phaser.Math.Between(-20, 20),
          8, 0xFF0000, 0.8
        );

        this.scene.tweens.add({
          targets: redParticle,
          scale: 0,
          alpha: 0,
          duration: 300,
          onComplete: () => redParticle.destroy()
        });
      },
      loop: true
    });

    // Actualizar posición del brillo interior cada frame
    const updateGlowPosition = () => {
      if (!isActive || !energySphere.active) {
        return;
      }
      innerGlow.setPosition(energySphere.x, energySphere.y);
      this.scene.time.delayedCall(16, updateGlowPosition);
    };
    updateGlowPosition();

    // Emitir evento para que la escena detecte colisiones con la bola de energía
    this.scene.events.emit('colombiaEnergyBall', energySphere, this);

    // Destruir el proyectil después de 2 segundos o al salir de pantalla
    this.scene.time.delayedCall(2000, () => {
      if (energySphere.active) {
        isActive = false;
        trailTimer.remove();

        // Efecto de explosión
        this.scene.tweens.add({
          targets: [energySphere, innerGlow],
          scale: 2,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            energySphere.destroy();
            innerGlow.destroy();
          }
        });
      }
    });

    // Destruir al salir de pantalla
    this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (energySphere.active && (energySphere.x < -100 || energySphere.x > this.scene.cameras.main.width + 100)) {
          isActive = false;
          trailTimer.remove();
          energySphere.destroy();
          innerGlow.destroy();
        }
      },
      loop: true,
      repeat: 20
    });
  }

  performDash(dirX = 1, dirY = 0) {
    this.canDash = false;
    this.isDashing = true;

    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    const normX = dirX / magnitude;
    const normY = dirY / magnitude;

    this.setVelocityX(this.dashSpeed * normX);
    this.setVelocityY(this.dashSpeed * normY);

    if (dirX !== 0) {
      this.setFlipX(dirX < 0);
    }

    if (dirY !== 0) {
      this.isInAir = true;
    }

    // Efecto visual - colores de Colombia
    this.setTint(0xFCD116);
    this.alpha = 0.7;
    this.createDashTrail();

    this.scene.events.emit('colombiaDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.clearTint();
      this.alpha = 1;
      if (dirY === 0) {
        this.setVelocityX(0);
      }
    });

    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  createDashTrail() {
    const colors = [0xFCD116, 0x003893, 0xCE1126];
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        if (!this.scene) return;
        const ghost = this.scene.add.sprite(this.x, this.y, 'colombia_ball_new');
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setTint(colors[i]);
        ghost.setAlpha(0.6 - i * 0.15);

        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 200,
          onComplete: () => ghost.destroy()
        });
      });
    }
  }

  updateSprite() {
    // Ya no necesitamos cambiar de sprite, usamos siempre la misma imagen
    // La textura 'colombia_ball_new' se mantiene constante
  }

  takeDamage() {
    if (this.invulnerable) return this.health;

    this.health--;
    this.invulnerable = true;

    // Efecto de parpadeo
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5
    });

    this.scene.time.delayedCall(this.invulnerabilityTime, () => {
      this.invulnerable = false;
      this.alpha = 1;
    });

    return this.health;
  }

  // Método para obtener el rango de ataque melee
  getMeleeRange() {
    return 60; // Rango del ataque cuerpo a cuerpo
  }

  // Método para obtener la posición del ataque
  getAttackPosition() {
    const offsetX = this.flipX ? -40 : 40;
    return { x: this.x + offsetX, y: this.y };
  }
}
