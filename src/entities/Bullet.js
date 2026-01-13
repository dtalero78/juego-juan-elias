import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 400;
    this.setActive(false);
    this.setVisible(false);
  }

  fire(x, y, direction = 1, bulletType = 'normal') {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    // Configurar velocidad según dirección
    this.setVelocityX(this.speed * direction);
    this.setVelocityY(0);

    // Almacenar tipo de bala para efectos especiales
    this.bulletType = bulletType;
  }

  update() {
    // Desactivar si sale de la pantalla
    if (!this.active) return;

    if (this.x > this.scene.cameras.main.width + 50 || this.x < -50) {
      this.setActive(false);
      this.setVisible(false);
      this.body.stop();
    }
  }
}
