import Phaser from 'phaser';
import { isMobile } from '../config.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.selectedBullets = [];
    this.selectedBoss = 'iceBoss'; // Solo IceBoss disponible
    this.selectedCharacter = 'dolphin'; // 'dolphin' o 'colombiaBall'
    this.isMobileDevice = isMobile;

    // PvP mode state
    this.pvpMode = false;
    this.pvpPlayerCharacter = null;
    this.pvpOpponentCharacter = null;
    this.pvpBackground = 'fondoPvpNaranja'; // fondo por defecto
  }

  create() {
    // Fondo
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Tamaños adaptados para móvil
    const subtitleSize = this.isMobileDevice ? '14px' : '18px';
    const selectSize = this.isMobileDevice ? '13px' : '16px';

    // Imagen del personaje detrás del título
    const personajeImg = this.add.image(400, 65, 'personaje');
    personajeImg.setAlpha(0.25);
    const imgScale = this.isMobileDevice ? 0.35 : 0.5;
    personajeImg.setScale(imgScale);
    personajeImg.setDepth(0);

    // Título del juego - épico con sombra
    const titleShadow = this.add.text(402, 32, 'MIELITO EL FUGITIVO', {
      fontSize: this.isMobileDevice ? '30px' : '48px',
      fill: '#8B0000',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    titleShadow.setOrigin(0.5);
    titleShadow.setDepth(1);

    const title = this.add.text(400, 30, 'MIELITO EL FUGITIVO', {
      fontSize: this.isMobileDevice ? '30px' : '48px',
      fill: '#FFD700',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#FF4500',
      strokeThickness: this.isMobileDevice ? 3 : 5
    });
    title.setOrigin(0.5);
    title.setDepth(2);

    // Subtítulo
    const subtitle = this.add.text(400, 70, 'Escapa del villano demoniaco', {
      fontSize: subtitleSize,
      fill: '#FF6347',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    subtitle.setOrigin(0.5);
    subtitle.setDepth(2);

    // Animación de pulso en el título
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Animación suave en la imagen de fondo
    this.tweens.add({
      targets: personajeImg,
      alpha: 0.15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Contador de placas (arriba derecha, al lado del título)
    this.platesCounter = this.add.text(790, 15, `PLACAS: ${this.getPlates()}`, {
      fontSize: '11px',
      fill: '#C0C0C0',
      fontFamily: 'Courier New'
    }).setOrigin(1, 0.5).setDepth(3);

    // === SELECTOR DE PERSONAJE (arriba, justo después del título) ===
    const charSelectY = this.isMobileDevice ? 108 : 115;

    const charText = this.add.text(400, charSelectY - 15, 'Elige tu personaje:', {
      fontSize: this.isMobileDevice ? '11px' : '13px',
      fill: '#fff',
      fontFamily: 'Courier New'
    });
    charText.setOrigin(0.5);

    const charBtnWidth = this.isMobileDevice ? 65 : 100;
    const charXs = [80, 230, 400, 570, 720];

    // Botón Mielito (Delfín)
    this.char1Btn = this.add.rectangle(charXs[0], charSelectY, charBtnWidth, 28, 0x225522);
    this.char1Btn.setStrokeStyle(2, 0x44aa44);
    this.char1Btn.setInteractive({ useHandCursor: true });
    this.char1Text = this.add.text(charXs[0], charSelectY, 'Mielito', {
      fontSize: this.isMobileDevice ? '8px' : '10px',
      fill: '#1E90FF', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Botón Colombia Ball
    this.char2Btn = this.add.rectangle(charXs[1], charSelectY, charBtnWidth, 28, 0x333355);
    this.char2Btn.setStrokeStyle(2, 0x555577);
    this.char2Btn.setInteractive({ useHandCursor: true });
    this.char2Text = this.add.text(charXs[1], charSelectY, 'Colombia', {
      fontSize: this.isMobileDevice ? '8px' : '10px',
      fill: '#FCD116', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Botón Red Triangle
    this.char3Btn = this.add.rectangle(charXs[2], charSelectY, charBtnWidth, 28, 0x333355);
    this.char3Btn.setStrokeStyle(2, 0x555577);
    this.char3Btn.setInteractive({ useHandCursor: true });
    this.char3Text = this.add.text(charXs[2], charSelectY, 'Triángulo', {
      fontSize: this.isMobileDevice ? '8px' : '10px',
      fill: '#FF0000', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Botón Clon
    this.char4Btn = this.add.rectangle(charXs[3], charSelectY, charBtnWidth, 28, 0x333355);
    this.char4Btn.setStrokeStyle(2, 0x555577);
    this.char4Btn.setInteractive({ useHandCursor: true });
    this.char4Text = this.add.text(charXs[3], charSelectY, 'Clon', {
      fontSize: this.isMobileDevice ? '8px' : '10px',
      fill: '#00FF00', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Botón Perrito
    this.char5Btn = this.add.rectangle(charXs[4], charSelectY, charBtnWidth, 28, 0x333355);
    this.char5Btn.setStrokeStyle(2, 0x555577);
    this.char5Btn.setInteractive({ useHandCursor: true });
    this.char5Text = this.add.text(charXs[4], charSelectY, 'Perrito', {
      fontSize: this.isMobileDevice ? '8px' : '10px',
      fill: '#FF00FF', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Eventos de selección de personaje
    this.char1Btn.on('pointerdown', () => this.selectCharacter('dolphin'));
    this.char2Btn.on('pointerdown', () => this.selectCharacter('colombiaBall'));
    this.char3Btn.on('pointerdown', () => this.selectCharacter('redTriangle'));
    this.char4Btn.on('pointerdown', () => this.selectCharacter('clon'));
    this.char5Btn.on('pointerdown', () => this.selectCharacter('perrito'));

    this.char1Btn.on('pointerover', () => { if (this.selectedCharacter !== 'dolphin') this.char1Btn.setFillStyle(0x334433); });
    this.char1Btn.on('pointerout', () => { if (this.selectedCharacter !== 'dolphin') this.char1Btn.setFillStyle(0x333355); });
    this.char2Btn.on('pointerover', () => { if (this.selectedCharacter !== 'colombiaBall') this.char2Btn.setFillStyle(0x443322); });
    this.char2Btn.on('pointerout', () => { if (this.selectedCharacter !== 'colombiaBall') this.char2Btn.setFillStyle(0x333355); });
    this.char3Btn.on('pointerover', () => { if (this.selectedCharacter !== 'redTriangle') this.char3Btn.setFillStyle(0x442222); });
    this.char3Btn.on('pointerout', () => { if (this.selectedCharacter !== 'redTriangle') this.char3Btn.setFillStyle(0x333355); });
    this.char4Btn.on('pointerover', () => { if (this.selectedCharacter !== 'clon') this.char4Btn.setFillStyle(0x224422); });
    this.char4Btn.on('pointerout', () => { if (this.selectedCharacter !== 'clon') this.char4Btn.setFillStyle(0x333355); });
    this.char5Btn.on('pointerover', () => { if (this.selectedCharacter !== 'perrito') this.char5Btn.setFillStyle(0x441144); });
    this.char5Btn.on('pointerout', () => { if (this.selectedCharacter !== 'perrito') this.char5Btn.setFillStyle(0x333355); });

    // Boss fijo: Jefe de Hielo (Pulpo eliminado)

    // === SELECCIÓN DE BALAS (solo visible para Mielito) ===
    this.bulletUIElements = [];

    this.bulletSelectText = this.add.text(400, this.isMobileDevice ? 175 : 185, 'Selecciona 2 tipos de balas:', {
      fontSize: selectSize,
      fill: '#fff',
      fontFamily: 'Courier New'
    });
    this.bulletSelectText.setOrigin(0.5);
    this.bulletUIElements.push(this.bulletSelectText);

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

    const startY = this.isMobileDevice ? 198 : 210;
    const spacing = this.isMobileDevice ? 36 : 42;
    const btnWidth = this.isMobileDevice ? 300 : 350;
    const btnHeight = this.isMobileDevice ? 34 : 40;
    const nameSize = this.isMobileDevice ? '14px' : '18px';
    const descSize = this.isMobileDevice ? '10px' : '12px';

    this.bulletTypes.forEach((bullet, index) => {
      const y = startY + index * spacing;

      const bg = this.add.rectangle(400, y, btnWidth, btnHeight, 0x333355);
      bg.setInteractive({ useHandCursor: true });
      bg.setStrokeStyle(2, 0x555577);

      const nameX = this.isMobileDevice ? 270 : 250;
      const nameText = this.add.text(nameX, y, bullet.name, {
        fontSize: nameSize,
        fill: bullet.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0, 0.5);

      const descX = this.isMobileDevice ? 520 : 550;
      const descContent = this.isMobileDevice ? bullet.desc : bullet.descFull;
      const descText = this.add.text(descX, y, descContent, {
        fontSize: descSize,
        fill: '#aaa',
        fontFamily: 'Courier New'
      });
      descText.setOrigin(1, 0.5);

      const checkX = this.isMobileDevice ? 560 : 600;
      const checkmark = this.add.text(checkX, y, '', {
        fontSize: this.isMobileDevice ? '20px' : '24px',
        fill: '#00FF00',
        fontFamily: 'Courier New'
      });
      checkmark.setOrigin(0.5);

      this.bulletButtons.push({
        type: bullet.type,
        bg,
        checkmark,
        nameText,
        descText,
        selected: false
      });

      this.bulletUIElements.push(bg, nameText, descText, checkmark);

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

    // === TEXTO DE ESTADO Y BOTONES DE JUEGO ===
    const selectionY = this.isMobileDevice ? 460 : 510;
    const playBtnY = this.isMobileDevice ? 500 : 555;
    const controlsY = this.isMobileDevice ? 598 : 638;

    this.selectionText = this.add.text(400, selectionY, 'Selecciona 2 tipos de balas', {
      fontSize: this.isMobileDevice ? '12px' : '14px',
      fill: '#ff6666',
      fontFamily: 'Courier New'
    });
    this.selectionText.setOrigin(0.5);

    // Botón de JUGAR (vs Boss) - izquierda
    const sideBtnWidth = this.isMobileDevice ? 150 : 180;
    const sideBtnHeight = this.isMobileDevice ? 45 : 50;

    this.playButton = this.add.rectangle(300, playBtnY, sideBtnWidth, sideBtnHeight, 0x444444);
    this.playButton.setStrokeStyle(2, 0x666666);

    this.playButtonText = this.add.text(300, playBtnY, 'VS BOSS', {
      fontSize: this.isMobileDevice ? '18px' : '22px',
      fill: '#666666',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.playButtonText.setOrigin(0.5);

    // Botón Modo PvP - derecha (al lado del de boss)
    this.pvpButton = this.add.rectangle(500, playBtnY, sideBtnWidth, sideBtnHeight, 0x663399);
    this.pvpButton.setStrokeStyle(2, 0x9944CC);
    this.pvpButton.setInteractive({ useHandCursor: true });

    this.pvpButtonText = this.add.text(500, playBtnY, 'MODO PvP', {
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

    // Botón TIENDA
    const shopBtnY = this.isMobileDevice ? playBtnY + 48 : playBtnY + 58;
    this.shopButton = this.add.rectangle(400, shopBtnY, sideBtnWidth, sideBtnHeight, 0x664400);
    this.shopButton.setStrokeStyle(2, 0xFFAA00);
    this.shopButton.setInteractive({ useHandCursor: true });

    this.shopButtonText = this.add.text(400, shopBtnY, 'TIENDA', {
      fontSize: this.isMobileDevice ? '18px' : '22px',
      fill: '#FFD700',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.shopButtonText.setOrigin(0.5);

    this.shopButton.on('pointerdown', () => this.openShop());
    this.shopButton.on('pointerover', () => this.shopButton.setFillStyle(0x997700));
    this.shopButton.on('pointerout', () => this.shopButton.setFillStyle(0x664400));

    // Instrucciones de controles
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

    // Inicializar visibilidad de balas y estado del botón play
    this.updateBulletVisibility();
    this.updatePlayButton();
  }

  toggleBulletSelection(index) {
    const button = this.bulletButtons[index];

    if (button.selected) {
      button.selected = false;
      button.bg.setFillStyle(0x333355);
      button.bg.setStrokeStyle(2, 0x555577);
      button.checkmark.setText('');
      this.selectedBullets = this.selectedBullets.filter(t => t !== button.type);
    } else {
      if (this.selectedBullets.length >= 2) {
        return;
      }
      button.selected = true;
      button.bg.setFillStyle(0x225522);
      button.bg.setStrokeStyle(2, 0x44aa44);
      button.checkmark.setText('✓');
      this.selectedBullets.push(button.type);
    }

    this.updatePlayButton();
  }

  updateBulletVisibility() {
    const showBullets = this.selectedCharacter === 'dolphin';
    this.bulletUIElements.forEach(el => el.setVisible(showBullets));
  }

  updatePlayButton() {
    const isDolphin = this.selectedCharacter === 'dolphin';
    const canPlay = isDolphin ? this.selectedBullets.length === 2 : true;

    if (canPlay) {
      this.playButton.setFillStyle(0x228B22);
      this.playButton.setStrokeStyle(2, 0x32CD32);
      this.playButtonText.setFill('#ffffff');

      if (isDolphin) {
        this.selectionText.setText('¡Listo para jugar!');
        this.selectionText.setFill('#00ff00');
      } else {
        this.selectionText.setText('¡Personaje listo!');
        this.selectionText.setFill('#00ff00');
      }

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
    this.char4Btn.setFillStyle(0x333355);
    this.char4Btn.setStrokeStyle(2, 0x555577);
    this.char5Btn.setFillStyle(0x333355);
    this.char5Btn.setStrokeStyle(2, 0x555577);

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
    } else if (charType === 'clon') {
      this.char4Btn.setFillStyle(0x225522);
      this.char4Btn.setStrokeStyle(2, 0x44aa44);
    } else if (charType === 'perrito') {
      this.char5Btn.setFillStyle(0x551155);
      this.char5Btn.setStrokeStyle(2, 0xcc44cc);
    }

    // Si no es dolphin, limpiar selección de balas (clon, colombiaBall, redTriangle no usan balas)
    if (charType !== 'dolphin') {
      this.selectedBullets = [];
      this.bulletButtons.forEach(btn => {
        btn.selected = false;
        btn.bg.setFillStyle(0x333355);
        btn.bg.setStrokeStyle(2, 0x555577);
        btn.checkmark.setText('');
      });
    }

    this.updateBulletVisibility();
    this.updatePlayButton();
  }

  startGame() {
    const sceneName = 'IceBossScene';
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
    const pvpSubtitle = this.add.text(400, 185, 'Elige un personaje para cada lado', {
      fontSize: '15px',
      fill: '#FFFFFF',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(pvpSubtitle);

    // === SELECTOR DE FONDO ===
    const bgLabel = this.add.text(400, 210, 'FONDO:', {
      fontSize: '13px',
      fill: '#AAAAAA',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(bgLabel);

    // Botón Fondo Naranja
    this.bgNaranjaBtn = this.add.rectangle(305, 230, 130, 28, 0x8B4500);
    this.bgNaranjaBtn.setStrokeStyle(2, 0xFF8C00);
    this.bgNaranjaBtn.setInteractive({ useHandCursor: true });
    const bgNaranjaText = this.add.text(305, 230, 'Naranja', {
      fontSize: '13px', fill: '#FFFFFF', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Botón Fondo Gris
    this.bgGrisBtn = this.add.rectangle(490, 230, 130, 28, 0x444444);
    this.bgGrisBtn.setStrokeStyle(2, 0x888888);
    this.bgGrisBtn.setInteractive({ useHandCursor: true });
    const bgGrisText = this.add.text(490, 230, 'Gris', {
      fontSize: '13px', fill: '#FFFFFF', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    const updateBgButtons = () => {
      if (this.pvpBackground === 'fondoPvpNaranja') {
        this.bgNaranjaBtn.setStrokeStyle(3, 0xFFAA00);
        this.bgNaranjaBtn.setFillStyle(0xBB6600);
        this.bgGrisBtn.setStrokeStyle(2, 0x888888);
        this.bgGrisBtn.setFillStyle(0x444444);
      } else {
        this.bgGrisBtn.setStrokeStyle(3, 0xCCCCCC);
        this.bgGrisBtn.setFillStyle(0x666666);
        this.bgNaranjaBtn.setStrokeStyle(2, 0xFF8C00);
        this.bgNaranjaBtn.setFillStyle(0x8B4500);
      }
    };
    updateBgButtons();

    this.bgNaranjaBtn.on('pointerdown', () => {
      this.pvpBackground = 'fondoPvpNaranja';
      updateBgButtons();
    });
    this.bgGrisBtn.on('pointerdown', () => {
      this.pvpBackground = 'fondoPvpGris';
      updateBgButtons();
    });

    this.pvpUIGroup.add(this.bgNaranjaBtn);
    this.pvpUIGroup.add(bgNaranjaText);
    this.pvpUIGroup.add(this.bgGrisBtn);
    this.pvpUIGroup.add(bgGrisText);

    // Sección Jugador 1 (izquierda)
    const playerTitle = this.add.text(200, 253, 'JUGADOR 1', {
      fontSize: '20px',
      fill: '#00FF00',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(playerTitle);

    // Botones de personaje del jugador
    const chars = [
      { name: 'Mielito', type: 'dolphin', color: '#1E90FF', y: 280 },
      { name: 'Colombia', type: 'colombiaBall', color: '#FCD116', y: 322 },
      { name: 'Triángulo', type: 'redTriangle', color: '#FF0000', y: 364 },
      { name: 'Clon', type: 'clon', color: '#00FF00', y: 406 },
      { name: 'Perrito', type: 'perrito', color: '#FF00FF', y: 448 }
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
    this.opponentTitle = this.add.text(600, 253, 'OPONENTE IA', {
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
    this.pvpStatusText = this.add.text(400, 492, 'Selecciona ambos personajes', {
      fontSize: '14px',
      fill: '#FFFF00',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.pvpUIGroup.add(this.pvpStatusText);

    // Botón JUGAR PvP
    this.pvpPlayButton = this.add.rectangle(400, 527, 200, 40, 0x444444);
    this.pvpPlayButton.setStrokeStyle(2, 0x666666);

    this.pvpPlayButtonText = this.add.text(400, 527, 'JUGAR', {
      fontSize: '24px',
      fill: '#666666',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.pvpUIGroup.add(this.pvpPlayButton);
    this.pvpUIGroup.add(this.pvpPlayButtonText);

    // Botón Volver
    const backButton = this.add.rectangle(400, 582, 160, 36, 0x553333);
    backButton.setStrokeStyle(2, 0x775555);
    backButton.setInteractive({ useHandCursor: true });

    const backText = this.add.text(400, 582, 'VOLVER', {
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
      isLocalMultiplayer: this.isLocalMultiplayer,
      pvpBackground: this.pvpBackground
    });
  }

  updateModeSelection() {
    if (this.isLocalMultiplayer) {
      this.vsPlayerButton.setFillStyle(0x228B22);
      this.vsPlayerButton.setStrokeStyle(3, 0x32CD32);
      this.vsAIButton.setFillStyle(0x333355);
      this.vsAIButton.setStrokeStyle(2, 0x555577);
    } else {
      this.vsAIButton.setFillStyle(0x228B22);
      this.vsAIButton.setStrokeStyle(3, 0x32CD32);
      this.vsPlayerButton.setFillStyle(0x333355);
      this.vsPlayerButton.setStrokeStyle(2, 0x555577);
    }
  }

  updateOpponentTitle() {
    if (this.isLocalMultiplayer) {
      this.opponentTitle.setText('JUGADOR 2');
      this.opponentTitle.setFill('#FF6600');
    } else {
      this.opponentTitle.setText('OPONENTE IA');
      this.opponentTitle.setFill('#FF0000');
    }
  }

  exitPvPSelection() {
    if (this.pvpUIGroup) {
      this.pvpUIGroup.clear(true, true);
      this.pvpUIGroup = null;
    }

    this.pvpPlayerCharacter = null;
    this.pvpOpponentCharacter = null;
    this.pvpPlayerButtons = [];
    this.pvpOpponentButtons = [];
  }

  // === TIENDA ===

  getPlates() {
    return parseInt(localStorage.getItem('mielito_plates') || '0', 10);
  }

  savePlates(n) {
    localStorage.setItem('mielito_plates', String(n));
  }

  canSpinToday() {
    const last = localStorage.getItem('mielito_last_spin');
    if (!last) return true;
    const today = new Date().toISOString().split('T')[0];
    return last !== today;
  }

  recordSpin() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('mielito_last_spin', today);
  }

  drawWheelGraphics(g, radius) {
    const toRad = Phaser.Math.DegToRad;

    // 100 placas — verde (50%): 0° a 180°
    g.fillStyle(0x27ae60);
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, radius, toRad(0), toRad(180), false);
    g.closePath();
    g.fillPath();

    // 250 placas — azul (20%): 180° a 252°
    g.fillStyle(0x2980b9);
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, radius, toRad(180), toRad(252), false);
    g.closePath();
    g.fillPath();

    // 500 placas — dorado (10%): 252° a 288°
    g.fillStyle(0xe67e22);
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, radius, toRad(252), toRad(288), false);
    g.closePath();
    g.fillPath();

    // Skin Tierra Perrito — marrón (20%): 288° a 360°
    g.fillStyle(0x8B4513);
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, radius, toRad(288), toRad(360), false);
    g.closePath();
    g.fillPath();

    // Borde y divisores
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(0, 0, radius);
    g.lineStyle(2, 0xffffff, 1);
    g.lineBetween(0, 0, radius, 0);
    g.lineBetween(0, 0, radius * Math.cos(toRad(180)), radius * Math.sin(toRad(180)));
    g.lineBetween(0, 0, radius * Math.cos(toRad(252)), radius * Math.sin(toRad(252)));
    g.lineBetween(0, 0, radius * Math.cos(toRad(288)), radius * Math.sin(toRad(288)));

    // Punto central
    g.fillStyle(0xffffff);
    g.fillCircle(0, 0, 7);
  }

  openShop() {
    this.shopUIGroup = this.add.group();
    this.isSpinning = false;

    const overlay = this.add.rectangle(400, 325, 800, 650, 0x000000, 0.9);
    overlay.setDepth(10);
    this.shopUIGroup.add(overlay);

    const title = this.add.text(400, 30, 'TIENDA', {
      fontSize: '36px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(title);

    this.shopPlatesText = this.add.text(400, 65, `Tienes: ${this.getPlates()} placas de metal`, {
      fontSize: '14px', fill: '#C0C0C0', fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(this.shopPlatesText);

    // Separador vertical
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x444444, 1);
    divider.lineBetween(400, 85, 400, 635);
    divider.setDepth(11);
    this.shopUIGroup.add(divider);

    // ═══════════ COLUMNA IZQUIERDA: RULETA ═══════════
    const wheelX = 200, wheelY = 255;
    const radius = 105;

    this.wheelContainer = this.add.container(wheelX, wheelY);
    this.wheelContainer.setDepth(11);
    this.shopUIGroup.add(this.wheelContainer);

    const wg = this.add.graphics();
    this.drawWheelGraphics(wg, radius);
    this.wheelContainer.add(wg);

    const toRad = Phaser.Math.DegToRad;
    const lr = radius * 0.62;
    [{ text: '100', angle: 90 }, { text: '250', angle: 216 }, { text: '500', angle: 270 }, { text: 'Tierra', angle: 324 }].forEach(l => {
      const rad = toRad(l.angle);
      const lt = this.add.text(lr * Math.cos(rad), lr * Math.sin(rad), l.text, {
        fontSize: '13px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.wheelContainer.add(lt);
    });

    const ptrG = this.add.graphics({ x: wheelX, y: wheelY - radius - 6 });
    ptrG.fillStyle(0xFF3333);
    ptrG.fillTriangle(-9, -13, 9, -13, 0, 4);
    ptrG.setDepth(12);
    this.shopUIGroup.add(ptrG);

    const legendY = wheelY + radius + 14;
    [
      { color: '#2ecc71', text: '■ 100 PLACAS — 50%' },
      { color: '#3498db', text: '■ 250 PLACAS — 20%' },
      { color: '#e67e22', text: '■ 500 PLACAS — 10%' },
      { color: '#cd7f32', text: '■ Skin Tierra — 20%' }
    ].forEach((l, i) => {
      const lt = this.add.text(200, legendY + i * 16, l.text, {
        fontSize: '12px', fill: l.color, fontFamily: 'Courier New'
      }).setOrigin(0.5).setDepth(11);
      this.shopUIGroup.add(lt);
    });

    const spinBtnY = legendY + 4 * 16 + 18;
    if (this.canSpinToday()) {
      const spinBtn = this.add.rectangle(200, spinBtnY, 190, 40, 0x7B3F00);
      spinBtn.setStrokeStyle(2, 0xFFD700);
      spinBtn.setInteractive({ useHandCursor: true });
      spinBtn.setDepth(11);
      const spinTxt = this.add.text(200, spinBtnY, '¡GIRAR RULETA!', {
        fontSize: '15px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12);
      spinBtn.on('pointerdown', () => {
        if (!this.isSpinning) {
          spinBtn.removeInteractive();
          spinBtn.setFillStyle(0x444444);
          spinTxt.setFill('#666666');
          this.spinRoulette();
        }
      });
      spinBtn.on('pointerover', () => spinBtn.setFillStyle(0xAA6020));
      spinBtn.on('pointerout', () => spinBtn.setFillStyle(0x7B3F00));
      this.shopUIGroup.add(spinBtn);
      this.shopUIGroup.add(spinTxt);
    } else {
      const msg = this.add.text(200, spinBtnY, 'Vuelve mañana', {
        fontSize: '12px', fill: '#888888', fontFamily: 'Courier New'
      }).setOrigin(0.5).setDepth(11);
      this.shopUIGroup.add(msg);
    }

    this.spinResultText = this.add.text(200, spinBtnY + 44, '', {
      fontSize: '17px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(this.spinResultText);

    // ═══════════ COLUMNA DERECHA: SKINS DE CLON ═══════════
    const skinX = 600;

    const skinTitle = this.add.text(skinX, 100, 'SKINS DE CLON', {
      fontSize: '16px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(skinTitle);

    const owned = this.isClonRobotOwned();
    const activeSkin = this.getClonSkin();

    // --- Original ---
    const origX = 510, robotX = 690;
    const previewY = 230;

    const origImg = this.add.image(origX, previewY, 'clon').setScale(0.55).setDepth(11);
    this.shopUIGroup.add(origImg);
    const origLabel = this.add.text(origX, previewY + 55, 'Original', {
      fontSize: '12px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(origLabel);

    // Botón equipar original
    const origBtnColor = activeSkin === 'default' ? 0x225522 : 0x333355;
    const origBtnBorder = activeSkin === 'default' ? 0x44aa44 : 0x555577;
    const origBtn = this.add.rectangle(origX, previewY + 80, 100, 30, origBtnColor);
    origBtn.setStrokeStyle(2, origBtnBorder).setDepth(11);
    origBtn.setInteractive({ useHandCursor: true });
    const origBtnTxt = this.add.text(origX, previewY + 80,
      activeSkin === 'default' ? 'EQUIPADO' : 'EQUIPAR', {
        fontSize: '11px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12);
    this.shopUIGroup.add(origBtn);
    this.shopUIGroup.add(origBtnTxt);

    // --- Robot ---
    const robotImg = this.add.image(robotX, previewY, 'clon_robot').setScale(0.55).setDepth(11);
    this.shopUIGroup.add(robotImg);
    const robotLabel = this.add.text(robotX, previewY + 55, 'Clon Robot', {
      fontSize: '12px', fill: '#00FF99', fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(robotLabel);

    if (owned) {
      const robotBtnColor = activeSkin === 'robot' ? 0x225522 : 0x333355;
      const robotBtnBorder = activeSkin === 'robot' ? 0x44aa44 : 0x555577;
      const robotBtn = this.add.rectangle(robotX, previewY + 80, 100, 30, robotBtnColor);
      robotBtn.setStrokeStyle(2, robotBtnBorder).setDepth(11);
      robotBtn.setInteractive({ useHandCursor: true });
      const robotBtnTxt = this.add.text(robotX, previewY + 80,
        activeSkin === 'robot' ? 'EQUIPADO' : 'EQUIPAR', {
          fontSize: '11px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12);
      this.shopUIGroup.add(robotBtn);
      this.shopUIGroup.add(robotBtnTxt);

      robotBtn.on('pointerdown', () => {
        this.setClonSkin('robot');
        this.closeShop();
        this.openShop();
      });
    } else {
      // Botón comprar
      const buyBtn = this.add.rectangle(robotX, previewY + 80, 120, 30, 0x553300);
      buyBtn.setStrokeStyle(2, 0xFFAA00).setDepth(11);
      buyBtn.setInteractive({ useHandCursor: true });
      const buyTxt = this.add.text(robotX, previewY + 80, '200 PLACAS', {
        fontSize: '11px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12);
      this.shopUIGroup.add(buyBtn);
      this.shopUIGroup.add(buyTxt);

      buyBtn.on('pointerdown', () => {
        if (this.getPlates() >= 200) {
          this.savePlates(this.getPlates() - 200);
          localStorage.setItem('mielito_clon_robot_owned', 'true');
          this.closeShop();
          this.openShop();
        } else {
          buyTxt.setText('FALTAN PLACAS');
          buyTxt.setFill('#ff4444');
          this.time.delayedCall(1500, () => {
            if (buyTxt.active) { buyTxt.setText('200 PLACAS'); buyTxt.setFill('#FFD700'); }
          });
        }
      });
      buyBtn.on('pointerover', () => buyBtn.setFillStyle(0x886600));
      buyBtn.on('pointerout', () => buyBtn.setFillStyle(0x553300));
    }

    // Botón equipar original (lógica)
    origBtn.on('pointerdown', () => {
      this.setClonSkin('default');
      this.closeShop();
      this.openShop();
    });

    // Descripción Clon
    const desc = this.add.text(skinX, previewY + 120, owned
      ? 'Elige tu skin activa'
      : 'Compra el skin robot\npor 200 placas de metal', {
      fontSize: '11px', fill: '#aaaaaa', fontFamily: 'Courier New', align: 'center'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(desc);

    // ═══════════ SKINS DE PERRITO ═══════════
    const pSkinTitle = this.add.text(skinX, previewY + 155, 'SKINS DE PERRITO', {
      fontSize: '14px', fill: '#FF88FF', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(pSkinTitle);

    const pTierraOwned = this.isPerritoTierraOwned();
    const pActiveSkin = this.getPerritoSkin();
    const pOrigX = 510, pTierraX = 690;
    const pPreviewY = previewY + 230;

    // Original
    const pOrigImg = this.add.image(pOrigX, pPreviewY, 'perrito').setScale(0.45).setDepth(11);
    this.shopUIGroup.add(pOrigImg);
    const pOrigLabel = this.add.text(pOrigX, pPreviewY + 45, 'Original', {
      fontSize: '11px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(pOrigLabel);

    const pOrigBtnColor = pActiveSkin === 'default' ? 0x225522 : 0x333355;
    const pOrigBtnBorder = pActiveSkin === 'default' ? 0x44aa44 : 0x555577;
    const pOrigBtn = this.add.rectangle(pOrigX, pPreviewY + 68, 100, 28, pOrigBtnColor);
    pOrigBtn.setStrokeStyle(2, pOrigBtnBorder).setDepth(11).setInteractive({ useHandCursor: true });
    const pOrigBtnTxt = this.add.text(pOrigX, pPreviewY + 68,
      pActiveSkin === 'default' ? 'EQUIPADO' : 'EQUIPAR', {
        fontSize: '10px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12);
    this.shopUIGroup.add(pOrigBtn);
    this.shopUIGroup.add(pOrigBtnTxt);

    // Tierra
    const pTierraImg = this.add.image(pTierraX, pPreviewY, 'perrito_tierra').setScale(0.45).setDepth(11);
    this.shopUIGroup.add(pTierraImg);
    const pTierraLabel = this.add.text(pTierraX, pPreviewY + 45, 'Tierra', {
      fontSize: '11px', fill: '#cd7f32', fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(11);
    this.shopUIGroup.add(pTierraLabel);

    if (pTierraOwned) {
      const pTierraBtnColor = pActiveSkin === 'tierra' ? 0x225522 : 0x333355;
      const pTierraBtnBorder = pActiveSkin === 'tierra' ? 0x44aa44 : 0x555577;
      const pTierraBtn = this.add.rectangle(pTierraX, pPreviewY + 68, 100, 28, pTierraBtnColor);
      pTierraBtn.setStrokeStyle(2, pTierraBtnBorder).setDepth(11).setInteractive({ useHandCursor: true });
      const pTierraBtnTxt = this.add.text(pTierraX, pPreviewY + 68,
        pActiveSkin === 'tierra' ? 'EQUIPADO' : 'EQUIPAR', {
          fontSize: '10px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12);
      this.shopUIGroup.add(pTierraBtn);
      this.shopUIGroup.add(pTierraBtnTxt);

      pTierraBtn.on('pointerdown', () => {
        this.setPerritoSkin('tierra');
        this.closeShop();
        this.openShop();
      });
    } else {
      const pBuyBtn = this.add.rectangle(pTierraX, pPreviewY + 68, 120, 28, 0x553300);
      pBuyBtn.setStrokeStyle(2, 0xAA6020).setDepth(11).setInteractive({ useHandCursor: true });
      const pBuyTxt = this.add.text(pTierraX, pPreviewY + 68, '300 PLACAS', {
        fontSize: '10px', fill: '#FFD700', fontFamily: 'Courier New', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12);
      this.shopUIGroup.add(pBuyBtn);
      this.shopUIGroup.add(pBuyTxt);

      pBuyBtn.on('pointerdown', () => {
        if (this.getPlates() >= 300) {
          this.savePlates(this.getPlates() - 300);
          localStorage.setItem('mielito_perrito_tierra_owned', 'true');
          this.closeShop();
          this.openShop();
        } else {
          pBuyTxt.setText('FALTAN PLACAS');
          pBuyTxt.setFill('#ff4444');
          this.time.delayedCall(1500, () => {
            if (pBuyTxt.active) { pBuyTxt.setText('300 PLACAS'); pBuyTxt.setFill('#FFD700'); }
          });
        }
      });
      pBuyBtn.on('pointerover', () => pBuyBtn.setFillStyle(0x886620));
      pBuyBtn.on('pointerout', () => pBuyBtn.setFillStyle(0x553300));
    }

    pOrigBtn.on('pointerdown', () => {
      this.setPerritoSkin('default');
      this.closeShop();
      this.openShop();
    });

    // Botón cerrar
    const closeBtn = this.add.rectangle(400, 618, 160, 36, 0x553333);
    closeBtn.setStrokeStyle(2, 0x775555).setInteractive({ useHandCursor: true }).setDepth(11);
    const closeTxt = this.add.text(400, 618, 'CERRAR', {
      fontSize: '16px', fill: '#FFFFFF', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(12);
    closeBtn.on('pointerdown', () => this.closeShop());
    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x775555));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x553333));
    this.shopUIGroup.add(closeBtn);
    this.shopUIGroup.add(closeTxt);
  }

  spinRoulette() {
    this.isSpinning = true;

    const rand = Math.random();
    let prize, segStart, segEnd;
    if (rand < 0.5) {
      prize = 100; segStart = 0; segEnd = 180;
    } else if (rand < 0.7) {
      prize = 250; segStart = 180; segEnd = 252;
    } else if (rand < 0.8) {
      prize = 500; segStart = 252; segEnd = 288;
    } else {
      prize = 'perrito_tierra'; segStart = 288; segEnd = 360;
    }

    // El puntero apunta al tope (-90° en coords locales de la ruleta).
    // Queremos que al parar, el sector ganador quede bajo el puntero.
    // efectivo = (-90 - finalAngle) mod 360  debe caer en [segStart, segEnd)
    const targetLocal = segStart + Math.random() * (segEnd - segStart);
    const finalAngle = ((-90 - targetLocal) % 360 + 360) % 360;
    const totalRotation = finalAngle + 360 * 6;

    this.tweens.add({
      targets: this.wheelContainer,
      angle: totalRotation,
      duration: 3500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isSpinning = false;
        this.recordSpin();

        let resultColor, resultMsg;
        if (prize === 'perrito_tierra') {
          localStorage.setItem('mielito_perrito_tierra_owned', 'true');
          resultColor = '#cd7f32';
          resultMsg = '¡Skin Tierra desbloqueada!';
        } else {
          const newTotal = this.getPlates() + prize;
          this.savePlates(newTotal);
          this.shopPlatesText.setText(`Tienes: ${newTotal} placas de metal`);
          this.platesCounter.setText(`PLACAS: ${newTotal}`);
          resultColor = prize === 500 ? '#e67e22' : prize === 250 ? '#3498db' : '#2ecc71';
          resultMsg = `¡Ganaste ${prize} placas!`;
        }
        this.spinResultText.setText(resultMsg);
        this.spinResultText.setFill(resultColor);

        this.tweens.add({
          targets: this.spinResultText,
          scaleX: 1.3, scaleY: 1.3,
          duration: 250,
          yoyo: true,
          repeat: 2
        });
      }
    });
  }

  closeShop() {
    if (this.shopUIGroup) {
      this.shopUIGroup.clear(true, true);
      this.shopUIGroup = null;
    }
    this.wheelContainer = null;
  }

  isClonRobotOwned() {
    return localStorage.getItem('mielito_clon_robot_owned') === 'true';
  }

  getClonSkin() {
    return localStorage.getItem('mielito_clon_skin') || 'default';
  }

  setClonSkin(skin) {
    localStorage.setItem('mielito_clon_skin', skin);
    this.platesCounter.setText(`PLACAS: ${this.getPlates()}`);
  }

  isPerritoTierraOwned() {
    return localStorage.getItem('mielito_perrito_tierra_owned') === 'true';
  }

  getPerritoSkin() {
    return localStorage.getItem('mielito_perrito_skin') || 'default';
  }

  setPerritoSkin(skin) {
    localStorage.setItem('mielito_perrito_skin', skin);
    this.platesCounter.setText(`PLACAS: ${this.getPlates()}`);
  }
}
