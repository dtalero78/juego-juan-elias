import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Cargar sprites del personaje
    this.load.image('dolphin', 'assets/dolphin.png');           // Parado
    this.load.image('dolphin_jump', 'assets/dolphin_jump.png'); // Salto
    this.load.image('dolphin_attack', 'assets/dolphin_attack.png'); // Ataque

    // Cargar sprite del villano
    this.load.image('villain', 'assets/villain.png');

    // Crear sprites placeholder con gráficos generados
    this.createPlaceholderAssets();
  }

  createPlaceholderAssets() {
    // El personaje principal se carga desde archivo en preload()

    // Plataforma
    const platformGraphics = this.add.graphics();
    platformGraphics.fillStyle(0x8B4513, 1); // Marrón
    platformGraphics.fillRect(0, 0, 120, 20);
    // Detalles de madera
    platformGraphics.fillStyle(0x654321, 1);
    platformGraphics.fillRect(0, 0, 120, 4);
    platformGraphics.fillRect(0, 16, 120, 4);
    platformGraphics.fillStyle(0x5D3A1A, 1);
    platformGraphics.fillRect(20, 4, 3, 12);
    platformGraphics.fillRect(60, 4, 3, 12);
    platformGraphics.fillRect(100, 4, 3, 12);
    platformGraphics.generateTexture('platform', 120, 20);
    platformGraphics.destroy();

    // Bala normal del delfín (amarillo brillante)
    const bulletGraphics = this.add.graphics();
    bulletGraphics.fillStyle(0xFFFF00, 1);
    bulletGraphics.fillCircle(5, 5, 5);
    bulletGraphics.generateTexture('bullet', 10, 10);
    bulletGraphics.destroy();

    // Bala de fuego (roja/naranja)
    const fireBulletGraphics = this.add.graphics();
    fireBulletGraphics.fillStyle(0xFF4500, 1);
    fireBulletGraphics.fillCircle(6, 6, 6);
    fireBulletGraphics.fillStyle(0xFFFF00, 1);
    fireBulletGraphics.fillCircle(6, 6, 3);
    fireBulletGraphics.generateTexture('fireBullet', 12, 12);
    fireBulletGraphics.destroy();

    // Bala de hielo (azul)
    const iceBulletGraphics = this.add.graphics();
    iceBulletGraphics.fillStyle(0x00BFFF, 1);
    iceBulletGraphics.fillCircle(6, 6, 6);
    iceBulletGraphics.fillStyle(0xFFFFFF, 1);
    iceBulletGraphics.fillCircle(6, 6, 3);
    iceBulletGraphics.generateTexture('iceBullet', 12, 12);
    iceBulletGraphics.destroy();

    // Bala triple (verde)
    const tripleBulletGraphics = this.add.graphics();
    tripleBulletGraphics.fillStyle(0x00FF00, 1);
    tripleBulletGraphics.fillCircle(5, 5, 5);
    tripleBulletGraphics.generateTexture('tripleBullet', 10, 10);
    tripleBulletGraphics.destroy();

    // Bala rápida (púrpura)
    const fastBulletGraphics = this.add.graphics();
    fastBulletGraphics.fillStyle(0x9400D3, 1);
    fastBulletGraphics.fillCircle(4, 4, 4);
    fastBulletGraphics.generateTexture('fastBullet', 8, 8);
    fastBulletGraphics.destroy();

    // Powerups (cajas de munición)
    const ammoBoxGraphics = this.add.graphics();
    ammoBoxGraphics.fillStyle(0x8B4513, 1);
    ammoBoxGraphics.fillRect(0, 0, 24, 24);
    ammoBoxGraphics.fillStyle(0xFFD700, 1);
    ammoBoxGraphics.fillRect(2, 2, 20, 20);
    ammoBoxGraphics.fillStyle(0x000000, 1);
    ammoBoxGraphics.fillRect(8, 8, 8, 8);
    ammoBoxGraphics.generateTexture('ammoNormal', 24, 24);
    ammoBoxGraphics.destroy();

    // Powerup fuego
    const fireBoxGraphics = this.add.graphics();
    fireBoxGraphics.fillStyle(0x8B0000, 1);
    fireBoxGraphics.fillRect(0, 0, 24, 24);
    fireBoxGraphics.fillStyle(0xFF4500, 1);
    fireBoxGraphics.fillRect(2, 2, 20, 20);
    fireBoxGraphics.fillStyle(0xFFFF00, 1);
    fireBoxGraphics.fillRect(8, 8, 8, 8);
    fireBoxGraphics.generateTexture('ammoFire', 24, 24);
    fireBoxGraphics.destroy();

    // Powerup hielo
    const iceBoxGraphics = this.add.graphics();
    iceBoxGraphics.fillStyle(0x00008B, 1);
    iceBoxGraphics.fillRect(0, 0, 24, 24);
    iceBoxGraphics.fillStyle(0x00BFFF, 1);
    iceBoxGraphics.fillRect(2, 2, 20, 20);
    iceBoxGraphics.fillStyle(0xFFFFFF, 1);
    iceBoxGraphics.fillRect(8, 8, 8, 8);
    iceBoxGraphics.generateTexture('ammoIce', 24, 24);
    iceBoxGraphics.destroy();

    // Powerup triple
    const tripleBoxGraphics = this.add.graphics();
    tripleBoxGraphics.fillStyle(0x006400, 1);
    tripleBoxGraphics.fillRect(0, 0, 24, 24);
    tripleBoxGraphics.fillStyle(0x00FF00, 1);
    tripleBoxGraphics.fillRect(2, 2, 20, 20);
    tripleBoxGraphics.fillStyle(0x000000, 1);
    tripleBoxGraphics.fillRect(6, 10, 4, 4);
    tripleBoxGraphics.fillRect(10, 10, 4, 4);
    tripleBoxGraphics.fillRect(14, 10, 4, 4);
    tripleBoxGraphics.generateTexture('ammoTriple', 24, 24);
    tripleBoxGraphics.destroy();

    // Powerup rápido
    const fastBoxGraphics = this.add.graphics();
    fastBoxGraphics.fillStyle(0x4B0082, 1);
    fastBoxGraphics.fillRect(0, 0, 24, 24);
    fastBoxGraphics.fillStyle(0x9400D3, 1);
    fastBoxGraphics.fillRect(2, 2, 20, 20);
    fastBoxGraphics.fillStyle(0xFFFFFF, 1);
    fastBoxGraphics.fillRect(6, 10, 12, 4);
    fastBoxGraphics.generateTexture('ammoFast', 24, 24);
    fastBoxGraphics.destroy();

    // Bala de teletransporte (cian/portal)
    const teleportBulletGraphics = this.add.graphics();
    teleportBulletGraphics.fillStyle(0x00FFFF, 1);
    teleportBulletGraphics.fillCircle(8, 8, 8);
    teleportBulletGraphics.fillStyle(0xFF00FF, 1);
    teleportBulletGraphics.fillCircle(8, 8, 5);
    teleportBulletGraphics.fillStyle(0xFFFFFF, 1);
    teleportBulletGraphics.fillCircle(8, 8, 2);
    teleportBulletGraphics.generateTexture('teleportBullet', 16, 16);
    teleportBulletGraphics.destroy();

    // Powerup teletransporte
    const teleportBoxGraphics = this.add.graphics();
    teleportBoxGraphics.fillStyle(0x008B8B, 1);
    teleportBoxGraphics.fillRect(0, 0, 24, 24);
    teleportBoxGraphics.fillStyle(0x00FFFF, 1);
    teleportBoxGraphics.fillRect(2, 2, 20, 20);
    teleportBoxGraphics.fillStyle(0xFF00FF, 1);
    teleportBoxGraphics.fillCircle(12, 12, 6);
    teleportBoxGraphics.fillStyle(0xFFFFFF, 1);
    teleportBoxGraphics.fillCircle(12, 12, 3);
    teleportBoxGraphics.generateTexture('ammoTeleport', 24, 24);
    teleportBoxGraphics.destroy();

    // Pulpo - mejorado con tentáculos
    const octopusGraphics = this.add.graphics();
    octopusGraphics.fillStyle(0xFF1493, 1);
    octopusGraphics.fillCircle(35, 25, 25);
    // Tentáculos
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI;
      const x = 35 + Math.cos(angle) * 15;
      const y = 25 + Math.sin(angle) * 15;
      octopusGraphics.fillRect(x - 2, y, 4, 20);
    }
    // Ojos
    octopusGraphics.fillStyle(0xFFFFFF, 1);
    octopusGraphics.fillCircle(28, 20, 5);
    octopusGraphics.fillCircle(42, 20, 5);
    octopusGraphics.fillStyle(0x000000, 1);
    octopusGraphics.fillCircle(28, 20, 3);
    octopusGraphics.fillCircle(42, 20, 3);
    octopusGraphics.generateTexture('octopus', 70, 60);
    octopusGraphics.destroy();

    // Proyectil del pulpo (tinta negra con borde)
    const octopusBulletGraphics = this.add.graphics();
    octopusBulletGraphics.fillStyle(0x4B0082, 1);
    octopusBulletGraphics.fillCircle(8, 8, 8);
    octopusBulletGraphics.fillStyle(0x000000, 1);
    octopusBulletGraphics.fillCircle(8, 8, 6);
    octopusBulletGraphics.generateTexture('octopusBullet', 16, 16);
    octopusBulletGraphics.destroy();

    // Roca - forma irregular más realista
    const rockGraphics = this.add.graphics();
    rockGraphics.fillStyle(0x696969, 1);
    rockGraphics.beginPath();
    rockGraphics.moveTo(20, 5);
    rockGraphics.lineTo(35, 8);
    rockGraphics.lineTo(38, 20);
    rockGraphics.lineTo(30, 35);
    rockGraphics.lineTo(15, 38);
    rockGraphics.lineTo(5, 25);
    rockGraphics.lineTo(8, 10);
    rockGraphics.closePath();
    rockGraphics.fillPath();
    // Sombras
    rockGraphics.fillStyle(0x505050, 1);
    rockGraphics.fillCircle(20, 22, 8);
    rockGraphics.generateTexture('rock', 40, 40);
    rockGraphics.destroy();
  }

  create() {
    this.scene.start('MenuScene');
  }
}
