import Phaser from 'phaser';

export default class Dolphin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, selectedBullets = ['normal', 'fire']) {
    super(scene, x, y, 'dolphin');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Hacer el delfín más pequeño
    this.setScale(0.5);

    // Reducir hitbox - ajustado para mejor colisión con el suelo
    this.body.setSize(this.width * 0.6, this.height * 0.8);
    this.body.setOffset(this.width * 0.2, this.height * 0.1);

    this.setCollideWorldBounds(true);
    this.body.setCollideWorldBounds(true);
    this.speed = 220;
    this.jumpForce = -500; // Aumentado para alcanzar plataformas
    this.canShoot = true;
    this.shootCooldown = 250; // ms entre disparos
    this.health = 3;
    this.maxHealth = 3;
    this.invulnerable = false;
    this.invulnerabilityTime = 1000;

    // Guardar tipos de bala seleccionados
    this.selectedBullets = selectedBullets;

    // Sistema de tipos de bala con munición limitada (solo los seleccionados)
    this.bulletType = selectedBullets[0];
    this.ammo = {};

    // Inicializar munición solo para los tipos seleccionados
    const initialAmmo = {
      normal: 20,
      fire: 15,
      ice: 15,
      triple: 10,
      fast: 15,
      teleport: 5,
      xmas: 8
    };

    selectedBullets.forEach(type => {
      this.ammo[type] = initialAmmo[type] || 15;
    });

    // Control de animación de ataque
    this.isAttacking = false;
    this.attackDuration = 200; // ms que dura la animación de ataque

    // Control de salto - usar flag manual en lugar de detectar colisión
    this.isInAir = false;

    // Estado actual del sprite para evitar parpadeo
    this.currentSpriteState = 'idle'; // 'idle', 'jump', 'attack'

    // Cooldowns especiales por tipo de bala
    this.specialCooldowns = {
      ice: { cooldown: 10000, canShoot: true } // 10 segundos para hielo
    };

    // Dash - mejorado: más rápido, más lejos, direccional
    this.canDash = true;
    this.isDashing = false;
    this.dashSpeed = 900; // Más rápido (era 600)
    this.dashDuration = 200; // Más duración = más lejos (era 150)
    this.dashCooldown = 600; // Cooldown más corto (era 800)
  }

  update(cursors, wasd, spaceBar, xKey) {
    // Si está en dash, no permitir control normal
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

    // Detectar si está en el suelo
    const onGround = this.body.blocked.down || this.body.touching.down;

    // Saltar (solo si está en el suelo)
    if ((cursors.up.isDown || wasd.w.isDown) && onGround) {
      this.setVelocityY(this.jumpForce);
      this.isInAir = true; // Marcamos que saltó
      this.scene.events.emit('dolphinJump');
    }

    // Dash con X - direccional según WASD
    if (xKey && xKey.isDown && this.canDash) {
      // Determinar dirección del dash
      let dashDirX = 0;
      let dashDirY = 0;

      if (wasd.w.isDown || cursors.up.isDown) dashDirY = -1;
      if (wasd.s.isDown || cursors.down.isDown) dashDirY = 1;
      if (wasd.a.isDown || cursors.left.isDown) dashDirX = -1;
      if (wasd.d.isDown || cursors.right.isDown) dashDirX = 1;

      // Si no hay dirección, usar la dirección donde mira
      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = this.flipX ? -1 : 1;
      }

      this.performDash(dashDirX, dashDirY);
    }

    // Si aterrizó (velocidad Y es casi 0 y está tocando suelo)
    if (onGround && Math.abs(this.body.velocity.y) < 20) {
      this.isInAir = false;
    }

    // Determinar sprite basado en isInAir (controlado manualmente, no parpadea)
    let newState;

    if (this.isAttacking) {
      newState = 'attack';
    } else if (this.isInAir) {
      newState = 'jump';
    } else {
      newState = 'idle';
    }

    // Solo cambiar textura si el estado realmente cambió
    if (newState !== this.currentSpriteState) {
      this.currentSpriteState = newState;
      if (newState === 'attack') {
        this.setTexture('dolphin_attack');
      } else if (newState === 'jump') {
        this.setTexture('dolphin_jump');
      } else {
        this.setTexture('dolphin');
      }
    }

    // Disparar
    if (spaceBar.isDown && this.canShoot && this.getTotalAmmo() > 0) {
      this.shoot();
    }
  }

  shoot() {
    // Verificar que tiene munición del tipo actual
    if (this.ammo[this.bulletType] <= 0) {
      // Cambiar a un tipo que tenga munición
      this.switchToAvailableAmmo();
      if (this.getTotalAmmo() <= 0) return;
    }

    // Verificar cooldown especial para balas de hielo
    if (this.bulletType === 'ice' && this.specialCooldowns.ice && !this.specialCooldowns.ice.canShoot) {
      return; // No puede disparar hielo todavía
    }

    this.canShoot = false;
    this.isAttacking = true;

    // Consumir munición
    this.ammo[this.bulletType]--;

    // Emitir evento de disparo con el tipo de bala
    this.scene.events.emit('dolphinShoot', this.x + 20, this.y, this.bulletType);

    // Terminar animación de ataque
    this.scene.time.delayedCall(this.attackDuration, () => {
      this.isAttacking = false;
    });

    // Cooldown especial para balas de hielo (10 segundos)
    if (this.bulletType === 'ice') {
      this.specialCooldowns.ice.canShoot = false;
      this.scene.time.delayedCall(10000, () => {
        this.specialCooldowns.ice.canShoot = true;
      });
    }

    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });
  }

  // Obtener total de munición
  getTotalAmmo() {
    return Object.values(this.ammo).reduce((a, b) => a + b, 0);
  }

  // Cambiar a munición disponible (solo entre los seleccionados)
  switchToAvailableAmmo() {
    for (const type of this.selectedBullets) {
      if (this.ammo[type] > 0) {
        this.bulletType = type;
        return;
      }
    }
  }

  // Añadir munición
  addAmmo(type, amount) {
    if (this.ammo.hasOwnProperty(type)) {
      this.ammo[type] += amount;
    }
  }

  // Cambiar tipo de bala (se puede llamar con powerups)
  changeBulletType(type) {
    if (this.ammo.hasOwnProperty(type) && this.ammo[type] > 0) {
      this.bulletType = type;
    }
  }

  // Ciclar entre tipos de bala disponibles (solo los seleccionados)
  nextBulletType() {
    const currentIndex = this.selectedBullets.indexOf(this.bulletType);
    for (let i = 1; i <= this.selectedBullets.length; i++) {
      const nextIndex = (currentIndex + i) % this.selectedBullets.length;
      const nextType = this.selectedBullets[nextIndex];
      if (this.ammo[nextType] > 0) {
        this.bulletType = nextType;
        return this.bulletType;
      }
    }
    return this.bulletType;
  }

  // Realizar dash - direccional (X+W=arriba, X+S=abajo, X+A=izq, X+D=der)
  performDash(dirX = 1, dirY = 0) {
    this.canDash = false;
    this.isDashing = true;

    // Normalizar dirección si es diagonal
    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    const normX = dirX / magnitude;
    const normY = dirY / magnitude;

    // Aplicar velocidad de dash en la dirección indicada
    this.setVelocityX(this.dashSpeed * normX);
    this.setVelocityY(this.dashSpeed * normY);

    // Voltear sprite según dirección horizontal
    if (dirX !== 0) {
      this.setFlipX(dirX < 0);
    }

    // Si hay dash vertical, marcar como en el aire
    if (dirY !== 0) {
      this.isInAir = true;
    }

    // Efecto visual mejorado
    this.setTint(0x00FFFF);
    this.alpha = 0.6;

    // Crear efecto de estela
    this.createDashTrail();

    // Emitir evento de sonido
    this.scene.events.emit('dolphinDash');

    // Terminar dash después de la duración
    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.clearTint();
      this.alpha = 1;
      // Solo detener velocidad horizontal si no estaba en dirección vertical
      if (dirY === 0) {
        this.setVelocityX(0);
      }
    });

    // Cooldown del dash
    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  // Crear efecto de estela durante el dash
  createDashTrail() {
    // Crear 3 copias fantasma que desaparecen
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 40, () => {
        if (!this.scene) return;
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key);
        ghost.setScale(this.scaleX, this.scaleY);
        ghost.setFlipX(this.flipX);
        ghost.setTint(0x00FFFF);
        ghost.setAlpha(0.5 - i * 0.15);

        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 150,
          onComplete: () => ghost.destroy()
        });
      });
    }
  }

  takeDamage() {
    if (this.invulnerable) return this.health;

    this.health--;
    this.invulnerable = true;

    // Efecto visual de parpadeo
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5
    });

    // Quitar invulnerabilidad después de un tiempo
    this.scene.time.delayedCall(this.invulnerabilityTime, () => {
      this.invulnerable = false;
      this.alpha = 1;
    });

    return this.health;
  }
}
