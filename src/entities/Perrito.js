import Phaser from 'phaser';

export default class Perrito extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isPvPMode = false) {
    const skin = localStorage.getItem('mielito_perrito_skin') === 'tierra' ? 'perrito_tierra' : 'perrito';
    super(scene, x, y, skin);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.45);

    this.body.setSize(this.width * 0.55, this.height * 0.7);
    this.body.setOffset(this.width * 0.22, this.height * 0.15);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);
    this.body.setAllowGravity(true);

    this.speed = 215;
    this.jumpForce = -490;

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

    // Ataque: bola magnética (atrae proyectiles enemigos y al jefe)
    this.canShoot = true;
    this.shootCooldown = 3000;

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 700;
    this.dashDuration = 180;
    this.dashCooldown = 750;

    this.currentSpriteState = 'idle';

    // Color de efectos según skin
    const isTierra = localStorage.getItem('mielito_perrito_skin') === 'tierra';
    this.magnetColor = isTierra ? 0x8B4513 : 0xFF00FF;
    this.dashTint = isTierra ? 0xA0522D : 0xFF00FF;
  }

  update(cursors, wasd, spaceBar, xKey) {
    if (this.isDashing) return;

    const onGround = this.body.blocked.down || this.body.touching.down;

    if (cursors.left.isDown || wasd.a.isDown) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else if (cursors.right.isDown || wasd.d.isDown) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if ((cursors.up.isDown || wasd.w.isDown) && onGround) {
      this.setVelocityY(this.jumpForce);
      this.scene.events.emit('perritoJump');
    }

    if (Phaser.Input.Keyboard.JustDown(spaceBar) && this.canShoot) {
      this.shootMagnetBall();
    }

    if (Phaser.Input.Keyboard.JustDown(xKey) && this.canDash) {
      this.dash();
    }
  }

  shootMagnetBall() {
    this.canShoot = false;

    this.scene.events.emit('perritoMagnet', this.x, this.y, this.flipX, this);

    // Flash visual
    const flash = this.scene.add.circle(this.x, this.y, 10, this.magnetColor, 0.8);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 3,
      duration: 300,
      onComplete: () => flash.destroy()
    });

    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });
  }

  dash() {
    this.canDash = false;
    this.isDashing = true;

    const dir = this.flipX ? -1 : 1;
    this.setVelocityX(this.dashSpeed * dir);

    const trail = this.scene.add.sprite(this.x, this.y, 'perrito');
    trail.setScale(this.scaleX);
    trail.setFlipX(this.flipX);
    trail.setAlpha(0.35);
    trail.setTint(this.dashTint);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 280,
      onComplete: () => trail.destroy()
    });

    this.scene.events.emit('perritoDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
    });

    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  takeDamage(amount) {
    if (this.invulnerable) return this.health;

    this.health -= (amount || 1);
    this.invulnerable = true;

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

    if (this.health <= 0) {
      this.die();
    }

    return this.health;
  }

  die() {
    this.scene.events.emit('perritoDeath', this);

    for (let i = 0; i < 12; i++) {
      const p = this.scene.add.circle(
        this.x, this.y,
        Phaser.Math.Between(3, 9),
        this.magnetColor
      );
      this.scene.tweens.add({
        targets: p,
        x: this.x + Phaser.Math.Between(-100, 100),
        y: this.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }

    this.destroy();
  }

  isOnGround() {
    return this.body.blocked.down || this.body.touching.down;
  }
}
