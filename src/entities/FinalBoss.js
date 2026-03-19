import Phaser from 'phaser';

export default class FinalBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'finalBoss');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.75);
    this.body.allowGravity = false;
    this.setCollideWorldBounds(true);

    this.phase = 1;
    this.health = 500;
    this.maxHealth = 500;

    this.target = null;
    this.baseX = x;
    this.baseY = y;

    // Movimiento fase 1 (lento) y fase 2 (rápido)
    this.moveSpeed = 320;
    this.phase1MoveSpeed = 80;
    this.moveDir = 1;
    this.floatTime = 0;

    this.shootTimer = null;
    this.shootingPaused = false;
    this.stunnedUntil = 0;
    this.startPhase1();
  }

  setTarget(target) {
    this.target = target;
  }

  startPhase1() {
    this.shootTimer = this.scene.time.addEvent({
      delay: 5000,
      callback: () => {
        if (this.active && this.phase === 1 && !this.shootingPaused) {
          this.scene.events.emit('finalBossSpread', this.x, this.y, this.target);
        }
      },
      loop: true
    });
  }

  transitionToPhase2() {
    this.phase = 2;
    this.health = 250;
    this.maxHealth = 250;

    if (this.shootTimer) this.shootTimer.remove();

    let flashes = 0;
    const flashTimer = this.scene.time.addEvent({
      delay: 120,
      callback: () => {
        this.setVisible(!this.visible);
        flashes++;
        if (flashes >= 12) {
          flashTimer.remove();
          this.setVisible(true);
          this.setTexture('finalBossP2');
          this.setTint(0xFF6600);
          this.setScale(0.85);
        }
      },
      loop: true
    });

    this.scene.events.emit('finalBossPhase2');

    this.scene.time.delayedCall(1500, () => {
      if (!this.active) return;
      this.shootTimer = this.scene.time.addEvent({
        delay: 5000,
        callback: () => {
          if (this.active && this.phase === 2 && !this.shootingPaused) {
            this.scene.events.emit('finalBossRay', this.x, this.y, this.target);
          }
        },
        loop: true
      });
    });
  }

  update() {
    if (!this.active) return;
    if (this.scene.time.now < this.stunnedUntil) return;

    this.floatTime += 0.03;

    if (this.phase === 2) {
      this.x += this.moveSpeed * this.moveDir * (1 / 60);
      if (this.x > 730) this.moveDir = -1;
      if (this.x < 70) this.moveDir = 1;

      if (this.target && this.target.active) {
        const dy = this.target.y - this.y;
        this.y += Math.sign(dy) * 3;
      }
      this.y = Phaser.Math.Clamp(this.y, 80, 490);
    } else {
      if (this.target && this.target.active) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        this.x += Math.sign(dx) * this.phase1MoveSpeed * (1 / 60);
        this.y += Math.sign(dy) * this.phase1MoveSpeed * (1 / 60);
      }
      this.y = Phaser.Math.Clamp(this.y, 80, 490);
    }
  }

  takeDamage() {
    if (!this.active) return this.health;

    this.health -= 2;

    if (this.health <= 0) {
      if (this.phase === 1) {
        this.transitionToPhase2();
      } else {
        if (this.shootTimer) this.shootTimer.remove();
        this.scene.events.emit('finalBossDied');
        this.setActive(false);
        this.setVisible(false);
      }
    }

    return this.health;
  }
}
