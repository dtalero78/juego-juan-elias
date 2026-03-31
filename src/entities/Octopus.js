import Phaser from 'phaser';

export default class Octopus extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'villain');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Escalar el villano (más grande e imponente)
    this.setScale(1.2);

    this.setCollideWorldBounds(true);
    this.body.allowGravity = false; // El villano flota
    this.health = 100;
    this.maxHealth = 100;
    this.shootInterval = 2000; // Dispara cada 2 segundos

    // Movimiento solo vertical
    this.moveSpeed = 100;
    this.minY = 100;
    this.maxY = 500;
    this.direction = 1;

    this.stunnedUntil = 0;

    this.phase2Active = false;

    // Sistema de ataques variados
    this.attackTypes = ['normal', 'spread', 'rapid', 'homing', 'bomb', 'star', 'laser'];
    this.currentAttackIndex = 0;

    // Iniciar disparos automáticos
    this.shootTimer = scene.time.addEvent({
      delay: this.shootInterval,
      callback: this.performAttack,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    if (this.scene.time.now < this.stunnedUntil) return;
    // Movimiento solo vertical (arriba y abajo)
    this.y += this.moveSpeed * this.direction * 0.016;

    if (this.y >= this.maxY) {
      this.direction = -1;
    } else if (this.y <= this.minY) {
      this.direction = 1;
    }
  }

  // Realizar ataque aleatorio
  performAttack() {
    if (!this.active) return;

    // Elegir ataque aleatorio
    const attackType = Phaser.Math.RND.pick(this.attackTypes);

    switch (attackType) {
      case 'normal':
        this.attackNormal();
        break;
      case 'spread':
        this.attackSpread();
        break;
      case 'rapid':
        this.attackRapid();
        break;
      case 'homing':
        this.attackHoming();
        break;
      case 'bomb':
        this.attackBomb();
        break;
    }
  }

  // Ataque 1: Disparo normal
  attackNormal() {
    this.scene.events.emit('octopusShoot', this.x - 40, this.y, 'normal');
  }

  // Ataque 2: Disparo en abanico (3 balas)
  attackSpread() {
    [-20, 0, 20].forEach(angle => {
      this.scene.events.emit('octopusShoot', this.x - 40, this.y, 'spread', angle);
    });
  }

  // Ataque 3: Ráfaga rápida (5 balas seguidas)
  attackRapid() {
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        if (this.active) {
          this.scene.events.emit('octopusShoot', this.x - 40, this.y, 'rapid');
        }
      });
    }
  }

  // Ataque 4: Bala teledirigida
  attackHoming() {
    this.scene.events.emit('octopusShoot', this.x - 40, this.y, 'homing');
  }

  // Ataque 5: Bomba que explota
  attackBomb() {
    this.scene.events.emit('octopusShoot', this.x - 40, this.y, 'bomb');
  }

  // Ataque 6: Estrella — 6 balas en 360°
  attackStar() {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this.scene.time.delayedCall(i * 80, () => {
        if (this.active) this.scene.events.emit('octopusShoot', this.x, this.y, 'star', angle);
      });
    }
  }

  // Ataque 7: Láser — 10 balas rápidas en ráfaga
  attackLaser() {
    for (let i = 0; i < 10; i++) {
      this.scene.time.delayedCall(i * 70, () => {
        if (this.active) this.scene.events.emit('octopusShoot', this.x - 40, this.y, 'laser');
      });
    }
  }

  activatePhase2() {
    if (this.phase2Active) return;
    this.phase2Active = true;
    // Acelerar disparos
    if (this.shootTimer) this.shootTimer.remove();
    this.shootInterval = 1200;
    this.shootTimer = this.scene.time.addEvent({
      delay: this.shootInterval,
      callback: this.performAttack,
      callbackScope: this,
      loop: true
    });
    this.scene.events.emit('octopusPhase2');
  }

  takeDamage() {
    this.health--;

    if (!this.phase2Active && this.health <= 50) this.activatePhase2();

    // Efecto visual de daño
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    if (this.health <= 0) {
      console.log('Octopus murió, llamando die()');
      this.die();
    }

    return this.health;
  }

  die() {
    console.log('Octopus die() llamado');
    if (this.shootTimer) {
      this.shootTimer.remove();
    }
    this.scene.events.emit('octopusDied');
    this.setActive(false);
    this.setVisible(false);
    console.log('Octopus después de die - active:', this.active, 'visible:', this.visible);
  }
}
