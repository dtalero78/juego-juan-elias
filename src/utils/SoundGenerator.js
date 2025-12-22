// Generador de sonidos usando Web Audio API
export default class SoundGenerator {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
    this.sounds = {};
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createAllSounds();
    } catch (e) {
      console.warn('Web Audio API no disponible:', e);
    }
  }

  createAllSounds() {
    // Disparo del delfín
    this.sounds.shoot = this.createShootSound();
    // Disparo de fuego
    this.sounds.shootFire = this.createFireShootSound();
    // Disparo de hielo
    this.sounds.shootIce = this.createIceShootSound();
    // Salto
    this.sounds.jump = this.createJumpSound();
    // Dash
    this.sounds.dash = this.createDashSound();
    // Daño recibido
    this.sounds.hurt = this.createHurtSound();
    // Explosión
    this.sounds.explosion = this.createExplosionSound();
    // Recoger powerup
    this.sounds.pickup = this.createPickupSound();
    // Victoria
    this.sounds.victory = this.createVictorySound();
    // Game over
    this.sounds.gameOver = this.createGameOverSound();
    // Hit al enemigo
    this.sounds.hit = this.createHitSound();
  }

  // Disparo normal - sonido tipo "pew"
  createShootSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.1);
    };
  }

  // Disparo de fuego - sonido más grave y potente
  createFireShootSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.15);
    };
  }

  // Disparo de hielo - sonido cristalino
  createIceShootSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.2);
    };
  }

  // Sonido de salto
  createJumpSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.1);
    };
  }

  // Sonido de dash - swoosh rápido
  createDashSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.15);
    };
  }

  // Sonido de daño
  createHurtSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);

      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.2);
    };
  }

  // Sonido de explosión
  createExplosionSound() {
    return () => {
      if (!this.audioContext) return;
      const bufferSize = this.audioContext.sampleRate * 0.3;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }

      const source = this.audioContext.createBufferSource();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);

      gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      source.start(this.audioContext.currentTime);
    };
  }

  // Sonido de recoger powerup
  createPickupSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    };
  }

  // Sonido de victoria
  createVictorySound() {
    return () => {
      if (!this.audioContext) return;
      const notes = [523, 659, 784, 1047]; // Do, Mi, Sol, Do alto

      notes.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        const startTime = this.audioContext.currentTime + i * 0.15;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    };
  }

  // Sonido de game over
  createGameOverSound() {
    return () => {
      if (!this.audioContext) return;
      const notes = [400, 350, 300, 200];

      notes.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        const startTime = this.audioContext.currentTime + i * 0.2;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    };
  }

  // Sonido de golpear al enemigo
  createHitSound() {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.1);

      gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.1);
    };
  }

  // Reproducir un sonido
  play(soundName) {
    if (this.sounds[soundName]) {
      // Reanudar el contexto si está suspendido (por políticas del navegador)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.sounds[soundName]();
    }
  }
}
