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
  }

  // Disparar bola de nieve hacia el jugador
  shootSnowball() {
    if (!this.active || !this.target || !this.target.active) return;
    if (this.isDashing) return;

    // Calcular dirección hacia el jugador
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );

    this.scene.events.emit('iceBossShoot', this.x - 30, this.y, angle);

    // Efecto visual de disparo
    this.setTint(0x00BFFF);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });
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

    if (this.health <= 0) {
      this.die();
    }

    return this.health;
  }

  die() {
    if (this.shootTimer) this.shootTimer.remove();
    if (this.dashTimer) this.dashTimer.remove();

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
