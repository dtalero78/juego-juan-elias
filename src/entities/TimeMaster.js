import Phaser from 'phaser';

export default class TimeMaster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isPvPMode = false) {
    super(scene, x, y, 'timeMaster');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Escala
    this.setScale(0.5);

    // Hitbox
    this.body.setSize(this.width * 0.5, this.height * 0.6);
    this.body.setOffset(this.width * 0.25, this.height * 0.2);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);

    // ¡VUELA! Sin gravedad
    this.body.setAllowGravity(false);

    // Movimiento de vuelo
    this.speed = 200;
    this.verticalSpeed = 200; // Velocidad para volar arriba/abajo

    // Modo PvP
    this.isPvPMode = isPvPMode;

    // Vida según modo
    if (isPvPMode) {
      this.health = 100;
      this.maxHealth = 100;
    } else {
      this.health = 3;
      this.maxHealth = 3;
    }

    this.invulnerable = false;
    this.invulnerabilityTime = 1000;

    // Sistema de ataques - rayos dorados
    this.canShoot = true;
    this.shootCooldown = 500;

    // Habilidad especial: PARAR EL TIEMPO
    this.timeStopActive = false;
    this.timeStopDuration = 5000; // 5 segundos
    this.timeStopCooldown = 10000; // 10 segundos
    this.canUseTimeStop = true;
    this.timeStopSprite = null;

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 700;
    this.dashDuration = 200;
    this.dashCooldown = 800;

    // Estado del sprite
    this.currentSpriteState = 'idle';
  }

  update(cursors, wasd, spaceBar, xKey, qKey) {
    if (this.isDashing) return;

    // Movimiento horizontal (volar)
    if (cursors.left.isDown || wasd.a.isDown) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else if (cursors.right.isDown || wasd.d.isDown) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Movimiento vertical (volar arriba/abajo)
    if (cursors.up.isDown || wasd.w.isDown) {
      this.setVelocityY(-this.verticalSpeed);
    } else if (cursors.down.isDown || wasd.s.isDown) {
      this.setVelocityY(this.verticalSpeed);
    } else {
      this.setVelocityY(0);
    }

    // Disparar rayos dorados
    if (Phaser.Input.Keyboard.JustDown(spaceBar) && this.canShoot) {
      this.shootGoldenRay();
    }

    // Dash
    if (Phaser.Input.Keyboard.JustDown(xKey) && this.canDash) {
      this.dash();
    }

    // Habilidad especial: Parar el tiempo (tecla Q)
    if (qKey && Phaser.Input.Keyboard.JustDown(qKey) && this.canUseTimeStop && !this.timeStopActive) {
      this.activateTimeStop();
    }
  }

  shootGoldenRay() {
    this.canShoot = false;

    // Emitir evento para crear rayo dorado
    this.scene.events.emit('timeMasterShoot', this.x, this.y, this.flipX, this);
    this.scene.events.emit('timeMasterRaySound');

    // Efecto visual de disparo
    const flash = this.scene.add.circle(this.x, this.y, 10, 0xFFD700, 0.8);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => flash.destroy()
    });

    // Cooldown
    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });
  }

  activateTimeStop() {
    this.canUseTimeStop = false;
    this.timeStopActive = true;

    // Cambiar sprite a modo parar tiempo
    this.setTexture('timeMasterTimeStop');

    // Emitir evento de parar tiempo
    this.scene.events.emit('timeStopActivated', this);

    // Efecto visual dorado expandiéndose
    const timeStopEffect = this.scene.add.circle(this.x, this.y, 20, 0xFFD700, 0.3);
    this.scene.tweens.add({
      targets: timeStopEffect,
      radius: 400,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut'
    });

    // Duración del efecto: 5 segundos
    this.scene.time.delayedCall(this.timeStopDuration, () => {
      this.timeStopActive = false;
      this.setTexture('timeMaster'); // Volver a sprite normal
      this.scene.events.emit('timeStopDeactivated', this);

      if (timeStopEffect && timeStopEffect.active) {
        timeStopEffect.destroy();
      }
    });

    // Cooldown: 10 segundos
    this.scene.time.delayedCall(this.timeStopCooldown, () => {
      this.canUseTimeStop = true;
    });
  }

  dash() {
    this.canDash = false;
    this.isDashing = true;

    const dashDirection = this.flipX ? -1 : 1;
    this.setVelocityX(this.dashSpeed * dashDirection);
    this.setVelocityY(0); // Mantener altura durante dash

    // Efecto visual de dash
    const dashTrail = this.scene.add.sprite(this.x, this.y, 'timeMaster');
    dashTrail.setScale(this.scaleX);
    dashTrail.setFlipX(this.flipX);
    dashTrail.setAlpha(0.3);
    dashTrail.setTint(0xFFD700);

    this.scene.tweens.add({
      targets: dashTrail,
      alpha: 0,
      duration: 300,
      onComplete: () => dashTrail.destroy()
    });

    // Finalizar dash
    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.setVelocityX(0);
    });

    // Cooldown
    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  takeDamage(amount) {
    if (this.invulnerable) return;

    this.health -= amount;
    this.invulnerable = true;

    // Efecto de daño
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });

    // Terminar invulnerabilidad
    this.scene.time.delayedCall(this.invulnerabilityTime, () => {
      this.invulnerable = false;
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.scene.events.emit('timeMasterDeath', this);

    // Efecto de muerte con partículas doradas
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        Phaser.Math.Between(3, 8),
        0xFFD700
      );

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Phaser.Math.Between(-100, 100),
        y: this.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    this.destroy();
  }

  // Método para verificar si está en el suelo (siempre false porque vuela)
  isOnGround() {
    return false;
  }
}
