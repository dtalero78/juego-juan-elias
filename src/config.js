import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import IceBossScene from './scenes/IceBossScene.js';

// Detectar si es dispositivo móvil o tablet
// iPad con Safari moderno reporta como MacOS, hay que detectarlo por touch + plataforma
const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  /iPad/i.test(navigator.userAgent);

export const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  isIPad ||
  ('ontouchstart' in window && navigator.maxTouchPoints > 1);

export const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 650,
  parent: 'game-container',
  backgroundColor: '#1a5f7a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 260
    },
    max: {
      width: 800,
      height: 650
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  input: {
    activePointers: 3 // Permitir múltiples toques simultáneos
  },
  scene: [PreloadScene, MenuScene, GameScene, IceBossScene]
};
