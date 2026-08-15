/**
 * Bejacastle - Realistic 2.5D Gothic Horror Game Engine
 * Features:
 *  - 2.5D Tilted Overhead Perspective with Y-Sorting / Depth Sorting
 *  - Volumetric Natural Artwork (Tall Pine Trees, Gothic Stone Walls, Fireplaces, Bookcases, Sarcophagi, Wanderer)
 *  - Natural Gothic Lighting & Volumetric Shadow Engine
 *  - Multi-Slot Local JSON Save / Load System & Auto-Save
 *  - 5 Atmospheric Story Chapters with Puzzles, Lore & Multiple Endings
 */

class CastleGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Virtual resolution (840x525 widescreen 2.5D resolution)
    this.width = 840;
    this.height = 525;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Grid (28 columns x 17 rows)
    this.cols = 28;
    this.rows = 17;
    this.tileW = this.width / this.cols; // 30px
    this.tileH = this.height / this.rows; // ~30.88px

    // Game state: 'TITLE', 'PLAYING', 'DIALOGUE', 'PAUSED'
    this.state = 'TITLE';
    this.chapterIndex = 0;
    this.gameTimeSec = 0;
    this.lastTime = performance.now();
    this.currentSlot = 'auto';

    // Player definition (2.5D Wanderer)
    this.player = {
      x: 90,
      y: 260,
      w: 22,
      h: 36,
      renderYOffset: 34, // Baseline for Y-sorting
      speed: 3.2,
      sprintSpeed: 4.8,
      facing: 'DOWN', // 'UP', 'DOWN', 'LEFT', 'RIGHT'
      animFrame: 0,
      animTimer: 0,
      isMoving: false,
      hasLantern: false,
      lanternOil: 100,
      sanity: 100,
      maxSanity: 100,
      isParalyzed: false,
      paralysisTimer: 0,
      paralysisTotal: 0,
      shockCooldown: 6.0,
      inventory: []
    };

    this.hallucinations = [];

    // Environmental state
    this.lightningTimer = 300 + Math.random() * 400;
    this.isLightning = false;
    this.lightningAlpha = 0;
    this.lightningState = {
      active: false,
      timer: 0,
      duration: 0.65,
      bolts: []
    };
    this.fogParticles = [];
    this.dustParticles = [];
    this.embers = [];
    this.rainDrops = [];

    // Entities & Map data
    this.map = [];
    this.entities = [];
    this.ghosts = [];
    this.interactiveTarget = null;

    // Dialogue overlay
    this.currentDialogue = null;
    this.dialogueTimer = 0;

    // Input keys
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      action: false
    };

    // Offscreen lighting canvas
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = this.width;
    this.lightCanvas.height = this.height;
    this.lightCtx = this.lightCanvas.getContext('2d');

    this.initParticles();
    this.bindInputs();
    this.checkInitialSaveState();
  }

  initParticles() {
    this.fogParticles = [];
    for (let i = 0; i < 30; i++) {
      this.fogParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: 60 + Math.random() * 80,
        vx: (Math.random() * 0.2 + 0.05) * (Math.random() > 0.5 ? 1 : -1),
        vy: (Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1),
        alpha: 0.08 + Math.random() * 0.12
      });
    }

    this.dustParticles = [];
    for (let i = 0; i < 45; i++) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    this.rainDrops = [];
    for (let i = 0; i < 80; i++) {
      this.rainDrops.push({
        x: Math.random() * (this.width + 100),
        y: Math.random() * this.height,
        len: 10 + Math.random() * 14,
        speed: 14 + Math.random() * 8
      });
    }

    this.embers = [];
    for (let i = 0; i < 25; i++) {
      this.embers.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1
      });
    }
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) this.keys.sprint = true;

      if (['KeyE', 'Space', 'Enter'].includes(e.code)) {
        this.keys.action = true;
        this.handleActionKey();
      }

      // Quick Save (F5 or S)
      if (e.code === 'F5') {
        e.preventDefault();
        this.saveGame('slot_1', 'Manueller Schnellspeicherstand');
      }

      if (e.code === 'KeyM') {
        if (window.castleAudio) {
          const muted = window.castleAudio.toggleMute();
          const btn = document.getElementById('soundBtn');
          if (btn) btn.textContent = muted ? '🔇 SOUND: AUS' : '🔊 SOUND: AN';
        }
      }

      if (e.code === 'KeyJ') {
        if (window.castleUI) window.castleUI.toggleJournal();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) this.keys.sprint = false;
      if (['KeyE', 'Space', 'Enter'].includes(e.code)) this.keys.action = false;
    });

    this.canvas.addEventListener('click', () => {
      if (this.state === 'DIALOGUE') {
        this.advanceDialogue();
      } else if (this.state === 'PLAYING') {
        this.handleActionKey();
      }
    });
  }

  handleActionKey() {
    if (this.player.isParalyzed) {
      this.player.paralysisTimer -= 0.6;
      if (window.castleAudio) window.castleAudio.playHeartbeat(1.8);
      if (this.player.paralysisTimer <= 0) {
        this.player.isParalyzed = false;
        this.player.paralysisTimer = 0;
        this.player.shockCooldown = 9.0;
        if (window.castleUI) window.castleUI.showNotification('Du kommst wieder zu Kräften und erhebst dich!');
      }
      return;
    }

    if (this.state === 'DIALOGUE') {
      this.advanceDialogue();
      return;
    }

    if (this.state === 'PLAYING' && this.interactiveTarget) {
      this.interactWithEntity(this.interactiveTarget);
    }
  }

  async checkInitialSaveState() {
    try {
      const res = await fetch('/api/saves');
      const saves = await res.json();
      if (saves && saves.length > 0 && window.castleUI) {
        window.castleUI.enableResumeButton(saves[0]);
      }
    } catch (e) {
      const localSave = localStorage.getItem('bejacastle_save_auto');
      if (localSave && window.castleUI) {
        window.castleUI.enableResumeButton(JSON.parse(localSave));
      }
    }
  }

  // ==========================================
  // SERIALIZATION & JSON SAVE / LOAD SYSTEM
  // ==========================================

  serializeState(slotTitle = null) {
    const ch = CASTLE_STORY.chapters[this.chapterIndex] || {};
    return {
      slot: this.currentSlot,
      title: slotTitle || `Kapitel ${this.chapterIndex + 1}: ${ch.name || 'Schloss Beja'}`,
      chapterIndex: this.chapterIndex,
      chapterName: ch.name || `Kapitel ${this.chapterIndex + 1}`,
      gameTimeSec: Math.round(this.gameTimeSec),
      timestamp: new Date().toLocaleString('de-DE'),
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        facing: this.player.facing,
        hasLantern: this.player.hasLantern,
        sanity: Math.round(this.player.sanity),
        inventory: [...this.player.inventory]
      },
      entities: this.entities.map(e => ({
        id: e.id,
        type: e.type,
        collected: !!e.collected,
        activated: !!e.activated,
        lit: !!e.lit,
        locked: !!e.locked
      }))
    };
  }

  async saveGame(slotId = 'auto', title = null) {
    this.currentSlot = slotId;
    const stateData = this.serializeState(title);

    // 1. Save to server JSON file
    try {
      await fetch(`/api/save/${slotId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateData)
      });
    } catch (err) {
      console.warn("Server save error, using local fallback:", err);
    }

    // 2. Save to localStorage backup
    localStorage.setItem(`bejacastle_save_${slotId}`, JSON.stringify(stateData));
    localStorage.setItem('bejacastle_latest_slot', slotId);

    if (window.castleUI) {
      window.castleUI.showNotification(`💾 Spielstand gespeichert (${slotId.toUpperCase()})`);
      window.castleUI.enableResumeButton(stateData);
    }
  }

  async loadGame(slotId = 'auto') {
    let stateData = null;

    // Try server JSON file first
    try {
      const res = await fetch(`/api/save/${slotId}`);
      if (res.ok) {
        stateData = await res.json();
      }
    } catch (e) {}

    // Fallback to localStorage
    if (!stateData) {
      const local = localStorage.getItem(`bejacastle_save_${slotId}`);
      if (local) stateData = JSON.parse(local);
    }

    if (!stateData) {
      if (window.castleUI) window.castleUI.showNotification("⚠️ Kein Spielstand gefunden.");
      return false;
    }

    this.currentSlot = slotId;
    this.gameTimeSec = stateData.gameTimeSec || 0;
    this.chapterIndex = stateData.chapterIndex || 0;

    // Restore map & entities for chapter
    this.loadChapter(this.chapterIndex, false);

    // Restore player state
    if (stateData.player) {
      this.player.x = stateData.player.x;
      this.player.y = stateData.player.y;
      this.player.facing = stateData.player.facing || 'DOWN';
      this.player.hasLantern = !!stateData.player.hasLantern;
      this.player.sanity = stateData.player.sanity || 100;
      this.player.inventory = stateData.player.inventory || [];
    }

    // Restore entity puzzle states
    if (stateData.entities && Array.isArray(stateData.entities)) {
      stateData.entities.forEach(savedEnt => {
        const target = this.entities.find(e => e.id === savedEnt.id);
        if (target) {
          if (savedEnt.collected !== undefined) target.collected = savedEnt.collected;
          if (savedEnt.activated !== undefined) target.activated = savedEnt.activated;
          if (savedEnt.lit !== undefined) target.lit = savedEnt.lit;
          if (savedEnt.locked !== undefined) target.locked = savedEnt.locked;
        }
      });
      // Remove already collected items from map
      this.entities = this.entities.filter(e => !e.collected);
    }

    this.state = 'PLAYING';
    if (window.castleAudio) window.castleAudio.startAmbient();
    if (window.castleUI) {
      window.castleUI.hideAllModals();
      window.castleUI.updateInventory(this.player.inventory);
      window.castleUI.updateSanity(this.player.sanity, false);
      window.castleUI.showNotification(`📂 Spielstand geladen: ${stateData.title || slotId}`);
    }
    return true;
  }

  startNewGame() {
    this.gameTimeSec = 0;
    this.player.inventory = [];
    this.player.sanity = 100;
    this.player.hasLantern = false;
    this.player.isParalyzed = false;
    this.player.paralysisTimer = 0;
    this.player.shockCooldown = 6.0;
    this.hallucinations = [];
    this.loadChapter(0, true);
    this.state = 'PLAYING';
    if (window.castleAudio) window.castleAudio.startAmbient();
    if (window.castleUI) {
      window.castleUI.hideAllModals();
      window.castleUI.updateInventory([]);
      window.castleUI.updateSanity(100, false);
    }
    this.saveGame('auto', 'Neues Spiel gestartet');
  }

  // ==========================================
  // CHAPTER SETUP & 2.5D MAP CREATION
  // ==========================================

  loadChapter(index, showIntro = true) {
    this.chapterIndex = index;
    const ch = CASTLE_STORY.chapters[index];
    this.entities = [];
    this.ghosts = [];

    if (index === 0) {
      this.player.x = 90;
      this.player.y = 260;
      this.buildForestMap();
    } else if (index === 1) {
      this.player.x = 100;
      this.player.y = 260;
      this.buildCourtyardMap();
    } else if (index === 2) {
      this.player.x = 420;
      this.player.y = 440;
      this.buildGrandHallMap();
    } else if (index === 3) {
      this.player.x = 110;
      this.player.y = 260;
      this.buildCryptMap();
    } else if (index === 4) {
      this.player.x = 420;
      this.player.y = 440;
      this.buildTowerMap();
    }

    if (showIntro) {
      this.startDialogue({
        title: ch.name,
        speaker: "ERZÄHLER",
        lines: ch.introText,
        onComplete: () => {
          if (window.castleAudio) window.castleAudio.startAmbient();
          this.saveGame('auto', `Kapitel ${index + 1}: ${ch.name}`);
        }
      });
    }

    if (window.castleUI) window.castleUI.updateChapterInfo(ch);
  }

  buildForestMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        // Border trees
        if (r === 0 || r === this.rows - 1 || (c === 0 && r !== 8) || (c === this.cols - 1 && r !== 8)) {
          this.map[r][c] = 1; // 2.5D Pine Tree
        } else if ((c === 7 && r < 12) || (c === 14 && r > 4) || (c === 20 && (r < 7 || r > 11))) {
          this.map[r][c] = 1;
        } else {
          this.map[r][c] = 0; // Natural forest soil
        }
      }
    }

    // Lantern on rustic tree stump
    this.entities.push({
      id: 'lantern_pickup',
      type: 'item',
      itemId: 'lantern',
      name: 'Messing-Öllaterne',
      x: 200,
      y: 130,
      w: 24,
      h: 30,
      renderYOffset: 26,
      icon: '🏮',
      collected: false,
      desc: 'Eine schwere Messinglaterne. Vertreibt die drückende Finsternis des Waldes!'
    });

    // 2.5D Ancient Monolith 1
    this.entities.push({
      id: 'monolith_1',
      type: 'puzzle_monolith',
      name: 'Uralter Eulen-Runenstein',
      x: 350,
      y: 100,
      w: 36,
      h: 52,
      renderYOffset: 48,
      activated: false,
      desc: 'Ein bemooster Basalt-Monolith. Die Eulen-Rune wartet auf warmes Laternenlicht.'
    });

    // 2.5D Ancient Monolith 2
    this.entities.push({
      id: 'monolith_2',
      type: 'puzzle_monolith',
      name: 'Uralter Wolfs-Runenstein',
      x: 540,
      y: 410,
      w: 36,
      h: 52,
      renderYOffset: 48,
      activated: false,
      desc: 'Ein schroffer Runenstein mit eingemeißeltem Wolf. Er pulsiert eisig im Nachtwind.'
    });

    // Lore Tree
    this.entities.push({
      id: 'tree_lore',
      type: 'lore',
      name: 'Verkrüppelte Blutbuche',
      x: 280,
      y: 390,
      w: 36,
      h: 48,
      renderYOffset: 44,
      loreKey: 'tree_faces'
    });

    // Exit Stairway to Castle Plateau
    this.entities.push({
      id: 'exit_staircase',
      type: 'door',
      name: 'Steintreppe zum Schlossplateau',
      x: 780,
      y: 235,
      w: 40,
      h: 60,
      renderYOffset: 55,
      locked: true,
      desc: 'Dichte Dornenranken versperren den Aufgang. Aktiviere beide Runensteine im Wald!'
    });
  }

  buildCourtyardMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 || r === this.rows - 1 || c === 0) {
          this.map[r][c] = 2; // 2.5D Castle Wall
        } else if (c === this.cols - 1 && (r < 7 || r > 9)) {
          this.map[r][c] = 2;
        } else if (c === 11 && r > 5 && r < 12) {
          this.map[r][c] = 3; // 2.5D Cemetery Wrought Iron Fence
        } else {
          this.map[r][c] = 0; // Cobblestone
        }
      }
    }

    // Gate Gear
    this.entities.push({
      id: 'mausoleum_gear',
      type: 'item',
      itemId: 'gate_gear',
      name: 'Zahnrad der Zugbrücke',
      x: 240,
      y: 110,
      w: 28,
      h: 30,
      renderYOffset: 26,
      icon: '⚙️',
      collected: false,
      desc: 'Ein geschmiedetes Eisen-Zahnrad für die Winde der Zugbrücke.'
    });

    // Tombstone Lore
    this.entities.push({
      id: 'tomb_lore',
      type: 'lore',
      name: 'Graf Heinrichs Ruhestätte',
      x: 180,
      y: 360,
      w: 32,
      h: 40,
      renderYOffset: 36,
      loreKey: 'tombstone_graveyard'
    });

    // Castle Gate Key
    this.entities.push({
      id: 'gate_key',
      type: 'item',
      itemId: 'castle_key',
      name: 'Eisenschlüssel von Schloss Beja',
      x: 290,
      y: 390,
      w: 24,
      h: 28,
      renderYOffset: 24,
      icon: '🗝️',
      collected: false,
      desc: 'Ein kunstvoll geschmiedeter Schlossschlüssel mit dem Wappen der Bejas.'
    });

    // Gargoyle statue
    this.entities.push({
      id: 'gargoyle_lore',
      type: 'lore',
      name: 'Schwarzer Wasserspeier',
      x: 690,
      y: 160,
      w: 34,
      h: 44,
      renderYOffset: 40,
      loreKey: 'gargoyle_gate'
    });

    // Castle Main Gate Door
    this.entities.push({
      id: 'castle_main_gate',
      type: 'door',
      name: 'Großes Schlosstor',
      x: 780,
      y: 220,
      w: 42,
      h: 70,
      renderYOffset: 65,
      locked: true,
      desc: 'Das Haupttor ist verriegelt und die Winde der Zugbrücke benötigt das Zahnrad!'
    });
  }

  buildGrandHallMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 && (c < 12 || c > 15)) {
          this.map[r][c] = 2; // North Wall
        } else if (r === this.rows - 1 && (c < 12 || c > 15)) {
          this.map[r][c] = 2; // South Wall
        } else if (c === 0 || c === this.cols - 1) {
          this.map[r][c] = 2; // Side Walls
        } else if ((c === 8 || c === 19) && (r === 6 || r === 10)) {
          this.map[r][c] = 5; // 2.5D Gothic Stone Pillar
        } else {
          this.map[r][c] = 0; // Oak / Carpet floor
        }
      }
    }

    // Grandfather Clock
    this.entities.push({
      id: 'grand_clock',
      type: 'lore',
      name: 'Antike Standuhr',
      x: 120,
      y: 90,
      w: 32,
      h: 56,
      renderYOffset: 52,
      loreKey: 'grand_clock'
    });

    // Creepy Portrait
    this.entities.push({
      id: 'portrait_lore',
      type: 'lore',
      name: 'Porträt der Gräfin Eleonore',
      x: 720,
      y: 90,
      w: 36,
      h: 50,
      renderYOffset: 46,
      loreKey: 'creepy_portrait'
    });

    // 2.5D Fireplace Braziers
    this.entities.push({
      id: 'brazier_left',
      type: 'puzzle_fire',
      name: 'Linker Kamin',
      x: 280,
      y: 70,
      w: 44,
      h: 46,
      renderYOffset: 42,
      lit: false,
      desc: 'Ein massiver Steinkamin mit kalter Asche. Entzünde ihn mit deiner Laterne!'
    });

    this.entities.push({
      id: 'brazier_right',
      type: 'puzzle_fire',
      name: 'Rechter Kamin',
      x: 560,
      y: 70,
      w: 44,
      h: 46,
      renderYOffset: 42,
      lit: false,
      desc: 'Ein erloschener Steinkamin. Er wartet auf ein loderndes Feuer.'
    });

    // Diary Page 1
    this.entities.push({
      id: 'diary_entry_1',
      type: 'diary',
      name: 'Tagebuch Seite 12',
      x: 420,
      y: 260,
      w: 26,
      h: 28,
      renderYOffset: 24,
      icon: '📜',
      diaryIndex: 0
    });

    // Library Portal
    this.entities.push({
      id: 'library_door',
      type: 'door',
      name: 'Pforte zur Verbotenen Bibliothek',
      x: 400,
      y: 10,
      w: 44,
      h: 44,
      renderYOffset: 40,
      locked: true,
      desc: 'Die Pforte ist magisch versiegelt. Entzünde die beiden Kamine im Saal!'
    });
  }

  buildCryptMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
          this.map[r][c] = 2; // Crypt Walls
        } else if ((c % 5 === 0 && r > 3 && r < 13)) {
          this.map[r][c] = 4; // 2.5D Bookcases / Sarcophagi
        } else {
          this.map[r][c] = 0;
        }
      }
    }

    // Family Crest
    this.entities.push({
      id: 'beja_crest',
      type: 'item',
      itemId: 'library_crest',
      name: 'Goldenes Familienwappen der Bejas',
      x: 310,
      y: 130,
      w: 26,
      h: 30,
      renderYOffset: 26,
      icon: '🛡️',
      collected: false,
      desc: 'Ein graviertes Wappen, das die wandernden Geister der Ahnen besänftigt.'
    });

    // Sarcophagus Lore
    this.entities.push({
      id: 'crypt_sarcophagus',
      type: 'lore',
      name: 'Marmor-Sarkophag der Ahnen',
      x: 560,
      y: 370,
      w: 48,
      h: 38,
      renderYOffset: 34,
      loreKey: 'sarcophagus_crypt'
    });

    // Diary Page 2
    this.entities.push({
      id: 'diary_entry_2',
      type: 'diary',
      name: 'Tagebuch Seite 89',
      x: 670,
      y: 110,
      w: 26,
      h: 28,
      renderYOffset: 24,
      icon: '📜',
      diaryIndex: 2
    });

    // Wandering Volumetric Phantom
    this.ghosts.push({
      x: 480,
      y: 260,
      vx: 1.3,
      vy: 0.9,
      minX: 220,
      maxX: 690,
      minY: 120,
      maxY: 400,
      pulse: 0,
      name: 'Weißes Gespenst'
    });

    // Tower Staircase
    this.entities.push({
      id: 'tower_staircase',
      type: 'door',
      name: 'Treppe zum Schattenturm',
      x: 770,
      y: 240,
      w: 40,
      h: 52,
      renderYOffset: 48,
      locked: true,
      requiredItem: 'library_crest',
      desc: 'Ein eisiger Geisterhauch weht die Treppe herab. Nur das Wappen der Bejas bannt die Barriere!'
    });
  }

  buildTowerMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const dist = Math.hypot(c - 14, r - 8.5);
        if (dist > 8.2) {
          this.map[r][c] = 2; // Circular tower stone walls
        } else {
          this.map[r][c] = 0;
        }
      }
    }

    // Shadow Altar
    this.entities.push({
      id: 'altar_center',
      type: 'altar_puzzle',
      name: 'Altar des Schattens',
      x: 385,
      y: 230,
      w: 70,
      h: 70,
      renderYOffset: 65,
      crystalCount: 0,
      desc: 'Der uralte Altar des Schattens. Richte die drei Kristalle aus, um das Siegel zu brechen!'
    });

    // Crystal sockets
    this.entities.push({
      id: 'crystal_socket_1',
      type: 'crystal_switch',
      name: 'Smaragd-Sockel',
      x: 270,
      y: 190,
      w: 32,
      h: 36,
      renderYOffset: 32,
      activated: false,
      color: '#10b981'
    });

    this.entities.push({
      id: 'crystal_socket_2',
      type: 'crystal_switch',
      name: 'Saphir-Sockel',
      x: 560,
      y: 190,
      w: 32,
      h: 36,
      renderYOffset: 32,
      activated: false,
      color: '#06b6d4'
    });

    this.entities.push({
      id: 'crystal_socket_3',
      type: 'crystal_switch',
      name: 'Rubin-Sockel',
      x: 410,
      y: 380,
      w: 32,
      h: 36,
      renderYOffset: 32,
      activated: false,
      color: '#f43f5e'
    });
  }

  // ==========================================
  // INTERACTIONS & GAMEPLAY
  // ==========================================

  interactWithEntity(ent) {
    if (window.castleAudio) window.castleAudio.playClick();

    if (ent.type === 'item') {
      ent.collected = true;
      this.player.inventory.push(ent.itemId);
      if (ent.itemId === 'lantern') {
        this.player.hasLantern = true;
      }
      if (window.castleAudio) window.castleAudio.playItemFound();

      this.startDialogue({
        title: "GEGENSTAND GEFUNDEN",
        speaker: "INVENTAR",
        lines: [
          `Du hast erhalten: [${ent.name}]!`,
          ent.desc
        ]
      });

      this.entities = this.entities.filter(e => e.id !== ent.id);
      if (window.castleUI) window.castleUI.updateInventory(this.player.inventory);
      this.saveGame('auto', `Gegenstand gefunden: ${ent.name}`);
      return;
    }

    if (ent.type === 'lore') {
      const text = CASTLE_STORY.loreObjects[ent.loreKey] || "Nichts Auffälliges.";
      this.startDialogue({
        title: ent.name,
        speaker: "UNTERSUCHUNG",
        lines: [text]
      });
      return;
    }

    if (ent.type === 'diary') {
      const diary = CASTLE_STORY.diaries[ent.diaryIndex];
      if (window.castleAudio) window.castleAudio.playMusicBox();
      this.startDialogue({
        title: diary.title,
        speaker: "TAGEBUCH VON GRAF BEJA",
        lines: [diary.text]
      });
      if (window.castleUI) window.castleUI.addDiaryEntry(diary);
      return;
    }

    if (ent.type === 'puzzle_monolith') {
      if (!this.player.hasLantern) {
        this.startDialogue({
          title: ent.name,
          speaker: "HINWEIS",
          lines: ["Du hast keine Lichtquelle. Finde zuerst die Laterne im Wald!"]
        });
        return;
      }

      ent.activated = true;
      if (window.castleAudio) {
        window.castleAudio.playLockClick();
        window.castleAudio.playGhostMoan();
      }

      const allActive = this.entities.filter(e => e.type === 'puzzle_monolith').every(e => e.activated);
      if (allActive) {
        const exit = this.entities.find(e => e.id === 'exit_staircase');
        if (exit) exit.locked = false;

        this.startDialogue({
          title: "RUNEN ENTSCHLÜSSELT!",
          speaker: "ERZÄHLER",
          lines: [
            "Beide Runensteine erstrahlen in grünem Licht!",
            "Ein tiefes Grollen ertönt: Die dornigen Ranken an der Steintreppe im Osten haben sich gelöst."
          ]
        });
        this.saveGame('auto', 'Runensteine im Wald gelöst');
      } else {
        this.startDialogue({
          title: ent.name,
          speaker: "ERZÄHLER",
          lines: ["Der Runenstein leuchtet auf! Ein weiterer Stein muss noch entzündet werden."]
        });
      }
      return;
    }

    if (ent.type === 'puzzle_fire') {
      if (!this.player.hasLantern) return;
      ent.lit = true;
      if (window.castleAudio) window.castleAudio.playLockClick();

      const allLit = this.entities.filter(e => e.type === 'puzzle_fire').every(e => e.lit);
      if (allLit) {
        const libDoor = this.entities.find(e => e.id === 'library_door');
        if (libDoor) libDoor.locked = false;
        if (window.castleAudio) window.castleAudio.playDoorCreak(true);

        this.startDialogue({
          title: "KAMINE ENTZÜNDET!",
          speaker: "ERZÄHLER",
          lines: [
            "Beide Kamine lodern mit wohligem Schein auf!",
            "Ein lautes Klicken hallt durch den Saal: Die Pforte zur Bibliothek ist entriegelt!"
          ]
        });
        this.saveGame('auto', 'Kamine im Festsaal entzündet');
      } else {
        this.startDialogue({
          title: ent.name,
          speaker: "ERZÄHLER",
          lines: ["Das Kaminfeuer entfacht! Entzünde auch den zweiten Kamin."]
        });
      }
      return;
    }

    if (ent.type === 'crystal_switch') {
      ent.activated = !ent.activated;
      if (window.castleAudio) {
        window.castleAudio.playLockClick();
        window.castleAudio.playItemFound();
      }

      const activeCount = this.entities.filter(e => e.type === 'crystal_switch' && e.activated).length;
      const altar = this.entities.find(e => e.id === 'altar_center');
      if (altar) altar.crystalCount = activeCount;

      this.startDialogue({
        title: ent.name,
        speaker: "TURM-MECHANIK",
        lines: [`Kristallsockel ausgerichtet! (${activeCount}/3 Kristalle aktiv).`]
      });
      return;
    }

    if (ent.type === 'altar_puzzle') {
      if (ent.crystalCount >= 3) {
        if (window.castleAudio) {
          window.castleAudio.playHorrorStinger();
          window.castleAudio.playClockBell();
        }
        if (window.castleUI) {
          window.castleUI.showEndingSelection();
        }
      } else {
        this.startDialogue({
          title: ent.name,
          speaker: "SCHATTEN-ALTAR",
          lines: [
            "Der Altar benötigt alle 3 aktivierten Kristallsockel im Saal, um das Schattensiegel zu brechen.",
            `Aktuell ausgerichtet: ${ent.crystalCount}/3.`
          ]
        });
      }
      return;
    }

    if (ent.type === 'door') {
      if (ent.id === 'castle_main_gate') {
        const hasKey = this.player.inventory.includes('castle_key');
        const hasGear = this.player.inventory.includes('gate_gear');

        if (!hasGear) {
          this.startDialogue({
            title: ent.name,
            speaker: "SCHLOSSTOR",
            lines: ["Die Zugbrücke klemmt! Du benötigst das Zahnrad aus dem Mausoleum."]
          });
          return;
        }

        if (!hasKey) {
          this.startDialogue({
            title: ent.name,
            speaker: "SCHLOSSTOR",
            lines: ["Das Zahnrad greift ein, aber das Hauptportal erfordert den Eisenschlüssel von Schloss Beja!"]
          });
          return;
        }

        if (window.castleAudio) {
          window.castleAudio.playDoorCreak(true);
          window.castleAudio.playThunder();
        }
        this.triggerScreenFlash('lightning');
        this.nextChapter();
        return;
      }

      if (ent.locked) {
        if (ent.requiredItem && this.player.inventory.includes(ent.requiredItem)) {
          ent.locked = false;
          if (window.castleAudio) window.castleAudio.playDoorCreak(false);
          this.nextChapter();
        } else {
          this.startDialogue({
            title: ent.name,
            speaker: "VERSCHLOSSEN",
            lines: [ent.desc || "Die Pforte ist verschlossen."]
          });
        }
      } else {
        if (window.castleAudio) window.castleAudio.playDoorCreak(false);
        this.nextChapter();
      }
    }
  }

  nextChapter() {
    if (this.chapterIndex < CASTLE_STORY.chapters.length - 1) {
      this.loadChapter(this.chapterIndex + 1);
    }
  }

  // ==========================================
  // DIALOGUE SYSTEM
  // ==========================================

  startDialogue(dialogueData) {
    this.currentDialogue = {
      ...dialogueData,
      currentLine: 0,
      displayedChars: 0
    };
    this.state = 'DIALOGUE';
    this.dialogueTimer = 0;
  }

  advanceDialogue() {
    if (!this.currentDialogue) return;

    const fullLine = this.currentDialogue.lines[this.currentDialogue.currentLine];
    if (this.currentDialogue.displayedChars < fullLine.length) {
      this.currentDialogue.displayedChars = fullLine.length;
    } else {
      this.currentDialogue.currentLine++;
      this.currentDialogue.displayedChars = 0;

      if (this.currentDialogue.currentLine >= this.currentDialogue.lines.length) {
        const callback = this.currentDialogue.onComplete;
        this.currentDialogue = null;
        this.state = 'PLAYING';
        if (callback) callback();
      }
    }
  }

  // ==========================================
  // GAME LOOP: UPDATE
  // ==========================================

  update(delta) {
    this.gameTimeSec += delta;

    // Periodic lightning storm in outdoor chapters (Forest, Courtyard, Tower)
    if ([0, 1, 4].includes(this.chapterIndex)) {
      this.lightningTimer -= delta * 60;
      if (this.lightningTimer <= 0) {
        this.triggerLightningStorm();
        this.lightningTimer = 350 + Math.random() * 450;
      }
    }

    // Update multi-stage lightning flash & bolts
    if (this.lightningState.active) {
      this.lightningState.timer += delta;
      const t = this.lightningState.timer;
      const d = this.lightningState.duration;

      if (t >= d) {
        this.lightningState.active = false;
        this.isLightning = false;
        this.lightningAlpha = 0;
      } else {
        let intensity = 0;
        if (t < 0.04) {
          // Rapid initial strike
          intensity = t / 0.04;
        } else if (t < 0.09) {
          // Leader stroke decay
          intensity = 1.0 - ((t - 0.04) / 0.05) * 0.72; // drops to ~0.28
        } else if (t < 0.16) {
          // Main return stroke (violent secondary flash)
          intensity = 0.28 + ((t - 0.09) / 0.07) * 0.68; // rises to 0.96
        } else if (t < 0.26) {
          // Return stroke decay
          intensity = 0.96 - ((t - 0.16) / 0.10) * 0.64; // drops to 0.32
        } else {
          // Flickering atmospheric dissipation
          const prog = (t - 0.26) / (d - 0.26);
          intensity = 0.32 * Math.pow(1 - prog, 2.2);
          if (Math.random() < 0.3) intensity += (Math.random() * 0.12) * (1 - prog);
        }
        this.lightningAlpha = Math.max(0, Math.min(1, intensity));
        this.isLightning = this.lightningAlpha > 0.02;
      }
    }

    this.updateParticles(delta);
    this.updateHallucinations(delta);

    if (this.state === 'DIALOGUE') {
      this.updateDialogue(delta);
      return;
    }

    if (this.state === 'PLAYING') {
      this.updatePlayerMovement(delta);
      this.updateGhosts(delta);
      this.checkInteractions();
      this.updateSanityAndHeartbeat(delta);
    }
  }

  triggerLightningStorm() {
    this.isLightning = true;
    this.lightningAlpha = 1.0;
    this.lightningState.active = true;
    this.lightningState.timer = 0;
    this.lightningState.duration = 0.65;
    this.lightningState.bolts = this.generateLightningBolts();

    this.triggerScreenFlash('lightning');
    if (window.castleAudio) window.castleAudio.playThunder();

    // Physical screen tremor timed to the acoustic shockwave
    setTimeout(() => {
      this.triggerScreenShake();
    }, 40);
  }

  generateLightningBolts() {
    const bolts = [];
    const startX = Math.random() * (this.width - 240) + 120;
    const startY = 0;
    const targetX = startX + (Math.random() * 220 - 110);
    const targetY = Math.random() * 140 + 200;

    function createBranch(x1, y1, x2, y2, depth = 0) {
      const points = [{ x: x1, y: y1 }];
      const segments = 7 + Math.floor(Math.random() * 4);
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const idealX = x1 + (x2 - x1) * t;
        const idealY = y1 + (y2 - y1) * t;
        const jitterX = (Math.random() - 0.5) * (42 / (depth + 1));
        const jitterY = (Math.random() - 0.5) * (20 / (depth + 1));
        const ptX = (i === segments) ? x2 : (idealX + jitterX);
        const ptY = (i === segments) ? y2 : (idealY + jitterY);
        points.push({ x: ptX, y: ptY });

        // Branching forks
        if (depth < 2 && Math.random() < 0.4 && i > 1 && i < segments) {
          const branchAngle = (Math.random() - 0.5) * 1.4 + 0.6;
          const branchLen = (segments - i) * 16 * (Math.random() * 0.5 + 0.5);
          const bx2 = ptX + Math.sin(branchAngle) * branchLen;
          const by2 = ptY + Math.cos(branchAngle) * branchLen;
          bolts.push({
            points: createBranch(ptX, ptY, bx2, by2, depth + 1),
            alpha: 0.8 / (depth + 1),
            width: Math.max(1, 2.5 - depth)
          });
        }
      }
      return points;
    }

    const mainBranch = createBranch(startX, startY, targetX, targetY, 0);
    bolts.unshift({
      points: mainBranch,
      alpha: 1.0,
      width: 3.5
    });

    return bolts;
  }

  renderLightningBolts() {
    if (!this.lightningState.active || this.lightningAlpha <= 0.03) return;

    const flicker = (0.75 + Math.random() * 0.25) * this.lightningAlpha;

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'miter';

    // Layer 1: Wide electric cyan/blue bloom
    this.lightningState.bolts.forEach(bolt => {
      if (bolt.points.length < 2) return;
      this.ctx.beginPath();
      this.ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        this.ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      this.ctx.strokeStyle = `rgba(96, 165, 250, ${bolt.alpha * flicker * 0.5})`;
      this.ctx.lineWidth = bolt.width * 5.5;
      this.ctx.shadowColor = '#60a5fa';
      this.ctx.shadowBlur = 28;
      this.ctx.stroke();
    });

    // Layer 2: Intense electric light-blue mid stroke
    this.lightningState.bolts.forEach(bolt => {
      if (bolt.points.length < 2) return;
      this.ctx.beginPath();
      this.ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        this.ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      this.ctx.strokeStyle = `rgba(186, 230, 253, ${bolt.alpha * flicker * 0.9})`;
      this.ctx.lineWidth = bolt.width * 2.2;
      this.ctx.shadowBlur = 12;
      this.ctx.stroke();
    });

    // Layer 3: Blinding pure white core
    this.lightningState.bolts.forEach(bolt => {
      if (bolt.points.length < 2) return;
      this.ctx.beginPath();
      this.ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        this.ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha * flicker})`;
      this.ctx.lineWidth = bolt.width;
      this.ctx.shadowBlur = 0;
      this.ctx.stroke();
    });

    // Layer 4: Whole-canvas ambient lightning flash wash
    this.ctx.fillStyle = `rgba(224, 242, 254, ${this.lightningAlpha * 0.48})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.restore();
  }

  triggerScreenFlash(type = 'lightning') {
    const overlay = document.getElementById('screenFlashOverlay');
    if (overlay) {
      overlay.className = 'absolute inset-0 pointer-events-none z-30 flash-lightning';
      setTimeout(() => {
        overlay.className = 'absolute inset-0 pointer-events-none z-30 opacity-0';
      }, 650);
    }
  }

  triggerScreenShake() {
    const frame = document.getElementById('game-viewport-frame');
    if (frame) {
      frame.classList.remove('screen-shake');
      void frame.offsetWidth;
      frame.classList.add('screen-shake');
      setTimeout(() => {
        frame.classList.remove('screen-shake');
      }, 250);
    }
  }

  updateParticles(delta) {
    this.fogParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -p.r) p.x = this.width + p.r;
      if (p.x > this.width + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = this.height + p.r;
      if (p.y > this.height + p.r) p.y = -p.r;
    });

    this.dustParticles.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0) d.x = this.width;
      if (d.x > this.width) d.x = 0;
      if (d.y < 0) d.y = this.height;
      if (d.y > this.height) d.y = 0;
    });

    if (this.chapterIndex === 1) {
      this.rainDrops.forEach(r => {
        r.y += r.speed;
        r.x -= 1.8;
        if (r.y > this.height) {
          r.y = -r.len;
          r.x = Math.random() * (this.width + 120);
        }
      });
    }
  }

  updateDialogue(delta) {
    if (!this.currentDialogue) return;
    const fullLine = this.currentDialogue.lines[this.currentDialogue.currentLine];
    if (this.currentDialogue.displayedChars < fullLine.length) {
      this.dialogueTimer += delta * 1000;
      // 2x faster speed: threshold reduced from 25ms to 12ms per character
      if (this.dialogueTimer > 12) {
        this.dialogueTimer = 0;
        this.currentDialogue.displayedChars++;
        if (window.castleAudio && this.currentDialogue.displayedChars % 2 === 0) {
          window.castleAudio.playDialogueBlip();
        }
      }
    }
  }

  updatePlayerMovement(delta) {
    if (this.player.isParalyzed) {
      this.player.isMoving = false;
      this.player.paralysisTimer -= delta;
      if (this.player.paralysisTimer <= 0) {
        this.player.isParalyzed = false;
        this.player.paralysisTimer = 0;
        this.player.shockCooldown = 9.0;
        if (window.castleUI) window.castleUI.showNotification('Du überwindest die Starre und stehst mühsam auf.');
      }
      return;
    }

    let dx = 0;
    let dy = 0;

    if (this.keys.up) { dy -= 1; this.player.facing = 'UP'; }
    if (this.keys.down) { dy += 1; this.player.facing = 'DOWN'; }
    if (this.keys.left) { dx -= 1; this.player.facing = 'LEFT'; }
    if (this.keys.right) { dx += 1; this.player.facing = 'RIGHT'; }

    const isMoving = dx !== 0 || dy !== 0;
    this.player.isMoving = isMoving;

    if (isMoving) {
      let spd = this.keys.sprint ? this.player.sprintSpeed : this.player.speed;
      if (this.player.sanity < 20) {
        spd *= 0.65; // Sluggish stumbling in panic
      }
      const len = Math.hypot(dx, dy);
      const moveX = (dx / len) * spd;
      const moveY = (dy / len) * spd;

      const newX = this.player.x + moveX;
      const newY = this.player.y + moveY;

      // 2.5D Foot collision bounding box
      const footW = 16;
      const footH = 12;
      const footX = newX + (this.player.w - footW) / 2;
      const footY = newY + this.player.h - footH;

      if (!this.checkTileCollision(footX, this.player.y + this.player.h - footH, footW, footH)) {
        this.player.x = newX;
      }
      if (!this.checkTileCollision(this.player.x + (this.player.w - footW) / 2, footY, footW, footH)) {
        this.player.y = newY;
      }

      this.player.animTimer += delta * 60;
      if (this.player.animTimer > (this.keys.sprint ? 7 : 10)) {
        this.player.animTimer = 0;
        this.player.animFrame = (this.player.animFrame + 1) % 4;

        if (window.castleAudio) {
          if (this.chapterIndex === 0) {
            window.castleAudio.playFootstepForest();
          } else {
            window.castleAudio.playFootstepStone();
          }
        }
      }
    }
  }

  checkTileCollision(x, y, w, h) {
    if (x < 8 || x + w > this.width - 8 || y < 8 || y + h > this.height - 8) return true;

    const leftCol = Math.floor(x / this.tileW);
    const rightCol = Math.floor((x + w) / this.tileW);
    const topRow = Math.floor(y / this.tileH);
    const bottomRow = Math.floor((y + h) / this.tileH);

    for (let r = topRow; r <= bottomRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (this.map[r] && this.map[r][c] > 0) {
          return true;
        }
      }
    }
    return false;
  }

  updateGhosts(delta) {
    this.ghosts.forEach(g => {
      g.x += g.vx;
      g.y += g.vy;
      g.pulse += delta * 2.2;

      if (g.x < g.minX || g.x > g.maxX) g.vx *= -1;
      if (g.y < g.minY || g.y > g.maxY) g.vy *= -1;

      const dist = Math.hypot(g.x - (this.player.x + this.player.w / 2), g.y - (this.player.y + this.player.h / 2));
      if (dist < 90) {
        this.player.sanity = Math.max(0, this.player.sanity - delta * 16);
        if (Math.random() < 0.03 && window.castleAudio) {
          window.castleAudio.playGhostMoan();
        }
      }
    });
  }

  checkInteractions() {
    this.interactiveTarget = null;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;

    for (const ent of this.entities) {
      const ex = ent.x + ent.w / 2;
      const ey = ent.y + ent.h / 2;
      const dist = Math.hypot(px - ex, py - ey);

      if (dist < 52) {
        this.interactiveTarget = ent;
        break;
      }
    }
  }

  updateSanityAndHeartbeat(delta) {
    let nearestThreatDist = 999;
    this.ghosts.forEach(g => {
      const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      if (d < nearestThreatDist) nearestThreatDist = d;
    });

    // Check safe zones / light sources for sanity regeneration
    let nearSafeLight = false;
    for (const ent of this.entities) {
      if ((ent.type === 'fireplace' || ent.type === 'monolith' || ent.type === 'altar' || ent.type === 'puzzle_fire') && (ent.lit || ent.state === 'lit')) {
        const d = Math.hypot((ent.x + ent.w/2) - (this.player.x + this.player.w/2), (ent.y + ent.h/2) - (this.player.y + this.player.h/2));
        if (d < 130) {
          nearSafeLight = true;
          break;
        }
      }
    }
    if (this.player.hasLantern && nearestThreatDist > 180 && !nearSafeLight) {
      nearSafeLight = true;
    }

    if (nearSafeLight && nearestThreatDist > 140) {
      this.player.sanity = Math.min(this.player.maxSanity, this.player.sanity + delta * 3.5);
    }

    if (this.player.shockCooldown > 0) {
      this.player.shockCooldown -= delta;
    }

    // Below 25% Sanity: Trigger Schockstarre (Panic Paralysis & Falling to ground)
    if (this.player.sanity < 25 && !this.player.isParalyzed && this.player.shockCooldown <= 0) {
      const threatMultiplier = nearestThreatDist < 120 ? 3.5 : (this.player.sanity < 10 ? 2.2 : 1.0);
      const shockChancePerSec = 0.14 * threatMultiplier;
      if (Math.random() < shockChancePerSec * delta) {
        this.triggerSchockstarre(3.8);
      }
    }

    const isPanic = this.player.sanity < 35 || nearestThreatDist < 100 || this.player.isParalyzed;
    if (window.castleUI) window.castleUI.updateSanity(this.player.sanity, isPanic);

    if (isPanic && Math.random() < (this.player.sanity < 20 ? 0.08 : 0.03)) {
      if (window.castleAudio) window.castleAudio.playHeartbeat(1.3);
    }
  }

  triggerSchockstarre(duration = 3.8) {
    this.player.isParalyzed = true;
    this.player.paralysisTimer = duration;
    this.player.paralysisTotal = duration;
    this.player.shockCooldown = 9.0;
    this.player.isMoving = false;

    if (window.castleAudio) {
      window.castleAudio.playDamage();
      window.castleAudio.playHeartbeat(2.0);
      if (Math.random() < 0.65) window.castleAudio.playWhisper();
    }
    this.triggerScreenShake();
    if (window.castleUI) {
      window.castleUI.showNotification('😱 SCHOCKSTARRE! Deine Beine versagen – hämmere die LEERTASTE!');
    }
  }

  updateHallucinations(delta) {
    if (this.player.sanity < 25) {
      if (this.hallucinations.length < 4 && Math.random() < 0.03) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 130;
        this.hallucinations.push({
          x: this.player.x + Math.cos(angle) * dist,
          y: this.player.y + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 25,
          vy: (Math.random() - 0.5) * 25,
          alpha: 0.85,
          life: 2.5 + Math.random() * 2.0
        });
      }
    }
    for (let i = this.hallucinations.length - 1; i >= 0; i--) {
      const h = this.hallucinations[i];
      h.x += h.vx * delta;
      h.y += h.vy * delta;
      h.life -= delta;
      h.alpha = Math.min(1, h.life / 1.5);
      const d = Math.hypot(h.x - (this.player.x + this.player.w/2), h.y - (this.player.y + this.player.h/2));
      if (d < 50 || h.life <= 0) {
        this.hallucinations.splice(i, 1);
      }
    }
  }

  // ==========================================
  // 2.5D RENDER PIPELINE & Y-SORTING
  // ==========================================

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw 2.5D Ground & Floors
    this.renderGroundFloor();

    // 2. Build 2.5D Render List for Y-Sorting
    const renderList = [];

    // Add Solid Map Tiles (Trees, Walls, Pillars)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const type = this.map[r] ? this.map[r][c] : 0;
        if (type > 0) {
          renderList.push({
            type: 'tile',
            tileType: type,
            c,
            r,
            renderY: (r + 1) * this.tileH
          });
        }
      }
    }

    // Add Interactive Entities & Props
    this.entities.forEach(ent => {
      renderList.push({
        type: 'entity',
        ent,
        renderY: ent.y + (ent.renderYOffset || ent.h)
      });
    });

    // Add Ghosts
    this.ghosts.forEach(g => {
      renderList.push({
        type: 'ghost',
        ghost: g,
        renderY: g.y + 16
      });
    });

    // Add Player (2.5D Wanderer)
    renderList.push({
      type: 'player',
      renderY: this.player.y + this.player.renderYOffset
    });

    // Sort render list ascending by renderY (back to front depth sorting!)
    renderList.sort((a, b) => a.renderY - b.renderY);

    // 3. Render all sorted 2.5D objects
    renderList.forEach(item => {
      if (item.type === 'tile') {
        this.renderTileObject(item.tileType, item.c, item.r);
      } else if (item.type === 'entity') {
        this.renderEntityObject(item.ent);
      } else if (item.type === 'ghost') {
        this.renderGhostObject(item.ghost);
      } else if (item.type === 'player') {
        this.renderPlayerObject();
      }
    });

    // 4. Render Weather / Atmospheric Rain
    this.renderWeather();

    // 5. Render Volumetric 2.5D Lighting & Shadows
    this.renderVolumetricLighting();

    // 5.5 Render Procedural Lightning Bolts & Atmospheric Flash
    this.renderLightningBolts();

    // 5.6 Render Hallucinations & Panic Distortion (Option B)
    this.renderHallucinations();
    this.renderPanicPostProcessing();

    // 6. Render HUD / Prompt
    this.renderHUD();

    // 7. Render Gothic Story Dialogue
    if (this.state === 'DIALOGUE') {
      this.renderGothicDialogueBox();
    }
  }

  // ==========================================
  // 2.5D VISUAL DRAWING FUNCTIONS
  // ==========================================

  renderGroundFloor() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.tileW;
        const y = r * this.tileH;

        if (this.chapterIndex === 0) {
          // Forest Ground: Moist woodland loam & pine needle moss
          this.ctx.fillStyle = (r + c) % 2 === 0 ? '#111a13' : '#0d150f';
          this.ctx.fillRect(x, y, this.tileW + 0.5, this.tileH + 0.5);

          // Subtle organic moss detail
          if ((r * 3 + c * 7) % 5 === 0) {
            this.ctx.fillStyle = '#1b2d1f';
            this.ctx.fillRect(x + 4, y + 6, 8, 5);
          }
        } else if (this.chapterIndex === 1) {
          // Courtyard: Wet Cobblestone paving
          this.ctx.fillStyle = (r + c) % 2 === 0 ? '#1b2229' : '#151b22';
          this.ctx.fillRect(x, y, this.tileW + 0.5, this.tileH + 0.5);

          // Cobblestone stone bevels
          this.ctx.strokeStyle = '#0f141a';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(x, y, this.tileW, this.tileH);

        } else if (this.chapterIndex === 2) {
          // Grand Hall: Polished dark timber floor & center velvet runner
          if (c >= 12 && c <= 15) {
            // Royal crimson runner carpet with gold braid
            this.ctx.fillStyle = (r % 2 === 0) ? '#4a121a' : '#3d0e15';
            this.ctx.fillRect(x, y, this.tileW + 0.5, this.tileH + 0.5);
            if (c === 12) {
              this.ctx.fillStyle = '#997a38';
              this.ctx.fillRect(x, y, 2.5, this.tileH);
            }
            if (c === 15) {
              this.ctx.fillStyle = '#997a38';
              this.ctx.fillRect(x + this.tileW - 2.5, y, 2.5, this.tileH);
            }
          } else {
            // Dark oak timber floor planks
            this.ctx.fillStyle = (r + c) % 2 === 0 ? '#1e1610' : '#17110c';
            this.ctx.fillRect(x, y, this.tileW + 0.5, this.tileH + 0.5);
            this.ctx.strokeStyle = '#0e0a07';
            this.ctx.lineWidth = 0.8;
            this.ctx.strokeRect(x, y, this.tileW, this.tileH);
          }
        } else if (this.chapterIndex === 3) {
          // Crypt: Ancient cathedral flagstones
          this.ctx.fillStyle = (r + c) % 2 === 0 ? '#14181f' : '#0e1218';
          this.ctx.fillRect(x, y, this.tileW + 0.5, this.tileH + 0.5);
          this.ctx.strokeStyle = '#080a0e';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(x, y, this.tileW, this.tileH);
        } else {
          // Tower: Obsidian circular masonry
          this.ctx.fillStyle = (r + c) % 2 === 0 ? '#191322' : '#110c18';
          this.ctx.fillRect(x, y, this.tileW + 0.5, this.tileH + 0.5);
        }
      }
    }
  }

  renderTileObject(type, c, r) {
    const x = c * this.tileW;
    const y = r * this.tileH;

    if (type === 1) {
      // 2.5D Volumetric Pine Tree
      const baseX = x + this.tileW / 2;
      const baseY = y + this.tileH - 2;

      // Soft Ground Shadow
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(4, 8, 6, 0.6)';
      this.ctx.beginPath();
      this.ctx.ellipse(baseX, baseY, 18, 9, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Tree Trunk
      this.ctx.fillStyle = '#261b14';
      this.ctx.fillRect(baseX - 4, baseY - 28, 8, 28);
      this.ctx.fillStyle = '#3a2b20';
      this.ctx.fillRect(baseX - 4, baseY - 28, 3, 28); // Trunk highlight

      // 4 Layered Pine Foliage Cones
      const tiers = [
        { yOffset: -18, w: 38, h: 22, color: '#102816', hilite: '#193f24' },
        { yOffset: -32, w: 32, h: 20, color: '#13301b', hilite: '#1f4e2c' },
        { yOffset: -44, w: 26, h: 18, color: '#163820', hilite: '#255d35' },
        { yOffset: -56, w: 18, h: 16, color: '#1a4226', hilite: '#2d6d3f' }
      ];

      tiers.forEach(t => {
        const topY = baseY + t.yOffset - t.h;
        const btmY = baseY + t.yOffset;

        // Dark side
        this.ctx.fillStyle = t.color;
        this.ctx.beginPath();
        this.ctx.moveTo(baseX, topY);
        this.ctx.lineTo(baseX + t.w / 2, btmY);
        this.ctx.lineTo(baseX - t.w / 2, btmY);
        this.ctx.closePath();
        this.ctx.fill();

        // Highlight side (left moonlight)
        this.ctx.fillStyle = t.hilite;
        this.ctx.beginPath();
        this.ctx.moveTo(baseX, topY);
        this.ctx.lineTo(baseX, btmY);
        this.ctx.lineTo(baseX - t.w / 2, btmY);
        this.ctx.closePath();
        this.ctx.fill();
      });

      this.ctx.restore();

    } else if (type === 2) {
      // 2.5D Castle Wall with Crenellations
      const wallH = 46;
      const topY = y + this.tileH - wallH;

      // Cast Shadow
      this.ctx.fillStyle = 'rgba(3, 5, 8, 0.5)';
      this.ctx.fillRect(x, y + this.tileH - 4, this.tileW, 8);

      // Wall Face (Front)
      this.ctx.fillStyle = '#222b34';
      this.ctx.fillRect(x, topY, this.tileW, wallH);

      // Masonry stone blocks
      this.ctx.strokeStyle = '#151c23';
      this.ctx.lineWidth = 1.2;
      this.ctx.strokeRect(x, topY, this.tileW, wallH);
      this.ctx.strokeRect(x + 2, topY + 12, this.tileW - 4, 14);

      // Wall Top Edge (Depth)
      this.ctx.fillStyle = '#374553';
      this.ctx.fillRect(x, topY, this.tileW, 6);

    } else if (type === 3) {
      // 2.5D Cemetery Wrought-Iron Fence
      this.ctx.fillStyle = '#10151b';
      this.ctx.fillRect(x + 4, y + 2, 4, this.tileH + 10);
      this.ctx.fillRect(x + 18, y + 2, 4, this.tileH + 10);
      this.ctx.fillRect(x, y + 10, this.tileW, 3);
      this.ctx.fillRect(x, y + 24, this.tileW, 3);

    } else if (type === 4) {
      // 2.5D Bookcase / Crypt Tomb
      this.ctx.fillStyle = '#1b1426';
      this.ctx.fillRect(x, y - 8, this.tileW, this.tileH + 14);
      this.ctx.fillStyle = '#3e2e54';
      this.ctx.fillRect(x + 2, y - 4, this.tileW - 4, 6);
      this.ctx.fillRect(x + 2, y + 10, this.tileW - 4, 6);

    } else if (type === 5) {
      // 2.5D Gothic Stone Pillar
      const cx = x + this.tileW / 2;
      const cy = y + this.tileH - 4;

      // Base Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, 14, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Pillar Column
      this.ctx.fillStyle = '#2d3742';
      this.ctx.fillRect(cx - 8, cy - 50, 16, 50);
      this.ctx.fillStyle = '#465566';
      this.ctx.fillRect(cx - 8, cy - 50, 6, 50); // Highlight

      // Capital & Base
      this.ctx.fillStyle = '#56687c';
      this.ctx.fillRect(cx - 11, cy - 54, 22, 6);
      this.ctx.fillRect(cx - 11, cy - 4, 22, 6);
    }
  }

  renderEntityObject(ent) {
    const x = ent.x;
    const y = ent.y;

    if (ent.type === 'item') {
      // Item on small pedestal / ground with soft glow
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(201, 160, 80, 0.25)';
      this.ctx.beginPath();
      this.ctx.ellipse(x + ent.w / 2, y + ent.h, 14, 6, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.font = '20px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ent.icon || '🎁', x + ent.w / 2, y + ent.h / 2 + 6);
      this.ctx.restore();

    } else if (ent.type === 'puzzle_monolith') {
      // 2.5D Carved Basalt Monolith
      this.ctx.save();
      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      this.ctx.beginPath();
      this.ctx.ellipse(x + ent.w / 2, y + ent.h - 2, 20, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Stone Body
      this.ctx.fillStyle = '#1e2824';
      this.ctx.fillRect(x + 2, y, ent.w - 4, ent.h);
      this.ctx.fillStyle = '#31423c';
      this.ctx.fillRect(x + 2, y, 6, ent.h);

      // Glowing Inscription
      this.ctx.fillStyle = ent.activated ? '#10b981' : '#4b6357';
      this.ctx.font = '16px serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('ᚱ', x + ent.w / 2, y + ent.h / 2 + 4);

      if (ent.activated) {
        this.ctx.shadowColor = '#10b981';
        this.ctx.shadowBlur = 12;
      }
      this.ctx.restore();

    } else if (ent.type === 'puzzle_fire') {
      // 2.5D Stone Hearth Fireplace
      this.ctx.save();
      this.ctx.fillStyle = '#221a15';
      this.ctx.fillRect(x, y + 10, ent.w, ent.h - 10);
      this.ctx.fillStyle = '#3a2d24';
      this.ctx.fillRect(x - 2, y + 6, ent.w + 4, 6); // Mantelpiece

      if (ent.lit) {
        // Fire animation
        const fx = x + ent.w / 2;
        const fy = y + ent.h - 8;
        const flameGrad = this.ctx.createRadialGradient(fx, fy, 2, fx, fy, 16);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#f59e0b');
        flameGrad.addColorStop(0.8, '#dc2626');
        flameGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');

        this.ctx.fillStyle = flameGrad;
        this.ctx.beginPath();
        this.ctx.arc(fx, fy - 4, 14 + Math.random() * 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();

    } else if (ent.type === 'crystal_switch') {
      // 2.5D Crystal Pedestal
      this.ctx.save();
      this.ctx.fillStyle = '#241b33';
      this.ctx.fillRect(x + 6, y + 14, ent.w - 12, ent.h - 14);

      // Floating Crystal
      const floatOffset = Math.sin(this.gameTimeSec * 3) * 3;
      const cy = y + 8 + floatOffset;
      this.ctx.fillStyle = ent.activated ? ent.color : '#475569';
      this.ctx.beginPath();
      this.ctx.moveTo(x + ent.w / 2, cy - 10);
      this.ctx.lineTo(x + ent.w / 2 + 7, cy);
      this.ctx.lineTo(x + ent.w / 2, cy + 10);
      this.ctx.lineTo(x + ent.w / 2 - 7, cy);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();

    } else if (ent.type === 'altar_puzzle') {
      // Central 2.5D Altar
      this.ctx.save();
      this.ctx.fillStyle = '#1e142a';
      this.ctx.fillRect(x, y + 16, ent.w, ent.h - 16);
      this.ctx.fillStyle = '#3a2750';
      this.ctx.fillRect(x - 4, y + 10, ent.w + 8, 8);

      this.ctx.font = '26px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🔮', x + ent.w / 2, y + ent.h / 2 + 8);
      this.ctx.restore();

    } else if (ent.type === 'door') {
      // 2.5D Gothic Portal
      this.ctx.save();
      this.ctx.fillStyle = ent.locked ? '#331c12' : '#14291c';
      this.ctx.fillRect(x, y, ent.w, ent.h);
      this.ctx.strokeStyle = ent.locked ? '#991b1b' : '#10b981';
      this.ctx.lineWidth = 2.5;
      this.ctx.strokeRect(x, y, ent.w, ent.h);

      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ent.locked ? '🔒' : '🚪', x + ent.w / 2, y + ent.h / 2 + 6);
      this.ctx.restore();

    } else if (ent.type === 'diary') {
      this.ctx.font = '20px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('📜', x + ent.w / 2, y + ent.h / 2 + 4);
    } else {
      this.ctx.font = '20px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('👁️', x + ent.w / 2, y + ent.h / 2 + 4);
    }
  }

  renderGhostObject(g) {
    this.ctx.save();
    const alpha = 0.55 + Math.sin(g.pulse) * 0.25;

    // Volumetric spectral mist
    const grad = this.ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, 22);
    grad.addColorStop(0, `rgba(210, 235, 255, ${alpha})`);
    grad.addColorStop(0.7, `rgba(140, 180, 240, ${alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(100, 140, 220, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(g.x, g.y, 22, 0, Math.PI * 2);
    this.ctx.fill();

    // Red phantom eyes
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(g.x - 5, g.y - 4, 3, 3);
    this.ctx.fillRect(g.x + 2, g.y - 4, 3, 3);
    this.ctx.restore();
  }

  renderPlayerObject() {
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.w;
    const ph = this.player.h;

    this.ctx.save();

    if (this.player.isParalyzed) {
      // -------------------------------------------------------------
      // SCHOCKSTARRE: CHARACTER LIES PRONE ON THE GROUND TREMBLING
      // -------------------------------------------------------------
      const jitter = Math.sin(this.gameTimeSec * 28) * 1.2;
      const progress = Math.max(0, this.player.paralysisTimer / (this.player.paralysisTotal || 3.8));

      // 1. Sprawled ground shadow under the fallen body
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      this.ctx.beginPath();
      this.ctx.ellipse(px + pw / 2, py + ph - 4, pw * 1.35, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. Fallen boots stretched out
      this.ctx.fillStyle = '#14181c';
      this.ctx.fillRect(px - 10 + jitter, py + ph - 10, 8, 5);
      this.ctx.fillRect(px - 6 + jitter, py + ph - 7, 7, 4);

      // 3. Prone woollen trenchcoat sprawled horizontally on the ground
      this.ctx.fillStyle = '#222b33';
      this.ctx.fillRect(px - 4 + jitter, py + ph - 14, pw + 12, 11);
      this.ctx.fillStyle = '#2d3844'; // Trenchcoat highlight
      this.ctx.fillRect(px - 4 + jitter, py + ph - 14, pw + 12, 3);

      // 4. Leather belt & buckle on fallen body
      this.ctx.fillStyle = '#4a3319';
      this.ctx.fillRect(px + 4 + jitter, py + ph - 14, 4, 11);
      this.ctx.fillStyle = '#c9a050';
      this.ctx.fillRect(px + 5 + jitter, py + ph - 12, 3, 4);

      // 5. Hooded cowl & collapsed head on the stone
      this.ctx.fillStyle = '#182026';
      this.ctx.beginPath();
      this.ctx.arc(px + pw + 8 + jitter, py + ph - 8, 7, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#deb887'; // Shaded face
      this.ctx.fillRect(px + pw + 7 + jitter, py + ph - 7, 5, 4);

      // 6. Fallen lantern toppled on the ground
      if (this.player.hasLantern) {
        const lx = px + pw + 16;
        const ly = py + ph - 8;
        this.ctx.fillStyle = '#c9a050';
        this.ctx.fillRect(lx, ly, 7, 4);
        this.ctx.fillStyle = '#fffbeb';
        this.ctx.fillRect(lx + 2, ly + 1, 3, 2);
      }

      // 7. Floating Panic Prompt & Struggle Bar
      const promptY = py - 20;
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.roundRect(px + pw / 2 - 70, promptY - 14, 140, 28, 4);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#fca5a5';
      this.ctx.font = 'bold 9px "Cinzel", serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('😱 SCHOCKSTARRE!', px + pw / 2, promptY - 2);

      // Mini struggle recovery bar
      const barW = 100;
      const barH = 4;
      const barX = px + pw / 2 - barW / 2;
      const barY = promptY + 3;
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(barX, barY, barW, barH);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(barX, barY, barW * (1 - progress), barH);

      this.ctx.fillStyle = '#fef08a';
      this.ctx.font = '7.5px "Cinzel", sans-serif';
      this.ctx.fillText('[LEERTASTE HÄMMERN!]', px + pw / 2, promptY + 13);

      this.ctx.restore();
      return;
    }

    // 1. Soft Elliptical Ground Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.beginPath();
    this.ctx.ellipse(px + pw / 2, py + ph - 2, pw * 0.65, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Leather Boots
    const stepOffset = this.player.isMoving ? (this.player.animFrame % 2 === 0 ? 2 : -2) : 0;
    this.ctx.fillStyle = '#14181c';
    this.ctx.fillRect(px + 3, py + ph - 8 + stepOffset, 6, 7);
    this.ctx.fillRect(px + pw - 9, py + ph - 8 - stepOffset, 6, 7);

    // 3. Traveller's Woollen Trenchcoat Body
    this.ctx.fillStyle = '#222b33';
    this.ctx.fillRect(px + 2, py + 10, pw - 4, ph - 16);
    this.ctx.fillStyle = '#2d3844'; // Coat Highlight
    this.ctx.fillRect(px + 2, py + 10, 4, ph - 16);

    // 4. Leather Belt & Brass Buckle
    this.ctx.fillStyle = '#4a3319';
    this.ctx.fillRect(px + 2, py + 20, pw - 4, 3);
    this.ctx.fillStyle = '#c9a050';
    this.ctx.fillRect(px + pw / 2 - 2, py + 19, 4, 5);

    // 5. Hooded Cowl & Face
    this.ctx.fillStyle = '#182026';
    this.ctx.beginPath();
    this.ctx.arc(px + pw / 2, py + 8, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // Shaded Face Silhouette
    this.ctx.fillStyle = '#deb887';
    if (this.player.facing === 'DOWN') {
      this.ctx.fillRect(px + pw / 2 - 4, py + 7, 8, 5);
      this.ctx.fillStyle = '#0f172a'; // Eyes
      this.ctx.fillRect(px + pw / 2 - 3, py + 8, 2, 2);
      this.ctx.fillRect(px + pw / 2 + 1, py + 8, 2, 2);
    } else if (this.player.facing === 'RIGHT') {
      this.ctx.fillRect(px + pw / 2 - 2, py + 7, 6, 5);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(px + pw / 2 + 2, py + 8, 2, 2);
    } else if (this.player.facing === 'LEFT') {
      this.ctx.fillRect(px + pw / 2 - 4, py + 7, 6, 5);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(px + pw / 2 - 4, py + 8, 2, 2);
    }

    // 6. Held Brass Lantern
    if (this.player.hasLantern) {
      const lx = this.player.facing === 'LEFT' ? px - 6 : px + pw + 1;
      const ly = py + 16;

      this.ctx.fillStyle = '#c9a050';
      this.ctx.fillRect(lx, ly, 5, 8);
      // Lantern Warm Light Core
      this.ctx.fillStyle = '#fffbeb';
      this.ctx.fillRect(lx + 1, ly + 2, 3, 4);
    }

    this.ctx.restore();
  }

  renderWeather() {
    this.ctx.save();
    // Rain in Courtyard
    if (this.chapterIndex === 1) {
      this.ctx.strokeStyle = 'rgba(160, 195, 230, 0.45)';
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.rainDrops.forEach(r => {
        this.ctx.moveTo(r.x, r.y);
        this.ctx.lineTo(r.x - 3, r.y + r.len);
      });
      this.ctx.stroke();
    }

    // Drifting dust motes
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.dustParticles.forEach(d => {
      this.ctx.fillRect(d.x, d.y, d.size, d.size);
    });
    this.ctx.restore();
  }

  renderVolumetricLighting() {
    this.lightCtx.clearRect(0, 0, this.width, this.height);

    const ambientDarkness = this.isLightning ? Math.max(0.0, 0.94 - this.lightningAlpha * 1.15) : 0.94;
    this.lightCtx.fillStyle = `rgba(5, 8, 12, ${ambientDarkness})`;
    this.lightCtx.fillRect(0, 0, this.width, this.height);

    this.lightCtx.globalCompositeOperation = 'destination-out';

    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;

    // Player Lantern Radius (scales subtly with sanity)
    const sanityScale = Math.max(0.65, 0.65 + (this.player.sanity / 100) * 0.35);
    const baseRad = this.player.hasLantern ? 145 : 50;
    const lanternRadius = (baseRad * sanityScale) + Math.sin(this.gameTimeSec * 7) * 4;
    const radGrad = this.lightCtx.createRadialGradient(px, py, 12, px, py, lanternRadius);
    radGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    radGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.85)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    this.lightCtx.fillStyle = radGrad;
    this.lightCtx.beginPath();
    this.lightCtx.arc(px, py, lanternRadius, 0, Math.PI * 2);
    this.lightCtx.fill();

    // Braziers & Glowing Crystals
    this.entities.forEach(ent => {
      if (ent.type === 'puzzle_fire' && ent.lit) {
        const fx = ent.x + ent.w / 2;
        const fy = ent.y + ent.h / 2;
        const fGrad = this.lightCtx.createRadialGradient(fx, fy, 6, fx, fy, 110);
        fGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        fGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        this.lightCtx.fillStyle = fGrad;
        this.lightCtx.beginPath();
        this.lightCtx.arc(fx, fy, 110, 0, Math.PI * 2);
        this.lightCtx.fill();
      }

      if (ent.type === 'crystal_switch' && ent.activated) {
        const cx = ent.x + ent.w / 2;
        const cy = ent.y + ent.h / 2;
        const cGrad = this.lightCtx.createRadialGradient(cx, cy, 6, cx, cy, 80);
        cGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        cGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        this.lightCtx.fillStyle = cGrad;
        this.lightCtx.beginPath();
        this.lightCtx.arc(cx, cy, 80, 0, Math.PI * 2);
        this.lightCtx.fill();
      }
    });

    this.lightCtx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(this.lightCanvas, 0, 0);

    // Volumetric rolling fog
    this.ctx.save();
    this.fogParticles.forEach(p => {
      const fogGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      fogGrad.addColorStop(0, `rgba(45, 60, 75, ${p.alpha})`);
      fogGrad.addColorStop(1, 'rgba(45, 60, 75, 0)');
      this.ctx.fillStyle = fogGrad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  renderHUD() {
    if (this.interactiveTarget && this.state === 'PLAYING') {
      const ent = this.interactiveTarget;
      const tx = ent.x + ent.w / 2;
      const ty = ent.y - 14;

      this.ctx.save();
      this.ctx.font = '600 13px "Outfit", sans-serif';
      this.ctx.fillStyle = '#fcd34d';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'rgba(0,0,0,0.9)';
      this.ctx.shadowBlur = 6;
      this.ctx.fillText(`[E] ${ent.name || 'Untersuchen'}`, tx, ty);
      this.ctx.restore();
    }
  }

  renderGothicDialogueBox() {
    if (!this.currentDialogue) return;

    const boxW = this.width - 80;
    const boxH = 120;
    const boxX = 40;
    const boxY = this.height - boxH - 22;

    this.ctx.save();
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Parchment / Dark Slate Glass
    this.ctx.fillStyle = 'rgba(10, 14, 20, 0.96)';
    this.ctx.fillRect(boxX, boxY, boxW, boxH);

    // Gold Gothic Border
    this.ctx.strokeStyle = '#c9a050';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);

    this.ctx.strokeStyle = 'rgba(201, 160, 80, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);

    // Speaker Title
    this.ctx.font = '700 13px "Cinzel", serif';
    this.ctx.fillStyle = '#fcd34d';
    const speakerText = `◄ ${this.currentDialogue.speaker || 'LORE'} ►`;
    this.ctx.fillText(speakerText, boxX + 18, boxY + 14);

    if (this.currentDialogue.title && this.currentDialogue.title !== this.currentDialogue.speaker) {
      this.ctx.font = '600 12px "Outfit", sans-serif';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(this.currentDialogue.title, boxX + boxW - 18, boxY + 14);
    }

    // Dialogue Line with Typewriter
    const fullLine = this.currentDialogue.lines[this.currentDialogue.currentLine] || '';
    const charCount = this.currentDialogue.displayedChars;

    this.ctx.font = '500 15px "Inter", sans-serif';
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.textAlign = 'left';

    this.renderTypewriterWrappedText(fullLine, charCount, boxX + 18, boxY + 40, boxW - 36, 22);

    if (charCount >= fullLine.length) {
      if (Math.floor(this.gameTimeSec * 4) % 2 === 0) {
        this.ctx.font = '600 12px "Outfit", sans-serif';
        this.ctx.fillStyle = '#fcd34d';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('[LEERTASTE / KLICK] ▶', boxX + boxW - 18, boxY + boxH - 10);
      }
    }

    this.ctx.restore();
  }

  renderTypewriterWrappedText(fullText, charCount, x, y, maxWidth, lineHeight) {
    const words = fullText.split(' ');
    let lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? (currentLine + ' ' + words[i]) : words[i];
      const metrics = this.ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    let charsLeft = charCount;
    let currY = y;

    for (let l = 0; l < lines.length; l++) {
      if (charsLeft <= 0) break;
      const lineStr = lines[l];
      const sliceLen = Math.min(charsLeft, lineStr.length);
      const textToDraw = lineStr.substring(0, sliceLen);
      this.ctx.fillText(textToDraw, x, currY);

      charsLeft -= (lineStr.length + 1);
      currY += lineHeight;
    }
  }

  renderHallucinations() {
    if (this.player.sanity < 25 && this.hallucinations && this.hallucinations.length > 0) {
      this.ctx.save();
      this.hallucinations.forEach(h => {
        this.ctx.fillStyle = `rgba(10, 15, 26, ${h.alpha * 0.75})`;
        this.ctx.beginPath();
        this.ctx.ellipse(h.x, h.y, 14, 24, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Glowing red phantom eyes in the darkness
        this.ctx.fillStyle = `rgba(239, 68, 68, ${h.alpha * 0.9})`;
        this.ctx.fillRect(h.x - 4, h.y - 10, 2.5, 2.5);
        this.ctx.fillRect(h.x + 2, h.y - 10, 2.5, 2.5);
      });
      this.ctx.restore();
    }
  }

  renderPanicPostProcessing() {
    if (this.player.sanity < 30 || this.player.isParalyzed) {
      const panicIntensity = Math.min(1.0, this.player.isParalyzed ? 0.95 : (30 - this.player.sanity) / 30);
      const pulseRate = this.player.isParalyzed ? 7.0 : 3.5;
      const pulse = 0.5 + 0.5 * Math.sin(this.gameTimeSec * pulseRate);

      this.ctx.save();
      // Pulsing dark-red tunnel vision vignette
      const cx = this.width / 2;
      const cy = this.height / 2;
      const rInner = Math.max(80, this.width * (0.32 - panicIntensity * 0.14));
      const rOuter = this.width * 0.72;

      const vigGrad = this.ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(0.65, `rgba(45, 10, 15, ${0.45 * panicIntensity * (0.8 + 0.2 * pulse)})`);
      vigGrad.addColorStop(1, `rgba(18, 2, 5, ${0.88 * panicIntensity})`);

      this.ctx.fillStyle = vigGrad;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
    }
  }
}

window.CastleGame = CastleGame;
