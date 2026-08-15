/**
 * Bejacastle - Realistic Recorded & Layered Web Audio Engine
 * Uses authentic field recordings and foley audio samples (Thunder, Wind, Rain,
 * Wolves, Ravens, Church Bells, Heavy Creaking Doors, Steps, Heartbeats, Music Box)
 * with real-time Web Audio API processing, spatial pitch randomization, and procedural fallbacks.
 */

class CastleAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = localStorage.getItem('bejacastle_muted') === 'true';
    this.masterVolume = 0.50;
    this.ambientVolume = 0.14; // Reduced by 50% for subtle background atmosphere

    // Cache for preloaded and decoded real audio buffers
    this.audioBuffers = new Map();
    this.loadingPromises = new Map();

    // Manifest of real audio files located in /static/audio/ (served at /audio/ or /static/audio/)
    this.soundManifest = {
      thunder: 'audio/thunder.ogg',
      wind_howl: 'audio/wind_howl.ogg',
      rain_thunder: 'audio/rain_thunder.ogg',
      wolf_howl: 'audio/wolf_howl.ogg',
      raven_caw: 'audio/raven_caw.ogg',
      church_bell: 'audio/church_bell.ogg',
      clock_tick: 'audio/clock_tick.ogg',
      door_creak_wood: 'audio/door_creak_wood.ogg',
      creak_wood_1: 'audio/creak_wood_1.ogg',
      creak_wood_2: 'audio/creak_wood_2.ogg',
      creak_wood_3: 'audio/creak_wood_3.ogg',
      door_open_1: 'audio/door_open_1.ogg',
      door_open_2: 'audio/door_open_2.ogg',
      door_close_1: 'audio/door_close_1.ogg',
      door_creak_iron: 'audio/door_creak_iron.ogg',
      metal_latch: 'audio/metal_latch.ogg',
      heartbeat: 'audio/heartbeat.ogg',
      whisper: 'audio/whisper.ogg',
      ghost_whisper_wind: 'audio/ghost_whisper_wind.ogg',
      ghost_laugh: 'audio/ghost_laugh.mp3',
      musicbox_1: 'audio/musicbox_1.ogg',
      musicbox_2: 'audio/musicbox_2.ogg',
      musicbox_3: 'audio/musicbox_3.ogg',
      footstep_grass_0: 'audio/footstep_grass_0.ogg',
      footstep_grass_1: 'audio/footstep_grass_1.ogg',
      footstep_grass_2: 'audio/footstep_grass_2.ogg',
      footstep_stone_0: 'audio/footstep_stone_0.ogg',
      footstep_stone_1: 'audio/footstep_stone_1.ogg',
      footstep_stone_2: 'audio/footstep_stone_2.ogg',
      lock_click: 'audio/lock_click.ogg',
      item_found: 'audio/item_found.ogg',
      book_open: 'audio/book_open.ogg',
      book_flip: 'audio/book_flip.ogg',
      ui_click: 'audio/ui_click.ogg',
      dialogue_tick: 'audio/dialogue_tick.ogg',
      horror_stinger: 'audio/horror_stinger.mp3',
      horror_stinger_2: 'audio/horror_stinger_2.mp3',
      player_damage: 'audio/player_damage.mp3'
    };

    // Ambient loop nodes
    this.ambientNodes = {
      windSource: null,
      windGain: null,
      rainSource: null,
      rainGain: null,
      droneOsc: null,
      droneGain: null,
      isPlaying: false
    };

    // Auto-preload core samples
    this.preloadPrioritySamples();
  }

  /**
   * Initialize Web Audio Context and Master Gain Node
   */
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Preload high-priority sound samples in the background
   */
  preloadPrioritySamples() {
    const priorityKeys = [
      'thunder', 'wind_howl', 'rain_thunder', 'footstep_grass_0', 'footstep_grass_1',
      'footstep_stone_0', 'footstep_stone_1', 'dialogue_tick', 'ui_click',
      'door_open_1', 'creak_wood_1', 'metal_latch', 'wolf_howl', 'raven_caw',
      'horror_stinger', 'church_bell', 'heartbeat', 'item_found'
    ];
    priorityKeys.forEach(key => this.loadSample(key));
  }

  /**
   * Load and decode an audio sample from manifest
   */
  async loadSample(key) {
    if (this.audioBuffers.has(key)) {
      return this.audioBuffers.get(key);
    }
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const url = this.soundManifest[key];
    if (!url) return null;

    const promise = (async () => {
      try {
        let response = await fetch(url);
        if (!response.ok) {
          response = await fetch(`static/${url}`);
        }
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        
        // Ensure AudioContext is ready for decoding
        this.init();
        if (!this.ctx) return null;

        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(key, audioBuffer);
        return audioBuffer;
      } catch (err) {
        console.warn(`[CastleAudio] Could not load sample '${key}' (${url}):`, err);
        return null;
      }
    })();

    this.loadingPromises.set(key, promise);
    return promise;
  }

  /**
   * Play a decoded audio buffer with volume, pitch variation, and filters
   */
  async playSample(key, options = {}) {
    if (this.muted) return null;
    this.init();
    if (!this.ctx) return null;

    const {
      volume = 1.0,
      playbackRate = 1.0,
      detune = 0,
      loop = false,
      offset = 0,
      duration = undefined,
      fadeIn = 0,
      fadeOut = 0,
      lowpassFreq = null,
      highpassFreq = null
    } = options;

    let buffer = this.audioBuffers.get(key);
    if (!buffer) {
      buffer = await this.loadSample(key);
    }
    if (!buffer) return null;

    try {
      const now = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;
      source.playbackRate.setValueAtTime(playbackRate, now);
      if (detune !== 0 && source.detune) {
        source.detune.setValueAtTime(detune, now);
      }

      // Gain node for volume & envelopes
      const gainNode = this.ctx.createGain();
      const targetGain = this.masterVolume * volume;

      if (fadeIn > 0) {
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(targetGain, now + fadeIn);
      } else {
        gainNode.gain.setValueAtTime(targetGain, now);
      }

      if (fadeOut > 0 && duration) {
        gainNode.gain.setValueAtTime(targetGain, now + duration - fadeOut);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      }

      let lastNode = source;

      // Optional lowpass / highpass filters
      if (lowpassFreq) {
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(lowpassFreq, now);
        lastNode.connect(lp);
        lastNode = lp;
      }
      if (highpassFreq) {
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(highpassFreq, now);
        lastNode.connect(hp);
        lastNode = hp;
      }

      lastNode.connect(gainNode);
      gainNode.connect(this.masterGain || this.ctx.destination);

      if (duration !== undefined) {
        source.start(now, offset, duration);
      } else {
        source.start(now, offset);
      }

      return { source, gainNode };
    } catch (e) {
      console.warn(`[CastleAudio] Playback error for '${key}':`, e);
      return null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('bejacastle_muted', this.muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    if (this.muted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    return this.muted;
  }

  setVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  // ==========================================
  // REALISTIC AMBIENT SOUNDSCAPES
  // ==========================================

  async startAmbient() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.ambientNodes.isPlaying) return;

    try {
      const now = this.ctx.currentTime;
      this.ambientNodes.isPlaying = true;

      // 1. Howling wind ambient loop (real recording)
      const windBuffer = await this.loadSample('wind_howl');
      if (windBuffer && this.ambientNodes.isPlaying) {
        const windSource = this.ctx.createBufferSource();
        windSource.buffer = windBuffer;
        windSource.loop = true;
        windSource.playbackRate.setValueAtTime(0.95, now);

        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.setValueAtTime(1400, now);

        const windGain = this.ctx.createGain();
        windGain.gain.setValueAtTime(0.001, now);
        windGain.gain.linearRampToValueAtTime(this.ambientVolume * 0.50, now + 2.0);

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.masterGain || this.ctx.destination);
        windSource.start(now);

        this.ambientNodes.windSource = windSource;
        this.ambientNodes.windGain = windGain;
      }

      // 2. Distant rain & rumble ambient loop (real recording)
      const rainBuffer = await this.loadSample('rain_thunder');
      if (rainBuffer && this.ambientNodes.isPlaying) {
        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = rainBuffer;
        rainSource.loop = true;

        const rainGain = this.ctx.createGain();
        rainGain.gain.setValueAtTime(0.001, now);
        rainGain.gain.linearRampToValueAtTime(this.ambientVolume * 0.40, now + 2.5);

        rainSource.connect(rainGain);
        rainGain.connect(this.masterGain || this.ctx.destination);
        rainSource.start(now);

        this.ambientNodes.rainSource = rainSource;
        this.ambientNodes.rainGain = rainGain;
      }

      // 3. Subtle sub-drone for dark atmosphere
      const droneOsc = this.ctx.createOscillator();
      droneOsc.type = 'sine';
      droneOsc.frequency.setValueAtTime(55, now); // A1

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.linearRampToValueAtTime(this.ambientVolume * 0.20, now + 2.0);

      droneOsc.connect(droneGain);
      droneGain.connect(this.masterGain || this.ctx.destination);
      droneOsc.start(now);

      this.ambientNodes.droneOsc = droneOsc;
      this.ambientNodes.droneGain = droneGain;
    } catch (e) {
      console.warn("Ambient audio init skipped:", e);
    }
  }

  stopAmbient() {
    if (!this.ambientNodes.isPlaying) return;
    try {
      if (this.ambientNodes.windSource) {
        this.ambientNodes.windSource.stop();
        this.ambientNodes.windSource.disconnect();
      }
      if (this.ambientNodes.rainSource) {
        this.ambientNodes.rainSource.stop();
        this.ambientNodes.rainSource.disconnect();
      }
      if (this.ambientNodes.droneOsc) {
        this.ambientNodes.droneOsc.stop();
        this.ambientNodes.droneOsc.disconnect();
      }
    } catch (e) {}
    this.ambientNodes.isPlaying = false;
  }

  // ==========================================
  // REALISTIC RECORDED SOUND EFFECTS
  // ==========================================

  /**
   * Footsteps on forest ground (Crunching real leaves & forest soil)
   */
  playFootstepForest() {
    if (this.muted) return;
    const variants = ['footstep_grass_0', 'footstep_grass_1', 'footstep_grass_2'];
    const pick = variants[Math.floor(Math.random() * variants.length)];
    const rate = 0.94 + Math.random() * 0.12;

    this.playSample(pick, {
      volume: 0.45,
      playbackRate: rate
    });
  }

  /**
   * Footsteps on stone castle corridor (Real stone & concrete steps)
   */
  playFootstepStone() {
    if (this.muted) return;
    const variants = ['footstep_stone_0', 'footstep_stone_1', 'footstep_stone_2'];
    const pick = variants[Math.floor(Math.random() * variants.length)];
    const rate = 0.92 + Math.random() * 0.16;

    this.playSample(pick, {
      volume: 0.50,
      playbackRate: rate
    });
  }

  /**
   * Real Thunder & Lightning Acoustic Shockwave
   * Plays authentic thunderclap recording with sub-bass impact layer
   */
  playThunder() {
    if (this.muted) return;
    this.init();

    // 1. Play real thunder recording
    this.playSample('thunder', {
      volume: 1.1,
      playbackRate: 0.96 + Math.random() * 0.08
    });

    // 2. Layer deep physical sub-bass rumble (30Hz - 80Hz)
    if (this.ctx) {
      try {
        const now = this.ctx.currentTime;
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();

        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

        subGain.gain.setValueAtTime(this.masterVolume * 0.7, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain || this.ctx.destination);

        subOsc.start(now);
        subOsc.stop(now + 1.25);
      } catch (e) {}
    }
  }

  /**
   * Wind gust surge
   */
  playWindGust() {
    if (this.muted) return;
    this.playSample('wind_howl', {
      volume: 0.35,
      playbackRate: 1.05 + Math.random() * 0.1,
      duration: 3.5,
      fadeIn: 0.4,
      fadeOut: 1.2
    });
  }

  /**
   * Real creaking door / iron castle gate
   */
  playDoorCreak(isIron = false) {
    if (this.muted) return;
    if (isIron) {
      this.playSample('door_creak_iron', {
        volume: 0.80,
        playbackRate: 0.95 + Math.random() * 0.1
      });
      this.playSample('metal_latch', { volume: 0.6 });
    } else {
      const woodVariants = ['creak_wood_1', 'creak_wood_2', 'creak_wood_3', 'door_open_1', 'door_creak_wood'];
      const pick = woodVariants[Math.floor(Math.random() * woodVariants.length)];
      this.playSample(pick, {
        volume: 0.75,
        playbackRate: 0.92 + Math.random() * 0.15
      });
    }
  }

  /**
   * Real Recorded Heartbeat (Thump-Thump)
   */
  playHeartbeat(intensity = 1.0) {
    if (this.muted) return;
    this.playSample('heartbeat', {
      volume: 0.85 * intensity,
      playbackRate: 0.95 * intensity
    });
  }

  /**
   * Eerie Ghost / Phantom Whisper & Chill
   */
  playGhostMoan() {
    if (this.muted) return;
    const ghostSounds = ['whisper', 'ghost_whisper_wind', 'ghost_laugh'];
    const pick = ghostSounds[Math.floor(Math.random() * ghostSounds.length)];
    this.playSample(pick, {
      volume: pick === 'ghost_laugh' ? 0.45 : 0.65,
      playbackRate: 0.85 + Math.random() * 0.25
    });
  }

  /**
   * Real human whisper in the dark
   */
  playWhisper() {
    if (this.muted) return;
    this.playSample('whisper', {
      volume: 0.75,
      playbackRate: 0.9 + Math.random() * 0.2
    });
  }

  /**
   * Real wild Wolf Howl in the forest
   */
  playWolfHowl() {
    if (this.muted) return;
    this.playSample('wolf_howl', {
      volume: 0.85,
      playbackRate: 0.96 + Math.random() * 0.08
    });
  }

  /**
   * Real Northern Raven Caw
   */
  playRavenCaw() {
    if (this.muted) return;
    this.playSample('raven_caw', {
      volume: 0.80,
      playbackRate: 0.95 + Math.random() * 0.1
    });
  }

  /**
   * Orchestral Horror Braam & Jumpscare Stinger
   */
  playHorrorStinger() {
    if (this.muted) return;
    const stingers = ['horror_stinger', 'horror_stinger_2'];
    const pick = stingers[Math.floor(Math.random() * stingers.length)];
    this.playSample(pick, {
      volume: 0.95,
      playbackRate: 1.0
    });
  }

  /**
   * Real Castle / Church Tower Bell Toll
   */
  playClockBell() {
    if (this.muted) return;
    this.playSample('church_bell', {
      volume: 0.85,
      playbackRate: 0.95 + Math.random() * 0.05
    });
  }

  /**
   * Antique Lock / Key Pick Mechanism Click
   */
  playLockClick() {
    if (this.muted) return;
    this.playSample('lock_click', { volume: 0.8 });
    setTimeout(() => {
      this.playSample('metal_latch', { volume: 0.7 });
    }, 90);
  }

  /**
   * Real Coins / Relic Item Discovery Sound
   */
  playItemFound() {
    if (this.muted) return;
    this.playSample('item_found', {
      volume: 0.85,
      playbackRate: 1.0 + Math.random() * 0.08
    });
  }

  /**
   * Real Antique Music Box Melody
   */
  playMusicBox() {
    if (this.muted) return;
    const notes = ['musicbox_1', 'musicbox_2', 'musicbox_3', 'musicbox_2', 'musicbox_1'];
    notes.forEach((note, idx) => {
      setTimeout(() => {
        this.playSample(note, {
          volume: 0.7,
          playbackRate: 1.0 + (idx * 0.08)
        });
      }, idx * 280);
    });
  }

  /**
   * Real Typewriter / Quill Parchment Dialogue Tick
   * Soft volume with micro pitch jitter
   */
  playDialogueBlip() {
    if (this.muted) return;
    const rate = 0.95 + Math.random() * 0.15;
    this.playSample('dialogue_tick', {
      volume: 0.12,
      playbackRate: rate
    });
  }

  /**
   * Real crisp UI button click
   */
  playClick() {
    if (this.muted) return;
    this.playSample('ui_click', {
      volume: 0.45,
      playbackRate: 1.0 + (Math.random() * 0.1 - 0.05)
    });
  }

  /**
   * Real parchment journal open / page flip
   */
  playBookOpen() {
    if (this.muted) return;
    this.playSample('book_open', { volume: 0.75 });
  }

  playBookFlip() {
    if (this.muted) return;
    this.playSample('book_flip', { volume: 0.70 });
  }

  /**
   * Real player damage / shock gasp
   */
  playDamage() {
    if (this.muted) return;
    this.playSample('player_damage', { volume: 0.85 });
  }
}

window.CastleAudio = CastleAudioEngine;
window.CastleAudioEngine = CastleAudioEngine;
window.castleAudio = new CastleAudioEngine();
