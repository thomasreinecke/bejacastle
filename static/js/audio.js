/**
 * Bejacastle - Procedural Horror Web Audio Synthesizer
 * Generates an extensive collection of eerie, atmospheric sound effects,
 * ambient background soundscapes, and chiptune horror stingers without external audio files.
 */

class CastleAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('bejacastle_muted') === 'true';
    this.masterVolume = 0.45;
    this.ambientVolume = 0.25;

    // Ambient loop nodes
    this.ambientNodes = {
      windSource: null,
      windFilter: null,
      windGain: null,
      droneOsc1: null,
      droneOsc2: null,
      droneGain: null,
      isPlaying: false
    };

    // Heartbeat state
    this.heartbeatTimer = null;
    this.heartRate = 70; // BPM
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('bejacastle_muted', this.muted);
    if (this.muted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    return this.muted;
  }

  setVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
  }

  // ==========================================
  // AMBIENT SOUNDSCAPES (Continuous Procedural)
  // ==========================================

  startAmbient() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.ambientNodes.isPlaying) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Procedural Howling Wind Generator (Filtered Noise)
      const bufferSize = this.ctx.sampleRate * 4;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const windSource = this.ctx.createBufferSource();
      windSource.buffer = noiseBuffer;
      windSource.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(320, now);
      windFilter.Q.setValueAtTime(4.0, now);

      // Slow LFO to modulate wind frequency (gusts)
      const windLFO = this.ctx.createOscillator();
      windLFO.frequency.setValueAtTime(0.12, now);
      const windLFOGain = this.ctx.createGain();
      windLFOGain.gain.setValueAtTime(180, now);
      windLFO.connect(windLFOGain);
      windLFOGain.connect(windFilter.frequency);
      windLFO.start(now);

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(this.ambientVolume * 0.4, now);

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.ctx.destination);
      windSource.start(now);

      // 2. Dark Horror Sub-Drone (Binaural beating eerie low drone)
      const droneOsc1 = this.ctx.createOscillator();
      const droneOsc2 = this.ctx.createOscillator();
      droneOsc1.type = 'sawtooth';
      droneOsc2.type = 'sine';
      droneOsc1.frequency.setValueAtTime(55, now);   // A1
      droneOsc2.frequency.setValueAtTime(55.8, now); // Detuned beat frequency

      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(160, now);

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(this.ambientVolume * 0.22, now);

      droneOsc1.connect(droneFilter);
      droneOsc2.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.ctx.destination);

      droneOsc1.start(now);
      droneOsc2.start(now);

      this.ambientNodes = {
        windSource,
        windFilter,
        windGain,
        droneOsc1,
        droneOsc2,
        droneGain,
        isPlaying: true
      };
    } catch (e) {
      console.warn("Ambient audio init skipped:", e);
    }
  }

  stopAmbient() {
    if (!this.ambientNodes.isPlaying) return;
    try {
      if (this.ambientNodes.windSource) this.ambientNodes.windSource.stop();
      if (this.ambientNodes.droneOsc1) this.ambientNodes.droneOsc1.stop();
      if (this.ambientNodes.droneOsc2) this.ambientNodes.droneOsc2.stop();
    } catch (e) {}
    this.ambientNodes.isPlaying = false;
  }

  // ==========================================
  // PROCEDURAL HORROR SOUND EFFECTS
  // ==========================================

  /**
   * Footsteps on forest ground (crunching twigs & leaves)
   */
  playFootstepForest() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.09;

    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Footsteps in stone castle corridor (hollow stone tap)
   */
  playFootstepStone() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Thunderclap & distant rumble
   */
  playThunder() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 2.2;

    // 1. Initial lightning crackle
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const envelope = Math.exp(-i / (this.ctx.sampleRate * 0.5)) + 0.2 * Math.exp(-i / (this.ctx.sampleRate * 1.5));
      d[i] = (Math.random() * 2 - 1) * envelope;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(70, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.95, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // 2. Sub-bass ground tremor
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + duration * 0.9);

    subGain.gain.setValueAtTime(this.masterVolume * 0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + duration * 0.9);
  }

  /**
   * Creaking heavy wooden door / rusty castle gate
   */
  playDoorCreak(isIron = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 1.1;

    // Carrier
    const osc = this.ctx.createOscillator();
    osc.type = isIron ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isIron ? 130 : 95, now);
    osc.frequency.linearRampToValueAtTime(isIron ? 280 : 160, now + dur * 0.7);
    osc.frequency.linearRampToValueAtTime(isIron ? 110 : 80, now + dur);

    // Modulator for the raspy groaning creak texture
    const mod = this.ctx.createOscillator();
    mod.type = 'square';
    mod.frequency.setValueAtTime(22, now);
    mod.frequency.linearRampToValueAtTime(14, now + dur);

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(isIron ? 120 : 70, now);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(this.masterVolume * 0.7, now + 0.2);
    mainGain.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + 0.8);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    mod.start(now);
    osc.start(now);
    mod.stop(now + dur);
    osc.stop(now + dur);
  }

  /**
   * Heartbeat thud (Lub-Dub)
   */
  playHeartbeat(intensity = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const triggerThud = (delay, freq, vol) => {
      const t = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * intensity, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.14);

      gain.gain.setValueAtTime(this.masterVolume * vol * intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    };

    // Lub
    triggerThud(0, 75, 0.75);
    // Dub
    triggerThud(0.13, 62, 0.55);
  }

  /**
   * Eerie Ghost / Phantom Whisper Drone
   */
  playGhostMoan() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 1.8;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sawtooth';

    const base = 280 + Math.random() * 80;
    osc1.frequency.setValueAtTime(base, now);
    osc1.frequency.linearRampToValueAtTime(base * 1.35, now + dur * 0.5);
    osc1.frequency.linearRampToValueAtTime(base * 0.75, now + dur);

    osc2.frequency.setValueAtTime(base * 1.5, now);
    osc2.frequency.linearRampToValueAtTime(base * 1.1, now + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(6.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, now + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);
  }

  /**
   * Distant Wolf Howl in the deep woods
   */
  playWolfHowl() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 2.4;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';

    // Howl frequency envelope
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(680, now + 0.7);
    osc.frequency.setValueAtTime(680, now + 1.2);
    osc.frequency.linearRampToValueAtTime(260, now + dur);

    // Vibrato
    const vib = this.ctx.createOscillator();
    vib.frequency.setValueAtTime(4.5, now);
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(14, now);
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.55, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    vib.start(now);
    osc.start(now);
    vib.stop(now + dur);
    osc.stop(now + dur);
  }

  /**
   * Raven Caw
   */
  playRavenCaw() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.32;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(310, now + dur);

    // Harsh ring modulator
    const mod = this.ctx.createOscillator();
    mod.type = 'square';
    mod.frequency.setValueAtTime(75, now);
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(180, now);
    mod.connect(modGain);
    modGain.connect(osc.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    mod.start(now);
    osc.start(now);
    mod.stop(now + dur);
    osc.stop(now + dur);
  }

  /**
   * Horror Jumpscare / Stinger Impact
   */
  playHorrorStinger() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 1.6;

    // Discordant tritone cluster (F#, G, C, C#)
    const freqs = [185.00, 196.00, 261.63, 277.18, 554.37];

    freqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.88, now + dur);

      gain.gain.setValueAtTime(this.masterVolume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    });

    // Harsh metal strike noise
    const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.4), this.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(this.masterVolume * 0.8, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);
  }

  /**
   * Ominous Castle Grandfather Clock / Tower Bell Toll
   */
  playClockBell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 3.0;

    // Bell inharmonic partials
    const partials = [110, 220, 311.13, 440, 622.25];
    const decayRatios = [1.0, 0.8, 0.6, 0.4, 0.3];

    partials.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const pDur = dur * decayRatios[i];
      gain.gain.setValueAtTime(this.masterVolume * 0.45 * (1 / (i + 1)), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + pDur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + pDur);
    });
  }

  /**
   * Key / Metal Lock-Pick Mechanism Click
   */
  playLockClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

    gain.gain.setValueAtTime(this.masterVolume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Item / Relic Discovery Jingle
   */
  playItemFound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [329.63, 392.00, 493.88, 659.25, 783.99]; // E4, G4, B4, E5, G5

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(this.masterVolume * 0.6, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  /**
   * Spooky Music Box Melancholy Chord
   */
  playMusicBox() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [587.33, 523.25, 493.88, 440.00, 392.00, 329.63];

    melody.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.22);

      gain.gain.setValueAtTime(this.masterVolume * 0.5, now + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.22);
      osc.stop(now + i * 0.22 + 0.6);
    });
  }

  /**
   * Story Dialogue Typewriter blip
   */
  playDialogueBlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260 + (Math.random() * 60 - 30), now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.025);

    gain.gain.setValueAtTime(this.masterVolume * 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * General UI Button Click
   */
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.03);

    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }
}

window.castleAudio = new CastleAudioEngine();
