import Phaser from 'phaser';

// BRUTUS — Boss cuerpo a cuerpo imprevisible
export default class BlibluBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bliblu');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.85);
    this.setCollideWorldBounds(true);
    this.body.allowGravity = false;

    this.health = 300;
    this.maxHealth = 300;

    this.target = null;
    this.walkSpeed = 150;
    this.baseY = y;

    // Dash rebotante
    this.isDashing = false;
    this.dashSpeed = 950;
    this.dashVelX = 0;
    this.bounceCount = 0;
    this.maxBounces = 5;
    this.dashTimeout = null;

    // Jump slam
    this.isJumping = false;

    // Rage mode (below 50% HP)
    this.rageMode = false;

    this.stunnedUntil = 0;

    this.startBehavior();
  }

  setTarget(target) {
    this.target = target;
  }

  startBehavior() {
    this.scheduleNextAttack();
  }

  scheduleNextAttack() {
    if (!this.active) return;
    // Ataques aleatorios cada 3-7 segundos (2-4 en rage mode)
    const minDelay = this.rageMode ? 2000 : 3000;
    const maxDelay = this.rageMode ? 4000 : 7000;
    const delay = Phaser.Math.Between(minDelay, maxDelay);

    this.attackScheduler = this.scene.time.delayedCall(delay, () => {
      if (!this.active || this.isDashing || this.isJumping) {
        this.scheduleNextAttack();
        return;
      }
      // Elegir ataque al azar: 50% dash, 30% jump slam, 20% ground shockwave
      const roll = Math.random();
      if (roll < 0.5) {
        this.performDash();
      } else if (roll < 0.8) {
        this.performJumpSlam();
      } else {
        this.performGroundShockwave();
      }
      this.scheduleNextAttack();
    });
  }

  update() {
    if (!this.active) return;
    if (this.scene.time.now < this.stunnedUntil) return;

    // Durante jump no lockear Y
    if (!this.isJumping) {
      this.y = this.baseY;
      this.setVelocityY(0);
    }

    if (this.isDashing) {
      if (this.x <= 40 && this.dashVelX < 0) {
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

    if (this.isJumping) return;

    // Caminar hacia el jugador
    if (this.target && this.target.active) {
      const dx = this.target.x - this.x;
      const speed = this.rageMode ? this.walkSpeed * 1.8 : this.walkSpeed;
      if (Math.abs(dx) > 10) {
        const dir = Math.sign(dx);
        this.x += dir * speed * (1 / 60);
        this.setFlipX(dir < 0);
      }
    }
  }

  performDash() {
    if (!this.active || this.isDashing || this.isJumping) return;

    this.isDashing = true;
    this.bounceCount = 0;
    this.dashVelX = 0;
    this.setTexture('blibluDash');

    // Efecto de carga (rojo en normal, rojo pulsante en rage)
    this.setTint(0xFF2200);
    const chargeTime = this.rageMode ? 150 : 300;

    this.scene.time.delayedCall(chargeTime, () => {
      if (!this.active) return;
      this.clearTint();
      const speed = this.rageMode ? this.dashSpeed * 1.4 : this.dashSpeed;
      const dir = this.target && this.target.active ? (this.target.x > this.x ? 1 : -1) : 1;
      this.dashVelX = speed * dir;
      this.setVelocityX(this.dashVelX);
      this.setFlipX(dir < 0);
      this.createDashTrail();

      const maxTime = this.rageMode ? 2000 : 3000;
      this.dashTimeout = this.scene.time.delayedCall(maxTime, () => {
        if (this.active && this.isDashing) this.stopDash();
      });
    });

    this.scene.events.emit('blibluDash');
  }

  performJumpSlam() {
    if (!this.active || this.isDashing || this.isJumping) return;
    if (!this.target || !this.target.active) return;

    this.isJumping = true;
    const targetX = Phaser.Math.Clamp(this.target.x, 60, 740);

    // Saltar hacia arriba
    this.scene.tweens.add({
      targets: this,
      y: this.baseY - 220,
      duration: 380,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (!this.active) { this.isJumping = false; return; }
        // Moverse al X del jugador en el aire
        this.x = targetX;
        // Caer rápido
        this.scene.tweens.add({
          targets: this,
          y: this.baseY,
          duration: 220,
          ease: 'Power3.easeIn',
          onComplete: () => {
            if (!this.active) { this.isJumping = false; return; }
            this.isJumping = false;
            // Shockwave al aterrizar
            this.scene.events.emit('blibluSlam', this.x, this.baseY);
            // Sacudir pantalla
            this.scene.cameras.main.shake(200, 0.012);
          }
        });
      }
    });
  }

  performGroundShockwave() {
    if (!this.active || this.isDashing || this.isJumping) return;

    // Cargar: rojo pulsante
    this.setTint(0xFF0000);
    const chargeTime = this.rageMode ? 200 : 400;

    this.scene.time.delayedCall(chargeTime, () => {
      if (!this.active) return;
      this.clearTint();
      // Golpear el suelo
      this.scene.cameras.main.shake(280, 0.018);
      // Emitir onda expansiva doble
      this.scene.events.emit('blibluSlam', this.x, this.baseY);
      this.scene.time.delayedCall(200, () => {
        if (!this.active) return;
        this.scene.events.emit('blibluSlam', this.x + 80, this.baseY);
        this.scene.events.emit('blibluSlam', this.x - 80, this.baseY);
      });
    });
  }

  stopDash() {
    this.isDashing = false;
    this.setVelocityX(0);
    this.setTexture('bliblu');
    this.clearTint();
    if (this.dashTimeout) { this.dashTimeout.remove(); this.dashTimeout = null; }
  }

  createDashTrail() {
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        if (!this.scene || !this.active) return;
        const ghost = this.scene.add.sprite(this.x, this.y, 'blibluDash');
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setAlpha(0.5 - i * 0.08);
        ghost.setTint(this.rageMode ? 0xFF0000 : 0xFF6600);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 180,
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

    // Activar rage mode al 50% HP
    if (!this.rageMode && this.health <= 150) {
      this.rageMode = true;
      this.scene.events.emit('blibluRage');
    }

    if (this.health <= 0) {
      this.die();
    }

    return this.health;
  }

  die() {
    if (this.dashTimeout) this.dashTimeout.remove();
    if (this.attackScheduler) this.attackScheduler.remove();

    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this.scene.events.emit('blibluDied');
        this.setActive(false);
        this.setVisible(false);
      }
    });
  }
}
