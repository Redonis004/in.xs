

class SoundService {
  private ctx: AudioContext | null = null;
  private muted = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
  }

  play(type: 'click' | 'tab' | 'success' | 'error' | 'send' | 'oink' | 'camera' | 'pop' | 'lock' | 'unlock' | 'typing' | 'scan' | 'trash' | 'ring' | 'hangup') {
    if (this.muted) return;
    
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = 0.4;
    
    osc.connect(gain);
    gain.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
        break;

      case 'tab':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;

      case 'send':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      
      case 'typing':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.start(t);
        osc.stop(t + 0.03);
        break;

      case 'scan':
        // Modern biometric pulse scan sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.5);
        osc.frequency.linearRampToValueAtTime(200, t + 1.0);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.5);
        gain.gain.linearRampToValueAtTime(0, t + 1.0);
        osc.start(t);
        osc.stop(t + 1.0);
        break;

      case 'success':
        this.playTone(523.25, 'sine', t, 0.1); // C5
        this.playTone(659.25, 'sine', t + 0.05, 0.1); // E5
        this.playTone(783.99, 'sine', t + 0.1, 0.2); // G5
        break;

      case 'oink':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.25);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 10;
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(100, t + 0.2);
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);
        osc.start(t);
        osc.stop(t + 0.25);
        break;

      case 'pop':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      
      case 'lock':
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
        
      case 'unlock':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
        break;

      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.2);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;

      case 'trash':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.15);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
        
      case 'camera':
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.connect(gain);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        noise.start(t);
        break;

      case 'ring':
        // Electronic warble for calling
        osc.type = 'sine';
        const now = t;
        // Pulse 1
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        // Pulse 2
        const now2 = now + 0.6;
        gain.gain.setValueAtTime(0.1, now2);
        osc.frequency.setValueAtTime(440, now2);
        gain.gain.linearRampToValueAtTime(0.1, now2 + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.9);
        
        osc.start(now);
        osc.stop(now + 1.5);
        break;

      case 'hangup':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.3);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
    }
  }

  private playTone(freq: number, type: OscillatorType, startTime: number, duration: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const master = this.ctx.createGain();
      master.gain.value = 0.3;
      osc.connect(gain);
      gain.connect(master);
      master.connect(this.ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
  }
}

export const soundService = new SoundService();
