import Phaser from 'phaser';
import { isMobile } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.selectedBullets = [];
    this.selectedBoss = 'octopus'; // 'octopus' o 'iceBoss'
    this.selectedCharacter = 'dolphin'; // 'dolphin' o 'colombiaBall'
    this.isMobileDevice = isMobile;

    // PvP mode state
    this.pvpMode = false;
    this.pvpPlayerCharacter = null;
    this.pvpOpponentCharacter = null;
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
      { type: 'teleport', name: 'Teleport', color: '#00FFFF', desc: 'Teletransporta', descFull: 'Daño: 2 | Te teletransporta' },
      { type: 'xmas', name: 'Navidad', color: '#FF0000', desc: 'Explota!', descFull: 'Daño: 5 | Explosión festiva' }
    ];

    this.bulletButtons = [];
    this.selectedBullets = [];

    // Ajustes para móvil (7 tipos de balas ahora)
    const startY = this.isMobileDevice ? 150 : 165;
    const spacing = this.isMobileDevice ? 38 : 44;
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
    const charSelectY = this.isMobileDevice ? 390 : 460;
    const bossSelectY = this.isMobileDevice ? 450 : 520;
    const selectionY = this.isMobileDevice ? 505 : 570;
    const playBtnY = this.isMobileDevice ? 545 : 605;
    const controlsY = this.isMobileDevice ? 595 : 640;

    // Selector de Personaje
    const charText = this.add.text(400, charSelectY - 20, 'Elige tu personaje:', {
      fontSize: this.isMobileDevice ? '11px' : '13px',
      fill: '#fff',
      fontFamily: 'Courier New'
    });
    charText.setOrigin(0.5);

    const charBtnWidth = this.isMobileDevice ? 95 : 120;
    // Botón Mielito (Delfín)
    this.char1Btn = this.add.rectangle(200, charSelectY, charBtnWidth, 28, 0x225522);
    this.char1Btn.setStrokeStyle(2, 0x44aa44);
    this.char1Btn.setInteractive({ useHandCursor: true });

    this.char1Text = this.add.text(200, charSelectY, 'Mielito', {
      fontSize: this.isMobileDevice ? '9px' : '11px',
      fill: '#1E90FF',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.char1Text.setOrigin(0.5);

    // Botón Colombia Ball
    this.char2Btn = this.add.rectangle(400, charSelectY, charBtnWidth, 28, 0x333355);
    this.char2Btn.setStrokeStyle(2, 0x555577);
    this.char2Btn.setInteractive({ useHandCursor: true });

    this.char2Text = this.add.text(400, charSelectY, 'Colombia', {
      fontSize: this.isMobileDevice ? '9px' : '11px',
      fill: '#FCD116',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.char2Text.setOrigin(0.5);

    // Botón Red Triangle
    this.char3Btn = this.add.rectangle(600, charSelectY, charBtnWidth, 28, 0x333355);
    this.char3Btn.setStrokeStyle(2, 0x555577);
    this.char3Btn.setInteractive({ useHandCursor: true });

    this.char3Text = this.add.text(600, charSelectY, 'Triángulo', {
      fontSize: this.isMobileDevice ? '9px' : '11px',
      fill: '#FF0000',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.char3Text.setOrigin(0.5);

    // Eventos de selección de personaje
    this.char1Btn.on('pointerdown', () => this.selectCharacter('dolphin'));
    this.char2Btn.on('pointerdown', () => this.selectCharacter('colombiaBall'));
    this.char3Btn.on('pointerdown', () => this.selectCharacter('redTriangle'));

    this.char1Btn.on('pointerover', () => {
      if (this.selectedCharacter !== 'dolphin') this.char1Btn.setFillStyle(0x334433);
    });
    this.char1Btn.on('pointerout', () => {
      if (this.selectedCharacter !== 'dolphin') this.char1Btn.setFillStyle(0x333355);
    });
    this.char2Btn.on('pointerover', () => {
      if (this.selectedCharacter !== 'colombiaBall') this.char2Btn.setFillStyle(0x443322);
    });
    this.char2Btn.on('pointerout', () => {
      if (this.selectedCharacter !== 'colombiaBall') this.char2Btn.setFillStyle(0x333355);
    });
    this.char3Btn.on('pointerover', () => {
      if (this.selectedCharacter !== 'redTriangle') this.char3Btn.setFillStyle(0x442222);
    });
    this.char3Btn.on('pointerout', () => {
      if (this.selectedCharacter !== 'redTriangle') this.char3Btn.setFillStyle(0x333355);
    });

    // Selector de Boss
    const bossText = this.add.text(400, bossSelectY - 20, 'Elige tu enemigo:', {
      fontSize: this.isMobileDevice ? '11px' : '13px',
      fill: '#fff',
      fontFamily: 'Courier New'
    });
    bossText.setOrigin(0.5);

    // Botón Boss 1 - Pulpo
    const boss1BtnWidth = this.isMobileDevice ? 140 : 170;
    this.boss1Btn = this.add.rectangle(300, bossSelectY, boss1BtnWidth, 30, 0x225522);
    this.boss1Btn.setStrokeStyle(2, 0x44aa44);
    this.boss1Btn.setInteractive({ useHandCursor: true });

    this.boss1Text = this.add.text(300, bossSelectY, 'Pulpo Demonio', {
      fontSize: this.isMobileDevice ? '10px' : '12px',
      fill: '#FF1493',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.boss1Text.setOrigin(0.5);

    // Botón Boss 2 - Ice Boss
    this.boss2Btn = this.add.rectangle(500, bossSelectY, boss1BtnWidth, 30, 0x333355);
    this.boss2Btn.setStrokeStyle(2, 0x555577);
    this.boss2Btn.setInteractive({ useHandCursor: true });

    this.boss2Text = this.add.text(500, bossSelectY, 'Jefe de Hielo', {
      fontSize: this.isMobileDevice ? '10px' : '12px',
      fill: '#00BFFF',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.boss2Text.setOrigin(0.5);

    // Eventos de selección de boss
    this.boss1Btn.on('pointerdown', () => this.selectBoss('octopus'));
    this.boss2Btn.on('pointerdown', () => this.selectBoss('iceBoss'));

    this.boss1Btn.on('pointerover', () => {
      if (this.selectedBoss !== 'octopus') this.boss1Btn.setFillStyle(0x334433);
    });
    this.boss1Btn.on('pointerout', () => {
      if (this.selectedBoss !== 'octopus') this.boss1Btn.setFillStyle(0x333355);
    });
    this.boss2Btn.on('pointerover', () => {
      if (this.selectedBoss !== 'iceBoss') this.boss2Btn.setFillStyle(0x334455);
    });
    this.boss2Btn.on('pointerout', () => {
      if (this.selectedBoss !== 'iceBoss') this.boss2Btn.setFillStyle(0x333355);
    });

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

    // Botón Modo PvP
    const pvpBtnY = this.isMobileDevice ? 555 : 590;
    const pvpBtnWidth = this.isMobileDevice ? 160 : 200;
    const pvpBtnHeight = this.isMobileDevice ? 40 : 45;

    this.pvpButton = this.add.rectangle(400, pvpBtnY, pvpBtnWidth, pvpBtnHeight, 0x663399);
    this.pvpButton.setStrokeStyle(2, 0x9944CC);
    this.pvpButton.setInteractive({ useHandCursor: true });

    this.pvpButtonText = this.add.text(400, pvpBtnY, 'MODO PvP', {
      fontSize: this.isMobileDevice ? '18px' : '22px',
      fill: '#FFFFFF',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.pvpButtonText.setOrigin(0.5);

    this.pvpButton.on('pointerdown', () => {
      this.enterPvPSelection();
    });

    this.pvpButton.on('pointerover', () => {
      this.pvpButton.setFillStyle(0x9944CC);
    });

    this.pvpButton.on('pointerout', () => {
      this.pvpButton.setFillStyle(0x663399);
    });
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

  selectCharacter(charType) {
    this.selectedCharacter = charType;

    // Reset todos los botones
    this.char1Btn.setFillStyle(0x333355);
    this.char1Btn.setStrokeStyle(2, 0x555577);
    this.char2Btn.setFillStyle(0x333355);
    this.char2Btn.setStrokeStyle(2, 0x555577);
    this.char3Btn.setFillStyle(0x333355);
    this.char3Btn.setStrokeStyle(2, 0x555577);

    // Activar el seleccionado
    if (charType === 'dolphin') {
      this.char1Btn.setFillStyle(0x225522);
      this.char1Btn.setStrokeStyle(2, 0x44aa44);
    } else if (charType === 'colombiaBall') {
      this.char2Btn.setFillStyle(0x443322);
      this.char2Btn.setStrokeStyle(2, 0xaa8844);
    } else if (charType === 'redTriangle') {
      this.char3Btn.setFillStyle(0x552222);
      this.char3Btn.setStrokeStyle(2, 0xaa4444);
    }
  }

  selectBoss(bossType) {
    this.selectedBoss = bossType;

    if (bossType === 'octopus') {
      this.boss1Btn.setFillStyle(0x225522);
      this.boss1Btn.setStrokeStyle(2, 0x44aa44);
      this.boss2Btn.setFillStyle(0x333355);
      this.boss2Btn.setStrokeStyle(2, 0x555577);
    } else {
      this.boss1Btn.setFillStyle(0x333355);
      this.boss1Btn.setStrokeStyle(2, 0x555577);
      this.boss2Btn.setFillStyle(0x224455);
      this.boss2Btn.setStrokeStyle(2, 0x44aaaa);
    }
  }

  startGame() {
    // Elegir escena según el boss seleccionado
    const sceneName = this.selectedBoss === 'iceBoss' ? 'IceBossScene' : 'GameScene';
    this.scene.start(sceneName, {
      selectedBullets: this.selectedBullets,
      selectedCharacter: this.selectedCharacter
    });
  }

  enterPvPSelection() {
    // Crear grupo para UI de PvP (para poder limpiarla después)
    this.pvpUIGroup = this.add.group();
    this.isLocalMultiplayer = false; // Por defecto vs IA

    // Fondo oscuro semi-transparente
    const overlay = this.add.rectangle(400, 320, 800, 640, 0x000000, 0.8);
    this.pvpUIGroup.add(overlay);

    // Título
    const title = this.add.text(400, 60, 'MODO PvP', {
      fontSize: '42px',
      fill: '#FF00FF',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(title);

    // === SELECTOR DE MODO DE JUEGO ===
    const modeTitle = this.add.text(400, 110, 'Tipo de batalla:', {
      fontSize: '16px',
      fill: '#FFFFFF',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(modeTitle);

    // Botón vs IA
    this.vsAIButton = this.add.rectangle(300, 145, 160, 35, 0x228B22);
    this.vsAIButton.setStrokeStyle(3, 0x32CD32);
    this.vsAIButton.setInteractive({ useHandCursor: true });

    const vsAIText = this.add.text(300, 145, 'vs IA', {
      fontSize: '18px',
      fill: '#FFFFFF',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.vsAIButton.on('pointerdown', () => {
      this.isLocalMultiplayer = false;
      this.updateModeSelection();
      this.updateOpponentTitle();
    });

    this.pvpUIGroup.add(this.vsAIButton);
    this.pvpUIGroup.add(vsAIText);

    // Botón vs Jugador 2
    this.vsPlayerButton = this.add.rectangle(500, 145, 160, 35, 0x333355);
    this.vsPlayerButton.setStrokeStyle(2, 0x555577);
    this.vsPlayerButton.setInteractive({ useHandCursor: true });

    const vsPlayerText = this.add.text(500, 145, 'vs Jugador 2', {
      fontSize: '18px',
      fill: '#FFFFFF',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.vsPlayerButton.on('pointerdown', () => {
      this.isLocalMultiplayer = true;
      this.updateModeSelection();
      this.updateOpponentTitle();
    });

    this.pvpUIGroup.add(this.vsPlayerButton);
    this.pvpUIGroup.add(vsPlayerText);

    // Subtítulo
    const subtitle = this.add.text(400, 185, 'Elige un personaje para cada lado', {
      fontSize: '15px',
      fill: '#FFFFFF',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(subtitle);

    // Sección Jugador 1 (izquierda)
    const playerTitle = this.add.text(200, 215, 'JUGADOR 1', {
      fontSize: '20px',
      fill: '#00FF00',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(playerTitle);

    // Botones de personaje del jugador
    const chars = [
      { name: 'Mielito', type: 'dolphin', color: '#1E90FF', y: 270 },
      { name: 'Colombia', type: 'colombiaBall', color: '#FCD116', y: 330 },
      { name: 'Triángulo', type: 'redTriangle', color: '#FF0000', y: 390 },
      { name: 'TimeMaster', type: 'timeMaster', color: '#FFD700', y: 450 }
    ];

    this.pvpPlayerButtons = [];
    chars.forEach((char, index) => {
      const btn = this.add.rectangle(200, char.y, 180, 45, 0x333355);
      btn.setStrokeStyle(2, 0x555577);
      btn.setInteractive({ useHandCursor: true });

      const text = this.add.text(200, char.y, char.name, {
        fontSize: '18px',
        fill: char.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        this.selectPvPPlayer(char.type, index);
      });

      btn.on('pointerover', () => {
        if (this.pvpPlayerCharacter !== char.type) {
          btn.setFillStyle(0x444466);
        }
      });

      btn.on('pointerout', () => {
        if (this.pvpPlayerCharacter !== char.type) {
          btn.setFillStyle(0x333355);
        }
      });

      this.pvpPlayerButtons.push({ btn, text, type: char.type });
      this.pvpUIGroup.add(btn);
      this.pvpUIGroup.add(text);
    });

    // Sección Oponente (derecha)
    this.opponentTitle = this.add.text(600, 215, 'OPONENTE IA', {
      fontSize: '20px',
      fill: '#FF0000',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(this.opponentTitle);

    // Botones de personaje del oponente
    this.pvpOpponentButtons = [];
    chars.forEach((char, index) => {
      const btn = this.add.rectangle(600, char.y, 180, 45, 0x333355);
      btn.setStrokeStyle(2, 0x555577);
      btn.setInteractive({ useHandCursor: true });

      const text = this.add.text(600, char.y, char.name, {
        fontSize: '18px',
        fill: char.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        this.selectPvPOpponent(char.type, index);
      });

      btn.on('pointerover', () => {
        if (this.pvpOpponentCharacter !== char.type) {
          btn.setFillStyle(0x444466);
        }
      });

      btn.on('pointerout', () => {
        if (this.pvpOpponentCharacter !== char.type) {
          btn.setFillStyle(0x333355);
        }
      });

      this.pvpOpponentButtons.push({ btn, text, type: char.type });
      this.pvpUIGroup.add(btn);
      this.pvpUIGroup.add(text);
    });

    // Mensaje de estado
    this.pvpStatusText = this.add.text(400, 440, 'Selecciona ambos personajes', {
      fontSize: '16px',
      fill: '#FFFF00',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(this.pvpStatusText);

    // Botón JUGAR PvP
    this.pvpPlayButton = this.add.rectangle(400, 500, 200, 50, 0x444444);
    this.pvpPlayButton.setStrokeStyle(2, 0x666666);

    this.pvpPlayButtonText = this.add.text(400, 500, 'JUGAR', {
      fontSize: '28px',
      fill: '#666666',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.pvpUIGroup.add(this.pvpPlayButton);
    this.pvpUIGroup.add(this.pvpPlayButtonText);

    // Botón Volver
    const backButton = this.add.rectangle(400, 570, 160, 40, 0x553333);
    backButton.setStrokeStyle(2, 0x775555);
    backButton.setInteractive({ useHandCursor: true });

    const backText = this.add.text(400, 570, 'VOLVER', {
      fontSize: '18px',
      fill: '#FFFFFF',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    backButton.on('pointerdown', () => {
      this.exitPvPSelection();
    });

    backButton.on('pointerover', () => {
      backButton.setFillStyle(0x775555);
    });

    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x553333);
    });

    this.pvpUIGroup.add(backButton);
    this.pvpUIGroup.add(backText);
  }

  selectPvPPlayer(charType, index) {
    this.pvpPlayerCharacter = charType;

    // Reset todos los botones del jugador
    this.pvpPlayerButtons.forEach((item, i) => {
      if (i === index) {
        item.btn.setFillStyle(0x225522);
        item.btn.setStrokeStyle(2, 0x44aa44);
      } else {
        item.btn.setFillStyle(0x333355);
        item.btn.setStrokeStyle(2, 0x555577);
      }
    });

    this.updatePvPPlayButton();
  }

  selectPvPOpponent(charType, index) {
    this.pvpOpponentCharacter = charType;

    // Reset todos los botones del oponente
    this.pvpOpponentButtons.forEach((item, i) => {
      if (i === index) {
        item.btn.setFillStyle(0x552222);
        item.btn.setStrokeStyle(2, 0xaa4444);
      } else {
        item.btn.setFillStyle(0x333355);
        item.btn.setStrokeStyle(2, 0x555577);
      }
    });

    this.updatePvPPlayButton();
  }

  updatePvPPlayButton() {
    if (this.pvpPlayerCharacter && this.pvpOpponentCharacter) {
      // Activar botón
      this.pvpPlayButton.setFillStyle(0x228B22);
      this.pvpPlayButton.setStrokeStyle(2, 0x32CD32);
      this.pvpPlayButtonText.setFill('#FFFFFF');
      this.pvpStatusText.setText('¡Listo para luchar!');
      this.pvpStatusText.setFill('#00FF00');

      this.pvpPlayButton.setInteractive({ useHandCursor: true });
      this.pvpPlayButton.on('pointerdown', () => {
        this.startPvPGame();
      });

      this.pvpPlayButton.on('pointerover', () => {
        this.pvpPlayButton.setFillStyle(0x32CD32);
      });

      this.pvpPlayButton.on('pointerout', () => {
        this.pvpPlayButton.setFillStyle(0x228B22);
      });
    } else {
      // Desactivar botón
      this.pvpPlayButton.setFillStyle(0x444444);
      this.pvpPlayButton.setStrokeStyle(2, 0x666666);
      this.pvpPlayButtonText.setFill('#666666');

      let missing = [];
      if (!this.pvpPlayerCharacter) missing.push('tu personaje');
      if (!this.pvpOpponentCharacter) missing.push('el oponente');
      this.pvpStatusText.setText(`Selecciona ${missing.join(' y ')}`);
      this.pvpStatusText.setFill('#FFFF00');

      this.pvpPlayButton.removeInteractive();
      this.pvpPlayButton.off('pointerdown');
      this.pvpPlayButton.off('pointerover');
      this.pvpPlayButton.off('pointerout');
    }
  }

  startPvPGame() {
    this.scene.start('PvPScene', {
      playerCharacter: this.pvpPlayerCharacter,
      opponentCharacter: this.pvpOpponentCharacter,
      isLocalMultiplayer: this.isLocalMultiplayer
    });
  }

  updateModeSelection() {
    // Actualizar estilos de botones según el modo seleccionado
    if (this.isLocalMultiplayer) {
      // Modo local activado
      this.vsPlayerButton.setFillStyle(0x228B22);
      this.vsPlayerButton.setStrokeStyle(3, 0x32CD32);
      this.vsAIButton.setFillStyle(0x333355);
      this.vsAIButton.setStrokeStyle(2, 0x555577);
    } else {
      // Modo IA activado
      this.vsAIButton.setFillStyle(0x228B22);
      this.vsAIButton.setStrokeStyle(3, 0x32CD32);
      this.vsPlayerButton.setFillStyle(0x333355);
      this.vsPlayerButton.setStrokeStyle(2, 0x555577);
    }
  }

  updateOpponentTitle() {
    // Actualizar el título del oponente según el modo
    if (this.isLocalMultiplayer) {
      this.opponentTitle.setText('JUGADOR 2');
      this.opponentTitle.setFill('#FF6600');
    } else {
      this.opponentTitle.setText('OPONENTE IA');
      this.opponentTitle.setFill('#FF0000');
    }
  }

  exitPvPSelection() {
    // Limpiar UI de PvP
    if (this.pvpUIGroup) {
      this.pvpUIGroup.clear(true, true);
      this.pvpUIGroup = null;
    }

    // Resetear selecciones
    this.pvpPlayerCharacter = null;
    this.pvpOpponentCharacter = null;
    this.pvpPlayerButtons = [];
    this.pvpOpponentButtons = [];
  }
}
