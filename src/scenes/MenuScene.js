import Phaser from 'phaser';
import { isMobile } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.selectedBullets = [];
    this.isMobileDevice = isMobile;
  }

  create() {
    // Fondo
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Tamaños adaptados para móvil
    const titleSize = this.isMobileDevice ? '28px' : '42px';
    const subtitleSize = this.isMobileDevice ? '14px' : '18px';
    const selectSize = this.isMobileDevice ? '13px' : '16px';

    // Título del juego
    const title = this.add.text(400, 50, 'MIELITO EL FUGITIVO', {
      fontSize: titleSize,
      fill: '#FFD700',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    // Subtítulo
    const subtitle = this.add.text(400, 90, 'Escapa del villano demoniaco', {
      fontSize: subtitleSize,
      fill: '#aaa',
      fontFamily: 'Courier New'
    });
    subtitle.setOrigin(0.5);

    // Instrucciones de selección
    const selectText = this.add.text(400, 130, 'Selecciona 2 tipos de balas:', {
      fontSize: selectSize,
      fill: '#fff',
      fontFamily: 'Courier New'
    });
    selectText.setOrigin(0.5);

    // Tipos de balas disponibles con descripciones cortas para móvil
    this.bulletTypes = [
      { type: 'normal', name: 'Normal', color: '#FFD700', desc: 'Daño: 3', descFull: 'Daño: 3 | Velocidad media' },
      { type: 'fire', name: 'Fuego', color: '#FF4500', desc: 'Quema', descFull: 'Daño: 2 | Quema al enemigo' },
      { type: 'ice', name: 'Hielo', color: '#00BFFF', desc: 'Congela', descFull: 'Daño: 1 | Congela 2 seg' },
      { type: 'triple', name: 'Triple', color: '#00FF00', desc: '3 balas', descFull: 'Daño: 1 | Dispara 3 balas' },
      { type: 'fast', name: 'Rápida', color: '#9400D3', desc: 'Veloz', descFull: 'Daño: 1 | Velocidad x2' },
      { type: 'teleport', name: 'Teleport', color: '#00FFFF', desc: 'Teletransporta', descFull: 'Daño: 2 | Te teletransporta' }
    ];

    this.bulletButtons = [];
    this.selectedBullets = [];

    // Ajustes para móvil (6 tipos de balas ahora)
    const startY = this.isMobileDevice ? 155 : 180;
    const spacing = this.isMobileDevice ? 42 : 52;
    const btnWidth = this.isMobileDevice ? 300 : 350;
    const btnHeight = this.isMobileDevice ? 36 : 45;
    const nameSize = this.isMobileDevice ? '16px' : '20px';
    const descSize = this.isMobileDevice ? '10px' : '12px';

    // Crear botones de selección de balas
    this.bulletTypes.forEach((bullet, index) => {
      const y = startY + index * spacing;

      // Fondo del botón
      const bg = this.add.rectangle(400, y, btnWidth, btnHeight, 0x333355);
      bg.setInteractive({ useHandCursor: true });
      bg.setStrokeStyle(2, 0x555577);

      // Nombre de la bala
      const nameX = this.isMobileDevice ? 270 : 250;
      const nameText = this.add.text(nameX, y, bullet.name, {
        fontSize: nameSize,
        fill: bullet.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0, 0.5);

      // Descripción (más corta en móvil)
      const descX = this.isMobileDevice ? 520 : 550;
      const descContent = this.isMobileDevice ? bullet.desc : bullet.descFull;
      const descText = this.add.text(descX, y, descContent, {
        fontSize: descSize,
        fill: '#aaa',
        fontFamily: 'Courier New'
      });
      descText.setOrigin(1, 0.5);

      // Indicador de selección
      const checkX = this.isMobileDevice ? 560 : 600;
      const checkmark = this.add.text(checkX, y, '', {
        fontSize: this.isMobileDevice ? '20px' : '24px',
        fill: '#00FF00',
        fontFamily: 'Courier New'
      });
      checkmark.setOrigin(0.5);

      // Guardar referencia
      this.bulletButtons.push({
        type: bullet.type,
        bg,
        checkmark,
        selected: false
      });

      // Evento de click/touch
      bg.on('pointerdown', () => {
        this.toggleBulletSelection(index);
      });

      bg.on('pointerover', () => {
        if (!this.bulletButtons[index].selected) {
          bg.setFillStyle(0x444466);
        }
      });

      bg.on('pointerout', () => {
        if (!this.bulletButtons[index].selected) {
          bg.setFillStyle(0x333355);
        }
      });
    });

    // Posiciones adaptadas para móvil
    const selectionY = this.isMobileDevice ? 440 : 530;
    const playBtnY = this.isMobileDevice ? 480 : 570;
    const controlsY = this.isMobileDevice ? 530 : 620;

    // Texto de selección actual
    this.selectionText = this.add.text(400, selectionY, 'Selecciona 2 tipos de balas', {
      fontSize: this.isMobileDevice ? '12px' : '14px',
      fill: '#ff6666',
      fontFamily: 'Courier New'
    });
    this.selectionText.setOrigin(0.5);

    // Botón de jugar
    const playBtnWidth = this.isMobileDevice ? 160 : 200;
    const playBtnHeight = this.isMobileDevice ? 45 : 50;
    this.playButton = this.add.rectangle(400, playBtnY, playBtnWidth, playBtnHeight, 0x444444);
    this.playButton.setStrokeStyle(2, 0x666666);

    this.playButtonText = this.add.text(400, playBtnY, 'JUGAR', {
      fontSize: this.isMobileDevice ? '20px' : '24px',
      fill: '#666666',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.playButtonText.setOrigin(0.5);

    // Instrucciones de controles (solo en desktop)
    if (!this.isMobileDevice) {
      const controls = this.add.text(400, controlsY, 'Controles: A/D = Mover | W = Saltar | ESPACIO = Disparar | Q = Cambiar bala', {
        fontSize: '11px',
        fill: '#666',
        fontFamily: 'Courier New'
      });
      controls.setOrigin(0.5);
    } else {
      const mobileHint = this.add.text(400, controlsY, 'Usa los controles táctiles en pantalla', {
        fontSize: '10px',
        fill: '#666',
        fontFamily: 'Courier New'
      });
      mobileHint.setOrigin(0.5);
    }
  }

  toggleBulletSelection(index) {
    const button = this.bulletButtons[index];

    if (button.selected) {
      // Deseleccionar
      button.selected = false;
      button.bg.setFillStyle(0x333355);
      button.bg.setStrokeStyle(2, 0x555577);
      button.checkmark.setText('');
      this.selectedBullets = this.selectedBullets.filter(t => t !== button.type);
    } else {
      // Verificar si ya hay 2 seleccionados
      if (this.selectedBullets.length >= 2) {
        return;
      }
      // Seleccionar
      button.selected = true;
      button.bg.setFillStyle(0x225522);
      button.bg.setStrokeStyle(2, 0x44aa44);
      button.checkmark.setText('✓');
      this.selectedBullets.push(button.type);
    }

    this.updatePlayButton();
  }

  updatePlayButton() {
    if (this.selectedBullets.length === 2) {
      // Activar botón
      this.playButton.setFillStyle(0x228B22);
      this.playButton.setStrokeStyle(2, 0x32CD32);
      this.playButtonText.setFill('#ffffff');
      this.selectionText.setText('¡Listo para jugar!');
      this.selectionText.setFill('#00ff00');

      this.playButton.setInteractive({ useHandCursor: true });
      this.playButton.on('pointerdown', () => {
        this.startGame();
      });
      this.playButton.on('pointerover', () => {
        this.playButton.setFillStyle(0x32CD32);
      });
      this.playButton.on('pointerout', () => {
        this.playButton.setFillStyle(0x228B22);
      });
    } else {
      // Desactivar botón
      this.playButton.setFillStyle(0x444444);
      this.playButton.setStrokeStyle(2, 0x666666);
      this.playButtonText.setFill('#666666');
      this.selectionText.setText(`Selecciona ${2 - this.selectedBullets.length} tipo(s) más`);
      this.selectionText.setFill('#ff6666');
      this.playButton.removeInteractive();
      this.playButton.off('pointerdown');
      this.playButton.off('pointerover');
      this.playButton.off('pointerout');
    }
  }

  startGame() {
    // Pasar las balas seleccionadas a la escena del juego
    this.scene.start('GameScene', { selectedBullets: this.selectedBullets });
  }
}
