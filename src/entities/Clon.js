import Phaser from 'phaser';

export default class Clon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isPvPMode = false) {
    super(scene, x, y, 'clon');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.45);

    this.body.setSize(this.width * 0.5, this.height * 0.7);
    this.body.setOffset(this.width * 0.25, this.height * 0.15);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);

    // Personaje terrestre con gravedad
    this.body.setAllowGravity(true);

    this.speed = 210;
    this.jumpForce = -480;

    this.isPvPMode = isPvPMode;

    if (isPvPMode) {
      this.health = 100;
      this.maxHealth = 100;
    } else {
      this.health = 4;
      this.maxHealth = 4;
    }

    this.invulnerable = false;
    this.invulnerabilityTime = 1000;

    // Ataque: lanza torbellinos
    this.canShoot = true;
    this.shootCooldown = 400;

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 650;
    this.dashDuration = 200;
    this.dashCooldown = 800;

    this.currentSpriteState = 'idle';
  }

  update(cursors, wasd, spaceBar, xKey, qKey) {
    if (this.isDashing) return;

    const onGround = this.body.blocked.down || this.body.touching.down;

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

    // Salto
    if ((cursors.up.isDown || wasd.w.isDown) && onGround) {
      this.setVelocityY(this.jumpForce);
      this.scene.events.emit('clonJump');
    }

    // Disparar torbellino
    if (Phaser.Input.Keyboard.JustDown(spaceBar) && this.canShoot) {
      this.shootTorbellino();
    }

    // Dash
    if (Phaser.Input.Keyboard.JustDown(xKey) && this.canDash) {
      this.dash();
    }
  }

  shootTorbellino() {
    this.canShoot = false;

    this.scene.events.emit('clonShoot', this.x, this.y, this.flipX, this);

    // Efecto visual de disparo
    const flash = this.scene.add.circle(this.x, this.y, 8, 0x00FF00, 0.7);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 250,
      onComplete: () => flash.destroy()
    });

    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });
  }

  dash() {
    this.canDash = false;
    this.isDashing = true;

    const dashDirection = this.flipX ? -1 : 1;
    this.setVelocityX(this.dashSpeed * dashDirection);

    // Efecto visual de dash
    const dashTrail = this.scene.add.sprite(this.x, this.y, 'clon');
    dashTrail.setScale(this.scaleX);
    dashTrail.setFlipX(this.flipX);
    dashTrail.setAlpha(0.3);
    dashTrail.setTint(0x00FF00);

    this.scene.tweens.add({
      targets: dashTrail,
      alpha: 0,
      duration: 300,
      onComplete: () => dashTrail.destroy()
    });

    this.scene.events.emit('clonDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
    });

    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  takeDamage(amount) {
    if (this.invulnerable) return;

    this.health -= (amount || 1);
    this.invulnerable = true;

    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });

    this.scene.time.delayedCall(this.invulnerabilityTime, () => {
      this.invulnerable = false;
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.scene.events.emit('clonDeath', this);

    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        Phaser.Math.Between(3, 8),
        0x00FF00
      );

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Phaser.Math.Between(-80, 80),
        y: this.y + Phaser.Math.Between(-80, 80),
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    this.destroy();
  }

  isOnGround() {
    return this.body.blocked.down || this.body.touching.down;
  }
}
