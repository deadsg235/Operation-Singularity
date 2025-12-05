"use client";

export class SoundSystem {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playGunshot(volume: number = 0.3) {
    if (!this.audioContext) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);

    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.audioContext.currentTime + 0.15);
    osc2.stop(this.audioContext.currentTime + 0.05);
  }

  playEnemyDeath(volume: number = 0.2) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.audioContext.currentTime);

    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  playPlayerHit(volume: number = 0.25) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }
}

export const soundSystem = new SoundSystem();