import Phaser from 'phaser';

export default class Platform extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'platform');

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body

    this.body.immovable = true;
    this.body.allowGravity = false;

    // Movimiento horizontal (adelante y atrás)
    this.moveSpeed = 60;
    this.startX = x;
    this.minX = x - 100;
    this.maxX = x + 100;
    this.direction = 1;
  }

  update() {
    // Mover plataforma de izquierda a derecha
    this.x += this.moveSpeed * this.direction * 0.016;

    if (this.x >= this.maxX) {
      this.direction = -1;
    } else if (this.x <= this.minX) {
      this.direction = 1;
    }

    // Actualizar el body estático
    this.body.updateFromGameObject();
  }
}
