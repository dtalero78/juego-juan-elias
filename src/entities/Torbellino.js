import Phaser from 'phaser';

export default class Torbellino extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'clonTorbellino');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);

    this.speed = 380;
    this.setActive(false);
    this.setVisible(false);

    this.setScale(0.4);
  }

  fire(x, y, direction = 1) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.body.setAllowGravity(false);
    this.setVelocityX(this.speed * direction);
    this.setVelocityY(0);

    // Rotación continua del torbellino
    this.scene.tweens.add({
      targets: this,
      angle: 360 * direction,
      duration: 400,
      repeat: -1
    });
  }

  update() {
    if (!this.active) return;

    if (this.x > this.scene.cameras.main.width + 50 || this.x < -50) {
      this.setActive(false);
      this.setVisible(false);
      this.body.stop();
      this.setAngle(0);
      this.scene.tweens.killTweensOf(this);
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.active) {
      this.update();
    }
  }
}
