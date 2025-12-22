import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 400;
    this.setVelocityX(this.speed);
  }

  update() {
    // Desactivar si sale de la pantalla
    if (this.x > this.scene.cameras.main.width + 50) {
      this.setActive(false);
      this.setVisible(false);
      this.body.stop();
    }
  }
}
