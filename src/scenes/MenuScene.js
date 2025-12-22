import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.selectedBullets = [];
  }

  create() {
    // Fondo
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Título del juego
    const title = this.add.text(400, 60, 'MIELITO EL FUGITIVO', {
      fontSize: '42px',
      fill: '#FFD700',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    // Subtítulo
    const subtitle = this.add.text(400, 110, 'Escapa del villano demoniaco', {
      fontSize: '18px',
      fill: '#aaa',
      fontFamily: 'Courier New'
    });
    subtitle.setOrigin(0.5);

    // Instrucciones de selección
    const selectText = this.add.text(400, 160, 'Selecciona 2 tipos de balas para la batalla:', {
      fontSize: '16px',
      fill: '#fff',
      fontFamily: 'Courier New'
    });
    selectText.setOrigin(0.5);

    // Tipos de balas disponibles
    this.bulletTypes = [
      { type: 'normal', name: 'Normal', color: '#FFD700', desc: 'Daño: 3 | Velocidad media' },
      { type: 'fire', name: 'Fuego', color: '#FF4500', desc: 'Daño: 2 | Quema al enemigo' },
      { type: 'ice', name: 'Hielo', color: '#00BFFF', desc: 'Daño: 1 | Ralentiza 3 seg' },
      { type: 'triple', name: 'Triple', color: '#00FF00', desc: 'Daño: 1 | Dispara 3 balas' },
      { type: 'fast', name: 'Rápida', color: '#9400D3', desc: 'Daño: 1 | Velocidad x2' }
    ];

    this.bulletButtons = [];
    this.selectedBullets = [];

    // Crear botones de selección de balas
    this.bulletTypes.forEach((bullet, index) => {
      const y = 220 + index * 60;

      // Fondo del botón
      const bg = this.add.rectangle(400, y, 350, 50, 0x333355);
      bg.setInteractive({ useHandCursor: true });
      bg.setStrokeStyle(2, 0x555577);

      // Nombre de la bala
      const nameText = this.add.text(250, y, bullet.name, {
        fontSize: '20px',
        fill: bullet.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0, 0.5);

      // Descripción
      const descText = this.add.text(550, y, bullet.desc, {
        fontSize: '12px',
        fill: '#aaa',
        fontFamily: 'Courier New'
      });
      descText.setOrigin(1, 0.5);

      // Indicador de selección
      const checkmark = this.add.text(600, y, '', {
        fontSize: '24px',
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

      // Evento de click
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

    // Texto de selección actual
    this.selectionText = this.add.text(400, 530, 'Selecciona 2 tipos de balas', {
      fontSize: '14px',
      fill: '#ff6666',
      fontFamily: 'Courier New'
    });
    this.selectionText.setOrigin(0.5);

    // Botón de jugar
    this.playButton = this.add.rectangle(400, 570, 200, 50, 0x444444);
    this.playButton.setStrokeStyle(2, 0x666666);

    this.playButtonText = this.add.text(400, 570, 'JUGAR', {
      fontSize: '24px',
      fill: '#666666',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.playButtonText.setOrigin(0.5);

    // Instrucciones de controles
    const controls = this.add.text(400, 620, 'Controles: A/D = Mover | W = Saltar | ESPACIO = Disparar | Q = Cambiar bala', {
      fontSize: '11px',
      fill: '#666',
      fontFamily: 'Courier New'
    });
    controls.setOrigin(0.5);
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
