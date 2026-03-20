import Phaser from 'phaser';

export default class Clon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isPvPMode = false) {
    const isRobot = localStorage.getItem('mielito_clon_skin') === 'robot';
    const skin = isRobot ? 'clon_robot' : 'clon';
    super(scene, x, y, skin);
    this.isRobotSkin = isRobot;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.45);

    this.body.setSize(this.width * 0.5, this.height * 0.7);
    this.body.setOffset(this.width * 0.25, this.height * 0.15);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);
    this.body.setAllowGravity(true);

    this.speed = 210;
    this.jumpForce = -480;

    this.isPvPMode = isPvPMode;

    if (isPvPMode) {
      this.health = 100;
      this.maxHealth = 100;
    } else {
      this.health = 3;
      this.maxHealth = 3;
    }

    this.invulnerable = false;
    this.invulnerabilityTime = 1000;

    // Colores por skin
    this.plasmaColor = isRobot ? 0x00CCFF : 0x00FF66;
    this.dashTint   = isRobot ? 0x00AAFF : 0x00FF00;

    // Modo de ataque: 'plasma' o 'melee'
    this.attackMode = 'plasma';

    // Tormenta de Plasma
    this.canShoot = true;
    this.shootCooldown = 3500;
    this.betweenShotsCooldown = 600;
    this.plasmaShots = 3;
    this.maxPlasmaShots = 3;

    // Combo melee
    this.canMelee = true;
    this.isMeleeActive = false;
    this.meleeCooldown = 500;
    this.meleeComboCount = 0;
    this.meleeComboWindowMs = 800;
    this.lastMeleeTime = 0;

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 700;
    this.dashDuration = 160;
    this.dashCooldown = 1000;

    // Doble salto
    this.jumpsLeft = 2;
    this.wasUpDown = false;

    this.currentSpriteState = 'idle';

    // Recarga pasiva: 1 disparo cada 7s hasta el máximo
    this._rechargeTimer = scene.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => {
        if (this.active && this.plasmaShots < this.maxPlasmaShots) {
          this.plasmaShots++;
          if (this.plasmaShots > 0) this.canShoot = true;
          this.scene.events.emit('clonPlasmaShots', this.plasmaShots);
          this._rechargeFlash();
        }
      }
    });
  }

  update(cursors, wasd, spaceBar, xKey, qKey) {
    if (this.isDashing) return;

    const onGround = this.body.blocked.down || this.body.touching.down;

    if (onGround) this.jumpsLeft = 2;

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

    // Doble salto (JustDown manual)
    const upPressed = cursors.up.isDown || wasd.w.isDown;
    if (upPressed && !this.wasUpDown) {
      if (onGround) {
        this.setVelocityY(this.jumpForce);
        this.jumpsLeft = 1;
        this.scene.events.emit('clonJump');
      } else if (this.jumpsLeft > 0) {
        this.setVelocityY(this.jumpForce * 0.88);
        this.jumpsLeft--;
        this.scene.events.emit('clonJump');
        // Ráfaga de plasma en los pies
        this._plasmaBurst(this.x, this.y + 20, 10, this.plasmaColor);
      }
    }
    this.wasUpDown = upPressed;

    // Q: alternar modo de ataque
    if (qKey && Phaser.Input.Keyboard.JustDown(qKey)) {
      this.attackMode = this.attackMode === 'plasma' ? 'melee' : 'plasma';
      this.scene.events.emit('clonModeChange', this.attackMode);
    }

    // ESPACIO: atacar según modo
    if (Phaser.Input.Keyboard.JustDown(spaceBar)) {
      if (this.attackMode === 'plasma' && this.canShoot && this.plasmaShots > 0) {
        this.shootPlasmaStorm();
      } else if (this.attackMode === 'melee' && this.canMelee && !this.isMeleeActive) {
        this.meleeAttack();
      }
    }

    // Dash
    if (Phaser.Input.Keyboard.JustDown(xKey) && this.canDash) {
      this.dash();
    }
  }

  // ── TORMENTA DE PLASMA: 3 disparos en abanico ─────────────────────────────
  shootPlasmaStorm() {
    this.canShoot = false;
    this.plasmaShots--;
    this.scene.events.emit('clonPlasmaShots', this.plasmaShots);

    // Flash de carga
    const flash = this.scene.add.circle(this.x, this.y, 22, this.plasmaColor, 0.9);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 4.5, duration: 350, onComplete: () => flash.destroy() });

    // Onda expansiva
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, this.plasmaColor, 1);
    ring.strokeCircle(0, 0, 18);
    ring.setPosition(this.x, this.y);
    this.scene.tweens.add({ targets: ring, scaleX: 5, scaleY: 5, alpha: 0, duration: 400, onComplete: () => ring.destroy() });

    // 3 disparos: centro, arriba-adelante, abajo-adelante
    const offsets = [0, -28, 28];
    offsets.forEach((yOff, i) => {
      this.scene.time.delayedCall(i * 80, () => {
        if (!this.active) return;
        this.scene.events.emit('clonShoot', this.x, this.y + yOff, this.flipX, this);
      });
    });

    const cd = this.plasmaShots <= 0 ? this.shootCooldown : this.betweenShotsCooldown;
    this.scene.time.delayedCall(cd, () => {
      if (this.active) this.canShoot = true;
    });
  }

  // ── COMBO MELEE 3 GOLPES ───────────────────────────────────────────────────
  meleeAttack() {
    const now = this.scene.time.now;

    if (now - this.lastMeleeTime > this.meleeComboWindowMs) {
      this.meleeComboCount = 0;
    }
    this.meleeComboCount = (this.meleeComboCount % 3) + 1;
    this.lastMeleeTime = now;

    this.canMelee = false;
    this.isMeleeActive = true;

    const dir = this.flipX ? -1 : 1;
    const hitX = this.x + dir * 60;
    const hitY = this.y;

    if (this.meleeComboCount === 1) {
      // Golpe 1: arco rápido
      this._drawArc(dir, 45, 5, this.plasmaColor);
      this.scene.events.emit('clonMelee', hitX, hitY, this);

    } else if (this.meleeComboCount === 2) {
      // Golpe 2: arco más grande + avance
      this._drawArc(dir, 58, 6, 0xFFFFFF);
      this.setVelocityX(dir * 280);
      this.scene.time.delayedCall(90, () => { if (this.active) this.setVelocityX(0); });
      this.scene.events.emit('clonMelee', hitX, hitY, this);
      this.scene.time.delayedCall(80, () => {
        if (!this.active) return;
        this.scene.events.emit('clonMelee', hitX + dir * 10, hitY, this);
      });

    } else {
      // Golpe 3: EXPLOSIÓN DE PLASMA FINAL
      this._drawPlasmaExplosion();
      this.setVelocityX(dir * 420);
      this.scene.time.delayedCall(150, () => { if (this.active) this.setVelocityX(0); });
      for (let i = 0; i < 3; i++) {
        this.scene.time.delayedCall(i * 60, () => {
          if (!this.active) return;
          this.scene.events.emit('clonMelee', hitX, hitY, this);
          this.scene.events.emit('clonMelee', this.x - dir * 50, hitY, this);
        });
      }
      this.meleeComboCount = 0;
    }

    this.scene.time.delayedCall(200, () => { this.isMeleeActive = false; });
    this.scene.time.delayedCall(this.meleeCooldown, () => { this.canMelee = true; });
  }

  // ── DASH ÉPICO ─────────────────────────────────────────────────────────────
  dash() {
    this.canDash = false;
    this.isDashing = true;
    this.invulnerable = true;

    const dir = this.flipX ? -1 : 1;
    const skinKey = this.isRobotSkin ? 'clon_robot' : 'clon';

    this.setVelocityX(this.dashSpeed * dir);

    // 8 afterimages en degradé
    const dashColors = this.isRobotSkin
      ? [0x00DDFF, 0x00CCFF, 0x00BBFF, 0x0099FF, 0x00DDFF, 0x00AAFF, 0x00BBFF, 0x00CCFF]
      : [0x00FF66, 0x00EE55, 0x00DD44, 0x00CC33, 0x00FF66, 0x44FF88, 0x00EE55, 0x00DD44];

    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 20, () => {
        if (!this.active) return;
        const ghost = this.scene.add.sprite(this.x, this.y, skinKey);
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setTint(dashColors[i]);
        ghost.setAlpha(0.65 - i * 0.07);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 180 + i * 10, onComplete: () => ghost.destroy() });
      });
    }

    // Chispas de plasma durante el dash
    for (let i = 0; i < 7; i++) {
      this.scene.time.delayedCall(i * 22, () => {
        if (!this.active) return;
        const spark = this.scene.add.circle(
          this.x + Phaser.Math.Between(-10, 10),
          this.y + Phaser.Math.Between(-12, 12),
          Phaser.Math.Between(3, 7), this.plasmaColor, 0.85
        );
        this.scene.tweens.add({ targets: spark, alpha: 0, scaleX: 2.8, scaleY: 0.5, duration: 210, onComplete: () => spark.destroy() });
      });
    }

    this.setTint(this.dashTint);
    this.alpha = 0.75;

    this.scene.events.emit('clonDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.clearTint();
      this.alpha = 1;
      this.setVelocityX(0);

      // Descarga de plasma al final del dash
      this._plasmaBurst(this.x, this.y, 14, this.plasmaColor);

      // Boost de velocidad breve
      this.speed = 280;
      this.scene.time.delayedCall(400, () => { if (this.active) this.speed = 210; });
    });

    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
      if (!this.isDashing) this.invulnerable = false;
    });
  }

  // ── HELPERS VISUALES ──────────────────────────────────────────────────────

  _drawArc(dir, radius, lineWidth, color) {
    const slash = this.scene.add.graphics();
    slash.lineStyle(lineWidth, color, 1);
    slash.beginPath();
    slash.arc(
      this.x + dir * 22, this.y, radius,
      Phaser.Math.DegToRad(dir > 0 ? -65 : 115),
      Phaser.Math.DegToRad(dir > 0 ? 65 : 245),
      false
    );
    slash.strokePath();
    this.scene.tweens.add({ targets: slash, alpha: 0, duration: 250, onComplete: () => slash.destroy() });
  }

  _drawPlasmaExplosion() {
    for (let i = 0; i < 4; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(5 - i, this.plasmaColor, 1 - i * 0.15);
      ring.strokeCircle(0, 0, 25 + i * 12);
      ring.setPosition(this.x, this.y);
      this.scene.tweens.add({
        targets: ring, scaleX: 4.5, scaleY: 4.5, alpha: 0,
        duration: 380 + i * 80, onComplete: () => ring.destroy()
      });
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spark = this.scene.add.circle(
        this.x + Math.cos(angle) * 22,
        this.y + Math.sin(angle) * 22,
        6, this.plasmaColor, 1
      );
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * 100,
        y: this.y + Math.sin(angle) * 100,
        alpha: 0, scale: 0.3,
        duration: 360, ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
    const core = this.scene.add.circle(this.x, this.y, 18, 0xFFFFFF, 0.95);
    this.scene.tweens.add({ targets: core, alpha: 0, scale: 3.5, duration: 280, onComplete: () => core.destroy() });
  }

  _plasmaBurst(x, y, radius, color) {
    const core = this.scene.add.circle(x, y, radius, color, 0.9);
    this.scene.tweens.add({ targets: core, scale: 3.5, alpha: 0, duration: 300, onComplete: () => core.destroy() });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const drop = this.scene.add.circle(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, 4, color, 1);
      this.scene.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * 45, y: y + Math.sin(angle) * 45,
        alpha: 0, duration: 280, ease: 'Cubic.easeOut', onComplete: () => drop.destroy()
      });
    }
  }

  _rechargeFlash() {
    if (!this.scene) return;
    const glow = this.scene.add.circle(this.x, this.y, 14, this.plasmaColor, 0.7);
    this.scene.tweens.add({ targets: glow, alpha: 0, scale: 2.5, duration: 350, onComplete: () => glow.destroy() });
  }

  // ──────────────────────────────────────────────────────────────────────────

  takeDamage(amount) {
    if (this.invulnerable) return this.health;

    this.health -= (amount || 1);
    this.invulnerable = true;

    this.scene.tweens.add({
      targets: this, alpha: 0.3, duration: 100, yoyo: true, repeat: 5
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
    this.scene.events.emit('clonDeath', this);

    if (this._rechargeTimer) this._rechargeTimer.remove();

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const p = this.scene.add.circle(
        this.x + Math.cos(angle) * 20,
        this.y + Math.sin(angle) * 20,
        Phaser.Math.Between(4, 10), this.plasmaColor
      );
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * Phaser.Math.Between(80, 140),
        y: this.y + Math.sin(angle) * Phaser.Math.Between(80, 140),
        alpha: 0, duration: 900, ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }

    this.destroy();
  }

  isOnGround() {
    return this.body.blocked.down || this.body.touching.down;
  }
}
