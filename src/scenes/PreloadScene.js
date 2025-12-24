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

    // Ice Boss - jefe de hielo con cuernos
    const iceBossGraphics = this.add.graphics();
    // Cuerpo principal (cristal de hielo)
    iceBossGraphics.fillStyle(0x87CEEB, 1);
    iceBossGraphics.fillCircle(40, 35, 30);
    // Detalles de hielo
    iceBossGraphics.fillStyle(0x00BFFF, 1);
    iceBossGraphics.fillCircle(40, 35, 22);
    // Cuernos de hielo
    iceBossGraphics.fillStyle(0xADD8E6, 1);
    iceBossGraphics.beginPath();
    iceBossGraphics.moveTo(20, 15);
    iceBossGraphics.lineTo(10, -5);
    iceBossGraphics.lineTo(25, 10);
    iceBossGraphics.closePath();
    iceBossGraphics.fillPath();
    iceBossGraphics.beginPath();
    iceBossGraphics.moveTo(60, 15);
    iceBossGraphics.lineTo(70, -5);
    iceBossGraphics.lineTo(55, 10);
    iceBossGraphics.closePath();
    iceBossGraphics.fillPath();
    // Ojos fríos
    iceBossGraphics.fillStyle(0xFFFFFF, 1);
    iceBossGraphics.fillCircle(30, 30, 8);
    iceBossGraphics.fillCircle(50, 30, 8);
    iceBossGraphics.fillStyle(0x0000FF, 1);
    iceBossGraphics.fillCircle(30, 30, 4);
    iceBossGraphics.fillCircle(50, 30, 4);
    // Boca malvada
    iceBossGraphics.fillStyle(0x000080, 1);
    iceBossGraphics.fillRect(30, 48, 20, 5);
    iceBossGraphics.generateTexture('iceBoss', 80, 70);
    iceBossGraphics.destroy();

    // Bola de nieve
    const snowballGraphics = this.add.graphics();
    snowballGraphics.fillStyle(0xFFFFFF, 1);
    snowballGraphics.fillCircle(10, 10, 10);
    snowballGraphics.fillStyle(0xE0E0E0, 1);
    snowballGraphics.fillCircle(8, 8, 4);
    snowballGraphics.fillStyle(0xADD8E6, 1);
    snowballGraphics.fillCircle(12, 12, 3);
    snowballGraphics.generateTexture('snowball', 20, 20);
    snowballGraphics.destroy();

    // Bala navideña (esfera de navidad roja/verde con estrella)
    const xmasBulletGraphics = this.add.graphics();
    // Esfera roja exterior
    xmasBulletGraphics.fillStyle(0xFF0000, 1);
    xmasBulletGraphics.fillCircle(10, 10, 10);
    // Franja verde
    xmasBulletGraphics.fillStyle(0x00FF00, 1);
    xmasBulletGraphics.fillRect(4, 8, 12, 4);
    // Brillo blanco
    xmasBulletGraphics.fillStyle(0xFFFFFF, 1);
    xmasBulletGraphics.fillCircle(7, 6, 3);
    // Gancho dorado arriba
    xmasBulletGraphics.fillStyle(0xFFD700, 1);
    xmasBulletGraphics.fillRect(8, 0, 4, 3);
    xmasBulletGraphics.generateTexture('xmasBullet', 20, 20);
    xmasBulletGraphics.destroy();

    // Powerup navideño (caja de regalo)
    const xmasBoxGraphics = this.add.graphics();
    // Caja roja
    xmasBoxGraphics.fillStyle(0x8B0000, 1);
    xmasBoxGraphics.fillRect(0, 0, 24, 24);
    xmasBoxGraphics.fillStyle(0xFF0000, 1);
    xmasBoxGraphics.fillRect(2, 2, 20, 20);
    // Lazo verde vertical
    xmasBoxGraphics.fillStyle(0x00FF00, 1);
    xmasBoxGraphics.fillRect(10, 2, 4, 20);
    // Lazo verde horizontal
    xmasBoxGraphics.fillRect(2, 10, 20, 4);
    // Moño dorado
    xmasBoxGraphics.fillStyle(0xFFD700, 1);
    xmasBoxGraphics.fillCircle(12, 12, 4);
    xmasBoxGraphics.generateTexture('ammoXmas', 24, 24);
    xmasBoxGraphics.destroy();

    // Colombia Ball - bola con colores de Colombia (amarillo, azul, rojo)
    const colombiaGraphics = this.add.graphics();
    // Franja amarilla (superior - más grande)
    colombiaGraphics.fillStyle(0xFCD116, 1); // Amarillo Colombia
    colombiaGraphics.fillRect(0, 0, 50, 25);
    // Franja azul (medio)
    colombiaGraphics.fillStyle(0x003893, 1); // Azul Colombia
    colombiaGraphics.fillRect(0, 25, 50, 12);
    // Franja roja (inferior)
    colombiaGraphics.fillStyle(0xCE1126, 1); // Rojo Colombia
    colombiaGraphics.fillRect(0, 37, 50, 13);
    // Ojos blancos grandes
    colombiaGraphics.fillStyle(0xFFFFFF, 1);
    colombiaGraphics.fillCircle(15, 20, 8);
    colombiaGraphics.fillCircle(35, 20, 8);
    // Pupilas negras
    colombiaGraphics.fillStyle(0x000000, 1);
    colombiaGraphics.fillCircle(17, 20, 4);
    colombiaGraphics.fillCircle(37, 20, 4);
    // Borde circular para forma de bola
    colombiaGraphics.lineStyle(3, 0x000000, 1);
    colombiaGraphics.strokeCircle(25, 25, 24);
    colombiaGraphics.generateTexture('colombiaBall', 50, 50);
    colombiaGraphics.destroy();

    // Colombia Ball saltando
    const colombiaJumpGraphics = this.add.graphics();
    colombiaJumpGraphics.fillStyle(0xFCD116, 1);
    colombiaJumpGraphics.fillRect(0, 0, 50, 25);
    colombiaJumpGraphics.fillStyle(0x003893, 1);
    colombiaJumpGraphics.fillRect(0, 25, 50, 12);
    colombiaJumpGraphics.fillStyle(0xCE1126, 1);
    colombiaJumpGraphics.fillRect(0, 37, 50, 13);
    // Ojos mirando arriba
    colombiaJumpGraphics.fillStyle(0xFFFFFF, 1);
    colombiaJumpGraphics.fillCircle(15, 18, 8);
    colombiaJumpGraphics.fillCircle(35, 18, 8);
    colombiaJumpGraphics.fillStyle(0x000000, 1);
    colombiaJumpGraphics.fillCircle(15, 15, 4);
    colombiaJumpGraphics.fillCircle(35, 15, 4);
    colombiaJumpGraphics.lineStyle(3, 0x000000, 1);
    colombiaJumpGraphics.strokeCircle(25, 25, 24);
    colombiaJumpGraphics.generateTexture('colombiaBall_jump', 50, 50);
    colombiaJumpGraphics.destroy();

    // Colombia Ball atacando (puños)
    const colombiaAttackGraphics = this.add.graphics();
    colombiaAttackGraphics.fillStyle(0xFCD116, 1);
    colombiaAttackGraphics.fillRect(0, 0, 50, 25);
    colombiaAttackGraphics.fillStyle(0x003893, 1);
    colombiaAttackGraphics.fillRect(0, 25, 50, 12);
    colombiaAttackGraphics.fillStyle(0xCE1126, 1);
    colombiaAttackGraphics.fillRect(0, 37, 50, 13);
    // Ojos enojados
    colombiaAttackGraphics.fillStyle(0xFFFFFF, 1);
    colombiaAttackGraphics.fillCircle(15, 20, 8);
    colombiaAttackGraphics.fillCircle(35, 20, 8);
    colombiaAttackGraphics.fillStyle(0xFF0000, 1); // Pupilas rojas cuando ataca
    colombiaAttackGraphics.fillCircle(17, 20, 5);
    colombiaAttackGraphics.fillCircle(37, 20, 5);
    // Puño extendido
    colombiaAttackGraphics.fillStyle(0xFCD116, 1);
    colombiaAttackGraphics.fillCircle(55, 25, 10);
    colombiaAttackGraphics.lineStyle(3, 0x000000, 1);
    colombiaAttackGraphics.strokeCircle(25, 25, 24);
    colombiaAttackGraphics.generateTexture('colombiaBall_attack', 65, 50);
    colombiaAttackGraphics.destroy();

    // Bola de energía morada (ataque especial)
    const energyBallGraphics = this.add.graphics();
    energyBallGraphics.fillStyle(0x9400D3, 1); // Morado oscuro
    energyBallGraphics.fillCircle(12, 12, 12);
    energyBallGraphics.fillStyle(0xDA70D6, 1); // Morado claro
    energyBallGraphics.fillCircle(10, 10, 7);
    energyBallGraphics.fillStyle(0xFFFFFF, 1); // Brillo
    energyBallGraphics.fillCircle(8, 8, 3);
    energyBallGraphics.generateTexture('energyBall', 24, 24);
    energyBallGraphics.destroy();
  }

  create() {
    this.scene.start('MenuScene');
  }
}
