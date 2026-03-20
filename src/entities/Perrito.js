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

    // Modo de ataque: 'magnet' o 'melee'
    this.attackMode = 'magnet';

    // Bola magnética
    this.canShoot = true;
    this.shootCooldown = 3500;

    // Golpe cuerpo a cuerpo
    this.canMelee = true;
    this.meleeCooldown = 500;
    this.isMeleeActive = false;

    // Combo melee
    this.meleeComboCount = 0;
    this.meleeComboWindowMs = 800;
    this.lastMeleeTime = 0;

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 780;
    this.dashDuration = 180;
    this.dashCooldown = 700;

    // Doble salto
    this.jumpsLeft = 2;
    this.wasUpDown = false;

    this.currentSpriteState = 'idle';

    // Color de efectos según skin
    const isTierra = localStorage.getItem('mielito_perrito_skin') === 'tierra';
    this.magnetColor = isTierra ? 0x8B4513 : 0xFF00FF;
    this.dashTint = isTierra ? 0xA0522D : 0xFF00FF;
  }

  update(cursors, wasd, spaceBar, xKey, qKey) {
    if (this.isDashing) return;

    const onGround = this.body.blocked.down || this.body.touching.down;

    // Resetear saltos al tocar el suelo
    if (onGround) this.jumpsLeft = 2;

    if (cursors.left.isDown || wasd.a.isDown) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else if (cursors.right.isDown || wasd.d.isDown) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Doble salto con detección JustDown manual
    const upPressed = cursors.up.isDown || wasd.w.isDown;
    if (upPressed && !this.wasUpDown) {
      if (onGround) {
        this.setVelocityY(this.jumpForce);
        this.jumpsLeft = 1;
        this.scene.events.emit('perritoJump');
      } else if (this.jumpsLeft > 0) {
        this.setVelocityY(this.jumpForce * 0.88);
        this.jumpsLeft--;
        this.scene.events.emit('perritoJump');
        // Explosión magnética en los pies
        this._magnetBurst(this.x, this.y + 22, 12, this.magnetColor);
      }
    }
    this.wasUpDown = upPressed;

    // Q: alternar modo de ataque
    if (qKey && Phaser.Input.Keyboard.JustDown(qKey)) {
      this.attackMode = this.attackMode === 'magnet' ? 'melee' : 'magnet';
      this.scene.events.emit('perritoModeChange', this.attackMode);
    }

    if (Phaser.Input.Keyboard.JustDown(spaceBar)) {
      if (this.attackMode === 'magnet' && this.canShoot) {
        this.shootMagnetStorm();
      } else if (this.attackMode === 'melee' && this.canMelee && !this.isMeleeActive) {
        this.melee();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(xKey) && this.canDash) {
      this.dash();
    }
  }

  // ── TORMENTA MAGNÉTICA: 3 bolas en abanico ─────────────────────────────────
  shootMagnetStorm() {
    this.canShoot = false;

    // Flash de carga
    const flash = this.scene.add.circle(this.x, this.y, 22, this.magnetColor, 0.85);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 5, duration: 380, onComplete: () => flash.destroy() });

    // Onda expansiva
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, this.magnetColor, 1);
    ring.strokeCircle(0, 0, 18);
    ring.setPosition(this.x, this.y);
    this.scene.tweens.add({ targets: ring, scaleX: 5, scaleY: 5, alpha: 0, duration: 420, onComplete: () => ring.destroy() });

    // 3 bolas con separación en Y y pequeño retraso
    const yOffsets = [0, -28, 28];
    yOffsets.forEach((yOff, i) => {
      this.scene.time.delayedCall(i * 90, () => {
        if (!this.active) return;
        this.scene.events.emit('perritoMagnet', this.x, this.y + yOff, this.flipX, this);
      });
    });

    this.scene.time.delayedCall(this.shootCooldown, () => { this.canShoot = true; });
  }

  // ── COMBO MELEE (3 golpes escalantes) ──────────────────────────────────────
  melee() {
    const now = this.scene.time.now;

    // Reiniciar combo si expiró la ventana
    if (now - this.lastMeleeTime > this.meleeComboWindowMs) {
      this.meleeComboCount = 0;
    }
    this.meleeComboCount = (this.meleeComboCount % 3) + 1;
    this.lastMeleeTime = now;

    this.canMelee = false;
    this.isMeleeActive = true;

    const dir = this.flipX ? -1 : 1;
    const hitX = this.x + dir * 58;
    const hitY = this.y;

    if (this.meleeComboCount === 1) {
      // Golpe 1: arco rápido
      this._drawArc(dir, 45, 4, this.magnetColor);
      this.scene.events.emit('perritoMelee', hitX, hitY, this);

    } else if (this.meleeComboCount === 2) {
      // Golpe 2: arco giratorio más grande + golpe doble
      this._drawArc(dir, 58, 5, 0xFF88FF);
      // Pequeño avance hacia el enemigo
      this.setVelocityX(dir * 260);
      this.scene.time.delayedCall(90, () => { if (this.active) this.setVelocityX(0); });
      this.scene.events.emit('perritoMelee', hitX, hitY, this);
      this.scene.time.delayedCall(80, () => {
        if (!this.active) return;
        this.scene.events.emit('perritoMelee', hitX + dir * 10, hitY, this);
      });

    } else {
      // Golpe 3: EXPLOSIÓN MAGNÉTICA FINAL
      this._drawExplosionFinisher();
      // Lanzarse hacia adelante
      this.setVelocityX(dir * 400);
      this.scene.time.delayedCall(150, () => { if (this.active) this.setVelocityX(0); });
      // Triple daño en área
      for (let i = 0; i < 3; i++) {
        this.scene.time.delayedCall(i * 60, () => {
          if (!this.active) return;
          this.scene.events.emit('perritoMelee', hitX, hitY, this);
          this.scene.events.emit('perritoMelee', this.x - dir * 50, hitY, this); // también atrás
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
    const skinKey = localStorage.getItem('mielito_perrito_skin') === 'tierra' ? 'perrito_tierra' : 'perrito';

    this.setVelocityX(this.dashSpeed * dir);

    // 6 fantasmas de estela
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 28, () => {
        if (!this.active) return;
        const ghost = this.scene.add.sprite(this.x, this.y, skinKey);
        ghost.setScale(this.scaleX);
        ghost.setFlipX(this.flipX);
        ghost.setAlpha(0.55 - i * 0.08);
        ghost.setTint(this.dashTint);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200 + i * 15, onComplete: () => ghost.destroy() });
      });
    }

    // Rastro de chispas magnéticas
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 30, () => {
        if (!this.active) return;
        const spark = this.scene.add.circle(this.x, this.y + Phaser.Math.Between(-15, 15), 4, this.magnetColor, 0.9);
        this.scene.tweens.add({ targets: spark, alpha: 0, scaleX: 3, scaleY: 0.5, duration: 220, onComplete: () => spark.destroy() });
      });
    }

    this.scene.events.emit('perritoDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      // Boost de velocidad breve post-dash
      this.speed = 310;
      this.scene.time.delayedCall(700, () => { if (this.active) this.speed = 215; });
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
    this.scene.tweens.add({ targets: slash, alpha: 0, duration: 260, onComplete: () => slash.destroy() });
  }

  _drawExplosionFinisher() {
    // Anillos expansivos
    for (let i = 0; i < 4; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(5 - i, this.magnetColor, 1 - i * 0.15);
      ring.strokeCircle(0, 0, 25 + i * 12);
      ring.setPosition(this.x, this.y);
      this.scene.tweens.add({
        targets: ring, scaleX: 4.5, scaleY: 4.5, alpha: 0,
        duration: 380 + i * 80,
        onComplete: () => ring.destroy()
      });
    }
    // Chispas radiales
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const spark = this.scene.add.circle(
        this.x + Math.cos(angle) * 22,
        this.y + Math.sin(angle) * 22,
        6, this.magnetColor, 1
      );
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * 95,
        y: this.y + Math.sin(angle) * 95,
        alpha: 0, scale: 0.3,
        duration: 360, ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
    // Flash blanco central
    const core = this.scene.add.circle(this.x, this.y, 18, 0xFFFFFF, 0.95);
    this.scene.tweens.add({ targets: core, alpha: 0, scale: 3.5, duration: 280, onComplete: () => core.destroy() });
  }

  _magnetBurst(x, y, radius, color) {
    const burst = this.scene.add.circle(x, y, radius, color, 0.8);
    this.scene.tweens.add({ targets: burst, scale: 3, alpha: 0, duration: 280, onComplete: () => burst.destroy() });
  }

  // ──────────────────────────────────────────────────────────────────────────

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

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const p = this.scene.add.circle(
        this.x + Math.cos(angle) * 20,
        this.y + Math.sin(angle) * 20,
        Phaser.Math.Between(4, 10),
        this.magnetColor
      );
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * Phaser.Math.Between(80, 140),
        y: this.y + Math.sin(angle) * Phaser.Math.Between(80, 140),
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
