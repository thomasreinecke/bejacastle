# 🏰 BEJACASTLE - Das Spuk-Schloss im Wald

**BEJACASTLE** ist ein story-getriebenes Retro-Horror-Erkundungsspiel im authentischen **BEJAPONG**-Artstyle. Ausgestattet mit einem umfangreichen proceduralen Web-Audio-Synthesizer für Gruselsounds, dynamischer 2D-Licht-/Schatten-Engine, CRT-Monitor-Shader, Partikeleffekten und einer mehrteiligen Gruselgeschichte.

---

## ✨ Features

- 🌲 **Atmosphärische Story-Kampagne**:
  - **Kapitel I: Der Verfluchte Wald** – Verirrt in der ewigen Mitternacht, Suche nach der Öllaterne und uralten Runensteinen zwischen knorrigen Bäumen und nebligen Pfaden.
  - **Kapitel II: Das Eiserne Schlosstor** – Ankunft an der Veste Beja, Donnerhall, Finden des Zahnrads im Mausoleum und Entriegeln des Tors.
  - **Kapitel III: Die Verlassene Eingangshalle** – Knisternder Kamin, geheimnisvolle Porträts mit wandernden Blicken, Standuhr und Tagebuch des Grafen Beja.
  - **Kapitel IV: Die Bibliothek & Katakomben** – Uralte Bücherregale, Ruhestätten der Ahnen und schleichende weiße Geistererscheinungen.
  - **Kapitel V: Der Schattenturm & Das Finale** – Lösen des Altar-Rätsels auf den Zinnen des Schlosses mit **3 multiplen Enden** (*Erlösung*, *Panische Flucht*, *Neuer Schattenherr*).
- 🔊 **Riesige Auswahl gruseliger Soundeffekte (Web Audio API Synthesizer)**:
  - Heulender Nachtwind & stürmische Böen
  - Donnerschläge mit Sub-Bass-Grollen & Blitzflackern
  - Knarrende schwere Holztüren & rostige eiserne Tore
  - Beschleunigender Herzschlag bei sinkendem Verstand oder Geisternähe
  - Spektrales Geisterflüstern & Wimmern
  - Entferntes Wolfsgeheul & unheilvolle Krähenrufe
  - Jumpscare / Horror-Stinger-Akkorde
  - Mitternächtliches Turmuhren-Schlagen & Spuk-Spieldosen
  - 🎮 **Integrierter Soundboard-Sound-Test** im Hauptmenü zum sofortigen Anhören aller Sounds!
- 🕯️ **Dynamisches 2D-Licht & Schatten**:
  - Laternenkegel mit Flackereffekt, Fackeln und Feuerschalen.
  - Plötzliche Blitzschläge, die Wald und Schloss silhouettenhaft erleuchten.
  - Dichter Nebel und schwebende Staubpartikel.
- 📺 **CRT-Monitor-Optik**:
  - Scanlines, Bildschirmwölbung (`crt-curve`), Phosphor-Leuchten und Screen-Shake.
  - 5 umschaltbare Farbthemen: *Spukwald Emerald*, *Blutmond Crimson*, *Katakomben Violett*, *Kerzenschein Amber* und *Geister-Monochrom (1970s)*.
- 🏆 **Bestenliste & Chronik**:
  - Persistente Speicherung der Überlebenszeiten und freigespielten Enden über das Python-Backend.

---

## 🚀 Schnelleinstieg & Makefile

Das Spiel kann direkt über das mitgelieferte `Makefile` gestartet werden:

```bash
# Spiel starten (öffnet http://localhost:8001)
make run

# Optional: Abhängigkeiten installieren (FastAPI, Uvicorn)
make install

# Entwicklungsmodus mit Hot-Reload
make dev

# Syntax- und Servertests
make test
```

---

## ⌨️ Steuerung

| Aktion | Tastatur | Touch / Mobile |
| :--- | :--- | :--- |
| **Bewegen** | `W`, `A`, `S`, `D` oder Pfeiltasten `↑`, `←`, `↓`, `→` | On-Screen Steuerkreuz (D-Pad) |
| **Aktion / Interaktion** | `E` oder `LEERTASTE` | Aktion-Button `[E]` / Klick |
| **Tagebuch & Lore** | `J` | `📜 TAGEBUCH`-Button |
| **Sound An / Aus** | `M` | `🔊 SOUND`-Button |
| **Sprinten** | `Shift` (Umschalttaste) | - |

---

## 🛠️ Technische Struktur

- **Backend**: Python 3 (FastAPI & Uvicorn mit integriertem Fallback auf Python `http.server`)
- **Frontend**: HTML5 Canvas, Tailwind CSS, Web Audio API
- **Dateien**:
  - `server.py` – Webserver & REST-API für Spielstände und Bestenliste
  - `Makefile` – Start- und Build-Targets
  - `static/index.html` – Hauptseite im Retro-Arcade-Design mit CRT-Frame & Soundboard-Modal
  - `static/css/style.css` – CRT-Shader, Scanlines, Gothic Themes & Licht-Effekte
  - `static/js/audio.js` – Proceduraler Horror-Synthesizer für alle Grusel-Soundeffekte
  - `static/js/story.js` – Kapitel, Dialoge, Tagebuchfragmente & Lore
  - `static/js/game.js` – 2D-Lichtsystem, Partikel, Entitäten, Kollision & Level
  - `static/js/ui.js` – Soundboard, Tagebuch, Modals, Touch-Steuerung & Bestenliste
