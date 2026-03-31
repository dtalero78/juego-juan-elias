import Phaser from 'phaser';

export default class IceBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'iceBoss');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Escalar el boss
    this.setScale(1.3);

    this.setCollideWorldBounds(true);
    this.body.allowGravity = false;
    this.health = 80;
    this.maxHealth = 80;
    this.phase = 1;

    // Dash del boss
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 700;
    this.dashDuration = 400;
    this.dashCooldown = 2500;

    // Disparo de bolas de nieve
    this.shootInterval = 1500;
    this.canShoot = true;

    // Movimiento flotante
    this.floatTime = 0;
    this.baseY = y;

    this.stunnedUntil = 0;

    // Referencia al delfín para perseguirlo
    this.target = null;

    // Iniciar comportamiento
    this.startBehavior();
  }

  setTarget(target) {
    this.target = target;
  }

  startBehavior() {
    // Timer para disparar bolas de nieve
    this.shootTimer = this.scene.time.addEvent({
      delay: this.shootInterval,
      callback: this.shootSnowball,
      callbackScope: this,
      loop: true
    });

    // Timer para hacer dash
    this.dashTimer = this.scene.time.addEvent({
      delay: this.dashCooldown,
      callback: this.performDash,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    if (!this.active) return;
    if (this.scene.time.now < this.stunnedUntil) return;

    // Movimiento flotante suave
    this.floatTime += 0.02;
    if (!this.isDashing) {
      this.y = this.baseY + Math.sin(this.floatTime) * 30;

      // Moverse lentamente hacia el jugador en X
      if (this.target && this.target.active) {
        const dx = this.target.x - this.x;
        if (Math.abs(dx) > 200) {
          this.x += Math.sign(dx) * 0.5;
        }
      }
    }

    // Limitar posición
    this.x = Phaser.Math.Clamp(this.x, 400, 750);
    this.y = Phaser.Math.Clamp(this.y, 80, 550);

    // Aura sigue al boss en fase 2
    if (this.auraCircle) {
      this.auraCircle.setPosition(this.x, this.y);
    }
  }

  // Disparar bola de nieve hacia el jugador
  shootSnowball() {
    if (!this.active || !this.target || !this.target.active) return;
    if (this.isDashing) return;

    const roll = Math.random();
    if (this.phase === 2 && roll < 0.25) {
      this.iceWall();
    } else if (roll < 0.3) {
      this.blizzardRing();
    } else {
      this._normalShot();
    }
  }

  _normalShot() {
    if (!this.active || !this.target || !this.target.active) return;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    this.scene.events.emit('iceBossShoot', this.x - 30, this.y, angle);
    if (this.phase === 2) {
      this.scene.events.emit('iceBossShoot', this.x - 30, this.y, angle + 0.25);
      this.scene.events.emit('iceBossShoot', this.x - 30, this.y, angle - 0.25);
    }
    this.setTint(0x00BFFF);
    this.scene.time.delayedCall(100, () => { if (this.active) this.clearTint(); });
  }

  blizzardRing() {
    if (!this.active) return;
    // Anticipación: escalar y blanquear
    this.setTint(0xFFFFFF);
    this.setScale(1.7);
    this.scene.time.delayedCall(350, () => {
      if (!this.active) return;
      this.clearTint();
      this.setScale(1.3);
      // 8 bolas en todas las direcciones
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        this.scene.events.emit('iceBossShoot', this.x, this.y, angle);
      }
      if (this.scene.cameras) this.scene.cameras.main.shake(200, 0.012);
    });
  }

  iceWall() {
    if (!this.active) return;
    // 5 bolas de nieve horizontales en distintas alturas
    const dir = this.x > 400 ? -1 : 1;
    const startX = dir > 0 ? -10 : 810;
    const heights = [120, 225, 325, 430, 530];
    this.setTint(0x0088FF);
    heights.forEach((h, i) => {
      this.scene.time.delayedCall(i * 130, () => {
        if (!this.active) return;
        const angle = dir > 0 ? 0 : Math.PI;
        this.scene.events.emit('iceBossShoot', startX, h, angle);
      });
    });
    this.scene.time.delayedCall(700, () => { if (this.active) this.clearTint(); });
  }

  transitionToPhase2() {
    this.phase = 2;

    // Flash de transición
    let flashes = 0;
    const flashTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        this.setVisible(!this.visible);
        flashes++;
        if (flashes >= 10) {
          flashTimer.remove();
          this.setVisible(true);
          this.setTexture('iceBossP2');
        }
      },
      loop: true
    });

    // Aura azul brillante pulsante
    this.auraCircle = this.scene.add.circle(this.x, this.y, 55, 0x00FFFF, 0.0);
    this.auraCircle.setDepth(this.depth - 1);
    this.scene.tweens.add({
      targets: this.auraCircle,
      alpha: 0.45,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.scene.events.emit('iceBossPhase2');
  }

  // Dash hacia el jugador
  performDash() {
    if (!this.active || !this.canDash || !this.target || !this.target.active) return;

    this.canDash = false;
    this.isDashing = true;

    // Calcular dirección hacia el jugador
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );

    // Guardar posición base
    this.baseY = this.y;

    // Efecto visual de preparación
    this.setTint(0x00FFFF);
    this.setScale(1.5);

    // Pequeña pausa antes del dash
    this.scene.time.delayedCall(300, () => {
      if (!this.active) return;

      // Aplicar velocidad de dash
      this.setVelocity(
        Math.cos(angle) * this.dashSpeed,
        Math.sin(angle) * this.dashSpeed
      );

      // Crear estela de hielo
      this.createIceTrail();

      // Terminar dash
      this.scene.time.delayedCall(this.dashDuration, () => {
        if (!this.active) return;
        this.isDashing = false;
        this.setVelocity(0, 0);
        this.clearTint();
        this.setScale(1.3);
        this.baseY = this.y;
      });
    });

    // Cooldown del dash
    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  // Crear estela de hielo durante el dash
  createIceTrail() {
    const trailCount = 5;
    for (let i = 0; i < trailCount; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        if (!this.scene || !this.active) return;

        const ice = this.scene.add.circle(this.x, this.y, 15, 0x00BFFF, 0.6);
        this.scene.tweens.add({
          targets: ice,
          scale: 2,
          alpha: 0,
          duration: 400,
          onComplete: () => ice.destroy()
        });
      });
    }
  }

  takeDamage() {
    this.health--;

    // Efecto visual de daño
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // Transición a fase 2 al llegar a la mitad de vida
    if (this.phase === 1 && this.health <= 40) {
      this.transitionToPhase2();
    }

    if (this.health <= 0) {
      this.die();
    }

    return this.health;
  }

  die() {
    if (this.shootTimer) this.shootTimer.remove();
    if (this.dashTimer) this.dashTimer.remove();
    if (this.auraCircle) { this.auraCircle.destroy(); this.auraCircle = null; }

    // Efecto de muerte congelada
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.scene.events.emit('iceBossDied');
        this.setActive(false);
        this.setVisible(false);
      }
    });
  }
}
