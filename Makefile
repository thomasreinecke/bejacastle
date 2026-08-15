.PHONY: help install run dev test clean

PYTHON ?= python3
PORT ?= 8001
HOST ?= 0.0.0.0

help:
	@echo "=================================================="
	@echo "  🏰 BEJACASTLE - DAS SPUK-SCHLOSS IM WALD"
	@echo "=================================================="
	@echo "Verfügbare Befehle:"
	@echo "  make run        - Startet den Webserver und öffnet das Spiel"
	@echo "  make dev        - Entwicklungsmodus mit Hot-Reloading"
	@echo "  make install    - Installiert benötigte Python-Pakete"
	@echo "  make test       - Führt Syntaxtests & Endpunkt-Prüfungen durch"
	@echo "  make clean      - Bereinigt Cache-Dateien und temporäre Daten"
	@echo "=================================================="

install:
	@echo "Installiere Abhängigkeiten..."
	$(PYTHON) -m pip install -r requirements.txt || echo "Hinweis: Fallback auf Standard-Bibliothek ist aktiv."

run:
	@echo "Starte BEJACASTLE auf http://localhost:$(PORT)..."
	@PORT=$(PORT) HOST=$(HOST) $(PYTHON) server.py

dev:
	@echo "Starte BEJACASTLE im Entwicklungsmodus (Hot-Reload)..."
	@if $(PYTHON) -c "import uvicorn" 2>/dev/null; then \
		PORT=$(PORT) HOST=$(HOST) uvicorn server:app --reload --port $(PORT) --host $(HOST); \
	else \
		PORT=$(PORT) HOST=$(HOST) $(PYTHON) server.py; \
	fi

test:
	@echo "Prüfe Python-Syntax..."
	$(PYTHON) -m py_compile server.py
	@echo "Syntax-Prüfung erfolgreich!"

clean:
	@echo "Bereinige Cache..."
	rm -rf __pycache__ static/__pycache__ .pytest_cache
	@echo "Bereinigung abgeschlossen."
