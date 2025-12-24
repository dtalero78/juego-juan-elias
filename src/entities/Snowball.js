import Phaser from 'phaser';

export default class Snowball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'snowball') {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.8);
    this.damage = 1;
    this.freezeDuration = 1500; // 1.5 segundos de congelación
    this.speed = 280;
  }

  fire(angle) {
    this.setActive(true);
    this.setVisible(true);
    this.body.reset(this.x, this.y);

    // Disparar en la dirección indicada
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );

    // Rotación visual
    this.scene.tweens.add({
      targets: this,
      rotation: Math.PI * 4,
      duration: 1000,
      repeat: -1
    });
  }

  update() {
    // Destruir si sale de la pantalla
    if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 700) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
