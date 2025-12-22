import Phaser from 'phaser';

export default class OctopusBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'octopusBullet');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 200;
    this.setVelocityX(-this.speed);
  }

  update() {
    // Desactivar si sale de la pantalla
    if (this.x < -50) {
      this.setActive(false);
      this.setVisible(false);
      this.body.stop();
    }
  }
}
