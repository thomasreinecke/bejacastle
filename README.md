# 🏰 BEJACASTLE — 2.5D Realistisches Gothic-Horror-Abenteuer

**BEJACASTLE** ist ein story-getriebenes 2.5D-Horror-Erkundungsspiel in einer realistischen, leicht gekippten Schrägansicht (Tilted Overhead View) mit natürlichen Farben, dynamischem Tiefen-Rendering (Y-Sorting), volumetrischer Beleuchtung, prozeduraler Web-Audio-Soundkulisse und einem **vollwertigen lokalen JSON-Speichersystem**.

---

## ✨ Features

- 🌲 **Realistische 2.5D-Schrägansicht (Tilted Overhead View)**:
  - Tiefensortierung (Y-Sorting): Der Wanderer läuft dynamisch vor und hinter Bäumen, gotischen Steinsäulen, Mauern und Kaminen.
  - Natürliche, stimmungsvolle Farbpalette: Moosbedeckter Waldboden, rissige Baumrinden, nasser Kopfsteinpflaster-Glanz, edle Holzdielen und verwitterte gotische Sandsteinmauern.
  - Dreidimensionale Props: Detailreiche Nadelbäume mit Astwerk, gotische Torbögen, lodernde Kamine, verzierte Bücherregale und Marmorsarkophage.
- 💾 **Lokales JSON-Speicher- & Ladesystem**:
  - Speicherung aller Zwischenstände in strukturierten JSON-Dateien auf dem Server (`data/saves/`) inklusive automatischer `localStorage`-Synchronisation.
  - Startbildschirm mit **▶ WEITERSPIELEN** (sofortige Fortsetzung des letzten Stands), **⭐ NEUES SPIEL** und **📂 SPIELSTÄNDE VERWALTEN**.
  - Multi-Slot-Manager (Auto-Save, Slot 1, Slot 2, Slot 3) mit Details zu Datum, Spielzeit, Kapitel, Inventar und Verstand.
  - Schnellspeichern jederzeit per Button `💾 SPEICHERN` oder Taste `F5`.
- 📖 **Atmosphärische Story-Kampagne (5 Kapitel)**:
  - **Kapitel I: Der Verfluchte Wald** – Suche nach der Öllaterne und Lösen der uralten Runenstein-Rätsel zwischen düsteren Nadelbäumen.
  - **Kapitel II: Das Eiserne Schlosstor** – Ankunft an der Veste Beja, Donnerhall, Finden des Zahnrads im Mausoleum und Entriegeln des Tors.
  - **Kapitel III: Die Verlassene Eingangshalle** – Knisternder Kamin, geheimnisvolle Porträts mit wandernden Blicken, Standuhr und Tagebuch des Grafen Beja.
  - **Kapitel IV: Die Bibliothek & Katakomben** – Uralte Bücherregale, Ruhestätten der Ahnen und schleichende weiße Geistererscheinungen.
  - **Kapitel V: Der Schattenturm & Das Finale** – Lösen des Altar-Rätsels auf den Zinnen des Schlosses mit **3 multiplen Enden** (*Erlösung*, *Panische Flucht*, *Neuer Schattenherr*).
- 🔊 **Web Audio API Horror-Sound-Synthesizer**:
  - Heulender Nachtwind & stürmische Böen
  - Donnerschläge mit Sub-Bass-Grollen & Blitzflackern
  - Knarrende schwere Holztüren & rostige eiserne Tore
  - Beschleunigender Herzschlag bei sinkendem Verstand oder Geisternähe
  - Spektrales Geisterflüstern & Wimmern
  - Entferntes Wolfsgeheul & unheilvolle Krähenrufe
  - Jumpscare / Horror-Stinger-Akkorde
  - Mitternächtliches Turmuhren-Schlagen & Spuk-Spieldosen
  - 🎮 **Integrierter Soundboard-Sound-Test** im Hauptmenü zum sofortigen Anhören aller Sounds!
- 🕯️ **Volumetrisches Licht- & Schattensystem**:
  - Realistischer Laternenkegel mit Flackereffekt, lodernde Kamine und leuchtende Kristalle.
  - Plötzliche Blitzschläge, die Wald und Schloss silhouettenhaft erleuchten.
  - Dichter, wabernder Bodennebel und schwebende Staubpartikel.

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

| Aktion | Tastatur |
| :--- | :--- |
| **Bewegen** | `W`, `A`, `S`, `D` oder Pfeiltasten `↑`, `←`, `↓`, `→` |
| **Aktion / Interaktion** | `E` oder `LEERTASTE` / Klick |
| **Sprinten** | `Shift` (Umschalttaste) |
| **Schnellspeichern** | `F5` oder `💾 SPEICHERN`-Button |
| **Tagebuch & Lore** | `J` oder `📖 TAGEBUCH`-Button |
| **Sound An / Aus** | `M` oder `🔊 SOUND`-Button |

---

## 🛠️ Technische Struktur

- **Backend**: Python 3 (FastAPI & Uvicorn mit integriertem Fallback auf Python `http.server`)
- **Frontend**: HTML5 Canvas, Tailwind CSS, Web Audio API
- **Dateien**:
  - `server.py` – Webserver & REST-API für lokale JSON-Spielstände und Bestenliste
  - `Makefile` – Start- und Build-Targets
  - `static/index.html` – Hauptseite im Gothic-Design mit 2.5D Viewport, Startmenü & Soundboard
  - `static/css/style.css` – 2.5D Gothic Styles, Schiefer- & Gold-Akzente, Nebel- und Lichteffekte
  - `static/js/audio.js` – Prozeduraler Horror-Synthesizer für alle Grusel-Soundeffekte
  - `static/js/story.js` – Kapitel, Dialoge, Tagebuchfragmente & Lore
  - `static/js/game.js` – 2.5D Tiefen-Engine (Y-Sorting), volumetrisches Licht, Entitäten, JSON-Save-System
  - `static/js/ui.js` – Startbildschirm, Multi-Slot-JSON-Speichermanager, Soundboard & Tagebuch
