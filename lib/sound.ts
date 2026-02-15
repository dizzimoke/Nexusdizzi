
import { useEffect, useState } from 'react';

// Simple synthesized sounds to avoid external assets and ensure zero-latency
class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Load mute preference
    if (typeof localStorage !== 'undefined') {
      this.muted = localStorage.getItem('nexus_muted') === 'true';
    }
  }

  private ensureContext() {
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  public toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('nexus_muted', String(this.muted));
    return this.muted;
  }

  public isMuted() {
    return this.muted;
  }

  // Crisp high-pitch click for tabs
  public playTick() {
    if (this.muted || !this.ensureContext() || !this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Mechanical Click (New)
  public playClick() {
     if (this.muted || !this.ensureContext() || !this.ctx) return;
     const t = this.ctx.currentTime;
     
     const osc = this.ctx.createOscillator();
     osc.type = 'square';
     osc.frequency.setValueAtTime(200, t);
     osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.05);
     
     const gain = this.ctx.createGain();
     gain.gain.setValueAtTime(0.05, t);
     gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
     
     const filter = this.ctx.createBiquadFilter();
     filter.type = 'lowpass';
     filter.frequency.setValueAtTime(1000, t);

     osc.connect(filter);
     filter.connect(gain);
     gain.connect(this.ctx.destination);
     osc.start(t);
     osc.stop(t + 0.05);
  }

  // Data Static / Crunch (New)
  public playStatic() {
    if (this.muted || !this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5s
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3; 
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(200, t + 0.4);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  // Soft bubble pop for widgets
  public playPop() {
    if (this.muted || !this.ensureContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.15);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Ethereal shimmer for success/auth
  public playShimmer() {
    if (this.muted || !this.ensureContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    // Major triad arpeggio
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      const start = t + (i * 0.05);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.03, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  // AirDrop-style Whoosh (White Noise Sweep)
  public playWhoosh() {
    if (this.muted || !this.ensureContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Create White Noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter Sweep
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Success Ding (High Sine Ping)
  public playDing() {
     if (this.muted || !this.ensureContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }
}

export const soundEngine = new SoundEngine();

export const useSound = () => {
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());

  const toggle = () => {
    const newVal = soundEngine.toggleMute();
    setIsMuted(newVal);
  };

  return {
    playTick: () => soundEngine.playTick(),
    playClick: () => soundEngine.playClick(),
    playStatic: () => soundEngine.playStatic(),
    playPop: () => soundEngine.playPop(),
    playShimmer: () => soundEngine.playShimmer(),
    playWhoosh: () => soundEngine.playWhoosh(),
    playDing: () => soundEngine.playDing(),
    toggleMute: toggle,
    isMuted
  };
};
