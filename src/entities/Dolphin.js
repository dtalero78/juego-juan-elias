import Phaser from 'phaser';

export default class Dolphin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, selectedBullets = ['normal', 'fire'], isPvPMode = false) {
    super(scene, x, y, 'dolphin');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.5);

    this.body.setSize(this.width * 0.6, this.height * 0.8);
    this.body.setOffset(this.width * 0.2, this.height * 0.1);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);
    this.speed = 230;
    this.jumpForce = -510;
    this.canShoot = true;
    this.shootCooldown = 220;

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

    this.selectedBullets = selectedBullets;
    this.bulletType = selectedBullets[0];
    this.ammo = {};

    const initialAmmo = {
      normal:   25,
      fire:     18,
      ice:      6,
      triple:   10,
      fast:     18,
      teleport: 5,
      xmas:     8
    };

    selectedBullets.forEach(type => {
      this.ammo[type] = initialAmmo[type] || 15;
    });

    if (isPvPMode) {
      this.ammo[this.bulletType] = 50;
    }

    this.isAttacking = false;
    this.attackDuration = 180;

    this.isInAir = false;
    this.currentSpriteState = 'idle';

    this.specialCooldowns = {
      ice: { cooldown: 8000, canShoot: true }
    };

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 950;
    this.dashDuration = 190;
    this.dashCooldown = 580;

    // Doble salto
    this.jumpsLeft = 2;
    this.wasUpDown = false;

    // Modo Frenesí
    this.recentShotTimes = [];
    this.frenzyActive = false;
    this.frenzyAura = null;
    this.normalCooldown = 220;
    this.frenzyMultiplier = 1;
  }

  update(cursors, wasd, spaceBar, xKey) {
    if (this.isDashing) return;

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
        this.scene.events.emit('dolphinJump');
      } else if (this.jumpsLeft > 0) {
        this.setVelocityY(this.jumpForce * 0.85);
        this.jumpsLeft--;
        this.scene.events.emit('dolphinJump');
        // Explosión acuática en los pies
        this._aquaBurst(this.x, this.y + 20);
      }
    }
    this.wasUpDown = upPressed;

    // Dash direccional con X
    if (xKey && xKey.isDown && this.canDash) {
      let dashDirX = 0, dashDirY = 0;
      if (wasd.w.isDown || cursors.up.isDown) dashDirY = -1;
      if (wasd.s.isDown || cursors.down.isDown) dashDirY = 1;
      if (wasd.a.isDown || cursors.left.isDown) dashDirX = -1;
      if (wasd.d.isDown || cursors.right.isDown) dashDirX = 1;
      if (dashDirX === 0 && dashDirY === 0) dashDirX = this.flipX ? -1 : 1;
      this.performDash(dashDirX, dashDirY);
    }

    // Estado del sprite
    let newState;
    if (this.isAttacking) newState = 'attack';
    else if (this.isInAir) newState = 'jump';
    else newState = 'idle';

    if (newState !== this.currentSpriteState) {
      this.currentSpriteState = newState;
      if (newState === 'attack') this.setTexture('dolphin_attack');
      else if (newState === 'jump') this.setTexture('dolphin_jump');
      else this.setTexture('dolphin');
    }

    if (spaceBar.isDown && this.canShoot && this.getTotalAmmo() > 0) {
      this.shoot();
    }

    this._updateFrenzyAura();
  }

  shoot() {
    if (this.ammo[this.bulletType] <= 0) {
      this.switchToAvailableAmmo();
      if (this.getTotalAmmo() <= 0) return;
    }

    if (this.bulletType === 'ice' && this.specialCooldowns.ice && !this.specialCooldowns.ice.canShoot) {
      return;
    }

    this.canShoot = false;
    this.isAttacking = true;

    this.ammo[this.bulletType]--;

    // Rastrear disparos para frenesí
    const now = this.scene.time.now;
    this.recentShotTimes = this.recentShotTimes.filter(t => now - t < 3000);
    this.recentShotTimes.push(now);
    if (this.recentShotTimes.length >= 5 && !this.frenzyActive) {
      this._activateFrenzy();
    }

    // Flash de disparo según tipo
    this._muzzleFlash(this.bulletType);

    // En frenesí: emit con multiplicador
    this.scene.events.emit('dolphinShoot', this.x + 20, this.y, this.bulletType, this.flipX, this, this.frenzyMultiplier);

    this.scene.time.delayedCall(this.attackDuration, () => { this.isAttacking = false; });

    if (this.bulletType === 'ice') {
      this.specialCooldowns.ice.canShoot = false;
      this.scene.time.delayedCall(8000, () => { this.specialCooldowns.ice.canShoot = true; });
    }

    const cd = this.frenzyActive ? 130 : this.normalCooldown;
    this.scene.time.delayedCall(cd, () => { this.canShoot = true; });
  }

  getTotalAmmo() {
    return Object.values(this.ammo).reduce((a, b) => a + b, 0);
  }

  switchToAvailableAmmo() {
    for (const type of this.selectedBullets) {
      if (this.ammo[type] > 0) { this.bulletType = type; return; }
    }
  }

  addAmmo(type, amount) {
    if (this.ammo.hasOwnProperty(type)) this.ammo[type] += amount;
  }

  reloadAmmo(amount = 50) {
    if (this.ammo.hasOwnProperty(this.bulletType)) this.ammo[this.bulletType] += amount;
  }

  changeBulletType(type) {
    if (this.ammo.hasOwnProperty(type) && this.ammo[type] > 0) this.bulletType = type;
  }

  nextBulletType() {
    const currentIndex = this.selectedBullets.indexOf(this.bulletType);
    for (let i = 1; i <= this.selectedBullets.length; i++) {
      const nextIndex = (currentIndex + i) % this.selectedBullets.length;
      const nextType = this.selectedBullets[nextIndex];
      if (this.ammo[nextType] > 0) { this.bulletType = nextType; return this.bulletType; }
    }
    return this.bulletType;
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

    // 7 afterimages en degradé cian→azul
    const dashColors = [0x00FFFF, 0x00E5FF, 0x00BFFF, 0x1E90FF, 0x00FFFF, 0x40E0D0, 0x00CED1];
    for (let i = 0; i < 7; i++) {
      this.scene.time.delayedCall(i * 22, () => {
        if (!this.scene) return;
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key);
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setTint(dashColors[i]);
        ghost.setAlpha(0.6 - i * 0.07);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 180 + i * 10, onComplete: () => ghost.destroy() });
      });
    }

    // Burbujas de agua durante el dash
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 25, () => {
        if (!this.active) return;
        const bub = this.scene.add.circle(
          this.x + Phaser.Math.Between(-12, 12),
          this.y + Phaser.Math.Between(-12, 12),
          Phaser.Math.Between(3, 7), 0x00FFFF, 0.8
        );
        this.scene.tweens.add({ targets: bub, alpha: 0, scaleX: 2.5, scaleY: 0.5, duration: 230, onComplete: () => bub.destroy() });
      });
    }

    this.setTint(0x00FFFF);
    this.alpha = 0.7;

    // Dash dispara 2 balas automáticamente en la dirección del movimiento
    this.scene.time.delayedCall(30, () => {
      if (!this.active) return;
      this.scene.events.emit('dolphinShoot', this.x, this.y, this.bulletType, normX < 0, this, this.frenzyMultiplier);
    });
    this.scene.time.delayedCall(110, () => {
      if (!this.active) return;
      this.scene.events.emit('dolphinShoot', this.x, this.y, this.bulletType, normX < 0, this, this.frenzyMultiplier);
    });

    this.scene.events.emit('dolphinDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.clearTint();
      this.alpha = 1;
      if (dirY === 0) this.setVelocityX(0);

      // Explosión acuática al final
      this._aquaBurst(this.x, this.y);

      // Boost de velocidad breve
      this.speed = 330;
      this.scene.time.delayedCall(650, () => { if (this.active) this.speed = 230; });
    });

    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
      if (!this.isDashing) this.invulnerable = false;
    });
  }

  // ── MODO FRENESÍ ───────────────────────────────────────────────────────────
  _activateFrenzy() {
    this.frenzyActive = true;
    this.frenzyMultiplier = 1.5;
    this.recentShotTimes = [];

    // Aura cian pulsante orbitando alrededor del jugador
    this.frenzyAura = this.scene.add.graphics();
    this.frenzyAura.lineStyle(3, 0x00FFFF, 0.9);
    this.frenzyAura.strokeCircle(0, 0, 28);
    this.scene.tweens.add({
      targets: this.frenzyAura,
      alpha: 0.3, scaleX: 1.4, scaleY: 1.4,
      duration: 220, yoyo: true, repeat: -1
    });

    // Anuncio "¡FRENESÍ!"
    this.scene.events.emit('dolphinFrenzy', true);

    // Chispas de activación
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const sp = this.scene.add.circle(this.x + Math.cos(angle) * 22, this.y + Math.sin(angle) * 22, 5, 0x00FFFF, 1);
      this.scene.tweens.add({
        targets: sp,
        x: this.x + Math.cos(angle) * 70, y: this.y + Math.sin(angle) * 70,
        alpha: 0, duration: 400, ease: 'Cubic.easeOut', onComplete: () => sp.destroy()
      });
    }

    // Duración del frenesí: 3.5s
    this.scene.time.delayedCall(3500, () => {
      this.frenzyActive = false;
      this.frenzyMultiplier = 1;
      if (this.frenzyAura) { this.scene.tweens.killTweensOf(this.frenzyAura); this.frenzyAura.destroy(); this.frenzyAura = null; }
      this.scene.events.emit('dolphinFrenzy', false);
    });
  }

  // Actualizar posición del aura en update
  _updateFrenzyAura() {
    if (this.frenzyAura && this.frenzyAura.active) {
      this.frenzyAura.setPosition(this.x, this.y);
    }
  }

  // ── HELPERS VISUALES ──────────────────────────────────────────────────────

  _aquaBurst(x, y) {
    const core = this.scene.add.circle(x, y, 10, 0x00FFFF, 0.9);
    this.scene.tweens.add({ targets: core, scale: 3.5, alpha: 0, duration: 300, onComplete: () => core.destroy() });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const drop = this.scene.add.circle(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, 4, 0x40E0D0, 1);
      this.scene.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * 45, y: y + Math.sin(angle) * 45,
        alpha: 0, duration: 280, ease: 'Cubic.easeOut', onComplete: () => drop.destroy()
      });
    }
  }

  _muzzleFlash(bulletType) {
    const dir = this.flipX ? -1 : 1;
    const fx = this.x + dir * 28;
    const fy = this.y;

    const colors = {
      normal:   0x00FFFF,
      fire:     0xFF4500,
      ice:      0xADD8E6,
      triple:   0xFFFF00,
      fast:     0xFFFF00,
      teleport: 0xCC00FF,
      xmas:     0xFF3333
    };

    const color = colors[bulletType] || 0xFFFFFF;
    const flash = this.scene.add.circle(fx, fy, 9, color, 0.95);
    this.scene.tweens.add({ targets: flash, scale: 0, alpha: 0, duration: 160, onComplete: () => flash.destroy() });
  }

  // ──────────────────────────────────────────────────────────────────────────

  takeDamage() {
    if (this.invulnerable) return this.health;

    this.health--;
    this.invulnerable = true;

    this.scene.tweens.add({
      targets: this, alpha: 0.3, duration: 100, yoyo: true, repeat: 5
    });

    this.scene.time.delayedCall(this.invulnerabilityTime, () => {
      this.invulnerable = false;
      this.alpha = 1;
    });

    return this.health;
  }
}
