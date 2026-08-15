/**
 * Bejacastle - Core Retro Horror Game Engine
 * Features:
 *  - 5 Complete Atmospheric Acts (Forest, Courtyard, Grand Hall, Crypt, Shadow Tower)
 *  - Dynamic 2D Lighting, Flashlight Cone, Torch/Candle Flickers & Lightning Storms
 *  - Particle System (Dense Fog, Floating Embers, Dust Motes, Rain)
 *  - Sanity & Heartbeat Tension Engine
 *  - Interactive Inspectables, Puzzles & Inventory System
 *  - Quantized Retro-Stepped Movement or Smooth Motion
 */

class CastleGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Virtual resolution (800x500 matching Bejapong)
    this.width = 800;
    this.height = 500;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Tile grid (25 columns x 16 rows => 32x32 tiles approx)
    this.tileW = 32;
    this.tileH = 31.25;
    this.cols = 25;
    this.rows = 16;

    // Game state
    this.chapterIndex = 0; // 0 to 4
    this.state = 'TITLE'; // 'TITLE', 'PLAYING', 'DIALOGUE', 'INSPECT', 'PUZZLE', 'GAME_OVER', 'VICTORY'
    this.gameTimeSec = 0;
    this.lastTime = performance.now();

    // Player stats
    this.player = {
      x: 100,
      y: 250,
      w: 16,
      h: 22,
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
      inventory: [] // Array of item IDs
    };

    // Settings
    this.settings = {
      retroStepping: true,
      stepSize: 4,
      crtScanlines: true,
      lightningEnabled: true,
      bloodMoon: false
    };

    // Environmental effects
    this.lightningTimer = 400 + Math.random() * 600;
    this.isLightning = false;
    this.lightningAlpha = 0;
    this.fogParticles = [];
    this.dustParticles = [];
    this.embers = [];
    this.rainDrops = [];

    // Entities & Map data
    this.map = [];
    this.entities = []; // items, doors, inspectables
    this.ghosts = [];
    this.interactiveTarget = null;

    // Active Dialogue / Story overlay
    this.currentDialogue = null;
    this.dialogueCharIndex = 0;
    this.dialogueTimer = 0;

    // Input state
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
    this.loadChapter(0);
  }

  initParticles() {
    this.fogParticles = [];
    for (let i = 0; i < 35; i++) {
      this.fogParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: 45 + Math.random() * 60,
        vx: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
        vy: (Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1),
        alpha: 0.12 + Math.random() * 0.18
      });
    }

    this.dustParticles = [];
    for (let i = 0; i < 40; i++) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    this.rainDrops = [];
    for (let i = 0; i < 70; i++) {
      this.rainDrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        len: 8 + Math.random() * 12,
        speed: 12 + Math.random() * 8
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

      if (e.code === 'KeyI') {
        if (window.castleUI) window.castleUI.toggleInventory();
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

    // Touch click canvas interaction
    this.canvas.addEventListener('click', (e) => {
      if (this.state === 'DIALOGUE') {
        this.advanceDialogue();
      } else if (this.state === 'PLAYING') {
        this.handleActionKey();
      }
    });
  }

  handleActionKey() {
    if (this.state === 'DIALOGUE') {
      this.advanceDialogue();
      return;
    }

    if (this.state === 'PLAYING' && this.interactiveTarget) {
      this.interactWithEntity(this.interactiveTarget);
    }
  }

  // ==========================================
  // CHAPTER SETUP & LEVEL BUILDER
  // ==========================================

  loadChapter(index) {
    this.chapterIndex = index;
    const ch = CASTLE_STORY.chapters[index];
    this.entities = [];
    this.ghosts = [];

    // Reset or position player
    if (index === 0) {
      // Act 1: Forest
      this.player.x = 64;
      this.player.y = 250;
      this.player.hasLantern = false;
      this.player.sanity = 100;
      this.player.inventory = [];

      this.buildForestMap();
    } else if (index === 1) {
      // Act 2: Castle Courtyard & Gate
      this.player.x = 80;
      this.player.y = 250;
      this.buildCourtyardMap();
    } else if (index === 2) {
      // Act 3: Grand Entrance Hall
      this.player.x = 400;
      this.player.y = 420;
      this.buildGrandHallMap();
    } else if (index === 3) {
      // Act 4: Library & Catacombs
      this.player.x = 100;
      this.player.y = 250;
      this.buildCryptMap();
    } else if (index === 4) {
      // Act 5: Shadow Tower Pinnacle
      this.player.x = 400;
      this.player.y = 420;
      this.buildTowerMap();
    }

    // Trigger chapter intro dialogue
    this.startDialogue({
      title: ch.name,
      speaker: "ERZÄHLER",
      lines: ch.introText,
      onComplete: () => {
        if (window.castleAudio) window.castleAudio.startAmbient();
      }
    });

    if (window.castleUI) window.castleUI.updateChapterInfo(ch);
  }

  buildForestMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        // Border trees
        if (r === 0 || r === this.rows - 1 || (c === 0 && r !== 8) || (c === this.cols - 1 && r !== 8)) {
          this.map[r][c] = 1; // Wall Tree
        } else {
          // Dense forest maze clumps
          if ((c === 6 && r < 12) || (c === 12 && r > 4) || (c === 18 && (r < 6 || r > 10))) {
            this.map[r][c] = 1;
          } else {
            this.map[r][c] = 0; // Walkable grass/moss
          }
        }
      }
    }

    // Add entities
    // 1. Lantern on a tree stump
    this.entities.push({
      id: 'lantern_pickup',
      type: 'item',
      itemId: 'lantern',
      name: 'Alte Öllaterne',
      x: 180,
      y: 120,
      w: 24,
      h: 24,
      color: '#ffdd66',
      icon: '🏮',
      collected: false,
      desc: 'Eine alte Messinglaterne. Mit ihr kannst du den finsteren Wald erleuchten!'
    });

    // 2. Monolith 1
    this.entities.push({
      id: 'monolith_1',
      type: 'puzzle_monolith',
      name: 'Runenstein der Eule',
      x: 320,
      y: 90,
      w: 32,
      h: 40,
      color: '#00ffaa',
      activated: false,
      desc: 'Ein alter Runenstein mit Eulen-Symbol. Die Gravur wartet auf Licht.'
    });

    // 3. Monolith 2
    this.entities.push({
      id: 'monolith_2',
      type: 'puzzle_monolith',
      name: 'Runenstein des Wolfs',
      x: 480,
      y: 400,
      w: 32,
      h: 40,
      color: '#00ffaa',
      activated: false,
      desc: 'Ein alter Runenstein mit Wolfs-Symbol. Er pulsiert kalt im Wind.'
    });

    // 4. Inspectable tree face
    this.entities.push({
      id: 'tree_lore',
      type: 'lore',
      name: 'Verkrüppelte Blutbuche',
      x: 250,
      y: 380,
      w: 32,
      h: 32,
      loreKey: 'tree_faces'
    });

    // 5. Raven roost
    this.entities.push({
      id: 'raven_lore',
      type: 'lore',
      name: 'Krähenwache',
      x: 580,
      y: 140,
      w: 32,
      h: 32,
      loreKey: 'raven_roost'
    });

    // 6. Exit staircase to Act 2
    this.entities.push({
      id: 'exit_staircase',
      type: 'door',
      name: 'Steintreppe zum Schlossplateau',
      x: 740,
      y: 235,
      w: 32,
      h: 50,
      locked: true,
      requiredItem: null,
      desc: 'Die Steintreppe ist von dornigen Ranken versperrt. Du musst die beiden Runensteine aktivieren!'
    });
  }

  buildCourtyardMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        // Courtyard walls & castle facade
        if (r === 0 || r === this.rows - 1 || c === 0) {
          this.map[r][c] = 2; // Stone wall
        } else if (c === this.cols - 1 && (r < 7 || r > 9)) {
          this.map[r][c] = 2; // Castle front wall with gate in middle
        } else if (c === 10 && r > 5 && r < 11) {
          this.map[r][c] = 3; // Cemetery iron fence
        } else {
          this.map[r][c] = 0;
        }
      }
    }

    // Mausoleum
    this.entities.push({
      id: 'mausoleum_gear',
      type: 'item',
      itemId: 'gate_gear',
      name: 'Rostiges Zahnrad',
      x: 220,
      y: 100,
      w: 28,
      h: 28,
      icon: '⚙️',
      collected: false,
      desc: 'Ein massives Zahnrad für die Zugbrücke und das Torgestänge.'
    });

    // Tombstone Lore
    this.entities.push({
      id: 'tomb_lore',
      type: 'lore',
      name: 'Graf Heinrichs Grab',
      x: 160,
      y: 350,
      w: 30,
      h: 30,
      loreKey: 'tombstone_graveyard'
    });

    // Gargoyle statue
    this.entities.push({
      id: 'gargoyle_lore',
      type: 'lore',
      name: 'Schwarzer Wasserspeier',
      x: 640,
      y: 160,
      w: 30,
      h: 30,
      loreKey: 'gargoyle_gate'
    });

    // Castle Gate Key
    this.entities.push({
      id: 'gate_key',
      type: 'item',
      itemId: 'castle_key',
      name: 'Eisenschlüssel von Schloss Beja',
      x: 260,
      y: 380,
      w: 24,
      h: 24,
      icon: '🗝️',
      collected: false,
      desc: 'Ein schwerer, verzierter Schlüssel aus geschmiedetem Eisen.'
    });

    // The Massive Castle Gate (Door to Act 3)
    this.entities.push({
      id: 'castle_main_gate',
      type: 'door',
      name: 'Großes Schlosstor',
      x: 740,
      y: 220,
      w: 32,
      h: 60,
      locked: true,
      requiredItem: 'castle_key',
      requiresGear: true,
      hasGearInserted: false,
      desc: 'Das Haupttor ist verriegelt und das Getriebe der Zugbrücke klemmt!'
    });
  }

  buildGrandHallMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 && (c < 11 || c > 13)) {
          this.map[r][c] = 2; // North wall with center door
        } else if (r === this.rows - 1 && (c < 11 || c > 13)) {
          this.map[r][c] = 2; // South wall
        } else if (c === 0 || c === this.cols - 1) {
          this.map[r][c] = 2; // Outer side walls
        } else if ((c === 7 || c === 17) && (r === 6 || r === 9)) {
          this.map[r][c] = 2; // Pillars
        } else {
          this.map[r][c] = 0;
        }
      }
    }

    // Grandfather Clock
    this.entities.push({
      id: 'grand_clock',
      type: 'lore',
      name: 'Uralte Standuhr',
      x: 100,
      y: 80,
      w: 32,
      h: 48,
      loreKey: 'grand_clock'
    });

    // Creepy Portrait
    this.entities.push({
      id: 'portrait_lore',
      type: 'lore',
      name: 'Porträt der Gräfin Eleonore',
      x: 680,
      y: 80,
      w: 32,
      h: 40,
      loreKey: 'creepy_portrait'
    });

    // Fireplace 1 (Left brazier)
    this.entities.push({
      id: 'brazier_left',
      type: 'puzzle_fire',
      name: 'Linke Feuerschale',
      x: 260,
      y: 60,
      w: 32,
      h: 32,
      lit: false,
      desc: 'Eine erloschene Feuerschale. Du kannst sie mit deiner Laterne entzünden.'
    });

    // Fireplace 2 (Right brazier)
    this.entities.push({
      id: 'brazier_right',
      type: 'puzzle_fire',
      name: 'Rechte Feuerschale',
      x: 520,
      y: 60,
      w: 32,
      h: 32,
      lit: false,
      desc: 'Eine erloschene Feuerschale. Sie muss in Flammen stehen!'
    });

    // Diary Entry on Table
    this.entities.push({
      id: 'diary_entry_1',
      type: 'diary',
      name: 'Tagebuch Seite 12',
      x: 400,
      y: 250,
      w: 24,
      h: 24,
      icon: '📜',
      diaryIndex: 0
    });

    // Door to Act 4 (Library)
    this.entities.push({
      id: 'library_door',
      type: 'door',
      name: 'Pforte zur Verbotenen Bibliothek',
      x: 384,
      y: 10,
      w: 32,
      h: 32,
      locked: true,
      desc: 'Ein magisches Schloss versperrt die Pforte. Entzünde die beiden Feuerschalen!'
    });
  }

  buildCryptMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
          this.map[r][c] = 2; // Walls
        } else if ((c % 4 === 0 && r > 3 && r < 12)) {
          this.map[r][c] = 4; // Crypt sarcophagi rows & bookshelves
        } else {
          this.map[r][c] = 0;
        }
      }
    }

    // Family Crest Item
    this.entities.push({
      id: 'beja_crest',
      type: 'item',
      itemId: 'library_crest',
      name: 'Wappen der Familie von Beja',
      x: 280,
      y: 120,
      w: 24,
      h: 24,
      icon: '🛡️',
      collected: false,
      desc: 'Ein goldenes Familienwappen, das die Ahnengeister besänftigen kann.'
    });

    // Sarcophagus Lore
    this.entities.push({
      id: 'crypt_sarcophagus',
      type: 'lore',
      name: 'Ahnen-Sarkophag',
      x: 520,
      y: 350,
      w: 40,
      h: 30,
      loreKey: 'sarcophagus_crypt'
    });

    // Diary Entry 2
    this.entities.push({
      id: 'diary_entry_2',
      type: 'diary',
      name: 'Tagebuch Seite 89',
      x: 620,
      y: 100,
      w: 24,
      h: 24,
      icon: '📜',
      diaryIndex: 2
    });

    // Wandering Ghost / Phantom
    this.ghosts.push({
      x: 450,
      y: 250,
      vx: 1.4,
      vy: 1.1,
      minX: 200,
      maxX: 650,
      minY: 100,
      maxY: 380,
      pulse: 0,
      name: 'Weißes Gespenst'
    });

    // Stairway to Tower (Act 5)
    this.entities.push({
      id: 'tower_staircase',
      type: 'door',
      name: 'Wendeltreppe zum Schattenturm',
      x: 720,
      y: 235,
      w: 32,
      h: 40,
      locked: true,
      requiredItem: 'library_crest',
      desc: 'Ein eisiger Geisterhauch weht aus dem Treppenhaus. Nur mit dem Wappen kannst du eintreten!'
    });
  }

  buildTowerMap() {
    this.map = [];
    for (let r = 0; r < this.rows; r++) {
      this.map[r] = [];
      for (let c = 0; c < this.cols; c++) {
        // Circular tower room feel
        const distFromCenter = Math.hypot(c - 12, r - 8);
        if (distFromCenter > 7.5) {
          this.map[r][c] = 2; // Wall
        } else {
          this.map[r][c] = 0;
        }
      }
    }

    // Shadow Altar (Center)
    this.entities.push({
      id: 'altar_center',
      type: 'altar_puzzle',
      name: 'Altar des Schattens',
      x: 370,
      y: 220,
      w: 60,
      h: 60,
      crystalCount: 0,
      maxCrystals: 3,
      desc: 'Der uralte Altar. Setze die drei Kristallsockel ein, um den Fluch zu beenden!'
    });

    // 3 Crystal pedestals to interact with
    this.entities.push({
      id: 'crystal_socket_1',
      type: 'crystal_switch',
      name: 'Smaragd-Sockel',
      x: 260,
      y: 180,
      w: 28,
      h: 28,
      activated: false,
      color: '#00ff66'
    });

    this.entities.push({
      id: 'crystal_socket_2',
      type: 'crystal_switch',
      name: 'Saphir-Sockel',
      x: 520,
      y: 180,
      w: 28,
      h: 28,
      activated: false,
      color: '#00ccff'
    });

    this.entities.push({
      id: 'crystal_socket_3',
      type: 'crystal_switch',
      name: 'Rubin-Sockel',
      x: 390,
      y: 350,
      w: 28,
      h: 28,
      activated: false,
      color: '#ff2266'
    });
  }

  // ==========================================
  // INTERACTIONS & STORY PROGRESSION
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

      // Remove from map
      this.entities = this.entities.filter(e => e.id !== ent.id);
      if (window.castleUI) window.castleUI.updateInventory(this.player.inventory);
      return;
    }

    if (ent.type === 'lore') {
      const text = CASTLE_STORY.loreObjects[ent.loreKey] || "Nichts Besonderes.";
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

      // Check if both monoliths active
      const allActive = this.entities.filter(e => e.type === 'puzzle_monolith').every(e => e.activated);
      if (allActive) {
        const exit = this.entities.find(e => e.id === 'exit_staircase');
        if (exit) exit.locked = false;

        this.startDialogue({
          title: "RUNEN ENTSCHLÜSSELT!",
          speaker: "ERZÄHLER",
          lines: [
            "Beide Runensteine erstrahlen in grünem Geisterlicht!",
            "Ein tiefes Grollen ertönt: Die dornigen Ranken an der Steintreppe im Osten haben sich zurückgezogen."
          ]
        });
      } else {
        this.startDialogue({
          title: ent.name,
          speaker: "ERZÄHLER",
          lines: ["Der Runenstein leuchtet auf! Ein weiterer Stein muss noch aktiviert werden."]
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
          title: "KAMINFEUER ENTZÜNDET!",
          speaker: "ERZÄHLER",
          lines: [
            "Beide Feuerschalen lodern mit warmem Schein auf!",
            "Ein lautes Klicken hallt durch den Saal: Die Pforte zur Verbotenen Bibliothek ist entriegelt!"
          ]
        });
      } else {
        this.startDialogue({
          title: ent.name,
          speaker: "ERZÄHLER",
          lines: ["Die Flamme entfacht! Entzünde auch die andere Feuerschale."]
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
        lines: [`Kristallsockel aktiviert! (${activeCount}/3 Kristallen eingesetzt).`]
      });
      return;
    }

    if (ent.type === 'altar_puzzle') {
      if (ent.crystalCount >= 3) {
        // Trigger Final Choice / Victory
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
            "Der Altar benötigt alle 3 aktivierten Kristallsockel im Raum, um das Siegel zu brechen.",
            `Aktuell eingesetzt: ${ent.crystalCount}/3.`
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
            lines: ["Das Getriebe der Zugbrücke ist blockiert! Du brauchst das Zahnrad aus dem Mausoleum."]
          });
          return;
        }

        if (!hasKey) {
          this.startDialogue({
            title: ent.name,
            speaker: "SCHLOSSTOR",
            lines: ["Das Zahnrad passt perfekt, aber das Hauptschloss erfordert den Eisenschlüssel von Schloss Beja!"]
          });
          return;
        }

        // Both items ready!
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
            lines: [ent.desc || "Die Tür ist fest verriegelt."]
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
      // Instantly finish typing current line
      this.currentDialogue.displayedChars = fullLine.length;
    } else {
      // Next line
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
  // GAME LOOP: UPDATE & RENDER
  // ==========================================

  update(delta) {
    this.gameTimeSec += delta;

    // Environmental lightning storms
    if (this.settings.lightningEnabled && [0, 1, 4].includes(this.chapterIndex)) {
      this.lightningTimer -= delta * 60;
      if (this.lightningTimer <= 0) {
        this.triggerLightningStorm();
        this.lightningTimer = 350 + Math.random() * 500;
      }
    }

    if (this.isLightning) {
      this.lightningAlpha -= delta * 3.5;
      if (this.lightningAlpha <= 0) {
        this.isLightning = false;
        this.lightningAlpha = 0;
      }
    }

    // Update particles
    this.updateParticles(delta);

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
    this.lightningAlpha = 0.95;
    if (window.castleAudio) window.castleAudio.playThunder();
    this.triggerScreenShake(false);
  }

  triggerScreenFlash(type = 'lightning') {
    const overlay = document.getElementById('screenFlashOverlay');
    if (overlay) {
      overlay.className = 'absolute inset-0 pointer-events-none z-30 ' + (type === 'blood' ? 'flash-blood' : 'flash-lightning');
      setTimeout(() => {
        overlay.className = 'absolute inset-0 pointer-events-none z-30 opacity-0';
      }, 500);
    }
  }

  triggerScreenShake(heavy = false) {
    const bezel = document.getElementById('arcade-container');
    if (bezel) {
      bezel.classList.remove('screen-shake', 'screen-shake-heavy');
      void bezel.offsetWidth; // Force reflow
      bezel.classList.add(heavy ? 'screen-shake-heavy' : 'screen-shake');
      setTimeout(() => {
        bezel.classList.remove('screen-shake', 'screen-shake-heavy');
      }, heavy ? 450 : 250);
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
      // Courtyard Rain
      this.rainDrops.forEach(r => {
        r.y += r.speed;
        r.x -= 1.5;
        if (r.y > this.height) {
          r.y = -r.len;
          r.x = Math.random() * (this.width + 100);
        }
      });
    }
  }

  updateDialogue(delta) {
    if (!this.currentDialogue) return;
    const fullLine = this.currentDialogue.lines[this.currentDialogue.currentLine];
    if (this.currentDialogue.displayedChars < fullLine.length) {
      this.dialogueTimer += delta * 1000;
      if (this.dialogueTimer > 28) {
        this.dialogueTimer = 0;
        this.currentDialogue.displayedChars++;
        if (window.castleAudio && this.currentDialogue.displayedChars % 2 === 0) {
          window.castleAudio.playDialogueBlip();
        }
      }
    }
  }

  updatePlayerMovement(delta) {
    let dx = 0;
    let dy = 0;

    if (this.keys.up) { dy -= 1; this.player.facing = 'UP'; }
    if (this.keys.down) { dy += 1; this.player.facing = 'DOWN'; }
    if (this.keys.left) { dx -= 1; this.player.facing = 'LEFT'; }
    if (this.keys.right) { dx += 1; this.player.facing = 'RIGHT'; }

    const isMoving = dx !== 0 || dy !== 0;
    this.player.isMoving = isMoving;

    if (isMoving) {
      const spd = (this.keys.sprint ? this.player.sprintSpeed : this.player.speed);
      const len = Math.hypot(dx, dy);
      const moveX = (dx / len) * spd;
      const moveY = (dy / len) * spd;

      // Move with collision checking
      const newX = this.player.x + moveX;
      const newY = this.player.y + moveY;

      if (!this.checkTileCollision(newX, this.player.y, this.player.w, this.player.h)) {
        this.player.x = newX;
      }
      if (!this.checkTileCollision(this.player.x, newY, this.player.w, this.player.h)) {
        this.player.y = newY;
      }

      // Step animation & footstep audio
      this.player.animTimer += delta * 60;
      if (this.player.animTimer > (this.keys.sprint ? 7 : 11)) {
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
    // Map bounding box check
    if (x < 10 || x + w > this.width - 10 || y < 10 || y + h > this.height - 10) return true;

    // Check corners against grid
    const leftCol = Math.floor(x / this.tileW);
    const rightCol = Math.floor((x + w) / this.tileW);
    const topRow = Math.floor(y / this.tileH);
    const bottomRow = Math.floor((y + h) / this.tileH);

    for (let r = topRow; r <= bottomRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (this.map[r] && this.map[r][c] > 0) {
          // Solid tile
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
      g.pulse += delta * 2;

      if (g.x < g.minX || g.x > g.maxX) g.vx *= -1;
      if (g.y < g.minY || g.y > g.maxY) g.vy *= -1;

      // Distance to player
      const dist = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      if (dist < 80) {
        // Sanity drain & danger
        this.player.sanity = Math.max(0, this.player.sanity - delta * 15);
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

      if (dist < 46) {
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

    const isPanic = this.player.sanity < 30 || nearestThreatDist < 100;
    if (window.castleUI) window.castleUI.updateSanity(this.player.sanity, isPanic);

    // Heartbeat audio trigger
    if (isPanic && Math.random() < (this.player.sanity < 20 ? 0.07 : 0.03)) {
      if (window.castleAudio) window.castleAudio.playHeartbeat(1.2);
    }
  }

  // ==========================================
  // RENDER PIPELINE
  // ==========================================

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Map Tiles & Floor
    this.renderMapTiles();

    // 2. Render Interactive Entities & Props
    this.renderEntities();

    // 3. Render Ghosts / Phantoms
    this.renderGhosts();

    // 4. Render Player
    this.renderPlayer();

    // 5. Render Environmental Particles (Weather / Fog)
    this.renderParticles();

    // 6. Dynamic 2D Lighting & Darkness Mask
    this.renderLighting();

    // 7. Render Interactive Prompt HUD
    this.renderHUD();

    // 8. Render Story Dialogue Box if active
    if (this.state === 'DIALOGUE') {
      this.renderDialogueBox();
    }
  }

  renderMapTiles() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const type = this.map[r] ? this.map[r][c] : 0;
        const x = c * this.tileW;
        const y = r * this.tileH;

        if (type === 0) {
          // Floor / Ground
          if (this.chapterIndex === 0) {
            // Forest grass/moss
            this.ctx.fillStyle = (r + c) % 2 === 0 ? '#0a170d' : '#07120a';
          } else if (this.chapterIndex === 1) {
            // Courtyard cobblestone
            this.ctx.fillStyle = (r + c) % 2 === 0 ? '#111512' : '#0c100d';
          } else if (this.chapterIndex === 2) {
            // Castle Grand Hall Red Carpet / Stone
            if (c >= 10 && c <= 14) {
              this.ctx.fillStyle = (r % 2 === 0) ? '#3d0812' : '#33060e'; // Red runner carpet
            } else {
              this.ctx.fillStyle = (r + c) % 2 === 0 ? '#161d19' : '#0f1512';
            }
          } else if (this.chapterIndex === 3) {
            // Crypt flagstones
            this.ctx.fillStyle = (r + c) % 2 === 0 ? '#0e0b17' : '#090712';
          } else {
            // Tower Pinnacle
            this.ctx.fillStyle = (r + c) % 2 === 0 ? '#140c1a' : '#0e0714';
          }
          this.ctx.fillRect(x, y, this.tileW, this.tileH);

        } else if (type === 1) {
          // Pine Trees (Forest)
          this.ctx.fillStyle = '#030804';
          this.ctx.fillRect(x, y, this.tileW, this.tileH);

          // Pixel Pine Tree Silhouette
          this.ctx.fillStyle = '#0d2b15';
          this.ctx.beginPath();
          this.ctx.moveTo(x + this.tileW / 2, y + 2);
          this.ctx.lineTo(x + this.tileW - 4, y + this.tileH - 4);
          this.ctx.lineTo(x + 4, y + this.tileH - 4);
          this.ctx.closePath();
          this.ctx.fill();

        } else if (type === 2) {
          // Castle Stone Wall / Battlement
          this.ctx.fillStyle = '#1a221d';
          this.ctx.fillRect(x, y, this.tileW, this.tileH);

          this.ctx.strokeStyle = '#0d130f';
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeRect(x, y, this.tileW, this.tileH);

          // Brick pattern
          this.ctx.fillStyle = '#26332c';
          this.ctx.fillRect(x + 3, y + 4, this.tileW - 6, 8);
          this.ctx.fillRect(x + 3, y + 16, this.tileW - 6, 8);

        } else if (type === 3) {
          // Iron Graveyard Fence
          this.ctx.fillStyle = '#0d130f';
          this.ctx.fillRect(x, y, this.tileW, this.tileH);
          this.ctx.fillStyle = '#445549';
          this.ctx.fillRect(x + 6, y, 4, this.tileH);
          this.ctx.fillRect(x + 22, y, 4, this.tileH);
          this.ctx.fillRect(x, y + 12, this.tileW, 3);

        } else if (type === 4) {
          // Bookshelves / Sarcophagi
          this.ctx.fillStyle = '#1c152b';
          this.ctx.fillRect(x, y, this.tileW, this.tileH);
          this.ctx.fillStyle = '#553e77';
          this.ctx.fillRect(x + 2, y + 4, this.tileW - 4, 6);
          this.ctx.fillRect(x + 2, y + 14, this.tileW - 4, 6);
        }
      }
    }
  }

  renderEntities() {
    this.entities.forEach(ent => {
      const x = ent.x;
      const y = ent.y;

      if (ent.type === 'item') {
        // Glowing Item Box
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 238, 200, 0.2)';
        this.ctx.fillRect(x - 2, y - 2, ent.w + 4, ent.h + 4);

        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(ent.icon || '🎁', x + ent.w / 2, y + ent.h / 2);
        this.ctx.restore();

      } else if (ent.type === 'puzzle_monolith') {
        // Glowing Ancient Monolith
        this.ctx.fillStyle = ent.activated ? '#00ff66' : '#224433';
        this.ctx.fillRect(x, y, ent.w, ent.h);

        this.ctx.strokeStyle = ent.activated ? '#ffffff' : '#00aa44';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, ent.w, ent.h);

        // Rune rune glyph
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillStyle = ent.activated ? '#000000' : '#88ffaa';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ᚱ', x + ent.w / 2, y + ent.h / 2 + 4);

      } else if (ent.type === 'puzzle_fire') {
        // Fireplace / Brazier
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x + 4, y + 12, ent.w - 8, ent.h - 12);

        if (ent.lit) {
          // Animated fire flickers
          this.ctx.fillStyle = Math.random() > 0.5 ? '#ffaa00' : '#ff4400';
          this.ctx.beginPath();
          this.ctx.arc(x + ent.w / 2, y + 8, 8 + Math.random() * 3, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          this.ctx.fillStyle = '#111111';
          this.ctx.fillRect(x + 8, y + 8, ent.w - 16, 6);
        }

      } else if (ent.type === 'crystal_switch') {
        // Altar Crystal Socket
        this.ctx.fillStyle = ent.activated ? ent.color : '#222233';
        this.ctx.beginPath();
        this.ctx.arc(x + ent.w / 2, y + ent.h / 2, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

      } else if (ent.type === 'altar_puzzle') {
        // Central Altar
        this.ctx.fillStyle = '#1f132b';
        this.ctx.fillRect(x, y, ent.w, ent.h);
        this.ctx.strokeStyle = '#c75cff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, ent.w, ent.h);

        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔮', x + ent.w / 2, y + ent.h / 2 + 4);

      } else if (ent.type === 'door') {
        // Door / Portal
        this.ctx.fillStyle = ent.locked ? '#442211' : '#114422';
        this.ctx.fillRect(x, y, ent.w, ent.h);
        this.ctx.strokeStyle = ent.locked ? '#ff3344' : '#00ff66';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, ent.w, ent.h);

        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(ent.locked ? '🔒' : '🚪', x + ent.w / 2, y + ent.h / 2 + 5);

      } else if (ent.type === 'diary') {
        this.ctx.font = '18px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📜', x + ent.w / 2, y + ent.h / 2);
      } else {
        // Generic lore prop
        this.ctx.font = '18px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('👁️', x + ent.w / 2, y + ent.h / 2);
      }
    });
  }

  renderGhosts() {
    this.ghosts.forEach(g => {
      this.ctx.save();
      const alpha = 0.55 + Math.sin(g.pulse) * 0.25;
      this.ctx.fillStyle = `rgba(180, 240, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(g.x, g.y, 16, 0, Math.PI * 2);
      this.ctx.fill();

      // Glowing spectral eyes
      this.ctx.fillStyle = '#ff2255';
      this.ctx.fillRect(g.x - 5, g.y - 4, 3, 3);
      this.ctx.fillRect(g.x + 2, g.y - 4, 3, 3);
      this.ctx.restore();
    });
  }

  renderPlayer() {
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.w;
    const ph = this.player.h;

    this.ctx.save();

    // Body (Cloaked Wanderer)
    this.ctx.fillStyle = '#2b3a32';
    this.ctx.fillRect(px, py + 6, pw, ph - 6);

    // Hood / Head
    this.ctx.fillStyle = '#1c2721';
    this.ctx.fillRect(px + 2, py, pw - 4, 8);

    // Face / Eyes
    this.ctx.fillStyle = '#ffe0bd';
    this.ctx.fillRect(px + 4, py + 3, pw - 8, 4);
    this.ctx.fillStyle = '#00ff66'; // Glowing determined retro eyes
    if (this.player.facing === 'RIGHT') {
      this.ctx.fillRect(px + 8, py + 4, 2, 2);
    } else if (this.player.facing === 'LEFT') {
      this.ctx.fillRect(px + 4, py + 4, 2, 2);
    } else {
      this.ctx.fillRect(px + 4, py + 4, 2, 2);
      this.ctx.fillRect(px + 9, py + 4, 2, 2);
    }

    // Held Lantern
    if (this.player.hasLantern) {
      const lx = this.player.facing === 'LEFT' ? px - 4 : px + pw + 1;
      const ly = py + 10;
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fillRect(lx, ly, 4, 6);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(lx + 1, ly + 2, 2, 2);
    }

    // Walking leg animation offset
    if (this.player.isMoving) {
      const legOffset = (this.player.animFrame % 2 === 0) ? 2 : -2;
      this.ctx.fillStyle = '#0d130f';
      this.ctx.fillRect(px + 2, py + ph - 3, 4, 3 + legOffset);
      this.ctx.fillRect(px + pw - 6, py + ph - 3, 4, 3 - legOffset);
    }

    this.ctx.restore();
  }

  renderParticles() {
    // 1. Floating dust motes
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.dustParticles.forEach(d => {
      this.ctx.fillRect(d.x, d.y, d.size, d.size);
    });

    // 2. Rain drops (Courtyard)
    if (this.chapterIndex === 1) {
      this.ctx.strokeStyle = 'rgba(160, 200, 255, 0.55)';
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.rainDrops.forEach(r => {
        this.ctx.moveTo(r.x, r.y);
        this.ctx.lineTo(r.x - 2, r.y + r.len);
      });
      this.ctx.stroke();
    }
  }

  renderLighting() {
    // Fill light canvas with dark ambient
    this.lightCtx.clearRect(0, 0, this.width, this.height);

    // If lightning is striking, darkness is drastically reduced
    const ambientDarkness = this.isLightning ? Math.max(0.05, 0.94 - this.lightningAlpha) : 0.94;

    this.lightCtx.fillStyle = `rgba(3, 6, 4, ${ambientDarkness})`;
    this.lightCtx.fillRect(0, 0, this.width, this.height);

    // Cut out light holes using 'destination-out'
    this.lightCtx.globalCompositeOperation = 'destination-out';

    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;

    // Player Lantern Radius
    const lanternRadius = this.player.hasLantern ? (130 + Math.sin(this.gameTimeSec * 8) * 4) : 45;
    const radGrad = this.lightCtx.createRadialGradient(px, py, 10, px, py, lanternRadius);
    radGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    radGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    this.lightCtx.fillStyle = radGrad;
    this.lightCtx.beginPath();
    this.lightCtx.arc(px, py, lanternRadius, 0, Math.PI * 2);
    this.lightCtx.fill();

    // Additional light sources (Lit braziers, glowing crystals)
    this.entities.forEach(ent => {
      if (ent.type === 'puzzle_fire' && ent.lit) {
        const fx = ent.x + ent.w / 2;
        const fy = ent.y + ent.h / 2;
        const fGrad = this.lightCtx.createRadialGradient(fx, fy, 5, fx, fy, 90 + Math.random() * 6);
        fGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        fGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.lightCtx.fillStyle = fGrad;
        this.lightCtx.beginPath();
        this.lightCtx.arc(fx, fy, 90, 0, Math.PI * 2);
        this.lightCtx.fill();
      }

      if (ent.type === 'crystal_switch' && ent.activated) {
        const cx = ent.x + ent.w / 2;
        const cy = ent.y + ent.h / 2;
        const cGrad = this.lightCtx.createRadialGradient(cx, cy, 4, cx, cy, 70);
        cGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.lightCtx.fillStyle = cGrad;
        this.lightCtx.beginPath();
        this.lightCtx.arc(cx, cy, 70, 0, Math.PI * 2);
        this.lightCtx.fill();
      }
    });

    this.lightCtx.globalCompositeOperation = 'source-over';

    // Draw the lighting mask onto the main game canvas
    this.ctx.drawImage(this.lightCanvas, 0, 0);

    // Fog overlay
    this.ctx.save();
    this.fogParticles.forEach(p => {
      const fogGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      fogGrad.addColorStop(0, `rgba(40, 70, 50, ${p.alpha})`);
      fogGrad.addColorStop(1, 'rgba(40, 70, 50, 0)');
      this.ctx.fillStyle = fogGrad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  renderHUD() {
    // Interaction Prompt
    if (this.interactiveTarget && this.state === 'PLAYING') {
      const ent = this.interactiveTarget;
      const tx = ent.x + ent.w / 2;
      const ty = ent.y - 12;

      this.ctx.save();
      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#00ff66';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#00ff66';
      this.ctx.shadowBlur = 8;
      this.ctx.fillText('[E] ' + (ent.name || 'Untersuchen'), tx, ty);
      this.ctx.restore();
    }
  }

  renderDialogueBox() {
    if (!this.currentDialogue) return;

    const boxW = this.width - 60;
    const boxH = 120;
    const boxX = 30;
    const boxY = this.height - boxH - 18;

    this.ctx.save();
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Box Background
    this.ctx.fillStyle = 'rgba(4, 10, 6, 0.96)';
    this.ctx.fillRect(boxX, boxY, boxW, boxH);

    // Neon Border
    this.ctx.strokeStyle = '#00ff66';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Inner subtle border
    this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);

    // Speaker Title
    this.ctx.font = '11px "Press Start 2P", monospace';
    this.ctx.fillStyle = '#39ff14';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    const speakerText = `◄ ${this.currentDialogue.speaker || 'LORE'} ►`;
    this.ctx.fillText(speakerText, boxX + 16, boxY + 12);

    // Chapter / Sub-header title
    if (this.currentDialogue.title && this.currentDialogue.title !== this.currentDialogue.speaker) {
      this.ctx.font = '9px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#5c996b';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(this.currentDialogue.title, boxX + boxW - 16, boxY + 14);
    }

    // Dialogue Line with Typewriter effect
    const fullLine = this.currentDialogue.lines[this.currentDialogue.currentLine] || '';
    const displayedCharCount = this.currentDialogue.displayedChars;

    this.ctx.font = '18px "VT323", monospace';
    this.ctx.fillStyle = '#e6ffe6';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Word wrap based on full line
    this.renderTypewriterWrappedText(fullLine, displayedCharCount, boxX + 16, boxY + 36, boxW - 32, 22);

    // Blinking Continue Indicator
    if (displayedCharCount >= fullLine.length) {
      if (Math.floor(this.gameTimeSec * 4) % 2 === 0) {
        this.ctx.font = '9px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#ffeedd';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('[LEERTASTE / KLICK] ▶', boxX + boxW - 16, boxY + boxH - 8);
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
    if (currentLine) {
      lines.push(currentLine);
    }

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
}

window.CastleGame = CastleGame;

