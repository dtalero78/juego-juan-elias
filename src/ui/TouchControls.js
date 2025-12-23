import Phaser from 'phaser';

export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.buttons = {};
    this.isActive = false;

    // Estados de los controles (simula teclas)
    this.state = {
      left: false,
      right: false,
      up: false,
      space: false,
      x: false,
      q: false
    };
  }

  create() {
    this.isActive = true;
    const { width, height } = this.scene.scale;

    // Contenedor para que los controles estén siempre arriba
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    // === LADO IZQUIERDO: D-Pad para movimiento ===
    const dpadX = 80;
    const dpadY = height - 100;
    const btnSize = 50;
    const btnAlpha = 0.6;

    // Botón Izquierda
    this.buttons.left = this.createButton(
      dpadX - btnSize, dpadY,
      btnSize, '◀',
      () => this.state.left = true,
      () => this.state.left = false
    );

    // Botón Derecha
    this.buttons.right = this.createButton(
      dpadX + btnSize, dpadY,
      btnSize, '▶',
      () => this.state.right = true,
      () => this.state.right = false
    );

    // Botón Saltar (arriba)
    this.buttons.up = this.createButton(
      dpadX, dpadY - btnSize,
      btnSize, '▲',
      () => this.state.up = true,
      () => this.state.up = false
    );

    // === LADO DERECHO: Botones de acción ===
    const actionX = width - 80;
    const actionY = height - 100;

    // Botón Disparar (grande)
    this.buttons.shoot = this.createButton(
      actionX, actionY,
      60, '🔫',
      () => this.state.space = true,
      () => this.state.space = false,
      0xFF4444
    );

    // Botón Dash (X)
    this.buttons.dash = this.createButton(
      actionX - 70, actionY,
      45, '💨',
      () => this.state.x = true,
      () => this.state.x = false,
      0x00CCFF
    );

    // Botón Cambiar bala (Q) - más pequeño arriba
    this.buttons.switchBullet = this.createButton(
      actionX, actionY - 70,
      40, '🔄',
      () => {
        this.state.q = true;
        // Trigger cambio de bala inmediatamente
        if (this.scene.dolphin) {
          this.scene.dolphin.nextBulletType();
          this.scene.updateAmmoUI();
        }
      },
      () => this.state.q = false,
      0xFFCC00
    );

    // Agregar todos los botones al contenedor
    Object.values(this.buttons).forEach(btn => {
      this.container.add(btn.bg);
      this.container.add(btn.text);
    });

    // Instrucciones táctiles (se ocultan después de 5 segundos)
    this.touchHelp = this.scene.add.text(width / 2, 100,
      '◀▶ Mover | ▲ Saltar | 🔫 Disparar | 💨 Dash | 🔄 Cambiar bala', {
      fontSize: '12px',
      fill: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 }
    });
    this.touchHelp.setOrigin(0.5);
    this.touchHelp.setScrollFactor(0);
    this.touchHelp.setDepth(1000);

    this.scene.time.delayedCall(5000, () => {
      if (this.touchHelp) {
        this.scene.tweens.add({
          targets: this.touchHelp,
          alpha: 0,
          duration: 1000,
          onComplete: () => this.touchHelp.destroy()
        });
      }
    });
  }

  createButton(x, y, size, label, onDown, onUp, color = 0x444444) {
    // Fondo del botón
    const bg = this.scene.add.circle(x, y, size / 2, color, 0.6);
    bg.setStrokeStyle(3, 0xffffff, 0.8);
    bg.setInteractive();

    // Texto del botón
    const text = this.scene.add.text(x, y, label, {
      fontSize: `${size * 0.5}px`,
      fill: '#ffffff'
    });
    text.setOrigin(0.5);

    // Eventos táctiles
    bg.on('pointerdown', () => {
      bg.setFillStyle(color, 1);
      bg.setScale(0.9);
      onDown();
    });

    bg.on('pointerup', () => {
      bg.setFillStyle(color, 0.6);
      bg.setScale(1);
      onUp();
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(color, 0.6);
      bg.setScale(1);
      onUp();
    });

    return { bg, text };
  }

  // Método para obtener estado como si fueran teclas
  getState() {
    return {
      left: { isDown: this.state.left },
      right: { isDown: this.state.right },
      up: { isDown: this.state.up },
      down: { isDown: false }
    };
  }

  getWasdState() {
    return {
      a: { isDown: this.state.left },
      d: { isDown: this.state.right },
      w: { isDown: this.state.up },
      s: { isDown: false }
    };
  }

  getSpaceState() {
    return { isDown: this.state.space };
  }

  getXKeyState() {
    return { isDown: this.state.x };
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
    if (this.touchHelp && this.touchHelp.active) {
      this.touchHelp.destroy();
    }
    this.isActive = false;
  }
}
