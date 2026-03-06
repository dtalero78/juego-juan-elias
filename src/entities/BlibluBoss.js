import Phaser from 'phaser';

export default class BlibluBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bliblu');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.75);
    this.setCollideWorldBounds(true);
    this.body.allowGravity = false;

    this.health = 120;
    this.maxHealth = 120;

    this.target = null;
    this.walkSpeed = 90;
    this.baseY = y;

    // Dash rebotante
    this.isDashing = false;
    this.dashSpeed = 650;
    this.bounceCount = 0;
    this.maxBounces = 3;

    this.stunnedUntil = 0;

    this.startBehavior();
  }

  setTarget(target) {
    this.target = target;
  }

  startBehavior() {
    // Dash cada 5 segundos
    this.dashTimer = this.scene.time.addEvent({
      delay: 5000,
      callback: this.performDash,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    if (!this.active) return;
    if (this.scene.time.now < this.stunnedUntil) return;

    // Mantener Y fijo en el suelo
    this.y = this.baseY;
    this.setVelocityY(0);

    if (this.isDashing) {
      // Detectar rebote en los bordes del mundo (solo cuando realmente cambia de dirección)
      if (this.body.blocked.left && this.dashDir > 0) {
        this.dashDir = 1;
        this.bounceCount++;
      } else if (this.body.blocked.right && this.dashDir > 0) {
        this.dashDir = -1;
        this.bounceCount++;
      } else if (this.x <= 40 && this.dashVelX < 0) {
        this.dashVelX = Math.abs(this.dashVelX);
        this.bounceCount++;
      } else if (this.x >= 760 && this.dashVelX > 0) {
        this.dashVelX = -Math.abs(this.dashVelX);
        this.bounceCount++;
      }

      if (this.bounceCount >= this.maxBounces) {
        this.stopDash();
      } else {
        this.setVelocityX(this.dashVelX);
        this.setFlipX(this.dashVelX < 0);
      }
      return;
    }

    // Caminar hacia el jugador
    if (this.target && this.target.active) {
      const dx = this.target.x - this.x;
      if (Math.abs(dx) > 10) {
        const dir = Math.sign(dx);
        this.x += dir * this.walkSpeed * (1 / 60);
        this.setFlipX(dir < 0);
      }
    }
  }

  performDash() {
    if (!this.active || this.isDashing || !this.target || !this.target.active) return;

    this.isDashing = true;
    this.bounceCount = 0;
    this.dashVelX = 0;
    this.setTexture('blibluDash');

    // Efecto visual de carga
    this.setTint(0xFF4400);
    this.scene.time.delayedCall(300, () => {
      if (!this.active) return;
      this.clearTint();
      const dir = this.target && this.target.active ? (this.target.x > this.x ? 1 : -1) : 1;
      this.dashVelX = this.dashSpeed * dir;
      this.setVelocityX(this.dashVelX);
      this.setFlipX(dir < 0);
      this.createDashTrail();

      // Limite de tiempo del dash: 3 segundos
      this.dashTimeout = this.scene.time.delayedCall(3000, () => {
        if (this.active && this.isDashing) this.stopDash();
      });
    });

    this.scene.events.emit('blibluDash');
  }

  stopDash() {
    this.isDashing = false;
    this.setVelocityX(0);
    this.setTexture('bliblu');
    this.clearTint();
    if (this.dashTimeout) this.dashTimeout.remove();
  }

  createDashTrail() {
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        if (!this.scene || !this.active) return;
        const ghost = this.scene.add.sprite(this.x, this.y, 'blibluDash');
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setAlpha(0.5 - i * 0.1);
        ghost.setTint(0xFF6600);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 200,
          onComplete: () => ghost.destroy()
        });
      });
    }
  }

  takeDamage() {
    if (!this.active) return this.health;
    this.health--;

    this.setTint(0xff0000);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.clearTint();
    });

    if (this.health <= 0) {
      this.die();
    }

    return this.health;
  }

  die() {
    if (this.dashTimer) this.dashTimer.remove();
    if (this.dashTimeout) this.dashTimeout.remove();

    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.scene.events.emit('blibluDied');
        this.setActive(false);
        this.setVisible(false);
      }
    });
  }
}
