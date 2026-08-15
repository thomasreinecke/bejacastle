/**
 * Bejacastle - UI Manager & Gothic Menu System
 * Handles Title Screen, Multi-Slot Save/Load Manager, Journal, Soundboard & Settings.
 */

class CastleUI {
  constructor(game) {
    this.game = game;
    this.latestSave = null;

    this.cacheElements();
    this.bindEvents();
    this.fetchSavesList();
  }

  cacheElements() {
    this.titleScreen = document.getElementById('titleScreenOverlay');
    this.btnResume = document.getElementById('btnResumeGame');
    this.btnNewGame = document.getElementById('btnNewGame');
    this.btnOpenSaves = document.getElementById('btnOpenSaves');
    this.btnTitleSound = document.getElementById('btnTitleSound');

    this.saveModal = document.getElementById('saveManagerModal');
    this.saveSlotsContainer = document.getElementById('saveSlotsContainer');
    this.btnSaveCurrent = document.getElementById('btnSaveCurrent');
    this.btnCloseSaves = document.getElementById('btnCloseSaves');

    this.soundModal = document.getElementById('soundTestModal');
    this.journalModal = document.getElementById('journalModal');
    this.settingsModal = document.getElementById('settingsModal');
    this.endingModal = document.getElementById('endingChoiceModal');
    this.epilogueModal = document.getElementById('epilogueModal');

    this.toastNotification = document.getElementById('toastNotification');
    this.chapterBanner = document.getElementById('chapterBannerText');
    this.inventoryContainer = document.getElementById('inventorySlotsContainer');
    this.sanityBar = document.getElementById('sanityFillBar');
    this.sanityValueText = document.getElementById('sanityValueText');
    this.sanityHeart = document.getElementById('sanityHeartIcon');
  }

  bindEvents() {
    // Title Screen buttons
    if (this.btnResume) {
      this.btnResume.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        const slot = localStorage.getItem('bejacastle_latest_slot') || 'auto';
        this.game.loadGame(slot);
      });
    }

    if (this.btnNewGame) {
      this.btnNewGame.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.game.startNewGame();
      });
    }

    if (this.btnOpenSaves) {
      this.btnOpenSaves.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.openSaveManager();
      });
    }

    if (this.btnTitleSound) {
      this.btnTitleSound.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.openSoundboard();
      });
    }

    // In-game top bar buttons
    const btnHudSave = document.getElementById('hudSaveBtn');
    if (btnHudSave) {
      btnHudSave.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.openSaveManager();
      });
    }

    const btnHudJournal = document.getElementById('hudJournalBtn');
    if (btnHudJournal) {
      btnHudJournal.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.toggleJournal();
      });
    }

    const btnHudSound = document.getElementById('hudSoundBtn');
    if (btnHudSound) {
      btnHudSound.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.openSoundboard();
      });
    }

    const btnHudSettings = document.getElementById('hudSettingsBtn');
    if (btnHudSettings) {
      btnHudSettings.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        this.openSettings();
      });
    }

    const btnHudFullscreen = document.getElementById('hudFullscreenBtn');
    if (btnHudFullscreen) {
      btnHudFullscreen.addEventListener('click', () => {
        if (window.castleAudio) window.castleAudio.playClick();
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      });

      document.addEventListener('fullscreenchange', () => {
        btnHudFullscreen.textContent = document.fullscreenElement ? '✕ FENSTER' : '⛶ VOLLBILD';
      });
    }

    // Modal close buttons
    if (this.btnCloseSaves) {
      this.btnCloseSaves.addEventListener('click', () => {
        this.saveModal.classList.add('hidden');
      });
    }

    const btnCloseSound = document.getElementById('btnCloseSoundModal');
    if (btnCloseSound) {
      btnCloseSound.addEventListener('click', () => {
        this.soundModal.classList.add('hidden');
      });
    }

    const btnCloseJournal = document.getElementById('btnCloseJournalModal');
    if (btnCloseJournal) {
      btnCloseJournal.addEventListener('click', () => {
        this.journalModal.classList.add('hidden');
      });
    }

    const btnCloseSettings = document.getElementById('btnCloseSettingsModal');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        this.settingsModal.classList.add('hidden');
      });
    }

    // Soundboard trigger buttons
    document.querySelectorAll('[data-sound-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const soundType = e.currentTarget.getAttribute('data-sound-trigger');
        if (window.castleAudio) {
          if (soundType === 'wind') window.castleAudio.playWindGust();
          if (soundType === 'thunder') {
            if (this.game && this.game.triggerLightningStorm) {
              this.game.triggerLightningStorm();
            } else if (window.castleAudio) {
              window.castleAudio.playThunder();
            }
          }
          if (soundType === 'door_wood') window.castleAudio.playDoorCreak(false);
          if (soundType === 'door_iron') window.castleAudio.playDoorCreak(true);
          if (soundType === 'foot_forest') window.castleAudio.playFootstepForest();
          if (soundType === 'foot_stone') window.castleAudio.playFootstepStone();
          if (soundType === 'ghost') window.castleAudio.playGhostMoan();
          if (soundType === 'whisper') window.castleAudio.playWhisper();
          if (soundType === 'wolf') window.castleAudio.playWolfHowl();
          if (soundType === 'raven') window.castleAudio.playRavenCaw();
          if (soundType === 'jumpscare') window.castleAudio.playHorrorStinger();
          if (soundType === 'heartbeat') window.castleAudio.playHeartbeat(1.4);
          if (soundType === 'clock') window.castleAudio.playClockBell();
          if (soundType === 'musicbox') window.castleAudio.playMusicBox();
        }
      });
    });

    // Ending selections
    document.querySelectorAll('[data-ending-choice]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const choice = e.currentTarget.getAttribute('data-ending-choice');
        this.handleEndingSelection(choice);
      });
    });

    const btnRestartEpilogue = document.getElementById('btnRestartGameEpilogue');
    if (btnRestartEpilogue) {
      btnRestartEpilogue.addEventListener('click', () => {
        this.epilogueModal.classList.add('hidden');
        this.game.startNewGame();
      });
    }
  }

  enableResumeButton(saveData) {
    this.latestSave = saveData;
    if (this.btnResume) {
      this.btnResume.disabled = false;
      this.btnResume.classList.remove('opacity-40', 'cursor-not-allowed');
      this.btnResume.classList.add('btn-primary');
      const timeStr = saveData.timestamp || 'Vor kurzem';
      const chStr = saveData.chapterName || 'Kapitel I';
      this.btnResume.innerHTML = `<span>▶ WEITERSPIELEN</span> <span class="text-xs font-normal opacity-80 block text-gold">(${chStr} • ${timeStr})</span>`;
    }
  }

  showNotification(msg) {
    if (!this.toastNotification) return;
    this.toastNotification.textContent = msg;
    this.toastNotification.classList.remove('opacity-0', 'pointer-events-none');
    this.toastNotification.classList.add('opacity-100');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastNotification.classList.remove('opacity-100');
      this.toastNotification.classList.add('opacity-0', 'pointer-events-none');
    }, 2800);
  }

  hideAllModals() {
    if (this.titleScreen) this.titleScreen.classList.add('hidden');
    if (this.saveModal) this.saveModal.classList.add('hidden');
    if (this.soundModal) this.soundModal.classList.add('hidden');
    if (this.journalModal) this.journalModal.classList.add('hidden');
    if (this.settingsModal) this.settingsModal.classList.add('hidden');
    if (this.endingModal) this.endingModal.classList.add('hidden');
    if (this.epilogueModal) this.epilogueModal.classList.add('hidden');
  }

  updateChapterInfo(chapter) {
    if (this.chapterBanner && chapter) {
      const sub = chapter.subtitle || chapter.location || chapter.goal || '';
      this.chapterBanner.textContent = sub ? `${chapter.name} — ${sub}` : (chapter.name || 'Schloss Beja');
    }
  }

  updateSanity(sanity, isPanic = false) {
    if (this.sanityBar) {
      const pct = Math.max(0, Math.min(100, sanity));
      this.sanityBar.style.width = `${pct}%`;
      if (pct > 60) {
        this.sanityBar.style.backgroundColor = '#10b981';
      } else if (pct > 30) {
        this.sanityBar.style.backgroundColor = '#f59e0b';
      } else {
        this.sanityBar.style.backgroundColor = '#dc2626';
      }
    }

    if (this.sanityValueText) {
      this.sanityValueText.textContent = `${Math.round(sanity)}%`;
    }

    if (this.sanityHeart) {
      if (isPanic) {
        this.sanityHeart.className = 'heart-pulse-panic';
      } else {
        this.sanityHeart.className = 'heart-pulse';
      }
    }
  }

  updateInventory(items) {
    if (!this.inventoryContainer) return;
    this.inventoryContainer.innerHTML = '';

    const iconMap = {
      lantern: '🏮',
      castle_key: '🗝️',
      gate_gear: '⚙️',
      library_crest: '🛡️'
    };

    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      const itemKey = items[i];

      if (itemKey) {
        slot.className = 'inventory-slot has-item';
        slot.textContent = iconMap[itemKey] || '📦';
        slot.title = itemKey;
      } else {
        slot.className = 'inventory-slot';
        slot.textContent = '';
      }
      this.inventoryContainer.appendChild(slot);
    }
  }

  addDiaryEntry(diary) {
    const list = document.getElementById('journalEntriesList');
    if (!list) return;

    const entryDiv = document.createElement('div');
    entryDiv.className = 'p-3 bg-slate-900/80 border border-amber-900/40 rounded';
    entryDiv.innerHTML = `
      <div class="text-amber-400 font-serif font-bold text-sm mb-1">${diary.title}</div>
      <div class="text-slate-300 text-xs leading-relaxed italic">"${diary.text}"</div>
    `;
    list.appendChild(entryDiv);
  }

  // ==========================================
  // SAVE / LOAD MANAGER MODAL
  // ==========================================

  async fetchSavesList() {
    try {
      const res = await fetch('/api/saves');
      if (res.ok) {
        const saves = await res.json();
        if (saves && saves.length > 0) {
          this.enableResumeButton(saves[0]);
        }
      }
    } catch (e) {
      const autoSave = localStorage.getItem('bejacastle_save_auto');
      if (autoSave) this.enableResumeButton(JSON.parse(autoSave));
    }
  }

  async openSaveManager() {
    this.saveModal.classList.remove('hidden');
    this.renderSaveSlots();
  }

  async renderSaveSlots() {
    this.saveSlotsContainer.innerHTML = '<div class="text-center py-6 text-slate-400">Lade Spielstände...</div>';

    let serverSaves = [];
    try {
      const res = await fetch('/api/saves');
      if (res.ok) serverSaves = await res.json();
    } catch (e) {}

    const slotIds = ['auto', 'slot_1', 'slot_2', 'slot_3'];
    const slotTitles = {
      auto: 'Automatische Sicherung (Auto-Save)',
      slot_1: 'Speicherplatz 1',
      slot_2: 'Speicherplatz 2',
      slot_3: 'Speicherplatz 3'
    };

    this.saveSlotsContainer.innerHTML = '';

    slotIds.forEach(slotId => {
      // Find server save or local backup
      let save = serverSaves.find(s => s.slot === slotId);
      if (!save) {
        const local = localStorage.getItem(`bejacastle_save_${slotId}`);
        if (local) save = JSON.parse(local);
      }

      const card = document.createElement('div');
      card.className = 'save-slot-card flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3';

      if (save) {
        card.innerHTML = `
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-amber-400 font-serif font-bold text-sm">${slotTitles[slotId]}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">${save.chapterName || 'Kapitel I'}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex flex-wrap gap-4">
              <span>📅 ${save.timestamp || 'Unbekannt'}</span>
              <span>⏳ Spielzeit: ${Math.floor((save.gameTimeSec || 0) / 60)}m ${(save.gameTimeSec || 0) % 60}s</span>
              <span>🧠 Verstand: ${save.sanity || 100}%</span>
            </div>
          </div>
          <div class="flex items-center gap-2 self-end md:self-center">
            <button class="gothic-btn btn-primary text-xs" data-load-slot="${slotId}">📂 LADEN</button>
            <button class="gothic-btn text-xs" data-save-slot="${slotId}">💾 ÜBERSCHREIBEN</button>
            ${slotId !== 'auto' ? `<button class="gothic-btn btn-danger text-xs" data-delete-slot="${slotId}">🗑️</button>` : ''}
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="flex-1">
            <span class="text-slate-400 font-serif text-sm">${slotTitles[slotId]}</span>
            <div class="text-xs text-slate-500 mt-0.5">Leer (Kein Spielstand gespeichert)</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="gothic-btn btn-primary text-xs" data-save-slot="${slotId}">💾 HIER SPEICHERN</button>
          </div>
        `;
      }

      this.saveSlotsContainer.appendChild(card);
    });

    // Bind action buttons inside save manager
    this.saveSlotsContainer.querySelectorAll('[data-load-slot]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = e.currentTarget.getAttribute('data-load-slot');
        this.game.loadGame(slot);
      });
    });

    this.saveSlotsContainer.querySelectorAll('[data-save-slot]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const slot = e.currentTarget.getAttribute('data-save-slot');
        await this.game.saveGame(slot, slotTitles[slot]);
        this.renderSaveSlots();
      });
    });

    this.saveSlotsContainer.querySelectorAll('[data-delete-slot]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const slot = e.currentTarget.getAttribute('data-delete-slot');
        if (confirm(`Spielstand in "${slotTitles[slot]}" wirklich löschen?`)) {
          try {
            await fetch(`/api/save/${slot}`, { method: 'DELETE' });
          } catch (e) {}
          localStorage.removeItem(`bejacastle_save_${slot}`);
          this.renderSaveSlots();
        }
      });
    });
  }

  openSoundboard() {
    this.soundModal.classList.remove('hidden');
  }

  toggleJournal() {
    const isOpening = this.journalModal.classList.contains('hidden');
    this.journalModal.classList.toggle('hidden');
    if (isOpening && window.castleAudio) {
      window.castleAudio.playBookOpen();
    }
  }

  openSettings() {
    this.settingsModal.classList.remove('hidden');
  }

  showEndingSelection() {
    this.endingModal.classList.remove('hidden');
  }

  handleEndingSelection(choice) {
    this.endingModal.classList.add('hidden');
    let endingData = CASTLE_STORY.endings[choice];
    if (!endingData) {
      if (choice === 'sacrifice') endingData = CASTLE_STORY.endings['salvation'];
      else if (choice === 'shadow_lord') endingData = CASTLE_STORY.endings['darkness'];
      else endingData = CASTLE_STORY.endings['salvation'] || CASTLE_STORY.endings['escape'];
    }
    if (!endingData) return;

    if (window.castleAudio) {
      if (choice === 'salvation' || choice === 'sacrifice') {
        window.castleAudio.playClockBell();
      } else if (choice === 'darkness' || choice === 'shadow_lord') {
        window.castleAudio.playGhostMoan();
        window.castleAudio.playHorrorStinger();
      } else {
        window.castleAudio.playWindGust();
      }
    }

    const epilogueTitle = document.getElementById('epilogueTitle');
    const epilogueText = document.getElementById('epilogueText');
    const epilogueStats = document.getElementById('epilogueStats');

    if (epilogueTitle) epilogueTitle.textContent = endingData.title;
    if (epilogueText) epilogueText.textContent = endingData.text;
    if (epilogueStats) {
      const minutes = Math.floor((this.game.gameTimeSec || 0) / 60);
      const seconds = Math.round((this.game.gameTimeSec || 0) % 60);
      epilogueStats.innerHTML = `
        <div>⏳ Überlebenszeit: <b>${minutes}m ${seconds}s</b></div>
        <div>🧠 Verbleibender Verstand: <b>${Math.round(this.game.player.sanity)}%</b></div>
        <div>🎖️ Abzeichen: <b>${endingData.badge || 'Wanderer'}</b></div>
      `;
    }

    // Submit score to server
    try {
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "WANDERER",
          timeSec: Math.round(this.game.gameTimeSec || 0),
          ending: endingData.title,
          sanity: Math.round(this.game.player.sanity),
          date: new Date().toISOString().split('T')[0]
        })
      });
    } catch (e) {}

    this.epilogueModal.classList.remove('hidden');
  }
}

window.CastleUI = CastleUI;
