import Phaser from 'phaser';

export default class GoldenRay extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'goldenRay');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Los rayos NO caen por gravedad
    this.body.setAllowGravity(false);

    this.speed = 450;
    this.setActive(false);
    this.setVisible(false);

    // Color dorado opaco
    this.setTint(0xFFD700);
    this.setAlpha(0.9);
  }

  fire(x, y, direction = 1) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    // Configurar velocidad horizontal (sin gravedad vertical)
    this.setVelocityX(this.speed * direction);
    this.setVelocityY(0);

    // Efecto de brillo
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.9, to: 0.6 },
      duration: 200,
      yoyo: true,
      repeat: -1
    });

    // Trail effect (rastro dorado)
    this.createTrail();
  }

  createTrail() {
    const trail = this.scene.add.circle(this.x, this.y, 4, 0xFFD700, 0.5);
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => trail.destroy()
    });
  }

  update() {
    // Desactivar si sale de la pantalla
    if (!this.active) return;

    // Crear efecto de rastro mientras vuela
    if (Phaser.Math.Between(0, 2) === 0) {
      this.createTrail();
    }

    if (this.x > this.scene.cameras.main.width + 50 || this.x < -50) {
      this.setActive(false);
      this.setVisible(false);
      this.body.stop();
      this.clearTint();
      this.setAlpha(1);

      // Detener todos los tweens
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
