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
    this.barrageTimer = null;
    this.shootingPaused = false;
    this.stunnedUntil = 0;
    this.startPhase1();
  }

  setTarget(target) {
    this.target = target;
  }

  startPhase1() {
    this.shootTimer = this.scene.time.addEvent({
      delay: 4000,
      callback: () => {
        if (this.active && this.phase === 1 && !this.shootingPaused) {
          this.scene.events.emit('finalBossSpread', this.x, this.y, this.target);
        }
      },
      loop: true
    });
    // Ráfaga cada 9s: 5 disparos rápidos + sacudida de pantalla
    this.barrageTimer = this.scene.time.addEvent({
      delay: 9000,
      callback: () => {
        if (!this.active || this.phase !== 1 || this.shootingPaused) return;
        this.setTint(0xFF0000);
        this.setScale(1.0);
        if (this.scene.cameras) this.scene.cameras.main.shake(220, 0.014);
        for (let i = 0; i < 5; i++) {
          this.scene.time.delayedCall(i * 280, () => {
            if (this.active && !this.shootingPaused) {
              this.scene.events.emit('finalBossSpread', this.x, this.y, this.target);
            }
          });
        }
        this.scene.time.delayedCall(350, () => { if (this.active) { this.clearTint(); this.setScale(0.75); } });
      },
      loop: true
    });
  }

  transitionToPhase2() {
    this.phase = 2;
    this.health = 250;
    this.maxHealth = 250;

    if (this.shootTimer) this.shootTimer.remove();
    if (this.barrageTimer) { this.barrageTimer.remove(); this.barrageTimer = null; }

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
        delay: 4000,
        callback: () => {
          if (this.active && this.phase === 2 && !this.shootingPaused) {
            this.scene.events.emit('finalBossRay', this.x, this.y, this.target);
          }
        },
        loop: true
      });
      // Triple ray burst cada 8s
      this.barrageTimer = this.scene.time.addEvent({
        delay: 8000,
        callback: () => {
          if (!this.active || this.phase !== 2 || this.shootingPaused) return;
          if (this.scene.cameras) this.scene.cameras.main.shake(250, 0.016);
          for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 380, () => {
              if (this.active && !this.shootingPaused) {
                this.scene.events.emit('finalBossRay', this.x, this.y, this.target);
              }
            });
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
        if (this.barrageTimer) this.barrageTimer.remove();
        this.scene.events.emit('finalBossDied');
        this.setActive(false);
        this.setVisible(false);
      }
    }

    return this.health;
  }
}
