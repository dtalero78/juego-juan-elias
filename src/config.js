import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

export const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 650,
  parent: 'game-container',
  backgroundColor: '#1a5f7a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [PreloadScene, MenuScene, GameScene]
};
