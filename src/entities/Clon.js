import Phaser from 'phaser';

export default class Clon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isPvPMode = false) {
    const skin = localStorage.getItem('mielito_clon_skin') === 'robot' ? 'clon_robot' : 'clon';
    super(scene, x, y, skin);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.45);

    this.body.setSize(this.width * 0.5, this.height * 0.7);
    this.body.setOffset(this.width * 0.25, this.height * 0.15);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);

    // Personaje terrestre con gravedad
    this.body.setAllowGravity(true);

    this.speed = 600;
    this.jumpForce = -900;

    this.isPvPMode = isPvPMode;

    if (isPvPMode) {
      this.health = 100;
      this.maxHealth = 100;
    } else {
      this.health = 2;
      this.maxHealth = 2;
    }

    this.invulnerable = false;
    this.invulnerabilityTime = 300;

    // Modo de ataque: 'torbellino' o 'melee'
    this.attackMode = 'torbellino';

    // Ataque: lanza torbellinos gigantes
    this.canShoot = true;
    this.shootCooldown = 10000;

    // Melee
    this.canMelee = true;
    this.isMeleeActive = false;
    this.meleeCooldown = 400;

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 2000;
    this.dashDuration = 150;
    this.dashCooldown = 200;

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

    // Q: alternar modo de ataque
    if (qKey && Phaser.Input.Keyboard.JustDown(qKey)) {
      this.attackMode = this.attackMode === 'torbellino' ? 'melee' : 'torbellino';
      this.scene.events.emit('clonModeChange', this.attackMode);
    }

    // ESPACIO: atacar según modo
    if (Phaser.Input.Keyboard.JustDown(spaceBar)) {
      if (this.attackMode === 'torbellino' && this.canShoot) {
        this.shootTorbellino();
      } else if (this.attackMode === 'melee' && this.canMelee && !this.isMeleeActive) {
        this.meleeAttack();
      }
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

  meleeAttack() {
    this.canMelee = false;
    this.isMeleeActive = true;

    const dir = this.flipX ? -1 : 1;
    const hitX = this.x + dir * 60;
    const hitY = this.y;

    // Efecto visual: arco verde
    const slash = this.scene.add.graphics();
    slash.lineStyle(6, 0x00FF00, 1);
    slash.beginPath();
    slash.arc(this.x + dir * 20, this.y, 50, Phaser.Math.DegToRad(dir > 0 ? -70 : 110), Phaser.Math.DegToRad(dir > 0 ? 70 : 250), false);
    slash.strokePath();
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 200,
      onComplete: () => slash.destroy()
    });

    this.scene.events.emit('clonMelee', hitX, hitY, this);

    this.scene.time.delayedCall(200, () => { this.isMeleeActive = false; });
    this.scene.time.delayedCall(this.meleeCooldown, () => { this.canMelee = true; });
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
    if (this.invulnerable) return this.health;

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

    return this.health;
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
