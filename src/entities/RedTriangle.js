import Phaser from 'phaser';

export default class RedTriangle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'redTriangle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Escala
    this.setScale(0.9);

    // Hitbox
    this.body.setSize(this.width * 0.6, this.height * 0.7);
    this.body.setOffset(this.width * 0.2, this.height * 0.15);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);

    // Movimiento
    this.speed = 220;
    this.jumpForce = -500;

    // Vida
    this.health = 3;
    this.maxHealth = 3;
    this.invulnerable = false;
    this.invulnerabilityTime = 1000;

    // Sistema de ataques
    this.canShoot = true;
    this.shootCooldown = 400;

    // Tarjetas bloqueadoras (escudo)
    this.shieldActive = false;
    this.shieldCards = [];
    this.maxShieldCards = 3;
    this.shieldCooldown = 3000;
    this.canUseShield = true;

    // Bola de fuego grande
    this.fireballReady = true;
    this.fireballCooldown = 2000;

    // Control de salto
    this.isInAir = false;

    // Estado del sprite
    this.currentSpriteState = 'idle';

    // Dash
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 850;
    this.dashDuration = 180;
    this.dashCooldown = 650;
  }

  update(cursors, wasd, spaceBar, xKey) {
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

    // Detectar suelo
    const onGround = this.body.blocked.down || this.body.touching.down;

    // Saltar
    if ((cursors.up.isDown || wasd.w.isDown) && onGround) {
      this.setVelocityY(this.jumpForce);
      this.isInAir = true;
      this.scene.events.emit('triangleJump');
    }

    // Dash direccional con X
    if (xKey && xKey.isDown && this.canDash) {
      let dashDirX = 0;
      let dashDirY = 0;

      if (wasd.w.isDown || cursors.up.isDown) dashDirY = -1;
      if (wasd.s.isDown || cursors.down.isDown) dashDirY = 1;
      if (wasd.a.isDown || cursors.left.isDown) dashDirX = -1;
      if (wasd.d.isDown || cursors.right.isDown) dashDirX = 1;

      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = this.flipX ? -1 : 1;
      }

      this.performDash(dashDirX, dashDirY);
    }

    // Aterrizaje
    if (onGround && Math.abs(this.body.velocity.y) < 20) {
      this.isInAir = false;
    }

    // Disparar bola de fuego con espacio
    if (spaceBar.isDown && this.canShoot) {
      this.shootFireball();
    }

    // Actualizar escudo si está activo
    this.updateShield();

    // Actualizar sprite
    this.updateSprite();
  }

  shootFireball() {
    this.canShoot = false;

    // Emitir evento para crear bola de fuego grande
    this.scene.events.emit('triangleFireball', this.x, this.y, this.flipX);
    this.scene.events.emit('triangleShoot');

    // Efecto visual de disparo
    const fireEffect = this.add ? null : this.scene.add.circle(
      this.x + (this.flipX ? -20 : 20),
      this.y,
      15,
      0xFF4500,
      0.8
    );

    if (fireEffect) {
      this.scene.tweens.add({
        targets: fireEffect,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => fireEffect.destroy()
      });
    }

    // Cooldown
    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });
  }

  // Activar escudo de tarjetas (llamado por evento externo o automático)
  activateShield() {
    if (!this.canUseShield || this.shieldActive) return;

    this.shieldActive = true;
    this.canUseShield = false;
    this.shieldCards = [];

    // Crear 3 tarjetas orbitando
    for (let i = 0; i < this.maxShieldCards; i++) {
      const angle = (i / this.maxShieldCards) * Math.PI * 2;
      const card = this.scene.add.rectangle(
        this.x + Math.cos(angle) * 40,
        this.y + Math.sin(angle) * 40,
        20,
        30,
        0xFFD700
      );
      card.setStrokeStyle(2, 0xFF8C00);
      card.angle = angle;
      card.orbitSpeed = 0.05;
      card.active = true;
      this.shieldCards.push(card);
    }

    this.scene.events.emit('triangleShield');

    // Escudo dura 5 segundos
    this.scene.time.delayedCall(5000, () => {
      this.deactivateShield();
    });

    // Cooldown del escudo
    this.scene.time.delayedCall(this.shieldCooldown, () => {
      this.canUseShield = true;
    });
  }

  updateShield() {
    if (!this.shieldActive) return;

    this.shieldCards.forEach((card, index) => {
      if (!card.active) return;

      card.angle += card.orbitSpeed;
      card.x = this.x + Math.cos(card.angle) * 40;
      card.y = this.y + Math.sin(card.angle) * 40;
      card.rotation = card.angle;
    });
  }

  // Llamado cuando una tarjeta bloquea un ataque
  blockAttack(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.shieldCards.length) {
      const card = this.shieldCards[cardIndex];
      if (card && card.active) {
        // Efecto de bloqueo
        const blockEffect = this.scene.add.circle(card.x, card.y, 25, 0xFFD700, 0.8);
        this.scene.tweens.add({
          targets: blockEffect,
          scale: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => blockEffect.destroy()
        });

        card.active = false;
        card.destroy();

        // Verificar si quedan tarjetas
        const activeCards = this.shieldCards.filter(c => c.active);
        if (activeCards.length === 0) {
          this.shieldActive = false;
        }

        return true; // Ataque bloqueado
      }
    }
    return false;
  }

  deactivateShield() {
    this.shieldActive = false;
    this.shieldCards.forEach(card => {
      if (card && card.active) {
        card.destroy();
      }
    });
    this.shieldCards = [];
  }

  // Verificar si el escudo puede bloquear un proyectil
  canBlockProjectile(projectileX, projectileY) {
    if (!this.shieldActive) return { canBlock: false, cardIndex: -1 };

    for (let i = 0; i < this.shieldCards.length; i++) {
      const card = this.shieldCards[i];
      if (card && card.active) {
        const distance = Phaser.Math.Distance.Between(projectileX, projectileY, card.x, card.y);
        if (distance < 30) {
          return { canBlock: true, cardIndex: i };
        }
      }
    }
    return { canBlock: false, cardIndex: -1 };
  }

  performDash(dirX = 1, dirY = 0) {
    this.canDash = false;
    this.isDashing = true;

    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    const normX = dirX / magnitude;
    const normY = dirY / magnitude;

    this.setVelocityX(this.dashSpeed * normX);
    this.setVelocityY(this.dashSpeed * normY);

    if (dirX !== 0) {
      this.setFlipX(dirX < 0);
    }

    if (dirY !== 0) {
      this.isInAir = true;
    }

    // Efecto visual - trail de fuego
    this.setTint(0xFF4500);
    this.alpha = 0.7;
    this.createDashTrail();

    this.scene.events.emit('triangleDash');

    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.clearTint();
      this.alpha = 1;
      if (dirY === 0) {
        this.setVelocityX(0);
      }
    });

    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  createDashTrail() {
    const colors = [0xFF4500, 0xFF6347, 0xFF0000];
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        if (!this.scene) return;
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key);
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setTint(colors[i]);
        ghost.setAlpha(0.6 - i * 0.15);

        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 200,
          onComplete: () => ghost.destroy()
        });
      });
    }
  }

  updateSprite() {
    let newState;

    if (this.shieldActive) {
      newState = 'shield';
    } else if (this.isInAir) {
      newState = 'jump';
    } else {
      newState = 'idle';
    }

    if (newState !== this.currentSpriteState) {
      this.currentSpriteState = newState;
      if (newState === 'shield') {
        this.setTexture('redTriangle_shield');
      } else if (newState === 'jump') {
        this.setTexture('redTriangle_jump');
      } else {
        this.setTexture('redTriangle');
      }
    }
  }

  takeDamage() {
    if (this.invulnerable) return this.health;

    this.health--;
    this.invulnerable = true;

    // Efecto de parpadeo
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
