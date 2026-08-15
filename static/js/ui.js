/**
 * Bejacastle - UI, Modals, Soundboard & Theme Manager
 */

class CastleUI {
  constructor() {
    this.game = null;
    this.discoveredDiaries = [];
    this.initEventListeners();
  }

  setGame(gameInstance) {
    this.game = gameInstance;
  }

  initEventListeners() {
    // Soundboard Modal
    const soundboardBtn = document.getElementById('soundboardBtn');
    const soundboardModal = document.getElementById('soundboardModal');
    const closeSoundboardBtn = document.getElementById('closeSoundboardBtn');

    if (soundboardBtn && soundboardModal) {
      soundboardBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        soundboardModal.classList.remove('hidden');
      });
    }

    if (closeSoundboardBtn && soundboardModal) {
      closeSoundboardBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        soundboardModal.classList.add('hidden');
      });
    }

    // Journal Modal
    const journalBtn = document.getElementById('journalBtn');
    const journalModal = document.getElementById('journalModal');
    const closeJournalBtn = document.getElementById('closeJournalBtn');

    if (journalBtn && journalModal) {
      journalBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.renderJournalList();
        journalModal.classList.remove('hidden');
      });
    }

    if (closeJournalBtn && journalModal) {
      closeJournalBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        journalModal.classList.add('hidden');
      });
    }

    // Settings Modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        settingsModal.classList.remove('hidden');
      });
    }

    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        settingsModal.classList.add('hidden');
      });
    }

    // Highscores Modal
    const highscoreBtn = document.getElementById('highscoreBtn');
    const highscoreModal = document.getElementById('highscoreModal');
    const closeHighscoreBtn = document.getElementById('closeHighscoreBtn');

    if (highscoreBtn && highscoreModal) {
      highscoreBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.fetchAndDisplayHighscores();
        highscoreModal.classList.remove('hidden');
      });
    }

    if (closeHighscoreBtn && highscoreModal) {
      closeHighscoreBtn.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        highscoreModal.classList.add('hidden');
      });
    }

    // Sound toggle button
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (window.castleAudio) {
          const isMuted = window.castleAudio.toggleMute();
          soundBtn.textContent = isMuted ? '🔇 SOUND: AUS' : '🔊 SOUND: AN';
          soundBtn.classList.toggle('active', !isMuted);
        }
      });
    }

    // Chapter restart button
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (confirm("Möchtest du das aktuelle Kapitel neu starten?")) {
          if (this.game) this.game.loadChapter(this.game.chapterIndex);
        }
      });
    }

    // Theme selector
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.target.value);
        localStorage.setItem('bejacastle_theme', e.target.value);
      });

      const savedTheme = localStorage.getItem('bejacastle_theme') || 'spooky-emerald';
      themeSelect.value = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // CRT Scanlines toggle
    const crtToggle = document.getElementById('crtToggle');
    const crtScreen = document.getElementById('crtScreen');
    if (crtToggle && crtScreen) {
      crtToggle.addEventListener('change', (e) => {
        crtScreen.classList.toggle('crt-screen', e.target.checked);
        crtScreen.classList.toggle('crt-curve', e.target.checked);
      });
    }

    // Setup Soundboard Play Buttons
    this.setupSoundboardButtons();

    // Setup Touch D-Pad
    this.setupTouchControls();
  }

  setupSoundboardButtons() {
    const soundMappings = [
      { id: 'sb_wind', action: () => window.castleAudio.startAmbient() },
      { id: 'sb_thunder', action: () => window.castleAudio.playThunder() },
      { id: 'sb_door_wood', action: () => window.castleAudio.playDoorCreak(false) },
      { id: 'sb_door_iron', action: () => window.castleAudio.playDoorCreak(true) },
      { id: 'sb_heartbeat', action: () => window.castleAudio.playHeartbeat(1.4) },
      { id: 'sb_ghost', action: () => window.castleAudio.playGhostMoan() },
      { id: 'sb_wolf', action: () => window.castleAudio.playWolfHowl() },
      { id: 'sb_raven', action: () => window.castleAudio.playRavenCaw() },
      { id: 'sb_stinger', action: () => window.castleAudio.playHorrorStinger() },
      { id: 'sb_clock', action: () => window.castleAudio.playClockBell() },
      { id: 'sb_musicbox', action: () => window.castleAudio.playMusicBox() },
      { id: 'sb_item', action: () => window.castleAudio.playItemFound() }
    ];

    soundMappings.forEach(item => {
      const btn = document.getElementById(item.id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (window.castleAudio) item.action();
        });
      }
    });
  }

  setupTouchControls() {
    const bindBtn = (id, key) => {
      const el = document.getElementById(id);
      if (!el || !this.game) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.keys[key] = true;
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.game.keys[key] = false;
      });
      el.addEventListener('mousedown', () => { this.game.keys[key] = true; });
      el.addEventListener('mouseup', () => { this.game.keys[key] = false; });
    };

    bindBtn('touchUp', 'up');
    bindBtn('touchDown', 'down');
    bindBtn('touchLeft', 'left');
    bindBtn('touchRight', 'right');

    const actionTouch = document.getElementById('touchAction');
    if (actionTouch) {
      actionTouch.addEventListener('click', () => {
        if (this.game) this.game.handleActionKey();
      });
    }
  }

  updateChapterInfo(chapter) {
    const chNum = document.getElementById('hudChapterNum');
    const chGoal = document.getElementById('hudGoal');
    if (chNum) chNum.textContent = chapter.name;
    if (chGoal) chGoal.textContent = chapter.goal;
  }

  updateSanity(sanity, isPanic) {
    const sanityVal = document.getElementById('hudSanityVal');
    const heartIcon = document.getElementById('hudHeartIcon');

    if (sanityVal) {
      sanityVal.textContent = Math.round(sanity) + '%';
      sanityVal.className = sanity < 30 ? 'text-red-500 font-retro' : 'text-emerald-400 font-retro';
    }

    if (heartIcon) {
      heartIcon.className = isPanic ? 'heart-pulse-panic' : 'heart-pulse text-red-500';
    }
  }

  updateInventory(items) {
    const slots = document.querySelectorAll('.inventory-slot');
    const itemMap = {
      lantern: { icon: '🏮', name: 'Laterne' },
      gate_gear: { icon: '⚙️', name: 'Zahnrad' },
      castle_key: { icon: '🗝️', name: 'Schlossschlüssel' },
      library_crest: { icon: '🛡️', name: 'Wappen' }
    };

    slots.forEach((slot, index) => {
      const itemId = items[index];
      if (itemId && itemMap[itemId]) {
        slot.textContent = itemMap[itemId].icon;
        slot.title = itemMap[itemId].name;
        slot.classList.add('has-item');
      } else {
        slot.textContent = '';
        slot.title = 'Leer';
        slot.classList.remove('has-item');
      }
    });
  }

  addDiaryEntry(diary) {
    if (!this.discoveredDiaries.find(d => d.id === diary.id)) {
      this.discoveredDiaries.push(diary);
    }
  }

  renderJournalList() {
    const list = document.getElementById('journalContent');
    if (!list) return;

    if (this.discoveredDiaries.length === 0) {
      list.innerHTML = `<div class="text-slate-400 italic text-center py-6">Noch keine Tagebucheinträge gefunden. Durchsuche die Räume des Schlosses!</div>`;
      return;
    }

    list.innerHTML = this.discoveredDiaries.map(d => `
      <div class="border border-emerald-900 bg-black/40 p-3 rounded mb-3">
        <h3 class="text-emerald-400 font-retro text-xs mb-1">${d.title}</h3>
        <p class="text-slate-200 text-xs font-pixel leading-relaxed">${d.text}</p>
      </div>
    `).join('');
  }

  async fetchAndDisplayHighscores() {
    const list = document.getElementById('highscoreList');
    if (!list) return;

    list.innerHTML = `<div class="text-center py-4 text-emerald-400">Lade Bestenliste...</div>`;

    try {
      const res = await fetch('/api/scores');
      const scores = await res.json();

      list.innerHTML = scores.map((s, idx) => `
        <div class="flex justify-between items-center py-1.5 border-b border-emerald-950 font-pixel text-xs">
          <div class="flex items-center gap-2">
            <span class="text-emerald-500 font-retro text-[10px]">#${idx + 1}</span>
            <span class="text-slate-200 font-bold">${s.name}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-yellow-400 font-retro text-[10px]">${s.ending}</span>
            <span class="text-cyan-400">${Math.floor(s.timeSec / 60)}m ${s.timeSec % 60}s</span>
          </div>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = `<div class="text-red-400 text-center py-4">Fehler beim Laden der Bestenliste.</div>`;
    }
  }

  showEndingSelection() {
    const modal = document.getElementById('endingModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const optSalvation = document.getElementById('endingBtnSalvation');
    const optEscape = document.getElementById('endingBtnEscape');
    const optDarkness = document.getElementById('endingBtnDarkness');

    const handleChoice = (endingKey) => {
      modal.classList.add('hidden');
      this.showEndingResult(endingKey);
    };

    if (optSalvation) optSalvation.onclick = () => handleChoice('salvation');
    if (optEscape) optEscape.onclick = () => handleChoice('escape');
    if (optDarkness) optDarkness.onclick = () => handleChoice('darkness');
  }

  showEndingResult(endingKey) {
    const ending = CASTLE_STORY.endings[endingKey];
    const victoryModal = document.getElementById('victoryModal');
    if (!victoryModal || !ending) return;

    const titleEl = document.getElementById('victoryTitle');
    const textEl = document.getElementById('victoryText');
    const badgeEl = document.getElementById('victoryBadge');
    const timeEl = document.getElementById('victoryTime');

    if (titleEl) titleEl.textContent = ending.title;
    if (textEl) textEl.textContent = ending.text;
    if (badgeEl) badgeEl.textContent = ending.badge;

    const totalSec = Math.round(this.game ? this.game.gameTimeSec : 180);
    if (timeEl) timeEl.textContent = `${Math.floor(totalSec / 60)} Minuten, ${totalSec % 60} Sekunden`;

    victoryModal.classList.remove('hidden');

    const submitBtn = document.getElementById('submitScoreBtn');
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const nameInput = document.getElementById('playerNameInput');
        const name = nameInput ? nameInput.value.trim() : 'RECKEN_BEJA';

        try {
          await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name || 'ABENTEUERER',
              timeSec: totalSec,
              ending: ending.badge,
              sanity: Math.round(this.game ? this.game.player.sanity : 80),
              date: new Date().toISOString().split('T')[0]
            })
          });
        } catch (e) {}

        victoryModal.classList.add('hidden');
        if (this.game) this.game.loadChapter(0);
      };
    }
  }
}

window.castleUI = new CastleUI();
