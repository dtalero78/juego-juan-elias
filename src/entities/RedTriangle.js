import Phaser from 'phaser';

export default class RedTriangle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isPvPMode = false) {
    super(scene, x, y, 'redTriangle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.45);

    this.body.setSize(this.width * 0.6, this.height * 0.7);
    this.body.setOffset(this.width * 0.2, this.height * 0.15);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);

    this.speed = 220;
    this.jumpForce = -500;

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

    // Disparo — con sistema de carga
    this.canShoot = true;
    this.shootCooldown = 400;
    this.isChargingFireball = false;
    this.chargeStartTime = 0;
    this.chargeMinMs = 600;
    this.chargeGraphic = null;
    this.wasSpaceDown = false;

    // Escudo
    this.shieldActive = false;
    this.shieldCards = [];
    this.maxShieldCards = 3;
    this.shieldCooldown = 3000;
    this.canUseShield = true;

    // Bola de fuego grande (legado)
    this.fireballReady = true;
    this.fireballCooldown = 2000;

    // Doble salto
    this.jumpsLeft = 2;
    this.wasUpDown = false;

    this.isInAir = false;
    this.currentSpriteState = 'idle';

    // JustDown manual para Q
    this.wasQDown = false;

    // Dash direccional
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 850;
    this.dashDuration = 180;
    this.dashCooldown = 650;
  }

  update(cursors, wasd, spaceBar, xKey, qKey) {
    if (this.isDashing) return;

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

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) {
      this.jumpsLeft = 2;
      if (Math.abs(this.body.velocity.y) < 20) this.isInAir = false;
    }

    // Doble salto (JustDown manual)
    const upPressed = cursors.up.isDown || wasd.w.isDown;
    if (upPressed && !this.wasUpDown) {
      if (onGround) {
        this.setVelocityY(this.jumpForce);
        this.jumpsLeft = 1;
        this.isInAir = true;
        this.scene.events.emit('triangleJump');
      } else if (this.jumpsLeft > 0) {
        this.setVelocityY(this.jumpForce * 0.87);
        this.jumpsLeft--;
        this.scene.events.emit('triangleJump');
        // Explosión de fuego en los pies
        this._fireBurst(this.x, this.y + 20, 14);
      }
    }
    this.wasUpDown = upPressed;

    // Dash direccional con X
    if (xKey && xKey.isDown && this.canDash) {
      let dashDirX = 0;
      let dashDirY = 0;
      if (wasd.w.isDown || cursors.up.isDown) dashDirY = -1;
      if (wasd.s.isDown || cursors.down.isDown) dashDirY = 1;
      if (wasd.a.isDown || cursors.left.isDown) dashDirX = -1;
      if (wasd.d.isDown || cursors.right.isDown) dashDirX = 1;
      if (dashDirX === 0 && dashDirY === 0) dashDirX = this.flipX ? -1 : 1;
      this.performDash(dashDirX, dashDirY);
    }

    // ── Sistema de carga de fireball ───────────────────────────────────────
    const spaceJustDown = spaceBar.isDown && !this.wasSpaceDown;
    const spaceJustUp   = !spaceBar.isDown && this.wasSpaceDown;
    this.wasSpaceDown   = spaceBar.isDown;

    if (spaceJustDown && this.canShoot) {
      this.isChargingFireball = true;
      this.chargeStartTime = this.scene.time.now;
      this._startChargeEffect();
    }

    if (this.isChargingFireball && spaceBar.isDown) {
      this._updateChargeEffect();
    }

    if (spaceJustUp && this.isChargingFireball) {
      const heldMs = this.scene.time.now - this.chargeStartTime;
      this.isChargingFireball = false;
      this._clearChargeEffect();
      if (heldMs >= this.chargeMinMs) {
        this.shootMegaFireball();
      } else {
        this.shootFireball();
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    // Escudo / reflejo con Q
    const qDown = qKey && qKey.isDown;
    if (qDown && !this.wasQDown) {
      if (this.shieldActive) {
        this.reflectShield();
      } else {
        this.activateShield();
      }
    }
    this.wasQDown = !!qDown;

    this.updateShield();
    this.updateSprite();
  }

  // ── FIREBALL RÁPIDA ────────────────────────────────────────────────────────
  shootFireball() {
    this.canShoot = false;
    this.scene.events.emit('triangleFireball', this.x, this.y, this.flipX, this);
    this.scene.events.emit('triangleShoot');

    const dir = this.flipX ? -1 : 1;
    const flash = this.scene.add.circle(this.x + dir * 20, this.y, 14, 0xFF4500, 0.85);
    this.scene.tweens.add({ targets: flash, scale: 0, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    this.scene.time.delayedCall(this.shootCooldown, () => { this.canShoot = true; });
  }

  // ── MEGA FIREBALL CARGADA ──────────────────────────────────────────────────
  shootMegaFireball() {
    this.canShoot = false;

    // Evento especial con flag de mega
    this.scene.events.emit('triangleMegaFireball', this.x, this.y, this.flipX, this);
    this.scene.events.emit('triangleShoot');

    // Flash enorme
    const dir = this.flipX ? -1 : 1;
    const core = this.scene.add.circle(this.x + dir * 25, this.y, 26, 0xFF2200, 0.95);
    this.scene.tweens.add({ targets: core, scale: 0, alpha: 0, duration: 300, onComplete: () => core.destroy() });

    // Onda de calor
    const ring = this.scene.add.graphics();
    ring.lineStyle(4, 0xFF6600, 1);
    ring.strokeCircle(0, 0, 22);
    ring.setPosition(this.x, this.y);
    this.scene.tweens.add({ targets: ring, scaleX: 5, scaleY: 5, alpha: 0, duration: 380, onComplete: () => ring.destroy() });

    // Retroceso de disparo
    this.setVelocityX(-dir * 120);
    this.scene.time.delayedCall(100, () => { if (this.active) this.setVelocityX(0); });

    this.scene.time.delayedCall(this.shootCooldown * 1.5, () => { this.canShoot = true; });
  }

  // ── EFECTOS DE CARGA ───────────────────────────────────────────────────────
  _startChargeEffect() {
    this.chargeGraphic = this.scene.add.circle(this.x, this.y, 6, 0xFF4500, 0.7);
    this.scene.tweens.add({
      targets: this.chargeGraphic,
      scale: 1, duration: this.chargeMinMs,
      ease: 'Quad.easeIn'
    });
  }

  _updateChargeEffect() {
    if (!this.chargeGraphic || !this.chargeGraphic.active) return;
    this.chargeGraphic.setPosition(this.x, this.y);
    const progress = Math.min(1, (this.scene.time.now - this.chargeStartTime) / this.chargeMinMs);
    this.chargeGraphic.setRadius(6 + progress * 20);
    // Cambiar color: naranja → blanco a medida que carga
    const r = 255, g = Math.round(70 + progress * 185), b = Math.round(progress * 255);
    this.chargeGraphic.setFillStyle(Phaser.Display.Color.GetColor(r, g, b), 0.7 + progress * 0.3);
  }

  _clearChargeEffect() {
    if (this.chargeGraphic && this.chargeGraphic.active) {
      this.scene.tweens.add({ targets: this.chargeGraphic, alpha: 0, scale: 4, duration: 200, onComplete: () => { if (this.chargeGraphic) this.chargeGraphic.destroy(); this.chargeGraphic = null; } });
    }
  }

  // ── ESCUDO ORBITAL ─────────────────────────────────────────────────────────
  activateShield() {
    if (!this.canUseShield || this.shieldActive) return;

    this.shieldActive = true;
    this.canUseShield = false;
    this.shieldCards = [];

    for (let i = 0; i < this.maxShieldCards; i++) {
      const angle = (i / this.maxShieldCards) * Math.PI * 2;
      const card = this.scene.add.rectangle(
        this.x + Math.cos(angle) * 42,
        this.y + Math.sin(angle) * 42,
        22, 32, 0xFFD700
      );
      card.setStrokeStyle(2, 0xFF4500);
      card.angle = angle;
      card.orbitSpeed = 0.055;
      card.active = true;

      // Glow pulsante en cada tarjeta
      this.scene.tweens.add({
        targets: card, alpha: 0.6, duration: 400, yoyo: true, repeat: -1
      });

      this.shieldCards.push(card);
    }

    this.scene.events.emit('triangleShield');

    // Onda de activación
    const wave = this.scene.add.graphics();
    wave.lineStyle(3, 0xFFD700, 1);
    wave.strokeCircle(0, 0, 40);
    wave.setPosition(this.x, this.y);
    this.scene.tweens.add({ targets: wave, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 400, onComplete: () => wave.destroy() });

    this.scene.time.delayedCall(5000, () => { this.deactivateShield(); });
    this.scene.time.delayedCall(this.shieldCooldown, () => { this.canUseShield = true; });
  }

  // ── REFLEJO: lanzar tarjetas como proyectiles ──────────────────────────────
  reflectShield() {
    if (!this.shieldActive || this.shieldCards.length === 0) return;

    const activeCards = this.shieldCards.filter(c => c && c.active);
    activeCards.forEach(card => {
      // Emitir fireball desde la posición de cada tarjeta
      this.scene.events.emit('triangleFireball', card.x, card.y, this.flipX, this);

      // Flash dorado
      const flash = this.scene.add.rectangle(card.x, card.y, 22, 32, 0xFFFF00, 1);
      this.scene.tweens.add({ targets: flash, alpha: 0, scale: 3, duration: 250, onComplete: () => flash.destroy() });

      card.destroy();
    });

    this.shieldCards = [];
    this.shieldActive = false;
    this.scene.events.emit('triangleShoot');

    // Flash de reflejo central
    this._fireBurst(this.x, this.y, 20);
  }

  updateShield() {
    if (!this.shieldActive) return;

    this.shieldCards.forEach(card => {
      if (!card.active) return;
      card.angle += card.orbitSpeed;
      card.x = this.x + Math.cos(card.angle) * 42;
      card.y = this.y + Math.sin(card.angle) * 42;
      card.rotation = card.angle;
    });
  }

  blockAttack(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.shieldCards.length) {
      const card = this.shieldCards[cardIndex];
      if (card && card.active) {
        // Efecto de bloqueo más espectacular
        const blockEffect = this.scene.add.circle(card.x, card.y, 28, 0xFFD700, 0.9);
        this.scene.tweens.add({ targets: blockEffect, scale: 2.5, alpha: 0, duration: 300, onComplete: () => blockEffect.destroy() });
        // Chispas
        for (let i = 0; i < 5; i++) {
          const spark = this.scene.add.circle(card.x + Phaser.Math.Between(-12, 12), card.y + Phaser.Math.Between(-12, 12), 4, 0xFFFF00, 1);
          this.scene.tweens.add({ targets: spark, alpha: 0, scale: 0, duration: Phaser.Math.Between(150, 300), onComplete: () => spark.destroy() });
        }

        card.active = false;
        card.destroy();

        const activeCards = this.shieldCards.filter(c => c.active);
        if (activeCards.length === 0) this.shieldActive = false;

        return true;
      }
    }
    return false;
  }

  deactivateShield() {
    this.shieldActive = false;
    this.shieldCards.forEach(card => { if (card && card.active) card.destroy(); });
    this.shieldCards = [];
  }

  canBlockProjectile(projectileX, projectileY) {
    if (!this.shieldActive) return { canBlock: false, cardIndex: -1 };

    for (let i = 0; i < this.shieldCards.length; i++) {
      const card = this.shieldCards[i];
      if (card && card.active) {
        const distance = Phaser.Math.Distance.Between(projectileX, projectileY, card.x, card.y);
        if (distance < 30) return { canBlock: true, cardIndex: i };
      }
    }
    return { canBlock: false, cardIndex: -1 };
  }

  // ── DASH ÉPICO ─────────────────────────────────────────────────────────────
  performDash(dirX = 1, dirY = 0) {
    this.canDash = false;
    this.isDashing = true;
    this.invulnerable = true;

    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    const normX = dirX / magnitude;
    const normY = dirY / magnitude;

    this.setVelocityX(this.dashSpeed * normX);
    this.setVelocityY(this.dashSpeed * normY);

    if (dirX !== 0) this.setFlipX(dirX < 0);
    if (dirY !== 0) this.isInAir = true;

    // 6 afterimages con gradiente de fuego
    const fireColors = [0xFF4500, 0xFF6347, 0xFF0000, 0xFF8C00, 0xFF4500, 0xCC2200];
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 25, () => {
        if (!this.scene) return;
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key);
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setTint(fireColors[i]);
        ghost.setAlpha(0.6 - i * 0.08);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200 + i * 10, onComplete: () => ghost.destroy() });
      });
    }

    // Rastro de chispas de fuego
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 28, () => {
        if (!this.active) return;
        const spark = this.scene.add.circle(this.x, this.y + Phaser.Math.Between(-10, 10), 5, 0xFF4400, 0.9);
        this.scene.tweens.add({ targets: spark, alpha: 0, scaleX: 3, scaleY: 0.4, duration: 220, onComplete: () => spark.destroy() });
      });
    }

    this.setTint(0xFF4500);
    this.alpha = 0.75;
    this.scene.events.emit('triangleDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.clearTint();
      this.alpha = 1;
      if (dirY === 0) this.setVelocityX(0);

      // Mini explosión al final del dash
      this._fireBurst(this.x, this.y, 12);

      // Boost de velocidad breve
      this.speed = 320;
      this.scene.time.delayedCall(600, () => { if (this.active) this.speed = 220; });
    });

    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
      if (!this.isDashing) this.invulnerable = false;
    });
  }

  // ── HELPERS VISUALES ──────────────────────────────────────────────────────

  _fireBurst(x, y, radius) {
    const burst = this.scene.add.circle(x, y, radius, 0xFF4500, 0.9);
    this.scene.tweens.add({ targets: burst, scale: 3.5, alpha: 0, duration: 300, onComplete: () => burst.destroy() });
    // Chispas
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const sp = this.scene.add.circle(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, 3, 0xFF8800, 1);
      this.scene.tweens.add({
        targets: sp,
        x: x + Math.cos(angle) * 40, y: y + Math.sin(angle) * 40,
        alpha: 0, duration: 280, ease: 'Cubic.easeOut',
        onComplete: () => sp.destroy()
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────

  updateSprite() {
    let newState;
    if (this.shieldActive) newState = 'shield';
    else if (this.isInAir) newState = 'jump';
    else newState = 'idle';

    if (newState !== this.currentSpriteState) {
      this.currentSpriteState = newState;
      if (newState === 'shield') this.setTexture('redTriangle_shield');
      else if (newState === 'jump') this.setTexture('redTriangle_jump');
      else this.setTexture('redTriangle');
    }
  }

  takeDamage() {
    if (this.invulnerable) return this.health;

    this.health--;
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

    return this.health;
  }
}
